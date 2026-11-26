import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string;
  role: "user" | "moderator" | "admin";
}

interface AuthState {
  ready: boolean;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  /** Демо-режим: без Supabase можно включить админку локально, чтобы попробовать её */
  demo: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<{ needsConfirm: boolean }>;
  signOut: () => Promise<void>;
  setDemoAdmin: (v: boolean) => void;
  updateProfile: (
    patch: Partial<Pick<Profile, "username" | "bio" | "avatar_url">>,
  ) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  changeEmail: (email: string) => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  /** Пользователь пришёл по ссылке «сбросить пароль» из письма */
  recovery: boolean;
  finishRecovery: () => void;
  sendPasswordReset: (email: string) => Promise<void>;
  demoAdmin: boolean;
}

const Ctx = createContext<AuthState | null>(null);
const DEMO_KEY = "geshan:demo-admin";

function ruError(msg: string) {
  if (/invalid login/i.test(msg)) return "Неверная почта или пароль";
  if (/already registered/i.test(msg)) return "Такая почта уже зарегистрирована";
  if (/password should be at least/i.test(msg))
    return "Пароль слишком короткий (минимум 6 символов)";
  if (/email not confirmed/i.test(msg)) return "Подтверди почту по ссылке из письма";
  if (/should be different/i.test(msg)) return "Новый пароль должен отличаться от старого";
  const wait = msg.match(/after (\d+) seconds?/i);
  if (wait) return `Подожди ${wait[1]} сек. и попробуй снова — так защищаемся от спама`;
  if (/rate limit/i.test(msg)) return "Слишком много попыток, подожди немного и попробуй снова";
  if (/unable to validate email|invalid format/i.test(msg)) return "Неверный формат почты";
  if (/user not found/i.test(msg)) return "Пользователь не найден";
  if (/banned/i.test(msg)) return "Аккаунт заблокирован";
  if (/same.*email|email.*same/i.test(msg)) return "Это и так твоя текущая почта";
  if (/network|fetch/i.test(msg)) return "Нет связи с сервером, проверь интернет";
  return msg;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [demoAdmin, setDemoAdminState] = useState(false);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        setDemoAdminState(window.localStorage.getItem(DEMO_KEY) === "1");
      } catch {
        /* ignore */
      }
      return;
    }
    const client = supabase!;
    const loadProfile = async (u: User | null) => {
      setUser(u);
      if (!u) return setProfile(null);
      const { data } = await client.from("profiles").select("*").eq("id", u.id).maybeSingle();
      setProfile((data as Profile) ?? null);
    };
    client.auth.getSession().then(async ({ data }) => {
      await loadProfile(data.session?.user ?? null);
      setReady(true);
    });
    const { data: sub } = client.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      void loadProfile(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    ready,
    user,
    profile,
    demo: !isSupabaseConfigured,
    demoAdmin,
    isAdmin: isSupabaseConfigured ? profile?.role === "admin" : demoAdmin,
    async signIn(email, password) {
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) throw new Error(ruError(error.message));
    },
    async signUp(email, password, username) {
      const { data, error } = await supabase!.auth.signUp({
        email,
        password,
        options: { data: { username }, emailRedirectTo: window.location.href },
      });
      if (error) throw new Error(ruError(error.message));
      return { needsConfirm: !data.session };
    },
    async signOut() {
      if (!supabase) return;
      // Сначала пробуем выйти на сервере; если не вышло (сеть, просроченная сессия) —
      // всё равно стираем сессию в браузере, чтобы после обновления страницы не входило снова
      const { error } = await supabase.auth.signOut();
      if (error) await supabase.auth.signOut({ scope: "local" });
      setUser(null);
      setProfile(null);
      setRecovery(false);
    },
    async updateProfile(patch) {
      if (!supabase || !user) throw new Error("Нужно войти");
      const { data, error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", user.id)
        .select()
        .single();
      if (error) {
        if (/profiles_username_len/.test(error.message))
          throw new Error("Никнейм — от 2 до 32 символов");
        if (/profiles_bio_len/.test(error.message))
          throw new Error("Описание — не длиннее 300 символов");
        throw new Error(error.message);
      }
      setProfile(data as Profile);
    },
    async uploadAvatar(file) {
      if (!supabase || !user) throw new Error("Нужно войти");
      if (file.size > 3 * 1024 * 1024) throw new Error("Картинка должна быть меньше 3 МБ");
      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type });
      if (error) throw new Error(error.message);
      // старые аватарки удаляем, чтобы не копились
      const { data: old } = await supabase.storage.from("avatars").list(user.id);
      const stale = (old ?? []).map((o) => `${user.id}/${o.name}`).filter((p) => p !== path);
      if (stale.length) await supabase.storage.from("avatars").remove(stale);
      return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    },
    async changeEmail(email) {
      const { error } = await supabase!.auth.updateUser(
        { email },
        { emailRedirectTo: window.location.href },
      );
      if (error) throw new Error(ruError(error.message));
    },
    recovery,
    finishRecovery: () => setRecovery(false),
    async sendPasswordReset(email) {
      const { error } = await supabase!.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}profile`,
      });
      if (error) throw new Error(ruError(error.message));
    },
    async changePassword(password) {
      const { error } = await supabase!.auth.updateUser({ password });
      if (error) throw new Error(ruError(error.message));
    },
    setDemoAdmin(v) {
      setDemoAdminState(v);
      try {
        window.localStorage.setItem(DEMO_KEY, v ? "1" : "0");
      } catch {
        /* ignore */
      }
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
