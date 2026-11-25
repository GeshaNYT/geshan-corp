import { STATUS_LABELS, type NodeStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: Record<NodeStatus, string> = {
  released: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  wip: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  frozen: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  soon: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  internal: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: { status: NodeStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
