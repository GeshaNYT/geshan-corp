import { useEffect, useState } from "react";
import { Download, FlaskConical } from "lucide-react";
import { GECARDS_LINKS, GECARDS_PLATFORMS } from "@/config/gecards";

async function detectLink(): Promise<string> {
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string; getHighEntropyValues?: (h: string[]) => Promise<{ architecture?: string }> };
  };
  const ua = navigator.userAgent.toLowerCase();
  const plat = (nav.userAgentData?.platform || navigator.platform || "").toLowerCase();
  if (plat.includes("win") || ua.includes("windows")) return GECARDS_LINKS.windows;
  if (plat.includes("mac") || ua.includes("mac os")) {
    try {
      const h = await nav.userAgentData?.getHighEntropyValues?.(["architecture"]);
      if (h?.architecture === "x86") return GECARDS_LINKS.macIntel;
    } catch {
      /* ignore */
    }
    return GECARDS_LINKS.macArm;
  }
  if (plat.includes("linux") || ua.includes("linux")) return GECARDS_LINKS.linuxAppImage;
  return GECARDS_LINKS.releases;
}

export function GeCardsCard() {
  const [href, setHref] = useState(GECARDS_LINKS.releases);
  const [more, setMore] = useState(false);
  const [other, setOther] = useState(false);

  useEffect(() => {
    detectLink().then(setHref);
  }, []);

  return (
    <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
      <p className="flex items-center gap-2 text-base">
        <FlaskConical className="h-4 w-4 text-primary" />
        <span className="text-primary">GeCards</span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Карточные игры с друзьями — за одним компьютером, по локальной сети или через интернет.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Платформа: <span className="text-foreground">Windows · macOS · Linux</span>
      </p>
      {more && (
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <p>Игры: Дурак · Покер · Seka · Козёл · Тысяча · Блэкджек · Девятка · Пьяница — с ботами трёх уровней сложности.</p>
          <p>Игра по локальной сети (хосты находятся автоматически) и через интернет (UPnP, проброс портов, Tailscale / ZeroTier / Radmin VPN).</p>
          <p>11 языков и встроенный чат в комнате.</p>
        </div>
      )}
      <button type="button" onClick={() => setMore((v) => !v)} className="mt-1 text-xs text-primary hover:underline">
        {more ? "Свернуть" : "Подробнее"}
      </button>
      <div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Download className="h-4 w-4" /> СКАЧАТЬ
        </a>
      </div>
      <button type="button" onClick={() => setOther((v) => !v)} className="mt-2 text-xs text-muted-foreground hover:text-primary">
        Другие платформы {other ? "▴" : "▾"}
      </button>
      {other && (
        <ul className="mt-1 space-y-1 text-xs">
          {GECARDS_PLATFORMS.map((p) => (
            <li key={p.key}>
              <a href={GECARDS_LINKS[p.key]} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                {p.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
