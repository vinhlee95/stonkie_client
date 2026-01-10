# Progressive Web App (PWA) Setup 🚀

Your Stonkie app is now a fully functional Progressive Web App! This means users can install it on their devices and use it like a native app.

## Features

✅ **Installable** - Users can install the app on their iPhone/Android home screen
✅ **Offline Support** - The app works offline with cached content
✅ **Fast Loading** - Service worker caches assets for instant loading
✅ **Native Feel** - Runs in standalone mode without browser UI
✅ **App Icons** - Custom icons for iOS and Android

## Installation Instructions

### iPhone/iPad (iOS Safari)

1. Open Safari and navigate to your Stonkie app URL
2. Tap the **Share** button (square with arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Customize the name if desired (default: "Stonkie")
5. Tap **"Add"** in the top right corner
6. The Stonkie app icon will appear on your home screen

### Android (Chrome)

1. Open Chrome and navigate to your Stonkie app URL
2. Tap the **menu** button (three dots)
3. Tap **"Add to Home screen"** or **"Install app"**
4. Tap **"Install"** in the popup
5. The Stonkie app icon will appear on your home screen

### Desktop (Chrome, Edge, Brave)

1. Open your browser and navigate to your Stonkie app URL
2. Look for the **install icon** (+) in the address bar
3. Click **"Install"**
4. The app will open in its own window

## Files Added

- **`public/manifest.json`** - Web app manifest with app metadata
- **`public/icon-192x192.png`** - App icon (192x192)
- **`public/icon-512x512.png`** - App icon (512x512)
- **`public/apple-touch-icon.png`** - iOS-specific app icon (180x180)
- **`public/offline.html`** - Offline fallback page
- **`public/sw.js`** - Service worker (auto-generated)

## Configuration

### Manifest (public/manifest.json)

Customize the PWA settings:

- `name` - Full app name
- `short_name` - Name shown under icon
- `theme_color` - Browser theme color
- `background_color` - Splash screen background
- `start_url` - Initial URL when app opens
- `display` - Display mode (standalone, fullscreen, etc.)

### Service Worker

The service worker is automatically generated during build by `next-pwa`. Configuration is in `next.config.ts`:

```typescript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})
```

### Caching Strategy

- **Precaching** - Core app assets are cached during install
- **Runtime Caching** - API calls and images are cached as used
- **Offline Fallback** - Shows offline.html when network unavailable

## Testing PWA

### Development

PWA features are disabled in development mode for easier debugging.

### Production

1. Build the app: `npm run build`
2. Start production server: `npm run start`
3. Open browser DevTools
4. Go to **Application** tab > **Manifest** to verify manifest
5. Check **Service Workers** section to see active worker
6. Test **Offline** mode using DevTools Network tab

### PWA Auditing

Use Lighthouse to audit your PWA:

1. Open Chrome DevTools
2. Go to **Lighthouse** tab
3. Select **Progressive Web App** category
4. Click **Generate report**

## Updating Icons

If you want to regenerate the icons from a different source image:

1. Replace `public/stonkie.png` with your new logo
2. Install sharp: `npm install --save-dev sharp`
3. Create and run this script:

```javascript
const sharp = require('sharp')
const sizes = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
]

sizes.forEach(async ({ size, name }) => {
  await sharp('public/stonkie.png').resize(size, size).toFile(`public/${name}`)
})
```

## Troubleshooting

### App not showing "Add to Home Screen" prompt

- Make sure you're using HTTPS (required for PWA)
- Clear browser cache and reload
- Check that manifest.json is loading correctly

### Icons not displaying

- Verify icons exist in public/ folder
- Check browser console for 404 errors
- Clear cache and rebuild: `rm -rf .next && npm run build`

### Service worker not registering

- Check browser console for errors
- Verify you're in production mode
- Check Application > Service Workers in DevTools

### Offline mode not working

- Service worker needs to cache assets first (visit pages online)
- Check cache storage in DevTools
- Verify `offline.html` exists

## Resources

- [Next-PWA Documentation](https://github.com/shadowwalker/next-pwa)
- [Web App Manifest Docs](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

## Notes

- PWA features require HTTPS in production
- iOS has some PWA limitations (no push notifications, limited storage)
- Service worker updates happen automatically on new deployments
- The app works best when accessed through the installed icon

Enjoy your native-like Stonkie app! 🚀📱
