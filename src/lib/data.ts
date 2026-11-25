import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SEED_FILES, SEED_NODES } from "@/data/seed";
import { repo, type Snapshot } from "./repo";
import type { NodeFile, SiteNode } from "./types";

export const SITE_KEY = ["site"] as const;

const bySort = (a: SiteNode, b: SiteNode) => a.sort - b.sort || a.title.localeCompare(b.title);

export interface SiteIndex {
  nodes: SiteNode[];
  files: NodeFile[];
  loading: boolean;
  error: Error | null;
  byId: Map<string, SiteNode>;
  bySlug: Map<string, SiteNode>;
  childrenOf: (id: string | null, opts?: { includeHidden?: boolean }) => SiteNode[];
  filesOf: (id: string) => NodeFile[];
  pathOf: (id: string) => SiteNode[];
  descendantsOf: (id: string) => SiteNode[];
  countProjects: (id: string) => number;
}

export function useSite(): SiteIndex {
  const q = useQuery<Snapshot>({
    queryKey: SITE_KEY,
    queryFn: () => repo.load(),
    // Пока грузится — показываем стартовый контент, чтобы страница не была пустой
    placeholderData: repo.mode === "demo" ? undefined : { nodes: SEED_NODES, files: SEED_FILES },
    staleTime: 30_000,
  });
  const nodes = q.data?.nodes ?? SEED_NODES;
  const files = q.data?.files ?? SEED_FILES;

  return useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const bySlug = new Map(nodes.map((n) => [n.slug, n]));
    const kids = new Map<string | null, SiteNode[]>();
    for (const n of nodes) {
      const k = n.parent_id && byId.has(n.parent_id) ? n.parent_id : null;
      if (!kids.has(k)) kids.set(k, []);
      kids.get(k)!.push(n);
    }
    for (const list of kids.values()) list.sort(bySort);
    const fileMap = new Map<string, NodeFile[]>();
    for (const f of files) {
      if (!fileMap.has(f.node_id)) fileMap.set(f.node_id, []);
      fileMap.get(f.node_id)!.push(f);
    }
    for (const list of fileMap.values()) list.sort((a, b) => a.sort - b.sort);

    const childrenOf = (id: string | null, opts?: { includeHidden?: boolean }) =>
      (kids.get(id) ?? []).filter((n) => opts?.includeHidden || !n.hidden);

    const descendantsOf = (id: string) => {
      const out: SiteNode[] = [];
      const walk = (pid: string) => {
        for (const c of kids.get(pid) ?? []) {
          out.push(c);
          walk(c.id);
        }
      };
      walk(id);
      return out;
    };

    return {
      nodes,
      files,
      loading: q.isLoading,
      error: (q.error as Error) ?? null,
      byId,
      bySlug,
      childrenOf,
      filesOf: (id) => fileMap.get(id) ?? [],
      pathOf: (id) => {
        const path: SiteNode[] = [];
        let cur = byId.get(id);
        const seen = new Set<string>();
        while (cur && !seen.has(cur.id)) {
          seen.add(cur.id);
          path.unshift(cur);
          cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
        }
        return path;
      },
      descendantsOf,
      countProjects: (id) =>
        descendantsOf(id).filter((n) => n.kind === "project" && !n.hidden).length,
    };
  }, [nodes, files, q.isLoading, q.error]);
}

export function useRefreshSite() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: SITE_KEY });
}

export function slugify(s: string) {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };
  return s
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function formatSize(bytes: number | null | undefined) {
  if (!bytes) return "";
  const u = ["Б", "КБ", "МБ", "ГБ"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}
