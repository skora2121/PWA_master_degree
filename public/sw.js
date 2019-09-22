importScripts('/public/src/js/idb.js');
importScripts('/public/src/js/utility.js');

var CACHE_STATIC_VERSION = 'precache-v89';
var CACHE_DINAMIC_VERSION = 'dynamic-v6';


self.addEventListener('install', function(event) {
    console.log('[Service Worker] Installing Service Worker ...', event);
    event.waitUntil(
        caches.open(CACHE_STATIC_VERSION)
            .then(function(cache) {
                console.log('[Service Worker] Precaching App Shell');
                cache.addAll([
                    '/',
                    'http://127.0.0.1:5500/public/index.html',
                    'http://127.0.0.1:5500/public/offline.html',
                    'http://127.0.0.1:5500/public/src/js/app.js',
                    'http://127.0.0.1:5500/public/src/js/utility.js',
                    'http://127.0.0.1:5500/public/src/js/feed.js',
                    'http://127.0.0.1:5500/public/src/js/idb.js',
                    'http://127.0.0.1:5500/public/src/js/promise.js',
                    'http://127.0.0.1:5500/public/src/js/fetch.js',
                    'http://127.0.0.1:5500/public/src/js/material.min.js',
                    'http://127.0.0.1:5500/public/src/css/app.css',
                    'http://127.0.0.1:5500/public/src/css/feed.css',
                    '/public/src/images/main-image.jpg',
                    'https://fonts.googleapis.com/css?family=Roboto:400,700',
                    'https://fonts.googleapis.com/icon?family=Material+Icons',
                    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
                ]);
            })
    )
});


self.addEventListener('activate', function(event) {
    console.log('[Service Worker] Activating Service Worker ...', event);
    event.waitUntil(
        caches.keys()
        .then(function(keyList) {
            return Promise.all(keyList.map(function(key) {
                if(key !== CACHE_STATIC_VERSION && key !== CACHE_DINAMIC_VERSION){
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim(); // Omogućava da su sw ucitani ili aktivirani ispravno 
});

self.addEventListener('fetch', function(event) {
    var url = 'https://diplomskipwa-6bf3c.firebaseio.com/posts.json';
    if(event.request.url.indexOf(url) > -1) {
        event.respondWith(fetch(event.request)
                    .then(function(res) {
                        var copyRes = res.clone();
                        clearData('feed')
                        .then(function(){
                            return copyRes.json()       
                        })
                        .then(function(data) {
                            for(var key in data) {
                                writeData('feed', data[key]);
                            }
                        });   
                        return res;
                    })
        );
    } else {
        event.respondWith(
            caches.match(event.request)
        .then(function(response) {
            if(response) {
                return response;
            } else {
                return fetch(event.request)
                .then(function(res) {
                    return caches.open(CACHE_DINAMIC_VERSION)
                    .then(function(cache) {
                        cache.put(event.request.url, res.clone());
                        return res;
                    })
                })
                .catch(function(err) {
                    return caches.open(CACHE_STATIC_VERSION)
                    .then(function(cache) {
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return cache.match('http://127.0.0.1:5500/public/offline.html');
                        }
                    });
                });
            }
        })
        );
        
    }
    
});


// *SINKRONIZIRANJE PODATAKA U SW*
self.addEventListener('sync', function(event) {
    console.log('[Service Worker] Background syncing', event);
    if(event.tag === 'sync-new-post') {
        console.log('[Service Worker], Syncing new Posts');
        //event ceka da se dovrsi slanje podataka
        event.waitUntil(
            readData('sync-post')
            .then(function(data) {
                for(var dt of data) {
                    var postData = new FormData();
                    postData.append('id', dt.id);
                    postData.append('title', dt.title);
                    postData.append('location', dt.location);
                    postData.append('file', dt.picture, dt.id + '.png');

                    fetch('https://us-central1-diplomskipwa-6bf3c.cloudfunctions.net/storePostData', {
                        method: 'POST',
                        body: postData
                    })
                    .then(function(res) {
                        console.log('Sent data', res);
                        if(res.ok) {
                            res.json()
                            .then(function(resData) {
                                deleteItem('sync-post', dt.id);
                            });
                        }
                    })
                    .catch(function(err) {
                        console.log('Error while sending data', err);
                    });
                }
                
            })
        );       
    }
});

self.addEventListener('notificationclick', function(event) {
    var notification = event.notification;
    var action = event.action;

    console.log(notification);

    if(action === 'confirm'){
        console.log('You choose confirm');
        notification.close();
    }
    else { 
        console.log(action);
        notification.close();
    }
});

self.addEventListener('notificationclose', function(event) {
    console.log('Closed notification', event);
});

