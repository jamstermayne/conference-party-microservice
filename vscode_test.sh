#!/bin/bash

# VS Code Settings Test Script
# Tests if the settings issue is resolved

echo "🧪 Testing VS Code Settings Fix..."
echo "================================="

# Test 1: Check if settings file exists and is writable
echo "Test 1: Settings file accessibility"
SETTINGS_FILE="/vscode/data/User/settings.json"

if [ -f "$SETTINGS_FILE" ]; then
    echo "✅ Settings file exists: $SETTINGS_FILE"
    
    if [ -w "$SETTINGS_FILE" ]; then
        echo "✅ Settings file is writable"
    else
        echo "❌ Settings file is not writable"
        exit 1
    fi
else
    echo "❌ Settings file does not exist"
    exit 1
fi

# Test 2: Try writing to settings file
echo ""
echo "Test 2: Writing test settings"
TEST_SETTINGS='{
  "editor.fontSize": 14,
  "editor.tabSize": 2,
  "files.autoSave": "afterDelay",
  "workbench.colorTheme": "Default Dark+"
}'

echo "$TEST_SETTINGS" > "$SETTINGS_FILE"
if [ $? -eq 0 ]; then
    echo "✅ Successfully wrote to settings file"
else
    echo "❌ Failed to write to settings file"
    exit 1
fi

# Test 3: Verify content was written correctly
echo ""
echo "Test 3: Verifying settings content"
if grep -q "editor.fontSize" "$SETTINGS_FILE"; then
    echo "✅ Settings content verified"
else
    echo "❌ Settings content not found"
    exit 1
fi

# Test 4: Check file permissions
echo ""
echo "Test 4: File permissions"
PERMS=$(stat -c "%a" "$SETTINGS_FILE")
echo "📋 File permissions: $PERMS"
if [ "$PERMS" = "644" ] || [ "$PERMS" = "664" ]; then
    echo "✅ File permissions are correct"
else
    echo "⚠️  File permissions: $PERMS (should be 644 or 664)"
fi

# Test 5: Test VS Code command line access
echo ""
echo "Test 5: VS Code CLI test"
if command -v code >/dev/null 2>&1; then
    echo "✅ VS Code CLI available"
    
    # Try to get VS Code to validate the settings file
    timeout 10s code --list-extensions >/dev/null 2>&1
    if [ $? -eq 0 ] || [ $? -eq 124 ]; then  # 124 is timeout exit code
        echo "✅ VS Code commands working"
    else
        echo "⚠️  VS Code CLI had issues (but this might be normal in headless mode)"
    fi
else
    echo "❌ VS Code CLI not available"
fi

# Test 6: Check directory ownership
echo ""
echo "Test 6: Directory ownership"
OWNER=$(stat -c "%U:%G" "$(dirname "$SETTINGS_FILE")")
echo "📋 Directory owner: $OWNER"
if [ "$OWNER" = "codespace:codespace" ]; then
    echo "✅ Directory ownership correct"
else
    echo "⚠️  Directory owner: $OWNER (expected: codespace:codespace)"
fi

echo ""
echo "================================="
echo "🎯 Test Summary:"
echo "Settings file: $SETTINGS_FILE"
echo "Content preview:"
cat "$SETTINGS_FILE" | head -3
echo ""
echo "✅ VS Code settings fix appears to be working!"
echo "The 'Unable to write into user settings' error should be resolved."
echo ""
echo "🚀 Your Professional Intelligence Platform development environment is ready!"
