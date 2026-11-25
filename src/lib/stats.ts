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
export function trackVisit() {
  if (tracked || !supabase) return;
  tracked = true;
  const vid = visitorId();
  if (vid) void supabase.rpc("track_visit", { vid });
}

export function countLinkClick(nodeId: string, linkId: string) {
  if (!supabase || nodeId.startsWith("seed-")) return;
  void supabase.rpc("count_link", { nid: nodeId, lid: linkId });
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

/** Сколько человек сейчас на сайте — через Supabase Realtime Presence */
export function useOnlineCount() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!supabase) return;
    const key = visitorId() ?? crypto.randomUUID();
    const channel = supabase.channel("online", { config: { presence: { key } } });
    channel
      .on("presence", { event: "sync" }, () => {
        setCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void channel.track({ at: Date.now() });
      });
    return () => {
      void supabase?.removeChannel(channel);
    };
  }, []);
  return count;
}
