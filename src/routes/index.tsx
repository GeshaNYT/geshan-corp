import { createFileRoute } from "@tanstack/react-router";
import heroImg from "@/assets/geshan-hero.jpg";
import logoImg from "@/assets/geshan-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Geshan Corporation — Официальный сайт" },
      { name: "description", content: "Geshan Corporation — корпорация будущего. Официальные Telegram-каналы и контакты." },
      { property: "og:title", content: "Geshan Corporation" },
      { property: "og:description", content: "Корпорация будущего. Подписывайтесь на официальные Telegram-каналы." },
    ],
  }),
  component: Index,
});

const channels = [
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
];

const projects = [
  {
    name: "MineCube",
    handle: "@minecube_info",
    url: "https://t.me/minecube_info",
    description: "Новости и обновления игрового проекта MineCube.",
  },
  {
    name: "Мессенджер GeLink",
    handle: "@GeLinkM",
    url: "https://t.me/GeLinkM",
    description: "Официальный канал мессенджера GeLink — анонсы и релизы.",
  },
  {
    name: "Телеграм бот",
    handle: "@GeshanAI_bot",
    url: "https://t.me/GeshanAI_bot",
    description: "AI-бот корпорации. Возможности, команды и обновления.",
  },
];

function TelegramIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M21.5 3.5L2.5 10.8c-1.1.4-1.1 1.5 0 1.9l4.8 1.5 1.8 5.6c.2.7.4.9 1 .9.4 0 .6-.2 1-.5l2.4-2.3 4.9 3.6c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.7-1.6zM9.7 14.6l-.4 4.2 1.3-4-.9-.2zm.7-1.8l9.1-5.7-7.7 6.8-.3 2.4-1.1-3.5z" />
    </svg>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <header className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroImg}
            alt=""
            className="h-full w-full object-cover opacity-40"
            width={1920}
            height={1280}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />
        </div>

        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Geshan Corporation" width={40} height={40} className="h-10 w-10" />
            <span className="font-display text-xl tracking-wide">Geshan Corporation</span>
          </div>
          <a
            href="#channels"
            className="hidden rounded-full border border-primary/40 px-5 py-2 text-sm text-primary transition hover:bg-primary hover:text-primary-foreground sm:inline-block"
          >
            Каналы
          </a>
        </nav>

        <div className="mx-auto max-w-6xl px-6 pb-32 pt-20 sm:pt-32">
          <p className="mb-6 text-sm uppercase tracking-[0.3em] text-primary">Est. — Корпорация будущего</p>
          <h1 className="max-w-4xl text-5xl leading-[1.05] sm:text-7xl">
            <span className="text-gold-gradient">Geshan</span>
            <br />
            <span className="text-foreground">Corporation</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Мы строим экосистему сильных идей, людей и проектов. Следите за развитием в наших официальных Telegram-каналах.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#channels"
              className="rounded-full bg-primary px-7 py-3 font-medium text-primary-foreground transition hover:opacity-90"
            >
              Перейти к каналам
            </a>
            <a
              href="#about"
              className="rounded-full border border-border px-7 py-3 font-medium transition hover:bg-card"
            >
              О корпорации
            </a>
          </div>
        </div>
      </header>

      {/* About */}
      <section id="about" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-primary">О корпорации</p>
          <h2 className="text-4xl sm:text-5xl">Глобальная экосистема и сообщество</h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Geshan Corporation — масштабное пространство, объединяющее технологии,
            творчество и людей. Фундамент всей нашей деятельности —{" "}
            <span className="text-primary">Geshan&rsquo;s Community</span>, динамичное
            сообщество, которое стирает границы между проектами.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-3">
          {[
            { t: "Видение", d: "Создавать пространство, где идеи превращаются в реальные проекты." },
            { t: "Миссия", d: "Объединять единомышленников и развивать новые форматы коммуникации." },
            { t: "Ценности", d: "Прозрачность, скорость, качество и уважение к сообществу." },
          ].map((b) => (
            <div key={b.t} className="rounded-2xl border border-border bg-card/40 p-8 backdrop-blur">
              <h3 className="mb-3 text-2xl text-primary">{b.t}</h3>
              <p className="text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ecosystem */}
      <section id="ecosystem" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-primary">Структура</p>
          <h2 className="text-4xl sm:text-5xl">Экосистема Geshan</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Десятки направлений — от разработки и игр до ИИ и медиа. И это далеко не всё:
            список направлений постоянно растёт.
          </p>
        </div>

        <div className="space-y-6">
          {/* Community — featured */}
          <div className="relative overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card p-8 sm:p-10">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <p className="mb-2 text-xs uppercase tracking-[0.3em] text-primary">Главный актив</p>
              <h3 className="text-3xl sm:text-4xl">
                <span className="text-gold-gradient">Geshan&rsquo;s Community</span>
              </h3>
              <p className="mt-4 max-w-3xl text-muted-foreground">
                Огромное объединение людей вокруг наших медиа-ресурсов — YouTube-каналов
                разных тематик и других площадок. Каждый находит здесь что-то для себя,
                независимо от интересов.
              </p>
            </div>
          </div>

          {/* Studio + sub-divisions */}
          <div className="rounded-3xl border border-border bg-card/40 p-8 sm:p-10 backdrop-blur">
            <div className="mb-8">
              <p className="mb-2 text-xs uppercase tracking-[0.3em] text-primary">Штаб-квартира разработок</p>
              <h3 className="text-3xl">Geshan Studio</h3>
              <p className="mt-3 max-w-3xl text-muted-foreground">
                Здесь мы создаём продукты, которые становятся частью жизни нашего комьюнити.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { t: "Geshan Dev", d: "Профессиональная разработка для Minecraft: плагины, моды, шейдеры, ресурспаки." },
                { t: "Geshan Lab", d: "Лаборатория инноваций для смелых и необычных экспериментов." },
                { t: "Geshan Game", d: "Студия по созданию игр с уникальными механиками." },
                { t: "Geshan AI", d: "ИИ-инструменты, доступные каждому для решения повседневных задач." },
              ].map((d) => (
                <div key={d.t} className="rounded-2xl border border-border bg-background/40 p-6 transition hover:border-primary">
                  <h4 className="text-lg text-primary">{d.t}</h4>
                  <p className="mt-2 text-sm text-muted-foreground">{d.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Other products */}
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { t: "MineCube", d: "Собственный сервер Minecraft, объединяющий игроков для масштабных приключений." },
              { t: "GeLink", d: "Современный мессенджер для удобного и безопасного общения." },
              { t: "Geshan Mystery", d: "Медиа-проект с атмосферными видео-страшилками в мире Minecraft." },
            ].map((d) => (
              <div key={d.t} className="rounded-2xl border border-border bg-card/40 p-7 backdrop-blur transition hover:border-primary">
                <h4 className="text-xl text-primary">{d.t}</h4>
                <p className="mt-3 text-sm text-muted-foreground">{d.d}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 text-center text-sm italic text-muted-foreground">
          И это далеко не всё — мы запускаем новые разработки и расширяем возможности Geshan Corporation каждый день.
        </p>
      </section>

      {/* Channels */}
      <section id="channels" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-primary">Telegram</p>
          <h2 className="text-4xl sm:text-5xl">Официальные каналы</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Подпишитесь, чтобы быть в курсе всех новостей и анонсов корпорации.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {channels.map((c) => (
            <a
              key={c.url}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 transition hover:border-primary"
            >
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition group-hover:bg-primary/20" />
              <div className="relative flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <TelegramIcon className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl">{c.name}</h3>
                  <p className="mt-1 font-mono text-sm text-primary">{c.handle}</p>
                  <p className="mt-4 text-muted-foreground">{c.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
                    Открыть в Telegram
                    <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-primary">Проекты</p>
          <h2 className="text-4xl sm:text-5xl">Каналы наших проектов</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Подпишитесь на Telegram-каналы продуктов и сервисов корпорации.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {projects.map((c) => (
            <a
              key={c.url}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-7 transition hover:border-primary"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition group-hover:bg-primary/20" />
              <div className="relative">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <TelegramIcon className="h-6 w-6" />
                </div>
                <h3 className="text-xl">{c.name}</h3>
                <p className="mt-1 font-mono text-xs text-primary">{c.handle}</p>
                <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  Перейти
                  <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="" width={28} height={28} className="h-7 w-7" loading="lazy" />
            <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} Geshan Corporation</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="https://t.me/geshan_co" target="_blank" rel="noopener noreferrer" className="hover:text-primary">geshan_co</a>
            <a href="https://t.me/Geshan_N" target="_blank" rel="noopener noreferrer" className="hover:text-primary">Geshan_N</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
