# Secure Authenticator Backend API

Backend server for the Secure Authenticator App with full support for React Native mobile applications.

## Features

- 🔐 Two-Factor Authentication (2FA) with TOTP
- 📱 React Native / Mobile App Compatible
- 🌐 Network Scanning API
- ✅ Comprehensive Health Checks
- 🔄 CORS Support for Mobile & Web
- 📝 Consistent API Response Format

## Setup

### Installation

```bash
cd backend
npm install
```

### Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Configure the following environment variables:

```env
PORT=3001
CORS_ORIGIN=*
NODE_ENV=development
```

### Running the Server

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and available endpoints. Useful for testing connectivity from mobile apps.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "message": "Authenticator API is running",
    "timestamp": "2025-12-25T12:00:00.000Z",
    "uptime": 123.45,
    "version": "1.0.0",
    "environment": "development",
    "endpoints": { ... }
  }
}
```

### Setup 2FA
```
POST /api/setup
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,...",
    "manualKey": "JBSWY3DPEHPK3PXP",
    "otpauth_url": "otpauth://totp/..."
  }
}
```

### Verify TOTP Code
```
POST /api/verify
Content-Type: application/json

{
  "email": "user@example.com",
  "token": "123456",
  "secret": "JBSWY3DPEHPK3PXP"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "message": "Token is valid"
  }
}
```

### Generate Test Token
```
POST /api/generate-token
Content-Type: application/json

{
  "secret": "JBSWY3DPEHPK3PXP"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "123456",
    "timeRemaining": 25,
    "expiresAt": 1703505625000
  }
}
```

### Validate Secret
```
GET /api/validate-secret?secret=JBSWY3DPEHPK3PXP
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "message": "Secret is valid"
  }
}
```

### Network Scan
```
POST /api/scan/network
Content-Type: application/json

{
  "ips": "192.168.1.1-192.168.1.50",
  "ports": "80,443,22"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [...],
    "count": 10,
    "timestamp": "2025-12-25T12:00:00.000Z"
  }
}
```

## React Native Integration

### Connection Setup

For **local development** with React Native:

1. Find your computer's IP address:
   - macOS/Linux: `ifconfig | grep "inet "`
   - Windows: `ipconfig`

2. Use your IP address instead of `localhost`:
   ```javascript
   const API_URL = 'http://192.168.1.100:3001'; // Replace with your IP
   ```

3. For **Expo** projects:
   ```javascript
   const API_URL = __DEV__ 
     ? 'http://192.168.1.100:3001'  // Your computer's IP
     : 'https://your-production-api.com';
   ```

### CORS Configuration

For development, the server allows all origins by default (`CORS_ORIGIN=*`).

For **production**, specify allowed origins in `.env`:
```env
CORS_ORIGIN=https://yourapp.com,exp://your-expo-url,yourapp://
```

Supports:
- Standard URLs: `https://example.com`
- React Native/Expo URLs: `exp://192.168.1.100:8081`
- Custom schemes: `myapp://`
- Wildcards: `http://192.168.*`

### Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "message": "Detailed error information"
}
```

**Common Error Codes:**
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

### Testing Mobile Connectivity

1. Start the backend server:
   ```bash
   npm start
   ```

2. Test from your mobile device or emulator:
   ```bash
   curl http://<your-ip>:3001/api/health
   ```

3. Check the response for server status and available endpoints.

## Dependencies

- `express` - Web framework
- `cors` - CORS middleware
- `speakeasy` - TOTP generation and verification
- `qrcode` - QR code generation
- `dotenv` - Environment variable management
- `evilscan` - Network scanning

## Development

### Request Logging

All requests are logged with timestamp and origin:
```
[2025-12-25T12:00:00.000Z] POST /api/verify - Origin: http://localhost:3000
```

### Debug Mode

Set `NODE_ENV=development` to enable:
- Stack traces in error responses
- Detailed logging
- Relaxed CORS policy

## Production Deployment

1. Set environment variables:
   ```env
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://yourapp.com,yourapp://
   ```

2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name authenticator-api
   ```

3. Set up reverse proxy (nginx/Apache) for HTTPS
4. Configure firewall rules
5. Set up monitoring and logging

## Security Notes

- Store secrets in a database in production (not in-memory)
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Validate and sanitize all user inputs
- Use environment variables for sensitive configuration
- Implement authentication/authorization as needed
- Consider implementing API keys for mobile apps

## License

Private - All Rights Reserved
