import { useState, useMemo } from 'react';
import BillPreview from './BillPreview.jsx';
import History from './History.jsx';
import { useToast } from '../utils.js';

function genId() { return Date.now() + Math.random(); }

const CATEGORY_ICONS = {
  'Starters': '🥗', 'Starter': '🥗',
  'Main Course': '🍛', 'Mains': '🍛',
  'Rice & Biryani': '🍚', 'Biryani': '🍚', 'Rice': '🍚',
  'Breads': '🫓', 'Bread': '🫓',
  'Beverages': '🥤', 'Drinks': '🥤', 'Beverage': '🥤',
  'Desserts': '🍮', 'Dessert': '🍮', 'Sweets': '🍮',
  'Soups': '🍲', 'Soup': '🍲',
  'Salads': '🥙', 'Salad': '🥙',
  'Sides': '🍟', 'Side': '🍟',
  'Custom': '✨',
};

function getCatIcon(title) {
  return CATEGORY_ICONS[title] || '🍽️';
}

// PortionModal — shown when user clicks Add on an item, lets them choose Full/Half
function PortionModal({ item, onAdd, onClose }) {
  const fullPrice = item.price;
  const halfPrice = Math.round(fullPrice / 2);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 glass-panel rounded-t-3xl px-5 pb-8 pt-4 border-t animate-scale-up"
        style={{ borderColor: 'var(--border)' }}>
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
        <p className="font-heading font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>{item.name}</p>
        <p className="text-xs mb-5" style={{ color: 'var(--text2)' }}>Select portion size:</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onAdd(item, 'Half', halfPrice)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(249,115,22,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}>
            <span className="text-3xl">🍽️</span>
            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>Half</span>
            <span className="font-heading font-black text-xl" style={{ color: 'var(--primary)' }}>₹{halfPrice}</span>
          </button>
          <button
            onClick={() => onAdd(item, 'Full', fullPrice)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer"
            style={{ borderColor: 'var(--primary)', background: 'rgba(249,115,22,0.06)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.06)'; }}>
            <span className="text-3xl">🍛</span>
            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>Full</span>
            <span className="font-heading font-black text-xl" style={{ color: 'var(--primary)' }}>₹{fullPrice}</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default function OrderScreen({ username, menu, bills, onBillSaved, profile, displayName }) {
  const showToast = useToast();
  const [activeCategory, setActiveCategory] = useState(menu[0]?.title || '');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState('order');
  const [customItemOpen, setCustomItemOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [orderNumber, setOrderNumber] = useState(1);
  // Portion modal state
  const [portionItem, setPortionItem] = useState(null);
  
  function shouldShowPortions(item) {
    return item.hasPortions === true;
  }

  const allItems = useMemo(() => {
    const arr = [];
    for (const cat of menu) {
      for (const item of cat.items) arr.push({ ...item, category: cat.title });
    }
    return arr;
  }, [menu]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allItems.filter(i => i.name.toLowerCase().includes(q));
  }, [search, allItems]);

  const categoryItems = useMemo(() => {
    const cat = menu.find(c => c.title === activeCategory);
    if (!cat) return [];
    return [...cat.items].sort((a, b) => a.name.localeCompare(b.name));
  }, [menu, activeCategory]);

  // cartKey combines name+portion so Full/Half are separate cart rows
  function cartKey(name, category, portion) {
    return `${name}||${category}||${portion || 'Full'}`;
  }

  function addToCartWithPortion(item, portion, price) {
    const key = cartKey(item.name, item.category, portion);
    setCart(c => {
      const ex = c.find(ci => ci._key === key);
      if (ex) return c.map(ci => ci._key === key ? { ...ci, qty: ci.qty + 1 } : ci);
      const label = portion === 'Full' ? item.name : `${item.name} (Half)`;
      return [...c, {
        ...item,
        name: label,
        price,
        portion,
        cartId: genId(),
        _key: key,
        qty: 1,
      }];
    });
    setPortionItem(null);
  }

  // When Add is clicked — show portion modal OR add directly if single-portion category
  function handleAddClick(item) {
    if (shouldShowPortions(item)) {
      setPortionItem(item);
    } else {
      // Add directly without portion selection
      addToCartWithPortion(item, 'Full', item.price);
    }
  }

  function setQty(cartId, qty) {
    if (qty <= 0) setCart(c => c.filter(ci => ci.cartId !== cartId));
    else setCart(c => c.map(ci => ci.cartId === cartId ? { ...ci, qty } : ci));
  }

  function removeFromCart(cartId) { setCart(c => c.filter(ci => ci.cartId !== cartId)); }

  function getCartQty(item) {
    // Sum across all portions for this item
    return cart.filter(ci =>
      (ci.name === item.name || ci.name === `${item.name} (Half)`) &&
      ci.category === item.category
    ).reduce((s, ci) => s + ci.qty, 0);
  }

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  function addCustomItem() {
    if (!customName.trim() || !parseFloat(customPrice)) return;
    const item = {
      cartId: genId(),
      _key: cartKey(customName.trim(), 'Custom', 'Full'),
      name: customName.trim(),
      price: parseFloat(customPrice),
      category: 'Custom',
      portion: 'Full',
      qty: 1,
      isCustom: true,
    };
    setCart(c => [...c, item]);
    setCustomName(''); setCustomPrice(''); setCustomItemOpen(false);
  }

  function cancelOrder() {
    setCart([]); setCartOpen(false); setCancelConfirm(false);
  }

  if (view === 'billing') return (
    <BillPreview
      cart={cart}
      username={username}
      bills={bills}
      profile={profile}
      displayName={displayName}
      orderNumber={orderNumber}
      onPrinted={(bill) => {
        onBillSaved(bill);
        setCart([]); setCartOpen(false); setView('order');
        setOrderNumber(prev => prev + 1); // Increment order number
        if (showToast) showToast(`✅ Bill ${bill.billNumber} saved`);
      }}
      onBack={() => setView('order')}
    />
  );

  if (view === 'history') return (
    <History
      username={username} bills={bills} menu={menu}
      onBillUpdated={onBillSaved}
      profile={profile} displayName={displayName}
      onBack={() => setView('order')}
    />
  );

  const displayItems = search.trim() ? filteredItems : categoryItems;

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-gradient)' }}>

      {/* Search + Custom + History bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text3)' }}>🔍</span>
            <input
              className="input pl-9 py-2.5 text-sm"
              placeholder="Search menu items…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-base font-bold"
                style={{ color: 'var(--text3)' }}
                onClick={() => setSearch('')}>✕</button>
            )}
          </div>
          <button className="btn btn-secondary text-xs py-2.5 px-3 whitespace-nowrap"
            onClick={() => setCustomItemOpen(true)}>
            ✨ Custom
          </button>
          <button className="btn btn-secondary text-xs py-2.5 px-3 whitespace-nowrap"
            onClick={() => setView('history')}>
            📋 History
          </button>
        </div>
      </div>

      {/* Category tabs */}
      {!search.trim() && (
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {menu.map(cat => {
            const isActive = activeCategory === cat.title;
            return (
              <button
                key={cat.title}
                onClick={() => setActiveCategory(cat.title)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all duration-200 border"
                style={isActive
                  ? { background: 'var(--primary-gradient)', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }
                  : { background: 'var(--surface)', color: 'var(--text2)', borderColor: 'var(--border)' }}>
                <span>{getCatIcon(cat.title)}</span>
                <span>{cat.title}</span>
                <span className="text-[10px] opacity-75">({cat.items.length})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Items grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {search.trim() && filteredItems.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>No items found</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>Try a different search term</p>
          </div>
        )}

        {search.trim() && filteredItems.length > 0 && (
          <p className="text-xs py-2 font-semibold" style={{ color: 'var(--text2)' }}>
            {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} found
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          {displayItems.map((item) => {
            const qty = getCartQty(item);
            const isVeg = item.isVeg !== false;
            return (
              <div key={item.name + item.category}
                className="glass-card p-3.5 flex flex-col gap-2 relative overflow-hidden"
                style={qty > 0 ? { borderColor: 'var(--primary)', borderWidth: '2px' } : {}}>

                {/* Category label in search mode */}
                {search.trim() && (
                  <p className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md w-fit"
                    style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>
                    {item.category}
                  </p>
                )}

                {/* Name + veg badge */}
                <div className="flex items-start justify-between gap-1">
                  <p className="font-semibold text-base leading-tight" style={{ color: 'var(--text)' }}>{item.name}</p>
                  <div className={isVeg ? 'veg-tag flex-shrink-0 mt-0.5' : 'nonveg-tag flex-shrink-0 mt-0.5'} />
                </div>

                {/* Desc if present */}
                {item.desc && (
                  <p className="text-[11px] leading-snug line-clamp-2" style={{ color: 'var(--text3)' }}>{item.desc}</p>
                )}

                <div className="flex items-center justify-between mt-auto">
                  <p className="font-heading font-black text-base" style={{ color: 'var(--primary)' }}>₹{item.price}</p>

                  {qty === 0 ? (
                    <button
                      className="btn btn-primary text-xs py-2 px-4 rounded-xl"
                      onClick={() => handleAddClick(item)}>
                      Add
                    </button>
                  ) : (
                    /* Show qty + quick + more button */
                    <div className="flex items-center gap-1">
                      <button
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-lg font-bold transition-all"
                        style={{ background: 'var(--surface2)', color: 'var(--text)' }}
                        onClick={() => {
                          // Remove last added portion for this item
                          const lastEntry = [...cart].reverse().find(ci =>
                            ci.name === item.name || ci.name === `${item.name} (Half)`
                          );
                          if (lastEntry) setQty(lastEntry.cartId, lastEntry.qty - 1);
                        }}>
                        −
                      </button>
                      <button
                        className="h-8 px-2 rounded-xl flex items-center justify-center text-xs font-black transition-all"
                        style={{ background: 'var(--surface2)', color: 'var(--primary)', minWidth: '1.75rem' }}
                        onClick={() => handleAddClick(item)}>
                        {qty}+
                      </button>
                    </div>
                  )}
                </div>

                {/* In-cart indicator dot */}
                {qty > 0 && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                    style={{ background: 'var(--primary-gradient)' }}>
                    {qty}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart sticky bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-3 z-30"
          style={{ background: 'linear-gradient(to top, var(--bg) 70%, transparent)' }}>
          <button
            className="w-full btn btn-primary py-4 text-sm font-bold relative shadow-2xl shadow-orange-500/30 rounded-2xl"
            onClick={() => setCartOpen(true)}>
            <span className="absolute left-4 w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm"
              style={{ background: 'rgba(255,255,255,0.25)' }}>
              {cartCount}
            </span>
            🛒 View Cart • Order #{orderNumber}
            <span className="absolute right-4 font-heading font-black text-base">₹{cartTotal.toFixed(0)}</span>
          </button>
        </div>
      )}

      {/* Portion selection modal */}
      {portionItem && (
        <PortionModal
          item={portionItem}
          onAdd={addToCartWithPortion}
          onClose={() => setPortionItem(null)}
        />
      )}

      {/* Custom item bottom sheet */}
      {customItemOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setCustomItemOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 glass-panel rounded-t-3xl p-6 animate-scale-up border-t"
            style={{ borderColor: 'var(--border)' }}>
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-5" />
            <h3 className="font-heading font-bold text-xl mb-4" style={{ color: 'var(--text)' }}>✨ Custom Item</h3>
            <div className="space-y-3">
              <input className="input" placeholder="Item name e.g. Extra Sauce" value={customName}
                onChange={e => setCustomName(e.target.value)} autoFocus />
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold" style={{ color: 'var(--text3)' }}>₹</span>
                <input className="input pl-8" type="number" placeholder="0" value={customPrice}
                  onChange={e => setCustomPrice(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn btn-secondary flex-1 py-3.5" onClick={() => setCustomItemOpen(false)}>Cancel</button>
              <button className="btn btn-primary flex-1 py-3.5 font-bold"
                disabled={!customName.trim() || !parseFloat(customPrice)}
                onClick={addCustomItem}>
                Add to Cart
              </button>
            </div>
          </div>
        </>
      )}

      {/* Cart bottom sheet */}
      {cartOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 glass-panel rounded-t-3xl flex flex-col max-h-[88vh] border-t"
            style={{ borderColor: 'var(--border)' }}>
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 className="font-heading font-bold text-xl" style={{ color: 'var(--text)' }}>🛒 Order #{orderNumber}</h3>
                <p className="text-xs" style={{ color: 'var(--text2)' }}>{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
              </div>
              <button className="btn btn-ghost py-1.5 px-3 text-xl font-bold" onClick={() => setCartOpen(false)}>✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              {cart.map(item => (
                <div key={item.cartId}
                  className="flex items-center gap-3 py-2.5"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{item.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text2)' }}>₹{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-lg font-bold"
                      style={{ background: 'var(--surface2)' }}
                      onClick={() => setQty(item.cartId, item.qty - 1)}>−</button>
                    <span className="font-heading font-black text-sm w-5 text-center" style={{ color: 'var(--text)' }}>{item.qty}</span>
                    <button
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-lg font-bold"
                      style={{ background: 'var(--primary-gradient)', color: '#fff' }}
                      onClick={() => setQty(item.cartId, item.qty + 1)}>+</button>
                  </div>
                  <p className="font-heading font-black text-sm w-16 text-right" style={{ color: 'var(--primary)' }}>
                    ₹{(item.price * item.qty).toFixed(0)}
                  </p>
                  <button className="text-sm" style={{ color: 'var(--danger)' }}
                    onClick={() => removeFromCart(item.cartId)}>🗑</button>
                </div>
              ))}
            </div>

            <div className="px-5 pb-6 pt-4 flex-shrink-0 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm" style={{ color: 'var(--text2)' }}>Subtotal ({cartCount} items)</span>
                <span className="font-heading font-black text-xl" style={{ color: 'var(--text)' }}>₹{cartTotal.toFixed(0)}</span>
              </div>
              <div className="flex gap-3">
                {cancelConfirm ? (
                  <>
                    <span className="text-sm flex-1 self-center font-semibold" style={{ color: 'var(--danger)' }}>Clear all items?</span>
                    <button className="btn btn-danger flex-1 py-3.5 text-sm font-bold" onClick={cancelOrder}>Yes, Clear</button>
                    <button className="btn btn-secondary py-3.5 px-4" onClick={() => setCancelConfirm(false)}>No</button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-ghost py-3.5 px-4 text-sm font-bold"
                      style={{ color: 'var(--danger)', border: '1.5px solid var(--danger)' }}
                      onClick={() => setCancelConfirm(true)}>
                      ✕ Clear
                    </button>
                    <button
                      className="btn btn-primary flex-1 py-4 text-sm font-bold shadow-lg shadow-orange-500/25"
                      onClick={() => { setCartOpen(false); setView('billing'); }}>
                      📄 Proceed to Billing
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
