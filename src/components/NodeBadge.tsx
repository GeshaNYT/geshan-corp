import { Download, type LucideIcon } from "lucide-react";
import { useSite } from "@/lib/data";
import { LINK_ICON_SET, useLinkTypes } from "@/lib/linkTypes";
import type { SiteNode } from "@/lib/types";

/** Разбор поля badge: "" — авто, "none" — без значков, иначе список иконок через запятую */
export function parseBadge(badge: string | undefined): "auto" | "none" | string[] {
  const b = (badge ?? "").trim();
  if (!b) return "auto";
  if (b === "none") return "none";
  return b
    .split(",")
    .map((x) => x.trim())
    .filter((x) => LINK_ICON_SET[x]);
}

/**
 * Значки рядом с названием. Авто: у проекта — по главным кнопкам (скачать, открыть, облако…),
 * у раздела — без значков. Можно выбрать несколько вручную.
 */
export function NodeBadge({ node }: { node: SiteNode }) {
  const site = useSite();
  const types = useLinkTypes();
  const mode = parseBadge(node.badge);
  let icons: { key: string; Icon: LucideIcon; label: string }[] = [];

  if (Array.isArray(mode)) {
    icons = mode.map((name) => ({ key: name, Icon: LINK_ICON_SET[name], label: name }));
  } else if (mode === "auto" && node.kind === "project") {
    const seen = new Set<string>();
    if (site.filesOf(node.id).length > 0) {
      icons.push({ key: "Download", Icon: Download, label: "Можно скачать" });
      seen.add("Download");
    }
    for (const l of node.links) {
      if (!types.isDownload(l.kind)) continue;
      const t = types.get(l.kind);
      if (seen.has(t.icon)) continue;
      seen.add(t.icon);
      icons.push({ key: t.icon, Icon: types.icon(l.kind), label: t.label });
    }
  }

  if (!icons.length) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      {icons.map(({ key, Icon, label }) => (
        <Icon key={key} className="h-3.5 w-3.5 text-primary" aria-label={label} />
      ))}
    </span>
  );
}
