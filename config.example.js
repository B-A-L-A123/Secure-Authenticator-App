// Environment configuration for React Native
// Copy this file to config.js and update with your actual values

export const CONFIG = {
  // Google OAuth Configuration
  GOOGLE_WEB_CLIENT_ID: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  GOOGLE_IOS_CLIENT_ID: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  GOOGLE_ANDROID_CLIENT_ID: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  
  // Backend API Configuration
  API_URL: __DEV__ ? 'http://localhost:3001' : 'https://your-production-api.com',
  
  // App Configuration
  APP_NAME: 'Secure Authenticator',
  APP_VERSION: '1.0.0',
};
