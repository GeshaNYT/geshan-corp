import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
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
  return msg;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [demoAdmin, setDemoAdminState] = useState(false);

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
    const { data: sub } = client.auth.onAuthStateChange((_e, session) => {
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
      await supabase?.auth.signOut();
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
