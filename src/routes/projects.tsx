import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { ProjectTree } from "@/components/ProjectTree";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Проекты — Geshan Corporation" }] }),
  component: Projects,
});

function Projects() {
  return (
    <div>
      <PageHeader
        eyebrow="Структура"
        title={
          <>
            Экосистема <span className="text-gold-gradient">Geshan</span>
          </>
        }
      >
        Нажми на раздел, чтобы раскрыть его подразделы и проекты.
      </PageHeader>
      <ProjectTree />
    </div>
  );
}
