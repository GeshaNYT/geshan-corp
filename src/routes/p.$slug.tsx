import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Pencil } from "lucide-react";
import { FileList, LinkButtons, NodeCard } from "@/components/NodeCards";
import { NodeIcon } from "@/components/NodeIcon";
import { ServerStatus } from "@/components/ServerStatus";
import { StatusBadge } from "@/components/StatusBadge";
import { VersionHistory, VersionTag } from "@/components/Versions";
import { useAuth } from "@/lib/auth";
import { useSite } from "@/lib/data";
import { AdminShortcut } from "@/components/AdminShortcut";
import { DEFAULT_HOWTO, useServers } from "@/lib/servers";
import { STATUS_HINTS } from "@/lib/types";

export const Route = createFileRoute("/p/$slug")({
  component: NodePage,
});

function NodePage() {
  const { slug } = Route.useParams();
  const site = useSite();
  const { isAdmin } = useAuth();
  const node = site.bySlug.get(slug);

  if (!node || (node.hidden && !isAdmin)) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-4xl">{site.loading ? "Загрузка…" : "Не найдено"}</p>
        {!site.loading && (
          <Link to="/projects" className="mt-4 inline-block text-primary hover:underline">
            ← Ко всем проектам
          </Link>
        )}
      </div>
    );
  }

  const path = site.pathOf(node.id);
  const kids = site.childrenOf(node.id, { includeHidden: isAdmin });
  const subsections = kids.filter((k) => k.kind === "section");
  const projects = kids.filter((k) => k.kind === "project");
  const files = site.filesOf(node.id);
  const paragraphs = node.description.split(/\n{2,}/).filter(Boolean);

  return (
    <article>
      {/* Хлебные крошки */}
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link to="/projects" className="hover:text-primary">
          Проекты
        </Link>
        {path.slice(0, -1).map((p) => (
          <span key={p.id} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <Link to="/p/$slug" params={{ slug: p.slug }} className="hover:text-primary">
              {p.title}
            </Link>
          </span>
        ))}
      </nav>

      <header className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-primary/40 bg-background/50">
            <NodeIcon name={node.icon} className="h-7 w-7 text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-4xl leading-tight sm:text-5xl">
              <span className="text-gold-gradient">{node.title}</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {node.kind === "project" && <StatusBadge status={node.status} />}
              <VersionTag version={site.currentVersion(node.id)} />
              {node.hidden && (
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                  Скрыт
                </span>
              )}
              {node.platforms.map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-background/50 px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
          {isAdmin && (
            <Link
              to="/admin"
              search={{ edit: node.id }}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-background/50 hover:border-primary hover:text-primary"
              aria-label="Редактировать"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          )}
        </div>
        {node.tagline && <p className="relative mt-4 text-muted-foreground">{node.tagline}</p>}
        {node.kind === "project" && node.status !== "released" && (
          <p className="relative mt-2 text-xs text-muted-foreground">{STATUS_HINTS[node.status]}</p>
        )}
      </header>

      {node.cover_url && (
        <img
          src={node.cover_url}
          alt=""
          className="mt-4 aspect-video w-full rounded-3xl border border-border object-cover"
        />
      )}

      <div className="mt-6 space-y-6">
        {node.slug === "minecube" && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-display text-2xl">
              Статус серверов <AdminShortcut tab="servers" label="Настроить серверы" />
            </h2>
            <ServerStatus detailed />
            <JoinHelp />
          </section>
        )}

        {(files.length > 0 || node.links.length > 0) && (
          <section className="space-y-3">
            <FileList files={files} />
            <LinkButtons links={node.links} nodeId={node.id} />
          </section>
        )}

        <VersionHistory versions={site.versionsOf(node.id)} />

        {paragraphs.length > 0 && (
          <section className="space-y-3 text-[15px] leading-relaxed text-foreground/90">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </section>
        )}

        {node.gallery.length > 0 && (
          <section className="-mx-4 no-scrollbar flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
            {node.gallery.map((src) => (
              <a
                key={src}
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 snap-start"
              >
                <img
                  src={src}
                  alt=""
                  className="h-48 rounded-2xl border border-border object-cover sm:h-60"
                />
              </a>
            ))}
          </section>
        )}

        {subsections.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-2xl">Подразделы</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subsections.map((k) => (
                <NodeCard key={k.id} node={k} />
              ))}
            </div>
          </section>
        )}

        {projects.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-2xl">Проекты</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((k) => (
                <NodeCard key={k.id} node={k} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

function JoinHelp() {
  const servers = useServers().filter((x) => !x.hidden);
  if (!servers.length) return null;
  return (
    <div className="mt-3 space-y-2 rounded-2xl border border-border bg-card/40 p-4 text-sm text-muted-foreground">
      <p className="text-xs uppercase tracking-[0.2em] text-primary">Как зайти</p>
      {servers.map((srv) => (
        <p key={srv.id} className="whitespace-pre-line">
          <span className="text-foreground">{srv.label}:</span>{" "}
          {srv.howto?.trim() || DEFAULT_HOWTO[srv.edition]}
        </p>
      ))}
    </div>
  );
}
