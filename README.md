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

## Login con Gmail (Google)

Guía completa de producción: [`docs/GOOGLE_AUTH.md`](docs/GOOGLE_AUTH.md).

1. En [Google Cloud Console](https://console.cloud.google.com/apis/credentials) creá clientes OAuth **Web**, **Android** (`com.tonestone.huesotime` + SHA-1) e **iOS**.
2. Completá `.env` (ver `.env.example`).
3. Subí los mismos valores como secrets EAS (`eas env:create …`).
4. Build nativo (no Expo Go):
   ```bash
   npx eas build -p android --profile preview
   ```
5. `EXPO_PUBLIC_SKIP_AUTH=0` en preview/production (ya está en `eas.json`).

## Buscar canciones (Spotify / iTunes)

Al agregar una canción en **Repertorio**, podés buscar y autocompletar título, artista, duración y carátula.

- **Sin config:** usa **iTunes Search** (público).
- **Con Spotify:** en `backend/.env` poné `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET` (desde [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)), levantá el backend, y la app consultará `EXPO_PUBLIC_API_URL` primero.

BPM y tonalidad siguen siendo manuales (Spotify ya no expone eso de forma confiable).

## Importar setlist desde Google Sheets

1. En la hoja: columnas **Artista | Título** (opcionales: Tono, BPM, Duración, Género, Set).
2. Compartir como **Cualquiera con el enlace**.
3. En la app: **Setlists → Importar Google Sheets** y pegá la URL.

En web, si falla por CORS, levantá el backend (`cd backend && npm run dev`).

## Estructura útil

- `types/models.ts` — Song, Setlist, Set
- `data/repository.ts` — contrato de datos
- `data/localRepository.ts` — AsyncStorage
- `context/AuthContext.tsx` — sesión Google / Gmail
- `app/login.tsx` — pantalla de ingreso
- `data/apiRepository.ts` — cliente HTTP
- `backend/` — API Hono (CRUD)
- `app/(tabs)/` — Repertorio, Setlists, Ajustes
