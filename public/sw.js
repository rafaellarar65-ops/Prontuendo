const CACHE_NAME = 'portal-prontuendo-shell-v5';
const PATIENT_APP_SHELL = [
  '/',
  '/login',
  '/glicemia',
  '/exames',
  '/documentos',
  '/perfil',
  '/manifest.webmanifest',
];
const MEDICAL_APP_SHELL = ['/app/', '/app/login'];
const APP_SHELL = [...PATIENT_APP_SHELL, ...MEDICAL_APP_SHELL];

async function warmAppShellCache() {
  const cache = await caches.open(CACHE_NAME);

  await Promise.all(
    APP_SHELL.map(async (path) => {
      try {
        const response = await fetch(path, { cache: 'no-store' });
        if (!response.ok) return;
        await cache.put(path, response.clone());
      } catch {
        // ignore install-time network failures for individual routes
      }
    }),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(warmAppShellCache());
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
  if (requestUrl.origin !== self.location.origin) return;

  const acceptHeader = event.request.headers.get('accept') || '';
  const isHtmlNavigation = event.request.mode === 'navigate' || acceptHeader.includes('text/html');

  if (isHtmlNavigation) {
    const isMedicalRoute = requestUrl.pathname.startsWith('/app');
    const navigationFallback = isMedicalRoute ? '/app/' : '/login';

    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(async () => {
          const cachedNavigation = await caches.match(event.request);
          if (cachedNavigation) return cachedNavigation;
          return caches.match(navigationFallback);
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((response) => {
        const responseClone = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      });
    }),
  );
});

self.addEventListener('push', (event) => {
  let payload;

  try {
    payload = event.data ? event.data.json() : null;
  } catch {
    payload = null;
  }

  const notificationPayload = payload || {
    title: 'Portal de pacientes - Dr Rafael Lara',
    body: 'Você tem uma nova atualização no portal.',
  };

  event.waitUntil(
    self.registration.showNotification(notificationPayload.title, {
      body: notificationPayload.body,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/'));
});
