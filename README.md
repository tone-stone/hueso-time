# Hueso Time

App web y móvil para bandas de covers: repertorio, BPM, tonalidad, género y setlists en bloques de ~45 min.

## Stack

- Expo + React Native (iOS, Android, Web)
- Expo Router
- Datos locales (AsyncStorage) con interfaz lista para API
- i18n: Español / English

## Correr

```bash
npm start
```

Luego `w` (web), `a` (Android) o `i` (iOS).

## Estructura útil

- `types/models.ts` — Song, Setlist, Set
- `data/repository.ts` — contrato de datos
- `data/localRepository.ts` — implementación local
- `context/AppContext.tsx` — estado de la app
- `i18n/` — traducciones
- `app/(tabs)/` — Repertorio, Setlists, Ajustes
- `app/setlist/[id].tsx` — armar sets

## Próximo paso (API)

Implementá el mismo contrato `DataRepository` contra tu backend y cambiá `repo` en `context/AppContext.tsx`.
