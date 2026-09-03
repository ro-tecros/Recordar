# Recordar

App móvil (iOS + Android) para no olvidar nada al salir. Guardas lo que llevas
siempre y tus salidas con su propia lista; al tocar el botón grande **SALIR**
ves todo junto para revisarlo antes de irte.

**App en vivo (PWA):** https://ro-tecros.github.io/Recordar/ — se instala desde
el navegador en Android e iPhone. Cada `git push` a `master` la vuelve a
publicar automáticamente (workflow `.github/workflows/deploy.yml`).

- 100 % local: los datos se guardan solo en el dispositivo (SQLite en móvil,
  `localStorage` en web). No hay servidor ni cuenta.
- Gratis y de código abierto (licencia MIT).
- Un solo código para Android, iOS y **web (PWA instalable)**, hecho con
  **Expo / React Native** (SDK 54).
- Interfaz con movimiento: animaciones de resorte al tocar, listas que entran y
  salen animadas, barra de progreso y checks animados
  (**react-native-reanimated**).

## Las tres ideas de la app

| Pestaña | Para qué |
|---|---|
| **Siempre** | Cosas que llevas cada vez que sales: llaves, billetera, celular. Aparecen siempre en la lista de "Salir". Se activan/desactivan con el círculo. |
| **Salidas** | Actividades como "Ir al mecánico". Dentro de cada una anotas qué no olvidar solo para esa vez: carnet de conducir, documentos del auto, dinero. |
| **Salir** | El botón grande del medio. Marcas qué salida vas a hacer y lo tocas: junta "Siempre" + esa salida en una checklist para ir revisando. |

## Requisitos

- **Node.js 20.19.4 o superior** (o 22 / 24 LTS): https://nodejs.org
- La app **Expo Go** en tu celular (gratis, App Store / Google Play). Debe ser
  una versión que soporte Expo SDK 54 o superior. Si sale "Project is
  incompatible with this version of Expo Go", actualiza Expo Go.

## Cómo probarla

```bash
npm install          # solo la primera vez
npx expo start       # abre el panel de Expo
```

Luego:

- **Celular físico:** escanea el QR con Expo Go (Android) o la cámara (iOS).
- **Android emulador:** pulsa `a` en la terminal.
- **iOS simulador (solo en Mac):** pulsa `i`.

## PWA: instalar en el celular sin tiendas (gratis, iPhone y Android)

La versión web se puede "instalar" desde el navegador y funciona offline, sin
depender de una PC. Es la forma gratis de tenerla en un iPhone.

```bash
npm run build:web     # genera dist/ (expo export -p web)
npm run serve:web      # pruébala en http://localhost:8080
```

Para publicarla gratis, sube la carpeta `dist/` a cualquier hosting estático
(Netlify, Vercel, Cloudflare Pages, GitHub Pages). No hace falta configurar
cabeceras especiales.

En el celular, abre esa URL y usa **"Agregar a pantalla de inicio"**:

- **Android (Chrome):** menú ⋮ → "Instalar aplicación" / "Agregar a pantalla de inicio".
- **iPhone (Safari):** botón compartir → "Agregar a pantalla de inicio".

Queda con ícono propio, a pantalla completa y con soporte offline (service
worker en `public/sw.js`). Para forzar una actualización en todos, sube el
número de `CACHE` en `public/sw.js`.

Archivos de la PWA: `public/manifest.json`, `public/index.html`, `public/sw.js`,
`public/icon-*.png`, y la sección `web` de `app.json`.

## Estructura

```
App.tsx                     Navegación (3 pestañas + pantallas) + providers
babel.config.js             Preset de Expo + plugin de Reanimated/Worklets
public/                     PWA: manifest, HTML, service worker, iconos
src/
  db/
    database.ts              SQLite (móvil): essentials / outings / outing_items + CRUD
    database.web.ts          localStorage (web): mismo API, sin SQLite
    types.ts                 Tipos (Essential, Outing, OutingItem)
  lib/
    haptics.ts               Envoltorio seguro de expo-haptics (no-op en web)
  ui/
    motion.ts                Resortes, tiempos y helpers de animación
  store/
    AppDataProvider.tsx      Estado global (Context) y acciones
  components/
    InlineAdd.tsx            Campo "escribe y +" para agregar rápido
    PressableScale.tsx       Pressable con feedback de resorte
    AnimatedCheck.tsx        Círculo de selección animado
    ConfirmSheet.tsx         Hoja de confirmación animada (reemplaza Alert)
    TabBarIcon.tsx           Icono de pestaña con salto al activarse
    UpdateBanner.tsx         Aviso de actualización OTA (EAS Update)
    UpdateBanner.web.tsx     Versión web (no-op: actualiza el service worker)
  screens/
    ExitScreen.tsx           Botón grande SALIR + elegir salida
    ExitChecklistScreen.tsx  Checklist final (Siempre + salidas elegidas)
    EssentialsScreen.tsx     Pestaña "Siempre"
    OutingsScreen.tsx        Pestaña "Salidas"
    OutingDetailScreen.tsx   Una salida y su lista de cosas
    ItemFormScreen.tsx       Editar / borrar una cosa (esencial o de salida)
```

## Cómo funciona el botón "Salir"

1. En **Siempre** agregas lo de todos los días (llaves, billetera, celular).
2. En **Salidas** creas "Ir al mecánico" y adentro anotas lo de esa vez
   (carnet de conducir, documentos…).
3. En **Salir** marcas la salida que vas a hacer y tocas el botón grande.
4. Aparece la checklist: sección **Siempre** + sección por cada salida elegida.
   Tocas cada cosa para confirmarla; la barra de arriba muestra el progreso.
5. Cuando vuelves, en **Salidas** (o dentro de la salida) la marcas como
   completada para que deje de aparecer.

> Los datos guardan una versión de esquema (`PRAGMA user_version`). El modelo
> viejo de "actividades con lugares" fue reemplazado; al abrir esta versión la
> tabla anterior se elimina automáticamente.

## Actualizaciones a distancia (EAS Update)

Objetivo: cambias el código y **todos los celulares reciben la actualización**
sin volver a pasar por la tienda. Ya está preparado en el repo (`expo-updates`,
`eas.json`, `app.json`, `src/components/UpdateBanner.tsx`).

Falta un paso manual (necesita login interactivo):

```bash
npm install -g eas-cli
eas login                 # cuenta gratis en expo.dev
eas init                  # crea el proyecto y el projectId
eas update:configure      # rellena updates.url y enlaza los channels
eas build -p android      # y/o -p ios  → este build es el que se instala
```

Desde ahí, cada cambio de código JS:

```bash
eas update --branch production -m "descripción del cambio"
```

Los celulares con ese build:

1. al abrir la app comprueban si hay versión nueva,
2. la descargan en segundo plano,
3. muestran el aviso **"Nueva versión lista → Actualizar"** (`UpdateBanner`).

Solo se actualiza código JS / estilos / imágenes. Si agregas una librería nativa
o cambias `app.json`, hay que hacer `eas build` de nuevo.

En **Expo Go y en desarrollo el banner no aparece** (es solo para builds reales).

## Próximos pasos (ideas)

- Notificaciones/recordatorios por hora o ubicación (`expo-notifications`).
- Listas por viaje o evento.
- Sincronización opcional en la nube (cuando quieras salir de "solo local").

## Formas de tenerla en el celular

| Vía | iPhone | Android | Costo | Offline |
|---|---|---|---|---|
| **PWA** (arriba) | ✅ | ✅ | Gratis | ✅ |
| APK directo (`eas build -p android`) | ❌ | ✅ | Gratis | ✅ |
| App Store / Google Play | ✅ | ✅ | 99 USD/año (Apple) · 25 USD una vez (Google) | ✅ |

Para "instalar y olvidarme" en iPhone sin pagar a Apple, la opción es la **PWA**.
