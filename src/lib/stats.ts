import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

export interface SiteStats {
  users: number;
  visitors_total: number;
  visitors_today: number;
  downloads: number;
}

const VID_KEY = "geshan:vid";

/** Случайный анонимный id браузера — чтобы считать уникальных посетителей, без личных данных */
function visitorId() {
  try {
    let v = window.localStorage.getItem(VID_KEY);
    if (!v) {
      v = crypto.randomUUID();
      window.localStorage.setItem(VID_KEY, v);
    }
    return v;
  } catch {
    return null;
  }
}

let tracked = false;
export function trackVisit(onTracked?: () => void) {
  if (tracked || !supabase) return;
  tracked = true;
  const vid = visitorId();
  // Запрос supabase-js отправляется только при .then() — без него ничего не уходит
  if (vid) supabase.rpc("track_visit", { vid }).then(() => onTracked?.());
}

export function countLinkClick(nodeId: string, linkId: string) {
  if (!supabase || nodeId.startsWith("seed-")) return;
  supabase.rpc("count_link", { nid: nodeId, lid: linkId }).then(() => undefined);
}

export function useSiteStats() {
  return useQuery<SiteStats | null>({
    queryKey: ["site-stats"],
    queryFn: async () => {
      if (!supabase) return null;
      const { data, error } = await supabase.rpc("site_stats");
      if (error) throw error;
      return data as SiteStats;
    },
    enabled: typeof window !== "undefined",
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export interface OnlineCount {
  total: number;
  members: number;
  guests: number;
}

/** Кто сейчас на сайте — через Supabase Realtime Presence. Участники = вошедшие в аккаунт, гости = без аккаунта */
export function useOnlineCount(userId: string | null) {
  const [count, setCount] = useState<OnlineCount | null>(null);
  const [channel, setChannel] = useState<ReturnType<
    NonNullable<typeof supabase>["channel"]
  > | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const key = visitorId() ?? crypto.randomUUID();
    const ch = supabase.channel("online", { config: { presence: { key } } });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<{ member?: boolean }>();
      let members = 0;
      let guests = 0;
      for (const metas of Object.values(state)) {
        // один браузер = один человек; если хоть в одной вкладке вошёл — он участник
        if (metas.some((m) => m.member)) members++;
        else guests++;
      }
      setCount({ total: members + guests, members, guests });
    }).subscribe((status) => {
      if (status === "SUBSCRIBED") setChannel(ch);
    });
    return () => {
      setChannel(null);
      void supabase?.removeChannel(ch);
    };
  }, []);

  // Сообщаем, вошёл ли человек — и обновляем при входе/выходе
  useEffect(() => {
    if (channel) void channel.track({ member: Boolean(userId), at: Date.now() });
  }, [channel, userId]);

  return count;
}
