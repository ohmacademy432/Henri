// Web Push handler — appended to the Workbox-generated service worker.
// vite-plugin-pwa registers this file via importScripts.

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "Henri", body: event.data && event.data.text ? event.data.text() : "" }; }
  const title = data.title || "Henri";
  const body  = data.body  || "";
  const url   = data.url   || "/today";
  const opts = {
    body,
    icon: data.icon  || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    data: { url },
    tag: data.tag || "henri-default",
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/today";
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      if ('focus' in client) {
        client.focus();
        if ('navigate' in client) client.navigate(url);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
