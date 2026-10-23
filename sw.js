/* Retire the old editor worker; IndexedDB projects and licenses remain untouched. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{await self.clients.claim();await self.registration.unregister();})()));
