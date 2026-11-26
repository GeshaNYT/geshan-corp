import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { fmtRelease, fmtVersion } from "@/components/Versions";
import { useRefreshSite, useSite } from "@/lib/data";
import { versionsApi } from "@/lib/repo";
import type { NodeVersion } from "@/lib/types";

/** date — YYYY-MM-DD по Москве, time — HH:mm по Москве или пусто */
type Draft = {
  id?: string;
  version: string;
  /** Автоматически: дата и время в момент сохранения (по МСК) */
  auto: boolean;
  date: string;
  time: string;
  url: string;
  download_url: string;
  notes: string;
};
/** Сегодняшняя дата по Москве — версии датируются по МСК, без времени */
const todayMsk = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow" }).format(new Date());
/** Момент из базы → дата и время по Москве для формы */
function fromDb(v: NodeVersion) {
  if (!v.released_ts) return { date: v.released_at ?? "", time: "" };
  const d = new Date(v.released_ts);
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow" }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return { date, time };
}
/** Форма → база. Время вводится по Москве (UTC+3) */
function toDb(date: string, time: string) {
  if (!date) return { released_at: null, released_ts: null };
  if (!time) return { released_at: date, released_ts: null };
  return { released_at: date, released_ts: new Date(`${date}T${time}:00+03:00`).toISOString() };
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
            download_url: draft.download_url,
            notes: draft.notes,
            ...(draft.auto
              ? { released_at: todayMsk(), released_ts: new Date().toISOString() }
              : toDb(draft.date, draft.time)),
            sort: 0,
          });
        } else {
          await versionsApi.save({
            id: draft.id,
            node_id: nodeId,
            version: draft.version,
            url: draft.url,
            download_url: draft.download_url,
            notes: draft.notes,
            ...(draft.auto
              ? { released_at: todayMsk(), released_ts: new Date().toISOString() }
              : toDb(draft.date, draft.time)),
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
      auto: false,
      ...fromDb(v),
      url: v.url,
      download_url: v.download_url ?? "",
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
          onClick={() =>
            setDraft({
              version: "",
              auto: true,
              date: todayMsk(),
              time: "",
              url: "",
              download_url: "",
              notes: "",
            })
          }
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
      <div>
        <input
          className={`${field} font-mono`}
          placeholder="Версия, напр. 1.4.2"
          value={draft.version}
          onChange={(e) => setDraft({ ...draft, version: e.target.value })}
          autoFocus
        />
      </div>
      <button
        type="button"
        onClick={() => setDraft({ ...draft, auto: !draft.auto })}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm"
      >
        <span>
          Дата и время — автоматически
          <span className="block text-[11px] text-muted-foreground">
            {draft.auto ? "Возьмём момент сохранения, по МСК" : "Указываешь вручную, по МСК"}
          </span>
        </span>
        <span
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${draft.auto ? "bg-primary" : "bg-muted"}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all ${draft.auto ? "left-[22px]" : "left-0.5"}`}
          />
        </span>
      </button>
      {!draft.auto && (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            className={field}
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            aria-label="Дата по Москве"
          />
          <input
            type="time"
            className={field}
            value={draft.time}
            onChange={(e) => setDraft({ ...draft, time: e.target.value })}
            aria-label="Время по Москве (необязательно)"
          />
          <span className="col-span-2 text-[11px] text-muted-foreground">
            По МСК. Время необязательно — без него покажется только дата.
          </span>
        </div>
      )}
      <input
        className={`${field} font-mono text-xs`}
        placeholder="Ссылка на пост с обновлением (https://t.me/...)"
        value={draft.url}
        onChange={(e) => setDraft({ ...draft, url: e.target.value })}
        inputMode="url"
      />
      <input
        className={`${field} font-mono text-xs`}
        placeholder="Ссылка, чтобы скачать эту версию (если файл в посте — та же ссылка)"
        value={draft.download_url}
        onChange={(e) => setDraft({ ...draft, download_url: e.target.value })}
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
