import { useState, useEffect } from 'react';
import { sha256, getUsers, saveUsers, clearSession } from '../utils.js';

export default function ProfileDashboard({ username, onBack, onLogout }) {
  const [view, setView] = useState('menu'); // 'menu' | 'account' | 'changeUsername' | 'changePin' | 'dataStorage' | 'backup' | 'security' | 'help'
  const [pin, setPin] = useState(['', '', '', '']);
  const [newUsername, setNewUsername] = useState('');
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const users = getUsers();
  const user = users[username] || {};
  const accountCreated = new Date(parseInt(username.substring(0, 13)) || Date.now());

  // Calculate storage usage
  function getStorageSize() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return (total / 1024).toFixed(2); // KB
  }

  function handlePinInput(index, value, type = 'pin') {
    if (!/^\d*$/.test(value)) return;
    
    const arr = type === 'pin' ? [...pin] : type === 'newPin' ? [...newPin] : [...confirmPin];
    arr[index] = value.slice(-1);
    
    if (type === 'pin') setPin(arr);
    else if (type === 'newPin') setNewPin(arr);
    else setConfirmPin(arr);
    
    if (value && index < 3) {
      const nextInput = document.getElementById(`${type}-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
    
    // Auto-submit when all 4 digits are entered
    if (value && index === 3) {
      const fullPin = [...arr.slice(0, 3), value];
      if (fullPin.every(d => d !== '')) {
        setTimeout(() => {
          if (view === 'changeUsername') handleUsernameChange();
          else if (view === 'changePin') handlePinChange();
        }, 100);
      }
    }
  }

  function handlePinBackspace(index, type = 'pin') {
    if (index > 0) {
      const prevInput = document.getElementById(`${type}-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  }

  async function verifyCurrentPin() {
    const pinStr = pin.join('');
    if (pinStr.length !== 4) {
      setError('Please enter your 4-digit PIN');
      return false;
    }
    setLoading(true);
    const hash = await sha256(pinStr);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second loading
    setLoading(false);
    
    if (hash !== user.hash) {
      setError('Incorrect PIN');
      setPin(['', '', '', '']);
      return false;
    }
    return true;
  }

  async function handleUsernameChange() {
    if (step === 1) {
      const pinStr = pin.join('');
      if (pinStr.length !== 4) {
        setError('Please enter your 4-digit PIN');
        return;
      }
      const valid = await verifyCurrentPin();
      if (valid) {
        setError('');
        setStep(2);
        setPin(['', '', '', '']);
      }
    } else if (step === 2) {
      if (!newUsername.trim()) {
        setError('Username cannot be empty');
        return;
      }
      const lowerNew = newUsername.toLowerCase();
      if (lowerNew !== username && users[lowerNew]) {
        setError('Username already taken');
        return;
      }
      
      // Update username
      const userData = { ...users[username] };
      delete users[username];
      users[lowerNew] = { ...userData, username: newUsername };
      saveUsers(users);
      
      setError('');
      setStep(3);
      setTimeout(() => {
        setView('menu');
        setStep(1);
        setNewUsername('');
      }, 2000);
    }
  }

  async function handlePinChange() {
    if (step === 1) {
      const pinStr = pin.join('');
      if (pinStr.length !== 4) {
        setError('Please enter your 4-digit PIN');
        return;
      }
      const valid = await verifyCurrentPin();
      if (valid) {
        setError('');
        setStep(2);
        setPin(['', '', '', '']);
      }
    } else if (step === 2) {
      const newPinStr = newPin.join('');
      if (newPinStr.length !== 4) {
        return; // Don't show error, just wait
      }
      setLoading(true);
      setError(''); // Clear any errors
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
      setStep(3);
    } else if (step === 3) {
      const newPinStr = newPin.join('');
      const confirmPinStr = confirmPin.join('');
      
      if (confirmPinStr.length !== 4) {
        return; // Don't show error, just wait
      }
      if (newPinStr !== confirmPinStr) {
        setError('PINs do not match');
        setConfirmPin(['', '', '', '']);
        return;
      }
      
      setLoading(true);
      setError(''); // Clear any errors
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update PIN
      const hash = await sha256(newPinStr);
      users[username] = { ...users[username], hash };
      saveUsers(users);
      
      setLoading(false);
      setStep(4);
      setTimeout(() => {
        setView('menu');
        setStep(1);
        setNewPin(['', '', '', '']);
        setConfirmPin(['', '', '', '']);
      }, 2000);
    }
  }

  function handleLogoutClick() {
    clearSession();
    onLogout();
  }

  // Menu View
  if (view === 'menu') {
    return (
      <div className="flex flex-col h-full" style={{ background: 'var(--bg-gradient)' }}>
        <div className="flex items-center gap-3 px-4 py-3 glass-panel border-b" style={{ borderColor: 'var(--border)' }}>
          <button
            className="btn btn-ghost py-2 px-3 text-sm"
            onClick={onBack}>
            ← Back
          </button>
          <h2 className="font-heading font-bold text-xl flex-1" style={{ color: 'var(--text)' }}>Profile</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
          {/* Account */}
          <button
            onClick={() => setView('account')}
            className="w-full glass-card p-4 flex items-center gap-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg"
            style={{ borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: 'var(--primary-gradient)' }}>
              👤
            </div>
            <div className="flex-1">
              <p className="font-bold text-base" style={{ color: 'var(--text)' }}>Account</p>
              <p className="text-xs" style={{ color: 'var(--text2)' }}>Manage username and PIN</p>
            </div>
            <span className="text-xl" style={{ color: 'var(--text3)' }}>→</span>
          </button>

          {/* Data & Storage */}
          <button
            onClick={() => setView('dataStorage')}
            className="w-full glass-card p-4 flex items-center gap-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg"
            style={{ borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: 'var(--accent-gradient)' }}>
              💾
            </div>
            <div className="flex-1">
              <p className="font-bold text-base" style={{ color: 'var(--text)' }}>Data & Storage</p>
              <p className="text-xs" style={{ color: 'var(--text2)' }}>{getStorageSize()} KB used</p>
            </div>
            <span className="text-xl" style={{ color: 'var(--text3)' }}>→</span>
          </button>

          {/* Backup & Export */}
          <button
            onClick={() => setView('backup')}
            className="w-full glass-card p-4 flex items-center gap-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg"
            style={{ borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
              📦
            </div>
            <div className="flex-1">
              <p className="font-bold text-base" style={{ color: 'var(--text)' }}>Backup & Export</p>
              <p className="text-xs" style={{ color: 'var(--text2)' }}>Export menu and bills data</p>
            </div>
            <span className="text-xl" style={{ color: 'var(--text3)' }}>→</span>
          </button>

          {/* Security */}
          <button
            onClick={() => setView('security')}
            className="w-full glass-card p-4 flex items-center gap-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg"
            style={{ borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
              🔒
            </div>
            <div className="flex-1">
              <p className="font-bold text-base" style={{ color: 'var(--text)' }}>Security</p>
              <p className="text-xs" style={{ color: 'var(--text2)' }}>PIN protection and privacy</p>
            </div>
            <span className="text-xl" style={{ color: 'var(--text3)' }}>→</span>
          </button>

          {/* Help & Support */}
          <button
            onClick={() => setView('help')}
            className="w-full glass-card p-4 flex items-center gap-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg"
            style={{ borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}>
              💬
            </div>
            <div className="flex-1">
              <p className="font-bold text-base" style={{ color: 'var(--text)' }}>Help & Support</p>
              <p className="text-xs" style={{ color: 'var(--text2)' }}>FAQs and troubleshooting</p>
            </div>
            <span className="text-xl" style={{ color: 'var(--text3)' }}>→</span>
          </button>

          {/* Logout */}
          {logoutConfirm ? (
            <div className="glass-card p-4 space-y-3 border-2" style={{ borderColor: 'var(--danger)' }}>
              <p className="font-bold text-sm" style={{ color: 'var(--danger)' }}>⚠️ Are you sure you want to logout?</p>
              <div className="flex gap-3">
                <button
                  className="btn btn-danger flex-1 py-3 text-sm font-bold"
                  onClick={handleLogoutClick}>
                  Yes, Logout
                </button>
                <button
                  className="btn btn-secondary flex-1 py-3 text-sm"
                  onClick={() => setLogoutConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setLogoutConfirm(true)}
              className="w-full glass-card p-4 flex items-center gap-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ borderColor: 'var(--danger)', borderWidth: '2px' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: 'var(--danger-bg)', border: '2px solid var(--danger)' }}>
                🚪
              </div>
              <div className="flex-1">
                <p className="font-bold text-base" style={{ color: 'var(--danger)' }}>Logout</p>
                <p className="text-xs" style={{ color: 'var(--text2)' }}>Sign out of your account</p>
              </div>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Account View
  if (view === 'account') {
    return (
      <div className="flex flex-col h-full" style={{ background: 'var(--bg-gradient)' }}>
        <div className="flex items-center gap-3 px-4 py-3 glass-panel border-b" style={{ borderColor: 'var(--border)' }}>
          <button
            className="btn btn-ghost py-2 px-3 text-sm"
            onClick={() => { setView('menu'); setError(''); }}>
            ← Back
          </button>
          <h2 className="font-heading font-bold text-xl flex-1" style={{ color: 'var(--text)' }}>Account</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Current Info */}
          <div className="glass-card p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text2)' }}>Current Details</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold" style={{ color: 'var(--text2)' }}>Username</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{user.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold" style={{ color: 'var(--text2)' }}>Account ID</span>
                <span className="text-xs font-mono" style={{ color: 'var(--text3)' }}>{username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold" style={{ color: 'var(--text2)' }}>Created</span>
                <span className="text-xs" style={{ color: 'var(--text3)' }}>
                  {accountCreated.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Change Username */}
          <button
            onClick={() => { setView('changeUsername'); setStep(1); setPin(['', '', '', '']); setError(''); }}
            className="w-full glass-card p-4 flex items-center gap-4 text-left transition-all hover:scale-[1.02]"
            style={{ borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'var(--primary-gradient)' }}>
              ✏️
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Change Username</p>
              <p className="text-xs" style={{ color: 'var(--text2)' }}>Update your display name</p>
            </div>
            <span className="text-lg" style={{ color: 'var(--text3)' }}>→</span>
          </button>

          {/* Change PIN */}
          <button
            onClick={() => { setView('changePin'); setStep(1); setPin(['', '', '', '']); setError(''); }}
            className="w-full glass-card p-4 flex items-center gap-4 text-left transition-all hover:scale-[1.02]"
            style={{ borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'var(--accent-gradient)' }}>
              🔐
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Change PIN</p>
              <p className="text-xs" style={{ color: 'var(--text2)' }}>Update your security PIN</p>
            </div>
            <span className="text-lg" style={{ color: 'var(--text3)' }}>→</span>
          </button>
        </div>
      </div>
    );
  }

  // Change Username View
  if (view === 'changeUsername') {
    if (step === 3) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-5 p-8 animate-fade-in"
          style={{ background: 'var(--bg-gradient)' }}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
            style={{ background: 'var(--success-bg)', border: '2px solid var(--success)' }}>
            ✅
          </div>
          <p className="font-heading font-black text-2xl" style={{ color: 'var(--text)' }}>Username Updated!</p>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>Returning to profile...</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full" style={{ background: 'var(--bg-gradient)' }}>
        <div className="flex items-center gap-3 px-4 py-3 glass-panel border-b" style={{ borderColor: 'var(--border)' }}>
          <button
            className="btn btn-ghost py-2 px-3 text-sm"
            onClick={() => { setView('account'); setError(''); setPin(['', '', '', '']); }}>
            ← Back
          </button>
          <h2 className="font-heading font-bold text-xl flex-1" style={{ color: 'var(--text)' }}>Change Username</h2>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            {step === 1 && (
              <>
                <div className="text-center mb-6">
                  <p className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>Verify Your Identity</p>
                  <p className="text-sm" style={{ color: 'var(--text2)' }}>Enter your current PIN to continue</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-3 text-center"
                    style={{ color: 'var(--text2)' }}>
                    🔐 Enter Current PIN
                  </label>
                  <div className="flex gap-3 justify-center mb-2">
                    {pin.map((digit, index) => (
                      <div key={index} className="relative">
                        <input
                          id={`pin-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className="w-16 h-16 text-center text-2xl font-bold rounded-xl transition-all"
                          style={{
                            border: '2px solid var(--border)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                          }}
                          value={digit}
                          onChange={e => handlePinInput(index, e.target.value, 'pin')}
                          onKeyDown={e => {
                            if (e.key === 'Backspace' && !digit) {
                              handlePinBackspace(index, 'pin');
                            }
                          }}
                          autoFocus={index === 0}
                        />
                        <div className="absolute bottom-1 left-0 right-0 h-[1px] rounded-full"
                          style={{ 
                            background: 'var(--border)',
                            width: '80%',
                            margin: '0 auto'
                          }} />
                      </div>
                    ))}
                  </div>
                  {error && (
                    <p className="text-xs mt-2 text-center flex items-center justify-center gap-1" style={{ color: 'var(--danger)' }}>
                      <span>⚠️</span>{error}
                    </p>
                  )}
                </div>

                <button
                  className="btn btn-primary w-full py-4 text-sm font-bold shadow-lg shadow-orange-500/25"
                  onClick={handleUsernameChange}>
                  Verify & Continue
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="text-center mb-6">
                  <p className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>Enter New Username</p>
                  <p className="text-sm" style={{ color: 'var(--text2)' }}>Choose a new username for your account</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--text2)' }}>
                    👤 New Username
                  </label>
                  <input
                    className="input w-full"
                    placeholder="Enter new username"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    autoFocus
                  />
                  {error && (
                    <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--danger)' }}>
                      <span>⚠️</span>{error}
                    </p>
                  )}
                </div>

                <button
                  className="btn btn-primary w-full py-4 text-sm font-bold shadow-lg shadow-orange-500/25"
                  onClick={handleUsernameChange}>
                  Save Username
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Change PIN View
  if (view === 'changePin') {
    if (step === 4) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-5 p-8 animate-fade-in"
          style={{ background: 'var(--bg-gradient)' }}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
            style={{ background: 'var(--success-bg)', border: '2px solid var(--success)' }}>
            ✅
          </div>
          <p className="font-heading font-black text-2xl" style={{ color: 'var(--text)' }}>PIN Updated!</p>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>Returning to profile...</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full" style={{ background: 'var(--bg-gradient)' }}>
        <div className="flex items-center gap-3 px-4 py-3 glass-panel border-b" style={{ borderColor: 'var(--border)' }}>
          <button
            className="btn btn-ghost py-2 px-3 text-sm"
            onClick={() => { setView('account'); setError(''); setPin(['', '', '', '']); setNewPin(['', '', '', '']); setConfirmPin(['', '', '', '']); }}>
            ← Back
          </button>
          <h2 className="font-heading font-bold text-xl flex-1" style={{ color: 'var(--text)' }}>Change PIN</h2>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            {step === 1 && (
              <>
                <div className="text-center mb-6">
                  <p className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>Verify Your Identity</p>
                  <p className="text-sm" style={{ color: 'var(--text2)' }}>Enter your current PIN to continue</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-3 text-center"
                    style={{ color: 'var(--text2)' }}>
                    🔐 Enter Current PIN
                  </label>
                  <div className="flex gap-3 justify-center mb-2">
                    {pin.map((digit, index) => (
                      <div key={index} className="relative">
                        <input
                          id={`pin-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className="w-16 h-16 text-center text-2xl font-bold rounded-xl transition-all"
                          style={{
                            border: '2px solid var(--border)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                          }}
                          value={digit}
                          onChange={e => handlePinInput(index, e.target.value, 'pin')}
                          onKeyDown={e => {
                            if (e.key === 'Backspace' && !digit) {
                              handlePinBackspace(index, 'pin');
                            }
                          }}
                          autoFocus={index === 0}
                        />
                        <div className="absolute bottom-1 left-0 right-0 h-[1px] rounded-full"
                          style={{ 
                            background: 'var(--border)',
                            width: '80%',
                            margin: '0 auto'
                          }} />
                      </div>
                    ))}
                  </div>
                  {error && (
                    <p className="text-xs mt-2 text-center flex items-center justify-center gap-1" style={{ color: 'var(--danger)' }}>
                      <span>⚠️</span>{error}
                    </p>
                  )}
                </div>

                <button
                  className="btn btn-primary w-full py-4 text-sm font-bold shadow-lg shadow-orange-500/25"
                  onClick={handlePinChange}>
                  Verify & Continue
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="text-center mb-6">
                  <p className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>Create New PIN</p>
                  <p className="text-sm" style={{ color: 'var(--text2)' }}>Enter a new 4-digit PIN</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-3 text-center"
                    style={{ color: 'var(--text2)' }}>
                    🔐 New PIN
                  </label>
                  <div className="flex gap-3 justify-center mb-2">
                    {newPin.map((digit, index) => (
                      <div key={index} className="relative">
                        <input
                          id={`newPin-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className="w-16 h-16 text-center text-2xl font-bold rounded-xl transition-all"
                          style={{
                            border: '2px solid var(--border)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                          }}
                          value={digit}
                          onChange={e => handlePinInput(index, e.target.value, 'newPin')}
                          onKeyDown={e => {
                            if (e.key === 'Backspace' && !digit) {
                              handlePinBackspace(index, 'newPin');
                            }
                          }}
                          autoFocus={index === 0}
                        />
                        <div className="absolute bottom-1 left-0 right-0 h-[1px] rounded-full"
                          style={{ 
                            background: 'var(--border)',
                            width: '80%',
                            margin: '0 auto'
                          }} />
                      </div>
                    ))}
                  </div>
                  {error && (
                    <p className="text-xs mt-2 text-center flex items-center justify-center gap-1" style={{ color: 'var(--danger)' }}>
                      <span>⚠️</span>{error}
                    </p>
                  )}
                </div>

                <button
                  className="btn btn-primary w-full py-4 text-sm font-bold shadow-lg shadow-orange-500/25"
                  onClick={handlePinChange}>
                  Continue
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <div className="text-center mb-6">
                  <p className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>Confirm New PIN</p>
                  <p className="text-sm" style={{ color: 'var(--text2)' }}>Re-enter your new PIN to confirm</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-3 text-center"
                    style={{ color: 'var(--text2)' }}>
                    🔒 Confirm PIN
                  </label>
                  <div className="flex gap-3 justify-center mb-2">
                    {confirmPin.map((digit, index) => (
                      <div key={index} className="relative">
                        <input
                          id={`confirmPin-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className="w-16 h-16 text-center text-2xl font-bold rounded-xl transition-all"
                          style={{
                            border: '2px solid var(--border)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                          }}
                          value={digit}
                          onChange={e => handlePinInput(index, e.target.value, 'confirmPin')}
                          onKeyDown={e => {
                            if (e.key === 'Backspace' && !digit) {
                              handlePinBackspace(index, 'confirmPin');
                            }
                          }}
                          autoFocus={index === 0}
                        />
                        <div className="absolute bottom-1 left-0 right-0 h-[1px] rounded-full"
                          style={{ 
                            background: 'var(--border)',
                            width: '80%',
                            margin: '0 auto'
                          }} />
                      </div>
                    ))}
                  </div>
                  {error && (
                    <p className="text-xs mt-2 text-center flex items-center justify-center gap-1" style={{ color: 'var(--danger)' }}>
                      <span>⚠️</span>{error}
                    </p>
                  )}
                </div>

                <button
                  className="btn btn-primary w-full py-4 text-sm font-bold shadow-lg shadow-orange-500/25"
                  onClick={handlePinChange}>
                  Save New PIN
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Data & Storage View
  if (view === 'dataStorage') {
    return (
      <div className="flex flex-col h-full" style={{ background: 'var(--bg-gradient)' }}>
        <div className="flex items-center gap-3 px-4 py-3 glass-panel border-b" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-ghost py-2 px-3 text-sm" onClick={() => setView('menu')}>← Back</button>
          <h2 className="font-heading font-bold text-xl flex-1" style={{ color: 'var(--text)' }}>Data & Storage</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="glass-card p-4">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text2)' }}>Storage Usage</p>
            <div className="text-center py-6">
              <p className="font-heading font-black text-4xl mb-2" style={{ color: 'var(--primary)' }}>{getStorageSize()} KB</p>
              <p className="text-sm" style={{ color: 'var(--text2)' }}>Space used in browser storage</p>
            </div>
          </div>
          <div className="glass-card p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text2)' }}>What's Stored</p>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm" style={{ color: 'var(--text)' }}>📋 Menu Items</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>Saved</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm" style={{ color: 'var(--text)' }}>🧾 Bills & Orders</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>Saved</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm" style={{ color: 'var(--text)' }}>👤 User Data</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Backup & Export View
  if (view === 'backup') {
    return (
      <div className="flex flex-col h-full" style={{ background: 'var(--bg-gradient)' }}>
        <div className="flex items-center gap-3 px-4 py-3 glass-panel border-b" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-ghost py-2 px-3 text-sm" onClick={() => setView('menu')}>← Back</button>
          <h2 className="font-heading font-bold text-xl flex-1" style={{ color: 'var(--text)' }}>Backup & Export</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="glass-card p-4 text-center">
            <p className="text-5xl mb-3">📦</p>
            <p className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>Export Your Data</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text2)' }}>Download menu and bills as JSON files for backup</p>
            <p className="text-xs" style={{ color: 'var(--text3)' }}>Feature coming soon!</p>
          </div>
        </div>
      </div>
    );
  }

  // Security View
  if (view === 'security') {
    return (
      <div className="flex flex-col h-full" style={{ background: 'var(--bg-gradient)' }}>
        <div className="flex items-center gap-3 px-4 py-3 glass-panel border-b" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-ghost py-2 px-3 text-sm" onClick={() => setView('menu')}>← Back</button>
          <h2 className="font-heading font-bold text-xl flex-1" style={{ color: 'var(--text)' }}>Security</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="glass-card p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text2)' }}>Security Features</p>
            <div className="flex items-center gap-3 py-2">
              <span className="text-2xl">🔐</span>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>PIN Protection</p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>4-digit PIN required for login</p>
              </div>
              <span className="text-xs px-2 py-1 rounded font-bold" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>Active</span>
            </div>
            <div className="flex items-center gap-3 py-2">
              <span className="text-2xl">🔒</span>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Password Hashing</p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>SHA-256 encryption</p>
              </div>
              <span className="text-xs px-2 py-1 rounded font-bold" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>Active</span>
            </div>
            <div className="flex items-center gap-3 py-2">
              <span className="text-2xl">💾</span>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Local Storage</p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>All data stays on your device</p>
              </div>
              <span className="text-xs px-2 py-1 rounded font-bold" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>Active</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Help & Support View
  if (view === 'help') {
    return (
      <div className="flex flex-col h-full" style={{ background: 'var(--bg-gradient)' }}>
        <div className="flex items-center gap-3 px-4 py-3 glass-panel border-b" style={{ borderColor: 'var(--border)' }}>
          <button className="btn btn-ghost py-2 px-3 text-sm" onClick={() => setView('menu')}>← Back</button>
          <h2 className="font-heading font-bold text-xl flex-1" style={{ color: 'var(--text)' }}>Help & Support</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="glass-card p-4">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text2)' }}>Frequently Asked Questions</p>
            <div className="space-y-3">
              <div>
                <p className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>❓ How do I add menu items?</p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>Go to Dashboard → Add Items or Edit Menu to manage your menu</p>
              </div>
              <div>
                <p className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>❓ How do I create a bill?</p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>Click "New Order" → Select items → "Proceed to Billing" → Print</p>
              </div>
              <div>
                <p className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>❓ Is my data safe?</p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>Yes! All data is stored locally on your device with PIN protection</p>
              </div>
              <div>
                <p className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>❓ Can I export my data?</p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>Backup & Export feature is coming soon!</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-4xl mb-2">💬</p>
            <p className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>Need More Help?</p>
            <p className="text-xs" style={{ color: 'var(--text3)' }}>Contact support or check documentation</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading spinner overlay
  {loading && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  )}

  return null;
}

