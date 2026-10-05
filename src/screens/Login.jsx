import { useState } from 'react';
import { sha256, getUsers, setSession } from '../utils.js';

export default function Login({ onSwitch, onLogin, onLoadDemo }) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handlePinInput(index, value) {
    if (!/^\d*$/.test(value)) return; // Only allow numbers
    
    const arr = [...pin];
    arr[index] = value.slice(-1); // Only take last digit
    setPin(arr);
    
    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`login-pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  }

  function handlePinBackspace(index) {
    if (index > 0) {
      const prevInput = document.getElementById(`login-pin-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    setError('');
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    const pinStr = pin.join('');
    if (pinStr.length !== 4) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    setLoading(true);
    try {
      const users = getUsers();
      const user = users[username.toLowerCase()];
      if (!user) {
        setError('No account found with this username. Please register first.');
        return;
      }
      const hash = await sha256(pinStr);
      if (hash !== user.hash) {
        setError('Incorrect PIN. Please try again.');
        setPin(['', '', '', '']);
        return;
      }
      setSession(username.toLowerCase());
      onLogin(username.toLowerCase());
    } finally {
      setLoading(false);
    }
  }

  function handleQuickDemo() {
    if (onLoadDemo) {
      onLoadDemo();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center z-10">
        {/* Left Side: Brand Showcase */}
        <div className="hidden md:flex flex-col gap-6 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-orange-500/30"
              style={{ background: 'var(--primary-gradient)' }}>
              🍽️
            </div>
            <div>
              <span className="font-heading font-black text-3xl tracking-tight" style={{ color: 'var(--text)' }}>
                Table<span className="text-orange-500">Tap</span>
              </span>
              <p className="text-xs font-semibold tracking-wider uppercase text-orange-500/90">Restaurant POS & Intelligence</p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-heading font-extrabold leading-tight" style={{ color: 'var(--text)' }}>
              Billing made joyful. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-indigo-500">
                Insights made effortless.
              </span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              A lightning-fast, zero-hassle POS built specifically for restaurants, cafes, and cloud kitchens. Zero setup fees, zero servers — everything runs securely in your browser.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="glass-card p-3 flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>Fast Billing</p>
                <p className="text-[11px]" style={{ color: 'var(--text2)' }}>Instant tap & bill</p>
              </div>
            </div>
            <div className="glass-card p-3 flex items-center gap-3">
              <span className="text-2xl">🍛</span>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>Portion Sizing</p>
                <p className="text-[11px]" style={{ color: 'var(--text2)' }}>Full & Half prices</p>
              </div>
            </div>
            <div className="glass-card p-3 flex items-center gap-3">
              <span className="text-2xl">🧾</span>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>Smart Receipts</p>
                <p className="text-[11px]" style={{ color: 'var(--text2)' }}>Print & WhatsApp</p>
              </div>
            </div>
            <div className="glass-card p-3 flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>Rush Analytics</p>
                <p className="text-[11px]" style={{ color: 'var(--text2)' }}>Peak sales trends</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border relative">
          <div className="md:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md shadow-orange-500/20"
              style={{ background: 'var(--primary-gradient)' }}>
              🍽️
            </div>
            <div>
              <span className="font-heading font-black text-2xl" style={{ color: 'var(--text)' }}>
                Table<span className="text-orange-500">Tap</span>
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--text)' }}>Welcome Back</h1>
            <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>Sign in to manage your tables and orders</p>
          </div>

          {/* 1-Click Instant Demo Button */}
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full mb-5 py-3 px-4 rounded-xl flex items-center justify-center gap-3 font-semibold text-sm transition-all duration-200 cursor-pointer border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 group">
            <span className="text-lg group-hover:scale-110 transition-transform">🚀</span>
            <span>Launch Instant Demo (Spice Garden)</span>
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">or sign in</span>
            <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text2)' }}>
                👤 Username
              </label>
              <input
                className="input"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text2)' }}>
                🔐 Enter PIN
              </label>
              <div className="flex gap-3 justify-center mb-2">
                {pin.map((digit, index) => (
                  <div key={index} className="relative">
                    <input
                      id={`login-pin-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="w-14 h-14 text-center text-2xl font-bold rounded-xl transition-all"
                      style={{
                        border: '2px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                      }}
                      value={digit}
                      onChange={e => handlePinInput(index, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Backspace' && !digit) {
                          handlePinBackspace(index);
                        }
                      }}
                    />
                    <div className="absolute bottom-1 left-0 right-0 h-[1px] rounded-full"
                      style={{ 
                        background: digit ? 'var(--border)' : 'var(--border)',
                        width: '80%',
                        margin: '0 auto'
                      }} />
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-xl p-3 text-xs font-semibold flex items-center gap-2 animate-fade-in"
                style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              className="btn btn-primary w-full py-3.5 text-sm font-bold shadow-lg shadow-orange-500/25"
              type="submit"
              disabled={loading}>
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs" style={{ color: 'var(--text2)' }}>
              New to TableTap?{' '}
              <button
                type="button"
                className="font-bold text-orange-500 hover:text-orange-600 transition-colors ml-1 cursor-pointer"
                onClick={() => onSwitch('register')}>
                Create Free Account →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
