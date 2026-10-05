import { useState } from 'react';
import { mergeParsedIntoMenu } from '../ocrParser.js';

function genId() { return Date.now() + Math.random(); }

export default function ReviewMenu({ parsed, existingMenu, onSave, onBack }) {
  // Merge parsed into existing to find new/duplicates
  const { merged, added: initialAdded, skipped: initialSkipped } = mergeParsedIntoMenu(existingMenu, parsed);

  // State: editable version of merged
  const [cats, setCats] = useState(() =>
    merged.map(c => ({
      ...c,
      id: genId(),
      items: c.items.map(i => ({ ...i, id: i.id || genId() }))
    }))
  );
  const [saved, setSaved] = useState(false);
  const [saveInfo, setSaveInfo] = useState('');
  const [confirmMsg] = useState(`${initialAdded} new items added, ${initialSkipped} duplicates skipped.`);

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
  function deleteCat(catId) {
    setCats(cs => cs.filter(c => c.id !== catId));
  }
  function addItem(catId) {
    setCats(cs => cs.map(c => c.id === catId
      ? { ...c, items: [...c.items, { id: genId(), name: '', price: 0 }] }
      : c));
  }
  function moveItem(catId, itemId, newCatId) {
    let item;
    const cs = cats.map(c => {
      if (c.id === catId) { item = c.items.find(i => i.id === itemId); return { ...c, items: c.items.filter(i => i.id !== itemId) }; }
      return c;
    }).filter(c => c.items.length > 0 || c.id !== catId);
    if (!item) return;
    setCats(cs.map(c => c.id === newCatId ? { ...c, items: [...c.items, item] } : c));
  }

  function handleSave() {
    const totalItems = cats.reduce((s, c) => s + c.items.filter(i => i.name.trim()).length, 0);
    setSaveInfo(`${totalItems} items saved`);
    setSaved(true);
    onSave(cats.map(c => ({ ...c, items: c.items.filter(i => i.name.trim()) })));
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="fade-in flex flex-col h-full" style={{ minHeight: '100%' }}>
      <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <button className="btn btn-ghost py-2 px-3" onClick={onBack}>← Back</button>
        <div>
          <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Review Menu</h2>
          <p className="text-xs" style={{ color: 'var(--accent)' }}>{confirmMsg}</p>
        </div>
      </div>

      <p className="text-xs px-4 pt-3 pb-1" style={{ color: 'var(--text2)' }}>
        ✏️ Everything below is directly editable — tap any name or price to change it.
      </p>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-24">
        {cats.map(cat => (
          <div key={cat.id} className="card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                className="input font-bold text-base flex-1"
                value={cat.title}
                onChange={e => updateCatTitle(cat.id, e.target.value)}
                placeholder="Category name"
              />
              <button className="btn btn-ghost py-2 px-3 text-sm" style={{ color: 'var(--danger)' }}
                onClick={() => deleteCat(cat.id)} title="Delete category">🗑️</button>
            </div>

            {cat.items.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  className="input text-sm flex-1"
                  value={item.name}
                  onChange={e => updateItem(cat.id, item.id, 'name', e.target.value)}
                  placeholder="Item name"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text2)' }}>₹</span>
                  <input
                    className="input text-sm w-24 pl-7"
                    type="number" min="0"
                    value={item.price}
                    onChange={e => updateItem(cat.id, item.id, 'price', parseFloat(e.target.value) || 0)}
                  />
                </div>
                {/* Move to category */}
                {cats.length > 1 && (
                  <select className="input text-xs py-2 w-28"
                    value={cat.id}
                    onChange={e => moveItem(cat.id, item.id, e.target.value)}>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                )}
                <button className="btn btn-ghost py-2 px-2 text-sm" style={{ color: 'var(--danger)' }}
                  onClick={() => deleteItem(cat.id, item.id)}>✕</button>
              </div>
            ))}

            <button className="btn btn-ghost text-sm py-2 w-full"
              style={{ border: '1.5px dashed var(--border)', color: 'var(--accent)' }}
              onClick={() => addItem(cat.id)}>
              + Add item to {cat.title}
            </button>
          </div>
        ))}
      </div>

      {/* Sticky save */}
      <div className="sticky bottom-0 p-4" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
        {saved ? (
          <div className="check-pop flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-base"
            style={{ background: 'var(--success)', color: '#fff' }}>
            <span className="text-xl">✅</span> {saveInfo}
          </div>
        ) : (
          <button className="btn btn-primary w-full py-4 text-base" onClick={handleSave}>
            💾 Save Menu
          </button>
        )}
      </div>
    </div>
  );
}
