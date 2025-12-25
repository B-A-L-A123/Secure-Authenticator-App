# Secure Authenticator - React Native Mobile App

A React Native mobile application converted from the React web application, providing secure 2FA authentication, website security scanning, and network scanning capabilities.

## Features

- **Authenticator**: Generate TOTP codes for 2FA accounts with QR code scanning
- **Web Scanner**: Analyze websites for security threats including keyloggers, spyware, and phishing
- **Network Scanner**: Scan IP ranges and ports for security analysis
- **Google Sign-In**: Secure authentication with account-specific data storage

## Technology Stack

- **React Native 0.73**: Cross-platform mobile framework
- **React Navigation**: Native navigation
- **NativeWind**: Tailwind CSS for React Native
- **AsyncStorage**: Local data persistence
- **React Native Vision Camera**: QR code scanning
- **Google Sign-In**: Authentication

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- For iOS: Xcode (macOS only) and CocoaPods
- For Android: Android Studio and Android SDK

### Installation

1. Clone the repository:
```bash
git clone https://github.com/B-A-L-A123/Secure-Authenticator-App.git
cd Secure-Authenticator-App
```

2. Install dependencies:
```bash
npm install
```

3. For iOS, install CocoaPods dependencies:
```bash
cd ios
pod install
cd ..
```

4. Configure Google Sign-In:
   - Update `webClientId` in `App.js` with your Google OAuth client ID
   - Configure iOS and Android apps in Google Cloud Console

### Running the App

#### iOS
```bash
npm run ios
```

#### Android
```bash
npm run android
```

#### Start Metro Bundler
```bash
npm start
```

## Project Structure

```
.
├── App.js                 # Main app component with navigation
├── index.js              # Entry point
├── src/
│   └── pages/
│       ├── Authenticator.js    # 2FA authenticator screen
│       ├── Websitecheck.js     # Website security scanner
│       └── NetworkScanner.js   # Network port scanner
├── android/              # Android native code
├── ios/                  # iOS native code
├── babel.config.js       # Babel configuration
├── metro.config.js       # Metro bundler configuration
└── tailwind.config.cjs   # NativeWind/Tailwind configuration
```

## Key Conversions from Web to Mobile

### Navigation
- **Before**: `react-router-dom` with `BrowserRouter`
- **After**: `@react-navigation/native` with Bottom Tab Navigator

### Styling
- **Before**: Standard Tailwind CSS with HTML/CSS
- **After**: NativeWind with React Native components

### Storage
- **Before**: `localStorage`
- **After**: `@react-native-async-storage/async-storage`

### Components
- **Before**: HTML elements (`div`, `button`, `input`)
- **After**: React Native components (`View`, `TouchableOpacity`, `TextInput`)

### Camera/QR Scanning
- **Before**: Web APIs (`getUserMedia`, `jsQR`)
- **After**: `react-native-vision-camera` with code scanner

### Authentication
- **Before**: `@react-oauth/google` for web
- **After**: `@react-native-google-signin/google-signin` for native

## Backend Integration

The Network Scanner requires a backend server running for network scanning functionality. The backend is located in the `backend/` directory.

To run the backend:
```bash
cd backend
npm install
npm start
```

Update the `API_URL` in `src/pages/NetworkScanner.js` to point to your backend server.

## Dependencies

### Core Dependencies
- `react`: ^18.2.0
- `react-native`: ^0.73.2
- `@react-navigation/native`: ^6.1.9
- `@react-navigation/bottom-tabs`: ^6.5.11
- `@react-native-async-storage/async-storage`: ^1.21.0
- `@react-native-google-signin/google-signin`: ^11.0.0
- `react-native-vision-camera`: ^3.6.17
- `nativewind`: ^2.0.11

### Dev Dependencies
- `@babel/core`: ^7.23.7
- `@react-native/babel-preset`: ^0.73.19
- `@react-native/metro-config`: ^0.73.3
- `tailwindcss`: ^3.4.17

## Building for Production

### Android APK
```bash
cd android
./gradlew assembleRelease
```

### iOS IPA
1. Open the project in Xcode
2. Select "Product" > "Archive"
3. Follow the distribution steps in Xcode

## Differences from Web Version

1. **Platform-specific UI**: Optimized for mobile touch interactions
2. **Native Navigation**: Uses React Navigation instead of React Router
3. **Camera Access**: Native camera integration for QR scanning
4. **Offline Support**: Better offline capabilities with AsyncStorage
5. **Push Notifications**: Can be integrated for 2FA code reminders (future enhancement)

## Known Limitations

1. Network Scanner requires backend server connection
2. Web Scanner may have CORS limitations on some URLs
3. Camera permissions must be granted for QR code scanning
4. Google Sign-In requires proper configuration in Google Cloud Console

## Troubleshooting

### Metro Bundler Issues
```bash
npm start -- --reset-cache
```

### Build Errors
```bash
# Android
cd android && ./gradlew clean

# iOS
cd ios && pod install --repo-update
```

### Permission Errors
Ensure all permissions are properly declared in:
- Android: `android/app/src/main/AndroidManifest.xml`
- iOS: `ios/SecureAuthenticator/Info.plist`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Original Web Version

The web version of this application uses Vite and can still be run using:
```bash
npm run web:dev
npm run web:build
```
