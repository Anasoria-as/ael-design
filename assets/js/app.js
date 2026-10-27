/* =========================================================
   ael-design · lógica de la web
   El contenido vive en /content/site.json y /content/projects.json.
   Para cambiar textos o proyectos no hace falta tocar este archivo.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var app = document.getElementById('app');
  var footer = document.getElementById('footer');
  var SITE = null;
  var PROJECTS = [];
  var lang = root.getAttribute('lang') === 'en' ? 'en' : 'es';

  /* ---------- utilidades ---------- */
  function store(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  // Idioma inicial: guardado > navegador
  if (!read('ael-lang')) {
    lang = (navigator.language || 'es').toLowerCase().indexOf('es') === 0 ? 'es' : 'en';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // Devuelve el texto en el idioma activo (acepta texto simple o {es, en})
  function t(v) {
    if (v == null) return '';
    if (typeof v === 'string' || Array.isArray(v)) return v;
    return v[lang] != null ? v[lang] : (v.es != null ? v.es : '');
  }
  // Devuelve siempre una lista (vacía si falta), para que la web no falle si se vacía un campo
  function arr(v) { var x = t(v); return Array.isArray(x) ? x : []; }
  // Texto con **negritas**: se escapa y luego se convierten los ** en <strong>
  function rich(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }
  function ui(key) { return (SITE && SITE.ui[lang] && SITE.ui[lang][key]) || key; }

  var ICON_DL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg>';

  function cvButtons() {
    return '<div class="cv-buttons">' +
      '<a class="cv-btn" href="' + esc(SITE.cv.es) + '" download><span class="code">ES</span>' + esc(ui('cv_es')) + ICON_DL + '</a>' +
      '<a class="cv-btn" href="' + esc(SITE.cv.en) + '" download><span class="code">EN</span>' + esc(ui('cv_en')) + ICON_DL + '</a>' +
      '</div>';
  }

  function art(p) {
    if (p.cover) {
      return '<img src="' + esc(p.cover) + '" alt="' + esc(t(p.title)) + '" loading="lazy">';
    }
    return '<div class="art art-' + esc(p.art || 'yellow') + '" aria-hidden="true">' +
      '<span class="corner">' + esc(t(p.kind)) + '</span>' +
      '<span class="word">' + esc(p.art_word || p.slug) + '</span><span class="dot"></span></div>';
  }

  // Tarjeta de proyecto: imagen grande, título + pastilla, tipo y cliente/año
  function projectCard(p) {
    var sub = [t(p.client), p.year].filter(Boolean).join(' · ');
    return '<a class="card" href="#p-' + esc(p.slug) + '" data-cursor="view">' +
      '<div class="cover">' + art(p) + '</div>' +
      '<div class="card-meta">' +
        '<div class="card-row"><h3>' + esc(t(p.title)) + '</h3>' +
        '<span class="pill"><span class="pill-star" aria-hidden="true">✱</span>' + esc(ui('case_study')) + '</span></div>' +
        '<p class="card-kind">' + esc(t(p.kind)) + '</p>' +
        (sub ? '<p class="card-sub">' + esc(sub) + '</p>' : '') +
      '</div></a>';
  }

  // Cifra destacada (+6 años) y frase de introducción, encima de los proyectos
  function projectsIntro() {
    var s = SITE.stat || {};
    return '<div class="bento">' +
      (s.value ? '<div class="stat-card">' +
        (t(s.label) ? '<span class="stat-label">' + esc(t(s.label)) + '</span>' : '') +
        '<strong class="stat-value">' + esc(t(s.value)) + '</strong>' +
        (t(s.text) ? '<p class="stat-text">' + esc(t(s.text)) + '</p>' : '') +
      '</div>' : '') +
      '<div class="intro-card"><p class="intro-big">' + esc(ui('projects_intro')).replace(/(\w)-(\w)/g, '$1&#8209;$2') + '</p>' +   // guion que no parte la palabra
        '<p class="intro-small mono">' + esc(ui('projects_hint')) + ' ↓</p></div>' +
    '</div>';
  }

  function contactSection() {
    // Rejilla de 2 columnas: título y texto a la izquierda; email y botones a la derecha,
    // con el email en la misma línea base que «¿Hablamos?» y el bloque pegado al borde derecho
    return '<section class="section contact" id="contacto"><div class="wrap">' +
      '<div class="contact-grid">' +
        '<h2 class="contact-big">' + esc(ui('contact_kicker')) + '<span class="sq" aria-hidden="true"></span></h2>' +
        '<div class="mail-row"><a class="mail" href="mailto:' + esc(SITE.email) + '">' + esc(SITE.email) + '</a>' +
          '<button type="button" class="copy-btn" id="copy-mail" data-copy="' + esc(SITE.email) + '">' + esc(ui('copy')) + '</button></div>' +
        '<p class="contact-text">' + esc(ui('contact_text')) + '</p>' +
        '<div class="contact-links">' +
          '<a class="btn btn-ghost btn-sm" href="' + esc(SITE.linkedin) + '" target="_blank" rel="noopener">LinkedIn <span class="arr">↗</span></a>' +
          '<a class="btn btn-ghost btn-sm" href="' + esc(SITE.cv[lang]) + '" download>CV · ' + lang.toUpperCase() + ' <span class="arr">↓</span></a>' +
        '</div>' +
      '</div></div></section>';
  }

  /* ---------- vistas ---------- */
  function viewHome() {
    var h = SITE.hero;
    var marquee = arr(SITE.marquee).concat(arr(SITE.marquee)).map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('');
    var featured = PROJECTS.filter(function (p) { return p.featured; });
    var rest = PROJECTS.filter(function (p) { return !p.featured; });
    var count = String(PROJECTS.length).padStart(2, '0');

    return '' +
      '<section class="hero wrap" id="inicio">' +
        '<div class="hero-top"><span class="status"><i aria-hidden="true"></i>' + esc(t(h.status)) + '</span>' +
        '<span class="mono muted">' + esc(t(SITE.location)) + '</span></div>' +
        '<h1 class="hero-name"><span class="l1">Ana Soria</span><span class="l2">Ael<span class="sq" aria-hidden="true"></span></span></h1>' +
        '<div class="hero-grid">' +
          '<div>' +
            '<p class="role"><mark>' + esc(t(h.role)) + '</mark></p>' +
            '<p class="intro">' + esc(t(h.intro)) + '</p>' +
            '<div class="actions"><a class="btn btn-primary" href="#proyectos">' + esc(ui('see_projects')) + ' <span class="arr">→</span></a>' +
            '<a class="btn btn-ghost" href="#sobre-mi">' + esc(ui('nav_about')) + '</a></div>' +
          '</div>' +
          '<aside class="cv-card" aria-label="' + esc(ui('cv_title')) + '">' +
            '<div class="cv-head"><strong>' + esc(ui('cv_title')) + '</strong><span class="mono muted">' + esc(ui('cv_note')) + '</span></div>' +
            cvButtons() +
          '</aside>' +
        '</div>' +
      '</section>' +
      '<div class="tape" aria-hidden="true"><div class="tape-track">' + marquee + '</div></div>' +
      '<section class="section wrap" id="proyectos">' +
        '<div class="sec-head"><h2 class="h2">' + esc(ui('projects_title')) + '<sup>(' + count + ')</sup></h2></div>' +
        projectsIntro() +
        '<div class="projects">' + featured.concat(rest).map(projectCard).join('') + '</div>' +
      '</section>' +
      '<section class="section wrap" id="aporto" style="padding-top:0">' +
        '<div class="sec-head"><h2 class="h2">' + esc(ui('strengths_title')) + '</h2></div>' +
        '<div class="strengths">' + arr(SITE.strengths).map(function (s) {
          return '<article class="strength"><span class="mono slash">' + esc(s.tag) + '</span><h3>' + esc(t(s.title)) + '</h3><p>' + esc(t(s.text)) + '</p></article>';
        }).join('') + '</div>' +
      '</section>' +
      '<section class="section wrap" style="padding-top:0">' +
        '<div class="sec-head"><h2 class="h2">' + esc(ui('skills_title')) + '</h2></div>' +
        skillsBlock() +
      '</section>' +
      contactSection();
  }

  function skillsBlock() {
    return '<div class="skills">' + arr(SITE.skills).map(function (g) {
      return '<div class="skill-row"><span class="mono slash">' + esc(t(g.group)) + '</span><div class="chips">' +
        arr(g.items).map(function (i) { return '<span class="chip">' + esc(i) + '</span>'; }).join('') + '</div></div>';
    }).join('') + '</div>';
  }

  function viewAbout() {
    var a = SITE.about;
    var logo = document.querySelector('.brand .logo');   // mismo logo SVG de la cabecera
    var photo = a.photo
      ? '<img src="' + esc(a.photo) + '" alt="Ana Soria Ael">'
      : '<div class="portrait-logo">' + (logo ? logo.outerHTML : '') + '</div>';
    return '' +
      '<section class="wrap page-head">' +
        '<h1 class="page-title">' + esc(ui('about_title')) + '<span class="sq" aria-hidden="true"></span></h1>' +
      '</section>' +
      '<section class="section wrap about-main">' +
        // título grande en rosa que se sale por la derecha de la pantalla
        (t(a.title) ? '<h2 class="about-title">' + esc(t(a.title)) + '</h2>' : '') +
        '<div class="about-body">' +
          // columna izquierda: foto y, debajo, la caja para descargar el CV
          '<div class="portrait">' + photo +
            '<div class="cv-banner"><div><h2>' + esc(ui('cv_title')) + '</h2><p>' + esc(ui('cv_note')) + '</p></div>' + cvButtons() + '</div>' +
          '</div>' +
          '<div class="about-text">' + arr(a.paragraphs).map(function (p) { return '<p>' + rich(p) + '</p>'; }).join('') +
            (t(a.quote) ? '<p class="about-quote">' + esc(t(a.quote)) + '</p>' : '') +
            (t(a.signature) ? '<p class="about-sign">' + esc(t(a.signature)) + '</p>' : '') +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="section wrap" style="padding-top:0">' +
        '<div class="sec-head"><h2 class="h2">' + esc(ui('experience')) + '</h2></div>' +
        '<div class="timeline">' + arr(SITE.experience).map(function (x) {
          return '<article class="tl-item"><div class="tl-period">' + esc(x.period) + '<small>' + esc(t(x.place)) + '</small></div>' +
            '<div><h3 class="tl-role">' + esc(t(x.role)) + '</h3><p class="tl-org">' + esc(x.org) + '</p>' +
            '<ul class="bullets">' + arr(x.points).map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul></div></article>';
        }).join('') + '</div>' +
      '</section>' +
      '<section class="section wrap" style="padding-top:0">' +
        '<div class="two-col">' +
          '<div><h2 class="h3">' + esc(ui('education')) + '</h2><div class="timeline">' + arr(SITE.education).map(function (x) {
            return '<article class="tl-item"><div class="tl-period">' + esc(x.period) + '</div><div><h3 class="tl-role">' + esc(t(x.title)) + '</h3><p class="tl-org">' + esc(x.school) + '</p></div></article>';
          }).join('') + '</div></div>' +
          '<div><h2 class="h3">' + esc(ui('languages')) + '</h2><div class="lang-list">' + arr(SITE.languages).map(function (l) {
            return '<div><span>' + esc(t(l.name)) + '</span><span>' + esc(t(l.level)) + '</span></div>';
          }).join('') + '</div></div>' +
        '</div>' +
      '</section>' +
      '<section class="section wrap" style="padding-top:0">' +
        '<div class="sec-head"><h2 class="h2">' + esc(ui('skills_title')) + '</h2></div>' + skillsBlock() +
      '</section>' +
      contactSection();
  }

  // Ventana de navegador con la web real capturada: se hace scroll dentro y se cambia entre escritorio y móvil
  function webPreview(p) {
    var w = p.web_preview;
    if (!w || !arr(w.desktop).length) return '';
    function shots(list, label) {
      return arr(list).map(function (src, i) {
        return '<img src="' + esc(src) + '" alt="' + (i ? '' : esc(label)) + '"' + (i < 2 ? '' : ' loading="lazy"') + ' decoding="async">';
      }).join('');
    }
    var hasMobile = arr(w.mobile).length > 0;
    var start = (hasMobile && window.matchMedia && matchMedia('(max-width: 700px)').matches) ? 'mobile' : 'desktop';
    return '<div class="webview" data-mode="' + start + '">' +
      '<div class="webview-bar">' +
        '<span class="webview-dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
        '<span class="webview-url">' + esc(w.url || '') + '</span>' +
        (hasMobile ? '<div class="seg webview-toggle" role="group" aria-label="' + esc(ui('webview_label')) + '">' +
          '<button type="button" data-view="desktop" aria-pressed="' + (start === 'desktop') + '">' + esc(ui('view_desktop')) + '</button>' +
          '<button type="button" data-view="mobile" aria-pressed="' + (start === 'mobile') + '">' + esc(ui('view_mobile')) + '</button>' +
        '</div>' : '') +
      '</div>' +
      '<div class="webview-screen webview-desktop" tabindex="0" aria-label="' + esc(ui('webview_hint')) + '">' + shots(w.desktop, w.url) + '</div>' +
      (hasMobile ? '<div class="webview-phone"><div class="webview-screen webview-mobile" tabindex="0" aria-label="' + esc(ui('webview_hint')) + '">' + shots(w.mobile, w.url) + '</div></div>' : '') +
    '</div>' +
    '<p class="webview-hint mono">↕ ' + esc(ui('webview_hint')) + '</p>';
  }

  function viewProject(slug) {
    var i = PROJECTS.findIndex(function (p) { return p.slug === slug; });
    if (i < 0) return viewHome();
    var p = PROJECTS[i];
    var next = PROJECTS[(i + 1) % PROJECTS.length];
    var meta = [
      [ui('client'), t(p.client)],
      [ui('role'), t(p.role)],
      [ui('year'), p.year],
      [ui('tools'), arr(p.tools).join(', ')]
    ].filter(function (m) { return m[1]; });

    var sections = arr(p.sections).map(function (s) {
      // Si la sección tiene lista con elementos, se muestra la lista; si no, el texto
      var items = arr(s.list);
      var body = items.length
        ? '<ul class="bullets">' + items.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>'
        : '<p>' + esc(t(s.text)) + '</p>';
      return '<section class="case-sec"><h2>' + esc(t(s.title)) + '</h2><div>' + body + '</div></section>';
    }).join('');

    var gallery = (p.gallery && p.gallery.length)
      ? '<div class="gallery">' + p.gallery.map(function (g) {
          // las imágenes apaisadas ocupan las dos columnas
          return '<img src="' + esc(g.src || g) + '" alt="' + esc(t(g.alt) || t(p.title)) + '" loading="lazy" onload="if(this.naturalWidth/this.naturalHeight>1)this.classList.add(\'wide\')">';
        }).join('') + '</div>'
      : '';

    return '' +
      '<article class="wrap">' +
        '<header class="case-head">' +
          '<a class="back" href="#proyectos">← ' + esc(ui('back')) + '</a>' +
          '<span class="mono slash">' + esc(t(p.kind)) + '</span>' +
          '<h1 class="case-title">' + esc(t(p.title)) + '</h1>' +
          '<p class="lead">' + esc(t(p.summary)) + '</p>' +
          (p.link ? '<div class="actions" style="margin-top:.4rem"><a class="btn btn-primary" href="' + esc(p.link) + '" target="_blank" rel="noopener">' + esc(ui('visit')) + ' <span class="arr">↗</span></a></div>' : '') +
          '<div class="case-meta">' + meta.map(function (m) {
            return '<div><span class="mono muted">' + esc(m[0]) + '</span><b>' + esc(m[1]) + '</b></div>';
          }).join('') + '</div>' +
        '</header>' +
        (p.web_preview && arr(p.web_preview.desktop).length ? webPreview(p) : '<div class="case-cover">' + art(p) + '</div>') +
        '<div class="case-sections">' + sections + '</div>' +
        gallery +
        '<a class="next" href="#p-' + esc(next.slug) + '" data-cursor="view">' +
          '<span class="mono">' + esc(ui('next')) + '</span>' +
          '<span class="big">' + esc(t(next.title)) + '<span class="arrow" aria-hidden="true">→</span></span>' +
        '</a>' +
      '</article>' +
      contactSection();
  }

  function renderFooter() {
    footer.innerHTML = '<div class="wrap footer-in">' +
      '<span>© ' + new Date().getFullYear() + ' Ana Soria Ael</span>' +
      '<span><a href="' + esc(SITE.linkedin) + '" target="_blank" rel="noopener">LinkedIn</a> · <a href="mailto:' + esc(SITE.email) + '">Email</a></span>' +
      '</div>';
  }

  /* ---------- router (#inicio, #proyectos, #sobre-mi, #contacto, #p-slug) ---------- */
  function route(opts) {
    opts = opts || {};
    var hash = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    var view = 'home', anchor = null;
    if (hash === 'sobre-mi') view = 'about';
    else if (hash.indexOf('p-') === 0) view = 'project';
    else if (hash === 'proyectos' || hash === 'contacto') anchor = hash;

    if (view === 'about') app.innerHTML = viewAbout();
    else if (view === 'project') app.innerHTML = viewProject(hash.slice(2));
    else app.innerHTML = viewHome();

    renderFooter();
    applyI18nStatic();

    // navegación activa
    document.querySelectorAll('.nav a').forEach(function (a) {
      var r = a.getAttribute('data-route');
      var active = (view === 'about' && r === 'sobre-mi') || (view === 'project' && r === 'proyectos') || (view === 'home' && anchor === r);
      if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });

    // título de la pestaña
    var base = 'Ana Soria Ael · ael-design';
    if (view === 'about') document.title = ui('about_title') + ' · ' + base;
    else if (view === 'project') {
      var p = PROJECTS.find(function (x) { return 'p-' + x.slug === hash; });
      document.title = (p ? t(p.title) + ' · ' : '') + base;
    } else document.title = 'Ana Soria Ael · Web Designer & Frontend Developer';

    if (opts.keepScroll) return;
    if (anchor) {
      var el = document.getElementById(anchor);
      if (el) el.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }

  /* ---------- textos fijos de la cabecera ---------- */
  function applyI18nStatic() {
    root.setAttribute('lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = ui(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-label]').forEach(function (el) {
      var l = ui(el.getAttribute('data-i18n-label'));
      el.setAttribute('aria-label', l); el.setAttribute('title', l);
    });
    document.querySelectorAll('[data-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
    });
  }

  /* ---------- idioma ---------- */
  document.querySelectorAll('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      var l = b.getAttribute('data-lang');
      if (l === lang) return;
      lang = l; store('ael-lang', l);
      route({ keepScroll: true });
    });
  });

  /* ---------- tema claro / oscuro ---------- */
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function syncThemeButtons() {
    var th = currentTheme();
    document.querySelectorAll('[data-theme-btn]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-theme-btn') === th));
    });
  }
  document.querySelectorAll('[data-theme-btn]').forEach(function (b) {
    b.addEventListener('click', function () {
      var th = b.getAttribute('data-theme-btn');
      root.setAttribute('data-theme', th); store('ael-theme', th); syncThemeButtons();
    });
  });
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', syncThemeButtons);
  }
  syncThemeButtons();

  /* ---------- menú móvil ---------- */
  var menuBtn = document.getElementById('menu-btn');
  var nav = document.getElementById('nav');
  function closeMenu() { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- barra con borde al hacer scroll ---------- */
  var topbar = document.getElementById('topbar');
  function onScroll() { topbar.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- ventana de la web: escritorio / móvil ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.webview-toggle [data-view]');
    if (!b) return;
    var box = b.closest('.webview');
    box.setAttribute('data-mode', b.getAttribute('data-view'));
    box.querySelectorAll('.webview-toggle [data-view]').forEach(function (x) {
      x.setAttribute('aria-pressed', String(x === b));
    });
  });

  /* ---------- copiar email ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]');
    if (!b) return;
    var text = b.getAttribute('data-copy');
    var done = function () { b.textContent = ui('copied'); setTimeout(function () { b.textContent = ui('copy'); }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { selectMail(); });
    } else { selectMail(); }
    function selectMail() {
      var m = document.querySelector('.mail');
      if (!m) return;
      var r = document.createRange(); r.selectNodeContents(m);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    }
  });

  /* ---------- cursor: punto, anillo y luz ---------- */
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (fine) {
    var dot = document.querySelector('.cursor-dot');
    var ring = document.querySelector('.cursor-ring');
    var ringLabel = ring.querySelector('span');
    var glow = document.querySelector('.cursor-glow');
    var mx = -500, my = -500, rx = mx, ry = my, gx = mx, gy = my, started = false;

    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      if (!started) { started = true; rx = gx = mx; ry = gy = my; root.classList.add('has-cursor'); }
    }, { passive: true });
    document.addEventListener('pointerleave', function () { root.classList.remove('has-cursor'); started = false; });

    (function loop() {
      rx += (mx - rx) * (reduce ? 1 : 0.2);
      ry += (my - ry) * (reduce ? 1 : 0.2);
      gx += (mx - gx) * 0.08;
      gy += (my - gy) * 0.08;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      glow.style.transform = 'translate(' + gx + 'px,' + gy + 'px)';
      requestAnimationFrame(loop);
    })();

    document.addEventListener('pointerover', function (e) {
      var v = e.target.closest('[data-cursor="view"]');
      var h = e.target.closest('a, button, .chip');
      ring.classList.toggle('view', !!v);
      ring.classList.toggle('hover', !v && !!h);
      if (v) ringLabel.textContent = ui('view');
    });
  }

  /* ---------- carga del contenido ---------- */
  Promise.all([
    fetch('content/site.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
    fetch('content/projects.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
  ]).then(function (res) {
    SITE = res[0]; PROJECTS = res[1];
    route({ keepScroll: !location.hash });
    window.addEventListener('hashchange', function () { route(); });
  }).catch(function () {
    app.innerHTML = '<div class="wrap error-box"><h1 class="h2">Ups<span class="sq"></span></h1>' +
      '<p>No se ha podido cargar el contenido. Si estás abriendo el archivo directamente desde tu ordenador, ábrelo con un servidor local (por ejemplo, la extensión Live Server de VS Code).</p></div>';
  });
})();
