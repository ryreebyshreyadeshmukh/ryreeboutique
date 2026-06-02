const CACHE_NAME = 'ryree-os-v1';

// Install — cache core app shell
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([
        '/ryreeboutique/index.html',
        '/ryreeboutique/'
      ]);
    }).catch(function() {})
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  var url = event.request.url;

  // Never intercept Firebase/Google API calls
  if (url.includes('firestore.googleapis.com') ||
      url.includes('firebase') ||
      url.includes('googleapis.com') ||
      url.includes('accounts.google.com')) return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        if (response && response.status === 200 && url.includes('ryreeboutique')) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match('/ryreeboutique/index.html');
        });
      })
  );
});
