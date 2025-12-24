// server.js - Backend for 2FA Authenticator App
// Install dependencies: npm install express cors speakeasy qrcode

import express from 'express';
import cors from 'cors';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import scanRoutes from "./routes/scan.Routes.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/scan", scanRoutes);

// In-memory storage (in production, use a database)
const users = new Map();

/**
 * POST /api/setup
 * Generate a new secret and QR code for 2FA setup
 */
app.post('/api/setup', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
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
      qrCode: qrCodeDataUrl,
      manualKey: secret.base32,
      otpauth_url: secret.otpauth_url
    });

  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

/**
 * POST /api/verify
 * Verify a TOTP code
 */
app.post('/api/verify', (req, res) => {
  try {
    const { email, token, secret } = req.body;

    if (!token || !secret) {
      return res.status(400).json({ error: 'Token and secret are required' });
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
      verified: verified,
      message: verified ? 'Token is valid' : 'Invalid token'
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/generate-token
 * Generate a TOTP token for testing purposes
 */
app.post('/api/generate-token', (req, res) => {
  try {
    const { secret } = req.body;

    if (!secret) {
      return res.status(400).json({ error: 'Secret is required' });
    }

    const token = speakeasy.totp({
      secret: secret,
      encoding: 'base32'
    });

    const timeRemaining = 30 - Math.floor((Date.now() / 1000) % 30);

    res.json({
      token: token,
      timeRemaining: timeRemaining
    });

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

/**
 * GET /api/validate-secret
 * Validate if a secret key is properly formatted
 */
app.get('/api/validate-secret', (req, res) => {
  try {
    const { secret } = req.query;

    if (!secret) {
      return res.status(400).json({ error: 'Secret is required' });
    }

    // Check if secret is valid base32
    const base32Regex = /^[A-Z2-7]+=*$/i;
    const isValid = base32Regex.test(secret);

    res.json({
      valid: isValid,
      message: isValid ? 'Secret is valid' : 'Invalid secret format'
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Authenticator API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Authenticator API running on http://localhost:${PORT}`);
  console.log(`📱 Test endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/setup`);
  console.log(`   POST http://localhost:${PORT}/api/verify`);
  console.log(`   POST http://localhost:${PORT}/api/generate-token`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
   
});

export default app;