import { useState, useEffect } from 'react';
import Register from './screens/Register.jsx';
import Login from './screens/Login.jsx';
import AddManually from './screens/AddManually.jsx';
import OrderScreen from './screens/OrderScreen.jsx';
import AnalyseScreen from './screens/AnalyseScreen.jsx';
import EditMenu from './screens/EditMenu.jsx';
import ProfileDashboard from './screens/ProfileDashboard.jsx';
import Toast from './components/Toast.jsx';
import { ToastContext } from './utils.js';
import { DEFAULT_SAMPLE_MENU } from './sampleData.js';
import {
  getSession, clearSession,
  getMenu, saveMenu,
  getBills, saveBills,
  getProfile, getUsers, saveUsers,
  setSession,
} from './utils.js';
import { sha256 } from './utils.js';

const DEMO_USERNAME = 'spicegarden';
const DEMO_NAME = 'Spice Garden';

export default function App() {
  const [authView, setAuthView] = useState('login');
  const [username, setUsername] = useState(getSession());
  const [dark, setDark] = useState(() => localStorage.getItem('tt_dark') === '1');
  const [menu, setMenu] = useState([]);
  const [bills, setBills] = useState([]);
  const [profile, setProfile] = useState({});
  const [displayName, setDisplayName] = useState('');
  const [section, setSection] = useState(null); // null | 'camera' | 'manual' | 'order' | 'analyse' | 'editMenu' | 'profile'
  const [toast, setToast] = useState(null);

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('tt_dark', dark ? '1' : '0');
  }, [dark]);

  // Load user data on login
  useEffect(() => {
    if (username) {
      const m = getMenu(username);
      const b = getBills(username);
      const p = getProfile(username);
      const users = getUsers();
      setMenu(m);
      setBills(b);
      setProfile(p);
      setDisplayName(users[username]?.username || username);
    }
  }, [username]);

  function showToast(msg) { 
    setToast(msg);
    setTimeout(() => setToast(null), 2000); // Auto-dismiss after 2 seconds
  }

  function handleLogin(uname) { setUsername(uname); setSection(null); }

  function handleLogout() {
    clearSession();
    setUsername(null);
    setMenu([]); setBills([]); setProfile({});
    setSection(null);
  }

  // 1-click instant demo loader
  async function handleLoadDemo() {
    const users = getUsers();
    if (!users[DEMO_USERNAME]) {
      const hash = await sha256('1234');
      users[DEMO_USERNAME] = { username: DEMO_NAME, hash };
      saveUsers(users);
    }
    // Seed menu if empty
    const existingMenu = getMenu(DEMO_USERNAME);
    if (!existingMenu.length) {
      saveMenu(DEMO_USERNAME, DEFAULT_SAMPLE_MENU);
    }
    setSession(DEMO_USERNAME);
    handleLogin(DEMO_USERNAME);
  }

  function handleMenuSave(newMenu) {
    saveMenu(username, newMenu);
    setMenu(newMenu);
    showToast('✅ Menu saved!');
  }

  function handleBillSaved(bill, updatedBills) {
    const newBills = updatedBills
      ? updatedBills
      : [...bills.filter(b => b.billNumber !== bill.billNumber), bill];
    setBills(newBills);
    saveBills(username, newBills);
  }

  function handleBillsUpdate(newBills) {
    setBills(newBills);
  }

  if (!username) {
    return (
      <ToastContext.Provider value={showToast}>
        <div style={{ background: 'var(--bg-gradient)', minHeight: '100vh' }}>
          {authView === 'register'
            ? <Register onSwitch={setAuthView} onDone={() => setAuthView('login')} />
            : <Login onSwitch={setAuthView} onLogin={handleLogin} onLoadDemo={handleLoadDemo} />
          }
        </div>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </ToastContext.Provider>
    );
  }

  const hasMenu = menu.length > 0;
  const profileLogo = profile?.logo || null;
  const showBack = section !== null;

  const SECTION_LABELS = {
    manual: '✏️ Add Items',
    order: '🛒 New Order',
    analyse: '📊 Analytics',
    editMenu: '✏️ Edit Menu',
    profile: '👤 Profile',
  };

  function renderSection() {
    if (section === 'manual') return (
      <AddManually existingMenu={menu}
        onSave={newMenu => { handleMenuSave(newMenu); }}
        onCancel={() => setSection(null)} />
    );
    if (section === 'order') return (
      <OrderScreen username={username} menu={menu} bills={bills}
        onBillSaved={handleBillSaved} profile={profile} displayName={displayName} />
    );
    if (section === 'analyse') return (
      <AnalyseScreen username={username} bills={bills} menu={menu}
        onBillsUpdate={handleBillsUpdate} />
    );
    if (section === 'editMenu') return (
      <EditMenu menu={menu} onSave={handleMenuSave} onBack={() => setSection(null)} />
    );
    if (section === 'profile') return (
      <ProfileDashboard username={username} onBack={() => setSection(null)} onLogout={handleLogout} />
    );
    return null;
  }

  function renderDashboard() {
    const todayBills = bills.filter(b => {
      const d = new Date(b.timestamp);
      const n = new Date();
      return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    });
    const todayRevenue = todayBills.reduce((s, b) => s + (b.total || 0), 0);
    const totalItems = menu.reduce((s, c) => s + c.items.length, 0);
    const weekBills = bills.filter(b => b.timestamp > Date.now() - 7 * 86400000);
    const weekRevenue = weekBills.reduce((s, b) => s + (b.total || 0), 0);

    return (
      <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-gradient)' }}>
        {!hasMenu ? (
          /* ---- Empty State ---- */
          <div className="flex flex-col items-center justify-center min-h-full gap-8 p-8">
            <div className="text-center animate-fade-in">
              <div className="text-7xl mb-4 animate-float">🍽️</div>
              <h2 className="font-heading text-3xl font-extrabold mb-2" style={{ color: 'var(--text)' }}>
                Welcome to <span className="text-orange-500">TableTap</span>!
              </h2>
              <p className="text-sm max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--text2)' }}>
                Let's get started by setting up your menu. Add items to begin taking orders and generating bills!
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                className="btn btn-primary py-5 text-base font-bold shadow-xl shadow-orange-500/30 w-full rounded-2xl"
                onClick={() => setSection('manual')}>
                ✏️ Add Menu Items
              </button>
            </div>
          </div>
        ) : (
          /* ---- Main Dashboard ---- */
          <div className="p-4 space-y-5 pb-10 max-w-3xl mx-auto">
            {/* Welcome row */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <h2 className="font-heading font-extrabold text-xl" style={{ color: 'var(--text)' }}>
                  👋 Hello, <span className="text-orange-500">{displayName}</span>
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <button
                className="btn btn-primary text-sm py-2.5 px-5 font-bold shadow-md shadow-orange-500/30"
                onClick={() => setSection('order')}>
                🛒 New Order
              </button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Today's Revenue" value={`₹${todayRevenue.toFixed(0)}`} icon="💰" accent />
              <StatCard label="Today's Bills" value={todayBills.length} icon="🧾" />
              <StatCard label="This Week" value={`₹${(weekRevenue / 1000).toFixed(1)}k`} icon="📈" />
              <StatCard label="Menu Items" value={totalItems} icon="🍽️" />
            </div>

            {/* Action tiles */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text2)' }}>Quick Actions</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ActionTile icon="🛒" label="New Order" sub="Bill customers" onClick={() => setSection('order')} gradient="linear-gradient(135deg, #f97316, #ea580c)" />
                <ActionTile icon="📊" label="Analytics" sub="Sales insights" onClick={() => setSection('analyse')} gradient="linear-gradient(135deg, #6366f1, #8b5cf6)" />
                <ActionTile icon="✏️" label="Edit Menu" sub={`${totalItems} items`} onClick={() => setSection('editMenu')} gradient="linear-gradient(135deg, #0ea5e9, #06b6d4)" />
                <ActionTile icon="➕" label="Add Items" sub="Manual entry" onClick={() => setSection('manual')} gradient="linear-gradient(135deg, #10b981, #34d399)" />
              </div>
            </div>

            {/* Menu categories preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text2)' }}>Your Menu</p>
                <button className="text-xs font-bold text-orange-500" onClick={() => setSection('editMenu')}>Edit →</button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {menu.map(cat => (
                  <div key={cat.title}
                    className="glass-card px-4 py-3 flex-shrink-0 flex flex-col items-center gap-1 min-w-[100px]">
                    <span className="text-2xl">{getCategoryEmoji(cat.title)}</span>
                    <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{cat.title}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text3)' }}>{cat.items.length} items</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent bills */}
            {bills.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text2)' }}>Recent Bills</p>
                  <button className="text-xs font-bold text-orange-500" onClick={() => setSection('order')}>View All →</button>
                </div>
                <div className="glass-card overflow-hidden">
                  {bills.slice().sort((a, b) => b.timestamp - a.timestamp).slice(0, 6).map((bill, i) => (
                    <div key={bill.billNumber}
                      className="flex items-center gap-3 px-4 py-3"
                      style={{ borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                        style={{ background: 'var(--surface2)' }}>
                        {bill.table === 'Takeaway' ? '🛍' : `🪑`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{bill.billNumber}</p>
                          {bill.table && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                              style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
                              {bill.table}
                            </span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text3)' }}>
                          {new Date(bill.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                          {bill.paymentMethod && ` · ${bill.paymentMethod}`}
                        </p>
                      </div>
                      <span className="font-heading font-black text-base" style={{ color: 'var(--primary)' }}>
                        ₹{bill.total?.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <ToastContext.Provider value={showToast}>
      <div className="flex flex-col h-screen" style={{ background: 'var(--bg-gradient)' }}>
        {/* Sticky top header */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 z-30 glass-panel border-b"
          style={{ borderColor: 'var(--border)' }}>
          {/* Left */}
          <div className="flex items-center gap-2">
            {showBack ? (
              <button
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all"
                style={{ color: 'var(--text2)', background: 'var(--surface2)' }}
                onClick={() => setSection(null)}>
                ← Back
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-sm"
                  style={{ background: 'var(--primary-gradient)' }}>
                  🍽️
                </div>
                <span className="font-heading font-black text-lg" style={{ color: 'var(--text)' }}>
                  Table<span className="text-orange-500">Tap</span>
                </span>
              </div>
            )}
            {section && (
              <span className="text-sm font-semibold" style={{ color: 'var(--text2)' }}>
                {SECTION_LABELS[section]}
              </span>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all text-base"
              style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              onClick={() => setDark(!dark)}>
              {dark ? '☀️' : '🌙'}
            </button>

            {/* Order button (when menu exists and not already in order/billing) */}
            {hasMenu && !['order', 'billing'].includes(section) && (
              <button
                className="btn btn-primary text-xs py-2 px-3.5 font-bold"
                onClick={() => setSection('order')}>
                🛒 Order
              </button>
            )}

            {/* Profile icon */}
            <button
              className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center text-base shadow"
              style={{ background: 'var(--primary-gradient)' }}
              onClick={() => setSection('profile')}>
              {profileLogo
                ? <img src={profileLogo} alt="logo" className="w-full h-full object-cover" />
                : '👤'}
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {section ? renderSection() : renderDashboard()}
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in">
          <div className="px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2"
            style={{ background: 'var(--text)', color: 'var(--surface)', whiteSpace: 'nowrap' }}>
            {toast}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

function StatCard({ label, value, icon, accent }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
        {accent && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ background: 'var(--primary-gradient)' }}>Today</span>}
      </div>
      <p className="font-heading font-black text-2xl" style={{ color: 'var(--text)' }}>{value}</p>
      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text2)' }}>{label}</p>
    </div>
  );
}

function ActionTile({ icon, label, sub, onClick, gradient }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-2 p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer border-0"
      style={{ background: gradient, boxShadow: '0 6px 20px rgba(0,0,0,0.12)' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.18)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }}>
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-[11px] text-white/70">{sub}</p>
      </div>
    </button>
  );
}

function getCategoryEmoji(title) {
  const map = {
    'Starters': '🥗', 'Main Course': '🍛', 'Mains': '🍛',
    'Rice & Biryani': '🍚', 'Biryani': '🍚', 'Rice': '🍚',
    'Breads': '🫓', 'Beverages': '🥤', 'Drinks': '🥤',
    'Desserts': '🍮', 'Sweets': '🍮', 'Soups': '🍲', 'Salads': '🥙',
    'Sides': '🍟', 'Custom': '✨',
  };
  return map[title] || '🍽️';
}
