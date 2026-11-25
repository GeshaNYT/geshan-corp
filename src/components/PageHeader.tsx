import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function SectionTitle({
  title,
  to,
  more,
  icon,
}: {
  title: string;
  to?: string;
  more?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="flex items-center gap-2 font-display text-3xl">
        {icon && <span className="text-primary">{icon}</span>}
        {title}
      </h2>
      {to && (
        <Link
          to={to}
          className="inline-flex shrink-0 items-center gap-1 text-sm text-primary hover:underline"
        >
          {more} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="mb-2 text-xs uppercase tracking-[0.3em] text-primary">{eyebrow}</p>}
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-muted-foreground">{children}</div>}
    </div>
  );
}
