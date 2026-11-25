import { useRef, useState } from "react";
import { toast } from "sonner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Loader2, LogOut, MessageCircle, Shield } from "lucide-react";
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
  if (auth.recovery && auth.user) return <NewPassword />;
  if (!auth.user) return <AuthForm />;

  return <Account key={auth.profile?.id ?? "loading"} />;
}

function Account() {
  const auth = useAuth();
  const user = auth.user!;
  const profile = auth.profile;
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(ok);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const name = profile?.username || user.email || "Профиль";
  const role =
    profile?.role === "admin"
      ? "Администратор"
      : profile?.role === "moderator"
        ? "Модератор"
        : "Пользователь";
  const changed =
    username.trim() !== (profile?.username ?? "") || bio.trim() !== (profile?.bio ?? "");

  return (
    <div className="mx-auto max-w-md space-y-4">
      {/* Шапка профиля */}
      <div className="flex items-center gap-4 rounded-3xl border border-border bg-card/40 p-5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-primary/50 bg-background"
          aria-label="Сменить аватарку"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center font-display text-3xl text-primary">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition group-hover:opacity-100">
            {busy === "avatar" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f)
              void run(
                "avatar",
                async () => auth.updateProfile({ avatar_url: await auth.uploadAvatar(f) }),
                "Аватарка обновлена",
              );
          }}
        />
        <div className="min-w-0">
          <p className="truncate font-display text-3xl">{name}</p>
          <p className="text-xs text-primary">{role}</p>
          {profile?.bio && (
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{profile.bio}</p>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-1 text-xs text-muted-foreground hover:text-primary"
          >
            {profile?.avatar_url ? "Сменить аватарку" : "Добавить аватарку"}
          </button>
        </div>
      </div>

      {auth.isAdmin && (
        <Link
          to="/admin"
          className="flex items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary/10 py-3 text-sm text-primary"
        >
          <Shield className="h-4 w-4" /> Админ-панель
        </Link>
      )}

      {/* Имя и описание */}
      <Card title="Имя и описание">
        <Field label="Никнейм" value={username} onChange={setUsername} maxLength={32} />
        <label className="block">
          <span className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>О себе</span>
            <span>{bio.length}/300</span>
          </span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 300))}
            rows={3}
            placeholder="Пара слов о себе"
            className="w-full rounded-xl border border-border bg-card/50 p-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <SaveBtn
          disabled={!changed}
          busy={busy === "profile"}
          onClick={() =>
            void run(
              "profile",
              () => auth.updateProfile({ username: username.trim(), bio: bio.trim() }),
              "Сохранено",
            )
          }
        />
      </Card>

      {/* Почта */}
      <Card title="Почта">
        <Field label="Почта" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <p className="text-xs text-muted-foreground">
          Придут письма на старую и новую почту — нужно подтвердить смену по ссылкам в обоих.
        </p>
        <SaveBtn
          label="Сменить почту"
          disabled={
            !email.trim() || email.trim().toLowerCase() === (user.email ?? "").toLowerCase()
          }
          busy={busy === "email"}
          onClick={() =>
            void run(
              "email",
              () => auth.changeEmail(email.trim()),
              "Письма отправлены — проверь почту",
            )
          }
        />
      </Card>

      {/* Пароль */}
      <Card title="Пароль">
        <Field
          label="Новый пароль"
          type="password"
          value={password}
          onChange={setPassword}
          minLength={6}
          autoComplete="new-password"
        />
        <SaveBtn
          label="Сменить пароль"
          disabled={password.length < 6}
          busy={busy === "password"}
          onClick={() =>
            void run(
              "password",
              async () => {
                await auth.changePassword(password);
                setPassword("");
              },
              "Пароль изменён",
            )
          }
        />
      </Card>

      <button
        type="button"
        onClick={() => void auth.signOut()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm hover:border-red-400 hover:text-red-300"
      >
        <LogOut className="h-4 w-4" /> Выйти
      </button>
    </div>
  );
}

function NewPassword() {
  const auth = useAuth();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) return toast.error("Пароли не совпадают");
    setBusy(true);
    try {
      await auth.changePassword(password);
      toast.success("Пароль изменён — ты вошёл в аккаунт");
      auth.finishRecovery();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mx-auto max-w-md">
      <PageHeader eyebrow="Аккаунт" title="Новый пароль" />
      <form onSubmit={submit} className="space-y-3">
        <Field
          label="Новый пароль"
          type="password"
          value={password}
          onChange={setPassword}
          required
          minLength={6}
          autoComplete="new-password"
        />
        <Field
          label="Повтори пароль"
          type="password"
          value={password2}
          onChange={setPassword2}
          required
          minLength={6}
          autoComplete="new-password"
        />
        <button
          disabled={busy}
          className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Подожди…" : "Сохранить пароль"}
        </button>
      </form>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card/40 p-5">
      <h2 className="font-sans text-sm font-semibold tracking-normal">{title}</h2>
      {children}
    </section>
  );
}

function SaveBtn({
  label = "Сохранить",
  disabled,
  busy,
  onClick,
}: {
  label?: string;
  disabled?: boolean;
  busy?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition disabled:opacity-40"
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </button>
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
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
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
      if (mode === "reset") {
        await auth.sendPasswordReset(email);
        setMsg({
          ok: true,
          text: "Если такой аккаунт есть, мы отправили письмо со ссылкой для сброса пароля.",
        });
      } else if (mode === "in") await auth.signIn(email, password);
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
      <PageHeader
        eyebrow="Аккаунт"
        title={mode === "in" ? "Вход" : mode === "up" ? "Регистрация" : "Сброс пароля"}
      />
      <div className="mb-4 grid grid-cols-2 rounded-xl border border-border p-1">
        {(["in", "up"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setMsg(null);
            }}
            className={cn(
              "rounded-lg py-2 text-sm transition",
              mode === m || (m === "in" && mode === "reset")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground",
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
        {mode === "reset" ? (
          <p className="text-sm text-muted-foreground">
            Введи почту аккаунта — пришлём ссылку, по которой можно задать новый пароль.
          </p>
        ) : (
          <Field
            label="Пароль"
            type="password"
            value={password}
            onChange={setPassword}
            required
            minLength={6}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
          />
        )}
        {mode !== "up" && (
          <button
            type="button"
            onClick={() => {
              setMode(mode === "reset" ? "in" : "reset");
              setMsg(null);
            }}
            className="text-xs text-primary hover:underline"
          >
            {mode === "reset" ? "← Назад ко входу" : "Забыли пароль?"}
          </button>
        )}
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
          {busy
            ? "Подожди…"
            : mode === "in"
              ? "Войти"
              : mode === "up"
                ? "Создать аккаунт"
                : "Отправить ссылку"}
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
