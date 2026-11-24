/* Сервис-воркер: приложение открывается сразу из памяти телефона, даже при плохом интернете.
   Новая версия скачивается в фоне; проверка version.json всегда идёт через сеть. */
var C='ug-v3';   /* sw 2026-11-24: + info.html, privacy.html; 2026-11-19: другие страницы (оферта) — напрямую из сети, приложение не трогают */
var SHELL=['./','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png','oferta.html','info.html','privacy.html'];
self.addEventListener('install',function(e){self.skipWaiting();e.waitUntil(caches.open(C).then(function(c){return c.addAll(SHELL).catch(function(){})}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==C}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
function put(req,res){if(res&&res.ok&&res.type==='basic'){var cp=res.clone();caches.open(C).then(function(c){c.put(req,cp)})}return res}
self.addEventListener('fetch',function(e){
var r=e.request,u=new URL(r.url);
if(r.method!=='GET'||u.origin!==location.origin)return;               /* чужие сайты (ключи и т.п.) — как обычно */
if(/version\.json$/.test(u.pathname))return;                           /* проверка версии — только сеть */
if(r.mode==='navigate'&&!/\/(index\.html)?$/.test(u.pathname))return;      /* оферта и др. страницы — как обычно */
if(r.mode==='navigate'){
  var key=new Request(new URL('./',location.href).href);
  if(u.searchParams.has('v')){                                          /* переход на новую версию: сначала сеть */
    e.respondWith(fetch(u.href,{cache:'reload',credentials:'same-origin'}).then(function(res){return put(key,res)}).catch(function(){return caches.match(key)}));return}
  e.respondWith(caches.match(key).then(function(hit){
    var net=fetch(r).then(function(res){return put(key,res)}).catch(function(){return hit});
    if(hit){e.waitUntil(net);return hit}return net}));return}
e.respondWith(caches.match(r).then(function(hit){                       /* картинки, иконки — из памяти */
  var net=fetch(r).then(function(res){return put(r,res)});
  if(hit){e.waitUntil(net.catch(function(){}));return hit}return net}));
});

/* приложение присылает список всех картинок — скачиваем в память те, которых ещё нет */
self.addEventListener('message',function(e){var d=e.data;if(!d||d.t!=='pre'||!d.urls)return;
e.waitUntil(caches.open(C).then(function(c){var q=d.urls.slice(),n=0;
 function next(){if(!q.length)return Promise.resolve();var u=q.shift();
  return c.match(u).then(function(hit){if(hit)return;return fetch(u).then(function(r){if(r.ok)return c.put(u,r)}).catch(function(){})}).then(next)}
 return Promise.all([next(),next(),next()])}))});
