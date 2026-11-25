import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp } from "lucide-react";
import { orderPlatforms, useSaveSetting, useSetting } from "@/lib/content";
import { useSite } from "@/lib/data";

const cap = (p: string) => p.trim().charAt(0).toUpperCase() + p.trim().slice(1);

/** Порядок значков-фильтров на странице «Ресурсы» */
export function PlatformsAdmin() {
  const site = useSite();
  const saved = useSetting<string[]>("platform_order", []);
  const saveSetting = useSaveSetting();
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of site.nodes)
      if (n.kind === "project")
        for (const p of n.platforms)
          if (!m.has(p.trim().toLowerCase())) m.set(p.trim().toLowerCase(), cap(p));
    return orderPlatforms([...m.values()], saved);
  }, [site.nodes, saved]);

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setBusy(true);
    try {
      await saveSetting("platform_order", next);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        В таком порядке значки платформ идут на странице «Ресурсы». Новые платформы сами встают в
        конец.
      </p>
      <div className="space-y-1.5">
        {list.map((p, i) => (
          <div
            key={p}
            className="flex items-center gap-2 rounded-xl border border-border bg-card/40 px-3 py-2"
          >
            <span className="w-6 text-xs text-muted-foreground">{i + 1}</span>
            <span className="flex-1 text-sm">{p}</span>
            <button
              type="button"
              aria-label="Выше"
              disabled={busy || i === 0}
              onClick={() => void move(i, -1)}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground disabled:opacity-25"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Ниже"
              disabled={busy || i === list.length - 1}
              onClick={() => void move(i, 1)}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground disabled:opacity-25"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
