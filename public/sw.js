const CACHE_NAME = 'portal-pacientes-dr-rafael-v2';
const APP_SHELL = ['/', '/login', '/glicemia', '/exames', '/documentos', '/perfil', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const acceptHeader = event.request.headers.get('accept') || '';
  const isHtmlNavigation = event.request.mode === 'navigate' || acceptHeader.includes('text/html');

  if (isHtmlNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (requestUrl.origin === self.location.origin) {
            const responseClone = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          if (cachedPage) return cachedPage;

          return (await caches.match('/login')) || caches.match('/index.html');
        }),
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (requestUrl.origin === self.location.origin) {
          const responseClone = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});

self.addEventListener('push', (event) => {
  const payload = event.data?.json() ?? {
    title: 'Portal de pacientes - Dr Rafael Lara',
    body: 'Você tem uma nova atualização no portal.',
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/'));
});
