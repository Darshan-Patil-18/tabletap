import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { generateSampleData, clearSampleData, SAMPLE_TAG_VALUE } from '../sampleData.js';
import { getBills, saveBills } from '../utils.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PALETTE = ['#f97316', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];

/* ─── Analytics Computation ─── */
function computeAnalytics(bills) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - now.getDay() * 86400000;

  let todaySales = 0, weekSales = 0, totalOrders = 0, totalRevenue = 0;
  const salesByDay = [0, 0, 0, 0, 0, 0, 0];
  const salesByHour = Array(24).fill(0);
  const itemCounts = {};
  const catRevenue = {};

  for (const bill of bills) {
    const ts = bill.timestamp;
    const d = new Date(ts);
    const dow = d.getDay();
    const hour = d.getHours();
    const t = bill.total || 0;

    totalOrders++;
    totalRevenue += t;
    salesByDay[dow] += t;
    salesByHour[hour] += t;

    if (ts >= todayStart) todaySales += t;
    if (ts >= weekStart) weekSales += t;

    for (const item of bill.items || []) {
      if (item.isCustom) continue;
      const key = item.name;
      itemCounts[key] = (itemCounts[key] || 0) + (item.qty || 1);
      const cat = item.category || 'Other';
      catRevenue[cat] = (catRevenue[cat] || 0) + (item.price || 0) * (item.qty || 1);
    }
  }

  const avgBill = totalOrders ? totalRevenue / totalOrders : 0;
  const sortedItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);
  const top10 = sortedItems.slice(0, 10);
  const bottom10 = sortedItems.length > 10 ? sortedItems.slice(-10).reverse() : [];

  const weekdayRevenue = [1, 2, 3, 4, 5].reduce((s, d) => s + salesByDay[d], 0);
  const weekendRevenue = [0, 6].reduce((s, d) => s + salesByDay[d], 0);
  const weekdayOrders = bills.filter(b => { const d = new Date(b.timestamp).getDay(); return d >= 1 && d <= 5; }).length;
  const weekendOrders = bills.filter(b => { const d = new Date(b.timestamp).getDay(); return d === 0 || d === 6; }).length;

  const maxHourSales = Math.max(...salesByHour);
  const peakHour = maxHourSales > 0 ? salesByHour.indexOf(maxHourSales) : -1;
  const peakHourLabel = peakHour >= 0
    ? `${peakHour % 12 || 12}${peakHour < 12 ? 'AM' : 'PM'} – ${(peakHour + 1) % 12 || 12}${peakHour + 1 < 12 ? 'AM' : 'PM'}`
    : null;

  const maxDaySales = Math.max(...salesByDay);
  const bestDayIdx = maxDaySales > 0 ? salesByDay.indexOf(maxDaySales) : -1;

  return {
    todaySales, weekSales, totalOrders, avgBill,
    salesByDay: DAYS.map((day, i) => ({ day, sales: salesByDay[i] })),
    salesByHour: salesByHour.map((sales, h) => ({ hour: h, sales })).filter(x => x.sales > 0),
    top10, bottom10,
    catRevenue: Object.entries(catRevenue).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    weekdayRevenue, weekendRevenue, weekdayOrders, weekendOrders,
    peakHourLabel, bestDay: bestDayIdx >= 0 ? DAYS[bestDayIdx] : null,
    weekendPct: weekdayRevenue > 0 ? ((weekendRevenue - weekdayRevenue / 5 * 2) / (weekdayRevenue / 5 * 2) * 100) : 0,
  };
}

function generateInsights(a, bills) {
  if (!bills.length) return [];
  const insights = [];
  if (a.top10.length) insights.push(`🏆 "${a.top10[0][0]}" is your best-selling dish (${a.top10[0][1]} sold).`);
  if (a.peakHourLabel) insights.push(`⏰ Busiest time is ${a.peakHourLabel}.`);
  if (a.bestDay) insights.push(`📅 ${a.bestDay} brings the most revenue.`);
  if (Math.abs(a.weekendPct) > 5) {
    const dir = a.weekendPct > 0 ? 'more' : 'less';
    insights.push(`📊 Weekends sell ${Math.abs(Math.round(a.weekendPct))}% ${dir} per day vs weekdays.`);
  }
  if (a.bottom10.length) insights.push(`📉 "${a.bottom10[0][0]}" is slow — consider promoting or replacing it.`);
  if (a.avgBill) insights.push(`💰 Average bill value is ₹${a.avgBill.toFixed(0)}.`);
  return insights;
}

function forecastTomorrow(bills, menu) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDow = tomorrow.getDay();

  const sameDayBills = bills.filter(b => new Date(b.timestamp).getDay() === tomorrowDow);
  const recent = sameDayBills.slice(-4);

  const itemTotals = {};
  for (const bill of sameDayBills) {
    for (const item of bill.items || []) {
      if (item.isCustom) continue;
      itemTotals[item.name] = (itemTotals[item.name] || 0) + (item.qty || 1);
    }
  }
  const recentTotals = {};
  for (const bill of recent) {
    for (const item of bill.items || []) {
      if (item.isCustom) continue;
      recentTotals[item.name] = (recentTotals[item.name] || 0) + (item.qty || 1);
    }
  }

  const allItems = menu.flatMap(cat => cat.items.map(i => i.name));
  return allItems.map(name => {
    const avgH = itemTotals[name] ? itemTotals[name] / Math.max(sameDayBills.length, 1) : 0;
    const avgR = recentTotals[name] ? recentTotals[name] / Math.max(recent.length, 1) : 0;
    return { name, qty: Math.max(0, Math.round(avgH * 0.6 + avgR * 0.4)) };
  }).filter(x => x.qty > 0).sort((a, b) => b.qty - a.qty);
}

/* ─── Sub-components ─── */
function KPICard({ label, value, icon, gradient }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1"
      style={{ background: gradient, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
      <span className="text-2xl">{icon}</span>
      <p className="font-heading font-black text-2xl text-white">{value}</p>
      <p className="text-xs font-bold text-white/80">{label}</p>
    </div>
  );
}

/* ─── Main Component ─── */
export default function AnalyseScreen({ username, bills, menu, onBillsUpdate }) {
  const [morningPlan, setMorningPlan] = useState(null);
  const [planSteps, setPlanSteps] = useState([]);
  const [planRunning, setPlanRunning] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [localBills, setLocalBills] = useState(bills);

  const hasSample = localBills.some(b => b.isSample === SAMPLE_TAG_VALUE);
  const a = useMemo(() => computeAnalytics(localBills), [localBills]);
  const insights = useMemo(() => generateInsights(a, localBills), [a, localBills]);

  function loadSample() {
    setSampleLoading(true);
    setTimeout(() => {
      generateSampleData(username, menu, getBills, saveBills);
      const updated = getBills(username);
      setLocalBills(updated);
      onBillsUpdate && onBillsUpdate(updated);
      setSampleLoading(false);
    }, 100);
  }

  function clearSample() {
    clearSampleData(username, getBills, saveBills);
    const updated = getBills(username);
    setLocalBills(updated);
    onBillsUpdate && onBillsUpdate(updated);
  }

  async function runMorningPlan() {
    setPlanRunning(true); setPlanSteps([]); setMorningPlan(null);
    const steps = [
      '📂 Loading bill history…', '📅 Detecting weekday patterns…',
      '🔮 Forecasting per dish…', '📋 Building prep list…',
      '⚠️ Flagging slow-moving dishes…', '✅ Summary ready!',
    ];
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 450 + Math.random() * 250));
      setPlanSteps(s => [...s, steps[i]]);
    }
    const forecast = forecastTomorrow(localBills, menu);
    const slow = a.bottom10.map(([name]) => name).slice(0, 3);
    setMorningPlan({ forecast, slow });
    setPlanRunning(false);
  }

  const fmt = n => '₹' + Number(n || 0).toFixed(0);

  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl px-3 py-2 text-xs shadow-xl border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <p className="font-bold" style={{ color: 'var(--text)' }}>{label}</p>
        <p style={{ color: 'var(--primary)' }}>{fmt(payload[0].value)}</p>
      </div>
    );
  };

  /* ── Empty state ── */
  if (!localBills.length && !menu.length) return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-8 text-center"
      style={{ background: 'var(--bg-gradient)' }}>
      <div className="text-6xl">📊</div>
      <p className="font-heading font-bold text-xl" style={{ color: 'var(--text)' }}>No data yet</p>
      <p className="text-sm max-w-xs" style={{ color: 'var(--text2)' }}>
        Add menu items, take some orders, and come back here for deep insights.
      </p>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-10" style={{ background: 'var(--bg-gradient)' }}>

      {/* Sample data banner */}
      <div className="flex flex-wrap gap-2 items-center">
        {!hasSample ? (
          <button
            className="btn btn-secondary text-xs py-2"
            disabled={sampleLoading || !menu.length}
            onClick={loadSample}>
            {sampleLoading ? '⏳ Loading…' : '🧪 Load 6-Month Sample Data'}
          </button>
        ) : (
          <>
            <span className="text-xs px-3 py-1 rounded-full font-bold text-white"
              style={{ background: 'var(--warn)' }}>⚠️ Sample data active</span>
            <button className="btn btn-danger text-xs py-2" onClick={clearSample}>Clear Sample</button>
          </>
        )}
        {!menu.length && (
          <p className="text-xs" style={{ color: 'var(--text3)' }}>Add menu items first to load sample data.</p>
        )}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard label="Today's Revenue" value={fmt(a.todaySales)} icon="💰"
          gradient="linear-gradient(135deg, #f97316, #fb923c)" />
        <KPICard label="This Week" value={fmt(a.weekSales)} icon="📈"
          gradient="linear-gradient(135deg, #6366f1, #8b5cf6)" />
        <KPICard label="Total Orders" value={a.totalOrders} icon="🧾"
          gradient="linear-gradient(135deg, #10b981, #34d399)" />
        <KPICard label="Avg Bill Value" value={fmt(a.avgBill)} icon="💵"
          gradient="linear-gradient(135deg, #0ea5e9, #06b6d4)" />
      </div>

      {/* Weekend vs Weekday */}
      <div className="glass-card p-4">
        <h3 className="font-heading font-bold text-base mb-3" style={{ color: 'var(--text)' }}>📅 Weekend vs Weekday</h3>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface2)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text2)' }}>Weekdays (Mon–Fri)</p>
            <p className="font-heading font-black text-xl" style={{ color: 'var(--text)' }}>{fmt(a.weekdayRevenue)}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{a.weekdayOrders} orders</p>
          </div>
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)' }}>
            <p className="text-xs font-semibold mb-1 text-orange-500">Weekends (Sat–Sun)</p>
            <p className="font-heading font-black text-xl text-orange-500">{fmt(a.weekendRevenue)}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{a.weekendOrders} orders</p>
          </div>
        </div>
      </div>

      {/* Sales by Weekday Bar Chart */}
      {a.salesByDay.some(d => d.sales > 0) && (
        <div className="glass-card p-4">
          <h3 className="font-heading font-bold text-base mb-3" style={{ color: 'var(--text)' }}>📊 Revenue by Day</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={a.salesByDay} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(249,115,22,0.08)' }} />
              <Bar dataKey="sales" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Busiest Hours */}
      {a.salesByHour.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-heading font-bold text-base mb-3" style={{ color: 'var(--text)' }}>
            ⏰ Peak Hours
            {a.peakHourLabel && (
              <span className="text-xs font-semibold ml-2 px-2 py-0.5 rounded-full"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
                Peak: {a.peakHourLabel}
              </span>
            )}
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={a.salesByHour} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="hour" tickFormatter={h => `${h}h`}
                tick={{ fontSize: 10, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
              <Bar dataKey="sales" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Revenue by Category Pie */}
      {a.catRevenue.length > 1 && (
        <div className="glass-card p-4">
          <h3 className="font-heading font-bold text-base mb-3" style={{ color: 'var(--text)' }}>🍽️ Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={a.catRevenue}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={85}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                fontSize={10}>
                {a.catRevenue.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip formatter={v => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top 10 Dishes */}
      {a.top10.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-heading font-bold text-base mb-4" style={{ color: 'var(--text)' }}>🏆 Top 10 Dishes</h3>
          <div className="space-y-3">
            {a.top10.map(([name, qty], i) => {
              const pct = Math.round((qty / a.top10[0][1]) * 100);
              return (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-sm w-6 text-center flex-shrink-0">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-xs font-bold" style={{ color: 'var(--text3)' }}>#{i + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold truncate" style={{ color: 'var(--text)' }}>{name}</span>
                      <span className="font-bold ml-2 flex-shrink-0" style={{ color: 'var(--primary)' }}>{qty} sold</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: 'var(--primary-gradient)' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom / Slow Dishes */}
      {a.bottom10.length > 0 && (
        <div className="glass-card p-4" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
          <h3 className="font-heading font-bold text-base mb-3" style={{ color: 'var(--text)' }}>
            📉 Slow Dishes
            <span className="text-xs font-normal ml-2" style={{ color: 'var(--text3)' }}>(consider promoting)</span>
          </h3>
          <div className="space-y-1.5">
            {a.bottom10.map(([name, qty]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text)' }}>{name}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>{qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Insights */}
      {insights.length > 0 && (
        <div className="glass-card p-4" style={{ border: '1px solid rgba(99,102,241,0.35)' }}>
          <h3 className="font-heading font-bold text-base mb-3" style={{ color: 'var(--accent)' }}>✨ Smart Insights</h3>
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{ins}</p>
            ))}
          </div>
        </div>
      )}

      {/* Tomorrow's Prep Plan */}
      <div className="glass-card p-4">
        <h3 className="font-heading font-bold text-base" style={{ color: 'var(--text)' }}>🔮 Tomorrow's Prep List</h3>
        <p className="text-xs mt-0.5 mb-3" style={{ color: 'var(--text2)' }}>
          Historic (60%) + recent trend (40%) blended forecast
        </p>
        <button
          className="btn btn-primary w-full py-3 text-sm font-bold mb-3"
          onClick={runMorningPlan}
          disabled={planRunning || !localBills.length}>
          {planRunning ? '⏳ Analysing…' : '🌅 Run Morning Prep Plan'}
        </button>

        {planSteps.length > 0 && (
          <div className="rounded-xl p-3 mb-3 space-y-1" style={{ background: 'var(--surface2)' }}>
            {planSteps.map((step, i) => (
              <p key={i} className="text-xs" style={{ color: 'var(--text)' }}>{step}</p>
            ))}
          </div>
        )}

        {morningPlan && (
          <div className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--surface2)' }}>
            <p className="font-bold text-sm mb-2" style={{ color: 'var(--text)' }}>
              Prep for {new Date(Date.now() + 86400000).toLocaleDateString('en-IN', {
                weekday: 'long', month: 'short', day: 'numeric'
              })}
            </p>
            {morningPlan.forecast.length === 0
              ? <p className="text-sm" style={{ color: 'var(--text2)' }}>Not enough historic data for this weekday yet.</p>
              : morningPlan.forecast.map(({ name, qty }) => (
                <div key={name} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text)' }}>{name}</span>
                  <span className="font-bold" style={{ color: 'var(--primary)' }}>{qty} portions</span>
                </div>
              ))
            }
            {morningPlan.slow.length > 0 && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--warn)' }}>⚠️ Slow movers (promote these):</p>
                <p className="text-xs" style={{ color: 'var(--text2)' }}>{morningPlan.slow.join(', ')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
