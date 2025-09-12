#!/bin/bash

# Quick implementation script for blast radius control

echo "🛡️  Implementing Blast Radius Control..."
echo ""

# Test feature flags
echo "1️⃣  Testing Feature Flags..."
echo "   Open browser console and try:"
echo "   - FeatureFlags.logStatus() - See all flags"
echo "   - FeatureFlags.enable('calendarSync') - Enable a feature"
echo "   - FeatureFlags.disable('hotspots') - Disable a feature"
echo "   - Add ?ff_test=all to URL - Enable all features"
echo "   - Add ?ff_calendarSync=false to URL - Disable specific feature"
echo ""

# Test component sandboxing
echo "2️⃣  Testing Component Sandbox..."
echo "   In browser console:"
cat << 'EOF'
// Load a component in sandbox
const sandbox = new ComponentSandbox('test-component', {
  maxErrors: 3,
  timeout: 5000
});

// This will isolate the component
sandbox.load('/assets/js/some-component.js').then(component => {
  console.log('Component loaded safely:', component);
});
EOF
echo ""

# Test gradual rollout
echo "3️⃣  Testing Gradual Rollout..."
echo "   Feature flags support percentage rollouts:"
cat << 'EOF'
// In feature-flags.js, set rollout percentage:
rollout: {
  newFeature: 0.1  // 10% of users
}

// Check if current user is in rollout:
FeatureFlags.isEnabled('newFeature')  // true for 10% of users
EOF
echo ""

# URL testing parameters
echo "4️⃣  URL Testing Parameters:"
echo "   - ?ff_test=all - Enable all features"
echo "   - ?ff_test=none - Disable all features"
echo "   - ?ff_FEATURE=true - Enable specific feature"
echo "   - ?ff_FEATURE=false - Disable specific feature"
echo "   - ?test=true - Enable test environment"
echo "   - ?debug=true - Enable debug logging"
echo "   - ?canary=true - Enable canary features"
echo ""

# Example integration
echo "5️⃣  Example Integration in Your Code:"
cat << 'EOF'
// Before making changes, wrap them in feature flags:

// OLD (dangerous - affects everyone):
function initNewFeature() {
  // New code that might break
  doSomethingRisky();
}

// NEW (safe - controlled rollout):
function initNewFeature() {
  if (window.FeatureFlags?.isEnabled('newFeature')) {
    try {
      // New code that might break
      doSomethingRisky();
    } catch (error) {
      console.error('New feature failed:', error);
      // Fall back to old behavior
      doSomethingSafe();
    }
  } else {
    // Old stable code
    doSomethingSafe();
  }
}
EOF
echo ""

# Emergency rollback
echo "6️⃣  Emergency Rollback:"
cat << 'EOF'
// If something goes wrong in production:

// 1. Instant client-side disable:
localStorage.setItem('ff_problematicFeature', 'false');

// 2. Server-side kill switch (add to API):
app.get('/api/feature-flags', (req, res) => {
  res.json({
    killSwitches: {
      'problematicFeature': true  // Kills feature for everyone
    }
  });
});

// 3. URL override for testing fix:
// https://yourapp.com?ff_problematicFeature=false
EOF
echo ""

# Monitoring
echo "7️⃣  Monitoring Component Health:"
cat << 'EOF'
// Check component health in console:
const health = new Map();

// Track all sandboxed components
document.querySelectorAll('[data-component]').forEach(el => {
  const name = el.dataset.component;
  const hasError = el.classList.contains('error');
  health.set(name, !hasError);
});

console.table(Array.from(health.entries()));
EOF
echo ""

# Best practices
echo "📋 Best Practices Checklist:"
echo "   ✅ Always use feature flags for new features"
echo "   ✅ Test with flag ON and OFF before deploying"
echo "   ✅ Start rollout at 10% → 50% → 100%"
echo "   ✅ Monitor error rates after each increase"
echo "   ✅ Have rollback plan ready"
echo "   ✅ Use ComponentSandbox for risky components"
echo "   ✅ Test on real devices, not just desktop"
echo "   ✅ Document breaking changes"
echo ""

# Quick test
echo "🧪 Quick Test Commands:"
echo ""
echo "# Enable a feature for testing:"
echo "localStorage.setItem('ff_calendarSync', 'true');"
echo "location.reload();"
echo ""
echo "# Disable a feature:"
echo "localStorage.setItem('ff_calendarSync', 'false');"
echo "location.reload();"
echo ""
echo "# Check feature status:"
echo "FeatureFlags.getStatus();"
echo ""
echo "# Clear all overrides:"
echo "FeatureFlags.clearOverrides();"
echo "location.reload();"
echo ""

echo "✅ Blast Radius Control Ready!"
echo ""
echo "📖 Full documentation: BLAST_RADIUS_CONTROL.md"
echo "🔧 Feature Flags: frontend/src/assets/js/feature-flags.js"
echo "🔧 Component Sandbox: frontend/src/assets/js/component-sandbox.js"
echo "🔧 Examples: frontend/src/assets/js/safe-component-example.js"