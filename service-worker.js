const CACHE_NAME = 'ai-ar-lab-v3';
const APP_SHELL = [
  './', './index.html', './lesson.html', './presentation.html',
  './css/styles.css', './css/lesson.css', './css/presentation.css',
  './js/app.js', './js/course-data.js', './js/lesson.js', './js/presentation.js', './js/progress.js',
  './manifest.json', './assets/icons/icon.svg'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok && new URL(event.request.url).origin === location.origin) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => event.request.mode === 'navigate' ? caches.match('./index.html') : undefined)));
});
