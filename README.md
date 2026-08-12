# Nacho's Legacy Body Shop — demo

Demo bilingüe lista para publicar con GitHub y Vercel.

## Archivos

- `index.html`: sitio completo.
- `api/chat.js`: función del asistente virtual con Groq.
- `vercel.json`: configuración de la función serverless.

## Publicación

1. Creá un repositorio vacío en GitHub.
2. Subí **el contenido de esta carpeta** a la raíz del repositorio.
3. En Vercel, seleccioná **Add New → Project** e importá el repositorio.
4. Dejá el framework como **Other** y publicá el proyecto.
5. En **Settings → Environment Variables**, creá `GROQ_API_KEY` y pegá la clave de Groq.
6. Ejecutá un nuevo deploy para activar el asistente.

## Importante

La clave de Groq nunca debe incluirse en `index.html`, `api/chat.js` ni GitHub. Se guarda únicamente como variable de entorno en Vercel.

