// Каналы и настройки сайта (порядок платформ и т.п.)
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CHANNELS } from "@/data/seed";
import { supabase } from "./supabase";

export interface Channel {
  id: string;
  name: string;
  handle: string;
  url: string;
  description: string;
  sort: number;
  /** Показывать на главной */
  featured: boolean;
}

const FALLBACK: Channel[] = CHANNELS.map((c, i) => ({
  ...c,
  id: `seed-ch-${i}`,
  sort: i,
  featured: true,
}));

function check<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) {
    if (res.error.code === "23505") throw new Error("Такой канал уже добавлен");
    throw new Error(res.error.message);
  }
  return res.data;
}

const CH_CACHE = "geshan:channels-cache:v1";
function cachedChannels(): Channel[] | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(CH_CACHE);
    return raw ? (JSON.parse(raw) as Channel[]) : undefined;
  } catch {
    return undefined;
  }
}

export function useChannels() {
  const qc = useQueryClient();
  // После гидратации подставляем сохранённые каналы, пока идёт запрос (до этого — стартовые,
  // чтобы разметка совпала с заранее собранной страницей)
  useEffect(() => {
    const t = setTimeout(() => {
      const cached = cachedChannels();
      if (cached && qc.getQueryState(["channels"])?.status !== "success")
        qc.setQueryData(["channels"], cached, { updatedAt: 0 });
    }, 0);
    return () => clearTimeout(t);
  }, [qc]);
  return useQuery<Channel[]>({
    queryKey: ["channels"],
    queryFn: async () => {
      if (!supabase) return FALLBACK;
      const list = check(await supabase.from("channels").select("*").order("sort")) as Channel[];
      try {
        window.localStorage.setItem(CH_CACHE, JSON.stringify(list));
      } catch {
        /* ignore */
      }
      return list;
    },
    placeholderData: FALLBACK,
    enabled: typeof window !== "undefined",
    staleTime: 60_000,
  });
}

/** Нормализация ссылки: @name → https://t.me/name, без хвостового слэша */
export function normalizeChannelUrl(input: string) {
  let v = input.trim();
  if (v.startsWith("@")) v = `https://t.me/${v.slice(1)}`;
  else if (/^t\.me\//i.test(v)) v = `https://${v}`;
  return v.replace(/\/+$/, "");
}

export function handleFromUrl(url: string) {
  const m = url.match(/t\.me\/([A-Za-z0-9_]+)/i);
  return m ? `@${m[1]}` : "";
}

export const channelsApi = {
  async save(c: Partial<Channel> & { name: string; url: string }) {
    if (!supabase) throw new Error("База не подключена");
    const { id, ...rest } = c;
    const row = { ...rest, url: normalizeChannelUrl(rest.url) };
    return id
      ? check(await supabase.from("channels").update(row).eq("id", id))
      : check(await supabase.from("channels").insert(row));
  },
  async remove(id: string) {
    if (!supabase) throw new Error("База не подключена");
    check(await supabase.from("channels").delete().eq("id", id));
  },
  async reorder(list: Channel[]) {
    if (!supabase) throw new Error("База не подключена");
    await Promise.all(
      list.map(async (c, i) =>
        check(await supabase!.from("channels").update({ sort: i }).eq("id", c.id)),
      ),
    );
  },
};

export function useSetting<T>(key: string, fallback: T) {
  const q = useQuery<T>({
    queryKey: ["setting", key],
    queryFn: async () => {
      if (!supabase) return fallback;
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      return (data?.value as T) ?? fallback;
    },
    enabled: typeof window !== "undefined",
    staleTime: 60_000,
  });
  return q.data ?? fallback;
}

export function useSaveSetting() {
  const qc = useQueryClient();
  return async (key: string, value: unknown) => {
    if (!supabase) throw new Error("База не подключена");
    check(
      await supabase
        .from("site_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }),
    );
    await qc.invalidateQueries({ queryKey: ["setting", key] });
  };
}

/** Сортирует платформы по сохранённому порядку; новые — в конец по алфавиту */
export function orderPlatforms(list: string[], order: string[]) {
  const idx = new Map(order.map((p, i) => [p.toLowerCase(), i]));
  return [...list].sort((a, b) => {
    const ia = idx.get(a.toLowerCase()) ?? Infinity;
    const ib = idx.get(b.toLowerCase()) ?? Infinity;
    return ia === ib ? a.localeCompare(b) : ia - ib;
  });
}
