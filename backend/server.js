// server.js - Backend for 2FA Authenticator App
// Install dependencies: npm install express cors speakeasy qrcode dotenv

import express from 'express';
import cors from 'cors';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import dotenv from 'dotenv';
import scanRoutes from "./routes/scan.Routes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Enhanced CORS configuration for mobile app compatibility
// Supports React Native development servers, Expo, and custom schemes
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // If CORS_ORIGIN is *, allow all origins
    if (CORS_ORIGIN === '*') return callback(null, true);
    
    // Parse allowed origins from environment variable
    const allowedOrigins = CORS_ORIGIN.split(',').map(o => o.trim());
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      // Exact match
      if (origin === allowed) return true;
      
      // Pattern matching for React Native/Expo development
      // exp://, exps://, http://localhost:*, http://192.168.*
      if (allowed.includes('*')) {
        const pattern = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
        return pattern.test(origin);
      }
      
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // In development, log warning but allow; in production, block
      if (process.env.NODE_ENV === 'production') {
        console.error(`CORS: Blocked request from unauthorized origin: ${origin}`);
        callback(new Error('Origin not allowed by CORS'), false);
      } else {
        console.warn(`CORS: Origin ${origin} not in allowed list, but allowing for development`);
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increased limit for QR codes
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware for debugging mobile requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - Origin: ${req.get('origin') || 'none'}`);
  next();
});

// Scan routes
app.use("/api/scan", scanRoutes);

// In-memory storage (in production, use a database)
const users = new Map();

/**
 * POST /api/setup
 * Generate a new secret and QR code for 2FA setup
 * Mobile-friendly: Returns both QR code data URL and OTP auth URL
 */
app.post('/api/setup', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: name || `Authenticator (${email})`,
      issuer: 'MyAuthApp'
    });

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store user secret (in production, save to database)
    users.set(email, {
      secret: secret.base32,
      tempSecret: secret.base32,
      verified: false
    });

    res.json({
      success: true,
      data: {
        qrCode: qrCodeDataUrl,
        manualKey: secret.base32,
        otpauth_url: secret.otpauth_url
      }
    });

  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate QR code',
      code: 'SETUP_ERROR',
      message: error.message
    });
  }
});

/**
 * POST /api/verify
 * Verify a TOTP code
 * Mobile-friendly: Consistent success/error response format
 */
app.post('/api/verify', (req, res) => {
  try {
    const { email, token, secret } = req.body;

    if (!token || !secret) {
      return res.status(400).json({ 
        success: false,
        error: 'Token and secret are required',
        code: 'MISSING_PARAMETERS'
      });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after for clock skew
    });

    if (verified && email && users.has(email)) {
      // Mark user as verified
      const user = users.get(email);
      user.verified = true;
      user.secret = user.tempSecret;
      delete user.tempSecret;
      users.set(email, user);
    }

    res.json({
      success: true,
      data: {
        verified: verified,
        message: verified ? 'Token is valid' : 'Invalid token'
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Verification failed',
      code: 'VERIFICATION_ERROR',
      message: error.message
    });
  }
});

/**
 * POST /api/generate-token
 * Generate a TOTP token for testing purposes
 * Mobile-friendly: Useful for debugging and testing mobile integration
 */
app.post('/api/generate-token', (req, res) => {
  try {
    const { secret } = req.body;

    if (!secret) {
      return res.status(400).json({ 
        success: false,
        error: 'Secret is required',
        code: 'MISSING_SECRET'
      });
    }

    const token = speakeasy.totp({
      secret: secret,
      encoding: 'base32'
    });

    const timeRemaining = 30 - Math.floor((Date.now() / 1000) % 30);
    const currentTime = Date.now();

    res.json({
      success: true,
      data: {
        token: token,
        timeRemaining: timeRemaining,
        // Time when the current token expires and a new one will be generated
        expiresAt: currentTime + (timeRemaining * 1000)
      }
    });

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate token',
      code: 'TOKEN_GENERATION_ERROR',
      message: error.message
    });
  }
});

/**
 * GET /api/validate-secret
 * Validate if a secret key is properly formatted
 * Mobile-friendly: Helps validate user input before making API calls
 */
app.get('/api/validate-secret', (req, res) => {
  try {
    const { secret } = req.query;

    if (!secret) {
      return res.status(400).json({ 
        success: false,
        error: 'Secret is required',
        code: 'MISSING_SECRET'
      });
    }

    // Check if secret is valid base32
    const base32Regex = /^[A-Z2-7]+=*$/i;
    const isValid = base32Regex.test(secret);

    res.json({
      success: true,
      data: {
        valid: isValid,
        message: isValid ? 'Secret is valid' : 'Invalid secret format'
      }
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      message: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint with enhanced mobile diagnostics
 * Useful for React Native apps to check backend connectivity and status
 */
app.get('/api/health', (req, res) => {
  const healthData = {
    success: true,
    data: {
      status: 'OK',
      message: 'Authenticator API is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        setup: '/api/setup',
        verify: '/api/verify',
        generateToken: '/api/generate-token',
        validateSecret: '/api/validate-secret',
        networkScan: '/api/scan/network'
      }
    }
  };
  
  res.json(healthData);
});

// Global error handler for unhandled errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const response = {
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  };
  
  // Only expose stack traces in development mode
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }
  
  res.status(err.status || 500).json(response);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Secure Authenticator API Server');
  console.log('='.repeat(60));
  console.log(`📱 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 CORS Origin: ${CORS_ORIGIN}`);
  console.log('\n📋 Available Endpoints:');
  console.log(`   POST   http://localhost:${PORT}/api/setup`);
  console.log(`   POST   http://localhost:${PORT}/api/verify`);
  console.log(`   POST   http://localhost:${PORT}/api/generate-token`);
  console.log(`   GET    http://localhost:${PORT}/api/validate-secret`);
  console.log(`   POST   http://localhost:${PORT}/api/scan/network`);
  console.log(`   GET    http://localhost:${PORT}/api/health`);
  console.log('\n💡 React Native Integration Tips:');
  console.log('   - Use the /api/health endpoint to test connectivity');
  console.log('   - For local testing: http://<your-ip>:' + PORT);
  console.log('   - For Expo: Use your machine\'s IP address, not localhost');
  console.log('   - Configure CORS_ORIGIN in .env for production');
  console.log('='.repeat(60) + '\n');
});

export default app;