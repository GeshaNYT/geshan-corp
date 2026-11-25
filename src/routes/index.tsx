import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, FolderTree, Send, Server } from "lucide-react";
import { SectionTitle } from "@/components/PageHeader";
import heroImg from "@/assets/geshan-hero.jpg";
import { NodeCard } from "@/components/NodeCards";
import { ProjectTree } from "@/components/ProjectTree";
import { ServerStatus } from "@/components/ServerStatus";
import { useSite } from "@/lib/data";
import { useChannels } from "@/lib/content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Geshan Corporation — Официальный сайт" },
      {
        name: "description",
        content:
          "Geshan Corporation — экосистема проектов, бесплатные ресурсы, сервер MineCube и сообщество.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: channels } = useChannels();
  const site = useSite();
  const featured = site.nodes
    .filter((n) => n.featured && !n.hidden)
    .sort((a, b) => a.sort - b.sort);
  const totalProjects = site.nodes.filter((n) => n.kind === "project" && !n.hidden).length;
  const totalSections = site.nodes.filter((n) => n.kind === "section" && !n.hidden).length;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative isolate -mx-4 -mt-5 overflow-hidden px-4 pb-10 pt-12 sm:rounded-b-3xl md:mx-0 md:mt-0 md:rounded-3xl md:px-10 md:pt-16">
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35"
          width={1920}
          height={1280}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-primary">Корпорация будущего</p>
        <h1 className="text-5xl leading-[1.02] sm:text-7xl">
          <span className="text-gold-gradient">Geshan</span>
          <br />
          Corporation
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          Экосистема сильных идей, людей и проектов: разработки, игры, ИИ, сервер MineCube и
          бесплатные ресурсы для сообщества.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <FolderTree className="h-4 w-4" /> Все проекты
          </Link>
          <Link
            to="/resources"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-6 py-3 text-sm font-medium backdrop-blur transition hover:border-primary"
          >
            <Download className="h-4 w-4" /> Скачать ресурсы
          </Link>
        </div>
        <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
          <Stat value={totalSections} label="разделов" />
          <Stat value={totalProjects} label="проектов" />
        </div>
      </section>

      {/* Сервер */}
      <section>
        <SectionTitle
          icon={<Server className="h-4 w-4" />}
          title="Сервер MineCube"
          to="/p/minecube"
          more="Подробнее"
        />
        <div className="rounded-3xl border border-border bg-card/40 p-4 backdrop-blur">
          <ServerStatus />
        </div>
      </section>

      {/* Главное */}
      {featured.length > 0 && (
        <section>
          <SectionTitle title="Главное" to="/projects" more="Все разделы" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((n) => (
              <NodeCard key={n.id} node={n} />
            ))}
          </div>
        </section>
      )}

      {/* Проекты деревом */}
      <section>
        <SectionTitle title="Проекты" to="/resources" more="Ресурсы" />
        <ProjectTree />
      </section>

      {/* Каналы */}
      <section>
        <SectionTitle
          icon={<Send className="h-4 w-4" />}
          title="Telegram"
          to="/channels"
          more="Все каналы"
        />
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:px-0">
          {(channels ?? []).map((c) => (
            <a
              key={c.id}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-[70%] snap-start rounded-2xl border border-border bg-card/40 p-4 transition hover:border-primary sm:min-w-[45%] md:min-w-0"
            >
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-primary">{c.handle}</p>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/50 px-4 py-3 backdrop-blur">
      <p className="font-display text-3xl text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
