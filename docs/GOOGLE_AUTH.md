# Google Auth para producción (Hueso Time)

La app usa:
- **Build nativo (EAS / APK / AAB / iOS):** `@react-native-google-signin/google-signin`
- **Web:** `expo-auth-session`. Expo Go no admite el login Google de esta app.

Package Android/iOS: `com.tonestone.huesotime`  
Scheme: `huesotime`  
Cuenta Expo: `@tonestone` · proyecto `hueso-time`

---

## 1. Google Cloud Console

1. Entrá a [Credentials](https://console.cloud.google.com/apis/credentials).
2. Configurá la **pantalla de consentimiento OAuth** (External o Internal).
   - Scopes: `email`, `profile`, `openid`.
   - Usuarios de prueba mientras esté en Testing.
3. Creá **3 clientes OAuth**:

### A) Web application (obligatorio)
- Tipo: **Web application**
- Nombre: `Hueso Time Web`
- Authorized JavaScript origins (web local):
  - `http://localhost:8081`
  - `http://127.0.0.1:8081`
- Authorized redirect URIs (tienen que coincidir **exacto** con lo que imprime la app):
  - `http://localhost:8081/oauth`
  - `http://127.0.0.1:8081/oauth`
  - Tu dominio de web prod si publicás web (ej. `https://tu-dominio.com/oauth`)
- En desarrollo web, la consola del navegador muestra `[Google OAuth] redirectUri = …` — agregá esa URI si no está.
- Copiá el **Client ID** → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

> Nota: el scheme nativo `huesotime://oauth` **no** va en el cliente Web. En builds nativos usamos Google Sign-In nativo (clientes iOS/Android).

### B) Android
- Tipo: **Android**
- Package name: `com.tonestone.huesotime`
- SHA-1: el de tu keystore EAS (ver §2)
- Copiá el Client ID → `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

### C) iOS
- Tipo: **iOS**
- Bundle ID: `com.tonestone.huesotime`
- Copiá el Client ID → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`  
  (el scheme `com.googleusercontent.apps.XXXX` se deriva solo en `app.config.js`)

---

## 2. Obtener SHA-1 (Android)

En la terminal del proyecto:

```bash
npx eas credentials -p android
```

Elegí el perfil **production** (o preview) → **Keystore** → copiá el **SHA-1 fingerprint**.

También sirve después de un build:

```bash
npx eas build:list -p android
```

Si subís a Play Store, agregá **también** el SHA-1 de **App signing key** (Play Console → App integrity).

---

## 3. Variables locales (`.env`)

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=yyyyy.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=zzzzz.apps.googleusercontent.com

# Producción / preview EAS ya fuerza 0 en eas.json
# En local podés dejar 1 para probar sin login
EXPO_PUBLIC_SKIP_AUTH=0
```

Reiniciá Metro con cache limpia: `npx expo start -c`

---

## 4. Secrets en EAS (para builds de producción)

```bash
npx eas env:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "xxxxx.apps.googleusercontent.com" --environment production --visibility plaintext
npx eas env:create --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "yyyyy.apps.googleusercontent.com" --environment production --visibility plaintext
npx eas env:create --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "zzzzz.apps.googleusercontent.com" --environment production --visibility plaintext
npx eas env:create --name EXPO_PUBLIC_SKIP_AUTH --value "0" --environment production --visibility plaintext
```

Repetí para `--environment preview` si querés lo mismo en APK de prueba.

---

## 5. Build de producción

**Importante:** Google Sign-In nativo **no funciona en Expo Go**. Necesitás un development build o production build.

```bash
# APK interno para probar login
npx eas build -p android --profile preview

# AAB para Play Store
npx eas build -p android --profile production

# iOS (requiere Apple Developer)
npx eas build -p ios --profile production
```

---

## 6. Checklist si falla el login

| Error | Qué revisar |
|-------|-------------|
| Access blocked / redirect_uri_mismatch | En el cliente **Web**: agregá exactamente `http://localhost:8081/oauth` (y el origin `http://localhost:8081`). Mirá el log `[Google OAuth] redirectUri`. |
| Developer error / DEVELOPER_ERROR / code 10 | SHA-1 del keystore EAS ≠ el del cliente Android en Google Console (package `com.tonestone.huesotime`) |
| Popup se queda en “Completando…” | La ruta `/oauth` debe existir (sí en esta app) y no ser redirigida al login |
| No idToken | Falta `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` en el build |
| Solo Gmail | Esperado: la app rechaza no-gmail |
| Expo Go / invalid_request | Exportá primero el respaldo guardado desde la pantalla de ingreso y abrí el APK de Hueso Time; Google no admite el redirect exp:// de Expo Go. |

---

## 7. Flujo en código

- `lib/googleNativeSignIn.ts` — Sign-In nativo (Android/iOS build)
- `app/login.tsx` — elige nativo vs browser
- `lib/googleAuth.ts` — decode JWT + solo `@gmail.com`
- `context/AuthContext.tsx` — sesión + rechazo de token vencido

## Recuperar el repertorio al activar la API

Cada cuenta API nueva recibe la lista original del Excel con 254 canciones. La conexión Spotify permite buscar canciones adicionales; el repertorio precargado funciona sin esa conexión. El almacenamiento anterior del dispositivo se conserva.

En **Generar**, una cuenta vacía o con el catálogo inicial sin modificar ofrece **Recuperar datos de este dispositivo** si encuentra canciones o setlists locales. La copia se valida y se restaura con control de versión en la cuenta autenticada; un repertorio editado no se reemplaza.

Expo Go y el APK pueden tener almacenamientos separados. En la pantalla de ingreso de Expo Go, **Exportar respaldo guardado** comparte el texto original del respaldo. Conservá ese texto. Después de entrar en el APK, usá **Generar → Recuperar desde un respaldo** y pegalo. El respaldo contiene canciones, setlists y ajustes; no contiene el token de Google.

Si vaciaste el repertorio y querés volver a cargar esa lista, **Importar catálogo musical** la agrega de forma explícita. Reiniciar la app no repuebla un repertorio guardado vacío.
