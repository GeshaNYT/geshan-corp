// Основные настройки сайта. Чтобы подключить базу данных — вставь сюда
// Project URL и anon public key из Supabase (Project Settings → API).
// anon key публичный, его можно хранить в коде: доступ защищён правилами в supabase/schema.sql.

export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const SITE_NAME = "Geshan Corporation";

export const MC_SERVERS = {
  java: { host: "mc.minecube.pro", label: "Java", version: "1.16.5 – 26.3" },
  bedrock: { host: "pe.minecube.pro", port: 25787, label: "Bedrock" },
};
