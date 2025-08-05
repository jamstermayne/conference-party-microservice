# 🎯 CONFERENCE PARTY APP - MASTER PLAN

## 🚀 PRODUCT VISION
**PROBLEM:** Conference attendees don't know what parties to attend
**SOLUTION:** Tinder-style party discovery with calendar integration
**TARGET:** Gamescom 2025 (viral sharing via personal links)

## 📱 USER ONBOARDING FLOW (AGREED)
1. **User receives personal link** → clicks it
2. **Immediate swipe cards** → "2025 Gamescom Parties - Swipe right for ones you like"
3. **Intuitive swiping** (no tutorial needed)
4. **PWA install prompt** appears naturally after engagement

## 🏗️ DEVELOPMENT STAGES (AGREED SEQUENCE)
### STAGE 1: Core Discovery
- CSV upload system (parties stored in Firestore)
- Swipeable cards frontend (PWA)
- Calendar view integration
- User swipe tracking (liked/passed)

### STAGE 2: Social Sharing
- Party link generation/sharing
- "Be in the know" social currency features

### STAGE 3: Live Activity
- Google Maps integration
- Heat maps showing where people are
- Friend location features

## 🔧 NEXT DEVELOPMENT SEQUENCE (START HERE)
1. **CSV Upload System** - Replace fallback data with real Gamescom parties
2. **Swipeable Cards Frontend** - Build PWA with touch mechanics
3. **User Swipe Tracking** - Store preferences per user
4. **Calendar Integration** - Complete OAuth flow

## ✅ WORKING TECHNICAL FOUNDATION
**Production URLs (DO NOT BREAK):**
- https://health-x2u6rwndvq-uc.a.run.app
- https://partiesfeed-x2u6rwndvq-uc.a.run.app
- https://handleswipe-x2u6rwndvq-uc.a.run.app
- https://calendaroauthstart-x2u6rwndvq-uc.a.run.app

**Architecture:** Multiple Firebase Functions (NOT single function with routing)
**File:** functions/src/index.ts (working backup: functions/src/index.ts.WORKING-BACKUP)

## 🚨 NEVER DO (LESSONS FROM PREVIOUS CLAUDES)
- ❌ Create src/services/ folders (causes compilation errors)
- ❌ Split index.ts into fragments
- ❌ Create tools that writeFileSync to core files
- ❌ Build elaborate social networks before core features work
- ❌ Create tool bloat instead of product features
- ❌ Assume complex UX flows - keep it simple

## 💡 KEY PRODUCT INSIGHTS
- **Viral Distribution:** Personal links shared 1:1 and 1:many
- **No App Store:** Every onboarding step must be crystal clear
- **Mobile-First:** PWA with offline functionality
- **Instant Value:** Show parties immediately, no barriers
