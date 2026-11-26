import { useState } from "react";
import { Download, ExternalLink, History } from "lucide-react";
import type { NodeVersion } from "@/lib/types";
import { cn } from "@/lib/utils";

/** «1.4» → «v1.4», «Beta 2» оставляем как есть */
export function fmtVersion(v: string) {
  const t = v.trim();
  return /^\d/.test(t) ? `v${t}` : t;
}

export function fmtDate(d: string | null) {
  if (!d) return "";
  const dt = new Date(`${d}T00:00:00`);
  return Number.isNaN(dt.getTime())
    ? ""
    : dt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

/** Дата версии: всегда по Москве; если указано время — «…, 18:30 МСК» */
export function fmtRelease(v: { released_at: string | null; released_ts?: string | null }) {
  if (v.released_ts) {
    const dt = new Date(v.released_ts);
    if (!Number.isNaN(dt.getTime()))
      return `${dt.toLocaleString("ru-RU", {
        timeZone: "Europe/Moscow",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })} МСК`;
  }
  return fmtDate(v.released_at);
}

export function versionDownloads(v: NodeVersion) {
  if (v.downloads?.length) return v.downloads.filter((d) => d.url);
  return v.download_url ? [{ label: "", url: v.download_url }] : [];
}

export function VersionTag({ version, className }: { version: string | null; className?: string }) {
  if (!version) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary",
        className,
      )}
    >
      {fmtVersion(version)}
    </span>
  );
}

/** Блок «Версии» на странице проекта: текущая сверху, история под кнопкой */
export function VersionHistory({ versions }: { versions: NodeVersion[] }) {
  const [all, setAll] = useState(false);
  if (!versions.length) return null;
  const shown = all ? versions : versions.slice(0, 3);
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-display text-2xl">
        <History className="h-5 w-5 text-primary" /> Версии
      </h2>
      <ol className="relative space-y-3 border-l border-primary/25 pl-5">
        {shown.map((v, i) => (
          <li key={v.id} className="relative">
            <span
              className={cn(
                "absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-background",
                i === 0 ? "bg-primary" : "bg-muted-foreground/50",
              )}
            />
            <div className="rounded-2xl border border-border bg-card/40 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold text-foreground">
                  {fmtVersion(v.version)}
                </span>
                {i === 0 && (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">
                    Текущая
                  </span>
                )}
                {(v.released_ts || v.released_at) && (
                  <span className="text-xs text-muted-foreground">{fmtRelease(v)}</span>
                )}
              </div>
              {v.notes && (
                <p className="mt-1.5 whitespace-pre-line text-sm text-muted-foreground">
                  {v.notes}
                </p>
              )}
              {(() => {
                const dls = versionDownloads(v);
                // файл лежит прямо в посте — одна кнопка вместо двух одинаковых
                const samePost = dls.length === 1 && dls[0].url === v.url;
                if (!dls.length && !v.url) return null;
                return (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {dls.map((d) => (
                      <a
                        key={d.url + d.label}
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {/* с подписью — «Скачать для Android 1.0.0» (у платформы может быть своя версия) */}
                        {d.label ? `Скачать для ${d.label}` : `Скачать ${fmtVersion(v.version)}`}
                        {samePost && /t\.me\//.test(v.url) && (
                          <span className="text-muted-foreground"> · пост в Telegram</span>
                        )}
                      </a>
                    ))}
                    {v.url && !samePost && (
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        Открыть пост <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                );
              })()}
            </div>
          </li>
        ))}
      </ol>
      {versions.length > 3 && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="mt-3 text-sm text-primary hover:underline"
        >
          {all ? "Скрыть старые версии" : `Показать все версии (${versions.length})`}
        </button>
      )}
    </section>
  );
}
