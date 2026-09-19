// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// GitHub Pages builds set GH_PAGES=true (see .github/workflows/deploy.yml).
// Lovable's own preview/publish builds leave it unset, so base stays "/" there
// and the Cloudflare target is untouched. TanStack Start derives the router
// basepath automatically from Vite's `base` via the TSS_ROUTER_BASEPATH define,
// so no manual basename is needed in router.tsx.
const isGitHubPages = process.env.GH_PAGES === "true";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // SPA shell for GitHub Pages: prerenders a static index.html fallback into
    // the client output dir so a static host can serve the app. Only enabled for
    // the GH_PAGES build so Lovable's SSR worker deploy is unaffected.
    ...(isGitHubPages ? { spa: { enabled: true } } : {}),
  },
  vite: {
    // Project site → https://<user>.github.io/geshan-corp/
    base: isGitHubPages ? "/geshan-corp/" : "/",
  },
  // Static prerender for GitHub Pages (applies only outside Lovable builds).
  nitro: isGitHubPages ? { preset: "static" } : undefined,
});
