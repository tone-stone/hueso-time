# Hueso Time API

Backend CRUD para la app (canciones, setlists, settings).

## Correr con Expo (recomendado)

Desde la raíz: `npm start`. Inicia ambos servicios y publica Expo, `/health` y `/v1/*` en el puerto **8081**. La API escucha internamente en `127.0.0.1:8787`; el teléfono usa la dirección de Expo. El cliente conserva los encabezados Authorization, If-Match y ETag a través del proxy. `Ctrl+C` detiene los dos procesos.

## Correr solo el backend

```bash
cd backend
npm install
npm run typecheck # verificar backend
npm run dev     # http://localhost:8787
```

## Autenticación y cuentas

Configurá `GOOGLE_CLIENT_IDS` en `backend/.env` con los IDs OAuth permitidos, separados por comas. El servidor verifica firma, audiencia, issuer, expiración y Gmail verificado con la biblioteca oficial de Google. Sin esta configuración, las rutas de datos responden 503; sin token válido, 401. `EXPO_PUBLIC_SKIP_AUTH` solo habilita el modo local del cliente y no omite la autenticación de la API.

Todas las rutas de datos requieren `Authorization: Bearer <Google ID token>`. El cliente envía el token guardado. Cada cuenta se identifica con el `sub` verificado y tiene su repertorio propio; no hay colaboración entre cuentas/bandas por ahora. El archivo antiguo `backend/data/db.json` se conserva para migración manual y no se entrega automáticamente a ninguna cuenta.

Las cuentas sin archivo propio reciben la lista original precargada de **254 canciones** del Excel. Al guardar cambios, el archivo de esa cuenta tiene prioridad. Un repertorio guardado vacío permanece vacío al reiniciar. La precarga conserva títulos, artistas, BPM, tonalidades, duraciones y notas; funciona sin Spotify. El catálogo del backend se sincroniza desde `data/seedBarraLibre.ts` con `node scripts/syncRepertoireCatalog.cjs`, y las pruebas comprueban que ambos coincidan.

## Concurrencia e importación

GET devuelve un `ETag`. Todas las mutaciones requieren `If-Match` con ese valor; la respuesta devuelve la versión nueva. Falta de versión: 428. Conflicto: 409; recargá antes de volver a editar. Los reemplazos completos se reservan para restauración y los reemplazos de colecciones para importación. Se validan campos, identificadores únicos y referencias antes de escribir.

Ejecutá **un solo proceso** del servidor por directorio de datos. El control de versiones y la escritura síncrona serializan operaciones en ese proceso; para múltiples réplicas hace falta una base transaccional. No uses un disco efímero en producción.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Healthcheck |
| GET | `/v1/data` | Dump completo (sync inicial) |
| PUT | `/v1/data` | Restaurar dump validado con If-Match |
| POST | `/v1/data/recover` | Recuperar respaldo validado en una cuenta vacía o sobre el catálogo inicial sin modificar, con If-Match |
| PUT | `/v1/songs` | Reemplazar colección validada con If-Match |
| PUT | `/v1/setlists` | Reemplazar colección validada con If-Match |
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
curl http://localhost:8787/v1/data -H "Authorization: Bearer $GOOGLE_ID_TOKEN" -i
# Para guardar, agregar If-Match con el ETag recibido.
```

## Persistencia

Guarda en `backend/data/accounts/<hash-del-sub>.json` (o `DATA_DIR/accounts/` si se configura). Escribe un temporal, sincroniza y lo reemplaza con rename; conserva la versión anterior en `.bak`. Un archivo ilegible o corrupto produce error y nunca se reemplaza silenciosamente por datos vacíos. Para recuperar: detener el servidor, conservar el archivo dañado y restaurar el `.bak` tras revisarlo. Respaldá también fuera de ese disco. El comando `seed` es mantenimiento del archivo legacy, no inicializa las cuentas HTTP.
Después se puede cambiar `store.ts` por Postgres/Supabase sin tocar las rutas.

## Conectar la app Expo

En la raíz del proyecto (o `.env`):

```
EXPO_PUBLIC_API_URL=http://localhost:8787
EXPO_PUBLIC_USE_API=1
```

La app usa `apiRepository` cuando `EXPO_PUBLIC_USE_API=1`.
