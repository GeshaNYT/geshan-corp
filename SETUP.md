# Подключение базы данных (Supabase)

Без базы сайт работает в **демо-режиме**: весь контент виден, а админку можно включить в «Профиле», но изменения сохраняются только в твоём браузере.
Чтобы заработали аккаунты, общая админка и загрузка файлов, подключи Supabase (бесплатно).

## 1. Создай проект

1. Зайди на https://supabase.com → **Start your project** → войди через GitHub.
2. **New project** → название `geshan-corp`, придумай пароль базы, регион — Frankfurt (EU Central).

## 2. Создай таблицы

1. В проекте слева **SQL Editor** → **New query**.
2. Скопируй весь файл [`supabase/schema.sql`](supabase/schema.sql), вставь и нажми **Run**.

## 3. Дай сайту ключи

1. **Project Settings → API**: скопируй **Project URL** и ключ **anon public**.
2. На GitHub: репозиторий → **Settings → Secrets and variables → Actions → New repository secret**:
   - `VITE_SUPABASE_URL` — Project URL
   - `VITE_SUPABASE_ANON_KEY` — anon public key
3. Перезапусти публикацию: вкладка **Actions** → **Deploy to GitHub Pages** → **Run workflow**.

## 4. Сделай себя админом

1. На сайте открой **Профиль → Регистрация** и создай аккаунт (подтверди почту).
2. В Supabase → **SQL Editor** выполни, подставив свою почту:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'ТВОЯ@ПОЧТА');
   ```
3. Перезайди на сайте — в меню появится **Админ-панель**. Там будет кнопка **«Перенести контент»**, она загрузит в базу все разделы и проекты со старого сайта.

## Настройка входа по почте

Supabase → **Authentication → URL Configuration** → в **Site URL** укажи адрес сайта, например `https://geshanyt.github.io/geshan-corp/`.
