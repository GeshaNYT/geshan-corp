import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChevronRight,
  FolderTree,
  Home,
  Download,
  MessagesSquare,
  User,
  Menu,
  Server,
  Send,
  Shield,
  Info,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NodeIcon } from "@/components/NodeIcon";
import { SiteFooter } from "@/components/SiteFooter";
import logoImg from "@/assets/geshan-gc-logo.jpg";
import { useSite } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { SiteNode } from "@/lib/types";

const TABS = [
  { to: "/", label: "Главная", icon: Home, exact: true },
  { to: "/projects", label: "Проекты", icon: FolderTree },
  { to: "/resources", label: "Ресурсы", icon: Download },
  { to: "/forum", label: "Форум", icon: MessagesSquare },
  { to: "/profile", label: "Профиль", icon: User },
] as const;

function isActive(path: string, to: string, exact?: boolean) {
  if (exact) return path === to || path === "";
  if (to === "/projects") return path.startsWith("/projects") || path.startsWith("/p/");
  return path.startsWith(to);
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const routerPath = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin } = useAuth();
  // Сайт отдаётся как SPA-оболочка, отрендеренная для «/». До гидратации не подсвечиваем вкладки,
  // иначе React оставит подсветку «Главной» на любой странице.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const path = mounted ? routerPath : "\0";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Верхняя панель */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <img
              src={logoImg}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg border border-primary/30 object-cover"
            />
            <span className="truncate font-display text-lg tracking-wide">Geshan Corporation</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {TABS.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm transition",
                  isActive(path, t.to, "exact" in t ? t.exact : false)
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Открыть меню"
            className="ml-auto grid h-10 w-10 place-items-center rounded-xl border border-border text-foreground transition hover:border-primary md:ml-2"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-10 pt-5">{children}</main>
      <SiteFooter />

      {/* Нижняя панель (телефон) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-md grid-cols-5">
          {TABS.map((t) => {
            const active = isActive(path, t.to, "exact" in t ? t.exact : false);
            return (
              <Link key={t.to} to={t.to} className="flex flex-col items-center gap-1 py-2.5">
                <span
                  className={cn(
                    "grid h-8 w-12 place-items-center rounded-full transition",
                    active && "bg-primary/15",
                  )}
                >
                  <t.icon
                    className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")}
                  />
                </span>
                <span
                  className={cn("text-[11px]", active ? "text-primary" : "text-muted-foreground")}
                >
                  {t.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <MenuSheet open={open} onOpenChange={setOpen} isAdmin={isAdmin} />
    </div>
  );
}

function MenuSheet({
  open,
  onOpenChange,
  isAdmin,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isAdmin: boolean;
}) {
  const site = useSite();
  const close = () => onOpenChange(false);
  const roots = site.childrenOf(null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[86vw] max-w-sm overflow-y-auto border-border bg-background p-0"
      >
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="font-display text-2xl">
            <span className="text-gold-gradient">Меню</span>
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-6 p-4">
          <div className="space-y-1">
            <MenuLink to="/p/minecube" icon={<Server className="h-4 w-4" />} onClick={close}>
              Сервер MineCube
            </MenuLink>
            <MenuLink to="/channels" icon={<Send className="h-4 w-4" />} onClick={close}>
              Каналы
            </MenuLink>
            <MenuLink to="/about" icon={<Info className="h-4 w-4" />} onClick={close}>
              О корпорации
            </MenuLink>
            {isAdmin && (
              <MenuLink to="/admin" icon={<Shield className="h-4 w-4" />} onClick={close} accent>
                Админ-панель
              </MenuLink>
            )}
          </div>
          <div>
            <p className="mb-2 px-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Все разделы
            </p>
            <div className="space-y-0.5">
              {roots.map((n) => (
                <TreeItem key={n.id} node={n} depth={0} onNavigate={close} />
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TreeItem({
  node,
  depth,
  onNavigate,
}: {
  node: SiteNode;
  depth: number;
  onNavigate: () => void;
}) {
  const site = useSite();
  const kids = site.childrenOf(node.id).filter((c) => c.kind === "section");
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center" style={{ paddingLeft: depth * 14 }}>
        <Link
          to="/p/$slug"
          params={{ slug: node.slug }}
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-card"
        >
          <NodeIcon name={node.icon} className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{node.title}</span>
        </Link>
        {kids.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Свернуть" : "Развернуть"}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-card"
          >
            <ChevronRight className={cn("h-4 w-4 transition", open && "rotate-90")} />
          </button>
        )}
      </div>
      {open &&
        kids.map((k) => <TreeItem key={k.id} node={k} depth={depth + 1} onNavigate={onNavigate} />)}
    </div>
  );
}

function MenuLink({
  to,
  icon,
  children,
  onClick,
  accent,
}: {
  to: string;
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-card",
        accent && "border border-primary/40 bg-primary/10 text-primary",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
