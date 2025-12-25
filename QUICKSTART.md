# Quick Start Guide - React Native App

## Prerequisites

Before you start, ensure you have:

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **React Native CLI**: `npm install -g react-native-cli`

### For iOS Development:
- **macOS** (required for iOS development)
- **Xcode** (latest version from App Store)
- **CocoaPods**: `sudo gem install cocoapods`

### For Android Development:
- **Android Studio** with Android SDK
- **Java Development Kit (JDK)** 11 or newer
- Configure `ANDROID_HOME` environment variable

## Installation Steps

### 1. Clone and Install

```bash
git clone https://github.com/B-A-L-A123/Secure-Authenticator-App.git
cd Secure-Authenticator-App
npm install
```

### 2. Generate Native Code

Since this is a converted project, you need to generate the native iOS and Android code.

**Option A: Using React Native CLI**

```bash
# Create a temporary React Native project
npx react-native init SecureAuthTemp

# Copy the android and ios folders to this project
cp -r SecureAuthTemp/android ./
cp -r SecureAuthTemp/ios ./

# Clean up temp project
rm -rf SecureAuthTemp
```

**Option B: Using Expo (Recommended)**

```bash
# Install Expo CLI
npm install -g expo-cli

# Initialize Expo
npx expo init

# Generate native code
npx expo prebuild
```

### 3. Install iOS Dependencies (macOS only)

```bash
cd ios
pod install
cd ..
```

### 4. Configure Google Sign-In

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Sign-In API
4. Create OAuth 2.0 credentials:
   - **Web Client ID**: For authentication
   - **iOS Client ID**: For iOS app
   - **Android Client ID**: For Android app

5. Update the configuration in `App.js`:
```javascript
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com', // iOS only
});
```

### 5. Configure Camera Permissions

**iOS (ios/SecureAuthenticator/Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to scan QR codes for 2FA setup</string>
```

**Android (android/app/src/main/AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

## Running the App

### Start Metro Bundler

```bash
npm start
```

### Run on iOS (macOS only)

```bash
npm run ios
```

Or open in Xcode:
```bash
open ios/SecureAuthenticator.xcworkspace
```

### Run on Android

```bash
npm run android
```

Or open in Android Studio and run from there.

## Common Issues & Solutions

### Issue: "Command not found: react-native"
**Solution**: Install React Native CLI globally
```bash
npm install -g react-native-cli
```

### Issue: Metro bundler not starting
**Solution**: Clear cache and restart
```bash
npm start -- --reset-cache
```

### Issue: iOS build fails
**Solution**: Clean and reinstall pods
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

### Issue: Android build fails
**Solution**: Clean Gradle build
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Issue: Camera not working
**Solution**: Check permissions in device settings and ensure Info.plist/AndroidManifest.xml are configured correctly

### Issue: Google Sign-In not working
**Solution**: Verify client IDs are correct and properly configured in Google Cloud Console

## Development Workflow

### 1. Make Changes
Edit files in `App.js` or `src/pages/`

### 2. See Changes
- Changes will hot-reload automatically
- If not, press `r` in Metro bundler terminal to reload

### 3. Debug
- Press `Cmd+D` (iOS) or `Cmd+M` (Android) to open debug menu
- Enable Remote JS Debugging
- Use Chrome DevTools for debugging

### 4. Test on Device

**iOS:**
1. Connect iPhone via USB
2. Open Xcode
3. Select your device
4. Click Run

**Android:**
1. Enable USB debugging on Android device
2. Connect via USB
3. Run `npm run android`

## Backend Setup (for Network Scanner)

The Network Scanner feature requires a backend server:

```bash
cd backend
npm install
npm start
```

Update API URL in `src/pages/NetworkScanner.js` to point to your backend.

## Building for Production

### Android APK

```bash
cd android
./gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### iOS IPA

1. Open project in Xcode
2. Select "Any iOS Device" as target
3. Product → Archive
4. Follow distribution wizard

## Project Structure

```
.
├── App.js                      # Main app with navigation
├── index.js                    # Entry point
├── src/
│   └── pages/
│       ├── Authenticator.js    # 2FA authenticator
│       ├── Websitecheck.js     # Website scanner
│       └── NetworkScanner.js   # Network scanner
├── android/                    # Android native code
├── ios/                        # iOS native code
├── package.json               # Dependencies
├── metro.config.js            # Metro bundler config
├── babel.config.js            # Babel config
└── tailwind.config.cjs        # NativeWind config
```

## Available Scripts

- `npm start` - Start Metro bundler
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run lint` - Run linter
- `npm test` - Run tests

## Next Steps

1. Test all features on both platforms
2. Configure app icons and splash screens
3. Set up code signing for distribution
4. Optimize app performance
5. Submit to App Store and Play Store

## Need Help?

- Check `README_REACT_NATIVE.md` for detailed documentation
- Read `CONVERSION_GUIDE.md` for conversion details
- Visit [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting)
- Open an issue on GitHub

## Useful Commands

```bash
# Clear all caches
npm start -- --reset-cache
watchman watch-del-all
rm -rf /tmp/metro-*

# Rebuild everything
cd android && ./gradlew clean && cd ..
cd ios && pod deintegrate && pod install && cd ..

# Check device connections
adb devices  # Android
xcrun simctl list  # iOS simulators

# Open device logs
adb logcat  # Android
xcrun simctl spawn booted log stream  # iOS
```

Happy coding! 🚀
