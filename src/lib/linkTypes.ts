// Типы кнопок («Скачать», «Telegram», «Облако»…). Список, порядок и свойства настраиваются в админке
// (вкладка «Кнопки») и хранятся в site_settings под ключом "link_types".
import {
  Download,
  ExternalLink,
  Gamepad2,
  Github,
  Globe,
  HardDrive,
  Heart,
  Instagram,
  Link2,
  MessageCircle,
  MessagesSquare,
  Music2,
  Play,
  Send,
  ShoppingCart,
  Star,
  Twitch,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { useSetting } from "./content";

export interface LinkType {
  id: string;
  label: string;
  icon: string;
  /** Жёлтая «главная» кнопка */
  primary: boolean;
  /** Считается скачиванием: попадает в «Ресурсы» и в счётчик скачиваний */
  download: boolean;
  /** Части адресов, по которым тип определяется сам, например "t.me", "discord.gg" */
  domains: string[];
  hidden?: boolean;
}

export interface LinkTypesSetting {
  types: LinkType[];
  /** Показывать кнопки на страницах в порядке типов, а не в порядке добавления */
  sortByType: boolean;
}

export const LINK_ICON_SET: Record<string, LucideIcon> = {
  Download,
  ExternalLink,
  Play,
  HardDrive,
  Send,
  MessageCircle,
  MessagesSquare,
  Github,
  Youtube,
  Music2,
  Twitch,
  Twitter,
  Instagram,
  Gamepad2,
  Heart,
  ShoppingCart,
  Star,
  Globe,
  Link2,
};

export const DEFAULT_LINK_TYPES: LinkType[] = [
  {
    id: "download",
    label: "Скачать",
    icon: "Download",
    primary: true,
    download: true,
    domains: [],
  },
  {
    id: "open",
    label: "Открыть / Попробовать",
    icon: "ExternalLink",
    primary: true,
    download: true,
    domains: [],
  },
  {
    id: "drive",
    label: "Облако (Диск)",
    icon: "HardDrive",
    primary: true,
    download: true,
    domains: [
      "drive.google",
      "disk.yandex",
      "yadi.sk",
      "mega.nz",
      "dropbox.com",
      "mediafire.com",
      "cloud.mail.ru",
      "onedrive",
    ],
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: "Send",
    primary: false,
    download: false,
    domains: ["t.me/", "telegram."],
  },
  {
    id: "gelink",
    label: "GeLink",
    icon: "MessageCircle",
    primary: false,
    download: false,
    domains: ["gelink"],
  },
  {
    id: "discord",
    label: "Discord",
    icon: "MessagesSquare",
    primary: false,
    download: false,
    domains: ["discord.gg", "discord.com"],
  },
  {
    id: "github",
    label: "GitHub",
    icon: "Github",
    primary: false,
    download: false,
    domains: ["github.com"],
  },
  {
    id: "youtube",
    label: "YouTube",
    icon: "Youtube",
    primary: false,
    download: false,
    domains: ["youtube.com", "youtu.be"],
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: "Music2",
    primary: false,
    download: false,
    domains: ["tiktok.com"],
  },
  {
    id: "donate",
    label: "Поддержать",
    icon: "Heart",
    primary: false,
    download: false,
    domains: ["boosty.to", "donationalerts", "patreon.com", "ko-fi.com"],
  },
  { id: "site", label: "Сайт", icon: "Globe", primary: false, download: false, domains: [] },
  {
    id: "other",
    label: "Своя кнопка",
    icon: "Link2",
    primary: false,
    download: false,
    domains: [],
  },
];

export const DEFAULT_SETTING: LinkTypesSetting = { types: DEFAULT_LINK_TYPES, sortByType: false };

const GENERIC: LinkType = {
  id: "other",
  label: "Своя кнопка",
  icon: "Link2",
  primary: false,
  download: false,
  domains: [],
};

export interface LinkTypesApi {
  setting: LinkTypesSetting;
  /** Все типы по порядку (включая скрытые) */
  all: LinkType[];
  /** Видимые типы — для выбора в редакторе */
  visible: LinkType[];
  get: (id: string) => LinkType;
  isDownload: (id: string) => boolean;
  guess: (url: string) => LinkType | null;
  icon: (id: string) => LucideIcon;
  rank: (id: string) => number;
}

export function buildLinkTypes(setting: LinkTypesSetting | null | undefined): LinkTypesApi {
  const s: LinkTypesSetting = {
    sortByType: setting?.sortByType ?? false,
    types: setting?.types?.length ? setting.types : DEFAULT_LINK_TYPES,
  };
  const byId = new Map(s.types.map((t) => [t.id, t]));
  const get = (id: string) =>
    byId.get(id) ?? DEFAULT_LINK_TYPES.find((t) => t.id === id) ?? GENERIC;
  return {
    setting: s,
    all: s.types,
    visible: s.types.filter((t) => !t.hidden),
    get,
    isDownload: (id) => get(id).download,
    guess: (url) => {
      const u = url.toLowerCase();
      if (!u) return null;
      return (
        s.types.find((t) => !t.hidden && t.domains.some((d) => d && u.includes(d.toLowerCase()))) ??
        null
      );
    },
    icon: (id) => LINK_ICON_SET[get(id).icon] ?? Link2,
    rank: (id) => {
      const i = s.types.findIndex((t) => t.id === id);
      return i < 0 ? 999 : i;
    },
  };
}

export function useLinkTypes(): LinkTypesApi {
  const setting = useSetting<LinkTypesSetting>("link_types", DEFAULT_SETTING);
  return buildLinkTypes(setting);
}
