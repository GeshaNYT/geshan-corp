import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Download,
  ExternalLink,
  FileDown,
  Github,
  Globe,
  HardDrive,
  Heart,
  Link2,
  MessageCircle,
  MessagesSquare,
  Music2,
  Send,
  Youtube,
} from "lucide-react";
import { NodeIcon } from "@/components/NodeIcon";
import { StatusBadge } from "@/components/StatusBadge";
import { formatSize, useRefreshSite, useSite } from "@/lib/data";
import { repo } from "@/lib/repo";
import { countLinkClick } from "@/lib/stats";
import type { NodeFile, NodeLink, SiteNode } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NodeCard({ node, compact }: { node: SiteNode; compact?: boolean }) {
  const site = useSite();
  const isSection = node.kind === "section";
  const count = isSection ? site.countProjects(node.id) : 0;
  const downloads =
    !isSection &&
    (site.filesOf(node.id).length > 0 ||
      node.links.some((l) => l.kind === "download" || l.kind === "drive"));

  return (
    <Link
      to="/p/$slug"
      params={{ slug: node.slug }}
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-border bg-card/40 backdrop-blur transition hover:border-primary/70 hover:bg-card/70",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10">
          <NodeIcon name={node.icon} className="h-5 w-5 text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate font-medium text-foreground">
            {node.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {isSection ? (
              <span className="text-xs text-muted-foreground">
                {count > 0
                  ? `${count} ${plural(count, "проект", "проекта", "проектов")}`
                  : "Раздел"}
              </span>
            ) : (
              <StatusBadge status={node.status} />
            )}
            {downloads && (
              <Download className="h-3.5 w-3.5 text-primary" aria-label="Можно скачать" />
            )}
          </div>
        </div>
        <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      {node.tagline && (
        <p className={cn("mt-3 text-sm text-muted-foreground", compact && "line-clamp-2")}>
          {node.tagline}
        </p>
      )}
      {!isSection && node.platforms.length > 0 && (
        <p className="mt-auto pt-3 text-xs text-muted-foreground">{node.platforms.join(" · ")}</p>
      )}
    </Link>
  );
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

const LINK_ICONS: Record<string, typeof Download> = {
  download: Download,
  open: ExternalLink,
  drive: HardDrive,
  telegram: Send,
  gelink: MessageCircle,
  discord: MessagesSquare,
  github: Github,
  youtube: Youtube,
  tiktok: Music2,
  donate: Heart,
  site: Globe,
  other: Link2,
};

export function LinkButtons({ links, nodeId }: { links: NodeLink[]; nodeId: string }) {
  if (!links.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => {
        const Icon = LINK_ICONS[l.kind] ?? ExternalLink;
        const primary = l.kind === "download" || l.kind === "open" || l.kind === "drive";
        return (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (l.kind === "download" || l.kind === "drive") countLinkClick(nodeId, l.id);
            }}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
              primary
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "border border-border hover:border-primary hover:text-primary",
            )}
          >
            <Icon className="h-4 w-4" />
            {l.label}
          </a>
        );
      })}
    </div>
  );
}

export function FileList({ files }: { files: NodeFile[] }) {
  const refresh = useRefreshSite();
  if (!files.length) return null;
  return (
    <div className="space-y-2">
      {files.map((f) => (
        <a
          key={f.id}
          href={f.url}
          target="_blank"
          rel="noopener noreferrer"
          download={f.storage_path ? "" : undefined}
          onClick={() => {
            void repo.countDownload(f.id).then(refresh);
          }}
          className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 transition hover:border-primary"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <FileDown className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{f.label || "Скачать"}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {[
                f.platform,
                f.version && `v${f.version.replace(/^v/i, "")}`,
                formatSize(f.size),
                `${f.downloads} ${plural(f.downloads, "скачивание", "скачивания", "скачиваний")}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
          <Download className="h-4 w-4 text-primary" />
        </a>
      ))}
    </div>
  );
}
