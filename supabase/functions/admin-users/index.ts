// Управление пользователями из админки сайта. Доступно только администраторам.
// Действия: list, set_email, set_role, ban, unban, delete.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, service, { auth: { persistSession: false } });

  // Кто вызывает — проверяем по токену и роли в profiles
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: who, error: whoErr } = await admin.auth.getUser(token);
  if (whoErr || !who.user) return json({ error: "Нужно войти" }, 401);
  const { data: me } = await admin.from("profiles").select("role").eq("id", who.user.id).maybeSingle();
  if (me?.role !== "admin") return json({ error: "Только для администраторов" }, 403);

  let body: { action?: string; id?: string; email?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Неверный запрос" }, 400);
  }
  const { action, id } = body;
  const self = id === who.user.id;

  try {
    switch (action) {
      case "list": {
        const users: unknown[] = [];
        for (let page = 1; page <= 20; page++) {
          const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
          if (error) throw error;
          users.push(...data.users);
          if (data.users.length < 1000) break;
        }
        const { data: profiles } = await admin.from("profiles").select("id, username, avatar_url, role, bio");
        const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
        return json({
          users: (users as Array<Record<string, any>>).map((u) => ({
            id: u.id,
            email: u.email,
            confirmed: Boolean(u.email_confirmed_at),
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            banned_until: u.banned_until ?? null,
            username: byId.get(u.id)?.username ?? null,
            avatar_url: byId.get(u.id)?.avatar_url ?? null,
            role: byId.get(u.id)?.role ?? "user",
          })),
        });
      }
      case "set_email": {
        const email = String(body.email ?? "").trim().toLowerCase();
        if (!id || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Неверная почта" }, 400);
        const { error } = await admin.auth.admin.updateUserById(id, { email, email_confirm: true });
        if (error) throw error;
        return json({ ok: true });
      }
      case "set_role": {
        const role = body.role;
        if (!id || !["user", "moderator", "admin"].includes(String(role))) return json({ error: "Неверная роль" }, 400);
        if (self && role !== "admin") return json({ error: "Нельзя снять права админа с самого себя" }, 400);
        const { error } = await admin.from("profiles").update({ role }).eq("id", id);
        if (error) throw error;
        return json({ ok: true });
      }
      case "ban":
      case "unban": {
        if (!id) return json({ error: "Нет пользователя" }, 400);
        if (self) return json({ error: "Нельзя заблокировать самого себя" }, 400);
        const { error } = await admin.auth.admin.updateUserById(id, {
          ban_duration: action === "ban" ? "876000h" : "none",
        });
        if (error) throw error;
        return json({ ok: true });
      }
      case "delete": {
        if (!id) return json({ error: "Нет пользователя" }, 400);
        if (self) return json({ error: "Нельзя удалить самого себя" }, 400);
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) throw error;
        return json({ ok: true });
      }
      default:
        return json({ error: "Неизвестное действие" }, 400);
    }
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    if (/already been registered|already exists/i.test(msg)) return json({ error: "Эта почта уже занята" }, 400);
    return json({ error: msg }, 500);
  }
});
