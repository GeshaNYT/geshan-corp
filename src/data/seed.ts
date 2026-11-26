// Стартовое содержимое — перенесено со старой версии сайта.
// Используется в демо-режиме (без Supabase) и для первичного импорта в базу из админки.
import type { LinkKind, NodeFile, NodeStatus, SiteNode } from "@/lib/types";

const NOW = "2026-11-25T00:00:00.000Z";

type Seed = Partial<SiteNode> & { slug: string; title: string; children?: Seed[] };

function link(label: string, url: string, kind: LinkKind = "other") {
  return { id: `l-${Math.random().toString(36).slice(2, 10)}`, label, url, kind };
}

const DRIVE = (id: string) => `https://drive.google.com/drive/folders/${id}?usp=sharing`;
const GECARDS = "https://github.com/GeshaNYT/gecards/releases";

const project = (
  slug: string,
  title: string,
  tagline: string,
  opts: Partial<SiteNode> & { status?: NodeStatus } = {},
): Seed => ({ slug, title, tagline, kind: "project", icon: "Package", ...opts });

const TREE: Seed[] = [
  {
    slug: "studio",
    title: "Geshan Studio",
    kind: "section",
    icon: "Building2",
    featured: true,
    tagline: "Штаб-квартира разработок.",
    description: "Здесь мы создаём продукты, которые становятся частью жизни нашего комьюнити.",
    children: [
      {
        slug: "dev",
        title: "Geshan Dev",
        kind: "section",
        icon: "Package",
        tagline: "Профессиональная разработка для Minecraft: плагины, моды, шейдеры, ресурспаки.",
        children: [
          {
            slug: "plugins",
            title: "Плагины",
            kind: "section",
            icon: "Puzzle",
            tagline: "Серверные решения — внутренние разработки для стабильности MineCube.",
            children: [
              project("invate", "Invate", "Продвинутый античит для обеспечения честной игры.", {
                status: "internal",
                icon: "ShieldCheck",
                platforms: ["Minecraft Java"],
              }),
              project(
                "wgextender",
                "WGExtender",
                "Расширение функционала для гибкой защиты территорий.",
                { status: "internal", icon: "Map", platforms: ["Minecraft Java"] },
              ),
              project(
                "allowedcmds",
                "AllowedCMDs",
                "Система контроля команд для предотвращения злоупотреблений.",
                { status: "internal", icon: "Terminal", platforms: ["Minecraft Java"] },
              ),
              project("staffworker", "StaffWorker", "Инструмент автоматизации работы персонала.", {
                status: "internal",
                icon: "Briefcase",
                platforms: ["Minecraft Java"],
              }),
              project("granter", "Granter", "Модуль для автоматизированной выдачи наград.", {
                status: "internal",
                icon: "Gift",
                platforms: ["Minecraft Java"],
              }),
              project("checker", "Checker", "Система вызова игроков на проверку на читы.", {
                status: "internal",
                icon: "Search",
                platforms: ["Minecraft Java"],
              }),
            ],
          },
          {
            slug: "mods",
            title: "Моды",
            kind: "section",
            icon: "Wrench",
            tagline: "Моды для Minecraft от Geshan Dev.",
          },
          {
            slug: "shaders",
            title: "Шейдеры",
            kind: "section",
            icon: "Sparkles",
            tagline: "Шейдеры для Minecraft, доступные всему сообществу.",
            children: [
              project(
                "genature",
                "GeNature",
                "Фирменный шейдер для кардинального преображения атмосферы игры.",
                {
                  status: "released",
                  icon: "Sparkles",
                  platforms: ["Minecraft Java"],
                  links: [link("Скачать", DRIVE("1BM5Kx4gntsvZ7-woIfe0Mb6t5AYtlu1L"), "download")],
                },
              ),
            ],
          },
        ],
      },
      {
        slug: "lab",
        title: "Geshan Lab",
        kind: "section",
        icon: "FlaskConical",
        tagline: "Лаборатория инноваций для смелых и необычных экспериментов.",
        description:
          "Специализированные утилиты и инновационные решения, доступные для скачивания.",
        children: [
          project(
            "gecalculator",
            "GeCalculator",
            "Собственный калькулятор для быстрых и точных вычислений.",
            {
              status: "released",
              icon: "Calculator",
              platforms: ["Android"],
              links: [link("Скачать", DRIVE("1EzLLA8WGgytLEDUm-6E943oATysRplfU"), "download")],
            },
          ),
          project(
            "geairdraw",
            "GeAirDraw",
            "Уникальное решение для рисования на экране с помощью камеры.",
            {
              status: "released",
              icon: "PenTool",
              platforms: ["Windows"],
              links: [link("Скачать", DRIVE("1OUxsTgMXbuYofPSeTr9vlABA_R-HN-3e"), "download")],
            },
          ),
          project(
            "gedrop",
            "GeDrop",
            "Удобная утилита для быстрой передачи файлов по локальной сети.",
            {
              status: "released",
              icon: "Share2",
              platforms: ["Windows"],
              links: [link("Скачать", DRIVE("1vakm-Ysz3lr7Og-_0lHWrmLz88UErnAD"), "download")],
            },
          ),
          project(
            "geshan-virus",
            "Geshan Virus",
            "Коллекция шуточных и полностью безвредных вирусов для розыгрышей.",
            {
              status: "released",
              icon: "Bug",
              platforms: ["Windows"],
              links: [link("Скачать", DRIVE("1EDkB7InWGjxLauGd6iZ_klfBDsSu9HGX"), "download")],
            },
          ),
          project(
            "gecards",
            "GeCards",
            "Карточные игры с друзьями — за одним компьютером, по локальной сети или через интернет.",
            {
              status: "released",
              icon: "Spade",
              platforms: ["Windows", "macOS", "Linux"],
              description:
                "Игры: Дурак · Покер · Seka · Козёл · Тысяча · Блэкджек · Девятка · Пьяница — с ботами трёх уровней сложности.\n\nИгра по локальной сети (хосты находятся автоматически) и через интернет (UPnP, проброс портов, Tailscale / ZeroTier / Radmin VPN).\n\n11 языков и встроенный чат в комнате.",
              links: [
                link("Скачать для Windows", GECARDS, "download"),
                link("Скачать для macOS (Apple Silicon)", GECARDS, "download"),
                link("Скачать для macOS (Intel)", GECARDS, "download"),
                link("Скачать для Linux (AppImage)", GECARDS, "download"),
                link("Скачать для Ubuntu / Debian (.deb)", GECARDS, "download"),
                link("GitHub", "https://github.com/GeshaNYT/gecards", "github"),
              ],
            },
          ),
        ],
      },
      {
        slug: "game",
        title: "Geshan Game",
        kind: "section",
        icon: "Gamepad2",
        tagline: "Студия по созданию игр с уникальными механиками.",
        children: [
          project("terratax", "Terratax", "Стратегия в жанре захвата стран.", {
            status: "wip",
            icon: "Globe",
            platforms: ["Windows"],
            links: [link("Следить за новостями", "https://t.me/geshan_co", "telegram")],
          }),
          project(
            "cactus-click",
            "Cactus Click",
            "Увлекательный кликер, где нужно кликать по кактусам.",
            {
              status: "released",
              icon: "MousePointerClick",
              platforms: ["Android"],
              links: [
                link("Скачать", "https://t.me/cactus_click/21", "download"),
                link("Новости", "https://t.me/cactus_click", "telegram"),
              ],
            },
          ),
          project(
            "the-first-spark",
            "The First Spark",
            "Симулятор, в котором крошечные человечки развивают свою цивилизацию.",
            {
              status: "wip",
              icon: "Flame",
              platforms: ["Windows"],
              links: [link("Следить за новостями", "https://t.me/geshan_co", "telegram")],
            },
          ),
        ],
      },
    ],
  },
  {
    slug: "ai",
    title: "Geshan AI",
    kind: "section",
    icon: "Bot",
    tagline: "ИИ-инструменты, доступные каждому для решения повседневных задач.",
    description: "Многофункциональные нейросетевые модели для широкого спектра задач.",
    children: [
      project(
        "geshan-ai-bot",
        "Geshan AI",
        "Универсальная текстовая нейросеть с множеством стилей общения и функций.",
        {
          status: "released",
          icon: "Bot",
          platforms: ["Telegram bot"],
          links: [link("Попробовать", "https://t.me/GeshanAI_bot", "open")],
        },
      ),
      project(
        "geshan-gemini",
        "Geshan Gemini",
        "Большая интеллектуальная нейросеть с расширенным функционалом для глубокой работы.",
        {
          status: "frozen",
          icon: "Brain",
          platforms: ["Telegram bot"],
        },
      ),
      project(
        "geshan-gpt",
        "Geshan GPT",
        "Быстрая модель для повседневных задач: тексты, переводы, идеи и короткие ответы.",
        {
          status: "frozen",
          icon: "Zap",
          platforms: ["Telegram bot"],
        },
      ),
    ],
  },
  project("minecube", "MineCube", "Такого гриферского сервера вы не видели даже во сне!", {
    status: "released",
    icon: "Box",
    featured: true,
    platforms: ["Minecraft Java", "Minecraft Bedrock"],
    description:
      "MineCube — бескомпромиссный сервер, где выживание становится настоящим испытанием. Вас ждут два уникальных режима.\n\nГриф — масштабный режим с множеством авторских механик, уникальными кастомными предметами и захватывающими ивентами.\n\nВанилла — классическое выживание, максимально приближенное к оригинальному Minecraft, но дополненное нашими уникальными механиками.",
    links: [
      link("Сайт сервера", "https://mc.mine-cube.ru/", "site"),
      link("@minecube_info", "https://t.me/minecube_info", "telegram"),
    ],
  }),
  project("gelink", "GeLink", "Современный мессенджер для удобного и безопасного общения.", {
    status: "released",
    icon: "MessageCircle",
    featured: true,
    platforms: ["Web", "Windows", "Android"],
    description:
      "Защищённый мессенджер с удобным интерфейсом для обмена сообщениями в реальном времени.",
    links: [
      link("Открыть GeLink Web", "https://gelink.vercel.app/", "open"),
      link("Скачать для Windows", DRIVE("1jMeuI1LdwkXhmDj3cwNokii7tqaMzFWE"), "download"),
      link("Скачать для Android", DRIVE("1jMeuI1LdwkXhmDj3cwNokii7tqaMzFWE"), "download"),
      link("@GeLinkM", "https://t.me/GeLinkM", "telegram"),
    ],
  }),
  project(
    "mystery",
    "Geshan Mystery",
    "Медиа-проект с атмосферными видео-страшилками в мире Minecraft.",
    {
      status: "frozen",
      icon: "Search",
      platforms: ["YouTube"],
      description:
        "Погружение в неизвестное. Авторский проект, посвящённый созданию мрачных историй, расследованию тайн и пугающих легенд в мире Minecraft.",
    },
  ),
];

function flatten(items: Seed[], parent: string | null, out: SiteNode[]) {
  items.forEach((s, i) => {
    const { children, ...rest } = s;
    const id = `seed-${s.slug}`;
    out.push({
      id,
      parent_id: parent,
      kind: "project",
      tagline: "",
      description: "",
      icon: "Package",
      cover_url: "",
      status: "released",
      platforms: [],
      links: [],
      gallery: [],
      featured: false,
      hidden: false,
      created_at: NOW,
      updated_at: NOW,
      ...rest,
      sort: i,
    });
    if (children) flatten(children, id, out);
  });
  return out;
}

export const SEED_NODES: SiteNode[] = flatten(TREE, null, []);
export const SEED_FILES: NodeFile[] = [];

export const CHANNELS = [
  {
    name: "Geshan Corporation",
    handle: "@geshan_co",
    url: "https://t.me/geshan_co",
    description: "Официальный канал корпорации. Новости, объявления и события.",
  },
  {
    name: "GeshaN",
    handle: "@Geshan_N",
    url: "https://t.me/Geshan_N",
    description: "Личный канал основателя. Мысли, инсайды и закулисье.",
  },
  {
    name: "MineCube",
    handle: "@minecube_info",
    url: "https://t.me/minecube_info",
    description: "Новости и обновления игрового проекта MineCube.",
  },
  {
    name: "GeLink",
    handle: "@GeLinkM",
    url: "https://t.me/GeLinkM",
    description: "Официальный канал мессенджера GeLink — анонсы и релизы.",
  },
];
