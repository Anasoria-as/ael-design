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

## Cambiar contenido

Todo el texto está en los dos archivos de `content/`. Cada texto tiene su versión `"es"` y `"en"`.

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
