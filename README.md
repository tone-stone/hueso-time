# Hueso Time

App web y móvil para bandas de covers: repertorio, BPM, tonalidad, género y setlists en bloques de ~45 min.

## Stack

- Expo + React Native (iOS, Android, Web)
- Expo Router
- Datos locales (AsyncStorage) **o** API (`backend/`)
- i18n: Español / English

## Correr app

```bash
npm start
```

## Backend CRUD

```bash
cd backend
npm install
npm run seed
npm run dev
```

API en `http://localhost:8787` — ver `backend/README.md`.

Para que la app use el API, creá `.env`:

```
EXPO_PUBLIC_USE_API=1
EXPO_PUBLIC_API_URL=http://localhost:8787
```

## Estructura útil

- `types/models.ts` — Song, Setlist, Set
- `data/repository.ts` — contrato de datos
- `data/localRepository.ts` — AsyncStorage
- `data/apiRepository.ts` — cliente HTTP
- `backend/` — API Hono (CRUD)
- `app/(tabs)/` — Repertorio, Setlists, Ajustes
