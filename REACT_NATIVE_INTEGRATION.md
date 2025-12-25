# React Native Mobile App Integration Guide

This document describes the backend adaptations made for seamless React Native mobile application integration.

## Overview

The backend has been enhanced to support React Native mobile applications while maintaining full compatibility with the existing web application. All changes are backward-compatible and follow minimal modification principles.

## Key Adaptations

### 1. Enhanced CORS Configuration

**What Changed:**
- Added flexible CORS middleware that supports multiple origin types
- Supports React Native development servers (Metro bundler)
- Supports Expo development servers (`exp://`, `exps://`)
- Supports custom URL schemes for mobile apps
- Supports wildcard patterns for development convenience

**Configuration:**
```env
CORS_ORIGIN=*  # Development: Allow all origins
CORS_ORIGIN=https://yourapp.com,exp://192.168.*,myapp://  # Production: Specific origins
```

**Benefits for Mobile:**
- React Native apps can make requests without CORS errors
- Supports both debug and release builds
- Works with Expo Go and standalone apps
- Compatible with custom URL schemes

### 2. Consistent API Response Format

**What Changed:**
All API endpoints now return a consistent response format:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "message": "Detailed error information"
}
```

**Benefits for Mobile:**
- Easier error handling in mobile apps
- Type-safe responses for TypeScript/Flow
- Consistent error codes for different error scenarios
- Better debugging experience

### 3. Request Logging

**What Changed:**
- Added middleware that logs all incoming requests
- Logs timestamp, method, path, and origin
- Helps debug mobile connectivity issues

**Example Log:**
```
[2025-12-25T12:00:00.000Z] POST /api/verify - Origin: exp://192.168.1.100:8081
```

**Benefits for Mobile:**
- Easy to identify which requests are coming from mobile
- Helps troubleshoot CORS issues
- Useful for monitoring mobile app usage

### 4. Enhanced Health Check Endpoint

**What Changed:**
- `/api/health` endpoint now returns comprehensive server information
- Includes uptime, version, environment, and all available endpoints
- Useful for mobile apps to verify backend connectivity

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2025-12-25T12:00:00.000Z",
    "uptime": 123.45,
    "version": "1.0.0",
    "environment": "development",
    "endpoints": { ... }
  }
}
```

**Benefits for Mobile:**
- Mobile apps can check backend availability before making requests
- Useful for displaying server status in the app
- Helps diagnose network connectivity issues

### 5. Environment Configuration

**What Changed:**
- Added `dotenv` package for environment variable management
- Created `.env.example` template file
- All configuration now via environment variables

**Configuration Options:**
```env
PORT=3001                    # Server port
CORS_ORIGIN=*                # Allowed origins
NODE_ENV=development         # Environment mode
```

**Benefits for Mobile:**
- Easy to configure different backends for dev/staging/production
- Mobile apps can use different API URLs per environment
- Secure configuration management

### 6. Error Handling & 404 Handling

**What Changed:**
- Added global error handler for unhandled errors
- Added 404 handler for non-existent endpoints
- All errors return consistent format with error codes

**Error Codes:**
- `MISSING_EMAIL` - Email parameter required
- `MISSING_SECRET` - Secret parameter required
- `MISSING_PARAMETERS` - Required parameters missing
- `SETUP_ERROR` - Error during 2FA setup
- `VERIFICATION_ERROR` - Error during token verification
- `TOKEN_GENERATION_ERROR` - Error generating token
- `VALIDATION_ERROR` - Error validating secret
- `SCAN_ERROR` - Error during network scan
- `NOT_FOUND` - Endpoint not found
- `INTERNAL_ERROR` - Server error

**Benefits for Mobile:**
- Mobile apps can handle specific error types
- Better error messages for users
- Easier debugging

## Mobile Integration Example

### React Native Fetch Example

```javascript
// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.100:3001'  // Use your computer's IP for development
  : 'https://api.yourapp.com';

// Setup 2FA
async function setup2FA(email, name) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
    });

    const result = await response.json();

    if (result.success) {
      const { qrCode, manualKey, otpauth_url } = result.data;
      return { qrCode, manualKey, otpauth_url };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Setup error:', error);
    throw error;
  }
}

// Verify Token
async function verifyToken(email, token, secret) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, token, secret }),
    });

    const result = await response.json();

    if (result.success) {
      return result.data.verified;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Verification error:', error);
    throw error;
  }
}

// Health Check
async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const result = await response.json();
    return result.success && result.data.status === 'OK';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
```

### Axios Example

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: __DEV__ 
    ? 'http://192.168.1.100:3001' 
    : 'https://api.yourapp.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => {
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.error);
  },
  (error) => {
    if (error.response?.data) {
      throw new Error(error.response.data.error || 'Request failed');
    }
    throw error;
  }
);

// Usage
try {
  const data = await api.post('/api/setup', { email, name });
  console.log('Setup successful:', data);
} catch (error) {
  console.error('Setup failed:', error.message);
}
```

## Testing Mobile Integration

### 1. Find Your Computer's IP Address

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```

### 2. Start Backend Server

```bash
cd backend
npm install
npm start
```

### 3. Test from Mobile Device/Emulator

```bash
# Replace with your computer's IP
curl http://192.168.1.100:3001/api/health
```

### 4. Configure Mobile App

Update your React Native app to use your computer's IP:

```javascript
const API_URL = 'http://192.168.1.100:3001';
```

## Updated Endpoints

All endpoints now return consistent response format:

1. `GET /api/health` - Enhanced with more information
2. `POST /api/setup` - Returns `{success, data: {qrCode, manualKey, otpauth_url}}`
3. `POST /api/verify` - Returns `{success, data: {verified, message}}`
4. `POST /api/generate-token` - Returns `{success, data: {token, timeRemaining, expiresAt}}`
5. `GET /api/validate-secret` - Returns `{success, data: {valid, message}}`
6. `POST /api/scan/network` - Returns `{success, data: {results, count, timestamp}}`

## Files Changed

- `backend/package.json` - Added dependencies: express, cors, speakeasy, qrcode, dotenv
- `backend/server.js` - Enhanced CORS, error handling, response format, logging
- `backend/routes/scan.Routes.js` - Updated response format for consistency
- `backend/.env.example` - Configuration template
- `backend/.gitignore` - Added .env files to ignore list
- `backend/README.md` - Comprehensive API documentation
- `src/pages/NetworkScanner.jsx` - Updated to use new response format

## Backward Compatibility

All changes are backward-compatible with the existing web application:

- Web app continues to work without changes (except NetworkScanner minor update)
- Response format includes all original fields within `data` property
- CORS policy allows web origins by default
- No breaking changes to API endpoints

## Next Steps for Mobile Development

1. **Create React Native App**: Use Expo or React Native CLI
2. **Install Dependencies**: `axios` or use native `fetch`
3. **Configure API URL**: Use environment variables for flexibility
4. **Implement Auth Flow**: Use the setup and verify endpoints
5. **Handle Errors**: Use error codes for specific error handling
6. **Test Connectivity**: Use health endpoint before making requests
7. **Add Offline Support**: Cache data locally using AsyncStorage
8. **Implement Error Boundaries**: Catch and display network errors gracefully

## Production Considerations

1. **Use HTTPS**: Ensure backend uses HTTPS in production
2. **Configure CORS**: Set specific allowed origins in production
3. **Rate Limiting**: Add rate limiting middleware to prevent abuse
4. **Authentication**: Implement proper authentication/authorization
5. **API Keys**: Consider using API keys for mobile apps
6. **Monitoring**: Set up logging and monitoring services
7. **Error Tracking**: Use services like Sentry for error tracking
8. **Performance**: Optimize response times for mobile networks

## Support

For issues or questions:
- Check backend logs for request information
- Use health endpoint to verify connectivity
- Review error codes for specific error types
- Refer to backend/README.md for detailed API documentation
