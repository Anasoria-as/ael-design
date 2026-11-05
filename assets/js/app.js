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
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var currentView = null;

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

  // Dirección propia de cada proyecto: anasoriaael.com/proyectos/slug/
  function projectUrl(p) { return 'proyectos/' + encodeURIComponent(p.slug) + '/'; }
  // Título para Google: «Vaukura · Dirección de arte, branding y E-commerce · Ana Soria Ael» (o corto si no cabe)
  function projectTitle(p) {
    var parts = String(t(p.kind) || '').split(' · ').filter(Boolean).map(function (k, i) {
      return i && /^[A-ZÁÉÍÓÚÑ](?![A-ZÁÉÍÓÚÑ])/.test(k) ? k.charAt(0).toLowerCase() + k.slice(1) : k;   // «IA», «UX/UI» se quedan igual
    });
    var kind = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' y ' + parts[parts.length - 1] : (parts[0] || '');
    if (lang === 'en' && parts.length > 1) kind = parts.slice(0, -1).join(', ') + ' & ' + parts[parts.length - 1];
    var full = t(p.title) + (kind ? ' · ' + kind : '') + ' · Ana Soria Ael';
    return full.length <= 72 ? full : t(p.title) + ' · Ana Soria Ael';
  }
  // Huella corta del HTML de una vista: si la página ya viene pintada igual, no se vuelve a pintar
  function hashStr(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  // Entrada suave del contenido: sube un poco y aparece (misma animación que el nombre de la portada)
  var enterTimer = null;
  function enter() {
    if (reduceMotion) return;
    app.classList.remove('is-entering');
    void app.offsetWidth;   // reinicia la animación
    app.classList.add('is-entering');
    clearTimeout(enterTimer);
    enterTimer = setTimeout(function () { app.classList.remove('is-entering'); }, 1100);
  }
  function setApp(html) {
    var h = hashStr(html);
    var pre = app.getAttribute('data-prerender');
    app.removeAttribute('data-prerender');
    app.setAttribute('data-h', h);
    if (pre && pre === h) return;
    app.innerHTML = html;
  }

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
    // pastilla: texto propio del proyecto o, si no tiene, «Proyecto real»
    var pill = t(p.pill) || ui('case_study');
    // proyecto «próximamente»: tarjeta sin enlace
    var open = p.soon ? '<div class="card is-soon">' : '<a class="card" href="' + esc(projectUrl(p)) + '" data-cursor="view">';
    var close = p.soon ? '</div></div>' : '</div></a>';
    return open +
      '<div class="cover">' + art(p) + '</div>' +
      '<div class="card-meta">' +
        '<div class="card-row"><h3>' + esc(t(p.title)) + '</h3>' +
        '<span class="pill"><span class="pill-star" aria-hidden="true">✱</span>' + esc(pill) + '</span></div>' +
        '<p class="card-kind">' + esc(t(p.kind)) + '</p>' +
      close;
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
        gameMarkup() +
        '<div class="contact-links">' +
          '<a class="btn btn-ghost btn-sm" href="' + esc(SITE.linkedin) + '" target="_blank" rel="noopener">LinkedIn <span class="arr">↗</span></a>' +
          '<a class="btn btn-ghost btn-sm" href="' + esc(SITE.cv[lang]) + '" download>CV · ' + lang.toUpperCase() + ' <span class="arr">↓</span></a>' +
        '</div>' +
      '</div></div></section>';
  }

  /* ---------- juego del pie de página: «Pixel run» ----------
     Empieza con «Ael» y el punto amarillo; al jugar, el punto se suelta y sale corriendo.
     Se salta con un toque o con la barra espaciadora (o la flecha arriba). */
  var GAME_TXT = {
    es: {
      aria: 'Juego Pixel run: toca o pulsa espacio para saltar',
      cap: 'Toca o pulsa espacio para saltar · Recoge los píxeles de colores',
      hint: 'TOCA O PULSA ESPACIO PARA JUGAR →', hintShort: 'TOCA PARA JUGAR →',
      again: 'Otra vez', team: '¿Jugamos en el mismo equipo?', ups: '¡Ups! ', best: 'RÉCORD', bestLow: 'récord',
      obst: [   // cada frase en dos líneas, dentro de un cuadrado
        { t: ['Comic', 'Sans'], comic: true, msg: 'Te ha pillado la Comic Sans' },
        { t: ['Lorem', 'ipsum'], msg: 'Te has quedado en el Lorem ipsum' },
        { t: ['final', 'v3.pdf'], msg: 'Llega el final_v4.pdf' },
        { t: ['Para', 'ayer'], msg: 'Lo querían para ayer' },
        { t: ['1 px', 'fuera'], msg: 'Un píxel descuadrado' },
        { t: ['Sin', 'guardar'], msg: 'Se te olvidó guardar' },
        { t: ['Sin', 'capas'], msg: 'El archivo venía sin capas' },
        { t: ['JPG a', '72 ppp'], msg: 'Un JPG a 72 ppp para imprenta' },
        { t: ['Word', 'Art'], msg: 'Te ha atrapado el WordArt' },
        { t: ['Ctrl', '+ Z'], msg: 'Ni Ctrl + Z te salva' },
        { t: ['Fuente', 'perdida'], msg: 'Falta una fuente' }
      ]
    },
    en: {
      aria: 'Pixel run game: tap or press space to jump',
      cap: 'Tap or press space to jump · Collect the coloured pixels',
      hint: 'TAP OR PRESS SPACE TO PLAY →', hintShort: 'TAP TO PLAY →',
      again: 'Play again', team: 'Shall we be on the same team?', ups: 'Oops! ', best: 'BEST', bestLow: 'best',
      obst: [
        { t: ['Comic', 'Sans'], comic: true, msg: 'Comic Sans got you' },
        { t: ['Lorem', 'ipsum'], msg: 'Stuck on Lorem ipsum' },
        { t: ['final', 'v3.pdf'], msg: 'Here comes final_v4.pdf' },
        { t: ['Due', 'today'], msg: 'They wanted it yesterday' },
        { t: ['1 px', 'off'], msg: 'One pixel off' },
        { t: ['Not', 'saved'], msg: 'You forgot to save' },
        { t: ['No', 'layers'], msg: 'The file had no layers' },
        { t: ['72 dpi', 'JPG'], msg: 'A 72 dpi JPG for print' },
        { t: ['Word', 'Art'], msg: 'WordArt got you' },
        { t: ['Ctrl', '+ Z'], msg: 'Not even Ctrl + Z can save you' },
        { t: ['Missing', 'font'], msg: 'A font is missing' }
      ]
    }
  };
  function gameMarkup() {
    var T = GAME_TXT[lang];
    return '<div class="ael-game">' +
      '<div class="ael-game-box">' +
        '<canvas tabindex="0" aria-label="' + esc(T.aria) + '"></canvas>' +
        '<div class="ael-game-over" hidden><div class="ael-game-card">' +
          '<p class="ael-game-title"></p><p class="ael-game-sub"></p>' +
          '<div class="ael-game-row"><button type="button" class="btn btn-primary btn-sm ael-game-again">' + esc(T.again) + '</button>' +
          '<a class="btn btn-sm ael-game-team" href="mailto:' + esc(SITE.email) + '">' + esc(T.team) + '</a></div>' +
        '</div></div>' +
      '</div>' +
      '<p class="ael-game-cap">' + esc(T.cap) + '</p>' +
    '</div>';
  }

  var game = null;   // el juego que está en pantalla (se vuelve a montar cuando cambia la página o el idioma)
  function mountGame() {
    var el = document.querySelector('#app .ael-game');
    if (game && game.el === el) return;
    if (game) { game.destroy(); game = null; }
    if (el) game = Runner(el, GAME_TXT[lang]);
  }
  window.addEventListener('keydown', function (e) {
    if (!game || (e.code !== 'Space' && e.code !== 'ArrowUp')) return;
    if (e.target.closest && e.target.closest('input, textarea, button, a') && !e.target.closest('.ael-game-box')) return;
    if (game.wantsKeys() && game.press()) e.preventDefault();
  });

  function Runner(el, T) {
    var C = { ink: '#1B1B1F', line: '#3A3A42', text: '#F4F3EF', muted: '#A9AAB0', y: '#FFF480', lav: '#A5A1FF', pink: '#FAADD6', coral: '#FFACAA', lime: '#DBFF9C' };
    var PASTEL = [C.y, C.lav, C.pink, C.coral, C.lime], OBST_C = [C.pink, C.lav, C.coral, C.y, C.lime, C.lav, C.coral];
    var MONO = '"DM Mono", ui-monospace, Menlo, monospace', SERIF = '"DM Serif Display", Georgia, serif';
    var canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    var over = el.querySelector('.ael-game-over'), title = el.querySelector('.ael-game-title'), sub = el.querySelector('.ael-game-sub');
    var BEST = 'ael-run-best', best = 0;
    try { best = +localStorage.getItem(BEST) || 0; } catch (e) {}
    var W = 300, H = 200, small = false;
    var state = 'intro', speed, dist, bonus, obs, items, parts, floats, toNext, logoX, logoFs, overAt = 0, t = 0, buffer = 0, coyote = 0;
    var P = { x: 0, y: 0, vy: 0, rot: 0, size: 13, ground: true };
    function rand(a, b) { return a + Math.random() * (b - a); }
    function pad(n) { n = String(Math.floor(n)); while (n.length < 5) n = '0' + n; return n; }
    function rrect(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
    function groundY() { return H - 42; }
    function resize() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth || 300; small = W < 560; H = small ? 240 : 200;
      canvas.style.height = H + 'px';
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (state === 'intro') reset();
      draw();
    }
    function reset() {
      speed = 290; dist = 0; bonus = 0; obs = []; items = []; parts = []; floats = []; buffer = 0; coyote = 0;
      logoFs = small ? 56 : 66; logoX = small ? 18 : 30;
      ctx.font = '400 ' + logoFs + 'px ' + SERIF;
      P.size = small ? 11 : 13; P.x = logoX + ctx.measureText('Ael').width + 5; P.y = groundY() - P.size; P.vy = 0; P.rot = 0; P.ground = true;
      toNext = Math.max(300, W - P.x - 20);
    }
    function start() { state = 'run'; over.hidden = true; P.vy = -430; P.ground = false; }   // saltito para soltarse de la «l»
    function jump() { P.vy = -640; P.ground = false; coyote = 0; buffer = 0; }
    function die(o) {
      state = 'over'; overAt = performance.now();
      var sc = Math.floor(dist / 10 + bonus);
      if (sc > best) { best = sc; try { localStorage.setItem(BEST, String(best)); } catch (e) {} }
      title.textContent = T.ups + o.msg + '.';
      sub.textContent = sc + ' px · ' + T.bestLow + ' ' + best + ' px';
      over.hidden = false;
      for (var i = 0; i < 14; i++) parts.push({ x: P.x + P.size / 2, y: P.y + P.size / 2, vx: rand(-160, 160), vy: rand(-260, -40), life: 1, c: C.y, s: rand(2, 5) });
    }
    function press() {
      if (state === 'intro') { start(); return true; }
      if (state === 'run') { if (P.ground || coyote > 0) jump(); else buffer = .14; return true; }   // si tocas justo antes de caer, salta al aterrizar
      if (state === 'over' && performance.now() - overAt > 350) { reset(); start(); return true; }
      return state === 'over';
    }
    // las frases salen en orden aleatorio y no se repite ninguna hasta que han salido todas
    var bag = [];
    function nextObst() {
      if (!bag.length) { bag = T.obst.map(function (o, i) { return i; }); for (var k = bag.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)), tmp = bag[k]; bag[k] = bag[j]; bag[j] = tmp; } }
      return bag.pop();
    }
    var SQ = 48;   // lado del cuadrado
    function obstFont(o, size) { return o.comic ? size + 1 + 'px "Comic Sans MS", "Comic Sans", "Chalkboard SE", "Comic Neue", cursive' : '500 ' + size + 'px ' + MONO; }
    function spawn() {
      var i = nextObst(), o = T.obst[i];
      // letra de 10 px; si una línea no cabe en el cuadrado, se hace un poco más pequeña
      var fs = 10;
      ctx.font = obstFont(o, fs);
      while (fs > 7 && Math.max.apply(null, o.t.map(function (l) { return ctx.measureText(l).width; })) > SQ - 8) { fs -= .5; ctx.font = obstFont(o, fs); }
      obs.push({ x: W + 10, w: SQ, h: SQ, o: o, fs: fs, c: OBST_C[i % OBST_C.length] });
      var w = SQ;
      var gap = Math.max(330, speed * .95);
      toNext = rand(gap, gap + speed * .8);
      if (Math.random() < .65) items.push({ x: W + 10 + w + toNext * rand(.35, .6), y: groundY() - rand(55, 95), c: PASTEL[Math.floor(Math.random() * 5)] });
    }
    function hit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
    function update(dt) {
      t += dt;
      parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.life -= dt * 1.4; });
      parts = parts.filter(function (p) { return p.life > 0; });
      floats.forEach(function (f) { f.y -= 40 * dt; f.life -= dt; });
      floats = floats.filter(function (f) { return f.life > 0; });
      if (state !== 'run') return;
      speed = Math.min(560, speed + 6 * dt);
      var dx = speed * dt;
      dist += dx; logoX -= dx; toNext -= dx;
      if (toNext <= 0) spawn();
      buffer = Math.max(0, buffer - dt); coyote = Math.max(0, coyote - dt);
      P.vy += 1750 * dt; P.y += P.vy * dt;
      if (!P.ground) P.rot += dt * 8;
      var gy = groundY() - P.size;
      if (P.y >= gy) {
        if (!P.ground) for (var k = 0; k < 5; k++) parts.push({ x: P.x + rand(0, P.size), y: groundY(), vx: rand(-60, 20), vy: rand(-120, -30), life: .5, c: C.muted, s: 2 });
        P.y = gy; P.vy = 0; P.rot = Math.round(P.rot / (Math.PI / 2)) * (Math.PI / 2);
        if (!P.ground) coyote = .08;
        P.ground = true;
        if (buffer > 0) jump();
      }
      var box = { x: P.x + 2, y: P.y + 2, w: P.size - 4, h: P.size - 4 };
      obs.forEach(function (o) { o.x -= dx; });
      obs = obs.filter(function (o) { return o.x + o.w > -20; });
      items.forEach(function (it) { it.x -= dx; });
      items = items.filter(function (it) { return it.x > -20 && !it.got; });
      items.forEach(function (it) {
        if (!it.got && hit(box, { x: it.x - 3, y: it.y - 3, w: 16, h: 16 })) {
          it.got = true; bonus += 25;
          floats.push({ x: it.x, y: it.y - 6, t: '+25 px', c: it.c, life: .8 });
          for (var j = 0; j < 8; j++) parts.push({ x: it.x + 5, y: it.y + 5, vx: rand(-140, 140), vy: rand(-180, 40), life: .7, c: it.c, s: rand(2, 4) });
        }
      });
      for (var n = 0; n < obs.length; n++) {
        var ob = obs[n];
        if (hit(box, { x: ob.x + 5, y: groundY() - ob.h + 5, w: ob.w - 10, h: ob.h })) { die(ob.o); break; }
      }
    }
    function draw() {
      var gy = groundY();
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.line; ctx.fillRect(0, gy, W, 1);
      var off = (dist || 0) % 46;
      for (var x = -off; x < W; x += 46) ctx.fillRect(x, gy + 8, 10, 1);
      if (logoX > -220) { ctx.font = '400 ' + logoFs + 'px ' + SERIF; ctx.fillStyle = C.text; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.fillText('Ael', logoX, gy); }
      items.forEach(function (it) { if (!it.got) { ctx.fillStyle = it.c; ctx.fillRect(it.x, it.y + Math.sin(t * 5 + it.x * .02) * 3, 10, 10); } });
      obs.forEach(function (ob) {
        var y = gy - ob.h;
        rrect(ob.x, y, ob.w, ob.h, 9); ctx.fillStyle = C.ink; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = ob.c; ctx.stroke();
        ctx.fillStyle = ob.c; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.font = obstFont(ob.o, ob.fs);
        var lh = ob.fs * 1.25, y0 = y + ob.h / 2 - (ob.o.t.length - 1) * lh / 2 + 1;
        ob.o.t.forEach(function (l, k) { ctx.fillText(l, ob.x + ob.w / 2, y0 + k * lh); });
        ctx.textAlign = 'left';
      });
      if (state !== 'over') {
        var br = state === 'intro' && !reduceMotion ? 1 + Math.sin(t * 3) * .06 : 1;
        ctx.save(); ctx.translate(P.x + P.size / 2, P.y + P.size / 2); ctx.rotate(P.rot); ctx.scale(br, br);
        ctx.fillStyle = C.y; ctx.fillRect(-P.size / 2, -P.size / 2, P.size, P.size); ctx.restore();
      }
      parts.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s); });
      floats.forEach(function (f) { ctx.globalAlpha = Math.max(0, f.life / .8); ctx.fillStyle = f.c; ctx.font = '500 12px ' + MONO; ctx.textBaseline = 'alphabetic'; ctx.fillText(f.t, f.x, f.y); });
      ctx.globalAlpha = 1;
      ctx.font = '500 12px ' + MONO; ctx.textBaseline = 'top'; ctx.textAlign = 'right'; ctx.fillStyle = C.muted;
      ctx.fillText((best ? T.best + ' ' + pad(best) + '   ' : '') + pad((dist || 0) / 10 + (bonus || 0)) + ' PX', W - 18, 16);
      ctx.textAlign = 'left';
      if (state === 'intro') {
        ctx.font = '500 12px ' + MONO; ctx.textBaseline = 'middle'; ctx.fillStyle = C.muted;
        var hint = small ? T.hintShort : T.hint, hw = ctx.measureText(hint).width;
        ctx.fillText(hint, Math.max(P.x + 40, W - hw - 18), gy - 28);
      }
    }

    // solo se mueve mientras se ve en pantalla
    var inView = false, raf = 0, last = 0, alive = true;
    function frame(now) {
      raf = 0;
      if (!alive || !canvas.isConnected) { destroy(); return; }
      var dt = Math.min(.033, (now - last) / 1000); last = now;
      update(dt); draw();
      if (inView && document.visibilityState === 'visible') raf = requestAnimationFrame(frame);
    }
    function wake() { if (!raf && alive && inView && document.visibilityState === 'visible') { last = performance.now(); raf = requestAnimationFrame(frame); } }
    var io = window.IntersectionObserver ? new IntersectionObserver(function (es) { inView = es[0].isIntersecting; wake(); }, { threshold: .1 }) : null;
    if (io) io.observe(canvas); else { inView = true; }
    var ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas); else window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', wake);
    function onDown(e) { e.preventDefault(); try { canvas.focus({ preventScroll: true }); } catch (err) {} press(); wake(); }
    canvas.addEventListener('pointerdown', onDown);
    el.querySelector('.ael-game-again').addEventListener('click', function () { reset(); start(); try { canvas.focus({ preventScroll: true }); } catch (err) {} wake(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (state === 'intro') { reset(); draw(); } });
    function destroy() {
      alive = false; if (raf) cancelAnimationFrame(raf); raf = 0;
      if (io) io.disconnect(); if (ro) ro.disconnect();
      document.removeEventListener('visibilitychange', wake);
    }
    resize(); wake();
    return {
      el: el,
      destroy: destroy,
      press: function () { if (!inView) return false; var r = press(); wake(); return r; },
      wantsKeys: function () { return inView && (state === 'run' || el.contains(document.activeElement)); }
    };
  }

  /* ---------- vistas ---------- */
  function viewHome() {
    var h = SITE.hero;
    var marquee = arr(SITE.marquee).concat(arr(SITE.marquee)).map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('');
    var featured = PROJECTS.filter(function (p) { return p.featured; });
    var rest = PROJECTS.filter(function (p) { return !p.featured; });
    var count = String(PROJECTS.filter(function (p) { return !p.soon; }).length).padStart(2, '0');

    return '' +
      '<section class="hero wrap" id="inicio">' +
        '<div class="hero-top"><span class="status"><i aria-hidden="true"></i>' + esc(t(h.status)) + '</span>' +
        '<span class="mono muted">' + esc(t(SITE.location)) + '</span></div>' +
        '<h1 class="hero-name"><span class="l1">Ana Soria</span><span class="l2">Ael<span class="sq" aria-hidden="true"></span></span></h1>' +
        '<div class="hero-grid">' +
          '<div>' +
            '<p class="role"><mark>' + esc(t(h.role)) + '</mark></p>' +
            '<p class="intro">' + esc(t(h.intro)).replace(/(\w)-(\w)/g, '$1&#8209;$2') + '</p>' +
            '<div class="actions"><a class="btn btn-primary" href="#proyectos">' + esc(ui('see_projects')) + ' <span class="arr">→</span></a>' +
            '<a class="btn btn-ghost" href="sobre-mi/">' + esc(ui('nav_about')) + '</a></div>' +
          '</div>' +
          '<aside class="cv-card" aria-label="' + esc(ui('cv_title')) + '">' +
            '<div class="cv-head"><strong>' + esc(ui('cv_title')) + '</strong><span class="mono muted">' + esc(ui('cv_note')) + '</span></div>' +
            cvButtons() +
          '</aside>' +
        '</div>' +
      '</section>' +
      '<div class="tape" aria-hidden="true"><div class="tape-track">' + marquee + '</div></div>' +
      '<section class="section wrap" id="proyectos">' +
        '<div class="proy-side">' +
          '<div class="sec-head"><h2 class="h2">' + esc(ui('projects_title')) + '<sup>(' + count + ')</sup></h2></div>' +
          projectsIntro() +
        '</div>' +
        '<div class="projects">' + featured.concat(rest).map(projectCard).join('') + '</div>' +
      '</section>' +
      '<section class="section wrap" id="aporto" style="padding-top:0">' +
        '<div class="sec-head"><h2 class="h2">' + esc(ui('strengths_title')) + '</h2></div>' +
        '<div class="strengths">' + arr(SITE.strengths).map(function (s) {
          return '<article class="strength"><span class="mono slash">' + esc(s.tag) + '</span><h3>' + esc(t(s.title)) + '</h3><p>' + esc(t(s.text)) + '</p></article>';
        }).join('') + '</div>' +
      '</section>' +
      testimonialsSection() +
      '<section class="section wrap" style="padding-top:0">' +
        '<div class="sec-head"><h2 class="h2">' + esc(ui('skills_title')) + '</h2></div>' +
        skillsBlock() +
      '</section>' +
      contactSection();
  }

  // Recomendaciones de compañeros (las mismas de LinkedIn). Si se leen en otro idioma que el original, se avisa de que es traducción
  function testimonialsSection() {
    var list = arr(SITE.testimonials);
    if (!list.length) return '';
    var li = String(SITE.linkedin || '').replace(/\/+$/, '') + '/details/recommendations/';
    return '<section class="section wrap" id="recomendaciones" style="padding-top:0">' +
      '<div class="sec-head"><h2 class="h2">' + esc(ui('testimonials_title')) + '</h2>' +
        (SITE.linkedin ? '<a class="btn btn-ghost btn-sm" href="' + esc(li) + '" target="_blank" rel="noopener">' + esc(ui('testimonials_link')) + ' <span class="arr">↗</span></a>' : '') +
      '</div>' +
      '<div class="quotes-slider">' +
      '<div class="quotes" tabindex="0" role="region" aria-label="' + esc(ui('testimonials_title')) + '">' + list.map(function (q) {
        var original = q.original || 'es';
        var translated = lang !== original && q.text && arr(q.text[lang]).length;
        var initials = String(q.name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w.charAt(0); }).join('');
        return '<figure class="quote">' +
          '<span class="quote-mark" aria-hidden="true">“</span>' +
          '<blockquote>' + arr(q.text).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</blockquote>' +
          '<figcaption class="quote-by"><span class="quote-av" aria-hidden="true">' + esc(initials) + '</span>' +
            '<span class="quote-who"><strong>' + esc(q.name) + '</strong>' +
            (t(q.role) ? '<span class="quote-role">' + esc(t(q.role)).replace(/(\w)-(\w)/g, '$1&#8209;$2') + '</span>' : '') +   // «e-commerce» no se parte
            (t(q.relation) || translated ? '<span class="quote-rel">' + esc(t(q.relation)) + (t(q.relation) && translated ? ' · ' : '') + (translated ? esc(ui('testimonials_translated')) : '') + '</span>' : '') +
          '</span></figcaption>' +
        '</figure>';
      }).join('') + '</div>' +
      '<div class="quotes-nav"><span class="quotes-bar" aria-hidden="true"><i></i></span>' +
        '<div class="quotes-arrows">' +
          '<button type="button" class="quotes-arrow" data-dir="-1" aria-label="' + esc(ui('testimonials_prev')) + '" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>' +
          '<button type="button" class="quotes-arrow" data-dir="1" aria-label="' + esc(ui('testimonials_next')) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' +
        '</div></div>' +
      '</div>' +
    '</section>';
  }

  function skillsBlock() {
    return '<div class="skills">' + arr(SITE.skills).map(function (g) {
      return '<div class="skill-row"><span class="mono slash">' + esc(t(g.group)) + '</span><div class="chips">' +
        arr(g.items).map(function (i) { return '<span class="chip">' + esc(i) + '</span>'; }).join('') + '</div></div>';
    }).join('') + '</div>';
  }

  function viewAbout() {
    var a = SITE.about;
    var logo = document.querySelector('.brand .logo-word');   // mismo logo de la cabecera
    var photo = a.photo
      ? '<img src="' + esc(a.photo) + '" alt="Ana Soria Ael">'
      : '<div class="portrait-logo">' + (logo ? logo.outerHTML : '') + '</div>';
    return '' +
      // cabecera: «// Sobre mí» pequeño y la frase como titular grande (la palabra entre ** va en rosa y cursiva)
      (t(a.title)
        ? '<section class="wrap page-head about-head">' +
            '<p class="about-kicker"><span aria-hidden="true">//</span>' + esc(ui('about_title')) + '</p>' +
            '<h1 class="about-title">' + rich(t(a.title)) + '<span class="sq" aria-hidden="true"></span></h1>' +
          '</section>'
        : '<section class="wrap page-head">' +
            '<h1 class="page-title">' + esc(ui('about_title')) + '<span class="sq" aria-hidden="true"></span></h1>' +
          '</section>') +
      '<section class="section wrap about-main">' +
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

  // Comparador antes / después: la foto «antes» se recorta hasta la línea; la «después» queda debajo
  function compareBlock(p) {
    var pairs = arr(p.compare).filter(function (c) { return c && c.before && c.after; });
    if (!pairs.length) return '';
    return '<div class="compare-grid">' + pairs.map(function (c) {
      return '<figure class="compare" style="--pos:50%">' +
        '<img class="compare-after" src="' + esc(c.after) + '" alt="' + esc(t(p.title)) + ' · ' + esc(ui('compare_after')) + '" loading="lazy" draggable="false">' +
        '<img class="compare-before" src="' + esc(c.before) + '" alt="' + esc(t(p.title)) + ' · ' + esc(ui('compare_before')) + '" loading="lazy" draggable="false">' +
        '<span class="compare-tag is-before">' + esc(ui('compare_before')) + '</span>' +
        '<span class="compare-tag is-after">' + esc(ui('compare_after')) + '</span>' +
        '<span class="compare-line" aria-hidden="true"><span class="compare-knob">‹ ›</span></span>' +
        '<input class="compare-range" type="range" min="0" max="100" value="50" aria-label="' + esc(ui('compare_hint')) + '">' +
      '</figure>';
    }).join('') + '</div>' +
    '<p class="webview-hint mono">↔ ' + esc(ui('compare_hint')) + '</p>';
  }

  function viewProject(slug) {
    var i = PROJECTS.findIndex(function (p) { return p.slug === slug; });
    if (i < 0) return viewHome();
    var p = PROJECTS[i];
    if (p.soon) return viewHome();
    var next = p;
    for (var k = 1; k <= PROJECTS.length; k++) {
      next = PROJECTS[(i + k) % PROJECTS.length];
      if (!next.soon) break;
    }
    var meta = [
      [ui('client'), t(p.client)],
      [ui('role'), t(p.role)],
      [ui('tools'), arr(p.tools).join(', ')]
    ].filter(function (m) { return m[1]; });

    // cifras destacadas del proyecto (números grandes)
    var stats = arr(p.stats).filter(function (s) { return s && t(s.value); });
    var statsHtml = stats.length ? '<div class="case-stats">' + stats.map(function (s) {
      return '<div class="case-stat"><strong>' + esc(t(s.value)) + '</strong><span>' + esc(t(s.label)) + '</span></div>';
    }).join('') + '</div>' : '';

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
          statsHtml +
        '</header>' +
        (p.web_preview && arr(p.web_preview.desktop).length ? webPreview(p) : '<div class="case-cover">' + art(p) + '</div>') +
        '<div class="case-sections">' + sections + '</div>' +
        compareBlock(p) +
        gallery +
        '<a class="next" href="' + esc(projectUrl(next)) + '" data-cursor="view">' +
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

  /* ---------- router ----------
     Portada: #inicio, #proyectos, #contacto.
     Sobre mí: /sobre-mi/ · Proyectos: /proyectos/slug/ (los enlaces antiguos #sobre-mi y #p-slug llevan a ellas). */
  function findProject(slug) {
    return PROJECTS.find(function (x) { return x.slug === slug && !x.soon; });
  }
  function route(opts) {
    opts = opts || {};
    var hash = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    var m = location.pathname.match(/\/proyectos\/([^\/]+)\/?$/);
    var view = 'home', anchor = null, project = null;
    if (m) {
      project = findProject(decodeURIComponent(m[1]));
      if (project) view = 'project';
    } else if (/\/sobre-mi\/?$/.test(location.pathname)) view = 'about';
    else if (hash.indexOf('p-') === 0 && findProject(hash.slice(2))) {
      location.replace(projectUrl(findProject(hash.slice(2))));   // enlace antiguo → página propia
      return;
    } else if (hash === 'sobre-mi') {
      location.replace('sobre-mi/');   // enlace antiguo → página propia
      return;
    } else if (hash === 'proyectos' || hash === 'contacto') anchor = hash;
    // dirección que no existe: se muestra la portada con su dirección correcta
    if (view === 'home' && !/^\/(index\.html)?$/.test(location.pathname) && history.replaceState) {
      history.replaceState(null, '', '/' + location.hash);
    }

    if (view === 'about') setApp(viewAbout());
    else if (view === 'project') setApp(viewProject(project.slug));
    else setApp(viewHome());

    renderFooter();
    applyI18nStatic();
    updateAllQuotes();
    mountGame();

    // navegación activa
    document.querySelectorAll('.nav a').forEach(function (a) {
      var r = a.getAttribute('data-route');
      var active = (view === 'about' && r === 'sobre-mi') || (view === 'project' && r === 'proyectos') || (view === 'home' && anchor === r);
      if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });

    // título y descripción de cada vista (buscadores y pestaña)
    var SEO = {
      es: { title: 'Ana Soria Ael · Diseñadora web, UX/UI y gráfica en Madrid',
            desc: 'Portfolio de Ana Soria Ael, diseñadora web y UX/UI en Madrid con seis años de diseño gráfico y branding: Figma, e-commerce, dirección de arte y código.',
            about: 'Ana Soria Ael, diseñadora web y UX/UI en Madrid con seis años de diseño gráfico y branding, en estudio y en empresa: marcas, tiendas online, Figma y código.' },
      en: { title: 'Ana Soria Ael · Web, UX/UI & Graphic Designer in Madrid',
            desc: 'Portfolio of Ana Soria Ael, web and UX/UI designer in Madrid with six years of graphic design and branding: Figma, e-commerce, art direction and code.',
            about: 'Ana Soria Ael, web and UX/UI designer in Madrid with six years of graphic design and branding, in studio and in-house: brands, online stores, Figma and code.' }
    }[lang];
    var title = SEO.title, desc = SEO.desc;
    if (view === 'about') { title = ui('about_title') + ' · ' + SEO.title; desc = SEO.about; }
    else if (view === 'project') { title = projectTitle(project); desc = t(project.summary) || desc; }
    document.title = title;
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', desc);

    var changed = view !== currentView;
    currentView = view;
    if (opts.animate) enter();

    if (opts.keepScroll) return;
    // al cambiar de página el salto es directo; dentro de la misma página, con scroll suave
    var how = (opts.initial || changed) ? 'instant' : 'smooth';
    if (anchor) {
      var el = document.getElementById(anchor);
      if (el) el.scrollIntoView({ behavior: how });
    } else {
      window.scrollTo({ top: 0, behavior: how });
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

  /* ---------- menú móvil ---------- */
  var menuBtn = document.getElementById('menu-btn');
  var nav = document.getElementById('nav');
  // al abrirlo, el fondo se difumina y se oscurece (clase menu-open en <html>)
  function closeMenu() { nav.classList.remove('open'); root.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  // tocar un enlace o el fondo difuminado cierra el menú
  nav.addEventListener('click', function (e) { if (e.target.closest('a') || e.target === nav) closeMenu(); });
  window.addEventListener('resize', function () { if (window.innerWidth > 820) closeMenu(); });
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

  /* ---------- comparador antes / después ---------- */
  // Marca qué foto se está enseñando más: a la derecha, la de estudio; a la izquierda, la de IA
  function compareSide(box, pos) {
    if (pos > 50.5) box.setAttribute('data-side', 'before');
    else if (pos < 49.5) box.setAttribute('data-side', 'after');
    else box.removeAttribute('data-side');
  }
  function setCompare(box, clientX) {
    var r = box.getBoundingClientRect();
    var pos = Math.max(0, Math.min(100, (clientX - r.left) / r.width * 100));
    box.style.setProperty('--pos', pos + '%');
    compareSide(box, pos);
    var range = box.querySelector('.compare-range');
    if (range) range.value = Math.round(pos);
  }
  var dragging = null;
  document.addEventListener('pointerdown', function (e) {
    var box = e.target.closest('.compare');
    if (!box) return;
    dragging = box;
    box.classList.add('is-dragging');
    if (box.setPointerCapture) { try { box.setPointerCapture(e.pointerId); } catch (err) {} }
    setCompare(box, e.clientX);
  });
  document.addEventListener('pointermove', function (e) { if (dragging) setCompare(dragging, e.clientX); });
  function stopCompare() { if (dragging) { dragging.classList.remove('is-dragging'); dragging = null; } }
  document.addEventListener('pointerup', stopCompare);
  document.addEventListener('pointercancel', stopCompare);
  document.addEventListener('input', function (e) {
    if (!e.target.classList || !e.target.classList.contains('compare-range')) return;
    var box = e.target.closest('.compare');
    box.style.setProperty('--pos', e.target.value + '%');
    compareSide(box, +e.target.value);
  });

  /* ---------- carrusel de recomendaciones ---------- */
  // Flechas y barra solo si hay más tarjetas de las que caben; cada flecha avanza una tarjeta
  function updateQuotes(slider) {
    var s = slider && slider.querySelector('.quotes');
    if (!s) return;
    var max = s.scrollWidth - s.clientWidth;
    slider.classList.toggle('is-scrollable', max > 4);
    var prev = slider.querySelector('.quotes-arrow[data-dir="-1"]'), next = slider.querySelector('.quotes-arrow[data-dir="1"]');
    if (prev) prev.disabled = s.scrollLeft <= 4;
    if (next) next.disabled = s.scrollLeft >= max - 4;
    var bar = slider.querySelector('.quotes-bar i');
    if (bar && s.scrollWidth) {
      bar.style.width = (s.clientWidth / s.scrollWidth * 100) + '%';
      bar.style.left = (s.scrollLeft / s.scrollWidth * 100) + '%';
    }
  }
  function updateAllQuotes() { document.querySelectorAll('.quotes-slider').forEach(updateQuotes); }
  document.addEventListener('scroll', function (e) {
    var el = e.target;
    if (el && el.classList && el.classList.contains('quotes')) updateQuotes(el.closest('.quotes-slider'));
  }, true);
  window.addEventListener('resize', updateAllQuotes);
  window.addEventListener('load', updateAllQuotes);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateAllQuotes);
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.quotes-arrow');
    if (!b) return;
    var s = b.closest('.quotes-slider').querySelector('.quotes');
    var card = s.querySelector('.quote');
    var step = card ? card.getBoundingClientRect().width + (parseFloat(getComputedStyle(s).columnGap) || 0) : s.clientWidth;
    s.scrollBy({ left: step * Number(b.getAttribute('data-dir')), behavior: reduceMotion ? 'auto' : 'smooth' });
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
    // al llegar desde otra página de la web (clic en un enlace), el cursor aparece donde estaba
    try {
      var last = JSON.parse(sessionStorage.getItem('ael-cursor') || 'null');
      var navType = performance.getEntriesByType ? (performance.getEntriesByType('navigation')[0] || {}).type : '';
      if (last && navType === 'navigate' && document.referrer.indexOf(location.origin) === 0) {
        mx = rx = gx = last[0]; my = ry = gy = last[1]; started = true;
        dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
        root.classList.add('has-cursor');
      }
    } catch (e) {}
    window.addEventListener('pagehide', function () {
      try { if (started) sessionStorage.setItem('ael-cursor', JSON.stringify([mx, my])); } catch (e) {}
    });

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

  /* ---------- transición entre páginas ----------
     Si el navegador la cancela (por ejemplo, porque cambia el tamaño de la pantalla), no pasa nada */
  window.addEventListener('pagereveal', function (e) {
    var vt = e.viewTransition;
    if (!vt) return;
    [vt.ready, vt.finished, vt.updateCallbackDone].forEach(function (pr) { if (pr && pr.catch) pr.catch(function () {}); });
  });

  /* ---------- volver atrás: recupera la posición de la página ---------- */
  // Se guarda en el historial de cada página, para volver al mismo punto al darle «atrás»
  var scrollTimer = null;
  function saveScroll() {
    try { history.replaceState(Object.assign({}, history.state, { y: window.scrollY }), ''); } catch (e) {}
  }
  window.addEventListener('scroll', function () {
    clearTimeout(scrollTimer); scrollTimer = setTimeout(saveScroll, 250);
  }, { passive: true });
  window.addEventListener('pagehide', saveScroll);
  function restoreScroll() {
    var nav = performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
    var y = history.state && history.state.y;
    if (nav && (nav.type === 'back_forward' || nav.type === 'reload') && y) window.scrollTo({ top: y, behavior: 'instant' });
  }

  /* ---------- carga del contenido ---------- */
  // Los textos se guardan durante la visita: al pasar de una página a otra se pintan al momento
  // y, mientras, se comprueba si hay cambios (si los hay, se repinta).
  var DATA_KEY = 'ael-data';
  var cached = null;
  try { cached = JSON.parse(sessionStorage.getItem(DATA_KEY)); } catch (e) {}
  if (!Array.isArray(cached) || cached.length !== 2) cached = null;
  var prerendered = app.hasAttribute('data-prerender');

  function onHash() {
    if (location.hash === '#app') return;   // enlace «Saltar al contenido»
    route();
  }
  // proyectos marcados como «Oculto» en el panel: no salen en ningún sitio de la web
  function visible(list) { return (Array.isArray(list) ? list : []).filter(function (p) { return !p.hidden; }); }
  function start(data, sync) {
    SITE = data[0]; PROJECTS = visible(data[1]);
    // anima la entrada solo si el contenido aún no se ha visto en pantalla
    var painted = performance.getEntriesByType && performance.getEntriesByType('paint').length > 0;
    route({ keepScroll: !location.hash, initial: true, animate: sync ? !painted : !prerendered });
    restoreScroll();
    window.addEventListener('hashchange', onHash);
  }

  var loading = Promise.all([
    fetch('content/site.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
    fetch('content/projects.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
  ]);
  if (cached) start(cached, true);
  loading.then(function (res) {
    var fresh = JSON.stringify(res);
    try { sessionStorage.setItem(DATA_KEY, fresh); } catch (e) {}
    if (!cached) return start(res, false);
    if (fresh !== JSON.stringify(cached)) { SITE = res[0]; PROJECTS = visible(res[1]); route({ keepScroll: true }); }
  }).catch(function () {
    if (cached) return;
    app.removeAttribute('data-prerender');
    app.innerHTML = '<div class="wrap error-box"><h1 class="h2">Ups<span class="sq"></span></h1>' +
      '<p>No se ha podido cargar el contenido. Si estás abriendo el archivo directamente desde tu ordenador, ábrelo con un servidor local (por ejemplo, la extensión Live Server de VS Code).</p></div>';
  });
})();
