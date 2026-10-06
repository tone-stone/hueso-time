# Instalar Hueso Time en una tablet

## Generar el APK con Expo (EAS Build)

El perfil `preview` de `eas.json` ya genera un APK instalable con Google obligatorio.
Desde la carpeta del proyecto ejecuta:

```powershell
npx.cmd eas-cli build --platform android --profile preview
```

EAS compila en los servidores de Expo y entrega un enlace para descargar e
instalar el APK en la tablet. Usa el keystore existente de este proyecto cuando
EAS pregunte por las credenciales de firma.

El APK de EAS usa la firma administrada por EAS. Para Google, verifica el SHA-1
de esa firma con `npx.cmd eas-cli credentials --platform android`. La huella de
la sección siguiente corresponde solamente al APK compilado localmente.

Guía oficial: https://docs.expo.dev/build-reference/apk/

### APK generado y verificado en Expo

- [Descargar APK de Expo](https://expo.dev/artifacts/eas/yssY26I7sOoH9SbXc1CspffNMPxnQE5ra2PEn2VpaVA.apk)
- [Ver build terminado](https://expo.dev/accounts/tonestone/projects/hueso-time/builds/4e5c3009-9af3-4c35-8dad-04a7e0bb11fe)
- Copia local: `artifacts/Hueso-Time-1.0.0-expo.apk`.
- SHA-1 de la firma EAS de este APK:
  `9B:7F:83:6A:A6:F2:7B:FE:26:EE:58:35:CD:93:EB:68:1B:24:40:DB`.

Para Google, el cliente Android del mismo proyecto que el cliente Web debe
usar `com.tonestone.huesotime` y esa huella EAS. La firma del APK local que
aparece abajo es diferente. Se verificaron la firma y el paquete del APK
de Expo; el acceso con una cuenta Google real aún no se ha probado.

## Error: no se instaló por un conflicto con un paquete

El APK local y el APK de Expo usan `com.tonestone.huesotime`, pero tienen
firmas distintas. Se reprodujo el error `INSTALL_FAILED_UPDATE_INCOMPATIBLE`
al intentar instalar el APK de Expo sobre el local en el emulador. Android
requiere una firma compatible para actualizar una aplicación existente.

Si tienes instalado el APK local y no necesitas conservar sus datos:

1. En la tablet, abre **Ajustes > Aplicaciones > Hueso Time > Desinstalar**.
2. Instala el APK de Expo enlazado arriba.
3. Para futuras actualizaciones, usa builds de Expo con el mismo keystore EAS.

**Desinstalar borra las canciones y setlists almacenados localmente.** Si
necesitas conservarlos, no desinstales todavía: hay que preparar una migración
o una actualización firmada con la misma clave que la app instalada.

Si Hueso Time no aparece instalada, revisa también los otros usuarios y el
perfil de trabajo de la tablet antes de eliminar nada.

Referencia: https://developer.android.com/studio/publish/app-signing

## Generar el APK local

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

## Registrar la firma del APK local para Google

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
