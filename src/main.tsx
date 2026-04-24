import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '::1';

if ('serviceWorker' in navigator) {
  if (isLocalhost) {
    // In local/dev runs, stale SW cache can serve old bundles and cause phantom 503 responses.
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {});
        });
      });
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            caches.delete(key).catch(() => {});
          });
        });
      }
    });
  } else {
    // Register Service Worker for PWA in non-local environments.
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed silently
      });
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
