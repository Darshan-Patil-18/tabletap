import { useState, useRef } from 'react';
import { nextBillNumber, formatDateTime, inr } from '../utils.js';

const PAYMENT_OPTIONS = [
  { id: 'Cash', label: 'Cash', icon: '💵' },
];

export default function BillPreview({ cart, username, bills, profile, displayName, orderNumber, onPrinted, onBack }) {
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [printing, setPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);
  const [done, setDone] = useState(false);
  const receiptRef = useRef();

  const billNumber = nextBillNumber(bills);
  const now = Date.now();
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt = parseFloat(discount) || 0;
  const tax = Math.round((subtotal - discountAmt) * 0.05);
  const total = Math.max(0, subtotal - discountAmt + tax);
  const logo = profile?.logo || null;

  function handlePrint() {
    setPrinting(true); setPrintProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 6;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setPrintProgress(100);
        setTimeout(() => {
          window.print();
          setDone(true);
          const bill = {
            billNumber, timestamp: now,
            items: cart.map(i => ({ name: i.name, category: i.category, price: i.price, qty: i.qty, isCustom: !!i.isCustom })),
            orderNumber,
            paymentMethod,
            discount: discountAmt,
            tax,
            subtotal,
            total,
          };
          setTimeout(() => onPrinted(bill), 1500); // Show success screen for 1.5 seconds then close
        }, 300);
      } else {
        setPrintProgress(Math.round(p));
      }
    }, 70);
  }

  if (done) return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-8 animate-fade-in"
      style={{ background: 'var(--bg-gradient)' }}>
      <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
        style={{ background: 'var(--success-bg)', border: '2px solid var(--success)' }}>
        ✅
      </div>
      <p className="font-heading font-black text-2xl" style={{ color: 'var(--text)' }}>Bill Saved!</p>
      <p className="text-sm font-semibold" style={{ color: 'var(--text2)' }}>#{billNumber} · {paymentMethod} · ₹{total.toFixed(0)}</p>
      <p className="text-xs" style={{ color: 'var(--text3)' }}>Returning to orders…</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-gradient)' }}>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-44">
        {/* Receipt Preview */}
        <div ref={receiptRef} className="thermal-receipt print-receipt max-w-sm mx-auto p-6">
          {/* Restaurant Header */}
          <div className="text-center mb-4">
            {logo && (
              <img src={logo} alt="logo" className="w-16 h-16 object-cover rounded-xl mx-auto mb-2 shadow" />
            )}
            <h2 className="font-black text-2xl tracking-tight text-slate-900">{displayName}</h2>
            <p className="text-xs text-slate-400 mt-1">{formatDateTime(now)}</p>
            <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-black text-white bg-gradient-to-r from-orange-500 to-amber-500">
              Bill #{billNumber} • Order #{orderNumber}
            </div>
          </div>

          <div className="border-t-2 border-dashed border-slate-200 my-4" />

          {/* Items table */}
          <div className="space-y-0.5 text-sm">
            <div className="flex text-xs font-bold text-slate-400 pb-1 border-b border-slate-200">
              <span className="flex-1">ITEM</span>
              <span className="w-8 text-center">QTY</span>
              <span className="w-14 text-right">RATE</span>
              <span className="w-16 text-right">AMT</span>
            </div>
            {cart.map((item, idx) => (
              <div key={idx} className="flex items-baseline py-1 border-b border-slate-100">
                <span className="flex-1 text-slate-800 font-medium leading-tight pr-2">{item.name}</span>
                <span className="w-8 text-center text-slate-500">{item.qty}</span>
                <span className="w-14 text-right text-slate-500">₹{item.price}</span>
                <span className="w-16 text-right font-bold text-slate-800">₹{(item.price * item.qty).toFixed(0)}</span>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-dashed border-slate-200 my-4" />

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold text-slate-800">₹{subtotal.toFixed(0)}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between">
                <span className="text-emerald-600 font-semibold">Discount</span>
                <span className="font-semibold text-emerald-600">− ₹{discountAmt.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">GST 5%</span>
              <span className="font-semibold text-slate-800">₹{tax.toFixed(0)}</span>
            </div>
            <div className="border-t-2 border-slate-900 pt-1.5">
              <div className="flex justify-between items-center">
                <span className="font-black text-xl text-slate-900">TOTAL</span>
                <span className="font-black text-2xl text-slate-900">₹{total.toFixed(0)}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400">Payment: {paymentMethod}</p>
          </div>

          <div className="border-t-2 border-dashed border-slate-200 mt-4 mb-3" />
          <p className="text-center text-xs text-slate-400 italic">
            Thank you for dining with us! 🙏
          </p>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 glass-panel border-t px-4 pb-6 pt-4 z-20"
        style={{ borderColor: 'var(--border)' }}>

        {/* Discount + Payment */}
        <div className="flex gap-3 mb-4">
          {/* Discount input */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--text3)' }}>₹</span>
            <input
              className="input pl-8 text-sm py-2.5"
              type="number"
              min="0"
              max={subtotal}
              placeholder="Discount…"
              value={discount}
              onChange={e => setDiscount(e.target.value)}
            />
          </div>
        </div>

        {/* Summary row */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>
            {cart.length} item{cart.length !== 1 ? 's' : ''} • Order #{orderNumber}
          </div>
          <div className="font-heading font-black text-2xl" style={{ color: 'var(--text)' }}>₹{total.toFixed(0)}</div>
        </div>

        {printing ? (
          <div className="glass-card p-4 rounded-2xl">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold" style={{ color: 'var(--text2)' }}>Saving bill…</span>
              <span className="font-black" style={{ color: 'var(--primary)' }}>{printProgress}%</span>
            </div>
            <div className="w-full rounded-full h-2.5 overflow-hidden" style={{ background: 'var(--surface2)' }}>
              <div
                className="h-full rounded-full transition-all duration-75"
                style={{ width: `${printProgress}%`, background: 'var(--primary-gradient)' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button className="btn btn-secondary py-3.5 px-4 text-sm" onClick={onBack}>← Back</button>
            <button
              className="btn btn-primary flex-1 py-4 text-sm font-bold shadow-lg shadow-orange-500/25"
              onClick={handlePrint}>
              🖨️ Print & Save Bill
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
