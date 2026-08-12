# Google Auth para producción (Hueso Time)

La app usa:
- **Build nativo (EAS / APK / AAB / iOS):** `@react-native-google-signin/google-signin`
- **Web / Expo Go:** `expo-auth-session` (fallback)

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
  - `http://localhost:8082`
- Authorized redirect URIs:
  - `https://auth.expo.io/@tonestone/hueso-time`
  - `huesotime://oauth`
  - Tu dominio de web prod si publicás web (ej. `https://tu-dominio.com`)
- Copiá el **Client ID** → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

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
| Access blocked / redirect_uri | URIs del cliente **Web** |
| Developer error / DEVELOPER_ERROR | SHA-1 del keystore ≠ el de Google Console |
| No idToken | Falta `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` en el build |
| Solo Gmail | Esperado: la app rechaza no-gmail |
| Expo Go | Usá build EAS; en Go solo funciona el flujo web limitado |

---

## 7. Flujo en código

- `lib/googleNativeSignIn.ts` — Sign-In nativo (Android/iOS build)
- `app/login.tsx` — elige nativo vs browser
- `lib/googleAuth.ts` — decode JWT + solo `@gmail.com`
- `context/AuthContext.tsx` — sesión + rechazo de token vencido
