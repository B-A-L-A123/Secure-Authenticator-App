import { useEffect, useState, useRef } from 'react';
import { Camera, X, Key, Plus, Check, Copy } from 'lucide-react';
import jsQR from 'jsqr';

export default function Authenticator() {
  const [fabOpen, setFabOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [userId, setUserId] = useState(null);

  const [showCamera, setShowCamera] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const [scanStatus, setScanStatus] = useState('Scanning...');

  // LOAD USER-SPECIFIC AUTHENTICATOR ACCOUNTS
  // Each user's codes are stored separately using their unique user ID
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    const user = JSON.parse(storedUser);
    setUserId(user.id);

    // Load accounts for THIS specific user only
    // Storage key pattern: auth_accounts_${user.id}
    // Example: auth_accounts_123456789 for user with ID 123456789
    const storedAccounts = localStorage.getItem(`auth_accounts_${user.id}`);
    if (storedAccounts) {
      setAccounts(JSON.parse(storedAccounts));
    } else {
      // New user - start with empty array
      setAccounts([]);
    }
  }, []);

  // SAVE ACCOUNTS TO USER-SPECIFIC STORAGE
  // Whenever accounts change, save them to this user's specific storage key
  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(
      `auth_accounts_${userId}`,
      JSON.stringify(accounts)
    );
  }, [accounts, userId]);

  // Timer for TOTP code refresh (30 second intervals)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev === 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleScanQR = () => {
    setFabOpen(false);
    setShowCamera(true);
  };

  const handleQRScanned = (data) => {
    const parsed = parseOTPAuthURI(data);
    const newAcc = { 
      id: Date.now(), 
      name: parsed.issuer || "Scanned Account", 
      email: parsed.label || "From QR Code", 
      secret: parsed.secret.toUpperCase() 
    };
    // Add to current user's accounts
    setAccounts([newAcc, ...accounts]);
    setShowCamera(false);
  };

  const addAccount = (name, email, secret) => {
    const newAcc = { 
      id: Date.now(), 
      name: name || "New Account", 
      email: email || "Manually Added", 
      secret: secret.toUpperCase().replace(/\s/g, '') 
    };
    // Add to current user's accounts
    setAccounts([newAcc, ...accounts]);
    setShowManual(false);
    setFabOpen(false);
  };

  const deleteAccount = (id) => {
    // Remove from current user's accounts
    setAccounts(accounts.filter(acc => acc.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2332] to-[#213448] p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Authenticator</h1>
        <p className="text-white/60 mb-8">Your secure 2FA codes</p>

        {accounts.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <div className="text-6xl mb-4">🔐</div>
            <p className="text-lg mb-2">No accounts yet</p>
            <p className="text-sm">Tap the + button to add your first account</p>
          </div>
        ) : (
          <div className="space-y-3 mb-20">
            {accounts.map(acc => (
              <AccountCard 
                key={acc.id} 
                {...acc} 
                timeLeft={timeLeft} 
                onDelete={() => deleteAccount(acc.id)}
              />
            ))}
          </div>
        )}

        {/* Plus FAB */}
        <div className="fixed bottom-8 right-8 flex flex-col items-end gap-4 z-40">
          {fabOpen && (
            <div className="flex flex-col items-end gap-3">
              <FabSubButton 
                icon={<Key size={20} />} 
                label="Enter Setup Key" 
                onClick={() => {setShowManual(true); setFabOpen(false);}} 
              />
              <FabSubButton 
                icon={<Camera size={20} />} 
                label="Scan QR Code" 
                onClick={handleScanQR} 
              />
            </div>
          )}
          <button 
            onClick={() => setFabOpen(!fabOpen)}
            className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 bg-blue-500 hover:bg-blue-600 text-white ${fabOpen ? 'rotate-45' : ''}`}
          >
            <Plus size={32} />
          </button>
        </div>

        {/* Camera Scanner */}
        {showCamera && (
          <QRScanner onScanned={handleQRScanned} onClose={() => setShowCamera(false)} />
        )}

        {/* Manual Entry Modal */}
        {showManual && (
          <ManualEntryModal onSave={addAccount} onClose={() => setShowManual(false)} />
        )}
      </div>
    </div>
  );
}

function AccountCard({ id, name, email, secret, timeLeft, onDelete }) {
  const code = generateTOTP(secret, Math.floor(Date.now() / 1000));
  const percentage = (timeLeft / 30) * 100;
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-[#2d3f52] rounded-3xl p-5 shadow-xl border border-white/10 relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-bold text-white text-lg shadow-lg">
            {name[0]}
          </div>
          <div>
            <h3 className="font-bold text-white">{name}</h3>
            <p className="text-xs text-white/50">{email}</p>
          </div>
        </div>
        <button 
          onClick={onDelete}
          className="text-white/30 hover:text-red-400 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="flex items-center justify-between">
        <button 
          onClick={copyCode}
          className="relative text-5xl font-mono font-bold text-white tracking-wider hover:text-blue-300 transition-all group"
        >
          <span className={`transition-opacity ${copied ? 'opacity-50' : ''}`}>
            {code.slice(0, 3)} {code.slice(3)}
          </span>
          {copied && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-green-500 px-4 py-2 rounded-full animate-bounce-small">
                <Check size={20} className="text-white" />
                <span className="text-sm font-semibold text-white">Copied!</span>
              </div>
            </div>
          )}
          {!copied && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Copy size={24} className="text-blue-300" />
            </div>
          )}
        </button>
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="#4285f4"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - percentage / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
            {timeLeft}
          </div>
        </div>
      </div>
    </div>
  );
}

function FabSubButton({ icon, label, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className="flex items-center gap-3 group hover:scale-105 transition-transform"
    >
      <span className="px-4 py-2 rounded-full bg-[#2d3f52] text-xs font-semibold text-white shadow-lg border border-white/10">
        {label}
      </span>
      <div className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center shadow-xl text-white transition-colors">
        {icon}
      </div>
    </button>
  );
}

function QRScanner({ onScanned, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setHasPermission(true);
        scanQRCode();
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const scanQRCode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          stopCamera();
          onScanned(code.data);
          return;
        }
      }
      requestAnimationFrame(scan);
    };
    scan();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/50">
        <h2 className="text-white text-xl font-bold">Scan QR Code</h2>
        <button onClick={onClose} className="text-white p-2">
          <X size={24} />
        </button>
      </div>

      {hasPermission === false ? (
        <div className="flex-1 flex items-center justify-center text-white text-center p-8">
          <div>
            <p className="text-xl mb-4">Camera access denied</p>
            <p className="text-white/60">Please enable camera permissions to scan QR codes</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 relative">
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-64 h-64">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-3xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-3xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-3xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-3xl"></div>
            </div>
          </div>
          
          <p className="absolute bottom-20 text-white text-center px-8 bg-black/50 backdrop-blur-sm py-3 rounded-full left-1/2 transform -translate-x-1/2">
            Position QR code within the frame
          </p>
        </div>
      )}
    </div>
  );
}

function ManualEntryModal({ onSave, onClose }) {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSave = () => {
    if (key.trim()) {
      onSave(name.trim() || 'New Account', email.trim() || 'manually.added@example.com', key.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#2d3f52] p-8 rounded-3xl w-full max-w-sm border border-white/10 shadow-2xl">
        <h3 className="text-2xl font-bold mb-6 text-white">Add Account</h3>
        
        <input 
          placeholder="Account Name (e.g., Google, GitHub)" 
          className="w-full bg-[#1a2332] p-4 rounded-2xl mb-3 outline-none text-white placeholder:text-white/40 border border-white/5 focus:border-blue-500 transition-colors" 
          value={name}
          onChange={(e) => setName(e.target.value)} 
        />
        
        <input 
          placeholder="Email or Username" 
          className="w-full bg-[#1a2332] p-4 rounded-2xl mb-3 outline-none text-white placeholder:text-white/40 border border-white/5 focus:border-blue-500 transition-colors" 
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
        />
        
        <input 
          placeholder="Setup Key (e.g., JBSWY3DPEHPK3PXP)" 
          className="w-full bg-[#1a2332] p-4 rounded-2xl mb-6 outline-none text-white font-mono placeholder:text-white/40 border border-white/5 focus:border-blue-500 transition-colors uppercase" 
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase())} 
        />
        
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-4 rounded-2xl font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="flex-1 bg-blue-500 hover:bg-blue-600 py-4 rounded-2xl font-semibold text-white transition-colors shadow-lg"
          >
            Add Account
          </button>
        </div>
      </div>
    </div>
  );
}

// Parse OTP Auth URI from QR codes
function parseOTPAuthURI(uri) {
  try {
    // Format: otpauth://totp/Issuer:account@example.com?secret=XXX&issuer=Issuer
    const url = new URL(uri);
    
    // Extract label (account name/email) from path
    const pathParts = url.pathname.substring(1).split(':');
    let issuer = '';
    let label = '';
    
    if (pathParts.length === 2) {
      issuer = decodeURIComponent(pathParts[0]);
      label = decodeURIComponent(pathParts[1]);
    } else if (pathParts.length === 1) {
      label = decodeURIComponent(pathParts[0]);
    }
    
    // Extract parameters
    const params = new URLSearchParams(url.search);
    const secret = params.get('secret') || '';
    const paramIssuer = params.get('issuer');
    
    // Prefer issuer from parameter if available
    if (paramIssuer) {
      issuer = paramIssuer;
    }
    
    return {
      secret: secret,
      issuer: issuer,
      label: label
    };
  } catch (e) {
    // Fallback for non-URI format
    const secretMatch = uri.match(/secret=([A-Z2-7]+)/i);
    return {
      secret: secretMatch ? secretMatch[1] : uri,
      issuer: 'Scanned Account',
      label: 'From QR Code'
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
    const binary = ((hmac[offset] & 0x7f) << 24) |
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
    bytes.push(parseInt(bits.substr(i, 8), 2));
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
  words[len >>> 5] |= 0x80 << (24 - len % 32);
  words[(((len + 64) >>> 9) << 4) + 15] = len;
  
  let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
  
  for (let i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    for (let j = 16; j < 80; j++) {
      w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
    }
    
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    
    for (let j = 0; j < 80; j++) {
      const f = j < 20 ? (b & c) | (~b & d) : j < 40 ? b ^ c ^ d : j < 60 ? (b & c) | (b & d) | (c & d) : b ^ c ^ d;
      const k = j < 20 ? 0x5A827999 : j < 40 ? 0x6ED9EBA1 : j < 60 ? 0x8F1BBCDC : 0xCA62C1D6;
      const temp = (rol(a, 5) + f + e + k + (w[j] | 0)) | 0;
      e = d; d = c; c = rol(b, 30); b = a; a = temp;
    }
    
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0;
  }
  
  return new Uint8Array([
    h0 >>> 24, h0 >>> 16, h0 >>> 8, h0,
    h1 >>> 24, h1 >>> 16, h1 >>> 8, h1,
    h2 >>> 24, h2 >>> 16, h2 >>> 8, h2,
    h3 >>> 24, h3 >>> 16, h3 >>> 8, h3,
    h4 >>> 24, h4 >>> 16, h4 >>> 8, h4
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
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return new Uint8Array(bytes);
}

function extractSecretFromURI(uri) {
  try {
    const match = uri.match(/secret=([A-Z2-7]+)/i);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}