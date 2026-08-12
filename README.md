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

1. En [Google Cloud Console](https://console.cloud.google.com/apis/credentials) creá un proyecto y clientes OAuth:
   - **Web** (obligatorio para probar en web)
   - **iOS** con bundle `com.tonestone.huesotime`
   - **Android** con package `com.tonestone.huesotime` y el SHA-1 de tu keystore EAS
2. Copiá `.env.example` a `.env` y completá:
   ```
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxxx.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
   ```
3. En el cliente Web, agregá redirect URIs según uses (p. ej. `https://auth.expo.io/@tonestone/hueso-time` o tu URL web / scheme `huesotime://oauth`).
4. Reiniciá Expo. Solo se aceptan cuentas `@gmail.com`.

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
