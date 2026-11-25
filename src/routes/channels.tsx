import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CHANNELS } from "@/data/seed";

export const Route = createFileRoute("/channels")({
  head: () => ({ meta: [{ title: "Каналы — Geshan Corporation" }] }),
  component: Channels,
});

function Channels() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Telegram" title="Официальные каналы">
        Подписывайтесь, чтобы быть в курсе всех новостей и анонсов корпорации.
      </PageHeader>
      <div className="space-y-3">
        {CHANNELS.map((c) => (
          <a
            key={c.url}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl border border-border bg-card/40 p-4 transition hover:border-primary"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Send className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-medium">
                {c.name} <span className="text-primary">{c.handle}</span>
              </span>
              <span className="block text-sm text-muted-foreground">{c.description}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
