# Instalar Hueso Time en una tablet

El APK está en `artifacts/Hueso-Time-1.0.0-tablet.apk` después de ejecutar:

```powershell
npm.cmd run build:apk
```

Incluye la aplicación y el catálogo; no necesita Expo Go ni Metro.
Requiere Android 7 o posterior y Google Play Services para iniciar sesión.
Incluye ARM64, ARM de 32 bits y x86_64. Exige una cuenta Gmail; los setlists
se guardan en el almacenamiento local de la tablet. Esta compilación no activa
la API remota ni las actualizaciones OTA. Es un APK local firmado con la firma
de desarrollo del proyecto para instalación directa.

1. Copia el APK a la tablet por USB, Drive u otro medio.
2. Abre el archivo desde Archivos y permite instalar aplicaciones desde esa
   fuente cuando Android lo solicite.
3. Instala y abre **Hueso Time**. Con conexión a Internet, toca **Continuar con Google**.

## Registrar la firma para Google

En el mismo proyecto de Google Cloud que contiene el cliente Web configurado,
crea o verifica un cliente OAuth de tipo **Android** con:

- Package: `com.tonestone.huesotime`
- SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

Si la pantalla de consentimiento está en Testing, agrega tu Gmail como usuario
de prueba. No elimines los clientes Android existentes para EAS o Play Store;
esta firma local puede necesitar su propio cliente Android.

El cliente Web usado por este APK es:
`785682234203-9vtfndcqiml95it6427903fivpf2kd4i.apps.googleusercontent.com`.

Un error **DEVELOPER_ERROR / 10** normalmente indica que la firma o package no
coincide con el cliente Android registrado. La configuración de Google Cloud
debe completarse desde la cuenta propietaria; no se ha validado aquí con una
cuenta Google real.

Guía oficial: https://react-native-google-signin.github.io/docs/setting-up/get-config-file

Los datos de Expo Go no se transfieren automáticamente al APK. Conserva un
respaldo de las canciones y setlists antes de cambiar de instalación.
