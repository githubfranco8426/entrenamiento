# Ejercicios correctivos en Entrenamiento

Integración local del 2 de noviembre de 2026, sobre el repositorio `githubfranco8426/entrenamiento`, copia de `C:/Users/PC/Desktop/Archivos Claude/App entrenamiento`. Se preservó el trabajo previo de mesociclos.

## Resultado

Correctivos abre en Mi rutina: propuesta inicial para hiperlordosis, editable y con instrucciones. La evaluación «¿Cómo llegas hoy?» se integra al chequeo existente de Inicio. Se conserva la retirada del bloque de inicio de sesión y el tema natural de la app.

- Nueva sección autenticada `/correctivos`, dentro del layout habitual de Entrenamiento, conservando encabezado, menú lateral, barra móvil y acceso existente. No agrega otro login ni exige una segunda cuenta o invitación.
- En escritorio: **Ejercicios correctivos** en el menú. En móvil: **Correctivos** directamente en la barra inferior; **Plan** permanece accesible dentro de **Más**.
- Conserva del módulo anterior: evaluación diaria de fatiga percibida, sueño, dolor NRS segmentario, síntomas y turno; biblioteca por patrones y Casa/Gimnasio; prescripción editable; sesión con registro de kg/banda/peso corporal, repeticiones, RIR y calidad opcional; descanso automático; recuperación; historial, volumen comparable, doble progresión y exportación JSON.
- La interfaz hereda la paleta natural de Entrenamiento: superficies claras, pizarra y azul cobalto. No fuerza un tema propio ni añade un selector de tema separado. Usa los componentes shadcn/ui existentes.
- Utiliza Supabase SSR/Auth y la función `getAuthenticatedUser` de la app; integra los nuevos objetos en sus tipos de base de datos. Reutiliza el calendario chileno existente.
- Los registros correctivos usan tablas propias y no escriben en `workouts`, `set_logs` o `readiness_logs`. El nuevo chequeo reutiliza readiness_logs para sus datos habituales y guarda los campos clínicos privados en readiness_clinical; la rutina correctiva no se suma al volumen de fuerza. Las sesiones correctivas y sus temporizadores son independientes de la sesión de fuerza.
- No comparte estos registros con un coach. RLS exige el propietario exacto, sin extender las políticas de colaboración del resto de la app.
- El código anterior de App-Centro-Rehabilitame se conserva. No se movieron ni eliminaron datos.

## Persistencia

Migración nueva: `supabase/migrations/20261102162803_corrective_exercises.sql`.

| Objeto | Función |
| --- | --- |
| `corrective_baselines` | Evaluación editable por usuario/día. |
| `corrective_plans` | Prescripción personal validada. |
| `corrective_sessions` | Una sesión activa por usuario y copias del plan/evaluación al inicio. |
| `corrective_sets` | Series inmutables, con UUID idempotente y unicidad por ejercicio/número. |
| `corrective_start` | Crea o recupera la sesión activa, conservando la identidad del propietario. |
| `corrective_log_set` | Confirma cada serie una sola vez, detecta reintentos distintos y calcula el fin del descanso desde el servidor. |

Funciones `security invoker`, RLS en las cuatro tablas, privilegios de anónimo/público revocados y claves compuestas contra referencias a otro usuario. Las rutas clínicas y la API desactivan caché; el módulo no introduce almacenamiento local de datos de salud. El service worker existente solo almacena los recursos estáticos y el shell de entrenamiento sin conexión, no la API de Correctivos.

La exportación está disponible en `/api/correctivos?export=json` para el usuario autenticado. Lee todos sus registros con paginación interna. No hay nuevas dependencias ni secretos.

## Verificación

- **55/55 pruebas** aprobadas en 11 archivos, incluidas **10 nuevas**: PostgreSQL local, RLS, claves cruzadas, recuperación, copias históricas, reintentos idempotentes, descanso, validación, separación de métricas de fuerza y límites de la API.
- **TypeScript y ESLint** aprobados en los archivos del cambio.
- **Compilación de producción** aprobada, incluida la generación del service worker. Aparece `/correctivos` y `/api/correctivos` en las rutas dinámicas. El aviso de Next.js sobre el nombre `middleware.ts` ya corresponde a la arquitectura existente; se conservó esa convención para limitar el cambio.
- **Servidor de producción local**, puerto 3030: `/correctivos` redirige al login habitual sin sesión; la API devuelve 401 sin autenticar y 403 para escrituras desde otro origen.
- **Chromium con datos sintéticos y API de prueba**, usando los componentes reales del módulo y los menús de la app: acceso móvil directo a Correctivos y Plan dentro de Más; evaluación → prescripción → inicio → respuesta de guardado perdida → reintento con mismo UUID → recarga y recuperación → avance del reloj → cierre → volumen esperado de 480 kg·reps. Sin errores de JavaScript ni desbordamientos horizontales a 320, 390 y 1440 px.
- Las capturas de la integración usan datos de prueba, no registros reales ni una sesión autenticada contra Supabase de producción.

## Activación y despliegue

La migración fue aplicada el 2 de noviembre de 2026 en Supabase **Entrenamiento**, `rwwuvvhwdexqjvxgbqkb`. Se verificaron idempotencia, temporizador del servidor, reintento de una sesión finalizada y aislamiento entre propietarios sobre la base real, dentro de una transacción revertida. No quedaron registros de prueba.

El módulo se publica desde `main` del repositorio `githubfranco8426/entrenamiento`, en el proyecto Vercel `entrenamiento`, equipo `team_5FHHeFBLE9qvCj8eLEiZnn6N`. La ruta pública es `https://entrenamiento-kappa.vercel.app/correctivos`. No requiere otra cuenta ni una habilitación adicional: cada usuario usa su login actual y ve exclusivamente sus propios registros correctivos.

La comprobación completa desde un navegador autenticado con la cuenta personal depende de tener una sesión de esa cuenta. La comprobación de base de datos real se hizo con permisos del rol autenticado y revirtió todos los cambios de prueba. La aplicación no simula persistencia exitosa ante un error del servidor.

## Archivos

Nuevos: `app/(app)/correctivos/page.tsx`, `loading.tsx`, `error.tsx`, `correctives.css`; `app/api/correctivos/route.ts`, `route.test.ts`; `components/correctives/forms.tsx`, `logger.tsx`, `progress.tsx`, `workspace.tsx`; `lib/correctives/model.ts`, `server.ts`, `database.ts`, `database.test.ts`; la nueva migración y este informe.

Modificados: `components/nav-links.ts`, `components/app-mobile-nav.tsx`, `lib/types/database.ts`, `middleware.ts`.

## Límites conservados del MVP

Biblioteca inicial de ocho variantes y una plantilla personal; una zona de dolor por evaluación diaria; eficiencia del sueño introducida manualmente; sin prescripción clínica automática ni sincronización sin conexión. Las series confirmadas no se editan desde la interfaz. El módulo todavía no admite adjuntar imágenes ni incorporar automáticamente sus datos a la IA o al resumen del coach. La recuperación cubre lo confirmado en el servidor; los campos no enviados de un formulario no sobreviven a una recarga.

## Chequeo único y rutina para hiperlordosis

El chequeo habitual de Inicio incorpora fatiga percibida, eficiencia estimada de sueño, dolor NRS y zona, y síntomas respiratorios, todos opcionales. Una RPC security invoker guarda la parte habitual y la parte clínica privada dentro de una única transacción. Una actualización rápida de energía omite los otros valores; no los transforma en nulos. Los campos adicionales no se incorporan al resumen del coach. Las evaluaciones correctivas anteriores se conservan y se copian a la tabla privada de seguimiento por fecha sin inventar horarios de turno ni registros habituales. La exportación propia incluye las dos partes.

Correctivos muestra una propuesta de control lumbopélvico: basculación suave (1 × 6–8), deslizamiento de talón (1 × 6–8 por lado), puente (1 × 8–10) y bird dog corto con pie apoyado (1 × 5–6 por lado). Descansos de 30–45 segundos. Inicio orientativo: tres días semanales, esfuerzo cómodo lejos del fallo, revisión de la respuesta del día y de la mañana siguiente. La dosis es una propuesta editable; no se presenta como un protocolo demostrado para cambiar el ángulo de lordosis. Incluye una variante más fácil y criterios para detener cada práctica ante síntomas nuevos. La plantilla se muestra sin sobrescribir un plan guardado; el usuario debe guardar sus cambios para adoptarla. No se añade otro botón para iniciar una sesión.

Fuentes: [revisión de ejercicio y curvaturas vertebrales](https://pubmed.ncbi.nlm.nih.gov/31034509/), [movilidad lumbar de Cambridge University Hospitals](https://www.cuh.nhs.uk/patient-information/back-mobility-exercises/), [ejercicios de control abdominal de NHS Fife](https://www.nhsfife.org/services/all-services/patient-advice/stage-two-exercises-for-your-tummy-muscles/). Las técnicas están adaptadas a una propuesta inicial conservadora; no se extrapolan resultados de otras poblaciones como una garantía individual.

Pruebas: 63 aprobadas, TypeScript, ESLint y compilación. Nueva migración 20261102175100_unified_daily_checkin.sql aplicada en Entrenamiento; comprobación transaccional real de guardado conjunto, preservación tras actualizar energía y aislamiento, con reversión de todos los datos de prueba.
