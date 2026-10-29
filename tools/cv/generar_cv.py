#!/usr/bin/env python3
"""Genera los CV en PDF (español e inglés) de Ana Soria Ael.

Uso, desde la carpeta de la web:   python3 tools/cv/generar_cv.py
Crea cv/CV_Ana_Soria_Ael_ES.pdf y cv/CV_Ana_Soria_Ael_EN.pdf (una página A4 cada uno), con el logo.
Versión con foto (en lugar del logo):   python3 tools/cv/generar_cv.py --foto RUTA_FOTO.png --salida CARPETA
(la foto, cuadrada y recortada en círculo; los PDF se guardan en CARPETA con «_foto» en el nombre).
Para cambiar textos, edita el diccionario CONTENT de abajo y vuelve a ejecutarlo.
Necesita Playwright (Chromium) y las fuentes Poppins y DejaVu Sans Mono instaladas.
"""
import html
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
e = html.escape

CONTACT = {
    'email': 'anasoria.as@gmail.com',
    'phone_es': '699 85 74 78', 'phone_en': '+34 699 85 74 78', 'tel': '+34699857478',
    'linkedin': 'linkedin.com/in/anasoriaael', 'web': 'anasoriaael.com',
}

CONTENT = {
    'es': {
        'file': 'CV_Ana_Soria_Ael_ES.pdf',
        'title': 'Ana Soria Ael · Diseñadora web & UX/UI',
        'role': 'Diseñadora web & UX/UI', 'chip': '+6 años',
        'h': {'contact': 'Contacto', 'skills': 'Habilidades', 'languages': 'Idiomas', 'profile': 'Perfil',
              'experience': 'Experiencia', 'projects': 'Proyectos web', 'education': 'Formación'},
        'labels': {'email': 'Email', 'phone': 'Teléfono', 'linkedin': 'LinkedIn', 'web': 'Portfolio', 'place': 'Ubicación'},
        'place': 'Madrid, España',
        'skills': [
            ('Diseño', ['Figma', 'UX/UI', 'Wireframes', 'Prototipado', 'Diseño responsive', 'E-commerce', 'Branding', 'Dirección de arte']),
            ('Frontend', ['HTML5', 'CSS3', 'Sass', 'Flexbox', 'Grid', 'JavaScript', 'GSAP', 'WordPress', 'Git · GitHub', 'VS Code']),
            ('IA generativa', ['Gemini · Nano Banana', 'ChatGPT', 'Claude', 'GitHub Copilot']),
            ('Marketing digital', ['SEO on-page', 'Google Analytics', 'Tag Manager', 'Mailchimp', 'Mailrelay']),
            ('Adobe, vídeo e impresión', ['Photoshop', 'Illustrator', 'InDesign', 'Lightroom', 'Premiere', 'Final Cut', 'Preimpresión', 'Gran formato']),
        ],
        'languages': [('Español', 'Nativo'), ('Inglés', 'B2')],
        'qr': ('anasoriaael.com', 'Escanea para ver mis proyectos'),
        'profile': 'Diseñadora web y UX/UI con seis años de experiencia en diseño gráfico, branding y e-commerce. '
                   'Diseño interfaces en Figma, de la estructura al prototipo, para que sean bonitas pero sobre todo '
                   'fáciles de usar, y sé maquetarlas con HTML, CSS (Flexbox, Grid, responsive) y JavaScript. Vengo de '
                   'la dirección de arte y la identidad visual, y uso la IA generativa como herramienta, siempre con '
                   'criterio y dirección creativa propia.',
        'jobs': [{
            'role': 'Directora de Arte & Diseñadora Gráfica Senior', 'dates': '04/2021 — 07/2026',
            'org': 'Vaukura / Cashdisplay · Grupo Herme', 'place': 'Madrid',
            'points': [
                'Diseño completo en Figma de la interfaz y la estructura de vaukura.com (~400 productos) y '
                'cashdisplay.com (~3.000), y coordinación de su implementación con un equipo de desarrollo externo.',
                'Mantenimiento y edición directa en WordPress: personalización de temas, páginas nuevas, fichas de '
                'producto e incidencias resueltas con código.',
                'Dirección de arte de ambas marcas: rediseño de la identidad y el logotipo de Vaukura, fotografía de '
                'producto con un método de edición propio, banners, newsletters, redes sociales y SEO on-page.',
                'Fotos de ambiente de Vaukura llevadas del estudio a la IA generativa (Nano Banana) con dirección '
                'de arte propia.',
                'Gráfica para ferias y eventos: visual del stand, gran formato (roll-ups, pop-ups, expositores), '
                'preimpresión, presupuestos y organización del montaje.',
                'Organización de flujos de trabajo con mucha carga de información para agilizar el día a día del '
                'equipo, y automatización de tareas repetitivas con IA.',
            ]}],
        'projects': [
            {'tag': 'P/01 · Diseño web · Figma', 'title': 'Web e-commerce de Vaukura',
             'text': 'Diseño completo en Figma de la tienda online: estructura, navegación e interfaz. Es la web '
                     'publicada hoy, desarrollada a partir de mi diseño.',
             'chips': ['Figma', 'UX/UI', 'E-commerce'], 'url': 'anasoriaael.com/proyectos/vaukura/'},
            {'tag': 'P/02 · Diseño web · Figma', 'title': 'Web de Cashdisplay',
             'text': 'Diseño completo en Figma de la web y la tienda online de soportes publicitarios: un catálogo '
                     'técnico de unos 3.000 productos.',
             'chips': ['Figma', 'UX/UI', 'E-commerce B2B'], 'url': 'anasoriaael.com/proyectos/cashdisplay/'},
        ],
        'education': [
            ('2024 — 2025', 'Máster en Programación para Creativos', 'LABASAD'),
            ('2018 — 2020', 'CFGS Diseño y Edición de Publicaciones Impresas y Multimedia', 'IES Puerta Bonita'),
            ('2016 — 2018', 'CFGS Producción de Audiovisuales y Espectáculos', 'IES Puerta Bonita'),
        ],
    },
    'en': {
        'file': 'CV_Ana_Soria_Ael_EN.pdf',
        'title': 'Ana Soria Ael · Web & UX/UI Designer',
        'role': 'Web & UX/UI Designer', 'chip': '+6 years',
        'h': {'contact': 'Contact', 'skills': 'Skills', 'languages': 'Languages', 'profile': 'Profile',
              'experience': 'Experience', 'projects': 'Web projects', 'education': 'Education'},
        'labels': {'email': 'Email', 'phone': 'Phone', 'linkedin': 'LinkedIn', 'web': 'Portfolio', 'place': 'Location'},
        'place': 'Madrid, Spain',
        'skills': [
            ('Design', ['Figma', 'UX/UI', 'Wireframes', 'Prototyping', 'Responsive design', 'E-commerce', 'Branding', 'Art direction']),
            ('Frontend', ['HTML5', 'CSS3', 'Sass', 'Flexbox', 'Grid', 'JavaScript', 'GSAP', 'WordPress', 'Git · GitHub', 'VS Code']),
            ('Generative AI', ['Gemini · Nano Banana', 'ChatGPT', 'Claude', 'GitHub Copilot']),
            ('Digital marketing', ['On-page SEO', 'Google Analytics', 'Tag Manager', 'Mailchimp', 'Mailrelay']),
            ('Adobe, video & print', ['Photoshop', 'Illustrator', 'InDesign', 'Lightroom', 'Premiere', 'Final Cut', 'Prepress', 'Large format']),
        ],
        'languages': [('Spanish', 'Native'), ('English', 'B2')],
        'qr': ('anasoriaael.com', 'Scan to see my projects'),
        'profile': 'Web and UX/UI designer with six years of experience in graphic design, branding and e-commerce. '
                   'I design interfaces in Figma, from structure to prototype, so they look good but above all are easy '
                   'to use, and I can build them with HTML, CSS (Flexbox, Grid, responsive) and JavaScript. I come from '
                   'art direction and visual identity, and I use generative AI as a tool, always with judgment and my '
                   'own creative direction.',
        'jobs': [{
            'role': 'Art Director & Senior Graphic Designer', 'dates': '04/2021 — 07/2026',
            'org': 'Vaukura / Cashdisplay · Grupo Herme', 'place': 'Madrid',
            'points': [
                'Designed the full interface and structure of vaukura.com (~400 products) and cashdisplay.com '
                '(~3,000) in Figma, and coordinated their build with an external development team.',
                'Hands-on WordPress maintenance and edits: theme customization, new pages, product listings and '
                'code-level fixes.',
                'Art direction for both brands: Vaukura’s identity and logo redesign, product photography with my own '
                'editing method, banners, newsletters, social media and on-page SEO.',
                'Moved Vaukura’s room photos from the studio to generative AI (Nano Banana) under my own art '
                'direction.',
                'Trade fair and event graphics: stand visuals, large format (roll-ups, pop-ups, displays), prepress, '
                'budgets and set-up planning.',
                'Organized information-heavy workflows to speed up the team’s day-to-day, and automated repetitive '
                'tasks with AI.',
            ]}],
        'projects': [
            {'tag': 'P/01 · Web design · Figma', 'title': 'Vaukura e-commerce website',
             'text': 'Full Figma design of the online store: structure, navigation and interface. It is the live '
                     'website today, built from my design.',
             'chips': ['Figma', 'UX/UI', 'E-commerce'], 'url': 'anasoriaael.com/proyectos/vaukura/'},
            {'tag': 'P/02 · Web design · Figma', 'title': 'Cashdisplay website',
             'text': 'Full Figma design of the website and online store for advertising displays: a technical '
                     'catalogue of around 3,000 products.',
             'chips': ['Figma', 'UX/UI', 'B2B e-commerce'], 'url': 'anasoriaael.com/proyectos/cashdisplay/'},
        ],
        'education': [
            ('2024 — 2025', 'Master’s in Creative Programming', 'LABASAD'),
            ('2018 — 2020', 'Higher Diploma in Print & Multimedia Publishing Design', 'IES Puerta Bonita'),
            ('2016 — 2018', 'Higher Diploma in Audiovisual & Live Events Production', 'IES Puerta Bonita'),
        ],
    },
}

CSS = """
@page { size: 210mm 297mm; margin: 0; }   /* la hoja mide exactamente lo mismo que el diseño (sin línea blanca) */
* { box-sizing: border-box; margin: 0; padding: 0; }
:root { --ink: #111111; --muted: #66645F; --side: #111111; --side-ink: #F4F2EA; --side-muted: #A3A198;
        --yellow: #F8E006; --pink: #E51974; --card: #FBF7D9;
        --sans: 'Poppins', sans-serif; --mono: 'DejaVu Sans Mono', monospace; }
html, body { width: 210mm; height: 297mm; }
body { font-family: var(--sans); color: var(--ink); background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
a { color: inherit; text-decoration: none; }
.page { display: grid; grid-template-columns: 234px 1fr; width: 210mm; height: 297mm; overflow: hidden; }

/* ---- barra lateral ---- */
.side { background: var(--side); color: var(--side-ink); padding: 39px 30px 34px; display: flex; flex-direction: column; }
.logo { width: 103px; height: 103px; display: block; }
.logo.foto { border-radius: 50%; object-fit: cover; box-shadow: 0 0 0 3px var(--yellow); }
.side h2 { font-family: var(--mono); font-weight: 400; font-size: 9.4px; line-height: 1.2; letter-spacing: .12em; text-transform: uppercase; color: var(--yellow); margin: 22px 0 8px; }
.side h2::before { content: '// '; }
.contact dt { font-size: 8.6px; color: var(--side-muted); line-height: 1.2; }
.contact dd { font-size: 10.4px; line-height: 1.3; margin-bottom: 6px; }
.group { font-size: 9px; line-height: 1.2; color: var(--side-muted); margin: 8px 0 5px; }
.chips { display: flex; flex-wrap: wrap; gap: 4px 3px; }
.chip { font-size: 8.7px; line-height: 1; padding: 4px 6.5px 3.5px; border: 1px solid rgba(244,242,234,.42); border-radius: 999px; white-space: nowrap; }
.langs div { display: flex; justify-content: space-between; font-size: 10.4px; padding: 5px 0 6px; border-bottom: 1px solid rgba(244,242,234,.18); }
.langs div span:last-child { color: var(--side-muted); }
.qr { margin-top: auto; display: flex; align-items: center; gap: 12px; }
.qr-img { width: 82px; height: 82px; background: #fff; border-radius: 10px; padding: 8px; flex: none; }
.qr-img img { width: 100%; height: 100%; display: block; image-rendering: pixelated; }
.qr strong { display: block; color: var(--yellow); font-weight: 700; font-size: 11.4px; margin-bottom: 3px; }
.qr span { display: block; font-size: 9px; color: var(--side-muted); line-height: 1.35; }

/* ---- columna principal ---- */
.main { padding: 36px 45px 30px 38px; display: flex; flex-direction: column; }
.name { font-weight: 700; font-size: 41.5px; line-height: 1; letter-spacing: -.035em; }
.name span { display: block; }
.name i { font-style: normal; color: var(--pink); }
.headline { display: flex; align-items: center; gap: 12px; margin-top: 13px; padding-bottom: 14px; border-bottom: 1px solid var(--ink); }
.role { position: relative; z-index: 0; font-size: 15.4px; font-weight: 500; letter-spacing: -.01em; padding: 0 2px; }
/* subrayado amarillo: un bloque sólido detrás del texto (se ve igual en cualquier visor de PDF) */
.role::after { content: ''; position: absolute; left: 0; right: 0; bottom: .02em; height: .5em; background: var(--yellow); z-index: -1; }
.badge { font-family: var(--mono); font-size: 9.6px; letter-spacing: .04em; background: var(--pink); color: #fff; border-radius: 999px; padding: 4px 10px; }
.sec { margin-top: 16px; }
.sec-h { display: flex; align-items: center; gap: 9px; margin-bottom: 8px; }
.num { font-family: var(--mono); font-size: 8.8px; background: var(--pink); color: #fff; border-radius: 3px; padding: 3px 4px 2px; line-height: 1; }
.sec-h h2 { font-size: 15.2px; font-weight: 700; letter-spacing: -.01em; }
.profile { font-size: 11.4px; line-height: 1.58; }
.job-top { display: grid; grid-template-columns: 1fr auto; align-items: start; }
.job h3 { font-size: 13px; font-weight: 700; letter-spacing: -.01em; }
.dates { font-family: var(--mono); font-size: 9px; background: var(--yellow); padding: 2px 5px; justify-self: end; }
.org { font-size: 10.9px; color: var(--muted); font-weight: 500; }
.place { font-size: 8.9px; color: var(--muted); text-align: right; }
.job ul { list-style: none; margin-top: 6px; display: grid; gap: 3.2px; }
.job li { position: relative; padding-left: 14px; font-size: 11px; line-height: 1.5; }
.job li::before { content: ''; position: absolute; left: 0; top: .72em; width: 7px; height: 2px; background: var(--pink); }
.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.card { background: var(--card); border-radius: 10px; padding: 12px 13px 12px; display: flex; flex-direction: column; }
.card .tag { font-family: var(--mono); font-size: 8.8px; color: var(--pink); }
.card h3 { font-size: 12.4px; font-weight: 700; margin-top: 3px; letter-spacing: -.01em; }
.card p { font-size: 10.2px; line-height: 1.5; margin-top: 2px; }
.card .chips { margin-top: 8px; gap: 4px; }
.card .chip { border-color: rgba(17,17,17,.3); color: var(--ink); font-size: 8.6px; padding: 4px 7px 3.5px; }
.card .link { font-family: var(--mono); font-size: 7.2px; letter-spacing: -.02em; margin-top: auto; padding-top: 9px; text-decoration: underline; text-underline-offset: 2px; word-break: break-all; }
.edu { display: grid; gap: 9px; }
.edu div { display: grid; grid-template-columns: 98px 1fr; align-items: baseline; }
.edu .y { font-family: var(--mono); font-size: 9px; color: var(--muted); }
.edu b { display: block; font-size: 11.4px; font-weight: 700; letter-spacing: -.01em; }
.edu small { display: block; font-size: 10.2px; color: var(--muted); }
"""


def build(lang, photo=None):
    c = CONTENT[lang]
    h, L = c['h'], c['labels']
    phone = CONTACT['phone_es' if lang == 'es' else 'phone_en']
    skills = ''.join(f'<p class="group">{e(g)}</p><div class="chips">' + ''.join(f'<span class="chip">{e(s)}</span>' for s in items) + '</div>'
                     for g, items in c['skills'])
    langs = ''.join(f'<div><span>{e(a)}</span><span>{e(b)}</span></div>' for a, b in c['languages'])
    jobs = ''.join(
        f'<div class="job"><div class="job-top"><h3>{e(j["role"])}</h3><span class="dates">{e(j["dates"])}</span>'
        f'<span class="org">{e(j["org"])}</span><span class="place">{e(j["place"])}</span></div>'
        '<ul>' + ''.join(f'<li>{e(p)}</li>' for p in j['points']) + '</ul></div>' for j in c['jobs'])
    cards = ''.join(
        f'<div class="card"><span class="tag">{e(p["tag"])}</span><h3>{e(p["title"])}</h3><p>{e(p["text"])}</p>'
        '<div class="chips">' + ''.join(f'<span class="chip">{e(x)}</span>' for x in p['chips']) + '</div>'
        f'<a class="link" href="https://{e(p["url"])}">↗ {e(p["url"].rstrip("/"))}</a></div>' for p in c['projects'])
    edu = ''.join(f'<div><span class="y">{e(y)}</span><span><b>{e(t)}</b><small>{e(s)}</small></span></div>' for y, t, s in c['education'])
    return f"""<!DOCTYPE html><html lang="{lang}"><head><meta charset="utf-8"><title>{e(c['title'])}</title><style>{CSS}</style></head>
<body><div class="page">
<aside class="side">
  {f'<img class="logo foto" src="{photo}" alt="Ana Soria Ael">' if photo else '<img class="logo" src="logo-ael-circulo.png" alt="ael.">'}
  <h2>{e(h['contact'])}</h2>
  <dl class="contact">
    <dt>{e(L['email'])}</dt><dd><a href="mailto:{CONTACT['email']}">{CONTACT['email']}</a></dd>
    <dt>{e(L['phone'])}</dt><dd><a href="tel:{CONTACT['tel']}">{e(phone)}</a></dd>
    <dt>{e(L['linkedin'])}</dt><dd><a href="https://www.{CONTACT['linkedin']}">{CONTACT['linkedin']}</a></dd>
    <dt>{e(L['web'])}</dt><dd><a href="https://{CONTACT['web']}/">{CONTACT['web']}</a></dd>
    <dt>{e(L['place'])}</dt><dd>{e(c['place'])}</dd>
  </dl>
  <h2>{e(h['skills'])}</h2>{skills}
  <h2>{e(h['languages'])}</h2><div class="langs">{langs}</div>
  <a class="qr" href="https://{CONTACT['web']}/"><span class="qr-img"><img src="qr-anasoriaael.png" alt=""></span>
    <span><strong>{e(c['qr'][0])}</strong><span>{e(c['qr'][1])}</span></span></a>
</aside>
<main class="main">
  <h1 class="name"><span>Ana Soria</span><span>Ael<i>.</i></span></h1>
  <div class="headline"><span class="role">{e(c['role'])}</span><span class="badge">{e(c['chip'])}</span></div>
  <section class="sec"><div class="sec-h"><span class="num">01</span><h2>{e(h['profile'])}</h2></div><p class="profile">{e(c['profile'])}</p></section>
  <section class="sec"><div class="sec-h"><span class="num">02</span><h2>{e(h['experience'])}</h2></div>{jobs}</section>
  <section class="sec"><div class="sec-h"><span class="num">03</span><h2>{e(h['projects'])}</h2></div><div class="cards">{cards}</div></section>
  <section class="sec"><div class="sec-h"><span class="num">04</span><h2>{e(h['education'])}</h2></div><div class="edu">{edu}</div></section>
</main>
</div></body></html>"""


def main():
    args = sys.argv[1:]
    photo = Path(args[args.index('--foto') + 1]).resolve().as_uri() if '--foto' in args else None
    outdir = Path(args[args.index('--salida') + 1]).resolve() if '--salida' in args else ROOT / 'cv'
    outdir.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={'width': 794, 'height': 1123})
        for lang in ('es', 'en'):
            src = HERE / (f'cv_{lang}_foto.html' if photo else f'cv_{lang}.html')
            src.write_text(build(lang, photo), encoding='utf-8')
            page.goto(src.as_uri())
            page.wait_for_load_state('networkidle')
            page.evaluate('document.fonts.ready')
            # lo último de cada columna tiene que quedar dentro de la hoja (1123 px de alto)
            over = page.evaluate("""() => ({ main: Math.round(document.querySelector('.main > :last-child').getBoundingClientRect().bottom - 1093),
                side: Math.round(document.querySelector('.qr').getBoundingClientRect().bottom - 1093) })""")
            print('  margen libre abajo (px):', {k: -v for k, v in over.items()})
            if over['main'] > 0 or over['side'] > 0:
                print(f'⚠ {lang}: el contenido no cabe en una página', over)
            out = outdir / (CONTENT[lang]['file'].replace('.pdf', '_foto.pdf') if photo else CONTENT[lang]['file'])
            page.pdf(path=str(out), prefer_css_page_size=True, print_background=True, margin={'top': '0', 'right': '0', 'bottom': '0', 'left': '0'})
            print('✓', out)
        browser.close()


if __name__ == '__main__':
    main()
