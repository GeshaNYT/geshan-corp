import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/config/site";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Клиент создаём только в браузере: при пред-рендере страницы на сервере он не нужен
export const supabase: SupabaseClient | null =
  isSupabaseConfigured && typeof window !== "undefined"
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: typeof window !== "undefined", detectSessionInUrl: true },
      })
    : null;
