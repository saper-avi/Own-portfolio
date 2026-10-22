# Алихан Абай — сайт для VS Code

Полный переносимый проект текущего портфолио: HTML, CSS, JavaScript, фотографии,
скриншоты сайтов, шрифты, vCard и сертификат. Главный файл — `index.html` в корне.
Анимация объёмной фигуры создаётся кодом в `assets/hero-art.js`; отдельный файл
3D-модели для неё не требуется.

## 1. Открыть и запустить

1. Распакуй ZIP целиком.
2. Открой папку `alikhan-portfolio-vscode` в VS Code через **File → Open Folder**.
3. Нужен Node.js 22+; если его нет, установи актуальную LTS с https://nodejs.org/.
4. Открой **Terminal → New Terminal** и выполни:

```sh
npm run dev
```

Проект также можно получить из своего GitHub:

```sh
git clone https://github.com/saper-avi/Own-portfolio.git
cd Own-portfolio
```

Открой клонированную папку `Own-portfolio` в VS Code и выполни `npm run dev`.

Открой `http://127.0.0.1:5500` в браузере. После правки сохрани файл и обнови
страницу. Остановка сервера — `Ctrl+C`. Для локального запуска `npm install`
не нужен: проект использует только встроенные модули Node.js.

Если Windows PowerShell блокирует `npm.ps1`, используй:

```sh
node tools/serve.mjs
```

Команды нужно выполнять из папки с `package.json`. Ошибка `Missing script: dev`
обычно означает, что терминал открыт в другой папке.

Можно также открыть `index.html` прямо в браузере для быстрого просмотра;
локальный HTTP-сервер предпочтительнее для функций вроде копирования контактов.

## 2. Где что менять

| Файл | Назначение |
| --- | --- |
| `index.html` | Тексты, секции, навыки, ссылки, изображения, боковое меню |
| `assets/styles.css` | Основные цвета, типографика, адаптив и контакты |
| `assets/hero.css` | Первый экран |
| `assets/work.css` | Карточки клиентских проектов |
| `assets/profile.css` | Фото, HackAlem AI и сертификат |
| `assets/navigation.css` | Бургер и левая панель |
| `assets/main.js` | Подробности кейсов, фильтр, меню, контакты, письмо |
| `assets/hero-art.js` | Интерактивная фигура на первом экране |
| `assets/fonts.css`, `assets/manrope-*.woff2` | Локальные шрифты |
| `assets/Alikhan-Abay.vcf` | Скачиваемый контакт |
| `assets/Alikhan-Abai-HackAlem-AI.pdf` | Оригинальный сертификат |
| `tools/` | Локальный сервер и подготовка файлов для хостинга |
| `wrangler.jsonc` | Настройки отдельного проекта в Cloudflare |

Контакты встречаются в `index.html`, `assets/main.js` и vCard. При изменении
адреса или телефона обнови все три места. Тексты модальных окон проектов —
в объекте `projects` внутри `main.js`.

## 3. Подготовить публикацию

```sh
npm run build
```

Команда создаст `dist/`, копируя туда только `index.html` и `assets/`.
Именно содержимое `dist/` загружается на статический хостинг.
Служебные файлы проекта туда не попадают. Не редактируй `dist/` вручную:
следующий запуск сборки заменит эту папку.

Для просмотра результата сборки:

```sh
npm run preview
```

## 4. Исходная версия и репозиторий

Исходная версия размещена через Sites в ChatGPT:
https://alikhan-saper-studio.saper-avii.chatgpt.site

Репозиторий для самостоятельной работы и публикации через Cloudflare:
[saper-avi/Own-portfolio](https://github.com/saper-avi/Own-portfolio).

Экспорт подготовлен на основе версии `e32bceb44e45e131d0ec7d66636cde3fd79fdd06`.
В него добавлены локальный сервер, сборка и конфигурация Cloudflare.
Изменения в локальной копии и в Sites не синхронизируются автоматически.

## 5. Самостоятельный хостинг: Cloudflare Workers Static Assets

Для этого сайта подходит статическое размещение: у него нет базы данных,
серверных API и обязательных внешних библиотек. Cloudflare хранит и раздаёт
загруженные файлы; твой ноутбук и VS Code после публикации можно закрыть.
Конфигурация `wrangler.jsonc` уже указывает на `dist/`; серверный Worker-код
для текущего сайта не требуется.

### Первый ручной deploy

Используй свой аккаунт Cloudflare. В терминале проекта:

```sh
npm ci
npx wrangler login
npm run deploy
```

`npm run deploy` сначала выполняет сборку, затем публикует готовый сайт.
Wrangler откроет вход в Cloudflare и при публикации покажет адрес `workers.dev`.
Используй точный адрес из результата деплоя. `tools/serve.mjs` в облаке запускать
не надо: Cloudflare раздаёт готовые файлы. Имя Worker — `alikhan-portfolio`,
как в `wrangler.jsonc`.

### Автоматические обновления через GitHub

1. Загрузи исходники этой папки в корень репозитория `saper-avi/Own-portfolio`:
   `index.html`, `assets/`, `tools/`, `package.json`, `package-lock.json`,
   `wrangler.jsonc`, `.gitignore` и `README.md`.
2. В Cloudflare Workers подключи `saper-avi/Own-portfolio` через Git integration.
3. Укажи следующие настройки:

| Настройка | Значение |
| --- | --- |
| Worker name | `alikhan-portfolio` |
| Production branch | `main` |
| Root directory | Оставить пустым: проект находится в корне репозитория |
| Build command | Оставить пустым: сборка входит в deploy |
| Deploy command | `npm run deploy` |
| Assets directory | `./dist` — уже указан в `wrangler.jsonc` |

После подключения: правки в VS Code → commit → push в `main` → автоматическое
обновление сайта. Имя репозитория `Own-portfolio` и имя Worker
`alikhan-portfolio` могут различаться.

Wrangler 4.152.0 закреплён в `package.json` и `package-lock.json`.
Сохрани оба файла в репозитории; `npm ci` установит зависимости по lockfile.
Папка `dist/` не хранится в Git: она добавлена в `.gitignore` и создаётся при
сборке. Если Cloudflare сразу запускает `npx wrangler deploy` после установки
зависимостей, папки ещё нет и публикация завершается ошибкой. Команда
`npm run deploy` сначала создаёт `dist/`, затем запускает Wrangler.

Официальные инструкции:

- [Статические файлы и их размещение](https://developers.cloudflare.com/workers/static-assets/)
- [Запуск и deploy](https://developers.cloudflare.com/workers/static-assets/get-started/)
- [Git integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/)
- [Настройки Git build](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)

## 6. Свой домен

Начать можно с адреса, выданного хостингом. Собственный домен покупается и
продлевается отдельно. Для Cloudflare Custom Domain нужна активная DNS-зона
домена в Cloudflare. Добавь адрес в настройках Worker:
**Settings → Domains & Routes → Add → Custom Domain**.
Cloudflare создаст DNS-запись и сертификат HTTPS.

После первого успешного деплоя или подключения собственного домена добавь
`og:url` в `<head>` файла `index.html` с точным адресом опубликованного сайта.
Устаревший адрес Sites из этого тега удалён. Затем выполни `npm run deploy`
или отправь изменения в `main` для автоматической публикации.
Проверь новый адрес в приватном окне браузера без входа в аккаунт хостинга.

Документация:
[Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

## 7. Что важно для контактов

Telegram и WhatsApp открывают соответствующие сервисы. «Составить письмо»
создаёт черновик через `mailto:` в почтовом приложении посетителя.
Сайт сам не отправляет письма и не сохраняет заявки. Если понадобится форма,
принимающая заявки прямо на сайте, её нужно подключить отдельно.

Лицензия шрифта Manrope находится в `assets/Manrope-OFL.txt`.
Фото и сертификат включены как материалы текущего портфолио.
