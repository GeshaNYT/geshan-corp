import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ServerStatus } from "@/components/ServerStatus";

export const Route = createFileRoute("/server")({
  head: () => ({ meta: [{ title: "Сервер MineCube — мониторинг" }] }),
  component: ServerPage,
});

function ServerPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Мониторинг"
        title={
          <>
            <span className="text-gold-gradient">MineCube</span> сейчас
          </>
        }
      >
        Состояние серверов Java и Bedrock в реальном времени. Скопируй адрес и заходи.
      </PageHeader>
      <ServerStatus detailed />
      <div className="mt-6 rounded-2xl border border-border bg-card/40 p-4 text-sm text-muted-foreground">
        <p>
          <span className="text-foreground">Java:</span> добавь сервер в «Сетевая игра» →
          «Добавить», адрес <span className="font-mono text-primary">mc.minecube.pro</span>.
        </p>
        <p className="mt-2">
          <span className="text-foreground">Bedrock:</span> «Серверы» → «Добавить сервер», адрес{" "}
          <span className="font-mono text-primary">pe.minecube.pro</span>, порт{" "}
          <span className="font-mono text-primary">25787</span>.
        </p>
      </div>
      <Link
        to="/p/$slug"
        params={{ slug: "minecube" }}
        className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        О сервере и режимах <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
