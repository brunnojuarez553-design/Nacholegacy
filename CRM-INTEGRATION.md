# Recepción de consultas en Collision OS

Los formularios EN/ES y las consultas confirmadas del asistente envían datos a `/api/intake/` en la propia web. Esta función los remite al CRM usando una clave exclusivamente de servidor. La confirmación al visitante solo se muestra si el CRM confirma que guardó la consulta.

Configurar en Vercel de la web:
- `CRM_INTAKE_URL=https://crmnachoslegacy.vercel.app/api/intake/nachos` (confirmar el dominio real).
- `INTAKE_SHARED_SECRET`: mismo secreto aleatorio que en el servidor del CRM.
- Fotos opcionales: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Antes de desplegar, aplicar las migraciones y configurar Supabase + usuario de Nacho en el CRM siguiendo su README. Un envío fallido conserva el formulario y permite reintentar con el mismo ID. La actualización no envía SMS automáticamente. Los enlaces directos de teléfono/iMessage siguen abiertos; esas comunicaciones no ingresan al CRM hasta registrar la llamada/mensaje o conectar Twilio.

La carga de fotos es firmada y directa a Cloudinary; la web acepta hasta diez imágenes de 8 MB. Aplicar también límites de formato/tamaño en Cloudinary. Los enlaces de las fotos son públicos; no adjuntar documentos sensibles. El límite de solicitudes del proxy es básico por instancia; para grandes volúmenes usar protección persistente del hosting.

Verificar `npm run build` y `node --test tests-intake.mjs`; después probar formulario + asistente contra el CRM real. La validación local no confirma por sí sola el despliegue ni la recepción en producción.
