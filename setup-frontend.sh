#!/bin/bash

echo "🚀 Setting up frontend structure..."

# Copy existing files from public to frontend/src
echo "📦 Copying existing assets..."
cp -r /workspaces/conference-party-microservice/public/* /workspaces/conference-party-microservice/frontend/src/ 2>/dev/null || true

# Ensure icons exist
echo "🎨 Ensuring icons exist..."
if [ ! -f /workspaces/conference-party-microservice/frontend/src/assets/images/icon-192.png ]; then
  cp /workspaces/conference-party-microservice/public/assets/icons/icon-192.png /workspaces/conference-party-microservice/frontend/src/assets/images/icon-192.png 2>/dev/null || \
  touch /workspaces/conference-party-microservice/frontend/src/assets/images/icon-192.png
fi

if [ ! -f /workspaces/conference-party-microservice/frontend/src/assets/images/icon-512.png ]; then
  cp /workspaces/conference-party-microservice/public/assets/icons/icon-512.png /workspaces/conference-party-microservice/frontend/src/assets/images/icon-512.png 2>/dev/null || \
  touch /workspaces/conference-party-microservice/frontend/src/assets/images/icon-512.png
fi

# Copy foundation files from public if they exist
echo "📁 Setting up foundation..."
mkdir -p /workspaces/conference-party-microservice/frontend/src/assets/js/foundation

# Copy existing foundation files
for file in events.js store.js router.js http.js logger.js metrics.js featureFlags.js actionDelegate.js app-bootstrap.js sw-register.js; do
  if [ -f "/workspaces/conference-party-microservice/public/assets/js/foundation/$file" ]; then
    cp "/workspaces/conference-party-microservice/public/assets/js/foundation/$file" "/workspaces/conference-party-microservice/frontend/src/assets/js/foundation/$file"
  elif [ -f "/workspaces/conference-party-microservice/public/assets/js/$file" ]; then
    cp "/workspaces/conference-party-microservice/public/assets/js/$file" "/workspaces/conference-party-microservice/frontend/src/assets/js/foundation/$file"
  elif [ -f "/workspaces/conference-party-microservice/public/js/$file" ]; then
    cp "/workspaces/conference-party-microservice/public/js/$file" "/workspaces/conference-party-microservice/frontend/src/assets/js/foundation/$file"
  fi
done

# Copy UI and feature files
echo "📁 Setting up UI and feature files..."
mkdir -p /workspaces/conference-party-microservice/frontend/src/assets/js/ui

# Copy controllers and views
for file in events-controller.js calendar-integration.js install.js invite.js auth.js; do
  if [ -f "/workspaces/conference-party-microservice/public/js/$file" ]; then
    target_name=$(echo $file | sed 's/-integration//g' | sed 's/install/pwa-install/g' | sed 's/invite/invite-deeplink/g')
    cp "/workspaces/conference-party-microservice/public/js/$file" "/workspaces/conference-party-microservice/frontend/src/assets/js/$target_name"
  fi
done

# Rename calendar-integration to calendar-view
if [ -f "/workspaces/conference-party-microservice/frontend/src/assets/js/calendar.js" ]; then
  mv "/workspaces/conference-party-microservice/frontend/src/assets/js/calendar.js" "/workspaces/conference-party-microservice/frontend/src/assets/js/calendar-view.js"
fi

echo "✅ Frontend structure ready!"
echo "📝 Next: Create remaining CSS and JS files, update index.html"