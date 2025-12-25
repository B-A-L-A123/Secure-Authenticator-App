# React to React Native Conversion Guide

This document outlines the conversion process from the React web application to React Native mobile application.

## Overview

The Secure Authenticator app has been successfully converted from a React web application (using Vite, React Router, and Tailwind CSS) to a React Native mobile application (using React Navigation and NativeWind).

## Conversion Summary

### Architecture Changes

| Aspect | React Web | React Native |
|--------|-----------|--------------|
| **Routing** | react-router-dom | @react-navigation/native |
| **Navigation** | BrowserRouter | Bottom Tab Navigator |
| **Styling** | Tailwind CSS | NativeWind |
| **Storage** | localStorage | AsyncStorage |
| **Components** | HTML (div, button) | RN (View, TouchableOpacity) |
| **Camera** | getUserMedia + jsQR | react-native-vision-camera |
| **OAuth** | @react-oauth/google | @react-native-google-signin |

## File-by-File Conversion

### Entry Points

#### Web: `src/main.jsx`
```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <GoogleOAuthProvider clientId="...">
      <App />
    </GoogleOAuthProvider>
  </BrowserRouter>
);
```

#### Mobile: `index.js`
```javascript
import {AppRegistry} from 'react-native';
import App from './App';
AppRegistry.registerComponent('SecureAuthenticator', () => App);
```

### Main App Component

#### Changes in App.js:
1. Replaced `<div>` with `<View>`
2. Replaced `<button>` with `<TouchableOpacity>`
3. Replaced `<img>` with `<Image>`
4. Replaced React Router with React Navigation
5. Changed localStorage to AsyncStorage
6. Updated Google OAuth to native implementation

### Authenticator Page

#### Key Conversions:
1. **QR Scanner**: Web's `getUserMedia` + `jsQR` → React Native's `react-native-vision-camera`
2. **Camera UI**: HTML canvas → Native Camera component
3. **Clipboard**: Web's `navigator.clipboard` → `@react-native-community/clipboard`
4. **Modals**: CSS-based → React Native's `Modal` component
5. **Input Fields**: HTML `<input>` → `<TextInput>`
6. **Floating Action Button**: CSS positioning → React Native absolute positioning

### WebsiteCheck Page

#### Key Conversions:
1. **Fetch API**: Remains the same (both use fetch)
2. **Input Fields**: `<input>` → `<TextInput>`
3. **Scrolling**: Browser scrolling → `<ScrollView>`
4. **Loading Indicators**: CSS animations → `<ActivityIndicator>`

### NetworkScanner Page

#### Key Conversions:
1. **API Calls**: Same fetch API, different handling
2. **Checkboxes**: HTML checkbox → Custom TouchableOpacity with state
3. **Scroll Areas**: CSS overflow → `<ScrollView>`

## Styling Migration

### Tailwind CSS → NativeWind

NativeWind allows using Tailwind-like className syntax in React Native:

```javascript
// Works in both web and native
<View className="bg-blue-500 p-4 rounded-lg">
  <Text className="text-white font-bold">Hello</Text>
</View>
```

#### Notable Differences:
- No `hover:` pseudo-classes (use state instead)
- Limited CSS properties support
- Flexbox is default (no need for `flex` class)
- `space-y` and similar utilities work differently

## Navigation Changes

### React Router → React Navigation

#### Web (React Router):
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Authenticator />} />
    <Route path="/web" element={<WebsiteCheck />} />
  </Routes>
</BrowserRouter>
```

#### Mobile (React Navigation):
```jsx
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

<NavigationContainer>
  <Tab.Navigator>
    <Tab.Screen name="Authenticator" component={Authenticator} />
    <Tab.Screen name="Web Scanner" component={WebsiteCheck} />
  </Tab.Navigator>
</NavigationContainer>
```

## Storage Migration

### localStorage → AsyncStorage

#### Web:
```javascript
localStorage.setItem('key', JSON.stringify(data));
const data = JSON.parse(localStorage.getItem('key'));
```

#### Mobile:
```javascript
await AsyncStorage.setItem('key', JSON.stringify(data));
const data = JSON.parse(await AsyncStorage.getItem('key'));
```

**Important**: AsyncStorage is asynchronous, so all calls need `await` or `.then()`.

## Component Conversions

### Common Patterns

| Web Component | React Native | Notes |
|--------------|--------------|-------|
| `<div>` | `<View>` | Container component |
| `<span>` | `<Text>` | Text must be in Text component |
| `<button>` | `<TouchableOpacity>` | Touchable button |
| `<input>` | `<TextInput>` | Text input field |
| `<img>` | `<Image>` | Images |
| `<a>` | `<TouchableOpacity>` + Linking | Links |
| CSS modal | `<Modal>` | Native modal |
| `<label>` | `<Text>` | Labels |

## Authentication Changes

### Google OAuth

#### Web:
```jsx
import { GoogleLogin } from '@react-oauth/google';

<GoogleLogin
  onSuccess={(credentialResponse) => {
    const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
    // Handle login
  }}
/>
```

#### Mobile:
```jsx
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_CLIENT_ID',
});

<GoogleSigninButton
  onPress={async () => {
    const userInfo = await GoogleSignin.signIn();
    // Handle login
  }}
/>
```

## Camera/QR Code Scanning

### Web Implementation:
- Uses `getUserMedia()` to access camera
- Uses `jsQR` library to decode QR codes from canvas
- Manual frame-by-frame scanning

### Mobile Implementation:
- Uses `react-native-vision-camera` for camera access
- Built-in code scanner with native performance
- Hardware-accelerated QR detection

## Permissions

### iOS (Info.plist):
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan QR codes</string>
```

### Android (AndroidManifest.xml):
```xml
<uses-permission android:name="android.permission.CAMERA" />
```

## Dependencies Added

### Navigation:
- @react-navigation/native
- @react-navigation/bottom-tabs
- react-native-screens
- react-native-safe-area-context

### Storage:
- @react-native-async-storage/async-storage

### Camera:
- react-native-vision-camera
- vision-camera-code-scanner

### Authentication:
- @react-native-google-signin/google-signin

### Styling:
- nativewind
- tailwindcss (dev)

### Utilities:
- @react-native-community/clipboard

## Build Configuration

### Metro Config (metro.config.js)
- Configures JavaScript bundler
- Handles module resolution

### Babel Config (babel.config.js)
- Adds NativeWind plugin
- Uses React Native preset

### App Config (app.json)
- Basic app metadata
- Platform configuration

## Testing Strategy

1. **Visual Testing**: Verify UI renders correctly on both iOS and Android
2. **Functionality Testing**: Test all features (QR scanning, TOTP generation, etc.)
3. **Storage Testing**: Verify data persists correctly
4. **Navigation Testing**: Test all navigation flows
5. **Permission Testing**: Test camera permissions

## Known Issues & Workarounds

### Issue 1: CORS in Website Scanner
- **Problem**: Mobile apps can't directly fetch arbitrary websites due to CORS
- **Workaround**: Use a proxy server or backend API

### Issue 2: Google Sign-In Setup
- **Problem**: Requires platform-specific configuration
- **Solution**: Follow Google's setup guide for each platform

### Issue 3: Camera Permissions
- **Problem**: Must request permissions at runtime
- **Solution**: Added permission check before opening camera

## Migration Checklist

- [x] Convert routing to React Navigation
- [x] Replace HTML elements with RN components
- [x] Migrate localStorage to AsyncStorage
- [x] Convert Tailwind to NativeWind
- [x] Implement native camera for QR scanning
- [x] Update Google OAuth implementation
- [x] Add Clipboard support
- [x] Create native configuration files
- [x] Update package.json dependencies
- [x] Create documentation

## Next Steps

1. **Generate Native Code**: Run React Native init or Expo prebuild
2. **Configure OAuth**: Set up Google Sign-In for iOS and Android
3. **Test on Devices**: Test on physical devices
4. **Add Native Features**: Push notifications, biometric auth, etc.
5. **Optimize Performance**: Profile and optimize renders
6. **Submit to Stores**: Prepare for App Store and Play Store

## Resources

- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [NativeWind](https://www.nativewind.dev/)
- [React Native Vision Camera](https://github.com/mrousavy/react-native-vision-camera)
- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)

## Support

For issues or questions about the conversion:
1. Check the README_REACT_NATIVE.md
2. Review this conversion guide
3. Consult React Native documentation
4. Open an issue on GitHub
