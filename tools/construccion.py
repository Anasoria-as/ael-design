"""
Pone o quita TODA la web en «en construcción».

    python3 tools/construccion.py          → la pone
    python3 tools/construccion.py quitar   → la quita

Ponerla copia la página en-construccion/index.html encima de la portada,
«Sobre mí», cada proyecto y la 404, así que cualquier dirección de
anasoriaael.com muestra «Vuelvo pronto» (con correo, LinkedIn y CV).

Quitarla recupera esas páginas tal como estaban justo antes del último
commit «Web en construcción». Después conviene ejecutar
tools/generar_paginas.py para que recojan los cambios hechos mientras tanto.
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def paginas():
    fijas = [ROOT / 'index.html', ROOT / '404.html', ROOT / 'sobre-mi/index.html']
    return fijas + sorted((ROOT / 'proyectos').glob('*/index.html'))


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, check=True, capture_output=True, text=True).stdout.strip()


if len(sys.argv) > 1 and sys.argv[1] == 'quitar':
    commit = git('log', '-n1', '--format=%H', '--grep=^Web en construcción')
    if not commit:
        sys.exit('No encuentro el commit «Web en construcción».')
    for f in paginas():
        rel = f.relative_to(ROOT).as_posix()
        try:
            f.write_text(git('show', f'{commit}^:{rel}') + '\n', encoding='utf-8')
            print('✓', rel)
        except subprocess.CalledProcessError:   # página nueva creada después: se queda para regenerarla
            print('·', rel, '(no existía antes; se regenera con generar_paginas.py)')
    print('Web normal recuperada · ahora: python3 tools/generar_paginas.py')
else:
    pagina = (ROOT / 'en-construccion/index.html').read_text(encoding='utf-8')
    for f in paginas():
        f.write_text(pagina, encoding='utf-8')
        print('✓', f.relative_to(ROOT))
    print('Web en construcción ·', len(paginas()), 'páginas')
