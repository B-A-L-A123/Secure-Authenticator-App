import { useState, useEffect } from 'react';
import Authenticator from './pages/Authenticator';
import WebsiteCheck from './pages/Websitecheck';
import DeviceCheck from './pages/NetworkScanner';
import { GoogleLogin } from "@react-oauth/google";

const colors = {
  bg: 'bg-[#213448]',
  card: 'bg-[#547792]',
  text: 'text-[#EAE0CF]',
  border: 'border-[#94B4C1]/20'
};

export function GoogleSignIn({ onSuccess }) {
  return (
    <GoogleLogin
      onSuccess={(cred) => {
        const payload = JSON.parse(atob(cred.credential.split(".")[1]));
        // Pass the entire user info including unique ID for storage separation
        onSuccess({
          id: payload.sub,  // Unique Google user ID
          name: payload.name,
          email: payload.email,
          picture: payload.picture
        });
      }}
      onError={() => alert("Google Sign-In Failed")}
    />
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('auth');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleSignIn = (userData) => {
    // Store user data with unique ID
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setShowLogin(false);
    
    // The Authenticator component will automatically load this user's specific codes
    // using the pattern: auth_accounts_${userData.id}
  };

  const handleSignOut = () => {
    // Remove user data but keep all user-specific authenticator codes intact
    // Each user's codes are stored separately as: auth_accounts_${user.id}
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <div className={`flex min-h-screen ${colors.bg} ${colors.text} font-sans relative overflow-hidden`}>

      {/* --- SIDEBAR --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 ${colors.card} border-r ${colors.border} transform transition-transform duration-300 md:translate-x-0 md:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight">Security Suite</h1>
        </div>
        <nav className="px-4 space-y-2 mt-4">
          <SidebarButton label="Authenticator" icon="🔐" active={activeTab === 'auth'} onClick={() => {setActiveTab('auth'); setSidebarOpen(false);}} />
          <SidebarButton label="Web Scanner" icon="🌐" active={activeTab === 'web'} onClick={() => {setActiveTab('web'); setSidebarOpen(false);}} />
          <SidebarButton label="Network Scanner" icon="📱" active={activeTab === 'device'} onClick={() => {setActiveTab('device'); setSidebarOpen(false);}} />
        </nav>
      </aside>

      {/* --- MAIN --- */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className={`h-16 flex items-center justify-between px-6 border-b ${colors.border}`}>
          <button className="md:hidden p-2 text-2xl" onClick={() => setSidebarOpen(true)}>☰</button>

          <div className="flex-1"></div>

          {/* USER BUTTON - Shows profile picture or initial */}
          <div className="relative group ml-auto">
            <button
              onClick={() => user ? null : setShowLogin(true)}
              className="w-10 h-10 rounded-full bg-[#94B4C1] flex items-center justify-center text-[#213448] font-bold overflow-hidden"
            >
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
              ) : user ? (
                <span>{user.name[0].toUpperCase()}</span>
              ) : (
                <span>U</span>
              )}
            </button>

            {/* Dropdown menu on hover */}
            {user && (
              <div className="absolute right-0 mt-2 w-64 bg-[#547792] rounded-xl shadow-xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#94B4C1] flex items-center justify-center text-[#213448] font-bold text-xl">
                      {user.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{user.name}</p>
                    <p className="text-sm text-white/60 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="text-xs text-white/40 mb-3 p-2 bg-black/20 rounded">
                  ID: {user.id.slice(0, 12)}...
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full py-2 px-4 bg-[#213448] hover:bg-[#1a2b3a] rounded-lg transition text-sm font-semibold"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="p-6 md:p-10 max-w-4xl w-full mx-auto overflow-y-auto">
          {/* Show login prompt if not signed in and on Authenticator tab */}
          {!user && activeTab === 'auth' ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold mb-2">Sign in to use Authenticator</h2>
              <p className="text-white/60 mb-6">
                Your authenticator codes will be synced to your account
              </p>
              <button
                onClick={() => setShowLogin(true)}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-semibold transition"
              >
                Sign In
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'auth' && <Authenticator />}
              {activeTab === 'web' && <WebsiteCheck />}
              {activeTab === 'device' && <DeviceCheck />}
            </>
          )}
        </main>
      </div>

      {/* --- LOGIN MODAL --- */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#547792] w-full max-w-sm rounded-3xl p-8 border border-white/10 shadow-2xl text-white">
            <h2 className="text-2xl font-bold mb-2">Sign in</h2>
            <p className="text-white/70 mb-6">
              Sign in to sync your authenticator accounts
            </p>

            {/* GOOGLE SIGN IN */}
            <div className="flex justify-center mb-6">
              <GoogleSignIn onSuccess={handleSignIn} />
            </div>

            <button
              onClick={() => setShowLogin(false)}
              className="w-full text-white/60 hover:text-white text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarButton({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
        active ? 'bg-[#213448] shadow-lg' : 'hover:bg-[#213448]/20'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}