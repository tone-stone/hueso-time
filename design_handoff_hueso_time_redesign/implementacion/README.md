# Implementación — decisiones tomadas

Paleta: **Nocturne**. Navegación: **cuatro tabs**, con "Generar" como ruta inicial.

Los archivos de esta carpeta son código para el repo, no mocks. Cada uno lleva el nombre de su destino con los separadores de ruta cambiados por guiones.

| Archivo | Destino en el repo |
| --- | --- |
| `constants-Colors.ts` | `constants/Colors.ts` |
| `lib-tabBarLayout.ts` | `lib/tabBarLayout.ts` |
| `app-(tabs)-_layout.tsx` | `app/(tabs)/_layout.tsx` |
| `app-(tabs)-generate.tsx` | `app/(tabs)/generate.tsx` (archivo nuevo) |
| `i18n-claves-nuevas.ts` | fragmento para mergear en `i18n/locales.ts` |

## 1. `constants/Colors.ts`

Reemplaza el archivo completo. `MUSICAL_KEYS`, `KEY_MODES` y `GENRES` quedan idénticos, así que nada que los importe se rompe.

Nocturne es una escala mono: `tint` y `accent` son el mismo tono. `tint` (`#9184D9`) es la base para bordes, íconos y botones delineados; `accent` (`#D2CEFD`) es el paso claro, para texto sobre tintes oscuros y para el énfasis de "casi termina" en el modo show. Donde la paleta vieja usaba magenta para acciones y cian para destaques, ahora ambos caen en la misma rampa — el contraste sale de los pasos de la rampa, no de la saturación.

Claves nuevas que agregué (no existían y las pantallas las necesitan): `textFaint`, `backgroundSheet`, `surfaceAccent`, `surfaceSheet`, `divider`, `tintFaint`, `accentText`, `accentOn`, y los cuatro radios. Nada se eliminó: `success` y `warning` siguen ahí, bajados de croma para que no compitan con el acento.

Después de pegarlo, buscá hexes sueltos en pantallas y componentes (`#FF2D7B`, `#00E5FF`, `rgba(255,45,123`) y pasalos a `useThemeColors()`. En `_layout.tsx` viejo había uno: `iconWrapActive: rgba(255,45,123,0.16)`.

Dos reglas que vienen con la paleta y conviene respetar al portar pantallas: el acento no se usa como relleno de áreas grandes (botones delineados, no sólidos), y la elevación en fondo oscuro es borde de 1 px más oscuridad ambiental, no sombras apiladas.

## 2. `lib/tabBarLayout.ts`

Reemplaza el archivo. Cambian tres valores: `TAB_BAR_HEIGHT` 60 → **50**, `TAB_BAR_BOTTOM_GAP` 14 → **28**, `TAB_BAR_RADIUS` 28 → **999**. Se agrega `TAB_BAR_PAD` (6).

`useFloatingTabBarInset()` mantiene su firma, así que las tres pantallas que ya lo usan se ajustan solas.

`TAB_BAR_SIDE_GAP` queda exportado por compatibilidad, pero el layout nuevo ya no lo usa: la barra no se estira de borde a borde.

## 3. `app/(tabs)/_layout.tsx`

Reemplaza el archivo. Tres cambios:

**La píldora.** Deja de ser una barra de borde a borde: `alignSelf: 'center'` con `left`/`right` en `undefined` la hace del ancho de su contenido. `tabBarItemStyle` con `flex: 0` y `width: 'auto'` es lo que permite que cada ítem mida lo que necesita.

**Label solo en la tab enfocada.** `tabBarShowLabel: false` y el label renderizado dentro de `tabBarIcon`, al lado del ícono, en la píldora interna de acento. Eso es lo que hace que entren cuatro tabs en unos 300 px. La función `item()` arriba del `return` evita repetir el bloque cuatro veces.

**Cuarta ruta.** `initialRouteName: 'generate'` en el componente y en `unstable_settings`. El orden visual es Generar / Setlists / Repertorio / Ajustes.

## 4. `app/(tabs)/generate.tsx` (nuevo)

La pantalla que la cuarta tab necesita; sin ella Expo Router falla al resolver la ruta.

No reimplementa nada del generador: `Pool`, `Energía` y `Formato` solo eligen las opciones que se le pasan a `generateRandomSets`. El mapeo está explícito en dos funciones al tope del archivo — `poolSongs()` filtra por `favorite` / `practiceStatus` antes de que el generador vea la lista, y `energyOptions()` traduce la energía a los flags `smartEnergy` / `preferVariety` que ya existen. Los avisos de `noMatch` / `noPlace` son los mismos que usa `quickGenerate()` en `setlists.tsx`, y al guardar reusa `upsertSetlist` + `showToast(t('toast.setlistCreated'))` + `router.push`.

El disparador circular usa **Reanimated** (halo con pulso, anillo giratorio mientras genera) para que la animación corra en el hilo de UI y no se trabe mientras `generateRandomSets` ocupa el de JS. La animación se cobra sus 950 ms completos antes de colocar los sets, así el tiro no se siente instantáneo.

Dos cosas para ajustar al pegar:

- Los íconos son placeholders de texto (`⤨`, `☰`, `∿`, `◷`, `♪`, `›`). Cambialos por `SymbolView` con el mapeo de la tabla de cada pantalla — la lista está en el README principal.
- `PageHeader` recibe `brandSubtitle`, igual que las otras pantallas, así que en escritorio el lockup no se duplica con `WebTopNav`.

## 5. Claves de i18n

`i18n-claves-nuevas.ts` trae el bloque `tabs` completo (con `generate`) y el bloque `generate` con las claves que usa la pantalla nueva, en es y en en. Mergealo con lo que ya hay: `generate` **ya existe** en `locales.ts` (`noMatchTitle`, `noPlaceTitle`, `bpmAny`, `bpmSlow`…), así que no lo reemplaces — agregá las claves nuevas dentro.

`setlists.variedShowName` ya existe y se reusa para el nombre del setlist generado.

### Lo que falta hacer a mano

1. **Actualizar `LINKS` en `components/WebTopNav.tsx`** con el cuarto destino, primero en el orden:
   ```ts
   const LINKS = [
     { href: '/generate', key: 'generate' },
     { href: '/setlists', key: 'setlists' },
     { href: '/', key: 'repertoire' },
     { href: '/settings', key: 'settings' },
   ];
   ```
   y sumar `'/generate'` a `isPrimaryTab()` para que no aparezca el botón de volver.
2. **Revisar los `router.replace('/(tabs)/setlists')`** en `login.tsx` y `settings.tsx`: si querés que el login caiga en Generar, apuntalos a `/(tabs)/generate`. Si preferís que abra en Setlists, dejalos y cambiá `initialRouteName` a `'setlists'` — el resto del layout funciona igual.
3. **`iconWrapActive`** ya no existe en el layout nuevo (la píldora interna lo reemplaza). Si algún otro archivo lo importaba, no lo hará: era local.

### Verificación rápida

- Los cuatro íconos entran sin que la píldora toque los bordes en una pantalla de 360 dp.
- El último ítem de cada lista se ve completo, sin quedar debajo de la píldora — si no, el `paddingBottom` de ese scroll no está usando `useFloatingTabBarInset()`.
- La barra de acciones del detalle de setlist no queda pegada a la píldora: necesita ~26 px de padding inferior propio.
- En escritorio web la píldora no aparece y `WebTopNav` muestra los cuatro links.
