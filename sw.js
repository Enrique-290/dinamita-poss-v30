/* Dinamita POS v30.5.6 - Service Worker cache fix
   Cambio: cache nuevo, actualización limpia y soporte completo para Página 3.0.
*/
const CACHE_VERSION = '30.5.6-cachefix-20260505';
const CACHE_NAME = `dinamita-pos-${CACHE_VERSION}`;
const APP_SHELL = './index.html';
const PRECACHE_URLS = [
  "./assets/css/app.css",
  "./assets/icons/icon-192-maskable.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512-maskable.png",
  "./assets/icons/icon-512.png",
  "./assets/js/app.js",
  "./assets/js/store.js",
  "./index.html",
  "./manifest.json",
  "./manifest.webmanifest",
  "./modules/acceso/acceso.css",
  "./modules/acceso/acceso.html",
  "./modules/acceso/acceso.js",
  "./modules/bodega/bodega.css",
  "./modules/bodega/bodega.html",
  "./modules/bodega/bodega.js",
  "./modules/clientes/clientes.css",
  "./modules/clientes/clientes.html",
  "./modules/clientes/clientes.js",
  "./modules/configuracion/configuracion.css",
  "./modules/configuracion/configuracion.html",
  "./modules/configuracion/configuracion.js",
  "./modules/dashboard/dashboard.css",
  "./modules/dashboard/dashboard.html",
  "./modules/dashboard/dashboard.js",
  "./modules/gastos/gastos.css",
  "./modules/gastos/gastos.html",
  "./modules/gastos/gastos.js",
  "./modules/historial/historial.css",
  "./modules/historial/historial.html",
  "./modules/historial/historial.js",
  "./modules/inventario/inventario.css",
  "./modules/inventario/inventario.html",
  "./modules/inventario/inventario.js",
  "./modules/membresias/membresias.css",
  "./modules/membresias/membresias.html",
  "./modules/membresias/membresias.js",
  "./modules/pagina/pagina.css",
  "./modules/pagina/pagina.html",
  "./modules/pagina/pagina.js",
  "./modules/pagina3/assets/app.js",
  "./modules/pagina3/assets/styles.css",
  "./modules/pagina3/modules/banner.js",
  "./modules/pagina3/modules/carrito.js",
  "./modules/pagina3/modules/catalogo.js",
  "./modules/pagina3/modules/contacto.js",
  "./modules/pagina3/modules/header.js",
  "./modules/pagina3/modules/router.js",
  "./modules/pagina3/pages/index.html",
  "./modules/pagina3/pagina3.css",
  "./modules/pagina3/pagina3.html",
  "./modules/pagina3/pagina3.js",
  "./modules/reportes/reportes.css",
  "./modules/reportes/reportes.html",
  "./modules/reportes/reportes.js",
  "./modules/ventas/ventas.css",
  "./modules/ventas/ventas.html",
  "./modules/ventas/ventas.js"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('dinamita-pos-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, fallbackUrl = APP_SHELL) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(request, { cache: 'no-store' });
    if (request.method === 'GET' && fresh && fresh.status === 200) {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    return (await cache.match(request)) || (await cache.match(fallbackUrl));
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const freshPromise = fetch(request, { cache: 'no-store' })
    .then((fresh) => {
      if (request.method === 'GET' && fresh && fresh.status === 200) {
        cache.put(request, fresh.clone());
      }
      return fresh;
    })
    .catch(() => null);
  return cached || freshPromise || fetch(request);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin || req.method !== 'GET') return;

  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(networkFirst(req));
    return;
  }

  if (['script', 'style', 'image', 'font'].includes(req.destination)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  event.respondWith(staleWhileRevalidate(req));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
