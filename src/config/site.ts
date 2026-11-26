// Основные настройки сайта. Чтобы подключить базу данных — вставь сюда
// Project URL и anon public key из Supabase (Project Settings → API).
// anon key публичный, его можно хранить в коде: доступ защищён правилами в supabase/schema.sql.

export const SUPABASE_URL: string =
  import.meta.env.VITE_SUPABASE_URL || "https://mruuxyrlpgirowzqhiza.supabase.co";
export const SUPABASE_ANON_KEY: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydXV4eXJscGdpcm93enFoaXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2MzQ3NTEsImV4cCI6MjExMTIxMDc1MX0._WGm8JUSwM4y8_jgEjKxpNhc_nRTAP-jwEtirrKCDEU";

export const SITE_NAME = "Geshan Corporation";

// Серверы Minecraft для мониторинга настраиваются в админке (вкладка «Сервер»), см. src/lib/servers.ts
