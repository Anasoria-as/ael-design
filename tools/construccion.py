"""
Pone TODA la web en «en construcción».

Copia la página en-construccion/index.html encima de la portada, «Sobre mí»,
cada proyecto y la 404, así que cualquier dirección de anasoriaael.com
muestra «Vuelvo pronto» (con correo, LinkedIn y CV).

    python3 tools/construccion.py

Para quitarlo y recuperar la web tal cual estaba: deshacer el commit
«Web en construcción» con  git revert <commit>  (las páginas vuelven
exactamente como antes; no hace falta regenerar nada).
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
pagina = (ROOT / 'en-construccion/index.html').read_text(encoding='utf-8')

destinos = [ROOT / 'index.html', ROOT / '404.html', ROOT / 'sobre-mi/index.html']
destinos += sorted((ROOT / 'proyectos').glob('*/index.html'))

for f in destinos:
    f.write_text(pagina, encoding='utf-8')
    print('✓', f.relative_to(ROOT))
print('Web en construcción ·', len(destinos), 'páginas')
