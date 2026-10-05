import { useState } from 'react';
import { useToast } from '../utils.js';

function genId() { return Date.now() + Math.random(); }

export default function EditMenu({ menu, onSave, onBack }) {
  const showToast = useToast();
  const [cats, setCats] = useState(() =>
    menu.map(c => ({ ...c, id: c.id || genId(), items: c.items.map(i => ({ ...i, id: i.id || genId(), hasPortions: i.hasPortions || false })) }))
  );
  const [saved, setSaved] = useState(false);

  function updateCatTitle(catId, title) {
    setCats(cs => cs.map(c => c.id === catId ? { ...c, title } : c));
  }
  function updateItem(catId, itemId, field, val) {
    setCats(cs => cs.map(c => c.id === catId
      ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, [field]: val } : i) }
      : c));
  }
  function deleteItem(catId, itemId) {
    setCats(cs => cs.map(c => c.id === catId
      ? { ...c, items: c.items.filter(i => i.id !== itemId) }
      : c).filter(c => c.items.length > 0));
  }
  function deleteCat(catId) { setCats(cs => cs.filter(c => c.id !== catId)); }
  function addItem(catId) {
    setCats(cs => cs.map(c => c.id === catId
      ? { ...c, items: [...c.items, { id: genId(), name: '', price: 0, hasPortions: false }] }
      : c));
  }
  function addCategory() {
    setCats(cs => [...cs, { id: genId(), title: 'New Category', items: [{ id: genId(), name: '', price: 0, hasPortions: false }] }]);
  }

  function handleSave() {
    const clean = cats
      .map(c => ({ ...c, items: c.items.filter(i => i.name.trim()) }))
      .filter(c => c.items.length > 0);
    onSave(clean);
    setSaved(true);
    const total = clean.reduce((s, c) => s + c.items.length, 0);
    if (showToast) showToast(`Menu saved — ${total} items across ${clean.length} categories`);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <button className="btn btn-ghost py-2 px-3" onClick={onBack}>← Back</button>
        <h2 className="font-bold text-lg flex-1" style={{ color: 'var(--text)' }}>Edit Menu</h2>
        <button className="btn btn-secondary text-sm py-2" onClick={addCategory}>+ Category</button>
      </div>

      <p className="text-xs px-4 pt-3 pb-1" style={{ color: 'var(--text2)' }}>
        ✏️ Tap any field to edit directly.
      </p>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-24">
        {cats.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--text2)' }}>
            <p className="text-4xl mb-2">📋</p>
            <p>No categories yet. Add one above.</p>
          </div>
        )}
        {cats.map(cat => (
          <div key={cat.id} className="card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input className="input font-bold text-base flex-1"
                value={cat.title}
                onChange={e => updateCatTitle(cat.id, e.target.value)}
                placeholder="Category name" />
              <button className="btn btn-ghost py-2 px-3 text-sm" style={{ color: 'var(--danger)' }}
                onClick={() => deleteCat(cat.id)}>🗑️</button>
            </div>
            {cat.items.map(item => (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input className="input text-sm flex-1"
                    value={item.name}
                    onChange={e => updateItem(cat.id, item.id, 'name', e.target.value)}
                    placeholder="Item name" />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text2)' }}>₹</span>
                    <input className="input text-sm w-24 pl-7"
                      type="number" min="0"
                      value={item.price}
                      onChange={e => updateItem(cat.id, item.id, 'price', parseFloat(e.target.value) || 0)} />
                  </div>
                  <button className="btn btn-ghost py-2 px-3 text-sm" style={{ color: 'var(--danger)' }}
                    onClick={() => deleteItem(cat.id, item.id)}>✕</button>
                </div>
                {/* Half/Full checkbox */}
                <label className="flex items-center gap-2 px-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.hasPortions || false}
                    onChange={e => updateItem(cat.id, item.id, 'hasPortions', e.target.checked)}
                    className="w-4 h-4 rounded border-2 cursor-pointer"
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>
                    Has Half/Full option
                  </span>
                </label>
              </div>
            ))}
            <button className="btn btn-ghost text-sm py-2 w-full"
              style={{ border: '1.5px dashed var(--border)', color: 'var(--accent)' }}
              onClick={() => addItem(cat.id)}>
              + Add item
            </button>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 p-4" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
        {saved ? (
          <div className="check-pop flex items-center justify-center gap-2 py-3 rounded-2xl font-bold"
            style={{ background: 'var(--success)', color: '#fff' }}>
            ✅ Menu saved!
          </div>
        ) : (
          <button className="btn btn-primary w-full py-4 text-base" onClick={handleSave}>💾 Save Menu</button>
        )}
      </div>
    </div>
  );
}
