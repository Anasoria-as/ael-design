# ael-design · anasoriaael.com

Portfolio de Ana Soria Ael. HTML, CSS y JavaScript sin librerías ni instalaciones.

## Qué hay en cada carpeta

| Ruta | Qué es |
|---|---|
| `index.html` | La página. Casi nunca hace falta tocarla. |
| `content/site.json` | Todos los textos: portada, sobre mí, experiencia, formación, herramientas, contacto (en español e inglés). |
| `content/projects.json` | Los proyectos. El orden del archivo es el orden en la web. |
| `assets/css/style.css` | Estilos y colores de marca (arriba del todo, en `:root`). |
| `assets/js/app.js` | Lógica: idioma, tema claro/oscuro, cursor, páginas de proyecto. |
| `assets/img/` | Logo, favicon y la carpeta `proyectos/` para las imágenes. |
| `cv/` | Los dos PDF del CV que se descargan desde la web. |
| `CNAME` | Le dice a GitHub que la web va en anasoriaael.com. No lo borres. |
| `admin/` | El panel para editar textos y proyectos sin tocar código (Sveltia CMS). |

## Panel de edición · anasoriaael.com/admin/

Desde el panel puedes cambiar todos los textos, añadir o reordenar proyectos, subir imágenes y sustituir los CV, en español e inglés. Cada vez que pulsas **Guardar**, el panel hace un commit en GitHub y la web se actualiza sola en uno o dos minutos.

**Primera vez: crea tu llave de acceso (token)**

1. Entra en GitHub y abre <https://github.com/settings/personal-access-tokens/new> (es *Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*).
2. **Token name:** `Panel ael-design`. **Expiration:** la que prefieras (por ejemplo, 1 año).
3. **Repository access:** *Only select repositories* → `Anasoria-as/ael-design`.
4. **Permissions → Repository permissions → Contents:** *Read and write*. No hace falta nada más.
5. Pulsa **Generate token** y copia el código (empieza por `github_pat_`). GitHub solo te lo enseña una vez.
6. Abre <https://anasoriaael.com/admin/>, pulsa **Iniciar sesión con un token de acceso** y pégalo.

El navegador recuerda la sesión. En otro ordenador o navegador vuelve a pegar el token (o crea uno nuevo si no lo guardaste). El token es como una contraseña: no lo compartas ni lo subas a ningún archivo. Si caduca o lo pierdes, borra el viejo en esa misma página de GitHub y crea otro.

**Qué hay en el panel**

- **Proyectos:** la lista de proyectos. Ábrelos con la flecha, arrástralos para cambiar el orden y usa *Agregar proyecto* para crear uno nuevo. Para sustituir una imagen o un CV, pulsa *Reemplazar*. Las imágenes que subas se guardan en `assets/img/proyectos/`.
- **Textos de la web:** portada, cinta de palabras, lo que aporto, herramientas, sobre mí (y tu foto), experiencia, formación, idiomas, los dos CV y, al final, los textos de botones y menús.

**Importante:** cuando uses el panel, los archivos de `content/` en GitHub serán más nuevos que los de tu Mac. Si subes archivos a mano, no subas `content/` desde una copia antigua o borrarías lo que hayas cambiado en el panel. Para tener la copia al día, descarga el repositorio desde GitHub (*Code → Download ZIP*).

## Cambiar contenido a mano

Si prefieres no usar el panel, todo el texto está en los dos archivos de `content/`. Cada texto tiene su versión `"es"` y `"en"`.

**Añadir la imagen de un proyecto:** guarda la imagen en `assets/img/proyectos/` (por ejemplo `vaukura.jpg`, 1600 × 1000 px aprox.) y escribe su ruta en el campo `"cover"` del proyecto:

```json
"cover": "assets/img/proyectos/vaukura.jpg",
```

Si `"cover"` está vacío, la web muestra una portada de color con el nombre del proyecto.

**Imágenes extra dentro del caso:** añádelas en `"gallery"`:

```json
"gallery": ["assets/img/proyectos/vaukura-home.jpg", "assets/img/proyectos/vaukura-ficha.jpg"],
```

**Proyecto destacado:** pon `"featured": true` en el que quieras grande arriba (solo uno).

**Tu foto en "Sobre mí":** guárdala como `assets/img/ana.jpg` y escribe `"photo": "assets/img/ana.jpg"` en `site.json`.

**Actualizar el CV:** sustituye los PDF de `cv/` manteniendo el mismo nombre.

## Verla en tu Mac antes de subirla

Los textos se cargan desde `content/`, así que abrir `index.html` con doble clic no funciona. En VS Code instala la extensión **Live Server**, abre la carpeta y pulsa **Go Live**.

## Publicarla en GitHub Pages

1. En GitHub crea un repositorio nuevo, por ejemplo `ael-design`, público.
2. Sube todos los archivos de esta carpeta a la raíz del repositorio (botón **Add file → Upload files**, arrastra el contenido de la carpeta).
3. Ve a **Settings → Pages**. En *Source* elige **Deploy from a branch**, rama `main`, carpeta `/ (root)`, y guarda.
4. En *Custom domain* escribe `anasoriaael.com` y guarda.

## Conectar el dominio en Cloudflare

En Cloudflare → tu dominio → **DNS → Records**, crea estos registros con el proxy en **DNS only** (nube gris):

| Tipo | Nombre | Contenido |
|---|---|---|
| A | `@` | 185.199.108.153 |
| A | `@` | 185.199.109.153 |
| A | `@` | 185.199.110.153 |
| A | `@` | 185.199.111.153 |
| CNAME | `www` | `anasoria-as.github.io` |

Cuando GitHub compruebe el dominio (de minutos a unas horas), vuelve a **Settings → Pages** y marca **Enforce HTTPS**. Con esto funcionan tanto anasoriaael.com como www.anasoriaael.com.

## Páginas de los proyectos y Google

Cada proyecto tiene su propia dirección, por ejemplo `anasoriaael.com/proyectos/vaukura/`, con su título, descripción e imagen al compartir (en `assets/img/og/`). Esas páginas se generan con `tools/generar_paginas.py`, que también actualiza `sitemap.xml`.

- Si añades o cambias un proyecto desde el panel, su página **funciona al momento** (la web la pinta con los textos nuevos).
- Para que Google y WhatsApp vean también el título, la descripción y la foto nuevos, hay que volver a generar las páginas: pídeselo a Claude.
- El script también pone un número de versión a `style.css` y `app.js` en cada página, para que los navegadores no se queden con una copia antigua después de publicar.

## Web en construcción

`python3 tools/construccion.py` copia `en-construccion/index.html` encima de la portada, «Sobre mí», cada proyecto y la 404: cualquier dirección de la web muestra «Vuelvo pronto», con tu correo, LinkedIn y los CV.

- Para volver a la web normal: `python3 tools/construccion.py quitar` y después `python3 tools/generar_paginas.py`. Las páginas vuelven como estaban, con los cambios hechos mientras tanto. Pídeselo a Claude.
- Mientras está en construcción, `tools/generar_paginas.py` no se ejecuta, para no regenerar la web encima por error.
- Los cambios que hagas en el panel se guardan, pero no se ven hasta quitar la página en construcción.

## Recomendaciones

Salen en la portada, en «Lo que dicen de mí», con un botón a tus recomendaciones de LinkedIn. Se añaden desde el panel, en Textos de la web → Recomendaciones: copia el texto tal cual lo escribió la persona y pídele permiso para poner su nombre. En inglés sale la traducción con el aviso «Translated from Spanish».

## Contador de visitas (Cloudflare Web Analytics)

Sin cookies ni datos personales: Cloudflare muestra visitas, páginas vistas, países, de dónde llegan (LinkedIn, Google…) y navegadores. Se mira en Cloudflare → Analytics & Logs → Web Analytics.

- El token de Cloudflare va en `index.html` (línea `var TOKEN = '...'`); el generador lo copia a todas las páginas. También está en `en-construccion/index.html`. Si se deja vacío, el contador se apaga.
- Para que tus visitas no cuenten, abre **anasoriaael.com/?soy-ana** una vez en cada navegador que uses (móvil, ordenador y también el navegador interno de LinkedIn o Instagram, que va aparte). Para volver a contarte: **anasoriaael.com/?no-soy-ana**.
