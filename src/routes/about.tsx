import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "О корпорации — Geshan Corporation" }] }),
  component: About,
});

const VALUES = [
  { t: "Видение", d: "Создавать пространство, где идеи превращаются в реальные проекты." },
  { t: "Миссия", d: "Объединять единомышленников и развивать новые форматы коммуникации." },
  { t: "Ценности", d: "Прозрачность, скорость, качество и уважение к сообществу." },
];

function About() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="О корпорации" title="Глобальная экосистема и сообщество">
        Geshan Corporation — масштабное пространство, объединяющее технологии, творчество и людей.
        Фундамент всей нашей деятельности —{" "}
        <span className="text-primary">Geshan&rsquo;s Community</span>, динамичное сообщество,
        которое стирает границы между проектами.
      </PageHeader>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {VALUES.map((v) => (
          <div key={v.t} className="rounded-2xl border border-border bg-card/40 p-5">
            <h3 className="mb-2 text-2xl text-primary">{v.t}</h3>
            <p className="text-sm text-muted-foreground">{v.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
