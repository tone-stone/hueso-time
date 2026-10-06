# Auditoría UI/UX de Hueso Time en Android

Fecha: 6 de octubre de 2026.

**Actualización:** se implementaron las correcciones descritas al final de este documento.
Los hallazgos siguientes describen el estado anterior a la implementación.

La app permite generar y consultar setlists, pero necesita corregir problemas
de interacción, mensajes de estado y adaptación a tablet antes de pulir el
aspecto visual. Los obstáculos principales son el botón Atrás en los modales,
el cronómetro al reanudar, los controles pequeños y las acciones que prometen
una operación diferente de la que ejecutan.

## Alcance y evidencia

- Revisión del código de Generar, Setlists, Repertorio, Ajustes, login, detalle,
  modo show, compartir, primitivas visuales y persistencia relacionada con la UI.
- Prueba del código actual en Expo Go, en un emulador Android, con login omitido
  únicamente en desarrollo y almacenamiento local. No equivale a probar el login
  Google ni todos los comportamientos del APK instalado en la tablet física.
- Tablet vertical: 1600 × 2560 px a 320 dpi, equivalente a 800 × 1280 dp.
- Tablet horizontal: 2560 × 1600 px a 320 dpi, equivalente a 1280 × 800 dp.
- Comprobación adicional de Generar a 360 × 800 dp.
- Se generó un setlist de prueba de 3 sets y 36 canciones, y se revisaron el
  detalle, su editor, las cuatro pestañas y la pausa del modo show.
- Las capturas de esta auditoría están en `artifacts/audit-*.png`. El botón
  flotante de engranaje pertenece a Expo Go y se excluye de los hallazgos.
- La captura anterior `artifacts/tablet-login.png` se considera referencia
  histórica; los hallazgos actuales de login se basan en el código.

P1: resolver en la próxima actualización por bloqueo, resultado engañoso o
dificultad importante de uso. P2: mejorar después para hacer la app más clara,
legible y cómoda. Las recomendaciones visuales son propuestas de diseño;
los fallos de comportamiento indicados tienen evidencia de código o ejecución.

## Hallazgos priorizados

| ID | Prioridad | Problema | Evidencia |
| --- | --- | --- | --- |
| UX-01 | P1 | Atrás no cierra varios modales de Android | Reproducido en Editar show; código |
| UX-02 | P1 | El cronómetro del show incluye el tiempo en pausa al reanudar | Reproducido; código |
| UX-03 | P1 | Acciones de canción con objetivos táctiles de 28 × 28 dp | Código |
| UX-04 | P1 | Guardar y eliminar comunican éxito sin verificar esa operación | Código |
| UX-05 | P1 | Compartir ofrece PDF que no funciona en Android; CSV se envía como texto | Código |
| UX-06 | P1 | Generar presenta opciones que no reflejan claramente su comportamiento | Código; pantalla revisada |
| UX-07 | P1 | El APK local carece de un flujo completo de respaldo y recuperación | Código y configuración de build |
| UX-08 | P2 | El diseño amplio se limita a web; Android tablet queda en una columna | Reproducido; código |
| UX-09 | P2 | La cabecera consume demasiado espacio y repite información | Reproducido; código |
| UX-10 | P2 | El resultado oculta todas las canciones y la biblioteca no tiene buscador | Reproducido; código |
| UX-11 | P2 | Modo show corta una etiqueta y tiene acciones implícitas | Reproducido; código |
| UX-12 | P2 | Faltan semántica accesible y explicaciones claras de cuenta y datos | Código; Ajustes revisado |

### UX-01 — Cerrar modales con Atrás

En Editar show, pulsar Atrás dejó el formulario abierto. La captura posterior
muestra la misma pantalla. También faltan `onRequestClose` en los modales de
artistas, géneros, canción, creación de setlist y varios editores del detalle.

Referencia: `app/setlist/[id].tsx:440`, `app/(tabs)/index.tsx:524`,
`app/(tabs)/setlists.tsx:493`. Compartir sí implementa el cierre solicitado.

Propuesta: centralizar un contenedor de modal con cierre Android, zona segura,
acción de cancelar y manejo de cambios sin guardar. No asumir que
`presentationStyle="pageSheet"` proporciona por sí solo una hoja en Android.

Aceptación: Atrás cierra cada modal o pide descartar cambios pendientes;
el teclado se cierra primero cuando corresponde; el usuario vuelve a la
pantalla anterior conservando su selección. Falta verificar teclado y cambios
pendientes durante la implementación.

[Antes de Atrás](../artifacts/audit-tablet-edit.png) ·
[Después de Atrás](../artifacts/audit-tablet-edit-after-back.png).

### UX-02 — Pausa del cronómetro

El modo show quedó pausado en 0:50. Al reanudar, el contador superior mostró
1:10, mientras el contador de canción mostró 0:51. El cálculo superior usa
`Date.now() - started.current`; la deducción de pausas solo se aplica a canción.
Además, el indicador de exceso de set usa la duración prevista acumulada de
canciones, no el tiempo real del set, por lo que necesita una etiqueta clara.

Referencia: `components/ShowModeView.tsx:98`, `:110`, `:176`.

Propuesta: definir si el cronómetro representa tiempo activo o tiempo de reloj
y mostrarlo explícitamente. Si se mantiene una única pausa para ambos,
descontar la pausa del contador del show y calcular el exceso con la misma
definición de tiempo.

Aceptación: pausar durante 20 segundos y reanudar no produce un salto de 20
segundos en un contador presentado como pausado; los dos contadores son
coherentes con sus etiquetas.

[Pausado en horizontal](../artifacts/audit-tablet-show-landscape.png) ·
[Reanudado](../artifacts/audit-tablet-show-resumed.png).

### UX-03 — Áreas táctiles

Reemplazar y quitar canción usan `iconBtn` de 28 × 28 dp sin ampliación de
área táctil. Hay otros controles compactos: chips con 3 dp de padding vertical,
filtros de 36 dp y segmentados compactos. Algunos iconos sí tienen `hitSlop`,
por lo que su tamaño visual por sí solo no demuestra un problema táctil.

Referencia: `components/SetsTables.tsx:233`, `:248`, `:370`;
`components/ui.tsx:784`; `app/(tabs)/index.tsx:836`.

Propuesta: asegurar áreas efectivas de al menos 48 × 48 dp, con separación
entre reemplazar y quitar; conservar iconos pequeños dentro de áreas mayores.

Aceptación: medir los objetivos efectivos, incluyendo `hitSlop`, y comprobar
que no se superponen ni activan acciones vecinas. Esta medida sigue la
[recomendación de Android](https://developer.android.com/guide/topics/ui/accessibility/apps).

### UX-04 — Guardado y confirmación de éxito

El botón Guardar de la barra inferior solo ejecuta `showToast`; no escribe
datos ni verifica una escritura. Las modificaciones de sets se persisten por
otras acciones. Esto mezcla guardado automático y manual. En la biblioteca,
el aviso de eliminación se muestra inmediatamente después de iniciar una
promesa, sin esperar que termine; el detalle también navega antes de terminar.
No se reprodujo un fallo de almacenamiento: el hallazgo es la secuencia de UI.

Referencia: `app/setlist/[id].tsx:432`, `:300`;
`app/(tabs)/setlists.tsx:154`; `context/AppContext.tsx:256`.

Propuesta: comunicar «Guardado automáticamente» con estados de guardando,
guardado y error, o introducir un borrador que Guardar confirme realmente.
Esperar las operaciones antes de mostrar éxito y permitir reintentar un fallo.

Aceptación: una escritura fallida nunca muestra confirmación de éxito; el
usuario entiende qué cambios se guardan al instante y cuáles requieren acción.

### UX-05 — Exportación en Android

El menú ofrece PDF en Android, pero su acción solo muestra el mensaje de
disponibilidad web. CSV se comparte como `message`, sin crear un archivo CSV;
una app receptora puede tratarlo como texto y no como documento.

Referencia: `components/ShareSetlistMenu.tsx:60`, `:70`, `:116`.

Propuesta: generar documentos nativos y compartir archivos con su tipo
correcto. Hasta implementarlo, explicar la disponibilidad antes de tocar la
opción. Diferenciar «Compartir texto», «Exportar CSV» y «Exportar PDF».

Aceptación: el destinatario recibe un archivo `.csv` o `.pdf` válido cuando
elige exportar; ninguna opción disponible termina en un callejón sin salida.

### UX-06 — Selección y expectativas de Generar

Las filas tienen chevron de navegación, pero tocar cada una cambia al siguiente
valor sin mostrar las opciones. Formato solo permite tres combinaciones fijas;
los valores predeterminados de Ajustes no se usan en esta pantalla. Fiesta y
Variada envían exactamente las mismas opciones al generador. Tranqui no
establece un límite de BPM ni un filtro de canciones tranquilas.

Referencia: `app/(tabs)/generate.tsx:50`, `:67`, `:100`, `:350`.

Propuesta: abrir selectores con todas las opciones, selección visible y una
breve explicación; usar los valores de Ajustes como punto de partida y permitir
formato personalizado. Renombrar opciones según lo que hace el generador o
definir comportamientos diferentes antes de prometerlos.

Aceptación: cada opción representa un comportamiento identificable; volver a
Generar respeta el formato elegido; cambiar los predeterminados tiene un efecto
predecible. No cambiar el algoritmo musical dentro de un ajuste puramente visual.

### UX-07 — Respaldo, recuperación y confianza en los datos

El perfil preview de Expo no activa la API y el repositorio se elige como local.
En Ajustes no existe una exportación completa de repertorio y setlists. La
exportación de respaldo del login solo aparece en el caso `nativeRequired`,
por ejemplo Expo Go; no constituye un flujo normal de respaldo para el APK.
`recoverBackupText` exige API habilitada. Además, el panel de catálogo sin
modificar ofrece recuperación sin comprobar API, si se cumple ese estado.
Ese estado concreto no se reprodujo en la prueba local.

Referencia: `eas.json:35`, `data/apiRepository.ts:132`,
`context/AppContext.tsx:149`, `app/login.tsx:207`,
`app/(tabs)/generate.tsx:288`, `app/(tabs)/settings.tsx:134`.

Propuesta: ofrecer exportar/importar respaldo desde Ajustes en modo local,
validando su contenido y mostrando un resumen antes de restaurar. Mostrar
«Guardado en esta tablet» como estado actual; iniciar sesión con Google no debe
dar a entender que hay sincronización si no está activa.

Aceptación: exportar repertorio y setlists, recuperarlos en una instalación de
prueba independiente y comprobar cantidades, orden, metadatos y ajustes; la UI
solo ofrece las recuperaciones que puede ejecutar.

### UX-08 — Aprovechamiento de la tablet

`useDesktopWeb()` exige plataforma web. Por ello, `PageColumn` no limita ancho
en Android y las tarjetas de Setlists siempre usan una sola columna. Se
observan formularios y tarjetas muy anchos. La navegación ocupa todo el ancho
en la captura, aunque el código intenta limitar la píldora a 480 dp: hay que
verificar su geometría efectiva con React Navigation.

Referencia: `components/ui.tsx:35`, `:97`;
`app/(tabs)/setlists.tsx:387`; `app/(tabs)/_layout.tsx:58`.

Propuesta: separar plataforma y tamaño de ventana. En tablet amplia, evaluar
lista de setlists a la izquierda y detalle a la derecha; en Repertorio, lista
y editor. Usar ancho máximo para formularios y una navegación dimensionada
para la ventana. La composición debe adaptarse también a pantalla dividida.

Aceptación: tablet vertical y horizontal aprovechan el ancho sin estirar
campos; teléfono conserva una columna; rotar no pierde selección ni borradores.
La propuesta sigue los
[layouts adaptables de Android](https://developer.android.com/develop/ui/views/layout/canonical-layouts).

[Generar](../artifacts/audit-tablet-generate.png) ·
[Setlists](../artifacts/audit-tablet-setlists.png) ·
[Repertorio](../artifacts/audit-tablet-repertoire.png).

### UX-09 — Jerarquía, espacio y legibilidad

El padding superior de una pantalla Android normal es como mínimo 140 dp:
`max(statusBarHeight, 64) + 20 + 56`. Después se muestran marca, subtítulo,
título y otra vez subtítulo. En 360 dp de ancho, la fila Formato queda detrás
de la navegación al abrir Generar y requiere desplazarse. No se comprobó que
sea inaccesible: el scroll tiene padding inferior.

Muchos metadatos son de 10–11.5 dp, lo que requiere comprobar lectura en una
tablet colocada en atril. El contraste de los tokens actuales ya se mejoró;
no hay evidencia suficiente para atribuir el problema principal al contraste.

Referencia: `components/ui.tsx:41`, `:153`, `:155`;
`app/(tabs)/generate.tsx:270`, `:455`; `components/ui.tsx:730`.

Propuesta: usar el inset real más una separación pequeña; mostrar la marca
una vez y un solo subtítulo; priorizar ajustes y CTA dentro de la primera
pantalla. Como punto inicial de diseño, evaluar cuerpo de 15–16 y metadatos
de 13–14, ajustando densidad con pruebas en el dispositivo.

Aceptación: no hay una franja superior vacía de 140 dp; los controles principales
son visibles en 360 × 800 dp; fuentes ampliadas no cortan acciones esenciales.

[Generar en teléfono](../artifacts/audit-phone-generate.png).

### UX-10 — Revisar y encontrar setlists

Después de generar, todos los sets aparecen plegados. El primer resultado
muestra contadores y duraciones, pero ninguna canción hasta tocar un set.
El detalle repite título y regreso en la barra nativa y en su cabecera interna.
La biblioteca cuenta con filtro de favoritos, pero no buscador por nombre o lugar.
Las eliminaciones ocupan una acción permanente en cada tarjeta.

Referencia: `app/setlist/[id].tsx:345`, `:359`, `:407`;
`app/(tabs)/setlists.tsx:82`, `:468`.

Propuesta: expandir el primer set del resultado, ofrecer expandir/plegar todos,
usar una sola cabecera y agregar búsqueda. Priorizar abrir/revisar/iniciar show;
evaluar mover eliminar al menú de acciones manteniendo su confirmación.

Aceptación: el usuario ve canciones al terminar de generar y localiza un show
entre muchas entradas sin recorrer toda la lista.

[Detalle inicial](../artifacts/audit-tablet-detail.png).

### UX-11 — Controles de modo show

«Anterior» se parte en dos líneas en vertical y horizontal por un ancho fijo
de 52 dp. Tocar la escena completa avanza de canción, pero la pantalla no
explica esa acción. Al llegar a la última, Siguiente se deshabilita sin un
estado explícito de show terminado. En la prueba, Atrás regresó a Generar,
en lugar de salir del modo show al editor como hace la X.

Referencia: `components/ShowModeView.tsx:252`, `:370`, `:539`;
`app/setlist/[id].tsx:327`.

Propuesta: dar ancho suficiente a Anterior o usar un icono con etiqueta
accesible; explicar el avance por toque y validar con músicos si conviene
mantenerlo. Hacer consistente salir mediante X y Atrás, y mostrar un cierre
claro al terminar. Mantener pantalla despierta y la jerarquía de canción/BPM.

Aceptación: etiquetas completas en es/en y fuente ampliada; salir devuelve al
editor; el músico sabe cómo avanzar y cuándo llegó al final.

[Modo show vertical](../artifacts/audit-tablet-show.png) ·
[Modo show horizontal](../artifacts/audit-tablet-show-landscape.png).

### UX-12 — Accesibilidad y explicaciones de cuenta y ajustes

PrimaryButton, GhostButton, Chip y Segmented carecen de roles y estados
explícitos; varios iconos de editar/reemplazar/quitar no tienen etiqueta.
Los toast duran aproximadamente 2 segundos y no tienen anuncio accesible.
El texto «Privacidad · Términos» del login es un Text sin acciones.

Ajustes explica modos técnicos de API/local en lugar de indicar el estado
actual. Sus campos numéricos persisten por cada pulsación y no admiten un
borrador vacío al borrar el último dígito. El progreso de importación usa
`songs.length`, que incluye canciones ajenas al catálogo, y mantiene el mismo
CTA aun mostrando 254/254. No se probaron cambios de valores en esta auditoría.

Referencia: `components/ui.tsx:343`, `:383`, `:430`, `:503`;
`components/Toast.tsx:34`; `app/login.tsx:234`;
`app/(tabs)/settings.tsx:84`, `:118`, `:134`.

Propuesta: incorporar roles, etiquetas, estados seleccionados/deshabilitados,
anuncios y foco al abrir/cerrar modales. Dar un borrador a campos numéricos y
validar al confirmar. Explicar almacenamiento/sincronización con lenguaje de
usuario, contar canciones del catálogo por coincidencia, y abrir documentos
reales de privacidad y términos desde el login.

Aceptación: TalkBack identifica acciones y selección sin depender de glifos;
el usuario puede reemplazar un número sin que el campo reponga el anterior;
el estado de importación y almacenamiento describe lo que ocurre realmente.

## Orden de mejora recomendado

1. Corregir Atrás, pausa del cronómetro y confirmaciones de persistencia
   (UX-01, UX-02, UX-04). Son cambios de comportamiento y requieren pruebas
   específicas; deben tratarse aparte del cambio de apariencia.
2. Revisar componentes base: tamaño táctil, roles, tipografía, zona segura,
   modales y estados de carga/error (UX-03, UX-09, UX-12).
3. Adaptar tablet y simplificar revisar/editar setlists (UX-08, UX-10, UX-11).
4. Alinear Generar con Ajustes y ofrecer selectores claros (UX-06).
5. Completar exportación y respaldo nativos (UX-05, UX-07), con pruebas reales
   de archivos y recuperación antes de sugerir reinstalaciones.

Conservar como base la paleta Nocturne, los cuatro destinos de navegación,
el buscador y agrupación por artista del Repertorio, el indicador de duración
por set, y el modo show con pantalla despierta. La mejora visual puede seguir
el handoff existente, adaptando su densidad a Android y sin dar por completos
los flujos solo porque coinciden con el mock.

## Validación necesaria después de implementar

- APK firmado por EAS, Google obligatorio, instalado como actualización con
  la misma firma. Esta auditoría no generó ni publicó un nuevo APK.
- Crear, revisar, reemplazar, reordenar y eliminar canciones en un setlist;
  cerrar y volver a abrir la app para comprobar persistencia.
- Errores de escritura/carga sin avisos de éxito y con reintento.
- Atrás y teclado en todos los modales; no perder borradores sin aviso.
- Pausa/reanudación y fin de show; verificar tiempos de canción y set.
- Exportar PDF/CSV reales y recuperar un respaldo en una instalación aparte.
- Tablet vertical/horizontal, pantalla dividida, teléfono de 360 dp,
  español/inglés, tamaño de fuente ampliado y TalkBack.
- Verificar que el último elemento y las acciones no quedan inaccesibles
  bajo la navegación. Ver contenido pasar detrás de la píldora durante scroll
  no demuestra por sí solo que el último elemento sea inaccesible.

## Fuentes de criterio

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), leído antes de esta auditoría.
- [Android: objetivos táctiles y accesibilidad](https://developer.android.com/guide/topics/ui/accessibility/apps).
- [Android: layouts para ventanas amplias](https://developer.android.com/develop/ui/views/layout/canonical-layouts).
- [React Native: Modal y onRequestClose](https://reactnative.dev/docs/modal).
- Referencia visual local: `design_handoff_hueso_time_redesign/PROMPT.txt`
  y `design_handoff_hueso_time_redesign/README.md`.

## Implementación de las mejoras — 1.0.1

| Hallazgo | Cambio implementado |
| --- | --- |
| UX-01 | Modal común con Atrás nativo, cierre de 48 dp, zona segura, teclado y ancho limitado en tablet. Confirmación de borradores en edición de canción y metadatos del show. |
| UX-02 | Tiempo activo independiente del tiempo transcurrido; pausa y reanudación coherentes en ambos cronómetros. |
| UX-03 | Botones principales, acciones del setlist, favoritos y navegación con objetivos táctiles de al menos 48 dp. |
| UX-04 | Operaciones esperadas antes de confirmar éxito, bloqueo de solicitudes duplicadas, errores y reintento; el detalle muestra guardado automático real. |
| UX-05 | PDF nativo leído por Android y CSV como archivo adjunto; controles de carga/error. |
| UX-06 | Selectores explícitos de repertorio, orden y formato. Formato inicial vinculado a Ajustes; opciones de orden con comportamiento y explicación distintos. |
| UX-07 | Respaldo JSON completo y versionado, validación de referencias y metadatos, selector de archivo y confirmación antes de reemplazar datos locales. |
| UX-08 | Distribución de tablet en Android: generador en dos columnas, biblioteca en cuadrícula y formularios con ancho acotado. Rotación habilitada. |
| UX-09 | Encabezados compactos, menos decoración repetida, textos más legibles y navegación centrada. |
| UX-10 | Sets expandidos inicialmente, expandir/plegar todos y búsqueda por nombre o lugar en biblioteca. |
| UX-11 | Anterior legible, indicación de avance, finalización explícita y Atrás vuelve al editor. |
| UX-12 | Roles, estados y etiquetas; anuncios de toast; borradores numéricos en Ajustes; información de privacidad/términos disponible. Reordenamiento con acciones accesibles y respeto de movimiento reducido en el pulso del show. |

La prueba de arrastre encontró dos incompatibilidades con React Native 0.86:
la medición de listas requiere una referencia nativa, y al terminar el arrastre
la transformación de la fila debe restablecerse a un array vacío. Se corrigieron
ambas y se guardó el parche reproducible de la dependencia para EAS.

### Comprobaciones realizadas

- `npm.cmd run ci`: tipos de frontend/backend y **66 pruebas en 17 archivos**.
- `npx.cmd expo install --check`: dependencias compatibles con Expo SDK 57.
- `npx.cmd patch-package --error-on-fail`: parche aplicado correctamente.
- Expo Go en Android: generar y abrir setlists; reordenar canciones, volver a abrir
  y comprobar el orden; Atrás cierra compartir y regresa del show al editor.
- Pausa real: cronómetro del show y de canción permanecen en **0:21** durante
  dos lecturas separadas; pruebas deterministas de pausa, reanudación y cambio
  de canción en `lib/activeClock.test.ts`.
- PDF: selector nativo y vista previa Android de dos páginas, con canciones
  y orden completos. CSV: selector nativo con archivo `3_sets_45_min.csv`.
- Pantallas: tablet vertical 800 × 1280 dp, horizontal 1280 × 800 dp y teléfono
  360 × 800 dp. Evidencia nueva en `artifacts/uiux-*.png`.
- Respaldo: restauración en almacenamiento simulado vacío, conservando canciones,
  notas, favoritos, ajustes y orden del show; formatos nuevo y anterior; rechazo de
  JSON/versión incorrectos, IDs duplicados, referencias inexistentes y metadatos inválidos.

### Límites de la verificación

La tablet física no está conectada. El login real de Google y la actualización
instalada de 1.0.1 deben comprobarse allí. TalkBack completo, pantalla dividida y
restauración en una instalación aparte siguen pendientes.
En pantalla de 360 dp con fuente al 130%, la etiqueta de navegación usa
«Música» y conserva «Repertorio» como etiqueta accesible completa.

La revisión automática bloqueó la prueba de abrir el selector de compartir del
respaldo completo por posible contenido privado sin destino autorizado; se
solicitó autorización para probarla sin enviar el archivo. Esto no afecta la
implementación ni las pruebas automáticas del formato.

## Entrega Android

Build final de Expo: Hueso Time 1.0.1, `versionCode` 4 y keystore existente.
[Ver build](https://expo.dev/accounts/tonestone/projects/hueso-time/builds/c8f153a7-da71-40d5-afcc-45be162a24f1).

La guía de instalación y actualización está en `docs/APK_TABLET.md`.
