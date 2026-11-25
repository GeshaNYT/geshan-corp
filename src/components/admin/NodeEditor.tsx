import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  FileUp,
  Folder,
  ImagePlus,
  Link2,
  Loader2,
  Package,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ICONS, NodeIcon } from "@/components/NodeIcon";
import { useParentOptions } from "@/components/admin/MoveDialog";
import { formatSize, slugify, useRefreshSite, useSite } from "@/lib/data";
import { repo } from "@/lib/repo";
import {
  LINK_KIND_LABELS,
  guessLinkKind,
  PLATFORM_PRESETS,
  STATUS_HINTS,
  STATUS_LABELS,
  type LinkKind,
  type NodeFile,
  type NodeInput,
  type NodeKind,
  type NodeLink,
  type NodeStatus,
  type SiteNode,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface PendingFile {
  tmp: string;
  file: File;
  label: string;
  version: string;
  platform: string;
}

const rid = () => Math.random().toString(36).slice(2, 10);

function emptyDraft(kind: NodeKind, parent: string | null, sort: number): NodeInput {
  return {
    parent_id: parent,
    kind,
    slug: "",
    title: "",
    tagline: "",
    description: "",
    icon: kind === "section" ? "Folder" : "Package",
    cover_url: "",
    status: "released",
    platforms: [],
    links: [],
    gallery: [],
    featured: false,
    hidden: false,
    sort,
  };
}

export function NodeEditor({
  node,
  initialKind,
  initialParent,
  onClose,
}: {
  node?: SiteNode;
  initialKind: NodeKind;
  initialParent: string | null;
  onClose: () => void;
}) {
  const site = useSite();
  const refresh = useRefreshSite();
  const parents = useParentOptions(node);
  const isNew = !node;

  const [d, setD] = useState<NodeInput>(() =>
    node
      ? structuredClone(node)
      : emptyDraft(
          initialKind,
          initialParent,
          site.childrenOf(initialParent, { includeHidden: true }).length,
        ),
  );
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [files, setFiles] = useState<NodeFile[]>(() =>
    node ? structuredClone(site.filesOf(node.id)) : [],
  );
  const [removedFiles, setRemovedFiles] = useState<NodeFile[]>([]);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [customPlatform, setCustomPlatform] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof NodeInput>(k: K, v: NodeInput[K]) => setD((p) => ({ ...p, [k]: v }));
  const isProject = d.kind === "project";
  const parentTitle = d.parent_id ? site.byId.get(d.parent_id)?.title : null;

  /* ── ссылки ── */
  const addLink = (kind: LinkKind = "download") =>
    set("links", [...d.links, { id: rid(), kind, label: LINK_KIND_LABELS[kind], url: "" }]);
  const moveLink = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= d.links.length) return;
    const next = [...d.links];
    [next[i], next[j]] = [next[j], next[i]];
    set("links", next);
  };
  const updLink = (id: string, patch: Partial<NodeLink>) =>
    set(
      "links",
      d.links.map((l) => {
        if (l.id !== id) return l;
        const next = { ...l, ...patch };
        // Вставили ссылку — сами подбираем тип кнопки (Telegram, Диск, Discord…), если тип ещё общий
        if (patch.url !== undefined && (l.kind === "other" || l.kind === "site")) {
          const g = guessLinkKind(patch.url);
          if (g) {
            next.kind = g;
            if (!l.label || Object.values(LINK_KIND_LABELS).includes(l.label))
              next.label = LINK_KIND_LABELS[g];
          }
        }
        // При смене типа меняем подпись, если она была стандартной
        if (patch.kind && Object.values(LINK_KIND_LABELS).includes(l.label))
          next.label = LINK_KIND_LABELS[patch.kind];
        return next;
      }),
    );

  /* ── изображения ── */
  const uploadImage = async (file: File, to: "gallery" | "cover") => {
    setUploadingImg(true);
    try {
      const r = await repo.upload(node?.id ?? "drafts", file);
      if (to === "cover") set("cover_url", r.url);
      else setD((p) => ({ ...p, gallery: [...p.gallery, r.url] }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploadingImg(false);
    }
  };

  /* ── сохранение ── */
  const save = async () => {
    const title = d.title.trim();
    const slug = (d.slug.trim() || slugify(title)).toLowerCase();
    if (!title) return toast.error("Введи название");
    if (!slug) return toast.error("Введи адрес страницы (латиницей)");
    if (d.links.some((l) => !l.url.trim()))
      return toast.error("У одной из ссылок не заполнен адрес");
    setSaving(true);
    try {
      const saved = await repo.saveNode({
        ...d,
        title,
        slug,
        links: d.links.map((l) => ({ ...l, url: l.url.trim() })),
      });
      for (const f of removedFiles) await repo.deleteFile(f);
      for (const f of files) {
        const orig = node ? site.filesOf(node.id).find((o) => o.id === f.id) : undefined;
        if (
          orig &&
          (orig.label !== f.label ||
            orig.version !== f.version ||
            orig.platform !== f.platform ||
            orig.sort !== f.sort)
        ) {
          await repo.saveFile({
            id: f.id,
            node_id: f.node_id,
            url: f.url,
            label: f.label,
            version: f.version,
            platform: f.platform,
            sort: f.sort,
          });
        }
      }
      let sort = files.length;
      for (const p of pending) {
        const up = await repo.upload(saved.id, p.file);
        await repo.saveFile({
          node_id: saved.id,
          url: up.url,
          storage_path: up.storage_path,
          size: up.size,
          label: p.label || p.file.name,
          version: p.version,
          platform: p.platform,
          sort: sort++,
        });
      }
      await refresh();
      toast.success(isNew ? (isProject ? "Проект добавлен" : "Раздел добавлен") : "Сохранено");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!node) return;
    const inner = site.descendantsOf(node.id).length;
    if (
      !window.confirm(
        inner ? `Удалить «${node.title}» и всё внутри (${inner})?` : `Удалить «${node.title}»?`,
      )
    )
      return;
    try {
      await repo.deleteNode(node.id);
      await refresh();
      toast.success("Удалено");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Sheet open onOpenChange={(o) => !o && !saving && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-border bg-background p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle className="font-display text-2xl">
            {isNew ? (isProject ? "Новый проект" : "Новый раздел") : `Редактирование`}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            {isNew ? (parentTitle ? `Внутри: ${parentTitle}` : "На верхнем уровне") : d.title}
          </p>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {/* Тип */}
          <Group title="Что это">
            <Segmented
              value={d.kind}
              onChange={(v) => set("kind", v as NodeKind)}
              options={[
                { value: "section", label: "Раздел", icon: <Folder className="h-4 w-4" /> },
                { value: "project", label: "Проект", icon: <Package className="h-4 w-4" /> },
              ]}
            />
            <p className="text-xs text-muted-foreground">
              {isProject
                ? "Проект — конкретная программа, игра, бот, шейдер и т.д."
                : "Раздел — папка, в которую можно класть подразделы и проекты."}
            </p>
          </Group>

          {/* Основное */}
          <Group title="Основное">
            <Input
              label="Название *"
              value={d.title}
              onChange={(v) =>
                setD((p) => ({ ...p, title: v, slug: slugTouched ? p.slug : slugify(v) }))
              }
              placeholder={isProject ? "Например: GeDrop" : "Например: Geshan Lab"}
              autoFocus={isNew}
            />
            <Input
              label="Короткое описание (для карточки)"
              value={d.tagline}
              onChange={(v) => set("tagline", v)}
              placeholder="Одно предложение о главном"
            />
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Полное описание</span>
              <textarea
                value={d.description}
                onChange={(e) => set("description", e.target.value)}
                rows={5}
                placeholder="Подробности. Пустая строка — новый абзац."
                className="w-full rounded-xl border border-border bg-card/50 p-3 text-sm outline-none focus:border-primary"
              />
            </label>
          </Group>

          {/* Статус */}
          {isProject && (
            <Group title="Статус">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(Object.keys(STATUS_LABELS) as NodeStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("status", s)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left text-sm transition",
                      d.status === s
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {STATUS_HINTS[d.status]}. Файлы и ссылки можно добавлять при любом статусе.
              </p>
            </Group>
          )}

          {/* Файлы */}
          {isProject && (
            <Group
              title="Файлы для скачивания"
              hint="Загружаются прямо на сайт, у каждого свой счётчик скачиваний"
            >
              <div className="space-y-2">
                {files.map((f) => (
                  <div key={f.id} className="rounded-xl border border-border bg-card/40 p-3">
                    <div className="flex items-center gap-2">
                      <FileUp className="h-4 w-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                        {formatSize(f.size)} {f.downloads > 0 && `· ${f.downloads} скач.`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFiles((x) => x.filter((y) => y.id !== f.id));
                          setRemovedFiles((x) => [...x, f]);
                        }}
                        className="text-muted-foreground hover:text-red-300"
                        aria-label="Удалить файл"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <FileFields
                      value={f}
                      onChange={(patch) =>
                        setFiles((x) => x.map((y) => (y.id === f.id ? { ...y, ...patch } : y)))
                      }
                      platforms={d.platforms}
                    />
                  </div>
                ))}
                {pending.map((p) => (
                  <div
                    key={p.tmp}
                    className="rounded-xl border border-dashed border-primary/50 bg-primary/5 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1 truncate text-xs">
                        {p.file.name} · {formatSize(p.file.size)}{" "}
                        <span className="text-primary">· загрузится при сохранении</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setPending((x) => x.filter((y) => y.tmp !== p.tmp))}
                        className="text-muted-foreground hover:text-red-300"
                        aria-label="Убрать"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <FileFields
                      value={p}
                      onChange={(patch) =>
                        setPending((x) => x.map((y) => (y.tmp === p.tmp ? { ...y, ...patch } : y)))
                      }
                      platforms={d.platforms}
                    />
                  </div>
                ))}
              </div>
              <input
                ref={fileInput}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const list = Array.from(e.target.files ?? []);
                  setPending((x) => [
                    ...x,
                    ...list.map((file) => ({
                      tmp: rid(),
                      file,
                      label: file.name.replace(/\.[^.]+$/, ""),
                      version: "",
                      platform: guessPlatform(file.name) ?? d.platforms[0] ?? "",
                    })),
                  ]);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                <Upload className="h-4 w-4" /> Выбрать файлы
              </button>
            </Group>
          )}

          {/* Ссылки */}
          <Group
            title="Кнопки и ссылки"
            hint="Сколько угодно. Показываются на странице в этом порядке — стрелками можно поменять"
          >
            <div className="space-y-2">
              {d.links.map((l, li) => (
                <div
                  key={l.id}
                  className="space-y-2 rounded-xl border border-border bg-card/40 p-3"
                >
                  <div className="flex items-center gap-2">
                    <select
                      value={l.kind}
                      onChange={(e) => updLink(l.id, { kind: e.target.value as LinkKind })}
                      className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none"
                    >
                      {(Object.keys(LINK_KIND_LABELS) as LinkKind[]).map((k) => (
                        <option key={k} value={k}>
                          {LINK_KIND_LABELS[k]}
                        </option>
                      ))}
                    </select>
                    <input
                      value={l.label}
                      onChange={(e) => updLink(l.id, { label: e.target.value })}
                      placeholder="Текст кнопки"
                      className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => moveLink(li, -1)}
                      disabled={li === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-25"
                      aria-label="Выше"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveLink(li, 1)}
                      disabled={li === d.links.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-25"
                      aria-label="Ниже"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "links",
                          d.links.filter((x) => x.id !== l.id),
                        )
                      }
                      className="text-muted-foreground hover:text-red-300"
                      aria-label="Удалить ссылку"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    value={l.url}
                    onChange={(e) => updLink(l.id, { url: e.target.value })}
                    placeholder="https://…"
                    inputMode="url"
                    className="h-9 w-full rounded-lg border border-border bg-background px-2 font-mono text-xs outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(LINK_KIND_LABELS) as LinkKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => addLink(k)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
                >
                  <Plus className="h-3 w-3" /> {LINK_KIND_LABELS[k]}
                </button>
              ))}
            </div>
          </Group>

          {/* Платформы */}
          {isProject && (
            <Group title="Платформы">
              <div className="flex flex-wrap gap-2">
                {[...new Set([...PLATFORM_PRESETS, ...d.platforms])].map((p) => {
                  const on = d.platforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        set(
                          "platforms",
                          on ? d.platforms.filter((x) => x !== p) : [...d.platforms, p],
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs transition",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  value={customPlatform}
                  onChange={(e) => setCustomPlatform(e.target.value)}
                  placeholder="Своя платформа"
                  className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-card/50 px-3 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    const v = customPlatform.trim();
                    if (v && !d.platforms.includes(v)) set("platforms", [...d.platforms, v]);
                    setCustomPlatform("");
                  }}
                  className="rounded-lg border border-border px-3 text-sm hover:border-primary"
                >
                  Добавить
                </button>
              </div>
            </Group>
          )}

          {/* Иконка */}
          <Group title="Иконка">
            <div className="grid grid-cols-8 gap-1.5">
              {Object.keys(ICONS).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => set("icon", name)}
                  aria-label={name}
                  className={cn(
                    "grid aspect-square place-items-center rounded-lg border transition",
                    d.icon === name
                      ? "border-primary bg-primary/15"
                      : "border-transparent hover:border-border",
                  )}
                >
                  <NodeIcon name={name} className="h-4 w-4 text-primary" />
                </button>
              ))}
            </div>
          </Group>

          {/* Картинки */}
          <Group title="Обложка и скриншоты">
            <input
              ref={coverInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadImage(f, "cover");
                e.target.value = "";
              }}
            />
            <input
              ref={imgInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                for (const f of Array.from(e.target.files ?? [])) void uploadImage(f, "gallery");
                e.target.value = "";
              }}
            />
            {d.cover_url ? (
              <div className="relative">
                <img
                  src={d.cover_url}
                  alt=""
                  className="aspect-video w-full rounded-xl border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => set("cover_url", "")}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/80"
                  aria-label="Убрать обложку"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => coverInput.current?.click()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <ImagePlus className="h-4 w-4" /> Загрузить обложку
                </button>
                <UrlAdd placeholder="или ссылка на картинку" onAdd={(u) => set("cover_url", u)} />
              </div>
            )}
            {d.gallery.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {d.gallery.map((g) => (
                  <div key={g} className="relative">
                    <img
                      src={g}
                      alt=""
                      className="aspect-video w-full rounded-lg border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "gallery",
                          d.gallery.filter((x) => x !== g),
                        )
                      }
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/80"
                      aria-label="Убрать"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => imgInput.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
              >
                {uploadingImg ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}{" "}
                Скриншоты
              </button>
              <UrlAdd placeholder="или ссылка" onAdd={(u) => set("gallery", [...d.gallery, u])} />
            </div>
          </Group>

          {/* Расположение и видимость */}
          <Group title="Расположение и видимость">
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">
                Находится в разделе
              </span>
              <select
                value={d.parent_id ?? ""}
                onChange={(e) => set("parent_id", e.target.value || null)}
                className="h-11 w-full rounded-xl border border-border bg-card/50 px-3 text-sm outline-none focus:border-primary"
              >
                <option value="">Верхний уровень</option>
                {parents.map((p) => (
                  <option key={p.node.id} value={p.node.id}>
                    {"  ".repeat(p.depth + 1)}
                    {p.node.title}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Адрес страницы"
              value={d.slug}
              onChange={(v) => {
                setSlugTouched(true);
                set("slug", slugify(v) || v.toLowerCase());
              }}
              placeholder="gedrop"
              prefix="/p/"
            />
            <Toggle
              label="Показывать на главной"
              checked={d.featured}
              onChange={(v) => set("featured", v)}
            />
            <Toggle
              label="Скрыть (черновик — видно только админам)"
              checked={d.hidden}
              onChange={(v) => set("hidden", v)}
            />
          </Group>

          {!isNew && (
            <button
              type="button"
              onClick={remove}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 py-3 text-sm text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" /> Удалить {isProject ? "проект" : "раздел"}
            </button>
          )}
        </div>

        <div
          className="flex gap-2 border-t border-border bg-background px-5 py-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-border py-3 text-sm"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || uploadingImg}
            className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving
              ? pending.length
                ? "Загружаем файлы…"
                : "Сохраняем…"
              : isNew
                ? "Добавить"
                : "Сохранить"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function guessPlatform(name: string) {
  const n = name.toLowerCase();
  if (/\.(exe|msi)$/.test(n)) return "Windows";
  if (/\.(apk|aab)$/.test(n)) return "Android";
  if (/\.(dmg|pkg)$/.test(n)) return "macOS";
  if (/\.(appimage|deb|rpm)$/.test(n)) return "Linux";
  if (/\.(mcpack|mcaddon|mcworld)$/.test(n)) return "Minecraft Bedrock";
  if (/\.jar$/.test(n)) return "Minecraft Java";
  return null;
}

function FileFields({
  value,
  onChange,
  platforms,
}: {
  value: { label: string; version: string; platform: string };
  onChange: (p: Partial<{ label: string; version: string; platform: string }>) => void;
  platforms: string[];
}) {
  const opts = [...new Set([...platforms, ...PLATFORM_PRESETS, value.platform].filter(Boolean))];
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      <input
        value={value.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="Название файла"
        className="col-span-2 h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary"
      />
      <input
        value={value.version}
        onChange={(e) => onChange({ version: e.target.value })}
        placeholder="Версия, напр. 1.2"
        className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary"
      />
      <select
        value={value.platform}
        onChange={(e) => onChange({ platform: e.target.value })}
        className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none"
      >
        <option value="">Платформа</option>
        {opts.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  );
}

function UrlAdd({ placeholder, onAdd }: { placeholder: string; onAdd: (url: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex min-w-0 flex-1 items-center rounded-xl border border-border bg-card/50 pl-2">
      <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && v.trim()) {
            e.preventDefault();
            onAdd(v.trim());
            setV("");
          }
        }}
        placeholder={placeholder}
        className="h-11 min-w-0 flex-1 bg-transparent px-2 text-xs outline-none"
      />
      {v.trim() && (
        <button
          type="button"
          onClick={() => {
            onAdd(v.trim());
            setV("");
          }}
          className="px-2 text-primary"
          aria-label="Добавить"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-sans text-sm font-semibold tracking-normal">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  prefix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center rounded-xl border border-border bg-card/50 focus-within:border-primary">
        {prefix && <span className="pl-3 font-mono text-xs text-muted-foreground">{prefix}</span>}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            "h-11 w-full bg-transparent px-3 text-sm outline-none",
            prefix && "pl-1 font-mono",
          )}
        />
      </span>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card/40 px-3 py-3 text-left text-sm"
    >
      <span>{label}</span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; icon: ReactNode }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-border p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm transition",
            value === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
