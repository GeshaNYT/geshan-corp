import { useEffect } from "react";
import { Download, Eye, Users } from "lucide-react";
import { trackVisit, useOnlineCount, useSiteStats } from "@/lib/stats";

const fmt = (n: number | undefined | null) => (n == null ? "—" : n.toLocaleString("ru-RU"));

export function SiteFooter() {
  const stats = useSiteStats().data;
  const online = useOnlineCount();
  useEffect(() => trackVisit(), []);

  return (
    <footer className="mx-auto max-w-6xl px-4 pb-28 md:pb-10">
      <div className="rounded-3xl border border-border bg-card/40 p-4 backdrop-blur">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            icon={
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400/60" />
            }
            value={fmt(online)}
            label="сейчас на сайте"
          />
          <Stat
            icon={<Users className="h-4 w-4 text-primary" />}
            value={fmt(stats?.users)}
            label="зарегистрировано"
          />
          <Stat
            icon={<Eye className="h-4 w-4 text-primary" />}
            value={fmt(stats?.visitors_total)}
            label={stats ? `посетителей · ${fmt(stats.visitors_today)} сегодня` : "посетителей"}
          />
          <Stat
            icon={<Download className="h-4 w-4 text-primary" />}
            value={fmt(stats?.downloads)}
            label="скачиваний"
          />
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Geshan Corporation
      </p>
    </footer>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-background/50 px-3 py-3">
      <div className="flex items-center gap-2">
        <span className="grid h-4 w-4 place-items-center">{icon}</span>
        <span className="font-display text-2xl leading-none text-foreground">{value}</span>
      </div>
      <p className="mt-1.5 text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}
