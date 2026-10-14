// Service worker mínimo: solo para que Android y Windows ofrezcan instalar la app.
// No guarda nada sin conexión a propósito: el chofer siempre ve la última versión
// y las ventas necesitan internet igual. Las páginas van directo a la red.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') event.respondWith(fetch(event.request))
})
