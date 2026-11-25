import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useSaveSetting } from "@/lib/content";
import { useSite } from "@/lib/data";
import {
  DEFAULT_LINK_TYPES,
  DEFAULT_SETTING,
  LINK_ICON_SET,
  useLinkTypes,
  type LinkType,
  type LinkTypesSetting,
} from "@/lib/linkTypes";
import { cn } from "@/lib/utils";

const BUILTIN = new Set(DEFAULT_LINK_TYPES.map((t) => t.id));

/** Типы кнопок: порядок, подписи, иконки, цвет, автоопределение по ссылке */
export function LinkTypesAdmin() {
  const lt = useLinkTypes();
  const site = useSite();
  const saveSetting = useSaveSetting();
  const [editing, setEditing] = useState<(LinkType & { isNew?: boolean }) | null>(null);
  const [busy, setBusy] = useState(false);
  const types = lt.all;

  const usage = (id: string) =>
    site.nodes.reduce((n, node) => n + node.links.filter((l) => l.kind === id).length, 0);

  const save = async (next: LinkTypesSetting, ok?: string) => {
    setBusy(true);
    try {
      await saveSetting("link_types", next);
      if (ok) toast.success(ok);
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const setTypes = (list: LinkType[], ok?: string) => save({ ...lt.setting, types: list }, ok);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= types.length) return;
    const next = [...types];
    [next[i], next[j]] = [next[j], next[i]];
    void setTypes(next);
  };

  const commitEdit = async () => {
    if (!editing) return;
    const label = editing.label.trim();
    if (!label) return toast.error("Введи название кнопки");
    const { isNew, ...t } = editing;
    const clean: LinkType = {
      ...t,
      label,
      domains: t.domains.map((d) => d.trim()).filter(Boolean),
    };
    const next = isNew ? [...types, clean] : types.map((x) => (x.id === clean.id ? clean : x));
    if (await setTypes(next, isNew ? "Кнопка добавлена" : "Сохранено")) setEditing(null);
  };

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Это типы кнопок для проектов. В таком порядке они идут в редакторе проекта. Можно поменять
        название, иконку, цвет, добавить свои — и указать адреса, по которым тип определится сам при
        вставке ссылки.
      </p>

      <button
        type="button"
        onClick={() => void save({ ...lt.setting, sortByType: !lt.setting.sortByType })}
        className="mb-3 flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card/40 px-3 py-3 text-left text-sm"
      >
        <span>
          Расставлять кнопки на страницах проектов в этом порядке
          <span className="block text-xs text-muted-foreground">
            Выключено — кнопки идут так, как расставлены в самом проекте
          </span>
        </span>
        <Switch on={lt.setting.sortByType} />
      </button>

      <div className="space-y-1.5">
        {types.map((t, i) => {
          if (editing && !editing.isNew && editing.id === t.id)
            return (
              <TypeEditor
                key={t.id}
                value={editing}
                onChange={setEditing}
                onSave={commitEdit}
                busy={busy}
              />
            );
          const Icon = LINK_ICON_SET[t.icon] ?? LINK_ICON_SET.Link2;
          const used = usage(t.id);
          return (
            <div
              key={t.id}
              className={cn(
                "flex items-center gap-2 rounded-xl border border-border bg-card/40 px-2 py-2",
                t.hidden && "opacity-50",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                  t.primary ? "bg-primary text-primary-foreground" : "border border-border",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{t.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {[
                    t.download && "скачивание",
                    used > 0 && `в проектах: ${used}`,
                    t.hidden && "скрыта",
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </span>
              </span>
              <IconBtn label="Выше" onClick={() => move(i, -1)} disabled={busy || i === 0}>
                <ArrowUp className="h-4 w-4" />
              </IconBtn>
              <IconBtn
                label="Ниже"
                onClick={() => move(i, 1)}
                disabled={busy || i === types.length - 1}
              >
                <ArrowDown className="h-4 w-4" />
              </IconBtn>
              <IconBtn
                label="Изменить"
                onClick={() => setEditing({ ...t, domains: [...t.domains] })}
              >
                <Pencil className="h-4 w-4" />
              </IconBtn>
              {BUILTIN.has(t.id) || used > 0 ? (
                <IconBtn
                  label={t.hidden ? "Показать" : "Скрыть"}
                  onClick={() =>
                    void setTypes(
                      types.map((x) => (x.id === t.id ? { ...x, hidden: !x.hidden } : x)),
                    )
                  }
                >
                  {t.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </IconBtn>
              ) : (
                <IconBtn
                  label="Удалить"
                  onClick={() => {
                    if (window.confirm(`Удалить тип кнопки «${t.label}»?`))
                      void setTypes(
                        types.filter((x) => x.id !== t.id),
                        "Удалено",
                      );
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
              )}
            </div>
          );
        })}
      </div>

      {editing?.isNew ? (
        <div className="mt-2">
          <TypeEditor value={editing} onChange={setEditing} onSave={commitEdit} busy={busy} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() =>
            setEditing({
              id: `c-${Date.now().toString(36)}`,
              label: "",
              icon: "Link2",
              primary: false,
              download: false,
              domains: [],
              isNew: true,
            })
          }
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" /> Новый тип кнопки
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          if (
            window.confirm(
              "Вернуть стандартный список кнопок? Свои типы пропадут из списка (в проектах ссылки останутся).",
            )
          )
            void save(DEFAULT_SETTING, "Сброшено");
        }}
        className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Вернуть как было по умолчанию
      </button>
    </div>
  );
}

function TypeEditor({
  value,
  onChange,
  onSave,
  busy,
}: {
  value: LinkType & { isNew?: boolean };
  onChange: (v: (LinkType & { isNew?: boolean }) | null) => void;
  onSave: () => void;
  busy: boolean;
}) {
  const field =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary";
  return (
    <div className="space-y-3 rounded-xl border border-primary/40 bg-primary/5 p-3">
      <input
        className={field}
        placeholder="Название, например: Boosty или Скачать с MEGA"
        value={value.label}
        onChange={(e) => onChange({ ...value, label: e.target.value })}
        autoFocus
      />
      <div>
        <p className="mb-1.5 text-xs text-muted-foreground">Иконка</p>
        <div className="grid grid-cols-10 gap-1">
          {Object.entries(LINK_ICON_SET).map(([name, Icon]) => (
            <button
              key={name}
              type="button"
              aria-label={name}
              onClick={() => onChange({ ...value, icon: name })}
              className={cn(
                "grid aspect-square place-items-center rounded-lg border",
                value.icon === name
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-transparent hover:border-border",
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
      <Toggle
        label="Главная (жёлтая) кнопка"
        on={value.primary}
        onClick={() => onChange({ ...value, primary: !value.primary })}
      />
      <Toggle
        label="Это скачивание"
        hint="Проекты с такой кнопкой попадут в «Ресурсы», нажатия посчитаются в скачивания"
        on={value.download}
        onClick={() => onChange({ ...value, download: !value.download })}
      />
      <label className="block">
        <span className="mb-1.5 block text-xs text-muted-foreground">
          Определять по ссылке (через запятую, например: boosty.to, donationalerts)
        </span>
        <input
          className={`${field} font-mono text-xs`}
          value={value.domains.join(", ")}
          onChange={(e) => onChange({ ...value, domains: e.target.value.split(",") })}
          placeholder="необязательно"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm"
        >
          <X className="h-4 w-4" /> Отмена
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="flex flex-[2] items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Check className="h-4 w-4" /> Сохранить
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  on,
  onClick,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2.5 text-left text-sm"
    >
      <span>
        {label}
        {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
      </span>
      <Switch on={on} />
    </button>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition",
        on ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all",
          on ? "left-[22px]" : "left-0.5",
        )}
      />
    </span>
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
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground disabled:opacity-25"
    >
      {children}
    </button>
  );
}
