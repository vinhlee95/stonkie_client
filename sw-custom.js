// Custom service worker configuration for Stonkie PWA
// This file can be used to extend the default next-pwa behavior

// Cache-first strategy for static assets
// Network-first strategy for API calls
// This is handled automatically by next-pwa's workbox configuration

// Listen for SKIP_WAITING message from the app to activate waiting service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// You can add custom event listeners here if needed:
// self.addEventListener('push', (event) => {
//   // Handle push notifications (iOS doesn't support this yet)
// });

// self.addEventListener('sync', (event) => {
//   // Handle background sync
// });

// Export empty object to make this a valid module
export {}
