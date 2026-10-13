/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// Clean up old caches and precache build assets
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Immediately take control
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Real Web Push Notification Listener
self.addEventListener('push', (event) => {
  let data = {
    title: 'WaterMate - Đến giờ uống nước!',
    body: '💧 Uống một ngụm nước để giữ năng lượng cho cơ thể nhé!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    url: '/',
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = { ...data, ...json };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const options: NotificationOptions & { [key: string]: any } = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-192.png',
    data: { url: data.url || '/' },
    tag: `watermate-${Date.now()}`,
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options).then(() => {
      // Notify active clients to show in-app notification if foreground, and refresh logs
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          const isEvent = data.url && data.url.includes('tab=events');
          client.postMessage({
            type: isEvent ? 'EVENT_PUSH_RECEIVED' : 'PUSH_RECEIVED',
            title: data.title,
            body: data.body,
            url: data.url,
          });
        }
      });
    })
  );
});

// Handle notification tap / click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'REFRESH_LOGS', url: targetUrl });
          if (targetUrl.includes('tab=events')) {
            client.postMessage({ type: 'OPEN_TAB', tab: 'events' });
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
