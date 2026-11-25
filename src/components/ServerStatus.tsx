import { useQuery } from "@tanstack/react-query";
import { Check, Copy, RefreshCw, Users } from "lucide-react";
import { useState } from "react";
import { MC_SERVERS } from "@/config/site";
import { cn } from "@/lib/utils";

interface McStatus {
  online: boolean;
  players?: { online: number; max: number; list?: { name: string }[] };
  version?: string;
  motd?: { clean?: string[] };
}

async function fetchStatus(kind: "java" | "bedrock"): Promise<McStatus> {
  const s = MC_SERVERS[kind];
  const addr = "port" in s ? `${s.host}:${s.port}` : s.host;
  const url =
    kind === "java"
      ? `https://api.mcsrvstat.us/3/${addr}`
      : `https://api.mcsrvstat.us/bedrock/3/${addr}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function useStatus(kind: "java" | "bedrock") {
  return useQuery({
    queryKey: ["mc", kind],
    queryFn: () => fetchStatus(kind),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });
}

function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs transition hover:border-primary hover:text-primary"
    >
      {ok ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {ok ? "Скопировано" : "Копировать"}
    </button>
  );
}

function ServerRow({ kind, detailed }: { kind: "java" | "bedrock"; detailed?: boolean }) {
  const s = MC_SERVERS[kind];
  const q = useStatus(kind);
  const st = q.data;
  const online = st?.online === true;
  const loading = q.isLoading;
  const players = st?.players?.list ?? [];

  return (
    <div className="rounded-2xl border border-border bg-background/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                loading
                  ? "animate-pulse bg-muted-foreground"
                  : online
                    ? "bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400/60"
                    : "bg-red-400",
              )}
            />
            <span className="text-sm font-medium">{s.label}</span>
            <span className="text-xs text-muted-foreground">
              {loading ? "проверяем…" : q.isError ? "нет данных" : online ? "онлайн" : "офлайн"}
            </span>
          </div>
          <p className="mt-1.5 truncate font-mono text-sm text-primary">{s.host}</p>
          {"port" in s && <p className="font-mono text-xs text-muted-foreground">Порт: {s.port}</p>}
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1.5 text-lg font-semibold tabular-nums">
            <Users className="h-4 w-4 text-muted-foreground" />
            {online ? `${st?.players?.online ?? 0}` : "—"}
            <span className="text-sm font-normal text-muted-foreground">
              /{online ? (st?.players?.max ?? "?") : "—"}
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            {online && st?.version ? st.version : "version" in s ? s.version : ""}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CopyButton text={s.host} />
        {"port" in s && <CopyButton text={String(s.port)} />}
      </div>
      {detailed && online && st?.motd?.clean?.length ? (
        <p className="mt-3 whitespace-pre-line rounded-lg bg-card/60 p-2.5 text-xs text-muted-foreground">
          {st.motd.clean.join("\n")}
        </p>
      ) : null}
      {detailed && players.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {players.slice(0, 40).map((p) => (
            <span key={p.name} className="rounded-md bg-card px-2 py-1 text-xs">
              {p.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ServerStatus({ detailed }: { detailed?: boolean }) {
  const j = useStatus("java");
  const b = useStatus("bedrock");
  return (
    <div className="space-y-3">
      <ServerRow kind="java" detailed={detailed} />
      <ServerRow kind="bedrock" detailed={detailed} />
      {detailed && (
        <button
          type="button"
          onClick={() => {
            void j.refetch();
            void b.refetch();
          }}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", (j.isFetching || b.isFetching) && "animate-spin")}
          />{" "}
          Обновить (автообновление раз в минуту)
        </button>
      )}
    </div>
  );
}
