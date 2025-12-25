import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { Camera, useCameraDevices, useCodeScanner } from 'react-native-vision-camera';

export default function Authenticator() {
  const [fabOpen, setFabOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [userId, setUserId] = useState(null);

  const [showCamera, setShowCamera] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  // LOAD USER-SPECIFIC AUTHENTICATOR ACCOUNTS
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) return;

      const user = JSON.parse(storedUser);
      setUserId(user.id);

      const storedAccounts = await AsyncStorage.getItem(`auth_accounts_${user.id}`);
      if (storedAccounts) {
        setAccounts(JSON.parse(storedAccounts));
      } else {
        setAccounts([]);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  // SAVE ACCOUNTS TO USER-SPECIFIC STORAGE
  useEffect(() => {
    if (!userId) return;
    saveAccounts();
  }, [accounts, userId]);

  const saveAccounts = async () => {
    try {
      await AsyncStorage.setItem(
        `auth_accounts_${userId}`,
        JSON.stringify(accounts)
      );
    } catch (error) {
      console.error('Error saving accounts:', error);
    }
  };

  // Timer for TOTP code refresh (30 second intervals)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev === 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleScanQR = async () => {
    const cameraPermission = await Camera.requestCameraPermission();
    if (cameraPermission === 'granted') {
      setFabOpen(false);
      setShowCamera(true);
    } else {
      Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes');
    }
  };

  const handleQRScanned = (data) => {
    const parsed = parseOTPAuthURI(data);
    const newAcc = {
      id: Date.now(),
      name: parsed.issuer || 'Scanned Account',
      email: parsed.label || 'From QR Code',
      secret: parsed.secret.toUpperCase(),
    };
    setAccounts([newAcc, ...accounts]);
    setShowCamera(false);
  };

  const addAccount = (name, email, secret) => {
    const newAcc = {
      id: Date.now(),
      name: name || 'New Account',
      email: email || 'Manually Added',
      secret: secret.toUpperCase().replace(/\s/g, ''),
    };
    setAccounts([newAcc, ...accounts]);
    setShowManual(false);
    setFabOpen(false);
  };

  const deleteAccount = (id) => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete this account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setAccounts(accounts.filter((acc) => acc.id !== id)),
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-[#213448]">
      <ScrollView className="flex-1 p-6">
        <View className="max-w-md mx-auto w-full">
          <Text className="text-3xl font-bold text-white mb-2">Authenticator</Text>
          <Text className="text-white/60 mb-8">Your secure 2FA codes</Text>

          {accounts.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-6xl mb-4">🔐</Text>
              <Text className="text-lg text-white/40 mb-2">No accounts yet</Text>
              <Text className="text-sm text-white/40">
                Tap the + button to add your first account
              </Text>
            </View>
          ) : (
            <View className="space-y-3 mb-20">
              {accounts.map((acc) => (
                <AccountCard
                  key={acc.id}
                  {...acc}
                  timeLeft={timeLeft}
                  onDelete={() => deleteAccount(acc.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Plus FAB */}
      <View className="absolute bottom-8 right-8 items-end">
        {fabOpen && (
          <View className="mb-3">
            <FabSubButton
              label="Enter Setup Key"
              icon="🔑"
              onClick={() => {
                setShowManual(true);
                setFabOpen(false);
              }}
            />
            <FabSubButton
              label="Scan QR Code"
              icon="📷"
              onClick={handleScanQR}
            />
          </View>
        )}
        <TouchableOpacity
          onPress={() => setFabOpen(!fabOpen)}
          className={`w-16 h-16 rounded-full bg-blue-500 items-center justify-center ${
            fabOpen ? 'rotate-45' : ''
          }`}
        >
          <Text className="text-white text-3xl">+</Text>
        </TouchableOpacity>
      </View>

      {/* Camera Scanner */}
      {showCamera && (
        <QRScanner
          onScanned={handleQRScanned}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Manual Entry Modal */}
      {showManual && (
        <ManualEntryModal
          onSave={addAccount}
          onClose={() => setShowManual(false)}
        />
      )}
    </View>
  );
}

function AccountCard({ id, name, email, secret, timeLeft, onDelete }) {
  const code = generateTOTP(secret, Math.floor(Date.now() / 1000));
  const percentage = (timeLeft / 30) * 100;
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    Clipboard.setString(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="bg-[#2d3f52] rounded-3xl p-5 border border-white/10 mb-3">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center">
            <Text className="text-white font-bold text-lg">{name[0]}</Text>
          </View>
          <View>
            <Text className="font-bold text-white">{name}</Text>
            <Text className="text-xs text-white/50">{email}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onDelete}>
          <Text className="text-white/30 text-xl">×</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-between">
        <TouchableOpacity onPress={copyCode}>
          <Text className="text-5xl font-mono font-bold text-white">
            {code.slice(0, 3)} {code.slice(3)}
          </Text>
          {copied && (
            <Text className="text-green-500 text-sm mt-2">✓ Copied!</Text>
          )}
        </TouchableOpacity>
        <View className="w-12 h-12 items-center justify-center">
          <Text className="text-white text-xs font-bold">{timeLeft}</Text>
        </View>
      </View>
    </View>
  );
}

function FabSubButton({ icon, label, onClick }) {
  return (
    <TouchableOpacity
      onPress={onClick}
      className="flex-row items-center gap-3 mb-3"
    >
      <View className="px-4 py-2 rounded-full bg-[#2d3f52] border border-white/10">
        <Text className="text-xs font-semibold text-white">{label}</Text>
      </View>
      <View className="w-14 h-14 rounded-full bg-blue-500 items-center justify-center">
        <Text className="text-white text-xl">{icon}</Text>
      </View>
    </TouchableOpacity>
  );
}

function QRScanner({ onScanned, onClose }) {
  const devices = useCameraDevices();
  const device = devices.back;

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes) => {
      if (codes.length > 0) {
        onScanned(codes[0].value);
      }
    },
  });

  if (device == null) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Loading camera...</Text>
      </View>
    );
  }

  return (
    <Modal visible animationType="slide">
      <View className="flex-1 bg-black">
        <View className="flex-row items-center justify-between p-4 bg-black/50">
          <Text className="text-white text-xl font-bold">Scan QR Code</Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-white text-2xl">×</Text>
          </TouchableOpacity>
        </View>

        <Camera
          style={{ flex: 1 }}
          device={device}
          isActive
          codeScanner={codeScanner}
        />

        <View className="absolute inset-0 items-center justify-center pointer-events-none">
          <View className="w-64 h-64 border-4 border-blue-500 rounded-3xl" />
        </View>

        <Text className="absolute bottom-20 self-center text-white text-center px-8 bg-black/50 py-3 rounded-full">
          Position QR code within the frame
        </Text>
      </View>
    </Modal>
  );
}

function ManualEntryModal({ onSave, onClose }) {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSave = () => {
    if (key.trim()) {
      onSave(
        name.trim() || 'New Account',
        email.trim() || 'manually.added@example.com',
        key.trim()
      );
    }
  };

  return (
    <Modal visible transparent animationType="fade">
      <View className="flex-1 items-center justify-center p-4 bg-black/80">
        <View className="bg-[#2d3f52] p-8 rounded-3xl w-full max-w-sm border border-white/10">
          <Text className="text-2xl font-bold mb-6 text-white">Add Account</Text>

          <TextInput
            placeholder="Account Name (e.g., Google, GitHub)"
            placeholderTextColor="#94B4C1"
            className="w-full bg-[#1a2332] p-4 rounded-2xl mb-3 text-white border border-white/5"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            placeholder="Email or Username"
            placeholderTextColor="#94B4C1"
            className="w-full bg-[#1a2332] p-4 rounded-2xl mb-3 text-white border border-white/5"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            placeholder="Setup Key (e.g., JBSWY3DPEHPK3PXP)"
            placeholderTextColor="#94B4C1"
            className="w-full bg-[#1a2332] p-4 rounded-2xl mb-6 text-white font-mono border border-white/5"
            value={key}
            onChangeText={(text) => setKey(text.toUpperCase())}
            autoCapitalize="characters"
          />

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-4 rounded-2xl items-center"
            >
              <Text className="text-white/60 font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 bg-blue-500 py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-semibold">Add Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Parse OTP Auth URI from QR codes
function parseOTPAuthURI(uri) {
  try {
    const url = new URL(uri);
    const pathParts = url.pathname.substring(1).split(':');
    let issuer = '';
    let label = '';

    if (pathParts.length === 2) {
      issuer = decodeURIComponent(pathParts[0]);
      label = decodeURIComponent(pathParts[1]);
    } else if (pathParts.length === 1) {
      label = decodeURIComponent(pathParts[0]);
    }

    const params = new URLSearchParams(url.search);
    const secret = params.get('secret') || '';
    const paramIssuer = params.get('issuer');

    if (paramIssuer) {
      issuer = paramIssuer;
    }

    return {
      secret: secret,
      issuer: issuer,
      label: label,
    };
  } catch (e) {
    const secretMatch = uri.match(/secret=([A-Z2-7]+)/i);
    return {
      secret: secretMatch ? secretMatch[1] : uri,
      issuer: 'Scanned Account',
      label: 'From QR Code',
    };
  }
}

// TOTP Generation Functions
function generateTOTP(secret, timeCounter) {
  try {
    const key = base32Decode(secret);
    const time = Math.floor(timeCounter / 30);
    const timeHex = time.toString(16).padStart(16, '0');
    const hmac = hmacSHA1(key, hexToBytes(timeHex));
    const offset = hmac[hmac.length - 1] & 0xf;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  } catch (e) {
    return '000000';
  }
}

function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (let i = 0; i < base32.length; i++) {
    const val = alphabet.indexOf(base32[i].toUpperCase());
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

function hmacSHA1(key, message) {
  const blockSize = 64;
  if (key.length > blockSize) {
    key = sha1(key);
  }
  const keyPadded = new Uint8Array(blockSize);
  keyPadded.set(key);

  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    ipad[i] = keyPadded[i] ^ 0x36;
    opad[i] = keyPadded[i] ^ 0x5c;
  }

  const innerHash = sha1(concat(ipad, message));
  return sha1(concat(opad, innerHash));
}

function sha1(data) {
  const bytes = new Uint8Array(data);
  const words = [];
  for (let i = 0; i < bytes.length; i++) {
    words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8);
  }

  const len = bytes.length * 8;
  words[len >>> 5] |= 0x80 << (24 - (len % 32));
  words[((len + 64) >>> 9) << 4) + 15] = len;

  let h0 = 0x67452301,
    h1 = 0xefcdab89,
    h2 = 0x98badcfe,
    h3 = 0x10325476,
    h4 = 0xc3d2e1f0;

  for (let i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    for (let j = 16; j < 80; j++) {
      w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
    }

    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4;

    for (let j = 0; j < 80; j++) {
      const f =
        j < 20
          ? (b & c) | (~b & d)
          : j < 40
          ? b ^ c ^ d
          : j < 60
          ? (b & c) | (b & d) | (c & d)
          : b ^ c ^ d;
      const k =
        j < 20
          ? 0x5a827999
          : j < 40
          ? 0x6ed9eba1
          : j < 60
          ? 0x8f1bbcdc
          : 0xca62c1d6;
      const temp = (rol(a, 5) + f + e + k + (w[j] | 0)) | 0;
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
  }

  return new Uint8Array([
    h0 >>> 24,
    h0 >>> 16,
    h0 >>> 8,
    h0,
    h1 >>> 24,
    h1 >>> 16,
    h1 >>> 8,
    h1,
    h2 >>> 24,
    h2 >>> 16,
    h2 >>> 8,
    h2,
    h3 >>> 24,
    h3 >>> 16,
    h3 >>> 8,
    h3,
    h4 >>> 24,
    h4 >>> 16,
    h4 >>> 8,
    h4,
  ]);
}

function rol(n, b) {
  return (n << b) | (n >>> (32 - b));
}

function concat(a, b) {
  const result = new Uint8Array(a.length + b.length);
  result.set(a);
  result.set(b, a.length);
  return result;
}

function hexToBytes(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return new Uint8Array(bytes);
}

export { generateTOTP, parseOTPAuthURI };
