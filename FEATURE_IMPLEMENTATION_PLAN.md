# Feature Implementation Plan - Systematic Approach

## 🏗️ Architecture Principles

### 1. **Trunk-Based Development**
- Work on `main` branch (protected)
- Short-lived branches (<1 day)
- Feature flags for incomplete work
- Immediate integration

### 2. **Feature Flag Strategy**
```javascript
// frontend/src/assets/js/feature-flags.js
window.FeatureFlags = {
  flags: {
    // Core features (always on)
    'hero_landing': true,
    'smart_onboarding': true,
    'events_list': true,
    'hotspots': true,

    // Progressive rollout
    'sidebar_navigation': false,  // Turn on when fixed
    'account_hub': false,         // Enable after sidebar
    'messaging_system': false,    // Needs UI entry
    'calendar_integration': false,// Ready but hidden
    'invite_system': false,       // Deep links work
    'activity_feed': false,       // Needs triggers
    'magic_auth': false,          // Complete system
    'proximity_networking': false // Needs permissions
  }
};
```

## 📋 Implementation Order (Priority)

### **Phase 1: Fix Navigation (Day 1)**
```bash
git checkout -b fix/navigation-foundation
```
- [ ] Fix sidebar controller stability
- [ ] Wire router to all panels
- [ ] Test all navigation paths
- [ ] Merge immediately

### **Phase 2: Expose Hidden Features (Day 2-3)**
```bash
# Do these IN ORDER on main branch
```

#### 2.1 Account Hub
```javascript
// Add to router
'/account': () => import('./account-panel.js'),
// Add nav item
<button data-nav="account">Profile</button>
```

#### 2.2 Calendar Panel
```javascript
// Add to router
'/calendar': () => import('./calendar-panel.js'),
// Add nav item
<button data-nav="calendar">Calendar</button>
```

#### 2.3 Messaging UI
```javascript
// Add floating button or nav item
'/messages': () => import('./messaging-system.js'),
```

#### 2.4 Invite System
```javascript
// Add to account or as modal
'/invites': () => import('./invites-panel.js'),
```

### **Phase 3: Activate Features (Day 4)**
```bash
# On main branch with feature flags
```

- [ ] Enable activity feed triggers
- [ ] Add proximity permissions prompt
- [ ] Wire magic auth buttons
- [ ] Test offline mode fully

## 🛠️ Working Rules

### **1. Branch Naming**
```bash
fix/[specific-issue]      # Bug fixes
enable/[feature-name]     # Activating built features
expose/[hidden-feature]   # Making features visible
improve/[enhancement]     # Optimizations
```

### **2. Commit Standards**
```bash
# Atomic commits
git add frontend/src/assets/js/sidebar-controller.js
git commit -m "fix: stabilize sidebar navigation persistence"

# Feature flag commits
git add frontend/src/assets/js/feature-flags.js
git commit -m "enable: account hub feature flag"
```

### **3. Testing Protocol**
```bash
# Before EVERY commit
npm test                    # Run tests
npm run firebase:health     # Check APIs
npm run dev                 # Manual test locally

# Before merge
npm run build              # Ensure builds
```

### **4. Daily Workflow**
```bash
# Morning
git pull origin main
git checkout -b fix/todays-issue

# Work for 2-4 hours max
# Small, focused changes

# Test thoroughly
npm test && npm run dev

# Push and PR
git push origin fix/todays-issue
gh pr create --title "Fix: sidebar navigation" --body "Fixes #123"

# Merge same day
gh pr merge --squash
git checkout main
git pull
```

## 📊 Tracking System

### **Feature Status Board**
Create `FEATURE_STATUS.md`:

```markdown
| Feature | Built | Wired | Tested | Flagged | Live |
|---------|-------|-------|--------|---------|------|
| Sidebar | ✅ | 🔧 | ⏳ | ❌ | ❌ |
| Account | ✅ | ❌ | ⏳ | ❌ | ❌ |
| Calendar| ✅ | ❌ | ⏳ | ❌ | ❌ |
| Messages| ✅ | ❌ | ⏳ | ❌ | ❌ |
| Invites | ✅ | ❌ | ⏳ | ❌ | ❌ |
```

Update after each merge.

### **Testing Checklist**
For each feature activation:

```bash
#!/bin/bash
# save as test-feature.sh

FEATURE=$1
echo "Testing feature: $FEATURE"

# 1. Check feature flag
grep "$FEATURE" frontend/src/assets/js/feature-flags.js

# 2. Test locally
npm run dev &
sleep 3
curl http://localhost:3000/api/health

# 3. Check routes
grep -r "data-nav=\"$FEATURE\"" frontend/

# 4. Run tests
npm test

# 5. Build check
npm run build

echo "✅ Feature $FEATURE ready"
```

## 🚀 Deployment Strategy

### **Progressive Rollout**
```javascript
// Start with feature flags OFF in production
if (window.location.hostname === 'localhost') {
  // All features ON for development
  Object.keys(FeatureFlags.flags).forEach(key => {
    FeatureFlags.flags[key] = true;
  });
}

// Production rollout
if (window.location.search.includes('beta=true')) {
  // Beta users get new features
  FeatureFlags.flags.sidebar_navigation = true;
  FeatureFlags.flags.account_hub = true;
}
```

### **Monitoring**
```javascript
// Add to each feature
if (FeatureFlags.isEnabled('account_hub')) {
  console.log('[Feature] Account Hub loaded');
  // Track usage
  fetch('/api/metrics', {
    method: 'POST',
    body: JSON.stringify({ feature: 'account_hub', action: 'loaded' })
  });
}
```

## 🔥 Quick Start Commands

```bash
# Start fresh each day
git checkout main
git pull
npm install
npm test

# Create today's fix branch
git checkout -b fix/sidebar-stability

# Work and test
npm run dev
# Make changes
npm test

# Quick PR and merge
gh pr create --fill
gh pr merge --squash

# Deploy
npm run deploy
```

## 📈 Success Metrics

Track weekly:
- Features activated: X/10
- Tests passing: X/X
- API uptime: 99.X%
- User engagement: Track with metrics API
- Bug reports: Should decrease

## 🎯 End Goal

All features accessible via:
1. Clear navigation (sidebar/nav)
2. Feature flags (gradual rollout)
3. Proper routing (hash-based)
4. Mobile-first UI
5. Offline support

---

**Remember**: Small changes, merge daily, feature flags for safety!