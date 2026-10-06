# Hueso Time

App web y móvil para bandas de covers: repertorio, BPM, tonalidad, género y setlists en bloques de ~45 min.

## Stack

- Expo + React Native (iOS, Android, Web)
- Expo Router
- Datos locales (AsyncStorage) **o** API (`backend/`)
- i18n: Español / English

## Correr app

Para probar en Android con **Expo Go**:

```bash
npm start -- --go
```

Este modo abre como invitado y usa datos locales para probar repertorio y setlists.
Google Sign-In requiere el APK nativo; preview y production siguen exigiendo login.

Para compilar e instalar el APK de desarrollo con Android Studio instalado:

```bash
npm run android
```

En Windows, el comando detecta el Java y SDK de Android Studio y habilita el
acceso nativo necesario con Java 24 o posterior. El login de Google necesita
registrar el SHA-1 de la firma de este APK, como indica `docs/GOOGLE_AUTH.md`.

```bash
npm start
```

Este comando inicia la API y Expo juntos. El teléfono usa un único puerto: **8081**, tanto para cargar la app como para `/v1/*` y `/health`. El servidor API interno escucha solo en `127.0.0.1:8787`. `Ctrl+C` detiene ambos servicios.

El comando calcula la IP de la computadora y la pasa a Expo como `EXPO_PUBLIC_API_URL`. Usá la app de desarrollo Hueso Time instalada en el teléfono y conectá ambos al mismo Wi-Fi; escaneá el QR nuevo. No hace falta recompilar el APK para este cambio.

Para abrir web con la misma API: `npm run web`. Para iniciar solamente Expo: `npm run start:expo` (la API debe iniciarse por separado). Instalá primero las dependencias del backend con `npm --prefix backend install` y configurá `backend/.env` siguiendo su README.

## Tests

Para generar el APK autónomo de tablet con login Google obligatorio:
`npm run build:apk`. El archivo queda en `artifacts/Hueso-Time-1.0.0-tablet.apk`.
Consulta [Instalación en tablet y firma Google](docs/APK_TABLET.md).

`npm start` reutiliza los clientes públicos de Google del perfil `development-device`
de `eas.json` cuando no están definidos en `.env`. Esto permite que el APK de
desarrollo reciba la configuración de login al cargar el JavaScript local.
El backend local también usa ese cliente Web si no hay `backend/.env` ni
`GOOGLE_CLIENT_IDS` en el entorno. Las configuraciones explícitas tienen prioridad.
El login requiere un APK nativo y el SHA-1 de su firma registrado en Google Cloud;
Expo Go no incluye el módulo de Google Sign-In.

```bash
npm test          # unit tests (vitest)
npm run ci        # typecheck cliente + backend + tests
```

## App Store (iOS)

Guía completa: [`docs/APP_STORE.md`](docs/APP_STORE.md) · Política borrador: [`docs/PRIVACY_POLICY.md`](docs/PRIVACY_POLICY.md)

```bash
npx eas build --platform ios --profile production
npx eas submit --platform ios --profile production --latest
```

## Backend CRUD

```bash
npm --prefix backend install
npm start
```

Con `npm start`, la API es accesible en `http://localhost:8081` — configurá `GOOGLE_CLIENT_IDS` en `backend/.env`; ver `backend/README.md` para autenticación, cuentas, respaldos y control de versiones.

Para que la app use el API, creá `.env`:

```
EXPO_PUBLIC_USE_API=1
EXPO_PUBLIC_API_URL=http://localhost:8081
```

## Login con Gmail (Google)

Guía completa de producción: [`docs/GOOGLE_AUTH.md`](docs/GOOGLE_AUTH.md).

La lista original del Excel de **254 canciones** se precarga tanto en instalaciones locales nuevas como en cuentas API nuevas. Las canciones que ya guardaste tienen prioridad. Spotify se consulta desde el backend para buscar canciones adicionales y no es necesario para generar sets con la lista precargada.

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

En web, si falla por CORS, ejecutá `npm start`, que inicia el backend junto con Expo.

## Estructura útil

- `types/models.ts` — Song, Setlist, Set
- `data/repository.ts` — contrato de datos
- `data/localRepository.ts` — AsyncStorage
- `context/AuthContext.tsx` — sesión Google / Gmail
- `app/login.tsx` — pantalla de ingreso
- `data/apiRepository.ts` — cliente HTTP
- `backend/` — API Hono (CRUD)
- `app/(tabs)/` — Repertorio, Setlists, Ajustes
