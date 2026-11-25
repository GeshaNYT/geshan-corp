import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Download } from "lucide-react";
import { NodeIcon } from "@/components/NodeIcon";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { plural } from "@/components/NodeCards";
import { useSite, type SiteIndex } from "@/lib/data";
import type { SiteNode } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Проекты — Geshan Corporation" }] }),
  component: Projects,
});

function Projects() {
  const site = useSite();
  const roots = site.childrenOf(null);
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allSections = site.nodes.filter((n) => n.kind === "section" && !n.hidden).map((n) => n.id);
  const allOpen = allSections.length > 0 && allSections.every((id) => open.has(id));

  return (
    <div>
      <PageHeader
        eyebrow="Структура"
        title={
          <>
            Экосистема <span className="text-gold-gradient">Geshan</span>
          </>
        }
      >
        Нажми на раздел, чтобы раскрыть его подразделы и проекты.
      </PageHeader>

      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(allOpen ? new Set() : new Set(allSections))}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          {allOpen ? (
            <ChevronsDownUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronsUpDown className="h-3.5 w-3.5" />
          )}
          {allOpen ? "Свернуть всё" : "Раскрыть всё"}
        </button>
      </div>

      <div className="space-y-3">
        {roots.map((n) => (
          <Branch key={n.id} node={n} depth={0} site={site} open={open} toggle={toggle} />
        ))}
      </div>
    </div>
  );
}

function Branch({
  node,
  depth,
  site,
  open,
  toggle,
}: {
  node: SiteNode;
  depth: number;
  site: SiteIndex;
  open: Set<string>;
  toggle: (id: string) => void;
}) {
  if (node.kind === "project") return <ProjectRow node={node} site={site} root={depth === 0} />;

  const kids = site.childrenOf(node.id);
  const isOpen = open.has(node.id);
  const count = site.countProjects(node.id);
  const subs = kids.filter((k) => k.kind === "section").length;
  const meta = [
    subs > 0 && `${subs} ${plural(subs, "подраздел", "подраздела", "подразделов")}`,
    count > 0 && `${count} ${plural(count, "проект", "проекта", "проектов")}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border transition",
        depth === 0 ? "bg-card/40 backdrop-blur" : "bg-background/40",
        isOpen ? "border-primary/50" : "border-border",
      )}
    >
      <button
        type="button"
        onClick={() => toggle(node.id)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10",
            depth === 0 ? "h-12 w-12" : "h-10 w-10",
          )}
        >
          <NodeIcon
            name={node.icon}
            className={cn("text-primary", depth === 0 ? "h-6 w-6" : "h-5 w-5")}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn("block truncate", depth === 0 ? "font-display text-2xl" : "font-medium")}
          >
            {node.title}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {meta || node.tagline}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition",
            isOpen && "rotate-180 text-primary",
          )}
        />
      </button>

      {isOpen && (
        <div className="space-y-2 px-3 pb-3">
          {node.tagline && (
            <p className="px-1 pb-1 text-sm text-muted-foreground">{node.tagline}</p>
          )}
          {kids.map((k) => (
            <Branch key={k.id} node={k} depth={depth + 1} site={site} open={open} toggle={toggle} />
          ))}
          {kids.length === 0 && (
            <p className="px-1 py-2 text-sm text-muted-foreground">Пока пусто</p>
          )}
          <Link
            to="/p/$slug"
            params={{ slug: node.slug }}
            className="inline-flex items-center gap-1 px-1 pt-1 text-xs text-primary hover:underline"
          >
            Страница раздела <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

function ProjectRow({ node, site, root }: { node: SiteNode; site: SiteIndex; root: boolean }) {
  const canDownload =
    site.filesOf(node.id).length > 0 ||
    node.links.some((l) => l.kind === "download" || l.kind === "open");
  return (
    <Link
      to="/p/$slug"
      params={{ slug: node.slug }}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-primary/70",
        root ? "bg-card/40 p-4" : "bg-card/50",
      )}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-background/60">
        <NodeIcon name={node.icon} className="h-5 w-5 text-primary" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium">{node.title}</span>
          {canDownload && (
            <Download className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Можно скачать" />
          )}
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <StatusBadge status={node.status} />
          {node.platforms.length > 0 && (
            <span className="truncate text-[11px] text-muted-foreground">
              {node.platforms.join(" · ")}
            </span>
          )}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
