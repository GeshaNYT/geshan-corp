import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NodeIcon } from "@/components/NodeIcon";
import { useRefreshSite, useSite } from "@/lib/data";
import { repo } from "@/lib/repo";
import type { SiteNode } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Список разделов, куда можно перенести узел (без него самого и его потомков) */
export function useParentOptions(node?: SiteNode) {
  const site = useSite();
  const banned = new Set(node ? [node.id, ...site.descendantsOf(node.id).map((d) => d.id)] : []);
  const out: { node: SiteNode; depth: number }[] = [];
  const walk = (pid: string | null, depth: number) => {
    for (const c of site.childrenOf(pid, { includeHidden: true })) {
      if (c.kind !== "section" || banned.has(c.id)) continue;
      out.push({ node: c, depth });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

export function MoveDialog({ node, onClose }: { node: SiteNode; onClose: () => void }) {
  const site = useSite();
  const refresh = useRefreshSite();
  const options = useParentOptions(node);
  const [target, setTarget] = useState<string | null>(node.parent_id);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const sort = site
        .childrenOf(target, { includeHidden: true })
        .filter((s) => s.id !== node.id).length;
      await repo.reorder([{ id: node.id, parent_id: target, sort }]);
      await refresh();
      toast.success("Перемещено");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Переместить «{node.title}»</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          <Option
            active={target === null}
            onClick={() => setTarget(null)}
            depth={0}
            icon="Building2"
            title="Корень (верхний уровень)"
          />
          {options.map((o) => (
            <Option
              key={o.node.id}
              active={target === o.node.id}
              onClick={() => setTarget(o.node.id)}
              depth={o.depth + 1}
              icon={o.node.icon}
              title={o.node.title}
            />
          ))}
        </div>
        <button
          type="button"
          disabled={busy || target === node.parent_id}
          onClick={save}
          className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          {busy ? "Перемещаем…" : "Переместить сюда"}
        </button>
      </DialogContent>
    </Dialog>
  );
}

function Option({
  active,
  onClick,
  depth,
  icon,
  title,
}: {
  active: boolean;
  onClick: () => void;
  depth: number;
  icon: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ paddingLeft: 12 + depth * 16 }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg py-2 pr-3 text-left text-sm",
        active ? "bg-primary/15 text-primary" : "hover:bg-card",
      )}
    >
      <NodeIcon name={icon} className="h-4 w-4 shrink-0 text-primary" />
      <span className="truncate">{title}</span>
    </button>
  );
}
