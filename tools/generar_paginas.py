#!/usr/bin/env python3
"""Genera las páginas propias de cada proyecto para Google y para compartir.

Crea, a partir de index.html y de content/*.json:
  - sobre-mi/index.html          · la página «Sobre mí», ya pintada
  - proyectos/<slug>/index.html  · una página por proyecto, ya pintada, con su título,
                                   descripción, imagen al compartir y datos estructurados
  - 404.html                     · respaldo: un proyecto nuevo funciona aunque aún no tenga página
  - assets/img/og/<slug>.jpg     · imagen 1200×630 para WhatsApp, LinkedIn, etc.
  - sitemap.xml                  · mapa de la web con todas las páginas y sus imágenes

Uso, desde la carpeta de la web:   python3 tools/generar_paginas.py
Necesita Python 3 con Pillow y Playwright (pip install pillow playwright && playwright install chromium).
Vuelve a ejecutarlo cuando añadas, quites o cambies un proyecto, y siempre que cambien style.css o app.js:
también les pone un número de versión para que los navegadores no usen una copia antigua.
"""
import datetime
import hashlib
import html
import json
import re
import socket
import subprocess
import sys
import time
from pathlib import Path

from PIL import Image, ImageFilter
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SITE_URL = 'https://anasoriaael.com/'
ANA = SITE_URL + '#ana'
WEB = SITE_URL + '#web'


def t(v, lang='es'):
    if isinstance(v, dict):
        return v.get(lang) if v.get(lang) is not None else v.get('es', '')
    return v if v is not None else ''


def absurl(path):
    return SITE_URL + str(path).lstrip('/')


def og_image(src, dest):
    """Portada completa encajada sobre una versión ampliada y desenfocada de sí misma."""
    W, H = 1200, 630
    im = Image.open(ROOT / src).convert('RGB')
    s = max(W / im.width, H / im.height)
    bg = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    bg = bg.crop(((bg.width - W) // 2, (bg.height - H) // 2, (bg.width - W) // 2 + W, (bg.height - H) // 2 + H))
    bg = bg.filter(ImageFilter.GaussianBlur(40))
    s = H / im.height
    fg = im.resize((round(im.width * s), H), Image.LANCZOS)
    bg.paste(fg, ((W - fg.width) // 2, 0))
    dest.parent.mkdir(parents=True, exist_ok=True)
    bg.save(dest, quality=84, optimize=True, progressive=True)


def sub1(pattern, repl, text, flags=re.S):
    """Sustituye exactamente una vez (si el patrón no está, avisa en vez de fallar en silencio)."""
    new, n = re.subn(pattern, lambda m: repl, text, count=1, flags=flags)
    if n != 1:
        raise SystemExit('No encuentro en index.html: ' + pattern)
    return new


def build(tpl, *, title, desc=None, canonical=None, og=None, jsonld=None, robots='index, follow, max-image-preview:large',
          skip_href='#app', app_html=None, app_hash=None, footer_html=None):
    e = lambda s: html.escape(s, quote=True)
    s = sub1(r'<meta charset="utf-8">\n', '<meta charset="utf-8">\n<base href="/">\n', tpl)
    s = sub1(r'<title>.*?</title>', '<title>' + e(title) + '</title>', s)
    s = sub1(r'<meta name="robots" content="[^"]*">', '<meta name="robots" content="' + robots + '">', s)
    if desc is not None:
        s = sub1(r'<meta name="description" content="[^"]*">', '<meta name="description" content="' + e(desc) + '">', s)
    s = sub1(r'<link rel="canonical" href="[^"]*">\n', ('<link rel="canonical" href="' + canonical + '">\n') if canonical else '', s)
    if og:
        for k, v in og.items():
            s = sub1(r'<meta property="og:' + re.escape(k) + r'" content="[^"]*">',
                     '<meta property="og:' + k + '" content="' + e(v) + '">', s)
    ld = ('<script type="application/ld+json">\n' + json.dumps(jsonld, ensure_ascii=False, indent=1) + '\n</script>\n') if jsonld else ''
    s = sub1(r'<script type="application/ld\+json">.*?</script>\n', ld, s)
    s = sub1(r'<a class="skip" href="#app">', '<a class="skip" href="' + skip_href + '">', s)
    if app_html is not None:
        s = sub1(r'<main id="app" tabindex="-1">.*?</main>',
                 '<main id="app" tabindex="-1" data-prerender="' + app_hash + '">' + app_html + '</main>', s)
    if footer_html is not None:
        s = sub1(r'<footer class="footer" id="footer"></footer>', '<footer class="footer" id="footer">' + footer_html + '</footer>', s)
    return s


def free_port():
    with socket.socket() as so:
        so.bind(('127.0.0.1', 0))
        return so.getsockname()[1]


def main():
    projects = [p for p in json.loads((ROOT / 'content/projects.json').read_text(encoding='utf-8')) if not p.get('soon')]

    # 0 · número de versión de los estilos y del código (cambia cuando cambia el archivo),
    #     así el navegador descarga siempre la versión publicada y no una copia antigua
    ver = lambda f: hashlib.md5((ROOT / f).read_bytes()).hexdigest()[:8]
    css_v, js_v = ver('assets/css/style.css'), ver('assets/js/app.js')
    tpl = (ROOT / 'index.html').read_text(encoding='utf-8')
    tpl = sub1(r'href="assets/css/style\.css(\?v=[^"]*)?"', f'href="assets/css/style.css?v={css_v}"', tpl)
    tpl = sub1(r'src="assets/js/app\.js(\?v=[^"]*)?"', f'src="assets/js/app.js?v={js_v}"', tpl)
    uc = ROOT / 'en-construccion/index.html'
    if uc.exists():
        uc.write_text(sub1(r'href="/assets/css/style\.css(\?v=[^"]*)?"', f'href="/assets/css/style.css?v={css_v}"',
                           uc.read_text(encoding='utf-8')), encoding='utf-8')

    # lista de proyectos con enlaces en el resumen sin JavaScript de la portada
    items = ''.join('\n        <li><a href="proyectos/' + p['slug'] + '/">' + html.escape(t(p['title'])) + '</a>'
                    + (' · ' + html.escape(t(p.get('kind'))) if t(p.get('kind')) else '') + '</li>' for p in projects)
    tpl = sub1(r'<!--proyectos-->.*?<!--/proyectos-->', '<!--proyectos--><ul>' + items + '\n      </ul><!--/proyectos-->', tpl)
    (ROOT / 'index.html').write_text(tpl, encoding='utf-8')

    # 1 · página 404 de respaldo (no se indexa)
    (ROOT / '404.html').write_text(build(tpl, title='Ana Soria Ael', robots='noindex'), encoding='utf-8')

    # 2 · imágenes para compartir y páginas sin pintar (para poder pintarlas después)
    for p in projects:
        og_image(p['cover'], ROOT / 'assets/img/og' / (p['slug'] + '.jpg'))
        d = ROOT / 'proyectos' / p['slug']
        d.mkdir(parents=True, exist_ok=True)
        (d / 'index.html').write_text(build(tpl, title=t(p['title'])), encoding='utf-8')

    (ROOT / 'sobre-mi').mkdir(exist_ok=True)
    (ROOT / 'sobre-mi/index.html').write_text(build(tpl, title='Sobre mí'), encoding='utf-8')

    # datos de Ana (los mismos de la portada), para reutilizarlos en las demás páginas
    home_ld = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', tpl, re.S).group(1))
    person = next(n for n in home_ld['@graph'] if n.get('@type') == 'Person')

    # quita páginas de proyectos que ya no existen
    keep = {p['slug'] for p in projects}
    for d in (ROOT / 'proyectos').iterdir():
        if d.is_dir() and d.name not in keep:
            (d / 'index.html').unlink(missing_ok=True)
            try:
                d.rmdir()
            except OSError:
                pass

    # 3 · se abre cada página en un navegador, se copia lo pintado y se guarda ya pintada
    port = free_port()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '-d', str(ROOT)],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            page = browser.new_page(viewport={'width': 1280, 'height': 900}, locale='es-ES')
            def capture(url):
                page.goto(f'http://localhost:{port}/{url}', wait_until='networkidle')
                page.wait_for_function("document.getElementById('app').hasAttribute('data-h')")
                h = page.evaluate('document.body.scrollHeight')
                for y in range(0, h + 900, 700):          # baja poco a poco para que carguen todas las fotos
                    page.evaluate(f'scrollTo(0, {y})')
                    page.wait_for_timeout(40)
                page.evaluate("""() => Promise.all([...document.images].filter(i => !i.complete).map(i =>
                    new Promise(r => { i.addEventListener('load', r); i.addEventListener('error', r); setTimeout(r, 8000); })))""")
                page.wait_for_timeout(200)
                got = page.evaluate("""() => ({
                    app: document.getElementById('app').innerHTML,
                    hash: document.getElementById('app').getAttribute('data-h'),
                    footer: document.getElementById('footer').innerHTML,
                    title: document.title,
                    desc: document.querySelector('meta[name=description]').content })""")
                return got

            # «Sobre mí»
            url = 'sobre-mi/'
            got = capture(url)
            full = SITE_URL + url
            jsonld = {'@context': 'https://schema.org', '@graph': [
                {'@type': 'ProfilePage', '@id': full + '#perfil', 'url': full, 'name': got['title'],
                 'description': got['desc'], 'inLanguage': 'es', 'mainEntity': {'@id': ANA}, 'isPartOf': {'@id': WEB}},
                person,
                {'@type': 'WebSite', '@id': WEB, 'url': SITE_URL, 'name': 'Ana Soria Ael'},
                {'@type': 'BreadcrumbList', 'itemListElement': [
                    {'@type': 'ListItem', 'position': 1, 'name': 'Ana Soria Ael', 'item': SITE_URL},
                    {'@type': 'ListItem', 'position': 2, 'name': 'Sobre mí', 'item': full}]}]}
            out = build(tpl, title=got['title'], desc=got['desc'], canonical=full,
                        og={'url': full, 'title': 'Sobre mí · Ana Soria Ael', 'description': got['desc']},
                        jsonld=jsonld, skip_href='/' + url + '#app',
                        app_html=got['app'], app_hash=got['hash'], footer_html=got['footer'])
            (ROOT / url / 'index.html').write_text(out, encoding='utf-8')
            print('✓', url, '·', got['title'])

            # proyectos
            for p in projects:
                url = 'proyectos/' + p['slug'] + '/'
                got = capture(url)
                full = SITE_URL + url
                title, summary = t(p['title']), t(p.get('summary'))
                gallery = [g.get('src') if isinstance(g, dict) else g for g in (p.get('gallery') or [])]
                keywords = [k for k in t(p.get('kind')).split(' · ') if k] + [k for k in (t(p.get('tags')) or []) if k]
                jsonld = {'@context': 'https://schema.org', '@graph': [
                    {'@type': 'CreativeWork', '@id': full + '#proyecto', 'name': title, 'description': summary, 'url': full,
                     'image': [absurl(p['cover'])] + [absurl(g) for g in gallery[:6]],
                     'keywords': ', '.join(dict.fromkeys(keywords)), 'inLanguage': 'es',
                     'author': {'@id': ANA}, 'creator': {'@id': ANA}, 'isPartOf': {'@id': WEB}},
                    person,
                    {'@type': 'WebSite', '@id': WEB, 'url': SITE_URL, 'name': 'Ana Soria Ael'},
                    {'@type': 'BreadcrumbList', 'itemListElement': [
                        {'@type': 'ListItem', 'position': 1, 'name': 'Ana Soria Ael', 'item': SITE_URL},
                        {'@type': 'ListItem', 'position': 2, 'name': title, 'item': full}]}]}
                out = build(tpl, title=got['title'], desc=got['desc'], canonical=full,
                            og={'url': full, 'title': title + ' · Ana Soria Ael', 'description': summary,
                                'image': absurl('assets/img/og/' + p['slug'] + '.jpg'),
                                'image:alt': title + ' · Ana Soria Ael'},
                            jsonld=jsonld, skip_href='/' + url + '#app',
                            app_html=got['app'], app_hash=got['hash'], footer_html=got['footer'])
                (ROOT / url / 'index.html').write_text(out, encoding='utf-8')
                print('✓', url, '·', got['title'])
            browser.close()
    finally:
        srv.terminate()

    # 4 · mapa de la web
    today = datetime.date.today().isoformat()

    def entry(loc, images):
        imgs = ''.join('\n    <image:image><image:loc>' + html.escape(i) + '</image:loc></image:image>' for i in dict.fromkeys(images))
        return f'  <url>\n    <loc>{loc}</loc>\n    <lastmod>{today}</lastmod>{imgs}\n  </url>\n'

    site = json.loads((ROOT / 'content/site.json').read_text(encoding='utf-8'))
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
           'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n')
    xml += entry(SITE_URL, [absurl('assets/img/og-ael.png')])
    xml += entry(SITE_URL + 'sobre-mi/', [absurl(site['about']['photo'])] if site.get('about', {}).get('photo') else [])
    for p in projects:
        gallery = [g.get('src') if isinstance(g, dict) else g for g in (p.get('gallery') or [])]
        after = [c['after'] for c in (p.get('compare') or []) if c.get('after')]
        xml += entry(SITE_URL + 'proyectos/' + p['slug'] + '/', [absurl(p['cover'])] + [absurl(x) for x in gallery + after])
    xml += '</urlset>\n'
    (ROOT / 'sitemap.xml').write_text(xml, encoding='utf-8')
    print('✓ sitemap.xml ·', len(projects) + 2, 'páginas')


if __name__ == '__main__':
    if 'uc-main' in (ROOT / 'index.html').read_text(encoding='utf-8'):
        sys.exit('La web está en construcción: quítalo antes (git revert del commit «Web en construcción»).')
    main()
