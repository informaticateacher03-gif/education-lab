const CACHE_NAME = 'ai-ar-lab-v2';
const APP_SHELL = [
  './', './index.html', './lesson.html', './presentation.html',
  './css/styles.css', './css/lesson.css', './css/presentation.css', './css/course-lesson.css',
  './js/app.js', './js/course-data.js', './js/course-lesson.js', './js/lesson.js', './js/presentation.js', './js/progress.js',
  './manifest.json', './assets/icons/icon.svg',
  './course/lesson02/index.html', './course/lesson03/index.html', './course/lesson04/index.html', './course/lesson05/index.html', './course/lesson06/index.html', './course/lesson07/index.html', './course/lesson08/index.html', './course/lesson09/index.html', './course/lesson10/index.html', './course/lesson11/index.html', './course/lesson12/index.html', './course/lesson13/index.html', './course/lesson14/index.html', './course/lesson15/index.html', './course/lesson16/index.html', './course/lesson17/index.html', './course/lesson18/index.html', './course/lesson19/index.html', './course/lesson20/index.html', './course/lesson21/index.html', './course/lesson22/index.html', './course/lesson23/index.html', './course/lesson24/index.html', './course/lesson25/index.html', './course/lesson26/index.html', './course/lesson27/index.html', './course/lesson28/index.html', './course/lesson29/index.html', './course/lesson30/index.html', './course/lesson31/index.html', './course/lesson32/index.html', './course/lesson33/index.html', './course/lesson34/index.html'
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
