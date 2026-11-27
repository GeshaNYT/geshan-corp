import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import faviconUrl from "../assets/geshan-gc-logo.jpg";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth";
import { AppShell } from "../components/AppShell";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Страница не найдена</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Такой страницы нет или она была перемещена.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}

// После обновления сайта у открытой вкладки остаются ссылки на старые файлы, которых уже нет.
// Такую ошибку исправляет простая перезагрузка — делаем её сами (не чаще раза в 30 секунд).
const STALE_CHUNK =
  /dynamically imported module|Importing a module script failed|Failed to fetch|Unable to preload CSS|Loading chunk/i;
function reloadOnce(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const last = Number(sessionStorage.getItem("gc:chunk-reload") || 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem("gc:chunk-reload", String(Date.now()));
  } catch {
    /* хранилище недоступно — всё равно перезагрузим */
  }
  window.location.reload();
  return true;
}
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (e) => {
    if (reloadOnce()) e.preventDefault();
  });
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  const stale = STALE_CHUNK.test((error as Error | undefined)?.message ?? "");
  useEffect(() => {
    if (stale && reloadOnce()) return;
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error, stale]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Страница не загрузилась
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Что-то пошло не так. Попробуйте ещё раз или вернитесь на главную.
        </p>
        {stale ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Сайт только что обновился — перезагрузите страницу.
          </p>
        ) : (error as Error | undefined)?.message ? (
          <p className="mt-3 break-words rounded-md bg-muted px-3 py-2 text-left font-mono text-xs text-muted-foreground">
            {(error as Error).message}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Попробовать ещё раз
          </button>
          <a
            href={import.meta.env.BASE_URL}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            На главную
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0f1424" },
      { title: "Geshan Corporation" },
      {
        name: "description",
        content: "Geshan Corporation — проекты, ресурсы, сервер MineCube и сообщество.",
      },
      { name: "author", content: "Geshan Corporation" },
      { property: "og:title", content: "Geshan Corporation" },
      { property: "og:description", content: "Проекты, ресурсы, сервер MineCube и сообщество." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/jpeg", href: faviconUrl },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <AuthProvider>
        <AppShell>
          <Outlet />
        </AppShell>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
