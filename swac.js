//
// service worker application cache
//

var CACHE = 'v20210828105735';

var AUTO = [
    '00000050.html',
    '00031260.html',
    '00068448.html',
    '00124361.html',
    '00164928.html',
    '00169786.html',
    '00185343.html',
    '00193738.html',
    '00215471.html',
    '00216132.html',
    '00227224.html',
    '00228959.html',
    '00258389.html',
    '00269511.html',
    '00312484.html',
    'css/bgss.css',
    'css/bootstrap.css',
    'img/favicon.ico',
    'img/house-door.svg',
    'img/info-square.svg',
    'index.html',
    'js/bgss.js',
    'js/bootstrap.js',
    'js/lcng.js',
];

// strip query parameters (and fragment)
function sqp (request) {
    var url = new URL (request.url);
    url.search = '';
    url.fragment = '';
    return(new Request (url));
}

// cache preload
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE)
            .then(function (cache) {
                cache.addAll(AUTO);
            })
            .then(self.skipWaiting())
    );
});

// cache cleanup
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (names) {
            return(Promise.all(
                names.filter(function (name) {
                    return(name !== CACHE);
                }).map(function (name) {
                    return(caches.delete(name));
                })
            ));
        })
    );
});

// intercept fetch requests: use cache then network
self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET')
        return;
    if (!event.request.url.startsWith(self.location.origin))
        return;
    var cleaned = sqp(event.request);
    event.respondWith(caches.match(cleaned).then(function (response) {
        if (response !== undefined) {
            return(response);
        } else {
            return(fetch(event.request).then(function (response) {
                if (response.ok && !response.headers['Cache-Control']) {
                    var cloned = response.clone();
                    caches.open(CACHE).then(function (cache) {
                        cache.put(cleaned, cloned);
                    });
                }
                return(response);
            }).catch(function () {
                return(new Response('404 - NOT FOUND', {
                    status: 404,
                    statusText: 'NOT FOUND',
                }));
            }));
        }
    }));
});
