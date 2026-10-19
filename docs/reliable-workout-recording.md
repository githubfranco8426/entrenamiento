# Registro fiable de entrenamientos

La sesión se guarda en IndexedDB por usuario y entrenamiento. Pantalla y widget usan la misma cola. Cada operación tiene UUID, versión esperada y datos inmutables; el servidor bloquea la sesión y confirma la operación en una transacción. Un reintento devuelve el resultado anterior. Los conflictos permanecen en el dispositivo hasta que el usuario decide aplicar o descartar el primer cambio.

## Despliegue

1. Aplicar `supabase/migrations/20261019141631_reliable_workout_sync.sql` antes de publicar el cliente. Añade columnas, tabla de operaciones y funciones; conserva el historial. Aplicada al proyecto Entrenamiento el 19 de octubre de 2026.
2. Ejecutar `npm ci`, `npm test` y `npm run build`. El último comando genera `public/sw.js`; no usar solamente `next build` en la configuración del despliegue.
3. Validar la vista previa con una cuenta de prueba y luego promover la versión. No mezclar pruebas sintéticas con entrenamientos personales.
4. Las pestañas antiguas deben recargarse: los endpoints anteriores de escritura responden 409 para impedir cambios que omitan las versiones. La lectura sigue disponible.

La caché contiene únicamente la pantalla pública de recuperación y recursos estáticos. No almacena respuestas autenticadas ni API. IndexedDB conserva los cambios al cerrar sesión; iniciar sesión con otra cuenta no los muestra. La eliminación de los datos del sitio por el usuario o el navegador elimina también estos datos locales. La preparación sin conexión requiere una primera carga completa con conexión.

## Validación realizada

- 38 pruebas automatizadas: almacenamiento, cola ordenada, reintentos tras respuesta perdida, doble toque entre vistas, edición y eliminación pendientes, cierre, aislamiento de cuentas, conflictos, API, zona horaria y PostgreSQL con RLS.
- PostgreSQL ejecuta la migración real en PGlite; verifica atomicidad, repetición, propiedad y pertenencia al entrenamiento, inicio que retoma la sesión abierta e índices que no se reutilizan al borrar.
- Compilación de producción y ESLint de archivos modificados.
- Navegador con servidor local apagado: registrar 0 kg, conservar borrador de 17,5 kg, navegar a la sesión, cerrar pestaña y reabrir, recuperar temporizador, registrar otra serie y finalizar. Quedaron exactamente dos series y un cierre pendiente, con volumen 210 kg y duración 45 minutos.
- Se retiró la ruta temporal de datos sintéticos antes del despliegue.

## Validación pendiente antes de producción

- Cuenta autenticada en la vista previa: registrar, perder conexión, volver y confirmar una sola copia en historial y métricas.
- Cerrar sesión y cambiar de cuenta con operaciones pendientes; recuperar la cuenta original y sincronizar.
- Móvil físico: teclado, navegación, segundo plano y reapertura desde el icono instalado.

## Observaciones de la plataforma

El asesor de Supabase no señala las nuevas funciones ni la tabla. Señala configuraciones existentes ajenas a esta entrega: [RLS sin políticas en app_state](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [funciones de entrenador SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) y [protección de contraseñas filtradas desactivada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
