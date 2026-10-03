# TODO

## SEO / posicionamiento
- [ ] **Google Search Console**: verificar el dominio `manuelmartinez.ar` (registro TXT en Cloudflare), enviar `sitemap.xml` y pedir indexación de la home.
- [ ] **Dominio raíz**: `manuelmartinez.ar` hoy no sirve nada. Redirigirlo a `portfolio.manuelmartinez.ar` o mudar el portfolio al apex (DNS en Cloudflare + dominio en Vercel). Si se muda, actualizar canonical, `og:url`, JSON-LD y `sitemap.xml`.
- [ ] **Backlinks**: agregar el link del portfolio en LinkedIn (sitio web + destacados), perfil de GitHub, `music.manuelmartinez.ar` y, si se puede, la página de equipo de Encodelabs.
- [ ] **Nombre consistente** en todos los perfiles ("Manuel Martínez" / "Manuel A. Martínez").

## Contenido
- [ ] Reemplazar `assets/projects/placeholder.svg` por screenshots reales (16:10, `.webp`) con `alt` descriptivo.
- [ ] Revisar los proyectos genéricos que quedan (Sistema de autogestión, Gestor de clases, Plataforma de administración, Sitios institucionales): nombres reales o quitarlos.
- [ ] Nombre propio de la plataforma de firma electrónica (PAE), si lo tiene.
- [ ] Diferenciar la descripción de Userflow y la de firma electrónica (PAE) si comparten base.
- [ ] Link de Veriblink, si existe sitio público.
- [ ] Link de GitHub en el header, si se quiere mostrar.

## Deploy
- [ ] Dar acceso a la app de Vercel en GitHub al repo `portfolio_mm` y correr `vercel git connect` para deploy automático en cada push.
