# Nacho’s Legacy Body Shop

Sitio estático bilingüe con páginas independientes, preparado para Vercel. Conserva la identidad visual y el asistente Groq del sitio original.

## Desarrollo

Requiere Node.js 20 o superior. No necesita instalar dependencias.

```bash
npm run build
npm test
npm run dev
```

Vista local: `http://localhost:3000`. El servidor local sirve las páginas; la función de Groq se ejecuta en Vercel.

## Estructura

- `src/data/site.json`: datos del negocio, dominio, logo e imágenes.
- `src/data/services.json`: alcance de los servicios en inglés y español.
- `src/partials/{en,es}/`: encabezado, pie y controles compartidos.
- `src/sections/{en,es}/`: contenido de cada sección.
- `public/assets/`: estilos y comportamiento del sitio.
- `scripts/build.mjs`: páginas, metadatos, schema, sitemap y robots.
- `scripts/check.mjs`: verificaciones de HTML, enlaces y API.
- `api/chat.js`: función serverless del asistente.
- `docs/AUDIT-2026-10-02.md`: hallazgos, cambios y pendientes.
- `dist/`: salida generada, excluida de Git.

## Vercel

`vercel.json` configura `npm run build`, salida `dist` y rutas con barra final. La carpeta raíz `api` conserva la función serverless. Mantener `GROQ_API_KEY` como variable de entorno; nunca incluirla en Git.

El dominio principal está definido en `src/data/site.json`. Para cambiarlo, modificar `url` o definir `SITE_URL` en el entorno de build. Volver a desplegar y enviar el sitemap al Search Console del dominio final.

## Contacto y evaluaciones

Las llamadas, correo y SMS usan los datos actuales del negocio. El formulario prepara un SMS para revisar y enviar desde el dispositivo del visitante; no guarda consultas en una base de datos ni sube fotografías. Las fotografías se adjuntan en la app de mensajes.

El sitio incluye 13 páginas por idioma. Cada página tiene un canonical propio y enlaces a su equivalente en el otro idioma. El contenido es HTML estático y puede leerse sin JavaScript. `llms.txt` es una referencia complementaria y no una promesa de posicionamiento.
