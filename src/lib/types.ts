// Общие типы данных сайта. Всё содержимое — дерево узлов (разделы и проекты).

export type NodeKind = "section" | "project";

export type NodeStatus = "released" | "wip" | "frozen" | "soon" | "internal";

/** id типа кнопки — см. src/lib/linkTypes.ts (типы настраиваются в админке) */
export type LinkKind = string;

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

/** Как показывать платформу: известные — в официальном написании (macOS, iOS), свои — с большой буквы */
export function displayPlatform(p: string) {
  const t = p.trim();
  const preset = PLATFORM_PRESETS.find((x) => x.toLowerCase() === t.toLowerCase());
  return preset ?? t.charAt(0).toUpperCase() + t.slice(1);
}
