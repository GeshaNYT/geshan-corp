// Post-processing for the GitHub Pages build.
// The SPA build emits dist/client/_shell.html; a static host needs index.html
// (and 404.html so deep links fall back to the SPA shell).
import { copyFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

const outDir = join(process.cwd(), "dist", "client");
const shell = join(outDir, "_shell.html");

await access(shell).catch(() => {
  console.error(`[gh-pages] missing ${shell} — did the SPA build run with GH_PAGES=true?`);
  process.exit(1);
});

await copyFile(shell, join(outDir, "index.html"));
await copyFile(shell, join(outDir, "404.html"));
// Stop GitHub Pages' Jekyll from dropping files/folders starting with "_".
await writeFile(join(outDir, ".nojekyll"), "");

console.log("[gh-pages] wrote index.html, 404.html and .nojekyll into dist/client");
