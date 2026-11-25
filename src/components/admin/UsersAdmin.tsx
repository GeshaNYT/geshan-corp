import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Ban,
  Loader2,
  Mail,
  MoreVertical,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  email: string;
  confirmed: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
  username: string | null;
  avatar_url: string | null;
  role: "user" | "moderator" | "admin";
}

const ROLE_LABELS = {
  user: "Пользователь",
  moderator: "Модератор",
  admin: "Администратор",
} as const;

async function call<T = { ok: boolean }>(body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error("База не подключена");
  const { data, error } = await supabase.functions.invoke("admin-users", { body });
  if (error) {
    // Достаём текст ошибки из ответа функции
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      const j = await ctx.json().catch(() => null);
      if (j?.error) throw new Error(j.error);
    }
    throw new Error(error.message);
  }
  return data as T;
}

const fmtDate = (s: string | null) =>
  s
    ? new Date(s).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })
    : "—";

export function UsersAdmin() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const list = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await call<{ users: AdminUser[] }>({ action: "list" })).users,
  });

  const act = async (u: AdminUser, body: Record<string, unknown>, ok: string) => {
    setBusyId(u.id);
    try {
      await call({ ...body, id: u.id });
      await qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(ok);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const needle = q.trim().toLowerCase();
  const users = (list.data ?? [])
    .filter((u) => !needle || `${u.email} ${u.username ?? ""}`.toLowerCase().includes(needle))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card/50 px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по нику или почте"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <button
          type="button"
          onClick={() => void list.refetch()}
          aria-label="Обновить"
          className="grid h-11 w-11 place-items-center rounded-xl border border-border text-muted-foreground hover:text-primary"
        >
          <RefreshCw className={cn("h-4 w-4", list.isFetching && "animate-spin")} />
        </button>
      </div>

      {list.isLoading && (
        <p className="py-8 text-center text-sm text-muted-foreground">Загрузка…</p>
      )}
      {list.error && (
        <p className="py-8 text-center text-sm text-red-300">{(list.error as Error).message}</p>
      )}
      {list.data && (
        <p className="mb-2 text-xs text-muted-foreground">
          Всего аккаунтов: {list.data.length}
          {needle && ` · найдено: ${users.length}`}
        </p>
      )}

      <div className="space-y-2">
        {users.map((u) => {
          const banned = Boolean(u.banned_until && new Date(u.banned_until) > new Date());
          const isMe = u.id === me?.id;
          const name = u.username || u.email.split("@")[0];
          return (
            <div
              key={u.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3",
                banned && "opacity-60",
              )}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-primary/40 bg-background">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-lg text-primary">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-sm">{name}</span>
                  {isMe && <span className="text-[10px] text-muted-foreground">(это ты)</span>}
                  {u.role !== "user" && (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                      {ROLE_LABELS[u.role]}
                    </span>
                  )}
                  {banned && (
                    <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] text-red-300">
                      Заблокирован
                    </span>
                  )}
                  {!u.confirmed && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      почта не подтверждена
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                <span className="block text-[11px] text-muted-foreground">
                  с {fmtDate(u.created_at)} · заходил {fmtDate(u.last_sign_in_at)}
                </span>
              </span>
              {busyId === u.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Действия"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() => {
                        const email = window.prompt(`Новая почта для ${name}:`, u.email);
                        if (email && email.trim() !== u.email)
                          void act(u, { action: "set_email", email }, "Почта изменена");
                      }}
                    >
                      <Mail className="mr-2 h-4 w-4" /> Сменить почту
                    </DropdownMenuItem>
                    {(["user", "moderator", "admin"] as const)
                      .filter((r) => r !== u.role && !(isMe && r !== "admin"))
                      .map((r) => (
                        <DropdownMenuItem
                          key={r}
                          onClick={() => {
                            if (
                              r === "admin" &&
                              !window.confirm(`Дать ${name} полные права администратора?`)
                            )
                              return;
                            void act(
                              u,
                              { action: "set_role", role: r },
                              `Теперь: ${ROLE_LABELS[r]}`,
                            );
                          }}
                        >
                          {r === "user" ? (
                            <UserCheck className="mr-2 h-4 w-4" />
                          ) : (
                            <ShieldCheck className="mr-2 h-4 w-4" />
                          )}
                          Сделать: {ROLE_LABELS[r]}
                        </DropdownMenuItem>
                      ))}
                    {!isMe && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            if (banned) void act(u, { action: "unban" }, "Разблокирован");
                            else if (window.confirm(`Заблокировать ${name}? Он не сможет войти.`))
                              void act(u, { action: "ban" }, "Заблокирован");
                          }}
                        >
                          <Ban className="mr-2 h-4 w-4" />{" "}
                          {banned ? "Разблокировать" : "Заблокировать"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-300 focus:text-red-300"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Удалить аккаунт ${name} (${u.email}) навсегда? Это нельзя отменить.`,
                              )
                            )
                              void act(u, { action: "delete" }, "Аккаунт удалён");
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Удалить аккаунт
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
