/**
 * MSW Browser Worker Setup - Bundled Version
 * This file is bundled by esbuild into assets/msw-worker.js
 * Only initializes on localhost/127.0.0.1 to ensure ZERO production impact
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers.js';

/**
 * Check if current hostname is local development
 * @returns {boolean}
 */
function isLocalhost() {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.local')
  );
}

// Only create and start worker on localhost
let worker = null;

if (isLocalhost()) {
  worker = setupWorker(...handlers);

  worker.start({
    // Don't warn about unhandled requests (e.g., assets, other API calls)
    onUnhandledRequest: 'bypass',
    // Service worker file location (copied to project root by build.js for full scope)
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  }).then(() => {
    console.log('[MSW] Mock Service Worker started on localhost');
    console.log('[MSW] Intercepting POST /submit-inquiry');
  }).catch((error) => {
    console.warn('[MSW] Failed to start worker:', error.message);
  });
} else {
  console.log('[MSW] Production environment detected - mock worker not started');
}

// Export for potential debugging (will be bundled away in IIFE)
export { worker };
export { isLocalhost };