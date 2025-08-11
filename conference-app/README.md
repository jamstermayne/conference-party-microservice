# Conference Network App

A professional PWA for gaming industry events and networking at Gamescom 2025.

## 🏗️ Architecture

### Design System
- **Jobs/Ive-inspired** design language with clean typography and minimal UI
- **Discord-inspired** dark color palette for gaming industry appeal
- **Slack-inspired** sidebar navigation with responsive mobile design
- **Inter font** for professional readability across all platforms

### Tech Stack
- **Vanilla JavaScript** ES6+ modules for performance and simplicity  
- **CSS Custom Properties** for maintainable theming
- **PWA** with service worker for offline functionality
- **Modular architecture** with clear separation of concerns

## 📁 File Structure

```
/conference-app
├── index.html                # Main entry point
├── manifest.json             # PWA configuration
├── service-worker.js         # Offline caching & sync
│
├── /assets
│   ├── /css                 # Modular stylesheet architecture
│   │   ├── reset.css        # Normalize & reset
│   │   ├── variables.css    # Design tokens
│   │   ├── layout.css       # Responsive layout
│   │   ├── components.css   # UI components  
│   │   ├── animations.css   # Micro-interactions
│   │   └── accessibility.css # A11y styles
│   │
│   ├── /js                  # ES6 modules
│   │   ├── app.js          # Core controller
│   │   ├── parties.js      # Event discovery
│   │   ├── api.js          # API client
│   │   └── ui.js           # UI helpers
│   │
│   ├── /images             # Assets
│   └── /icons              # PWA icons
│
└── /data
    └── parties.json         # Event data
```

## 🚀 Features

### Core Functionality
- **Party Discovery**: Browse and select gaming industry events
- **Calendar Sync**: Google, Apple, Outlook integration
- **Invite System**: Exclusive VIP event access
- **Profile Management**: Professional networking profiles
- **PWA Support**: Installable, offline-capable

### User Experience
- **Mobile-first** responsive design
- **Accessibility** compliant (WCAG 2.1 AA)
- **Performance** optimized with lazy loading and caching
- **Offline** functionality with background sync

### Technical Features
- **Service Worker** for offline caching
- **Background Sync** for data persistence
- **Push Notifications** for invite alerts
- **Local Storage** fallback for offline data
- **API Integration** with fallback handling

## 🔧 Development

### Getting Started
```bash
# Serve locally
python3 -m http.server 3000
# or
npx serve .
```

### Integration Points
- **Backend API**: `/api/*` endpoints for data sync
- **Calendar APIs**: Google, Apple, Outlook integration
- **Push Service**: For notification delivery
- **Analytics**: Event tracking and user insights

### Performance
- **Lazy Loading**: Images and non-critical resources
- **Code Splitting**: ES6 modules for selective loading  
- **Caching Strategy**: Cache-first for static assets, network-first for data
- **Bundle Size**: < 100KB total (optimized for mobile)

## 📱 PWA Features

### Installation
- **Install prompts** on supported browsers
- **App shortcuts** for quick access
- **Standalone display** mode for native feel

### Offline Support
- **Core functionality** works offline
- **Background sync** when connection restored
- **Cached API responses** for critical data

### Mobile Optimization
- **Touch targets** meet accessibility standards
- **Gesture support** for navigation
- **Safe area** handling for modern devices

## 🎨 Design System

### Color Palette
```css
--bg-primary: #1B1D21        /* Dark background */
--bg-secondary: #23272A      /* Elevated surfaces */
--accent-primary: #00AFF4     /* Blue accent */
--accent-secondary: #5865F2   /* Purple accent */
--text-primary: #FFFFFF       /* Primary text */
```

### Typography
```css
--font-stack: 'Inter'         /* Primary font */
--font-size-2xl: 1.5rem      /* Headers */
--font-size-base: 1rem       /* Body text */
--font-weight-semibold: 600   /* Emphasis */
```

## 🔌 API Integration

### Endpoints
- `GET /api/parties` - Fetch event list
- `POST /api/parties/save` - Save user selections
- `GET /api/invites` - User's exclusive invites
- `POST /api/calendar/sync` - Calendar integration

### Error Handling
- **Graceful degradation** to local data
- **Retry mechanisms** with exponential backoff
- **User feedback** for network issues

## 📊 Analytics & Monitoring

### Key Metrics
- **User engagement** with event selection
- **Calendar sync** completion rates  
- **PWA installation** metrics
- **Performance** monitoring (Core Web Vitals)

### Privacy
- **No personal data** stored without consent
- **GDPR compliant** data handling
- **Optional analytics** with clear opt-out

---

**Ready for production deployment** ✅  
**Responsive across all devices** ✅  
**Accessibility compliant** ✅  
**Performance optimized** ✅