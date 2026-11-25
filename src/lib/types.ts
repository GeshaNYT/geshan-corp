// Общие типы данных сайта. Всё содержимое — дерево узлов (разделы и проекты).

export type NodeKind = "section" | "project";

export type NodeStatus = "released" | "wip" | "frozen" | "soon" | "internal";

export type LinkKind =
  | "download"
  | "open"
  | "drive"
  | "telegram"
  | "gelink"
  | "discord"
  | "github"
  | "youtube"
  | "tiktok"
  | "donate"
  | "site"
  | "other";

export interface NodeLink {
  id: string;
  label: string;
  url: string;
  kind: LinkKind;
}

export interface NodeFile {
  id: string;
  node_id: string;
  label: string;
  version: string;
  platform: string;
  /** Публичный URL файла (Supabase Storage или внешний) */
  url: string;
  /** Путь в хранилище Supabase, если файл загружен через сайт */
  storage_path: string | null;
  size: number | null;
  downloads: number;
  sort: number;
  created_at: string;
}

export interface SiteNode {
  id: string;
  parent_id: string | null;
  kind: NodeKind;
  slug: string;
  title: string;
  /** Короткое описание для карточки */
  tagline: string;
  /** Полное описание (абзацы разделяются пустой строкой) */
  description: string;
  /** Имя иконки lucide (см. src/components/NodeIcon.tsx) */
  icon: string;
  cover_url: string;
  status: NodeStatus;
  platforms: string[];
  links: NodeLink[];
  gallery: string[];
  featured: boolean;
  hidden: boolean;
  sort: number;
  created_at: string;
  updated_at: string;
}

export const STATUS_LABELS: Record<NodeStatus, string> = {
  released: "Готов",
  wip: "В разработке",
  frozen: "Заморожен",
  soon: "Скоро",
  internal: "Внутренний",
};

export const STATUS_HINTS: Record<NodeStatus, string> = {
  released: "Проект доступен, можно скачать или открыть",
  wip: "Проект в работе — можно выложить ранние версии",
  frozen: "Разработка на паузе",
  soon: "Анонс, файлов пока нет",
  internal: "Внутренняя разработка, не для скачивания",
};

export const LINK_KIND_LABELS: Record<LinkKind, string> = {
  download: "Скачать",
  open: "Открыть / Попробовать",
  drive: "Облако (Диск)",
  telegram: "Telegram",
  gelink: "GeLink",
  discord: "Discord",
  github: "GitHub",
  youtube: "YouTube",
  tiktok: "TikTok",
  donate: "Поддержать",
  site: "Сайт",
  other: "Своя кнопка",
};

/** Определяет тип ссылки по адресу — чтобы при вставке ссылки кнопка сама получила иконку */
export function guessLinkKind(url: string): LinkKind | null {
  const u = url.toLowerCase();
  if (/t\.me\/|telegram\./.test(u)) return "telegram";
  if (/gelink/.test(u)) return "gelink";
  if (/discord\.(gg|com)/.test(u)) return "discord";
  if (/github\.com/.test(u)) return "github";
  if (/youtube\.com|youtu\.be/.test(u)) return "youtube";
  if (/tiktok\.com/.test(u)) return "tiktok";
  if (/boosty\.to|donationalerts|patreon\.com|ko-fi\.com/.test(u)) return "donate";
  if (
    /drive\.google|disk\.yandex|yadi\.sk|mega\.nz|dropbox\.com|mediafire\.com|cloud\.mail\.ru|onedrive/.test(
      u,
    )
  )
    return "drive";
  return null;
}

export const PLATFORM_PRESETS = [
  "Windows",
  "Android",
  "macOS",
  "Linux",
  "iOS",
  "Web",
  "Minecraft Java",
  "Minecraft Bedrock",
  "Telegram bot",
  "YouTube",
];

export type NodeInput = Omit<SiteNode, "id" | "created_at" | "updated_at"> & { id?: string };
