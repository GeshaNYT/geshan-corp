import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Check,
  EyeOff,
  Home,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  channelsApi,
  handleFromUrl,
  normalizeChannelUrl,
  useChannels,
  type Channel,
} from "@/lib/content";

type Draft = { id?: string; name: string; url: string; description: string; featured: boolean };
const EMPTY: Draft = { name: "", url: "", description: "", featured: true };

export function ChannelsAdmin() {
  const qc = useQueryClient();
  const { data: channels = [] } = useChannels();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["channels"] });
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
    const url = normalizeChannelUrl(draft.url);
    if (!draft.name.trim() || !url) return toast.error("Укажи название и ссылку");
    const dup = channels.find(
      (c) => c.id !== draft.id && normalizeChannelUrl(c.url).toLowerCase() === url.toLowerCase(),
    );
    if (dup) return toast.error(`Этот канал уже есть: «${dup.name}»`);
    const ok = await run(
      () =>
        channelsApi.save({
          id: draft.id,
          name: draft.name.trim(),
          url,
          handle: handleFromUrl(url),
          description: draft.description.trim(),
          featured: draft.featured,
          ...(draft.id ? {} : { sort: channels.length }),
        }),
      draft.id ? "Канал сохранён" : "Канал добавлен",
    );
    if (ok) setDraft(null);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= channels.length) return;
    const next = [...channels];
    [next[i], next[j]] = [next[j], next[i]];
    void run(() => channelsApi.reorder(next), "Порядок изменён");
  };

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Каналы со значком 🏠 показываются на главной. Если какой-то канал убрать с главной, там
        появится ссылка «Все каналы», где видны все. Можно вставить ссылку или просто @имя —
        повторно один и тот же канал добавить нельзя.
      </p>

      <div className="space-y-2">
        {channels.map((c, i) =>
          draft?.id === c.id ? (
            <Editor key={c.id} draft={draft} setDraft={setDraft} onSave={save} busy={busy} />
          ) : (
            <Row
              key={c.id}
              c={c}
              first={i === 0}
              last={i === channels.length - 1}
              onUp={() => move(i, -1)}
              onDown={() => move(i, 1)}
              onEdit={() =>
                setDraft({
                  id: c.id,
                  name: c.name,
                  url: c.url,
                  description: c.description,
                  featured: c.featured !== false,
                })
              }
              onToggleHome={() =>
                void run(
                  () =>
                    channelsApi.save({
                      id: c.id,
                      name: c.name,
                      url: c.url,
                      featured: c.featured === false,
                    }),
                  c.featured === false
                    ? "Теперь на главной"
                    : "Убран с главной (остался во «Всех каналах»)",
                )
              }
              onDelete={() => {
                if (window.confirm(`Удалить канал «${c.name}»?`))
                  void run(() => channelsApi.remove(c.id), "Удалено");
              }}
            />
          ),
        )}
      </div>

      {draft && !draft.id ? (
        <div className="mt-3">
          <Editor draft={draft} setDraft={setDraft} onSave={save} busy={busy} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDraft({ ...EMPTY })}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" /> Добавить канал
        </button>
      )}
    </div>
  );
}

function Row({
  c,
  first,
  last,
  onUp,
  onDown,
  onEdit,
  onDelete,
  onToggleHome,
}: {
  c: Channel;
  onToggleHome: () => void;
  first: boolean;
  last: boolean;
  onUp: () => void;
  onDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border bg-card/40 p-3",
        c.featured === false && "opacity-70",
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
        <Send className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{c.name}</span>
        <span className="block truncate text-xs text-primary">{c.handle || c.url}</span>
        <span className="block text-[11px] text-muted-foreground">
          {c.featured === false ? "только во «Всех каналах»" : "на главной"}
        </span>
      </span>
      <Btn
        label={c.featured === false ? "Показать на главной" : "Убрать с главной"}
        onClick={onToggleHome}
      >
        {c.featured === false ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Home className="h-4 w-4 text-primary" />
        )}
      </Btn>
      <Btn label="Выше" onClick={onUp} disabled={first}>
        <ArrowUp className="h-4 w-4" />
      </Btn>
      <Btn label="Ниже" onClick={onDown} disabled={last}>
        <ArrowDown className="h-4 w-4" />
      </Btn>
      <Btn label="Изменить" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Btn>
      <Btn label="Удалить" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Btn>
    </div>
  );
}

function Editor({
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
      <input
        className={field}
        placeholder="Название, например: Geshan Corporation"
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        autoFocus
      />
      <input
        className={`${field} font-mono text-xs`}
        placeholder="https://t.me/... или @имя"
        value={draft.url}
        onChange={(e) => setDraft({ ...draft, url: e.target.value })}
        inputMode="url"
      />
      <input
        className={field}
        placeholder="Короткое описание"
        value={draft.description}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
      />
      <button
        type="button"
        onClick={() => setDraft({ ...draft, featured: !draft.featured })}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm"
      >
        <span>Показывать на главной</span>
        <span
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition",
            draft.featured ? "bg-primary" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all",
              draft.featured ? "left-[22px]" : "left-0.5",
            )}
          />
        </span>
      </button>
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
          <Check className="h-4 w-4" /> Сохранить
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
