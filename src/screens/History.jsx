import { useState, useMemo } from 'react';
import { formatDateTime, nextBillNumber } from '../utils.js';
import BillPreview from './BillPreview.jsx';

export default function History({ username, bills, menu, onBillUpdated, profile, displayName, onBack }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editBill, setEditBill] = useState(null);
  const [reprinting, setReprinting] = useState(false);

  const sortedBills = useMemo(() =>
    [...bills].sort((a, b) => b.timestamp - a.timestamp),
    [bills]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return sortedBills;
    const q = search.toLowerCase();
    return sortedBills.filter(b =>
      b.billNumber?.toLowerCase().includes(q) ||
      b.items?.some(i => i.name.toLowerCase().includes(q))
    );
  }, [sortedBills, search]);

  function openBill(bill) {
    setSelected(bill);
    setEditBill(JSON.parse(JSON.stringify(bill)));
    setEditMode(false);
  }

  function saveEdit() {
    const updated = { ...editBill, edited: true };
    const newBills = bills.map(b => b.billNumber === updated.billNumber ? updated : b);
    onBillUpdated(updated, newBills);
    setSelected(updated);
    setEditMode(false);
  }

  function updateEditQty(idx, qty) {
    if (qty <= 0) {
      setEditBill(b => ({ ...b, items: b.items.filter((_, i) => i !== idx) }));
    } else {
      setEditBill(b => ({ ...b, items: b.items.map((item, i) => i === idx ? { ...item, qty } : item) }));
    }
  }
  function updateEditPrice(idx, price) {
    setEditBill(b => ({ ...b, items: b.items.map((item, i) => i === idx ? { ...item, price: parseFloat(price) || 0 } : item) }));
  }
  function updateDiscount(val) {
    setEditBill(b => ({ ...b, discount: parseFloat(val) || 0 }));
  }
  const editSubtotal = editBill ? editBill.items.reduce((s, i) => s + i.price * i.qty, 0) : 0;
  const editTotal = editBill ? Math.max(0, editSubtotal - (editBill.discount || 0)) : 0;

  if (reprinting && selected) return (
    <BillPreview
      cart={selected.items.map(i => ({ ...i, cartId: Date.now() + Math.random(), qty: i.qty || 1 }))}
      username={username}
      bills={bills.filter(b => b.billNumber !== selected.billNumber)}
      profile={profile}
      displayName={displayName}
      orderNumber={selected.orderNumber || 1}
      onPrinted={() => { setReprinting(false); }}
      onBack={() => setReprinting(false)}
    />
  );

  if (selected) return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <button className="btn btn-ghost py-2 px-3" onClick={() => setSelected(null)}>← Back</button>
        <div className="flex-1">
          <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>
            {selected.billNumber}
            {selected.edited && <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full"
              style={{ background: 'var(--warn)', color: '#fff' }}>edited</span>}
            {selected.isSample && <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full"
              style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>sample</span>}
          </h2>
          <p className="text-xs" style={{ color: 'var(--text2)' }}>{formatDateTime(selected.timestamp)}</p>
        </div>
        <button className="btn btn-secondary text-sm py-2" onClick={() => { setEditMode(!editMode); }}>
          {editMode ? 'Cancel Edit' : '✏️ Edit'}
        </button>
        <button className="btn btn-ghost text-sm py-2" onClick={() => setReprinting(true)}>🖨️</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-28">
        <div className="card p-5 max-w-sm mx-auto space-y-4">
          {editMode ? (
            <>
              {editBill.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>{item.name}</span>
                  <div className="flex items-center gap-1">
                    <button className="btn btn-secondary text-base w-8 h-8 p-0 rounded-lg"
                      onClick={() => updateEditQty(idx, item.qty - 1)}>−</button>
                    <span className="w-6 text-center font-bold">{item.qty}</span>
                    <button className="btn btn-primary text-base w-8 h-8 p-0 rounded-lg"
                      onClick={() => updateEditQty(idx, item.qty + 1)}>+</button>
                  </div>
                  <div className="relative w-24">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text2)' }}>₹</span>
                    <input className="input text-sm py-1 pl-6 text-right"
                      type="number" value={item.price}
                      onChange={e => updateEditPrice(idx, e.target.value)} />
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <span className="text-sm flex-1" style={{ color: 'var(--text2)' }}>Discount (₹)</span>
                <div className="relative w-28">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text2)' }}>₹</span>
                  <input className="input text-sm py-1 pl-6 text-right"
                    type="number" value={editBill.discount || ''}
                    onChange={e => updateDiscount(e.target.value)} />
                </div>
              </div>
              <hr style={{ borderColor: 'var(--border)' }} />
              <div className="flex justify-between font-bold text-lg">
                <span style={{ color: 'var(--text)' }}>Total</span>
                <span style={{ color: 'var(--accent)' }}>₹{editTotal.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <>
              {selected.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text)' }}>{item.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text2)' }}>{item.qty} × ₹{item.price}</p>
                  </div>
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>₹{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
              {selected.discount > 0 && (
                <div className="flex justify-between text-sm" style={{ color: 'var(--text2)' }}>
                  <span>Discount</span><span>−₹{selected.discount.toFixed(2)}</span>
                </div>
              )}
              <hr style={{ borderColor: 'var(--border)' }} />
              <div className="flex justify-between font-bold text-xl">
                <span style={{ color: 'var(--text)' }}>Total</span>
                <span style={{ color: 'var(--accent)' }}>₹{selected.total.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {editMode && (
        <div className="sticky bottom-0 p-4" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary w-full py-4" onClick={saveEdit}>💾 Save Changes</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <button className="btn btn-ghost py-2 px-3" onClick={onBack}>← Back</button>
        <h2 className="font-bold text-lg flex-1" style={{ color: 'var(--text)' }}>Bill History</h2>
        <span className="text-sm" style={{ color: 'var(--text2)' }}>{bills.length} bills</span>
      </div>

      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text2)' }}>🔍</span>
          <input className="input pl-9 text-sm" placeholder="Search by bill # or item name…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--text2)' }}>
          <div className="text-5xl">📋</div>
          <p>{search ? 'No matching bills' : 'No bills yet'}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'var(--border)' }}>
          {filtered.map(bill => (
            <button key={bill.billNumber} className="w-full text-left px-4 py-4 hover:bg-[var(--surface2)] transition-colors"
              onClick={() => openBill(bill)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {bill.billNumber}
                    {bill.edited && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--warn)', color: '#fff' }}>edited</span>}
                    {bill.isSample && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>sample</span>}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>{formatDateTime(bill.timestamp)}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>{bill.items?.length || 0} items</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-base" style={{ color: 'var(--accent)' }}>₹{bill.total?.toFixed(2)}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>→</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
