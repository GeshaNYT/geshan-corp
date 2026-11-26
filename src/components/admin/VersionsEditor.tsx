import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { fmtRelease, fmtVersion } from "@/components/Versions";
import { useRefreshSite, useSite } from "@/lib/data";
import { versionsApi } from "@/lib/repo";
import type { NodeVersion } from "@/lib/types";

/** when: "YYYY-MM-DDTHH:mm" (дата и время по часам админа) или "YYYY-MM-DD" (только дата) */
type Draft = { id?: string; version: string; when: string; url: string; notes: string };
const pad = (n: number) => String(n).padStart(2, "0");
/** Сегодняшняя дата по Москве — версии датируются по МСК, без времени */
const todayMsk = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow" }).format(new Date());
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
/** Превращаем поле формы в то, что хранится в базе */
function whenToDb(when: string) {
  if (!when) return { released_at: null, released_ts: null };
  if (when.includes("T")) {
    const d = new Date(when); // читается в часовом поясе админа
    return { released_at: when.slice(0, 10), released_ts: d.toISOString() };
  }
  return { released_at: when, released_ts: null };
}

/** Версии проекта в редакторе: сохраняются сразу, отдельно от кнопки «Сохранить» проекта */
export function VersionsEditor({ nodeId }: { nodeId: string }) {
  const site = useSite();
  const refresh = useRefreshSite();
  const versions = site.versionsOf(nodeId);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      await refresh();
      toast.success(ok);
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.version.trim()) return toast.error("Укажи номер версии");
    const isNew = !draft.id;
    const ok = await run(
      async () => {
        if (isNew) {
          // новая версия становится текущей — встаёт первой, остальные сдвигаются
          await Promise.all(versions.map((v, i) => versionsApi.save({ ...v, sort: i + 1 })));
          await versionsApi.save({
            node_id: nodeId,
            version: draft.version,
            url: draft.url,
            notes: draft.notes,
            ...whenToDb(draft.when),
            sort: 0,
          });
        } else {
          await versionsApi.save({
            id: draft.id,
            node_id: nodeId,
            version: draft.version,
            url: draft.url,
            notes: draft.notes,
            ...whenToDb(draft.when),
          });
        }
      },
      isNew ? "Версия добавлена" : "Сохранено",
    );
    if (ok) setDraft(null);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= versions.length) return;
    const next = [...versions];
    [next[i], next[j]] = [next[j], next[i]];
    void run(() => versionsApi.reorder(next), "Порядок изменён");
  };

  const edit = (v: NodeVersion) =>
    setDraft({
      id: v.id,
      version: v.version,
      when: v.released_ts ? toLocalInput(v.released_ts) : (v.released_at ?? ""),
      url: v.url,
      notes: v.notes,
    });

  return (
    <div className="space-y-2">
      {draft && !draft.id && <Form draft={draft} setDraft={setDraft} onSave={save} busy={busy} />}
      {versions.map((v, i) =>
        draft?.id === v.id ? (
          <Form key={v.id} draft={draft} setDraft={setDraft} onSave={save} busy={busy} />
        ) : (
          <div
            key={v.id}
            className="flex items-center gap-2 rounded-xl border border-border bg-card/40 p-2.5"
          >
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm">{fmtVersion(v.version)}</span>
                {i === 0 && (
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-300">
                    текущая
                  </span>
                )}
                {(v.released_ts || v.released_at) && (
                  <span className="text-[11px] text-muted-foreground">{fmtRelease(v)}</span>
                )}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {v.url || "без ссылки"}
              </span>
            </span>
            <Btn label="Новее" onClick={() => move(i, -1)} disabled={busy || i === 0}>
              <ArrowUp className="h-4 w-4" />
            </Btn>
            <Btn
              label="Старше"
              onClick={() => move(i, 1)}
              disabled={busy || i === versions.length - 1}
            >
              <ArrowDown className="h-4 w-4" />
            </Btn>
            <Btn label="Изменить" onClick={() => edit(v)}>
              <Pencil className="h-4 w-4" />
            </Btn>
            <Btn
              label="Удалить"
              onClick={() => {
                if (window.confirm(`Удалить версию ${fmtVersion(v.version)}?`))
                  void run(() => versionsApi.remove(v.id), "Версия удалена");
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Btn>
          </div>
        ),
      )}
      {!draft && (
        <button
          type="button"
          onClick={() => setDraft({ version: "", when: todayMsk(), url: "", notes: "" })}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" /> Новая версия
        </button>
      )}
    </div>
  );
}

function Form({
  draft,
  setDraft,
  onSave,
  busy,
}: {
  draft: Draft;
  setDraft: (d: Draft | null) => void;
  onSave: () => void;
  busy: boolean;
}) {
  const field =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary";
  return (
    <div className="space-y-2 rounded-xl border border-primary/40 bg-primary/5 p-3">
      <div className="grid grid-cols-2 gap-2">
        <input
          className={`${field} font-mono`}
          placeholder="Версия, напр. 1.4.2"
          value={draft.version}
          onChange={(e) => setDraft({ ...draft, version: e.target.value })}
          autoFocus
        />
        <input
          type={draft.when.includes("T") ? "datetime-local" : "date"}
          className={field}
          value={draft.when}
          onChange={(e) => setDraft({ ...draft, when: e.target.value })}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Дата выхода по Москве — у всех посетителей она одинаковая.
      </p>
      <input
        className={`${field} font-mono text-xs`}
        placeholder="Ссылка на пост с обновлением (https://t.me/...)"
        value={draft.url}
        onChange={(e) => setDraft({ ...draft, url: e.target.value })}
        inputMode="url"
      />
      <textarea
        className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary"
        rows={2}
        placeholder="Коротко, что нового (необязательно)"
        value={draft.notes}
        onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setDraft(null)}
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
          <Check className="h-4 w-4" /> Сохранить версию
        </button>
      </div>
    </div>
  );
}

function Btn({
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
