// Sample data generator for analytics demo
import { getBills, saveBills } from './utils.js';

export const DEFAULT_SAMPLE_MENU = [
  {
    title: 'Starters',
    items: [
      { name: 'Paneer Tikka', price: 260, isVeg: true, desc: 'Charcoal grilled cottage cheese marinated in spiced yogurt' },
      { name: 'Crispy Chilli Babycorn', price: 210, isVeg: true, desc: 'Golden fried babycorn tossed in spicy oriental sauce' },
      { name: 'Chicken 65', price: 280, isVeg: false, desc: 'Classic south-style spiced deep-fried chicken cubes' },
      { name: 'Veg Spring Rolls', price: 180, isVeg: true, desc: 'Crispy rolls stuffed with julienned vegetables and spices' },
      { name: 'Tandoori Chicken Wings', price: 310, isVeg: false, desc: 'Smoky clay-oven roasted wings with mint chutney' },
    ],
  },
  {
    title: 'Main Course',
    items: [
      { name: 'Paneer Butter Masala', price: 290, isVeg: true, desc: 'Rich velvety tomato cashew gravy with fresh cottage cheese' },
      { name: 'Butter Chicken', price: 350, isVeg: false, desc: 'Tender tandoori chicken simmered in creamy makhani gravy' },
      { name: 'Dal Makhani', price: 240, isVeg: true, desc: 'Slow-cooked black lentils simmered overnight with butter and cream' },
      { name: 'Kadhai Paneer', price: 280, isVeg: true, desc: 'Cottage cheese cooked with bell peppers and roasted spices' },
      { name: 'Chicken Tikka Masala', price: 360, isVeg: false, desc: 'Grilled chicken chunks in a robust spiced onion-tomato curry' },
    ],
  },
  {
    title: 'Rice & Biryani',
    items: [
      { name: 'Hyderabadi Chicken Biryani', price: 340, isVeg: false, desc: 'Aromatic layered basmati rice with marinated chicken & spices' },
      { name: 'Veg Dum Biryani', price: 260, isVeg: true, desc: 'Fragrant basmati rice slow cooked with garden fresh vegetables' },
      { name: 'Jeera Rice', price: 160, isVeg: true, desc: 'Fluffy basmati rice tempered with roasted cumin seeds' },
      { name: 'Steamed Basmati Rice', price: 120, isVeg: true, desc: 'Long grain fragrant steamed rice' },
    ],
  },
  {
    title: 'Breads',
    items: [
      { name: 'Butter Naan', price: 55, isVeg: true, desc: 'Soft leavened flatbread brushed with fresh butter' },
      { name: 'Garlic Naan', price: 70, isVeg: true, desc: 'Tandoori naan topped with roasted garlic and coriander' },
      { name: 'Tandoori Roti', price: 30, isVeg: true, desc: 'Whole wheat flatbread baked in traditional clay tandoor' },
      { name: 'Laccha Paratha', price: 60, isVeg: true, desc: 'Multi-layered flaky whole wheat paratha' },
      { name: 'Cheese Garlic Naan', price: 95, isVeg: true, desc: 'Stuffed with melted mozzarella and topped with minced garlic' },
    ],
  },
  {
    title: 'Beverages',
    items: [
      { name: 'Fresh Lime Soda', price: 80, isVeg: true, desc: 'Sweet, salted, or mixed refreshment' },
      { name: 'Mango Lassi', price: 110, isVeg: true, desc: 'Thick creamy yogurt drink infused with Alphonso mango pulp' },
      { name: 'Masala Chai', price: 40, isVeg: true, desc: 'Freshly brewed tea with crushed ginger and cardamom' },
      { name: 'Cold Coffee', price: 120, isVeg: true, desc: 'Chilled blended espresso with ice cream and chocolate drizzle' },
      { name: 'Mineral Water', price: 30, isVeg: true, desc: 'Packaged drinking water bottle' },
    ],
  },
  {
    title: 'Desserts',
    items: [
      { name: 'Gulab Jamun (2 pcs)', price: 90, isVeg: true, desc: 'Warm milk dumplings soaked in rose flavored sugar syrup' },
      { name: 'Sizzling Brownie with Ice Cream', price: 190, isVeg: true, desc: 'Warm fudge brownie served on hot sizzler with vanilla scoop' },
      { name: 'Rasmalai (2 pcs)', price: 110, isVeg: true, desc: 'Delicate cottage cheese patties soaked in saffron clotted milk' },
    ],
  },
];

const SAMPLE_TAG = '__sample__';

function randomItem(menu) {
  const all = [];
  for (const cat of menu) {
    for (const item of cat.items) all.push({ ...item, category: cat.title });
  }
  if (!all.length) return null;
  return all[Math.floor(Math.random() * all.length)];
}

function randomBetween(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

const PAYMENT_METHODS = ['Cash', 'UPI', 'UPI', 'Card', 'Card', 'Cash'];
const TABLES = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'Takeaway', 'Takeaway'];

function generateBillForTime(ts, menu, billNum) {
  const d = new Date(ts);
  const dayOfWeek = d.getDay(); // 0=Sun, 6=Sat
  const hour = d.getHours();

  // More items on weekends and evening
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isEvening = hour >= 18 && hour <= 22;
  const numItems = randomBetween(
    1,
    isWeekend ? (isEvening ? 6 : 4) : (isEvening ? 4 : 3)
  );

  const items = [];
  const usedItems = new Set();
  for (let i = 0; i < numItems; i++) {
    let item = randomItem(menu);
    if (!item) break;
    let tries = 0;
    while (usedItems.has(item.name) && tries < 10) { item = randomItem(menu); tries++; }
    if (usedItems.has(item.name)) continue;
    usedItems.add(item.name);
    const qty = randomBetween(1, isWeekend ? 3 : 2);
    items.push({
      name: item.name,
      category: item.category,
      price: item.price,
      qty,
      isVeg: item.isVeg !== false,
      isCustom: false
    });
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = Math.random() < 0.18 ? randomBetween(20, 80) : 0;
  const tax = Math.round((subtotal - discount) * 0.05); // 5% GST
  const total = Math.max(0, subtotal - discount + tax);

  return {
    billNumber: billNum,
    timestamp: ts,
    items,
    table: TABLES[Math.floor(Math.random() * TABLES.length)],
    paymentMethod: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
    discount,
    tax,
    subtotal,
    total,
    isSample: SAMPLE_TAG,
  };
}

// Generate realistic hours distribution (peak at lunch 12-13, dinner 19-21)
function randomHour() {
  const r = Math.random();
  if (r < 0.3) return randomBetween(12, 13);
  if (r < 0.6) return randomBetween(19, 21);
  if (r < 0.75) return randomBetween(10, 11);
  if (r < 0.9) return randomBetween(15, 17);
  return randomBetween(8, 22);
}

export function generateSampleData(email, menu, getBillsFn, saveBillsFn) {
  if (!menu.length) return 0;
  const existing = getBillsFn(email);
  const nonSample = existing.filter(b => !b.isSample);

  const now = Date.now();
  const SIX_MONTHS = 6 * 30 * 24 * 60 * 60 * 1000;
  const start = now - SIX_MONTHS;

  const bills = [];
  let billCounter = 1;

  // Festival days with extra orders
  const festivalDays = [14, 45, 90, 120, 160, 175]; // days from start

  for (let day = 0; day < 180; day++) {
    const dayTs = start + day * 86400000;
    const d = new Date(dayTs);
    const dow = d.getDay();
    const isFestival = festivalDays.includes(day);
    const isWeekend = dow === 0 || dow === 6;

    // Number of orders that day
    let numOrders = isWeekend ? randomBetween(18, 35) : randomBetween(8, 18);
    if (isFestival) numOrders = Math.floor(numOrders * 1.8);

    for (let o = 0; o < numOrders; o++) {
      const h = randomHour();
      const m = randomBetween(0, 59);
      const ts = new Date(dayTs);
      ts.setHours(h, m, 0, 0);
      const bill = generateBillForTime(ts.getTime(), menu, `B${String(billCounter).padStart(4, '0')}`);
      if (bill.items.length > 0) { bills.push(bill); billCounter++; }
    }
  }

  saveBillsFn(email, [...nonSample, ...bills]);
  return bills.length;
}

export function clearSampleData(email, getBillsFn, saveBillsFn) {
  const existing = getBillsFn(email);
  const nonSample = existing.filter(b => !b.isSample);
  saveBillsFn(email, nonSample);
  return existing.length - nonSample.length;
}

export const SAMPLE_TAG_VALUE = SAMPLE_TAG;
