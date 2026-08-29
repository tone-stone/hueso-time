# Handoff: rediseño visual de Hueso Time (Expo / React Native, es + en)

## Overview

Rediseño visual completo de Hueso Time sobre el design system **Nocturne**: ground azul-grisáceo oscuro, un solo acento blurple usado como línea y glow (nunca como relleno), Inter en peso 500, radios de 8 px, densidad 0.70×, botones **delineados** (nunca sólidos).

Cubre 7 grupos de pantallas: generar, setlist generado, biblioteca de setlists, ajustes, compartir, modo show, login, repertorio, editor de canción, agregar canción al set, reordenar arrastrando, fuentes de datos, y el layout de escritorio web.

**No hay cambios de lógica.** Ninguna función se elimina ni se agrega. Todo el generador (`lib/randomSets.ts`, `lib/setEnergy.ts`, `lib/setMath.ts`), el repositorio, el auth y el i18n siguen exactamente como están. Lo que cambia son estilos, jerarquía visual y dos decisiones de estructura de navegación (ver "Cambios de estructura").

## About the Design Files

Los archivos de este bundle son **referencias de diseño hechas en HTML** — prototipos que muestran el aspecto y el comportamiento buscados, no código de producción para copiar. La tarea es **recrear estos diseños en el codebase existente** (Expo Router + React Native + `components/ui.tsx`), usando sus patrones ya establecidos: `Screen`, `PageColumn`, `PageHeader`, `Card`, `Field`, `Chip`, `PrimaryButton`, `GhostButton`, `GlassSurface`, `useThemeColors`, `useDesktopWeb`, `showToast`, `confirmDestructive`, `useTranslation`.

Concretamente: **no** portar HTML a `dangerouslySetInnerHTML` ni introducir CSS; traducir cada valor a `StyleSheet` y a los tokens de `constants/Colors.ts`.

## Fidelity

**Alta fidelidad.** Colores, tipografía, espaciado e interacciones son definitivos. Reproducir los valores exactos que están más abajo.

## Cambio de paleta (decisión a confirmar)

Los mocks usan la paleta Nocturne, **no** el magenta/cian actual de `constants/Colors.ts`. Dos caminos válidos:

1. **Adoptar Nocturne** — reemplazar los valores de `Colors.dark` por la tabla de tokens de abajo. Es un cambio de un archivo; todo lo que consume `useThemeColors()` se actualiza solo.
2. **Mantener la marca actual** — implementar la estructura y la jerarquía de estos mocks pero conservando `c.tint` / `c.accent` existentes. Los mocks siguen siendo válidos como referencia de layout.

Si no hay una decisión explícita, preguntar antes de tocar `Colors.ts`.

## Design Tokens

### Color (Nocturne, tema oscuro)

| Rol | Hex | Uso |
| --- | --- | --- |
| `bg` | `#161826` | Fondo de pantalla |
| `bg` modo show | `#12141f` | Solo `ShowModeView`, para no rebotar luz en escenario |
| `bg` telón de hoja | `#0f111c` | Detrás de bottom sheets y modales |
| `surface` | `#232532` | Cards, filas de lista, inputs |
| `surface` elevada | `#2a2c3b` | Hover de fila, tag neutral |
| `surface` acento | `#2b2741` | Tag de acento, tab activa, toast |
| `divider` | `#3f424d` | Bordes de 1 px, `box-shadow: 0 0 0 1px` |
| `divider` hover | `#595d6c` | Borde en hover |
| `text` | `#e9e9ed` | Texto principal |
| `text` muted | `rgba(233,233,237,.55)` | Subtítulos |
| `text` faint | `rgba(233,233,237,.4)` | Kickers, metadatos |
| `accent` | `#9184d9` | Bordes, íconos, botones delineados |
| `accent-100` | `#e7e5fe` | Texto sobre relleno de acento |
| `accent-200` | `#d2cefd` | Texto de acento sobre fondo oscuro |
| `accent-300` | `#b5abfc` | Enlaces, texto de acento a tamaño de párrafo |
| tinte de acento | `rgba(145,132,217,.10)` | Fondo de banner informativo |
| tinte de acento fuerte | `rgba(145,132,217,.28)` | Pastilla de tab activa |

Regla de Nocturne: el acento no se usa como relleno de áreas grandes. Nunca negro ni blanco puros.

### Espaciado y forma

- Escala 0.70×: 4 / 6 / 8 / 10 / 12 / 14 / 16 / 20 / 22 / 26 px.
- Padding horizontal de pantalla: **22 px** (móvil), **28 px** (escritorio, dentro de `PageColumn maxWidth 920`).
- Radios: **6 px** tags, **8 px** cards / inputs / botones, **12 px** modal y card destacada, **999 px** píldoras.
- Elevación: en fondo oscuro es borde + oscuridad ambiental, no sombras apiladas. `0 0 0 1px #3f424d` para el borde; `0 14px 34px rgba(0,0,0,.55)` para la píldora flotante; `0 24px 60px rgba(0,0,0,.6)` para el modal.

### Tipografía

Inter (`FontFamily.display`) en todo. Pesos 500 y 600; **nunca** más de 500 en títulos.

| Rol | Tamaño / peso / tracking |
| --- | --- |
| Título de pantalla | 27 px / 500 / −0.02em |
| Título de escritorio | 32 px / 500 / −0.024em |
| Título de hoja o modal | 19 px / 500 / −0.02em |
| Título de fila | 13.5–14 px / 500 |
| Cuerpo | 13 px / 400, `line-height 1.55–1.6` |
| Sub de fila | 11.5 px / 400, muted |
| Kicker de sección | 10 px / 600 / 0.14em, mayúsculas, monoespaciada |
| Label de tag | 11 px / 400 / 0.02em |
| Números (BPM, duración, fechas) | monoespaciada del sistema |
| Modo show: título | 44 px / 500 / −0.03em, `line-height 1.03` |
| Modo show: BPM | 76 px / 500 / −0.04em |
| Marca en nav | 14 px / 600 / 0.11em, mayúsculas |
| Tagline de marca | 10 px / 600 / 0.12em, en acento |

Mínimo táctil: 44 pt. Los botones del modo show son de 48 pt.

## Componentes base (mapear a `components/ui.tsx`)

- **Botón primario** — 44–52 px de alto, radio 8, `border: 1px solid #9184d9`, texto en `#9184d9`, fondo transparente con `radial-gradient(120% 160% at 50% 130%, rgba(145,132,217,.18), transparent)`. Hover: `rgba(145,132,217,.14)`. **Nunca relleno sólido.**
- **Botón ghost** — sin borde, texto `rgba(233,233,237,.7)`, hover `rgba(233,233,237,.07)`.
- **Input** — `min-height 36`, padding `6px 10px`, radio 8, fondo `#232532`, borde `1px solid #3f424d`; foco: borde `#9184d9`.
- **Segmentado** — contenedor con borde `1px #3f424d` y radio 8, opciones de padding `7px 12px` / 13 px, separadas por `border-left`; la activa lleva `box-shadow: inset 0 0 0 1px #9184d9` y texto `#9184d9`.
- **Tag / chip** — 11 px, padding `3px 10px`, radio 6, `white-space: nowrap`. Acento: fondo `#2b2741`, texto `#d2cefd`. Neutral: fondo `#2a2c3b`, texto `rgba(233,233,237,.7)`. Delineado: borde `#9184d9`, texto `#9184d9`.
- **Fila de lista de ajustes** — grupos separados por 1 px de `rgba(233,233,237,.09)`, cada fila `#232532`, padding `13px 14px`, ícono de acento 17 px, label muted, valor a la derecha en peso 500, chevron `rgba(233,233,237,.35)`.
- **Regla horizontal** — se desvanece en los extremos: `linear-gradient(to right, transparent, rgba(233,233,237,.14) 48px, rgba(233,233,237,.14) calc(100% - 48px), transparent)`.
- **Íconos** — Phosphor. En RN se mantiene `expo-symbols` / `SymbolView`; el mapeo Phosphor → SF Symbol / Material está en la tabla de cada pantalla.

## Cambios de estructura

1. **Tab bar en píldora flotante con glass.** Ya existe la base (`lib/tabBarLayout.ts` + `GlassSurface intensity 80`); el cambio es de tokens. Nueva especificación: contenedor centrado horizontalmente (no de borde a borde), `bottom = insets.bottom + 28`, padding 6, radio 999, fondo `rgba(43,39,65,.5)` con blur 20 y saturación 1.5, `inset 0 1px 0 rgba(233,233,237,.14)` + `0 0 0 1px rgba(233,233,237,.1)` + `0 14px 34px rgba(0,0,0,.55)`. La tab activa es una píldora interna `rgba(145,132,217,.28)` con ícono **y** label (12.5 px / 500); las inactivas son solo ícono en `rgba(233,233,237,.5)`, caja de 40×38. Así entran cuatro tabs sin pasar de ~300 px de ancho.
   En RN: `tabBarStyle` con `alignSelf:'center'`, `paddingHorizontal:6`, `borderRadius:999`, y `tabBarItemStyle` variable según `focused`; la etiqueta se oculta cuando no está enfocada.
   **Importante:** el contenido no debe pasar por debajo de la píldora. Mantener `useFloatingTabBarInset()` y sumar ~96 px al `paddingBottom` de los scrolls. No poner degradado de desvanecido sobre el contenido.
2. **Cuarta tab "Generar".** Hoy son Setlists / Repertorio / Ajustes con `initialRouteName: 'setlists'`. El rediseño separa el disparador del azar en su propia ruta: **Generar / Setlists / Repertorio / Ajustes**, con Generar como ruta inicial. Íconos: `shuffle`, `microphone-stage` (`music.mic` / `mic`), `queue` (`music.note.list` / `queue_music`), `sliders-horizontal` (`slider.horizontal.3` / `tune`).
   Si se prefiere no agregar ruta, la alternativa es dejar Setlists como inicial con el botón grande de generar arriba de la lista; el resto del rediseño no cambia.

## Screens / Views

Los ids entre paréntesis son las opciones del archivo HTML (badge visible en cada mock).

### 1. Generar — home (1a; consola alternativa en 1b; variante "prestado" en 1c)

Ruta nueva `app/(tabs)/generate.tsx`, o cabecera de `setlists.tsx` si no se agrega la tab.

**Layout** (de arriba a abajo, padding horizontal 22):
- Kicker "HUESO TIME" 10/600/0.16em en acento; título "Armá el show" 27/500; sub "128 canciones en tu repertorio" 13 muted. A la derecha, botón de lupa de 36×36, radio 8, borde `rgba(233,233,237,.16)`.
- **Disparador circular**: 212×212, radio 50 %, borde `1px solid #9184d9`, fondo `radial-gradient(circle at 50% 42%, rgba(145,132,217,.22), rgba(145,132,217,.04) 62%, transparent 74%)`. Dentro: ícono shuffle 30 px, "Generar" 20/500, y una línea de 11.5 px muted con el formato y el pool. Anillo exterior `inset:-6px` con pulso de 3.6 s (opacidad .35→.9, escala 1→1.04). Al presionar, el fondo sube a `.34` y `.46`.
  Estado generando: el anillo pasa a giratorio (borde `rgba(145,132,217,.22)`, `borderTopColor: #9184d9`, 0.75 s lineal) y debajo del círculo aparece un ticker que rota títulos del pool cada 95 ms. Duración total ~950 ms y luego navega al setlist. En RN, animar con **Reanimated** en el hilo de UI para que no se trabe mientras corre `generateRandomSets`.
- **Tres filas de ajuste rápido** (grupo de filas, ver componente): Pool (`Todo el repertorio` / `Solo favoritas` / `Listas para tocar`), Energía (`Ascendente` / `Fiesta` / `Tranqui` / `Variada`), Formato (`3 sets × 45 min` / `2 sets × 50 min` / `1 set × 60 min`). Cada fila abre el selector correspondiente; en el mock ciclan al tocar.
  Mapeo a `SongFilters` y a `GenerateRandomSetsOptions`: Pool → `favorite` / `practiceStatus`; Energía → `smartEnergy` + `preferVariety`; Formato → `setCount` + `targetMinutes`.
- **"Últimos tiros"**: kicker + dos filas con thumb de 38 px radio 8, título 13.5/500 y meta 11.5 muted.

### 2. Consola de generación (1b)

Para quien quiere ver las perillas: tres tarjetas en grid de 3 columnas (Tempo con histograma de barras, Energía con curva, Tonalidad con chips), chips de pool con el conteo real "Pool · 74 de 128 canciones", banner de factibilidad ("Alcanza para 3 sets completos" / "Sobran 11 canciones de margen"), anticipo del Set 1 con tres filas `nn · título · bpm · tonalidad`, y el CTA "Tirar los 3 sets" abajo.

El conteo viene de `filterSongs(songs, appliedFilters).length`, igual que `CreateSetlistWizard`. El banner debe advertir cuando `matchedCount` no alcanza para `setCount × targetMinutes`.

### 3. Setlist generado (1a, pantalla 2)

Cabecera: back 34×34, nombre 15/500 + meta 11.5 (`n canciones · m min · energía`), botón compartir. Por cada set: cabecera con "SET n" en kicker de acento y "44:12 / 45 min" a la derecha; barra de progreso de 3 px (`rgba(233,233,237,.09)` de fondo, relleno de acento al `dur/target`); filas de canción con índice de dos dígitos monoespaciado, título 13.5/500, sub `artista · BPM · tonalidad`, y botón de recambio de 28×28 que en hover se tinta de acento.

Barra de acciones abajo, fija: "Volver a tirar" (ghost con borde) y "Guardar" (delineado de acento). Padding inferior 26 para que no choque con la píldora. Al guardar, `showToast`.

Densidad: la sub con BPM y tonalidad es opcional (prop `showMeta` en el mock) — útil si se quiere una vista compacta.

### 4. Setlists — biblioteca (1a, pantalla 3)

Título 27/500 + sub. Cards de padding 14, radio 8, fondo `#232532`, borde de 1 px que en hover pasa a `#595d6c`. Contenido: nombre 15/500 + fecha en monoespaciada 11 a la derecha, venue 12 muted, y tres tags (sets, duración total, tag del filtro).

### 5. Ajustes (1a, pantalla 4) y Fuentes de datos (6c)

Ajustes: tres grupos de filas — **Por defecto** (cantidad de sets, minutos por set, switch "sin repetir en el show"), **Fuentes** (Spotify conectado, importar Google Sheets), **App** (idioma, modo show). Pie con versión y última sincronización en 11 px `rgba(233,233,237,.35)`.

Fuentes de datos (pantalla aparte): card destacada de la semilla Barra Libre con "128 de 214 importadas", barra de progreso de 4 px, explicación de que no duplica, y CTA "Importar las 86 que faltan". Debajo, grupo de filas: Google Sheets, Archivo CSV (con la lista de columnas esperadas), Buscar en Spotify o iTunes. Al final, card de almacenamiento con el estado de sincronización en `#b5abfc`.

El contador sale de `songs.length` / `BARRA_LIBRE_COUNT`, y el resultado de `importBarraLibreSeed()` alimenta el toast (`settings.importSeedDone` / `importSeedNone`).

### 6. Compartir (1a, pantalla 5)

Póster: radio 12, `linear-gradient(160deg, #262a60, #191b2a 70%)` — es el único degradado saturado permitido, equivalente al ground de divisor de Nocturne. Dentro: marca en kicker, nombre del show 22/500, meta, regla que se desvanece, primeras 6 canciones numeradas y "+ n más".

Debajo: grupo de filas (copiar link con el slug visible, guardar imagen para historias, PDF para el atril) y tres botones cuadrados de 64 px (La banda, Mensaje, Otra app) que disparan `Share` nativo. El texto plano sigue saliendo de `formatSetlistShareText`.

### 7. Modo show (4a, estados en 4c)

Fondo `#12141f`. `useKeepAwake` sigue activo.

- **Barra superior**: "Set 1 · 3/5" en kicker de acento, píldora de cronómetro (borde `#3f424d`, radio 999, ícono timer + tiempo en monoespaciada) que al tocar pausa el conteo, y botón X de 32×30.
- **Escena** (toda tocable, avanza a la siguiente): título 44/500 hasta 3 líneas, artista 17 muted, BPM 76/500 con "BPM" 13/600/0.14em al lado, y línea de tonalidad 22/500 en `#d2cefd` + `duración · género · ★`.
- **Progreso de canción**: tres tiempos en monoespaciada 12 (transcurrido / restante / total) y barra de 6 px con `inset 0 0 0 1px #3f424d`.
- **Controles**: anterior 52×48 y "Siguiente" a lo ancho, ambos de 48 px de alto.
- **Sigue**: kicker + próxima canción con `artista · BPM · tonalidad`.

Estados: al 85 % de la canción (`nearEnd`) el BPM, la barra y el tiempo restante pasan a `#d2cefd` — solo cambia el color, sin parpadeo. Con `overrun` (set 5 % arriba del objetivo) la píldora del cronómetro toma borde de acento y agrega "+3:20". En pausa, el centro dice "En pausa" en acento. Sin alertas ni modales en escena.

En escritorio se abre a pantalla completa sin la barra superior de navegación, con los mismos tamaños.

### 8. Login (4b)

Glow de acento arriba: círculo de 420 px, `radial-gradient(circle, rgba(145,132,217,.22), transparent 66%)`, `top:-120`, centrado.

Lockup hero de `BrandMark`: `techplace-cat.png` a 104×104 con `mix-blend-mode: lighten` (regla `.lighten` de Nocturne), "Hueso Time" 24/500/−0.02em, y "SETLIST · STAGE · COVERS" 10/600/0.12em en acento.

Titular "Tu repertorio, armado en un tiro" 31/500/−0.026em en dos líneas; sub 14/1.6 muted, ancho máximo 280.

Acciones: "Continuar con Google" delineado de acento con ícono, 50 px de alto; "Entrar sin cuenta" en ghost (solo visible con `isAuthSkipped()`); nota de 12 px sobre Gmail y almacenamiento local. Pie con regla desvanecida y "Privacidad · Términos" en 11.5 px.

El banner de `auth.missingConfig`, el `ActivityIndicator` durante `busy` y el `Redirect` a `/(tabs)` cuando `canAccessApp` se mantienen igual.

### 9. Repertorio (5a)

Título + sub con conteos, botón de alta de 44×44 delineado de acento arriba a la derecha. Buscador (input con lupa muted). Dos filtros lado a lado (artista, género): cajas de 36 px con chevron de acento; el activo lleva borde de acento y texto `#d2cefd`. Enlace "Limpiar filtros" 12.5 px en acento cuando hay filtros.

Lista: cabeceras de sección **pegajosas** por artista (fondo `#161826`, kicker de acento, conteo y caret) que al tocar plegan la sección. Filas: thumb 42×42 radio 6 (`#2a2c3b` con ícono de nota si no hay carátula), título 14/500 con estrella de acento de 11 px si es favorita, meta en monoespaciada 11.5 (`126 BPM · A mayor · 3:51`), y tag de estado de ensayo a la derecha: `lista` (tag de acento), `ensayar` (neutral), `cierre` (delineado). Hover de fila `rgba(233,233,237,.05)`.

El bloque de sugerencias externas (`musicSearch`, con carátula y duración) mantiene el comportamiento actual: aparece dentro del vacío cuando la búsqueda tiene 2+ caracteres.

### 10. Editor de canción (5b)

Bottom sheet al 92 % de alto, radio superior 22, fondo `#191b2a`, grab handle de 38×4. Cabecera: "Editar canción" 19/500 + acciones de borrar y cerrar.

Campos en orden: hueco de carátula 64×64 con enlace "Buscar la canción"; Título; Artista; BPM y Duración en dos columnas (monoespaciada); Tonalidad como grid de chips de 13 tonos + segmentado Mayor/Menor; Género como chips delineados (los 24 del modelo, con "+ n más"); Estado de ensayo en segmentado de tres; fila de switch "Favorita" con estrella; Notas en textarea de 64 px de alto.

Pie fijo: "Cancelar" ghost y "Guardar" delineado, ambos de 46 px. Borrar pasa por `confirmDestructive`.

### 11. Agregar canción al set (5c)

Sheet al 84 %. Cabecera "Agregar al Set 2" + "Quedan 8 min para llegar a 45" (calculado con `setDurationSec` contra `targetMinutes`). Buscador con borde de acento. Banner con switch "Usar preferencias del show" que muestra el filtro y el conteo (`rock, latin · 96–140 BPM · 74 canciones`) — es el `usePreferences` que ya existe.

Filas: thumb 40, título 14/500, meta monoespaciada, y `plus-circle` de 21 px en acento. Las ya usadas van al 45 % de opacidad, con el texto "Ya está en el Set 1" y `check-circle` gris. Pie con la instrucción y botón "Listo".

### 12. Reordenar arrastrando (6a)

Cabecera con subtítulo "Reordenando · soltá para fijar" en acento y botón "Listo" de 32 px. Filas con `dots-six-vertical` de 17 px como handle. La fila levantada: fondo `#2b2741`, `0 0 0 1px #9184d9`, `0 14px 30px rgba(0,0,0,.5)`, `scale(1.02) rotate(-.4deg)`. Línea de inserción de 2 px en acento. Las demás filas al 55 % de opacidad. Banner con la duración resultante al soltar.

Se implementa sobre el `react-native-draggable-flatlist` ya presente (con su patch); solo cambian los estilos de `ScaleDecorator` / `isActive`.

### 13. Editar el show y borrar (6b)

Sheet al 62 %: Nombre (foco de acento), Venue, Fecha (monoespaciada), fila de acceso a las preferencias guardadas, regla desvanecida, y "Borrar este setlist" en `#b5abfc` con ícono.

Diálogo de confirmación encima: telón `rgba(15,17,28,.62)`, card radio 12, fondo `#232532`, `0 24px 60px rgba(0,0,0,.6)`. Título 19/500, cuerpo 13.5/1.55, acciones alineadas a la derecha: "No" ghost y "Sí, borrar" delineado, ambos 40 px y `nowrap`. Corresponde a `confirmDestructive`.

### 14. Escritorio web (7a, notas en 7b)

`useDesktopWeb()` oculta la tab bar y muestra `WebTopNav` fija — eso no cambia. Nueva especificación de la barra: radio 12, padding `12px 18px`, fondo `rgba(43,39,65,.55)` con blur 22 / saturación 1.5, mismo trío de sombras que la píldora móvil. Contenido: lockup compacto (cat 42 px + "HUESO TIME" 14/600/0.11em mayúsculas + tagline en acento), links de 13.5 px con el activo en `rgba(145,132,217,.18)` y subrayado de acento de 2 px, separador vertical de 1 px, y avatar de 28 px + "Salir".

Contenido en `PageColumn maxWidth 920`, padding 28. Cabecera con título 32/500 y dos botones a la derecha (Presets ghost, "Tirar los 3 sets" delineado) — **el círculo grande no va en escritorio**. Debajo, grid `340px 1fr`: columna izquierda con las tarjetas de formato, pool y tempo, y los tres switches de opciones (radios de 16 px al estilo `.radio` de Nocturne); columna derecha con el banner de factibilidad y los tres sets en grid de 3 columnas, cada uno con su barra de progreso y las primeras 5 canciones + "+ n más". Barra de acciones al pie con el atajo de teclado `R` para volver a tirar.

## Interactions & Behavior

- **Generar**: 950 ms de animación, ticker cada 95 ms, luego navegación al setlist. Reanimated en el hilo de UI.
- **Recambio de canción**: reemplaza una canción por otra del pool que no esté usada en ningún set, recalcula la duración y muestra toast. Sin modal.
- **Toast**: `bottom: 104` (por encima de la píldora), padding `9px 15px`, radio 8, fondo `#2b2741`, borde `#595d6c`, entrada de 180 ms desde 10 px abajo, se va a los 1.6 s.
- **Hover** (solo web): filas `rgba(233,233,237,.05)`; botones delineados `rgba(145,132,217,.14)`; ghost `rgba(233,233,237,.07)`; bordes `#3f424d` → `#595d6c`.
- **Foco de teclado**: `outline: 2px solid #9184d9; outline-offset: 2px`. Nunca el anillo azul por defecto.
- **Modo show**: toque en la escena avanza; `nearEnd` al 85 %; `overrun` al 105 % del objetivo; la píldora pausa; keep-awake activo.
- **Deshabilitado**: 45 % de opacidad.
- Sin scrollbars visibles en las vistas de lista (en web, ocultarlos).

## State Management

No hay estado nuevo. El rediseño consume lo que ya existe: `AppContext` (`songs`, `songsById`, `setlists`, `settings`, `updateSettings`, `upsertSetlist`, `updateSetlistSets`, `deleteSong`, `importBarraLibreSeed`), `AuthContext` (`user`, `canAccessApp`, `completeGoogleSignIn`, `enterAsGuest`, `exitToLogin`), y el estado local de cada pantalla (`picker`, `usePreferences`, `showMode`, `editOpen`, `collapsed`, `query`, `genre`, `artist`).

Lo único nuevo es visual: el estado `rolling` del disparador (que hoy es implícito) y, si se agrega la cuarta tab, la ruta `generate`.

## Assets

- `assets/brand/techplace-cat.png` — copiado tal cual de `hueso-time/assets/images/brand/techplace-cat.png`. Se usa en el login (104 px) y en la barra de escritorio (42 px), siempre con `mix-blend-mode: lighten`.
- `_ds/nocturne-.../styles.css` — hoja de tokens de Nocturne. Es la fuente de verdad de los valores de arriba; sirve para portar a `constants/Colors.ts`.
- Íconos: **Phosphor** en los mocks. En la app se mantiene `expo-symbols`; el nombre Phosphor de cada ícono está en la descripción de la pantalla.
- Carátulas: siguen viniendo de la búsqueda de Spotify / iTunes. En los mocks son huecos con ícono de nota.
- No hay imágenes generadas ni ilustraciones nuevas.

## Files

- `Hueso Time — Rediseño.dc.html` — todos los mocks. Se abre directo en el navegador. Está organizado en secciones por turno, la más nueva arriba; cada opción tiene un badge con su id (`1a`, `4b`, `7a`…). El turno 3 es la **auditoría de funciones**: cada función del código con la pantalla donde vive.
- `support.js` — runtime que necesita el HTML. No editar.
- `browser-window.jsx` — el chrome de navegador del mock de escritorio. Solo presentación.
- `assets/brand/techplace-cat.png`, `_ds/nocturne-.../` — assets y tokens listados arriba.

## Orden sugerido de implementación

1. Decidir la paleta (Nocturne o marca actual) y, si aplica, portar `constants/Colors.ts`.
2. Primitivas de `components/ui.tsx`: botón delineado, input, segmentado, tag, fila de lista, regla desvanecida.
3. Tab bar en píldora + inset de contenido.
4. Generar (con o sin cuarta tab) y setlist generado — es el corazón del rediseño.
5. Setlists, Repertorio, editor de canción.
6. Modo show y login.
7. Sheets: agregar canción, editar show, fuentes de datos.
8. Escritorio: `WebTopNav` y el grid de dos columnas.
