# Roadmap de plataforma

## Hecho en esta iteración
- Edición de meta del setlist (nombre / venue / fecha)
- Fix replace sin borrar al detectar duplicado
- Compartir setlist (Share nativo)
- Modo show fullscreen + keep-awake + timer / overrun
- Favorito + estado de práctica en canciones
- Generación con pacing de energía (`lib/setEnergy.ts`)
- Auth: rechazo de JWT expirado al restaurar sesión
- Tests unitarios de energía (`npm test`)

## Siguiente (sync real)
1. Postgres (Neon/Supabase) con tablas `users`, `songs`, `setlists`
2. Backend Hono: `Authorization: Bearer <Google id_token>` verificado con certs de Google
3. Particionar datos por `user_id` (o `band_id` para colaboración)
4. Cliente: cola offline + pull/push al abrir la app
5. Invitar miembros de banda (P2)
