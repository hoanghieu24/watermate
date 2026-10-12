import { createApp } from 'vue';
import './style.css';
import App from './App.vue';

// Prevent iOS Safari double-tap zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// Prevent pinch-to-zoom on iOS Safari
document.addEventListener('gesturestart', (e) => {
  e.preventDefault();
});

// Auto reload when a new service worker version is detected and takes control
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });

  // Force update check
  navigator.serviceWorker.ready.then((reg) => {
    reg.update().catch(() => {});
  });
}

createApp(App).mount('#app');
