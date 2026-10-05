import { useState } from 'react';
import { useToast } from '../utils.js';

function genId() { return Date.now() + Math.random(); }

export default function AddManually({ existingMenu, onSave, onCancel }) {
  const showToast = useToast();
  const [catTitle, setCatTitle] = useState('');
  const [items, setItems] = useState([{ id: genId(), name: '', price: '', hasPortions: false }]);
  const [saved, setSaved] = useState(false);

  function addRow() {
    setItems(it => [...it, { id: genId(), name: '', price: '', hasPortions: false }]);
  }
  function updateRow(id, field, val) {
    setItems(it => it.map(i => i.id === id ? { ...i, [field]: val } : i));
  }
  function removeRow(id) {
    if (items.length === 1) return;
    setItems(it => it.filter(i => i.id !== id));
  }

  const validItems = items.filter(i => i.name.trim() && parseFloat(i.price) > 0);
  const canSave = catTitle.trim().length > 0 && validItems.length > 0;

  function handleSave() {
    if (!canSave) return;

    // Merge with existing
    const existingCat = existingMenu.find(
      c => c.title.toLowerCase().trim() === catTitle.toLowerCase().trim()
    );

    let added = 0, skipped = 0;
    const newMenu = existingMenu.map(c => ({ ...c, items: [...c.items] }));

    if (existingCat) {
      const cat = newMenu.find(c => c.title.toLowerCase().trim() === catTitle.toLowerCase().trim());
      for (const item of validItems) {
        const isDupe = cat.items.some(ei => ei.name.toLowerCase().trim() === item.name.toLowerCase().trim());
        if (isDupe) { skipped++; } else { cat.items.push({ ...item, id: genId(), price: parseFloat(item.price) }); added++; }
      }
    } else {
      newMenu.push({
        title: catTitle.trim(),
        id: genId(),
        items: validItems.map(i => ({ ...i, price: parseFloat(i.price), id: genId() }))
      });
      added = validItems.length;
    }

    onSave(newMenu);
    setSaved(true);
    const msg = `${added} item${added !== 1 ? 's' : ''} added${skipped ? `, ${skipped} duplicate${skipped !== 1 ? 's' : ''} skipped` : ''}`;
    if (showToast) showToast(msg);
    setTimeout(() => { setSaved(false); onCancel(); }, 800);
  }

  return (
    <div className="fade-in flex flex-col" style={{ minHeight: '100%' }}>
      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Add Menu Items</h2>
        <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>Fill in a category and at least one item with a price.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-5">
        {/* Category */}
        <div>
          <label className="label">Category Title</label>
          <input className="input" placeholder="e.g. Starters, Main Course…"
            value={catTitle} onChange={e => setCatTitle(e.target.value)} />
          {existingMenu.some(c => c.title.toLowerCase().trim() === catTitle.toLowerCase().trim()) && catTitle.trim() && (
            <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>
              ℹ️ Items will be added to the existing "{catTitle}" category.
            </p>
          )}
        </div>

        {/* Item rows */}
        <div>
          <label className="label">Items</label>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    className="input flex-1 text-sm"
                    placeholder={`Item name ${idx + 1}`}
                    value={item.name}
                    onChange={e => updateRow(item.id, 'name', e.target.value)}
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text2)' }}>₹</span>
                    <input
                      className="input text-sm w-28 pl-7"
                      type="number" min="0" placeholder="Price"
                      value={item.price}
                      onChange={e => updateRow(item.id, 'price', e.target.value)}
                    />
                  </div>
                  {items.length > 1 && (
                    <button className="btn btn-ghost py-2 px-3 text-sm" style={{ color: 'var(--danger)' }}
                      onClick={() => removeRow(item.id)}>✕</button>
                  )}
                </div>
                {/* Half/Full checkbox */}
                <label className="flex items-center gap-2 px-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.hasPortions}
                    onChange={e => updateRow(item.id, 'hasPortions', e.target.checked)}
                    className="w-4 h-4 rounded border-2 cursor-pointer"
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>
                    Has Half/Full option
                  </span>
                </label>
              </div>
            ))}
          </div>

          <button className="btn btn-ghost text-sm py-3 w-full mt-2"
            style={{ border: '1.5px dashed var(--border)', color: 'var(--accent)' }}
            onClick={addRow}>
            + Add another item
          </button>
        </div>
      </div>

      {/* Sticky bottom */}
      <div className="sticky bottom-0 p-4 flex gap-3" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-secondary flex-1" onClick={onCancel}>Cancel</button>
        {saved ? (
          <div className="check-pop flex-1 flex items-center justify-center gap-2 rounded-2xl font-bold"
            style={{ background: 'var(--success)', color: '#fff' }}>
            ✅ Saved!
          </div>
        ) : (
          <button className="btn btn-primary flex-1" disabled={!canSave} onClick={handleSave}>
            Save Items
          </button>
        )}
      </div>
    </div>
  );
}
