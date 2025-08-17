# Party Discovery System 🎉

A delightful party search, calendar save, and map location experience for the conference party app. This system provides a modern, intuitive interface for discovering, filtering, and managing party events with seamless calendar integration and interactive maps.

## ✨ Features

### 🔍 **Smart Search & Filtering**
- **Instant Search**: Real-time search with debouncing for optimal performance
- **Intelligent Suggestions**: Auto-complete with venue, event, and recent search suggestions
- **Advanced Filters**: Filter by date, venue, price (free/paid), and event type
- **Quick Filters**: One-click filters for today, tomorrow, free events, etc.
- **Empty States**: Helpful guidance when no results are found

### 📅 **Enhanced Calendar Integration**
- **Multi-Platform Support**: Google Calendar, Apple Calendar, Outlook, and ICS download
- **Conflict Detection**: Warns about scheduling conflicts with existing events
- **Event Preview**: Rich preview with venue, time, and description
- **Custom Reminders**: Configurable reminder options (15 min, 1 hour, 1 day)
- **Success/Error Handling**: Clear feedback for all calendar operations

### 🗺️ **Interactive Map Discovery**
- **Custom Markers**: Beautiful custom markers showing event count per venue
- **Smart Clustering**: Groups nearby venues for better visibility
- **Venue Information**: Rich info windows with event details and actions
- **List/Map Toggle**: Seamless switching between map and list views
- **Distance Calculation**: Shows distance from user's location
- **Google Maps Integration**: Directions and navigation support

### 📋 **Personal Schedule Management**
- **Event Bookmarking**: Save events to personal schedule
- **Timeline View**: Organized timeline showing saved events by date
- **Schedule Export**: Export entire schedule as ICS calendar file
- **Share Functionality**: Share schedule with others
- **Statistics Dashboard**: Track saved events and schedule density

### 🎨 **Modern Design System**
- **Glass Morphism**: Translucent surfaces with backdrop blur effects
- **Dark Theme**: Professional dark interface optimized for extended use
- **Smooth Animations**: Micro-interactions and transitions for delightful UX
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: Full keyboard navigation, screen reader support, high contrast mode

## 🚀 Quick Start

### 1. Include Required Files

Add the CSS files to your HTML:

```html
<!-- Core styles -->
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/cards-modern.css">

<!-- Discovery system styles -->
<link rel="stylesheet" href="/assets/css/party-search.css">
<link rel="stylesheet" href="/assets/css/calendar-enhanced.css">
<link rel="stylesheet" href="/assets/css/map-discovery.css">
<link rel="stylesheet" href="/assets/css/party-discovery.css">
```

### 2. Add Container Element

```html
<div id="party-discovery-container"></div>
```

### 3. Initialize the System

```javascript
import { PartyDiscoverySystem } from './assets/js/party-discovery.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('party-discovery-container');
  const discoverySystem = new PartyDiscoverySystem();
  
  const initialized = await discoverySystem.initialize(container);
  if (initialized) {
    console.log('Party Discovery System ready!');
  }
});
```

### 4. Google Maps API (Optional)

For map functionality, include Google Maps API:

```html
<script async defer 
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=geometry">
</script>
```

## 📖 Usage Examples

### Basic Integration

```javascript
import { PartyDiscoverySystem } from './party-discovery.js';

const discoverySystem = new PartyDiscoverySystem();
await discoverySystem.initialize(document.getElementById('container'));
```

### Using Individual Components

```javascript
// Search only
import { PartySearchEngine, PartySearchUI } from './party-search.js';

const searchEngine = new PartySearchEngine();
await searchEngine.initialize();

const searchUI = new PartySearchUI(searchEngine);
searchUI.render(document.querySelector('.search-container'));

// Calendar only
import { CalendarIntegration } from './calendar-enhanced.js';

const calendar = new CalendarIntegration();
calendar.initialize();
calendar.show(eventData);

// Map only
import { MapDiscovery } from './map-discovery.js';

const map = new MapDiscovery();
await map.initialize(container, events);
```

### Programmatic API

```javascript
// Search for events
window.PartyDiscoveryAPI.search('rooftop party');

// Switch views
window.PartyDiscoveryAPI.switchView('map');

// Get saved events
const savedEvents = window.PartyDiscoveryAPI.getSavedEvents();

// Export schedule
window.PartyDiscoveryAPI.exportSchedule();
```

## 🎛️ Configuration

### Search Configuration

```javascript
const searchEngine = new PartySearchEngine();
searchEngine.filters = {
  search: '',
  date: '2025-08-20',
  venue: 'Convention Center',
  price: 'free',
  type: 'networking'
};
```

### Calendar Configuration

```javascript
const calendar = new CalendarIntegration();
calendar.reminderSettings = [15, 60, 1440]; // 15 min, 1 hour, 1 day
```

### Map Configuration

```javascript
const map = new MapDiscovery();
// Custom map styling and clustering options available
```

## 🎨 Customization

### CSS Custom Properties

```css
:root {
  /* Core colors */
  --color-bg: #12151b;
  --color-surface: #0b0f14;
  --color-text: #e8ecf1;
  --color-accent: #6b7bff;
  
  /* Spacing */
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px;
  
  /* Transitions */
  --transition-fast: 200ms cubic-bezier(.2,.7,.2,1);
  --transition-panel: 320ms cubic-bezier(.2,.7,.2,1);
}
```

### Custom Event Handlers

```javascript
// Listen for system events
document.addEventListener('venue-selected', (event) => {
  console.log('Venue selected:', event.detail.venue);
});

document.addEventListener('party-saved', (event) => {
  console.log('Event saved:', event.detail);
});

document.addEventListener('calendar-added', (event) => {
  console.log('Event added to calendar:', event.detail);
});
```

## 📱 Mobile Optimization

The system is fully responsive with mobile-specific optimizations:

- **Touch-friendly**: Large touch targets and gesture support
- **Adaptive Layout**: Single-column layouts on small screens
- **Bottom Navigation**: Accessible tab navigation on mobile
- **Optimized Maps**: Mobile-optimized map controls and interactions

## ♿ Accessibility Features

- **Keyboard Navigation**: Full keyboard support with logical tab order
- **Screen Reader Support**: Proper ARIA labels and semantic markup
- **High Contrast Mode**: Enhanced visibility for accessibility needs
- **Reduced Motion**: Respects user's motion preferences
- **Focus Management**: Clear focus indicators and logical flow

## 🔧 Browser Support

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **ES6 Modules**: Native module support required
- **CSS Features**: CSS Grid, Flexbox, Custom Properties
- **JavaScript APIs**: Fetch, Local Storage, Geolocation (optional)

## 📊 Performance

- **Lazy Loading**: Components load on demand
- **Debounced Search**: Optimized search with 150ms debounce
- **Virtual Scrolling**: Efficient rendering of large result sets
- **Image Optimization**: Responsive images with proper sizing
- **Bundle Size**: ~45KB gzipped for complete system

## 🧪 Testing

### Manual Testing

1. **Search Functionality**:
   - Type in search box → See instant results
   - Apply filters → Results update accordingly
   - Clear search → All events shown

2. **Calendar Integration**:
   - Click "Add to Calendar" → Modal opens
   - Select platform → Opens calendar app/downloads file
   - Check conflict detection → Shows warnings for overlapping events

3. **Map Functionality**:
   - Switch to map view → See venue markers
   - Click marker → Info window opens
   - Toggle list view → Shows venue list with distances

4. **Schedule Management**:
   - Bookmark events → Shows in "My Schedule"
   - Export schedule → Downloads ICS file
   - Share schedule → Creates shareable link

### API Testing

```javascript
// Test search engine
const results = await searchEngine.search('networking', { price: 'free' });
console.log('Search results:', results);

// Test calendar integration
calendar.show(eventData);

// Test map functionality
map.updateEvents(newEventList);
```

## 🔮 Future Enhancements

- **Advanced Filtering**: Category-based filters, price ranges
- **Social Features**: Event ratings, reviews, attendee lists
- **Offline Support**: Cached events for offline browsing
- **Push Notifications**: Reminder notifications for saved events
- **AI Recommendations**: Machine learning-powered event suggestions

## 📝 API Reference

### PartyDiscoverySystem

Main controller class that orchestrates all components.

#### Methods

- `initialize(container)` - Initialize the complete system
- `switchView(viewName)` - Navigate between search/map/schedule views
- `getSavedEvents()` - Get array of bookmarked event IDs
- `addEvent(eventId)` - Programmatically save an event
- `removeEvent(eventId)` - Remove event from schedule

### PartySearchEngine

Handles search functionality and data management.

#### Methods

- `initialize()` - Load party data and build search index
- `search(query, filters)` - Search with debouncing
- `getSuggestions(query)` - Get search suggestions
- `getFilterStats()` - Get counts for filter options

### CalendarIntegration

Manages calendar functionality with multi-platform support.

#### Methods

- `initialize()` - Set up calendar modal and events
- `show(event)` - Display calendar modal for event
- `isEventSaved(eventId)` - Check if event is in user's calendar

### MapDiscovery

Interactive map with venue clustering and information.

#### Methods

- `initialize(container, events)` - Set up map with events
- `updateEvents(events)` - Update map with new event data
- `centerOnVenue(venueId)` - Focus map on specific venue

## 🤝 Contributing

1. **Code Style**: Follow existing patterns and use consistent naming
2. **Testing**: Test on multiple devices and browsers
3. **Documentation**: Update README for any new features
4. **Performance**: Consider impact on bundle size and runtime performance

## 📄 License

This party discovery system is part of the Conference Party Microservice project. See the main project LICENSE file for details.

---

**Built with ❤️ for the gaming community at Gamescom 2025**