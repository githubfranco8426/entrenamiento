# Despliegue de OpenGym en Vercel

La rama de integración usa las mismas variables de Supabase que Entrenamiento. Vercel configura Production y Preview por separado; comprueba el ámbito de las variables antes de desplegar una rama.

## Configuración requerida

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto de Supabase.
- Una clave pública: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (compatible con la configuración anterior), `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.

El navegador, el servidor y el middleware usan el mismo orden de resolución. El build comprueba esta configuración antes de compilar e informa qué nombres están presentes, sin mostrar sus valores.

Ambas deben estar disponibles durante la compilación y en ejecución en el entorno de destino. Las variables `NEXT_PUBLIC_*` se incluyen en el navegador; nunca uses una clave `service_role` en ellas.

`GEMINI_API_KEY` y, opcionalmente, `GEMINI_MODEL` habilitan el entrenador IA. Las demás funciones de Entrenamiento conservan sus variables del servidor; por ejemplo, `SUPABASE_SERVICE_ROLE_KEY` se usa en operaciones administrativas y no debe llevar prefijo público.

Después de cambiar variables, crea un despliegue nuevo: los despliegues anteriores conservan su configuración de compilación. Una vista previa correcta no cambia el dominio de producción ni fusiona el PR.

## Comprobaciones

1. La compilación finaliza con estado Ready.
2. Abre `/login` en la vista previa e inicia sesión con tu cuenta de Entrenamiento.
3. Entra en `/opengym` y comprueba la carga de tus datos.
4. Prueba el intercambio de datos con los controles de OpenGym.

El alcance, las licencias y las diferencias de representación de datos se describen en [INTEGRATION.md](../vendor/opengym/INTEGRATION.md).
