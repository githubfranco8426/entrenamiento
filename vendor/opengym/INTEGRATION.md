# OpenGym integrado en Entrenamiento

Source: https://github.com/alexpcosta/opengym
Pinned commit: 678bf5bf10446e8997a77d43e89c9b2721d8d0fc
Upstream: https://github.com/DuarteSantos8/openGym
Copyright (C) 2026 Duarte Santos and contributors. AGPL-3.0-or-later.

This modified OpenGym module uses Entrenamiento's Supabase cookie session, user-scoped
local storage, optimistic synchronization and PostgreSQL persistence. Its backend Coach
uses the existing Gemini configuration instead of persistent Claude/Codex CLI processes.
Manual requests only; background review scheduling, upstream passkey/admin management,
and Web Push delivery are not enabled in this deployment. Account administration stays
in Entrenamiento. Native Android/iOS distribution is outside this web integration.

The complete modified frontend and required Coach modules are retained here. The adapter
is in lib/opengym and app/api/opengym; SQL in supabase/migrations. Build with the committed
lockfiles using npm run build:opengym. A downloadable corresponding-source archive is
published at /opengym-source.tar.gz, linked visibly in the module. Original license and
third-party notices are retained. Integration-specific adapter code is also offered under
AGPL-3.0-or-later.

No Gym Visual exercise images/GIFs are included or fetched by default. The exercise
instructions and dataset structure use their separate MIT license, reproduced in
DATASET-LICENSE.txt; media requires your own license from Gym Visual. After obtaining
one, VITE_LICENSED_MEDIA_BASE can point to licensed media, with the required attribution.

## Data exchange

The first launch imports your existing exercises, routines, completed workouts and body
weight. The schema uses kilograms. Subsequent imports append only missing source rows,
so they do not overwrite OpenGym edits. Imports fail explicitly at 1000 source records
per entity rather than claiming to import an arbitrarily large history.

Publishing creates stable-ID copies of new/changed routines, completed OpenGym workouts
and new body-weight dates. Repeating publication doesn't duplicate sessions. Existing
original workouts and plans are never deleted. Imported original sessions are skipped.
Timed/cardio fields and heterogeneous per-set prescriptions remain complete in the
OpenGym snapshot; the existing Entrenamiento schema can only display its compatible
weight/repetition fields. Publishing is explicit, not a second progression engine writing
automatically into the user's active periodization. Transfers run atomically under RLS.

## Activation

Apply the integrate_opengym migration to the app's Supabase project and deploy the branch.
Existing NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY settings are reused.
GEMINI_API_KEY and optional GEMINI_MODEL enable the Coach. No secrets belong in the Vite
build. The module is available at /opengym and /opengym-app/index.html.
