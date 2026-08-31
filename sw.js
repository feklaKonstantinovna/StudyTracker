const CACHE = 'sf-shell-v1';
const SHELL = [
  './',
  './study-tracker_2.html',
  './src/app.js',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(hit => hit || fetch(event.request).catch(() => caches.match('./study-tracker_2.html')))
  );
});
