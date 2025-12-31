import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// 1. GENERATE A NEW SECRET (Triggered when user clicks "Scan QR")
export const setupAuthenticator = async (userEmail) => {
  // Generate a unique secret for this user
  const secret = speakeasy.generateSecret({
    name: `SecureSuite (${userEmail})`,
    issuer: 'SecureSuite'
  });

  // Create a QR Code URL that Google Authenticator can read
  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32, // SAVE THIS IN YOUR DATABASE
    qrCode: qrCodeDataUrl  // SEND THIS TO THE FRONTEND
  };
};

// 2. GENERATE / VERIFY CODE (Check if the code the user typed is correct)
export const verifyOTP = (userSecret, userTypedCode) => {
  const verified = speakeasy.totp.verify({
    secret: userSecret,
    encoding: 'base32',
    token: userTypedCode,
    window: 1 // Allows 30 seconds of "grace time" for network lag
  });

  return verified; // returns true or false
};