/* Сервис-воркер нужен Android для кнопки «Установить». Ничего не кэширует — обновления приходят как раньше. */
self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',function(e){e.respondWith(fetch(e.request))});
