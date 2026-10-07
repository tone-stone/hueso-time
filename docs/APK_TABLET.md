# Instalar Hueso Time en una tablet

## Diseño anterior restaurado: Hueso Time 1.0.2

La versión 1.0.2 recupera el diseño anterior: botón circular animado, marca,
tipografía, espaciados, navegación, biblioteca en lista, sets plegados y menú
de compartir con filas. Conserva Google obligatorio, la pausa corregida del
show, el guardado real, el manejo de errores y las exportaciones PDF/CSV.
Los respaldos siguen disponibles en Ajustes.

El APK está terminado y verificado:

- [Descargar APK 1.0.2](https://expo.dev/artifacts/eas/T8FxfttXOPEn3vrmEamd238b1R0KTg9HFqsHTVyZEdM.apk).
- [Ver build 1.0.2](https://expo.dev/accounts/tonestone/projects/hueso-time/builds/52227770-d3c8-451d-bdc1-f231faf4fc79).
- Copia local: `artifacts/Hueso-Time-1.0.2-expo.apk` (104.408.853 bytes).
- SHA-256: `bd8712118c704565406c6a6e8a90212cb5e4035959de56af0a39778f43cc7099`.
- Firma SHA-1, idéntica a la de los APK anteriores de Expo:
  `9B:7F:83:6A:A6:F2:7B:FE:26:EE:58:35:CD:93:EB:68:1B:24:40:DB`.

Se verificaron criptográficamente la firma, el paquete
`com.tonestone.huesotime`, la versión 1.0.2 y `versionCode` 5. Admite Android 7
o posterior y las arquitecturas ARM64, ARM de 32 bits, x86 y x86_64. Usa el
mismo keystore EAS de las versiones anteriores. El acceso Google y la
instalación en la tablet física deben comprobarse allí.

Instálalo encima del APK anterior de Expo y elige **Actualizar** para conservar
tus canciones y setlists.

## Actualización de UI/UX: Hueso Time 1.0.1

El APK actualizado está terminado y verificado:

- [Descargar APK 1.0.1](https://expo.dev/artifacts/eas/uX6SuMXJisrrZMj_IbgdTWNGO6HVFUiBm-VpmLSAM-c.apk).
- [Ver compilación terminada](https://expo.dev/accounts/tonestone/projects/hueso-time/builds/c8f153a7-da71-40d5-afcc-45be162a24f1).
- Copia local: `artifacts/Hueso-Time-1.0.1-expo.apk`.
- SHA-256: `84d21fb67ae3abdb293512bb89d1fa59dddba0096e40cae858590b90b715e8ba`.
- Firma SHA-1, idéntica a la del APK 1.0.0 de Expo:
  `9B:7F:83:6A:A6:F2:7B:FE:26:EE:58:35:CD:93:EB:68:1B:24:40:DB`.

Se verificaron criptográficamente la firma, el paquete, la versión 1.0.1 y
`versionCode` 4. Admite Android 7 o posterior y las arquitecturas ARM64, ARM de
32 bits, x86 y x86_64. La actualización y el acceso Google en la tablet física
deben comprobarse allí.

Mantiene el paquete `com.tonestone.huesotime`, el inicio de sesión obligatorio
con Google y el mismo keystore de Expo. Su `versionCode` es 4.
Si tienes instalada la versión anterior de Expo, instala esta encima y elige
**Actualizar**. No desinstales: la actualización con la misma firma conserva
los datos locales. El APK local con firma de desarrollo tiene otra firma.

Incluye navegación y formularios adaptados a tablet, controles más grandes,
búsqueda de setlists, pausa corregida del show, PDF/CSV nativos y respaldo JSON
completo desde **Ajustes > Respaldo y datos**. Guarda el respaldo fuera de la
tablet antes de cualquier desinstalación o cambio de dispositivo.

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

### APK anterior: 1.0.0 generado y verificado en Expo

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
