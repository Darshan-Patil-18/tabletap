import { useState } from 'react';
import { sha256, getUsers, saveUsers } from '../utils.js';

export default function Register({ onSwitch, onDone }) {
  const [step, setStep] = useState(1); // 1: username, 2: create PIN, 3: confirm PIN
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleUsernameNext(e) {
    e.preventDefault();
    if (!username.trim()) {
      setErrors({ username: 'Username is required' });
      return;
    }
    const users = getUsers();
    if (users[username.toLowerCase()]) {
      setErrors({ username: 'This username is already taken' });
      return;
    }
    setErrors({});
    setStep(2);
  }

  function handlePinInput(index, value, isConfirm = false) {
    if (!/^\d*$/.test(value)) return; // Only allow numbers
    
    const arr = isConfirm ? [...confirmPin] : [...pin];
    arr[index] = value.slice(-1); // Only take last digit
    
    if (isConfirm) {
      setConfirmPin(arr);
    } else {
      setPin(arr);
    }
    
    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(
        isConfirm ? `confirm-pin-${index + 1}` : `pin-${index + 1}`
      );
      if (nextInput) nextInput.focus();
    }
  }

  function handlePinBackspace(index, isConfirm = false) {
    if (index > 0) {
      const prevInput = document.getElementById(
        isConfirm ? `confirm-pin-${index - 1}` : `pin-${index - 1}`
      );
      if (prevInput) prevInput.focus();
    }
  }

  function handleCreatePinNext(e) {
    e.preventDefault();
    const pinStr = pin.join('');
    if (pinStr.length !== 4) {
      setErrors({ pin: 'Please enter 4-digit PIN' });
      return;
    }
    setErrors({});
    setStep(3);
  }

  async function handleConfirmPinSubmit(e) {
    e.preventDefault();
    const pinStr = pin.join('');
    const confirmPinStr = confirmPin.join('');
    
    if (confirmPinStr.length !== 4) {
      setErrors({ confirmPin: 'Please enter 4-digit PIN' });
      return;
    }
    
    if (pinStr !== confirmPinStr) {
      setErrors({ confirmPin: 'PINs do not match' });
      return;
    }

    setLoading(true);
    try {
      const hash = await sha256(pinStr);
      const users = getUsers();
      users[username.toLowerCase()] = {
        username: username,
        hash
      };
      saveUsers(users);
      setSuccess(true);
      setTimeout(() => onDone?.(), 1400);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-scale-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-orange-500/30"
              style={{ background: 'var(--primary-gradient)' }}>
              🍽️
            </div>
            <span className="font-heading font-black text-2xl tracking-tight" style={{ color: 'var(--text)' }}>
              Table<span className="text-orange-500">Tap</span>
            </span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold" style={{ color: 'var(--text)' }}>
            {step === 1 ? 'Create Your Account' : step === 2 ? 'Create Your PIN' : 'Confirm Your PIN'}
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text2)' }}>
            {step === 1 ? 'Enter your username to get started' : step === 2 ? 'Enter a 4-digit PIN' : 'Re-enter your PIN to confirm'}
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-7 shadow-2xl border">
          {success ? (
            <div className="animate-fade-in flex flex-col items-center gap-4 py-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                style={{ background: 'var(--success-bg)', border: '2px solid var(--success)' }}>
                ✅
              </div>
              <p className="font-bold text-lg" style={{ color: 'var(--text)' }}>Account Created!</p>
              <p className="text-sm" style={{ color: 'var(--text2)' }}>Welcome to TableTap!</p>
            </div>
          ) : (
            <>
              {/* Step 1: Username */}
              {step === 1 && (
                <form onSubmit={handleUsernameNext} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: 'var(--text2)' }}>
                      👤 Username
                    </label>
                    <input 
                      className="input" 
                      placeholder="Enter your username"
                      value={username} 
                      onChange={e => setUsername(e.target.value)} 
                      autoFocus
                    />
                    {errors.username && (
                      <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--danger)' }}>
                        <span>⚠️</span>{errors.username}
                      </p>
                    )}
                  </div>

                  <button
                    className="btn btn-primary w-full py-4 text-sm font-bold shadow-lg shadow-orange-500/25"
                    type="submit">
                    Next →
                  </button>
                </form>
              )}

              {/* Step 2: Create PIN */}
              {step === 2 && (
                <form onSubmit={handleCreatePinNext} className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-3 text-center"
                      style={{ color: 'var(--text2)' }}>
                      🔐 Create 4-Digit PIN
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
                            onChange={e => handlePinInput(index, e.target.value, false)}
                            onKeyDown={e => {
                              if (e.key === 'Backspace' && !digit) {
                                handlePinBackspace(index, false);
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
                    {errors.pin && (
                      <p className="text-xs mt-2 text-center flex items-center justify-center gap-1" style={{ color: 'var(--danger)' }}>
                        <span>⚠️</span>{errors.pin}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      className="btn btn-secondary py-3 px-4 text-sm"
                      type="button"
                      onClick={() => { setStep(1); setPin(['', '', '', '']); setErrors({}); }}>
                      ← Back
                    </button>
                    <button
                      className="btn btn-primary flex-1 py-4 text-sm font-bold shadow-lg shadow-orange-500/25"
                      type="submit">
                      Next →
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Confirm PIN */}
              {step === 3 && (
                <form onSubmit={handleConfirmPinSubmit} className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-3 text-center"
                      style={{ color: 'var(--text2)' }}>
                      🔒 Confirm Your PIN
                    </label>
                    <div className="flex gap-3 justify-center mb-2">
                      {confirmPin.map((digit, index) => (
                        <div key={index} className="relative">
                          <input
                            id={`confirm-pin-${index}`}
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
                            onChange={e => handlePinInput(index, e.target.value, true)}
                            onKeyDown={e => {
                              if (e.key === 'Backspace' && !digit) {
                                handlePinBackspace(index, true);
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
                    {errors.confirmPin && (
                      <p className="text-xs mt-2 text-center flex items-center justify-center gap-1" style={{ color: 'var(--danger)' }}>
                        <span>⚠️</span>{errors.confirmPin}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      className="btn btn-secondary py-3 px-4 text-sm"
                      type="button"
                      onClick={() => { setStep(2); setConfirmPin(['', '', '', '']); setErrors({}); }}>
                      ← Back
                    </button>
                    <button
                      className="btn btn-primary flex-1 py-4 text-sm font-bold shadow-lg shadow-orange-500/25"
                      type="submit"
                      disabled={loading}>
                      {loading
                        ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : '🚀 Create Account'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text2)' }}>
              Already have an account?{' '}
              <button
                type="button"
                className="font-bold text-orange-500 hover:text-orange-600 transition-colors ml-1 cursor-pointer"
                onClick={() => onSwitch('login')}>
                Sign In →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
