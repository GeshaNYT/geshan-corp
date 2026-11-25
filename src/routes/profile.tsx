import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LogOut, MessageCircle, Shield } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Профиль — Geshan Corporation" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const auth = useAuth();

  if (auth.demo) return <DemoProfile />;
  if (!auth.ready) return <p className="py-20 text-center text-muted-foreground">Загрузка…</p>;
  if (!auth.user) return <AuthForm />;

  const name = auth.profile?.username || auth.user.email;
  return (
    <div className="mx-auto max-w-md">
      <PageHeader eyebrow="Профиль" title={name ?? "Профиль"} />
      <div className="space-y-3 rounded-3xl border border-border bg-card/40 p-5">
        <Row label="Почта" value={auth.user.email ?? "—"} />
        <Row
          label="Роль"
          value={
            auth.profile?.role === "admin"
              ? "Администратор"
              : auth.profile?.role === "moderator"
                ? "Модератор"
                : "Пользователь"
          }
        />
      </div>
      <div className="mt-4 space-y-2">
        {auth.isAdmin && (
          <Link
            to="/admin"
            className="flex items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary/10 py-3 text-sm text-primary"
          >
            <Shield className="h-4 w-4" /> Админ-панель
          </Link>
        )}
        <button
          type="button"
          onClick={() => void auth.signOut()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm hover:border-red-400 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" /> Выйти
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function AuthForm() {
  const auth = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "in") await auth.signIn(email, password);
      else {
        const r = await auth.signUp(email, password, username);
        if (r.needsConfirm)
          setMsg({ ok: true, text: "Готово! Мы отправили письмо — подтверди почту и войди." });
      }
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <PageHeader eyebrow="Аккаунт" title={mode === "in" ? "Вход" : "Регистрация"} />
      <div className="mb-4 grid grid-cols-2 rounded-xl border border-border p-1">
        {(["in", "up"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-lg py-2 text-sm transition",
              mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {m === "in" ? "Вход" : "Регистрация"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-3">
        {mode === "up" && (
          <Field label="Никнейм" value={username} onChange={setUsername} required minLength={2} />
        )}
        <Field
          label="Почта"
          type="email"
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
        />
        <Field
          label="Пароль"
          type="password"
          value={password}
          onChange={setPassword}
          required
          minLength={6}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
        />
        {msg && (
          <p
            className={cn(
              "rounded-xl p-3 text-sm",
              msg.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300",
            )}
          >
            {msg.text}
          </p>
        )}
        <button
          disabled={busy}
          className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Подожди…" : mode === "in" ? "Войти" : "Создать аккаунт"}
        </button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> или <span className="h-px flex-1 bg-border" />
      </div>
      <button
        type="button"
        disabled
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm text-muted-foreground"
      >
        <MessageCircle className="h-4 w-4" /> Войти через GeLink{" "}
        <span className="text-xs">(скоро)</span>
      </button>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  ...rest
}: { label: string; value: string; onChange: (v: string) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-muted-foreground">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-card/50 px-3 text-sm outline-none transition focus:border-primary"
      />
    </label>
  );
}

function DemoProfile() {
  const auth = useAuth();
  return (
    <div className="mx-auto max-w-md">
      <PageHeader eyebrow="Аккаунт" title="Профиль">
        Регистрация и вход заработают после подключения базы данных Supabase.
      </PageHeader>
      <div className="rounded-3xl border border-primary/40 bg-primary/5 p-5">
        <p className="font-medium text-primary">Демо-режим</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Можно включить админку прямо сейчас и попробовать добавлять разделы и проекты. Изменения
          сохранятся только в этом браузере.
        </p>
        <label className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm">Режим администратора</span>
          <input
            type="checkbox"
            checked={auth.demoAdmin}
            onChange={(e) => auth.setDemoAdmin(e.target.checked)}
            className="h-5 w-5 accent-[var(--primary)]"
          />
        </label>
        {auth.demoAdmin && (
          <Link
            to="/admin"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground"
          >
            <Shield className="h-4 w-4" /> Открыть админ-панель
          </Link>
        )}
      </div>
    </div>
  );
}
