(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const email = 'abaialihan23@gmail.com';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  const motionToggle = $('#motion-toggle');
  let motionEnabled = !reducedMotion.matches;
  let savedMotion = null;
  try { savedMotion = localStorage.getItem('saper-motion'); } catch (_) { /* Storage is optional. */ }
  if (savedMotion === 'off') motionEnabled = false;

  const syncMotion = () => {
    if (reducedMotion.matches) motionEnabled = false;
    root.classList.toggle('motion-off', !motionEnabled);
    motionToggle.setAttribute('aria-pressed', String(motionEnabled));
    motionToggle.disabled = reducedMotion.matches;
    motionToggle.setAttribute('aria-label', reducedMotion.matches
      ? 'Анимация отключена системной настройкой уменьшения движения'
      : `Анимация ${motionEnabled ? 'включена. Выключить' : 'выключена. Включить'} анимацию`);
    $('.motion-label', motionToggle).textContent = reducedMotion.matches ? 'Reduced motion' : motionEnabled ? 'Motion on' : 'Motion off';
    document.dispatchEvent(new CustomEvent('portfolio:motion', { detail: { enabled: motionEnabled } }));
  };
  motionToggle.addEventListener('click', () => {
    motionEnabled = !motionEnabled;
    savedMotion = motionEnabled ? 'on' : 'off';
    try { localStorage.setItem('saper-motion', savedMotion); } catch (_) { /* Storage is optional. */ }
    syncMotion();
  });
  reducedMotion.addEventListener('change', () => {
    motionEnabled = !reducedMotion.matches && savedMotion !== 'off';
    syncMotion();
  });
  syncMotion();
  // Defer scripts after this file also receive the initial motion preference.
  document.addEventListener('DOMContentLoaded', syncMotion, { once: true });

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Almaty', hour: '2-digit', minute: '2-digit', hour12: false
  });
  function updateClock() {
    const now = new Date();
    $$('.local-time').forEach(node => { node.textContent = timeFormatter.format(now); });
    $('#year').textContent = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Almaty', year: 'numeric' }).format(now);
  }
  updateClock();
  setInterval(() => { if (!document.hidden) updateClock(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateClock(); });

  // Native dialog handles modal focus and keeps the background inert.
  const menuToggle = $('#menu-toggle');
  const siteMenu = $('#site-menu');
  const menuLinks = $$('.drawer-nav a');
  let menuCloseTimer = 0;
  let menuTarget = null;

  function openMenu() {
    if (siteMenu.open) return;
    clearTimeout(menuCloseTimer);
    menuTarget = null;
    siteMenu.classList.remove('is-closing');
    siteMenu.showModal();
    document.body.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    $('.drawer-close', siteMenu).focus({ preventScroll: true });
  }
  function closeMenu(target = null) {
    if (!siteMenu.open || siteMenu.classList.contains('is-closing')) return;
    menuTarget = target;
    siteMenu.classList.add('is-closing');
    menuCloseTimer = window.setTimeout(() => siteMenu.close(), motionEnabled ? 220 : 0);
  }
  menuToggle.addEventListener('click', openMenu);
  $('.drawer-close', siteMenu).addEventListener('click', () => closeMenu());
  siteMenu.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = $$('button:not([disabled]), a[href]', siteMenu);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || !siteMenu.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  siteMenu.addEventListener('cancel', event => {
    event.preventDefault();
    closeMenu();
  });
  siteMenu.addEventListener('click', event => {
    if (event.target !== siteMenu) return;
    const bounds = siteMenu.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeMenu();
  });
  menuLinks.forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = $(link.hash);
    if (!target) return;
    event.preventDefault();
    closeMenu(target);
  }));
  siteMenu.addEventListener('close', () => {
    clearTimeout(menuCloseTimer);
    siteMenu.classList.remove('is-closing');
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    const target = menuTarget;
    menuTarget = null;
    if (!target) {
      menuToggle.focus({ preventScroll: true });
      return;
    }
    const hash = `#${target.id}`;
    if (location.hash !== hash) history.pushState(null, '', hash);
    const temporaryFocus = !target.hasAttribute('tabindex');
    if (temporaryFocus) {
      target.setAttribute('tabindex', '-1');
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: motionEnabled ? 'smooth' : 'instant', block: 'start' });
    menuLinks.forEach(link => {
      if (link.hash === hash) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });

  // Progressive section reveals, without hiding content in unsupported browsers.
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -12px 0px' });
    root.classList.add('js');
    $$('.reveal').forEach(node => revealObserver.observe(node));

    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        menuLinks.forEach(link => {
          const active = link.hash === `#${entry.target.id}`;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-18% 0px -58% 0px', threshold: 0 });
    [...new Set(menuLinks.map(link => $(link.hash)))].filter(Boolean).forEach(section => sectionObserver.observe(section));
  }

  const projectCards = $$('.project-card');
  $$('.filter').forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    $$('.filter').forEach(filter => {
      const active = filter === button;
      filter.classList.toggle('active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    let count = 0;
    projectCards.forEach(card => {
      const show = category === 'all' || card.dataset.category === category;
      card.hidden = !show;
      if (show) {
        count++;
        card.classList.add('visible');
      }
    });
    $('#projects-grid').classList.toggle('single-result', count === 1);
    $('#filter-status').textContent = `Показано проектов: ${count}.`;
  }));

  const projects = {
    clinic: {
      category: '01 / COMMERCIAL WORK · HEALTHCARE',
      title: 'Qazaq Clinic',
      image: 'assets/qazaq-clinic-live.jpg',
      imageAlt: 'Страница комплексного УЗИ Qazaq Med Clinic',
      imageCaption: 'Сайт клиента · текущая версия. Скриншот от 22.10.2026.',
      lead: 'Понятный путь от медицинской услуги до обращения.',
      tags: ['Tilda', 'Zero Block', 'Адаптив', 'Google Sheets', 'WhatsApp'],
      sections: [
        { heading: 'Контекст', text: 'Работа с сайтом частной клиники: страницы услуг, формы обращения и регулярное обновление информации. Важно, чтобы посетитель мог найти нужную услугу и оставить заявку с телефона.' },
        { heading: 'Моя работа', items: ['Вёрстка и адаптация страниц в Tilda и Zero Block.', 'Работа с формами и передачей обращений в Google Sheets.', 'Контактные сценарии через WhatsApp.', 'Обновление цен, дат и содержания страниц.'] },
        { heading: 'На чём был фокус', text: 'Структура страницы, читаемость на небольшом экране и связь между сайтом и обработкой обращения. Поддержка сайта — часть работы над пользовательским опытом.', full: true }
      ],
      links: [
        { label: 'Открыть сайт клиники', href: 'https://qazaqclinic.kz/qazaqmeduzi', external: true },
        { label: 'Обсудить похожую задачу', href: 'https://t.me/saperAviiiiii', external: true, secondary: true }
      ]
    },
    media: {
      category: '03 / PERSONAL PROJECT · FRONTEND',
      title: 'MediaShelf',
      image: 'assets/mediashelf-live.jpg',
      imageAlt: 'Главный экран MediaShelf с каталогом фильмов',
      imageCaption: 'Работающий проект · скриншот от 22.10.2026.',
      lead: 'Каталог фильмов, в котором данные превращаются в интерфейс.',
      tags: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'TMDB API'],
      sections: [
        { heading: 'Контекст', text: 'Собственный frontend-проект для поиска и изучения фильмов. Данные загружаются из TMDB: популярные фильмы, описания, жанры, рейтинги и актёрский состав.' },
        { heading: 'Что реализовано', items: ['Загрузка популярных фильмов и фильтрация карточек без постеров.', 'Поиск по названию и пагинация.', 'Страница фильма с подробностями и актёрами.', 'Карусель и состояния загрузки, ошибки и пустой выдачи.'] },
        { heading: 'Технические решения', text: 'Интеграция с TMDB API, серверная загрузка данных и компонентная структура интерфейса. Предусмотрены состояния загрузки и обработки ошибок, а карточки без постеров отфильтрованы.', full: true }
      ],
      links: [
        { label: 'Открыть проект', href: 'https://mediashelf-frontend-final.vercel.app', external: true },
        { label: 'Исходный код', href: 'https://github.com/saper-avi/mediashelf-frontend', external: true, secondary: true }
      ]
    },
    ay: {
      category: '02 / COMMERCIAL WORK · EDUCATION',
      title: 'AY Consults',
      image: 'assets/ay-consults-live.jpg',
      imageAlt: 'Страница Tech Orda на сайте AY Digital Academy',
      imageCaption: 'Сайт клиента · текущая версия. Скриншот от 22.10.2026.',
      lead: 'Несколько страниц. Одна понятная структура.',
      tags: ['Web design', 'Tilda', 'Структура', 'Адаптив'],
      sections: [
        { heading: 'Контекст', text: 'Многостраничный сайт для AY Consults в контексте образовательного проекта Tech Orda. Задача — организовать информацию и последовательно провести посетителя по страницам.' },
        { heading: 'Моя работа', items: ['Дизайн и сборка страниц на Tilda.', 'Организация блоков и визуальной иерархии.', 'Согласованное оформление страниц.', 'Адаптация под разные размеры экрана.'] },
        { heading: 'На чём был фокус', text: 'В образовательном проекте посетителю нужно разобраться в предложении. Последовательная структура и аккуратная подача помогают сделать этот путь понятнее.', full: true }
      ],
      links: [
        { label: 'Открыть Tech Orda', href: 'https://ay-consults.kz/tech_orda', external: true },
        { label: 'Сайт AY Consults', href: 'https://ay-consults.kz/', external: true, secondary: true }
      ]
    }
  };

  const dialog = $('#case-dialog');
  let dialogOpener = null;
  const makeText = (tag, text, className) => {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  function openProject(id, opener) {
    const project = projects[id];
    if (!project) return;
    dialogOpener = opener;
    $('#case-category').textContent = project.category;
    $('#case-title').textContent = project.title;
    $('#case-lead').textContent = project.lead;
    $('#case-image').src = project.image;
    $('#case-image').alt = project.imageAlt;
    $('#case-image-link').href = project.image;
    $('#case-image-caption').textContent = project.imageCaption;
    $('#case-tags').replaceChildren(...project.tags.map(tag => makeText('span', tag)));
    $('#case-content').replaceChildren(...project.sections.map(section => {
      const block = document.createElement('section');
      if (section.full) block.className = 'case-full';
      block.append(makeText('h3', section.heading));
      if (section.text) block.append(makeText('p', section.text));
      if (section.items) {
        const list = document.createElement('ul');
        list.append(...section.items.map(item => makeText('li', item)));
        block.append(list);
      }
      return block;
    }));
    $('#case-links').replaceChildren(...project.links.map(link => {
      const anchor = makeText('a', link.label, link.secondary ? 'secondary' : '');
      anchor.href = link.href;
      if (link.external) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
      return anchor;
    }));
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      document.body.classList.add('dialog-open');
      dialog.scrollTop = 0;
      $('.case-close', dialog).focus({ preventScroll: true });
    }
  }
  $$('[data-project]').forEach(button => button.addEventListener('click', () => openProject(button.dataset.project, button)));
  $('.case-close', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    dialogOpener?.focus({ preventScroll: true });
  });

  // Pointer effects enhance the ordinary links; touch and keyboard stay simple.
  $$('.social-card').forEach(card => {
    let frame = 0;
    card.addEventListener('pointermove', event => {
      if (!finePointer.matches || !motionEnabled) return;
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        card.style.setProperty('--tilt-x', `${(0.5 - y) * 7}deg`);
        card.style.setProperty('--tilt-y', `${(x - 0.5) * 8}deg`);
        card.style.setProperty('--shine-x', `${x * 100}%`);
        card.style.setProperty('--shine-y', `${y * 100}%`);
      });
    });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });

  let toastTimer;
  function showToast(message) {
    const toast = $('#toast');
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3600);
  }
  async function copyText(value) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(value);
      return true;
    } catch (_) {
      const input = document.createElement('textarea');
      input.value = value;
      input.setAttribute('readonly', '');
      input.style.cssText = 'position:fixed;left:-9999px;top:0;font-size:16px';
      document.body.append(input);
      input.select();
      input.setSelectionRange(0, value.length);
      let result = false;
      try { result = document.execCommand('copy'); } catch (_) { /* Show an honest fallback. */ }
      input.remove();
      return result;
    }
  }
  const copyButton = $('#copy-email');
  let copyResetTimer;
  copyButton.addEventListener('click', async () => {
    const copied = await copyText(email);
    copyButton.focus({ preventScroll: true });
    if (!copied) {
      showToast(`Не удалось скопировать. Почта: ${email}`);
      return;
    }
    showToast('Почта скопирована. Хорошие идеи начинаются с письма.');
    $('use', copyButton).setAttribute('href', '#icon-check');
    $('.copy-label', copyButton).textContent = 'СКОПИРОВАНО';
    clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
      $('use', copyButton).setAttribute('href', '#icon-copy');
      $('.copy-label', copyButton).textContent = 'СКОПИРОВАТЬ';
    }, 3600);
  });

  const briefs = {
    landing: { subject: 'Обсудим лендинг', opening: 'Хочу обсудить создание лендинга.', prompts: 'О проекте:\nДля кого сайт:\nОсновная задача:\nПримеры, которые нравятся:\nЖелаемые сроки:\nОриентир по бюджету:' },
    design: { subject: 'Задача по веб-дизайну', opening: 'Нужна помощь с дизайном сайта или интерфейса.', prompts: 'О проекте:\nКакие экраны нужны:\nЧто уже готово:\nПримеры и пожелания:\nЖелаемые сроки:\nОриентир по бюджету:' },
    frontend: { subject: 'Задача по frontend', opening: 'Хочу обсудить frontend-разработку.', prompts: 'О проекте:\nЧто нужно реализовать:\nЕсть ли макеты:\nТекущий стек или ссылка:\nЖелаемые сроки:\nОриентир по бюджету:' },
    support: { subject: 'Доработка сайта', opening: 'Нужна помощь с доработкой сайта.', prompts: 'Ссылка на сайт:\nЧто нужно изменить:\nНа какой платформе сайт:\nЧто сейчас мешает:\nЖелаемые сроки:\nОриентир по бюджету:' },
    collaboration: { subject: 'Предложение о сотрудничестве', opening: 'Хочу предложить сотрудничество.', prompts: 'Меня зовут:\nКоманда / компания:\nО предложении:\nФормат работы:\nКак со мной связаться:' }
  };
  const briefSelect = $('#brief-type');
  function updateBrief() {
    const brief = briefs[briefSelect.value] || briefs.landing;
    const body = `Привет, Алихан!\n\n${brief.opening}\n\n${brief.prompts}\n\nСпасибо!`;
    $('#brief-link').href = `mailto:${email}?subject=${encodeURIComponent(brief.subject)}&body=${encodeURIComponent(body)}`;
  }
  briefSelect.addEventListener('change', updateBrief);
  updateBrief();

  // Decorative SVGs do not duplicate the labels of links and buttons.
  $$('.icon,.social-icon').forEach(svg => { svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false'); });
})();
