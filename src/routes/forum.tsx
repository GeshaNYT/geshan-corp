import { createFileRoute } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/forum")({
  head: () => ({ meta: [{ title: "Форум — Geshan Corporation" }] }),
  component: Forum,
});

const PLANNED = [
  "Новости и анонсы",
  "MineCube: обсуждения и жалобы",
  "Помощь по проектам",
  "Идеи и предложения",
  "Свободное общение",
];

function Forum() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Сообщество" title="Форум">
        Форум скоро откроется. Вход будет общим с сайтом, в том числе через GeLink.
      </PageHeader>
      <div className="space-y-2">
        {PLANNED.map((c) => (
          <div
            key={c}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card/40 p-4 opacity-70"
          >
            <MessagesSquare className="h-5 w-5 text-primary" />
            <span className="flex-1">{c}</span>
            <span className="text-xs text-muted-foreground">скоро</span>
          </div>
        ))}
      </div>
    </div>
  );
}
