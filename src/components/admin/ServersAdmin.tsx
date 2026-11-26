import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react";
import { useSaveSetting, useSetting } from "@/lib/content";
import {
  DEFAULT_HOWTO,
  DEFAULT_PORT,
  DEFAULT_SERVERS,
  type Edition,
  type McServer,
} from "@/lib/servers";
import { cn } from "@/lib/utils";

/** Серверы Minecraft для мониторинга: адрес, порт, версии */
export function ServersAdmin() {
  const saved = useSetting<McServer[]>("mc_servers", DEFAULT_SERVERS);
  const saveSetting = useSaveSetting();
  const [list, setList] = useState<McServer[]>(saved);
  const [busy, setBusy] = useState(false);
  const savedJson = JSON.stringify(saved);
  useEffect(() => setList(JSON.parse(savedJson) as McServer[]), [savedJson]);
  const dirty = JSON.stringify(list) !== savedJson;

  const upd = (id: string, patch: Partial<McServer>) =>
    setList((l) => l.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
  };

  const save = async () => {
    if (list.some((s) => !s.host.trim()))
      return toast.error("У одного из серверов не указан адрес");
    if (list.some((s) => s.port.trim() && !/^\d{1,5}$/.test(s.port.trim())))
      return toast.error("Порт — это число");
    setBusy(true);
    try {
      await saveSetting(
        "mc_servers",
        list.map((s) => ({
          ...s,
          label: s.label.trim() || (s.edition === "java" ? "Java" : "Bedrock"),
          host: s.host.trim(),
          port: s.port.trim(),
          version: s.version.trim(),
          howto: (s.howto ?? "").trim(),
        })),
      );
      toast.success("Сохранено — мониторинг обновится");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const field =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary";

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Серверы, которые показываются в мониторинге на главной и на странице MineCube. Если поле
        «Версии» пустое — версия определяется автоматически по ответу сервера.
      </p>
      <div className="space-y-3">
        {list.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "space-y-2 rounded-2xl border border-border bg-card/40 p-3",
              s.hidden && "opacity-60",
            )}
          >
            <div className="flex items-center gap-1">
              <div className="grid flex-1 grid-cols-2 gap-1 rounded-lg border border-border p-1">
                {(["java", "bedrock"] as Edition[]).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => upd(s.id, { edition: e })}
                    className={cn(
                      "rounded-md py-1.5 text-xs",
                      s.edition === e
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {e === "java" ? "Java" : "Bedrock"}
                  </button>
                ))}
              </div>
              <Btn label="Выше" onClick={() => move(i, -1)} disabled={i === 0}>
                <ArrowUp className="h-4 w-4" />
              </Btn>
              <Btn label="Ниже" onClick={() => move(i, 1)} disabled={i === list.length - 1}>
                <ArrowDown className="h-4 w-4" />
              </Btn>
              <Btn
                label={s.hidden ? "Показать" : "Скрыть"}
                onClick={() => upd(s.id, { hidden: !s.hidden })}
              >
                {s.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Btn>
              <Btn
                label="Удалить"
                onClick={() => {
                  if (window.confirm(`Убрать сервер «${s.label || s.host}» из мониторинга?`))
                    setList((l) => l.filter((x) => x.id !== s.id));
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Btn>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Название</span>
              <input
                className={field}
                value={s.label}
                onChange={(e) => upd(s.id, { label: e.target.value })}
                placeholder="Java"
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="col-span-2 block">
                <span className="mb-1 block text-xs text-muted-foreground">
                  Адрес (IP или домен)
                </span>
                <input
                  className={`${field} font-mono`}
                  value={s.host}
                  onChange={(e) => upd(s.id, { host: e.target.value })}
                  placeholder="mc.minecube.pro"
                  inputMode="url"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Порт</span>
                <input
                  className={`${field} font-mono`}
                  value={s.port}
                  onChange={(e) => upd(s.id, { port: e.target.value })}
                  placeholder={DEFAULT_PORT[s.edition]}
                  inputMode="numeric"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">
                Версии (пусто — определять автоматически)
              </span>
              <input
                className={field}
                value={s.version}
                onChange={(e) => upd(s.id, { version: e.target.value })}
                placeholder="например: 1.16.5 – 26.3"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">
                Как зайти — подсказка под мониторингом (пусто — стандартная)
              </span>
              <textarea
                className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                rows={2}
                value={s.howto ?? ""}
                onChange={(e) => upd(s.id, { howto: e.target.value })}
                placeholder={DEFAULT_HOWTO[s.edition]}
              />
            </label>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          setList((l) => [
            ...l,
            {
              id: `s-${Date.now().toString(36)}`,
              label: "",
              edition: "java",
              host: "",
              port: "",
              version: "",
            },
          ])
        }
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
      >
        <Plus className="h-4 w-4" /> Добавить сервер
      </button>

      {dirty ? (
        <div className="sticky bottom-24 z-10 mt-4 md:bottom-4">
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-black/40 disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {busy ? "Сохраняем…" : "Сохранить изменения"}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-center text-xs text-muted-foreground">Все изменения сохранены</p>
      )}
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
