# Hueso Time API

Backend CRUD para la app (canciones, setlists, settings).

## Correr

```bash
cd backend
npm install
npm run seed    # opcional: 3 canciones de ejemplo
npm run dev     # http://localhost:8787
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Healthcheck |
| GET | `/v1/data` | Dump completo (sync inicial) |
| PUT | `/v1/data` | Reemplazar dump completo |
| GET | `/v1/songs` | Listar (`?q=&artist=&genre=&key=&bpmMin=&bpmMax=`) |
| GET | `/v1/songs/:id` | Obtener |
| POST | `/v1/songs` | Crear |
| PUT | `/v1/songs/:id` | Actualizar |
| DELETE | `/v1/songs/:id` | Eliminar |
| GET | `/v1/setlists` | Listar |
| GET | `/v1/setlists/:id` | Obtener |
| POST | `/v1/setlists` | Crear |
| PUT | `/v1/setlists/:id` | Actualizar |
| DELETE | `/v1/setlists/:id` | Eliminar |
| GET | `/v1/settings` | Leer ajustes |
| PATCH | `/v1/settings` | Actualizar ajustes |

## Ejemplo

```bash
curl http://localhost:8787/v1/songs
curl -X POST http://localhost:8787/v1/songs -H "Content-Type: application/json" -d "{\"title\":\"Matador\",\"artist\":\"Los Fabulosos Cadillacs\",\"bpm\":130,\"key\":\"A\",\"keyMode\":\"minor\",\"genre\":\"rock\",\"durationSec\":240}"
```

## Persistencia

Por ahora guarda en `backend/data/db.json` (archivo local).  
Después se puede cambiar `store.ts` por Postgres/Supabase sin tocar las rutas.

## Conectar la app Expo

En la raíz del proyecto (o `.env`):

```
EXPO_PUBLIC_API_URL=http://localhost:8787
EXPO_PUBLIC_USE_API=1
```

La app usa `apiRepository` cuando `EXPO_PUBLIC_USE_API=1`.
