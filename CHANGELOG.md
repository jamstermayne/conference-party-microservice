# Changelog

## [2.6.0] - 2025-08-12

### Polish Sprint - Frontend Fixes Batch 1

#### 🐛 Bug Fixes

**Sidebar & Navigation**
- `fix(ui/sidebar)`: Removed duplicate hash symbols in navigation labels
  - Single hash display (#parties, #hotspots, etc.)
  - Clean label rendering without bleed into header
  - Stable render on page load

**Router & Title Management**
- `fix(router)`: Safe route title handling with proper type coercion
  - Handles string and object payloads gracefully
  - Removed duplicate header tag updates
  - Fixed chip display logic

**Events Controller**
- `fix(events)`: Added resilient error handling
  - Try/catch wrapper around render logic
  - Graceful fallback UI on errors
  - Console logging for debugging

#### ✨ New Features

**Events Cards**
- `feat(events)`: Uniform card layout with per-card Save & Sync
  - Consistent card heights (min-height: 220px)
  - Flexbox layout for proper alignment
  - Per-card action buttons (RSVP, Save, Save & Sync, Open)
  - Premium gradient styling with sheen effects

**Hotspots Section**
- `feat(hotspots)`: Professional empty state
  - Clear messaging: "Live heat isn't available yet"
  - Refresh CTA button
  - Centered layout with icon
  - Explanatory text about future functionality

**Account Hub**
- `feat(account)`: Complete account section (read-only)
  - Profile card with email, phone, company fields
  - Invites statistics (sent, redeemed, remaining)
  - Auth buttons for Google and LinkedIn sign-in
  - Responsive grid layout
  - Inline styles for immediate rendering

#### 🔧 Technical Improvements

- Removed hot-reload server and simplified dev setup
- Cleaned up unused dev-accelerator.js
- Updated package.json dev scripts to use Python's simple server
- Fixed module imports and exports consistency
- Added proper error boundaries in render functions

#### 📦 Files Modified

**JavaScript**
- `frontend/src/js/router.js` - Fixed sidebar rendering and navigation
- `frontend/src/js/route-title.js` - Safe type handling for route names
- `frontend/src/js/app-wireup.js` - Removed duplicate chip updates
- `frontend/src/js/events-controller.js` - Added error handling
- `frontend/src/js/hotspots-controller.js` - Complete empty state implementation
- `frontend/src/js/account.js` - New account hub implementation

**CSS**
- `frontend/src/css/events-cards.css` - Uniform card styling
- Various inline styles for immediate component rendering

**Configuration**
- `package.json` - Simplified dev scripts
- `CLAUDE.md` - Updated development instructions

#### 🚀 Deployment

- **Live URL**: https://conference-party-app.web.app
- **Build Size**: 315 files
- **Service Worker**: 43KB optimized
- **Offline Events**: 58 cached

#### 📝 Commit History

1. `fix(ui/sidebar): stable render + single-hash labels`
2. `fix(router): safe route title + remove duplicate header tag`
3. `fix(events): syntax error + resilient render`
4. `feat(events): per-card Save&Sync + uniform card polish`
5. `feat(hotspots): friendly empty state`
6. `feat(account): initial account hub (read-only, auth buttons)`

---

## [2.5.0] - 2025-08-12 (Earlier)

### Production Release - Premium UI & Account Hub

See RELEASE_NOTES.md for details.

---

## [2.4.0] - 2025-08-11

### Previous releases...

*For complete history, see git log*