'use strict';var CACHE="v20211109093443",AUTO="00000050.html 00031260.html 00068448.html 00124361.html 00164928.html 00169786.html 00177478.html 00185343.html 00193738.html 00215471.html 00216132.html 00227224.html 00228959.html 00258389.html 00269511.html 00312484.html 00329465.html css/bgss.css css/bootstrap.css img/favicon.ico img/house-door.svg img/info-square.svg index.html js/bgss.js js/bootstrap.js js/lcng.js".split(" ");
function sqp(a){a=new URL(a.url);a.search="";a.fragment="";return new Request(a)}self.addEventListener("install",function(a){a.waitUntil(caches.open(CACHE).then(function(b){b.addAll(AUTO)}).then(self.skipWaiting()))});self.addEventListener("activate",function(a){a.waitUntil(caches.keys().then(function(b){return Promise.all(b.filter(function(c){return c!==CACHE}).map(function(c){return caches.delete(c)}))}))});
self.addEventListener("fetch",function(a){if("GET"===a.request.method&&a.request.url.startsWith(self.location.origin)){var b=sqp(a.request);a.respondWith(caches.match(b).then(function(c){return void 0!==c?c:fetch(a.request).then(function(d){if(d.ok&&!d.headers["Cache-Control"]){var e=d.clone();caches.open(CACHE).then(function(f){f.put(b,e)})}return d}).catch(function(){return new Response("404 - NOT FOUND",{status:404,statusText:"NOT FOUND"})})}))}});
