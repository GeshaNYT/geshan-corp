import { Download } from "lucide-react";
import { useSite } from "@/lib/data";
import { LINK_ICON_SET, useLinkTypes } from "@/lib/linkTypes";
import type { SiteNode } from "@/lib/types";

/**
 * Маленький значок рядом с названием проекта.
 * node.badge: "" — автоматически (файлы → «скачать», иначе иконка первой главной кнопки, например «Попробовать»),
 * "none" — без значка, иначе — имя иконки, выбранной вручную.
 */
export function NodeBadge({ node }: { node: SiteNode }) {
  const site = useSite();
  const types = useLinkTypes();
  if (node.kind !== "project") return null;
  const badge = node.badge ?? "";
  if (badge === "none") return null;
  if (badge && LINK_ICON_SET[badge]) {
    const Icon = LINK_ICON_SET[badge];
    return <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />;
  }
  if (site.filesOf(node.id).length > 0)
    return <Download className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Можно скачать" />;
  const link = node.links.find((l) => types.isDownload(l.kind));
  if (!link) return null;
  const Icon = types.icon(link.kind);
  return (
    <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-label={types.get(link.kind).label} />
  );
}
