import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { FileList, LinkButtons } from "@/components/NodeCards";
import { NodeIcon } from "@/components/NodeIcon";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { VersionTag } from "@/components/Versions";
import { useSite } from "@/lib/data";
import { orderPlatforms, useSetting } from "@/lib/content";
import { useLinkTypes } from "@/lib/linkTypes";
import { cn } from "@/lib/utils";
import { displayPlatform } from "@/lib/types";

export const Route = createFileRoute("/resources")({
  head: () => ({ meta: [{ title: "Ресурсы — Geshan Corporation" }] }),
  component: Resources,
});

function Resources() {
  const site = useSite();
  const types = useLinkTypes();
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState<string | null>(null);

  // Всё, что можно скачать: проекты с файлами или кнопками-скачиваниями.
  // Порядок: сначала самые свежие по дате последней версии, проекты без версий — в конце,
  // при равенстве — как в дереве проектов. Действует и для «Все», и для каждого фильтра.
  const items = useMemo(() => {
    const treeIndex = new Map<string, number>();
    const walk = (pid: string | null) => {
      for (const c of site.childrenOf(pid, { includeHidden: true })) {
        treeIndex.set(c.id, treeIndex.size);
        walk(c.id);
      }
    };
    walk(null);
    const latest = (id: string) =>
      site
        .versionsOf(id)
        .map((v) => v.released_ts || v.released_at || "")
        .reduce((a, b) => (b > a ? b : a), "");
    return site.nodes
      .filter(
        (n) =>
          n.kind === "project" &&
          !n.hidden &&
          (site.filesOf(n.id).length > 0 || n.links.some((l) => types.isDownload(l.kind))),
      )
      .map((n) => ({ n, at: latest(n.id) }))
      .sort(
        (a, b) =>
          b.at.localeCompare(a.at) ||
          (treeIndex.get(a.n.id) ?? 0) - (treeIndex.get(b.n.id) ?? 0),
      )
      .map((x) => x.n);
  }, [site, types]);
  const platformOrder = useSetting<string[]>("platform_order", []);
  // Одинаковые платформы объединяются в один фильтр, даже если написаны с разным регистром
  const norm = (p: string) => p.trim().toLowerCase();
  const platforms = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of items.flatMap((i) => i.platforms))
      if (!m.has(norm(p))) m.set(norm(p), displayPlatform(p));
    return orderPlatforms([...m.values()], platformOrder);
  }, [items, platformOrder]);
  const needle = q.trim().toLowerCase();
  const shown = items.filter(
    (i) =>
      (!platform || i.platforms.some((p) => norm(p) === norm(platform))) &&
      (!needle || `${i.title} ${i.tagline}`.toLowerCase().includes(needle)),
  );

  return (
    <div>
      <PageHeader eyebrow="Бесплатно" title="Ресурсы">
        Программы, игры, шейдеры и утилиты, которые можно скачать прямо с сайта.
      </PageHeader>

      <div className="sticky top-14 z-30 -mx-4 space-y-3 bg-background/85 px-4 py-3 backdrop-blur-xl md:mx-0 md:px-0">
        <label className="flex items-center gap-2 rounded-xl border border-border bg-card/50 px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск ресурсов"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0 md:[mask-image:none]">
          <Chip active={!platform} onClick={() => setPlatform(null)}>
            Все
          </Chip>
          {platforms.map((p) => (
            <Chip
              key={p}
              active={platform === p}
              onClick={() => setPlatform(p === platform ? null : p)}
            >
              {p}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {shown.map((n) => {
          const path = site.pathOf(n.id).slice(0, -1);
          return (
            <div key={n.id} className="min-w-0 rounded-2xl border border-border bg-card/40 p-4">
              <Link to="/p/$slug" params={{ slug: n.slug }} className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10">
                  <NodeIcon name={n.icon} className="h-5 w-5 text-primary" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{n.title}</span>
                    <StatusBadge status={n.status} />
                    <VersionTag version={site.currentVersion(n.id)} />
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {path.map((p) => p.title).join(" / ")}
                    {n.platforms.length > 0 && ` · ${n.platforms.join(", ")}`}
                  </span>
                </span>
              </Link>
              {n.tagline && <p className="mt-3 text-sm text-muted-foreground">{n.tagline}</p>}
              <div className="mt-3 space-y-3">
                <FileList files={site.filesOf(n.id)} />
                <LinkButtons
                  nodeId={n.id}
                  links={n.links.filter((l) => types.isDownload(l.kind))}
                />
              </div>
            </div>
          );
        })}
        {shown.length === 0 && (
          <p className="py-10 text-center text-muted-foreground">Ничего не найдено</p>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
