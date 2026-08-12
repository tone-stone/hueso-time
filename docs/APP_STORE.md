# Publicar Hueso Time en App Store

Checklist práctico para subir la app iOS con EAS.

## Requisitos previos

1. **Apple Developer Program** activo (~99 USD/año): https://developer.apple.com/programs/
2. Cuenta Expo logueada: `npx eas login`
3. Proyecto EAS ya vinculado (`projectId` en `app.json`)
4. IDs de Google OAuth (Web + iOS + Android) configurados — ver `docs/GOOGLE_AUTH.md`
5. **URL pública de privacidad** (obligatoria). Usá `docs/PRIVACY_POLICY.md` como borrador y publicala (GitHub Pages / tu dominio)

## Config ya incluida en el repo

- Bundle ID: `com.tonestone.huesotime`
- `ITSAppUsesNonExemptEncryption: false` (solo HTTPS estándar)
- Privacy Manifest (`privacyManifests`) para APIs requeridas por Apple
- Declaración de datos: email / nombre / user id (login Google), sin tracking
- Perfil EAS `production` con `autoIncrement` y clients de Google
- Tests unitarios: `npm test`
- CI: `.github/workflows/ci.yml`

## Antes del primer build

Completá en `eas.json` → `submit.production.ios` (o usá prompts interactivos):

- `appleId`: tu Apple ID
- `ascAppId`: App Store Connect App ID (numérico, se crea al registrar la app)
- `appleTeamId`: Team ID de developer.apple.com

Creá la app en [App Store Connect](https://appstoreconnect.apple.com):

1. New App → iOS
2. Bundle ID: `com.tonestone.huesotime`
3. Nombre: Hueso Time
4. Privacy Policy URL: tu URL pública
5. Categoría sugerida: Music / Utilities

## Comandos

```bash
# 1) Tests + typecheck
npm run ci

# 2) Build de producción iOS (en la nube EAS)
npx eas build --platform ios --profile production

# 3) Enviar a App Store Connect / TestFlight
npx eas submit --platform ios --profile production --latest
```

Para probar login Google en dispositivo real antes de review:

```bash
npx eas build --platform ios --profile preview
```

## Metadata que Apple va a pedir

En App Store Connect cargá:

| Campo | Sugerencia |
|-------|------------|
| Descripción | App para bandas de covers: repertorio, BPM, tonalidad y setlists en bloques |
| Keywords | setlist, covers, banda, bpm, ensayo, show |
| Soporte URL | página o email mailto / sitio |
| Privacy Policy URL | URL pública de `PRIVACY_POLICY.md` |
| Screenshots iPhone 6.7" / 6.5" | captura real de Repertorio, Setlists, Modo show |
| Age rating | sin contenido restringido típico |
| Login demo | cuenta Gmail de prueba + notas del reviewer |

### Notas para App Review

Incluí en “Review Notes”:

- La app requiere login con **cuenta @gmail.com**
- Usuario de prueba: (creá uno y agregalo como tester en Google Cloud OAuth si la app está en Testing)
- Flujo: Login → Setlists → abrir setlist → Modo show

## Privacy nutrition labels (App Store Connect)

Declarar:

- Contact Info → Email Address → App Functionality (linked to user, not used for tracking)
- Name → App Functionality
- User ID → App Functionality
- Data Not Collected for tracking / no third-party advertising

## Si Apple rechaza

| Motivo | Qué hacer |
|--------|-----------|
| Missing Privacy Manifest reason codes | Apple manda email con códigos → agregalos a `app.json` → `ios.privacyManifests` |
| Login incompleto | Dar cuenta demo Gmail y pasos claros |
| Falta privacy URL | Publicar `docs/PRIVACY_POLICY.md` |
| Crash en iPad | Probar tablet o poner `"supportsTablet": false` temporalmente |
| Encryption questionnaire | Ya está `usesNonExemptEncryption: false` |

## Verificación local rápida

```bash
npm run ci
npx expo-doctor
npx expo config --type public
```
