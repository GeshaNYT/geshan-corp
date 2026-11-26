import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth";

type Tab = "tree" | "channels" | "buttons" | "servers" | "platforms" | "users";

/** Карандаш для админа: ведёт в нужную вкладку админ-панели. Остальным не виден */
export function AdminShortcut({ tab, label }: { tab: Tab; label: string }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  return (
    <Link
      to="/admin"
      search={{ tab }}
      aria-label={label}
      title={label}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-background/50 text-muted-foreground transition hover:border-primary hover:text-primary"
    >
      <Pencil className="h-3.5 w-3.5" />
    </Link>
  );
}
