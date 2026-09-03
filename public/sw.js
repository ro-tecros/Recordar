/* Service worker de Recordar — PWA offline sin paso de build.
 *
 * Estrategia:
 *  - Navegaciones (HTML): red primero, con la copia en caché como respaldo
 *    (así la app abre offline una vez visitada online).
 *  - Recursos estáticos (JS/CSS/imágenes/fuentes): caché primero, y se
 *    actualiza en segundo plano.
 *
 * Para forzar que todos los clientes tomen una versión nueva, sube el número
 * de CACHE (por ejemplo 'recordar-v3').
 */

const CACHE = 'recordar-v2';

// La app puede servirse en la raíz o en un subdirectorio (GitHub Pages la
// publica en /Recordar/). './' se resuelve contra la ubicación de este archivo,
// así que apunta siempre al índice correcto.
const SHELL = './';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(SHELL, copy));
          return response;
        })
        .catch(() =>
          caches.match(SHELL).then((cached) => cached || caches.match(request))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
