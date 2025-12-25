#!/bin/bash

# Setup script for React Native conversion
# This script helps set up the native iOS and Android projects

echo "🚀 Setting up React Native Native Code..."
echo ""

# Check if React Native CLI is installed
if ! command -v react-native &> /dev/null
then
    echo "❌ React Native CLI not found. Installing..."
    npm install -g react-native-cli
fi

echo "📱 Initializing native projects..."
echo ""
echo "This will generate the iOS and Android native code directories."
echo ""

# Option 1: Use React Native CLI to generate native code
echo "Option 1: Generate native code with React Native CLI"
echo "  npx react-native init SecureAuthenticatorTemp --template react-native-template-typescript"
echo "  Then copy the 'android' and 'ios' folders to this project"
echo ""

# Option 2: Use Expo to generate native code
echo "Option 2: Use Expo to generate native code"
echo "  npm install -g expo-cli"
echo "  npx expo prebuild"
echo ""

# Recommended: Use npx to run without global installation
echo "✨ Recommended approach:"
echo ""
echo "1. Backup your current source files"
echo "2. Run: npx react-native init SecureAuthenticatorNative"
echo "3. Copy the following from SecureAuthenticatorNative to this project:"
echo "   - android/ directory"
echo "   - ios/ directory"
echo "4. Copy your converted files (App.js, src/, etc.) to SecureAuthenticatorNative"
echo "5. Update package.json dependencies"
echo "6. Run npm install"
echo ""

echo "📝 After setup, remember to:"
echo "  - Configure Google Sign-In credentials"
echo "  - Update Info.plist (iOS) for camera permissions"
echo "  - Update AndroidManifest.xml (Android) for camera permissions"
echo "  - Link native dependencies: npx react-native link"
echo ""

echo "For iOS:"
echo "  cd ios && pod install && cd .."
echo ""

echo "✅ Setup instructions complete!"
echo ""
echo "To run the app:"
echo "  npm run android  # For Android"
echo "  npm run ios      # For iOS (macOS only)"
