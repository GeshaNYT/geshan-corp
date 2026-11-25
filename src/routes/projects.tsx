import { createFileRoute } from "@tanstack/react-router";
import { NodeCard } from "@/components/NodeCards";
import { PageHeader } from "@/components/PageHeader";
import { useSite } from "@/lib/data";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Проекты — Geshan Corporation" }] }),
  component: Projects,
});

function Projects() {
  const site = useSite();
  const roots = site.childrenOf(null);
  const sections = roots.filter((n) => n.kind === "section");
  const projects = roots.filter((n) => n.kind === "project");

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
        Все направления корпорации. Открой раздел, чтобы увидеть подразделы и проекты.
      </PageHeader>

      <div className="space-y-8">
        {sections.map((s) => {
          const kids = site.childrenOf(s.id);
          return (
            <section key={s.id}>
              <NodeCard node={s} />
              {kids.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-3 border-l border-primary/25 pl-3 sm:grid-cols-2 lg:grid-cols-3">
                  {kids.map((k) => (
                    <NodeCard key={k.id} node={k} compact />
                  ))}
                </div>
              )}
            </section>
          );
        })}
        {projects.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-3xl">Отдельные проекты</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <NodeCard key={p.id} node={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
