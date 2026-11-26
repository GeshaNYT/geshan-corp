import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Copy,
  Database,
  Eye,
  EyeOff,
  FolderPlus,
  FolderInput,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
  FilePlus2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NodeIcon } from "@/components/NodeIcon";
import { StatusBadge } from "@/components/StatusBadge";
import { NodeEditor } from "@/components/admin/NodeEditor";
import { MoveDialog } from "@/components/admin/MoveDialog";
import { ChannelsAdmin } from "@/components/admin/ChannelsAdmin";
import { PlatformsAdmin } from "@/components/admin/PlatformsAdmin";
import { UsersAdmin } from "@/components/admin/UsersAdmin";
import { LinkTypesAdmin } from "@/components/admin/LinkTypesAdmin";
import { ServersAdmin } from "@/components/admin/ServersAdmin";
import { useAuth } from "@/lib/auth";
import { useRefreshSite, useSite, type SiteIndex } from "@/lib/data";
import { repo, resetDemo } from "@/lib/repo";
import type { NodeKind, SiteNode } from "@/lib/types";
import { cn } from "@/lib/utils";

type AdminTab = "tree" | "channels" | "buttons" | "servers" | "platforms" | "users";
const TABS: AdminTab[] = ["tree", "channels", "buttons", "servers", "platforms", "users"];
type AdminSearch = { edit?: string; parent?: string; kind?: NodeKind; tab?: AdminTab };

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Админ-панель — Geshan Corporation" }, { name: "robots", content: "noindex" }],
  }),
  validateSearch: (s: Record<string, unknown>): AdminSearch => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
    parent: typeof s.parent === "string" ? s.parent : undefined,
    kind: s.kind === "section" || s.kind === "project" ? s.kind : undefined,
    tab: TABS.includes(s.tab as AdminTab) ? (s.tab as AdminTab) : undefined,
  }),
  component: AdminPage,
});

function AdminPage() {
  const auth = useAuth();
  const site = useSite();
  const refresh = useRefreshSite();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin" });
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [moving, setMoving] = useState<SiteNode | null>(null);
  const [tab, setTab] = useState<AdminTab>(search.tab ?? "tree");
  useEffect(() => {
    if (search.tab) setTab(search.tab);
  }, [search.tab]);

  const editorOpen = Boolean(search.edit || search.kind);
  const editing = search.edit ? site.byId.get(search.edit) : undefined;

  const openNew = (kind: NodeKind, parent: string | null) =>
    navigate({ search: { kind, parent: parent ?? undefined } });
  const openEdit = (id: string) => navigate({ search: { edit: id } });
  const scrolled = useRef<string | null>(null);
  // Узел, с которым работали последним: дерево раскрывается до него и прокручивается к нему
  const [focusId, setFocusId] = useState<string | null>(null);
  const target = search.edit ?? search.parent ?? null;
  useEffect(() => {
    if (!target) return;
    setFocusId(target);
    scrolled.current = null;
    // при добавлении внутрь раскрываем и сам родитель
    if (search.parent) setExpanded((s) => new Set(s).add(search.parent!));
  }, [target, search.parent]);
  // Раскрываем все ветки над выбранным узлом
  useEffect(() => {
    if (!focusId) return;
    const anc = site.pathOf(focusId); // включая сам узел — видно, что внутри
    if (anc.every((p) => expanded.has(p.id))) return;
    setExpanded((s) => {
      const n = new Set(s);
      for (const p of anc) n.add(p.id);
      return n;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, site.nodes]);
  const closeEditor = (savedId?: string) => {
    if (savedId) {
      setFocusId(savedId);
      scrolled.current = null;
    }
    void navigate({ search: {} });
  };
  useEffect(() => {
    if (editorOpen || !focusId || scrolled.current === focusId) return;
    const t = window.setTimeout(() => {
      const el = document.querySelector(`[data-node-row="${focusId}"]`);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        scrolled.current = focusId;
      }
    }, 150);
    return () => window.clearTimeout(t);
  }, [editorOpen, focusId, site.nodes, expanded]);

  const needle = q.trim().toLowerCase();
  const matches = useMemo(
    () =>
      needle
        ? site.nodes.filter((n) =>
            `${n.title} ${n.slug} ${n.tagline}`.toLowerCase().includes(needle),
          )
        : [],
    [needle, site.nodes],
  );

  if (!auth.ready) return <p className="py-20 text-center text-muted-foreground">Загрузка…</p>;
  if (!auth.isAdmin) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="font-display text-4xl">Нет доступа</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Админ-панель доступна только администраторам.
        </p>
        <Link
          to="/profile"
          className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-sm text-primary-foreground"
        >
          Войти
        </Link>
      </div>
    );
  }

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      await refresh();
      toast.success(ok);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const actions: RowActions = {
    toggle: (id) =>
      setExpanded((s) => {
        const n = new Set(s);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      }),
    add: (kind, parent) => {
      setExpanded((s) => new Set(s).add(parent));
      void openNew(kind, parent);
    },
    edit: (id) => void openEdit(id),
    move: (node, dir) => {
      const sibs = site.childrenOf(node.parent_id, { includeHidden: true });
      const i = sibs.findIndex((s) => s.id === node.id);
      const j = i + dir;
      if (j < 0 || j >= sibs.length) return;
      const next = [...sibs];
      [next[i], next[j]] = [next[j], next[i]];
      void run(
        () => repo.reorder(next.map((s, k) => ({ id: s.id, parent_id: s.parent_id, sort: k }))),
        "Порядок изменён",
      );
    },
    relocate: (node) => setMoving(node),
    toggleHidden: (node) =>
      void run(
        () => repo.saveNode({ ...node, hidden: !node.hidden }),
        node.hidden ? "Проект снова виден" : "Проект скрыт",
      ),
    toggleFeatured: (node) =>
      void run(
        () => repo.saveNode({ ...node, featured: !node.featured }),
        node.featured ? "Убрано с главной" : "Добавлено на главную",
      ),
    duplicate: (node) =>
      void run(async () => {
        const { id: _id, created_at: _c, updated_at: _u, ...rest } = node;
        let slug = `${node.slug}-copy`;
        let k = 2;
        while (site.bySlug.has(slug)) slug = `${node.slug}-copy-${k++}`;
        const copy = await repo.saveNode({
          ...rest,
          slug,
          title: `${node.title} (копия)`,
          sort: node.sort + 1,
          hidden: true,
        });
        for (const f of site.filesOf(node.id)) {
          const { id: _fid, created_at: _fc, ...fr } = f;
          await repo.saveFile({ ...fr, node_id: copy.id, storage_path: null, downloads: 0 });
        }
      }, "Создана скрытая копия"),
    remove: (node) => {
      const inner = site.descendantsOf(node.id).length;
      const text = inner
        ? `Удалить «${node.title}» и всё внутри (${inner})? Это нельзя отменить.`
        : `Удалить «${node.title}»? Это нельзя отменить.`;
      if (!window.confirm(text)) return;
      void run(() => repo.deleteNode(node.id), "Удалено");
    },
  };

  const roots = site.childrenOf(null, { includeHidden: true });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.3em] text-primary">Управление</p>
          <h1 className="font-display text-4xl">Админ-панель</h1>
        </div>
        <div className={cn("flex gap-2", tab !== "tree" && "hidden")}>
          <button
            type="button"
            onClick={() => void openNew("section", null)}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-primary"
          >
            <FolderPlus className="h-4 w-4" /> Раздел
          </button>
          <button
            type="button"
            onClick={() => void openNew("project", null)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Проект
          </button>
        </div>
      </div>

      <div className="no-scrollbar fade-x -mx-4 mb-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0 md:[mask-image:none]">
        {(
          [
            ["tree", "Проекты"],
            ["channels", "Каналы"],
            ["buttons", "Кнопки"],
            ["servers", "Сервер"],
            ["platforms", "Платформы"],
            ["users", "Люди"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm transition",
              tab === k
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "channels" && <ChannelsAdmin />}
      {tab === "buttons" && <LinkTypesAdmin />}
      {tab === "servers" && <ServersAdmin />}
      {tab === "platforms" && <PlatformsAdmin />}
      {tab === "users" && <UsersAdmin />}
      {tab === "tree" && (
        <>
          <ModeBanner site={site} onImported={refresh} />

          <label className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card/50 px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по всем разделам и проектам"
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>

          {needle ? (
            <div className="space-y-1.5">
              {matches.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => actions.edit(n.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card/40 p-3 text-left hover:border-primary"
                >
                  <NodeIcon name={n.icon} className="h-4 w-4 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{n.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {site
                        .pathOf(n.id)
                        .slice(0, -1)
                        .map((p) => p.title)
                        .join(" / ") || "Корень"}
                    </span>
                  </span>
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
              {matches.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">Ничего не найдено</p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card/30 p-1.5">
              {roots.map((n, i) => (
                <TreeRow
                  key={n.id}
                  node={n}
                  depth={0}
                  site={site}
                  expanded={expanded}
                  focusId={focusId}
                  actions={actions}
                  first={i === 0}
                  last={i === roots.length - 1}
                />
              ))}
              {roots.length === 0 && (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  Пока пусто — добавь первый раздел.
                </p>
              )}
            </div>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            Подсказка: «+» у любого раздела или проекта добавляет внутрь подраздел или проект.
            Стрелки меняют порядок, «⋮» — перенос, дублирование, скрытие и удаление.
          </p>
        </>
      )}

      {editorOpen && (
        <NodeEditor
          key={search.edit ?? `new-${search.kind}-${search.parent ?? "root"}`}
          node={editing}
          initialKind={search.kind ?? "project"}
          initialParent={search.parent ?? null}
          onClose={closeEditor}
        />
      )}
      {moving && <MoveDialog node={moving} onClose={() => setMoving(null)} />}
    </div>
  );
}

interface RowActions {
  toggle: (id: string) => void;
  add: (kind: NodeKind, parent: string) => void;
  edit: (id: string) => void;
  move: (node: SiteNode, dir: -1 | 1) => void;
  relocate: (node: SiteNode) => void;
  toggleHidden: (node: SiteNode) => void;
  toggleFeatured: (node: SiteNode) => void;
  duplicate: (node: SiteNode) => void;
  remove: (node: SiteNode) => void;
}

function TreeRow({
  node,
  depth,
  site,
  expanded,
  focusId,
  actions,
  first,
  last,
}: {
  node: SiteNode;
  depth: number;
  site: SiteIndex;
  expanded: Set<string>;
  focusId: string | null;
  actions: RowActions;
  first: boolean;
  last: boolean;
}) {
  const kids = site.childrenOf(node.id, { includeHidden: true });
  const isOpen = expanded.has(node.id);
  const isSection = node.kind === "section";
  const files = site.filesOf(node.id).length;

  return (
    <div>
      <div
        data-node-row={node.id}
        className={cn(
          "group flex items-center gap-1 rounded-xl py-1.5 pr-1 hover:bg-card/70",
          node.hidden && "opacity-55",
          focusId === node.id && "bg-primary/10 ring-1 ring-primary/40",
        )}
        style={{ paddingLeft: 4 + depth * 16 }}
      >
        <button
          type="button"
          onClick={() => actions.toggle(node.id)}
          disabled={kids.length === 0}
          aria-label={isOpen ? "Свернуть" : "Развернуть"}
          className="grid h-8 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground disabled:opacity-0"
        >
          <ChevronRight className={cn("h-4 w-4 transition", isOpen && "rotate-90")} />
        </button>
        <button
          type="button"
          onClick={() => actions.edit(node.id)}
          className="flex min-w-0 flex-1 items-center gap-2.5 py-1 text-left"
        >
          <span
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-lg border",
              isSection ? "border-primary/40 bg-primary/10" : "border-border bg-background/50",
            )}
          >
            <NodeIcon name={node.icon} className="h-4 w-4 text-primary" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm">{node.title}</span>
              {node.featured && <Star className="h-3 w-3 shrink-0 fill-primary text-primary" />}
              {node.hidden && <EyeOff className="h-3 w-3 shrink-0 text-muted-foreground" />}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {isSection ? (
                <span>Раздел · {kids.length}</span>
              ) : (
                <StatusBadge status={node.status} className="px-1.5 py-0 text-[10px]" />
              )}
              {files > 0 && <span>· {files} файл.</span>}
            </span>
          </span>
        </button>

        {
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Добавить внутрь"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-primary/40 text-primary hover:bg-primary/10"
              >
                <Plus className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.add("section", node.id)}>
                <FolderPlus className="mr-2 h-4 w-4" /> Подраздел
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.add("project", node.id)}>
                <FilePlus2 className="mr-2 h-4 w-4" /> Проект
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
        <div className="hidden items-center sm:flex">
          <IconBtn label="Выше" onClick={() => actions.move(node, -1)} disabled={first}>
            <ArrowUp className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Ниже" onClick={() => actions.move(node, 1)} disabled={last}>
            <ArrowDown className="h-4 w-4" />
          </IconBtn>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Действия"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => actions.edit(node.id)}>
              <Pencil className="mr-2 h-4 w-4" /> Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={first}
              onClick={() => actions.move(node, -1)}
              className="sm:hidden"
            >
              <ArrowUp className="mr-2 h-4 w-4" /> Выше
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={last}
              onClick={() => actions.move(node, 1)}
              className="sm:hidden"
            >
              <ArrowDown className="mr-2 h-4 w-4" /> Ниже
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.relocate(node)}>
              <FolderInput className="mr-2 h-4 w-4" /> Переместить в…
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.duplicate(node)}>
              <Copy className="mr-2 h-4 w-4" /> Дублировать
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.toggleFeatured(node)}>
              <Star className="mr-2 h-4 w-4" /> {node.featured ? "Убрать с главной" : "На главную"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.toggleHidden(node)}>
              {node.hidden ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}{" "}
              {node.hidden ? "Показать" : "Скрыть"}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/p/$slug" params={{ slug: node.slug }}>
                <Eye className="mr-2 h-4 w-4" /> Открыть на сайте
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => actions.remove(node)}
              className="text-red-300 focus:text-red-300"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isOpen &&
        kids.map((k, i) => (
          <TreeRow
            key={k.id}
            node={k}
            depth={depth + 1}
            site={site}
            expanded={expanded}
            focusId={focusId}
            actions={actions}
            first={i === 0}
            last={i === kids.length - 1}
          />
        ))}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground disabled:opacity-25"
    >
      {children}
    </button>
  );
}

function ModeBanner({ site, onImported }: { site: SiteIndex; onImported: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  if (repo.mode === "demo") {
    return (
      <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
        <p className="font-medium text-amber-200">Демо-режим</p>
        <p className="mt-1 text-amber-100/80">
          База данных ещё не подключена: изменения сохраняются только в этом браузере и не видны
          другим. Здесь можно спокойно всё попробовать.
        </p>
        <button
          type="button"
          onClick={async () => {
            if (!window.confirm("Сбросить все демо-изменения к исходному контенту?")) return;
            resetDemo();
            await onImported();
            toast.success("Демо-данные сброшены");
          }}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-500/40 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-500/10"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Сбросить демо
        </button>
      </div>
    );
  }
  if (!site.loading && site.nodes.length === 0) {
    return (
      <div className="mb-4 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm">
        <p className="font-medium text-primary">База пустая</p>
        <p className="mt-1 text-muted-foreground">
          Перенести в базу все разделы и проекты со старого сайта?
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const n = await repo.importSeed();
              await onImported();
              toast.success(`Перенесено: ${n}`);
            } catch (e) {
              toast.error((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          <Database className="h-3.5 w-3.5" /> {busy ? "Переносим…" : "Перенести контент"}
        </button>
      </div>
    );
  }
  return null;
}
