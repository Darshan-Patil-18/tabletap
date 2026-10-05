import { useState, useRef } from 'react';
import { getUsers, saveUsers, getProfile, saveProfile } from '../utils.js';

export default function ProfileCard({ username, onClose }) {
  const users = getUsers();
  const user = users[username] || {};
  const profile = getProfile(username);
  const [logo, setLogo] = useState(profile.logo || null);
  const fileRef = useRef();

  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = ev.target.result;
      setLogo(b64);
      saveProfile(username, { ...profile, logo: b64 });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="card scale-in p-6 w-72" style={{ position: 'relative' }}>
      <button onClick={onClose} className="absolute top-3 right-3 btn btn-ghost p-1 rounded-lg"
        style={{ fontSize: 18 }}>✕</button>

      <div className="flex flex-col items-center gap-3">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          {logo
            ? <img src={logo} alt="logo" className="w-full h-full object-cover" />
            : <span className="text-4xl">🍽️</span>}
        </div>

        <div className="text-center">
          <p className="font-bold text-lg" style={{ color: 'var(--text)' }}>{user.username || 'User'}</p>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>{username}</p>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        <button className="btn btn-secondary text-sm py-2 px-4 w-full"
          onClick={() => fileRef.current.click()}>
          {logo ? '🖼️ Change Logo' : '📷 Add Logo'}
        </button>
      </div>
    </div>
  );
}
