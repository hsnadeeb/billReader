"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine,
} from "recharts";

interface Bill {
  id: string;
  accountNumber: string;
  billNumber: string;
  billMonth: string;
  consumerName: string | null;
  fatherName: string | null;
  address: string | null;
  division: string | null;
  subdivision: string | null;
  category: string | null;
  connectionType: string | null;
  supplyType: string | null;
  meterNumber: string | null;
  sanctionedLoad: number | null;
  billedDemand: number | null;
  securityDeposit: number | null;
  billDate: string | null;
  dueDate: string | null;
  disconnectionDate: string | null;
  billingStart: string | null;
  billingEnd: string | null;
  connectionDate: string | null;
  previousReading: number | null;
  currentReading: number | null;
  consumption: number | null;
  previousKVAH: number | null;
  currentKVAH: number | null;
  kvaConsumption: number | null;
  powerFactor: number | null;
  solarExport: number | null;
  openingSolarBalance: number | null;
  closingSolarBalance: number | null;
  previousDue: number | null;
  currentBill: number | null;
  payableAmount: number | null;
  energyCharges: number | null;
  demandCharges: number | null;
  electricityDuty: number | null;
  fppa: number | null;
  minimumCharges: number | null;
  excessDemandPenalty: number | null;
  otherCharges: number | null;
  subsidy: number | null;
  arrears: number | null;
  credit: number | null;
  debit: number | null;
  rebate: number | null;
  meterCharges: number | null;
  dueSecurity: number | null;
  paymentDate: string | null;
  paymentAmount: number | null;
  paymentMode: string | null;
  receiptNumber: string | null;
  rawText: string;
  uploadedAt: string;
}

const MONTHS: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

function parseBillMonth(m: string): Date | null {
  const parts = m.split("-");
  if (parts.length !== 2) return null;
  const monthNum = MONTHS[parts[0].toUpperCase()];
  if (monthNum === undefined) return null;
  return new Date(parseInt(parts[1]), monthNum);
}

function fmt(m: string): string {
  const d = parseBillMonth(m);
  if (!d) return m;
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

const LABELS: Record<string, string> = {
  accountNumber: "Account No", billNumber: "Bill No", billMonth: "Bill Month",
  consumerName: "Consumer Name", fatherName: "Father Name", address: "Address",
  division: "Division", subdivision: "Subdivision", category: "Category",
  connectionType: "Connection Type", supplyType: "Supply Type",
  meterNumber: "Meter Number", sanctionedLoad: "Sanctioned Load (kW)",
  billedDemand: "Billed Demand (kW)", securityDeposit: "Security Deposit",
  billDate: "Bill Date", dueDate: "Due Date", disconnectionDate: "Disconnection Date",
  billingStart: "Billing Start", billingEnd: "Billing End", connectionDate: "Connection Date",
  previousReading: "Previous Reading (kWh)", currentReading: "Current Reading (kWh)",
  consumption: "Consumption (kWh)", previousKVAH: "Previous Reading (kVAh)",
  currentKVAH: "Current Reading (kVAh)", kvaConsumption: "Consumption (kVAh)",
  powerFactor: "Power Factor", solarExport: "Solar Export",
  openingSolarBalance: "Opening Solar Balance", closingSolarBalance: "Closing Solar Balance",
  previousDue: "Previous Due (₹)", currentBill: "Current Bill (₹)",
  payableAmount: "Payable Amount (₹)", energyCharges: "Energy Charges (₹)",
  demandCharges: "Demand Charges (₹)", electricityDuty: "Electricity Duty (₹)",
  fppa: "FPPA Surcharge (₹)", minimumCharges: "Minimum Charges (₹)",
  excessDemandPenalty: "Excess Demand Penalty (₹)", otherCharges: "Other Charges (₹)",
  subsidy: "Subsidy (₹)", arrears: "Arrears (₹)", credit: "Credit (₹)",
  debit: "Debit (₹)", rebate: "Rebate (₹)", meterCharges: "Meter Charges (₹)",
  dueSecurity: "Due Security (₹)", paymentDate: "Payment Date",
  paymentAmount: "Payment Amount (₹)", paymentMode: "Payment Mode",
  receiptNumber: "Receipt Number", rawText: "Raw PDF Text",
};

const COLORS = ["#3B82F6", "#F59E0B", "#8B5CF6", "#64748B", "#EF4444", "#22C55E", "#F97316"];

const ttStyle = { background: "#0F172A", border: "1px solid #1E293B", borderRadius: 8, color: "#E2E8F0", fontSize: 12, padding: "8px 12px" };

function StatCard({ label, value, change, accent }: {
  label: string; value: string; change?: string; accent?: string;
}) {
  return (
    <div className="card stat-card anim-in">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={accent ? { color: accent } : undefined}>{value}</div>
      {change && <div className="stat-change">{change}</div>}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="card chart-card anim-in">
      <div className="chart-header">
        <h3>{title}</h3>
        {subtitle && <span className="chart-subtitle">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function AlertCard({ type, message }: { type: "warning" | "info" | "success"; message: string }) {
  const colors = {
    warning: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", text: "#FCA5A5" },
    info: { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", text: "#93C5FD" },
    success: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", text: "#86EFAC" },
  };
  const c = colors[type];
  return (
    <div className="alert-card" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <span style={{ fontSize: 11, flexShrink: 0 }}>{type === "warning" ? "!" : type === "info" ? "i" : "✓"}</span>
      <span style={{ color: c.text }}>{message}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [monthFrom, setMonthFrom] = useState("");
  const [monthTo, setMonthTo] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [chartH, setChartH] = useState(270);
  const [chartHSm, setChartHSm] = useState(250);
  const [chartHXs, setChartHXs] = useState(240);
  const [chartHPie, setChartHPie] = useState(180);
  const [chartHComp, setChartHComp] = useState(270);

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 480px)");
    const mqTablet = window.matchMedia("(max-width: 900px)");
    const mqSmall = window.matchMedia("(max-width: 768px)");
    const update = () => {
      const mob = mqMobile.matches;
      const tab = mqTablet.matches;
      setIsMobile(mqSmall.matches);
      setChartH(mob ? 200 : tab ? 220 : 270);
      setChartHSm(mob ? 180 : tab ? 200 : 250);
      setChartHXs(mob ? 180 : tab ? 200 : 240);
      setChartHPie(mob ? 130 : tab ? 150 : 180);
      setChartHComp(mob ? 200 : tab ? 220 : 270);
    };
    update();
    mqMobile.addEventListener("change", update);
    mqTablet.addEventListener("change", update);
    mqSmall.addEventListener("change", update);
    return () => {
      mqMobile.removeEventListener("change", update);
      mqTablet.removeEventListener("change", update);
      mqSmall.removeEventListener("change", update);
    };
  }, []);

  const accountNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of bills) { if (!map.has(b.accountNumber) && b.consumerName) map.set(b.accountNumber, b.consumerName); }
    return map;
  }, [bills]);

  const accounts = useMemo(() => Array.from(new Set(bills.map(b => b.accountNumber))).sort(), [bills]);

  useEffect(() => { if (!selectedAccount && accounts.length > 0) setSelectedAccount(accounts[0]); }, [accounts, selectedAccount]);

  const sortedMonths = useMemo(() => {
    const set = new Set(bills.map(b => b.billMonth));
    return Array.from(set).sort((a, b) => { const da = parseBillMonth(a), db = parseBillMonth(b); if (!da || !db) return 0; return da.getTime() - db.getTime(); });
  }, [bills]);

  useEffect(() => { loadBills(); }, []);

  async function loadBills() {
    try { const res = await fetch("/api/bills"); const json = await res.json(); setBills(json.data ?? []); } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const filtered = useMemo(() => bills.filter(b => {
    if (selectedAccount && b.accountNumber !== selectedAccount) return false;
    if (monthFrom) { const d = parseBillMonth(b.billMonth), f = parseBillMonth(monthFrom); if (d && f && d.getTime() < f.getTime()) return false; }
    if (monthTo) { const d = parseBillMonth(b.billMonth), t = parseBillMonth(monthTo); if (d && t && d.getTime() > t.getTime()) return false; }
    return true;
  }), [bills, selectedAccount, monthFrom, monthTo]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => { const da = parseBillMonth(a.billMonth), db = parseBillMonth(b.billMonth); if (!da || !db) return 0; return da.getTime() - db.getTime(); }), [filtered]);

  const chartData = useMemo(() => sorted.map((b, i) => ({
    month: fmt(b.billMonth),
    _month: b.billMonth,
    consumption: b.consumption ?? 0,
    billAmount: b.currentBill ?? 0,
    payable: b.payableAmount ?? 0,
    energyCharges: b.energyCharges ?? 0,
    demandCharges: b.demandCharges ?? 0,
    duty: b.electricityDuty ?? 0,
    powerFactor: b.powerFactor ?? 0,
    costPerUnit: b.consumption && b.consumption > 0 ? (b.currentBill ?? 0) / b.consumption : 0,
    other: (b.currentBill ?? 0) - (b.energyCharges ?? 0) - (b.demandCharges ?? 0) - (b.electricityDuty ?? 0),
    solarExport: b.solarExport ?? 0,
    openingBal: b.openingSolarBalance ?? 0,
    closingBal: b.closingSolarBalance ?? 0,
    balanceChange: (b.closingSolarBalance ?? 0) - (b.openingSolarBalance ?? 0),
    netConsumption: Math.max(0, (b.consumption ?? 0) - (b.solarExport ?? 0)),
    solarOffsetPct: b.consumption && b.consumption > 0 ? Math.min(100, ((b.solarExport ?? 0) / b.consumption) * 100) : 0,
    sanctionedLoad: b.sanctionedLoad ?? 0,
    billedDemand: b.billedDemand ?? 0,
    solarMonetary: ((b.solarExport ?? 0) * ((b.currentBill ?? 0) / Math.max(1, (b.consumption ?? 0)))),
  })), [sorted]);

  const rollingAvg = useMemo(() => chartData.map((d, i) => {
    const slice = chartData.slice(Math.max(0, i - 2), i + 1);
    return slice.reduce((s, x) => s + x.consumption, 0) / slice.length;
  }), [chartData]);

  const chartDataWithAvg = useMemo(() => chartData.map((d, i) => ({ ...d, rollingAvg: rollingAvg[i] })), [chartData, rollingAvg]);

  const momData = useMemo(() => chartData.map((d, i) => {
    if (i === 0) return { ...d, momPct: 0, billMomPct: 0 };
    const prev = chartData[i - 1];
    return {
      ...d,
      momPct: prev.consumption > 0 ? ((d.consumption - prev.consumption) / prev.consumption) * 100 : 0,
      billMomPct: prev.billAmount > 0 ? ((d.billAmount - prev.billAmount) / prev.billAmount) * 100 : 0,
    };
  }), [chartData]);

  const cumulativeSolarSavings = useMemo(() => {
    let sum = 0;
    return chartData.map(d => { sum += d.solarMonetary; return { month: d.month, savings: sum }; });
  }, [chartData]);

  const latest = sorted[sorted.length - 1];
  const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null;

  const total = filtered.length;
  const totalConsumption = filtered.reduce((a, b) => a + (b.consumption ?? 0), 0);
  const totalBill = filtered.reduce((a, b) => a + (b.currentBill ?? 0), 0);
  const totalSolarExport = filtered.reduce((a, b) => a + (b.solarExport ?? 0), 0);
  const totalSubsidy = filtered.reduce((a, b) => a + (b.subsidy ?? 0), 0);
  const avgConsumption = total > 0 ? totalConsumption / total : 0;
  const avgBill = total > 0 ? totalBill / total : 0;
  const avgCostPerUnit = totalBill > 0 && totalConsumption > 0 ? totalBill / totalConsumption : 0;
  const avgPf = total > 0 ? filtered.reduce((a, b) => a + (b.powerFactor ?? 0), 0) / total : 0;
  const solarMonths = chartData.filter(d => d.solarExport > 0).length;
  const avgMonthlyExport = solarMonths > 0 ? totalSolarExport / solarMonths : 0;
  const firstOpening = sorted.length > 0 ? (sorted[0].openingSolarBalance ?? 0) : 0;
  const latestClosing = sorted.length > 0 ? (sorted[sorted.length - 1].closingSolarBalance ?? 0) : 0;
  const netBalanceChange = latestClosing - firstOpening;
  const solarMonetaryBenefit = totalSolarExport * avgCostPerUnit;
  const netConsumption = Math.max(0, totalConsumption - totalSolarExport);

  const latestBreakdown = [
    { name: "Energy", value: Math.max(0, latest?.energyCharges ?? 0) },
    { name: "Demand", value: Math.max(0, latest?.demandCharges ?? 0) },
    { name: "Duty", value: Math.max(0, latest?.electricityDuty ?? 0) },
    { name: "Other", value: Math.max(0, (latest?.currentBill ?? 0) - (latest?.energyCharges ?? 0) - (latest?.demandCharges ?? 0) - (latest?.electricityDuty ?? 0)) },
  ].filter(d => d.value > 0);

  const alerts: { type: "warning" | "info" | "success"; message: string }[] = [];
  if (latest && latest.billedDemand && latest.sanctionedLoad && latest.billedDemand > latest.sanctionedLoad) {
    alerts.push({ type: "warning", message: `Max demand exceeded: ${latest.billedDemand} kW vs ${latest.sanctionedLoad} kW sanctioned.` });
  }
  if (prev && latest && prev.currentBill && latest.currentBill) {
    const billChange = ((latest.currentBill - prev.currentBill) / prev.currentBill) * 100;
    if (billChange > 15) alerts.push({ type: "warning", message: `Bill up ${billChange.toFixed(0)}% this month.` });
    else if (billChange < -10) alerts.push({ type: "success", message: `Bill down ${Math.abs(billChange).toFixed(0)}% this month.` });
  }
  if (latest && latest.powerFactor && latest.powerFactor < 0.9) {
    alerts.push({ type: "warning", message: `Power factor is low (${latest.powerFactor.toFixed(3)}). May incur penalties.` });
  }
  if (solarMonths > 0 && chartData.length >= 2) {
    const lastSolar = chartData[chartData.length - 1].solarExport;
    const prevSolar = chartData[chartData.length - 2].solarExport;
    if (lastSolar > 0 && prevSolar > 0) {
      const solarDrop = ((prevSolar - lastSolar) / prevSolar) * 100;
      if (solarDrop > 20) alerts.push({ type: "info", message: `Solar generation dropped ${solarDrop.toFixed(0)}% from last month.` });
    }
  }
  if (totalSubsidy > 0) alerts.push({ type: "success", message: `Total subsidy: ₹${totalSubsidy.toFixed(0)} across ${total} bills.` });

  if (loading) return (
    <div style={{ padding: isMobile ? "20px 0" : "40px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: isMobile ? 80 : 100, background: "#111827", borderRadius: 12, border: "1px solid #1E293B", animation: "pulse 2s infinite" }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
        {[1,2].map(i => <div key={i} style={{ height: isMobile ? 260 : 320, background: "#111827", borderRadius: 12, border: "1px solid #1E293B", animation: "pulse 2s infinite" }} />)}
      </div>
    </div>
  );
  if (bills.length === 0) return (
    <div style={{ textAlign: "center", padding: isMobile ? "60px 16px" : "80px 20px" }}>
      <div style={{ fontSize: isMobile ? 36 : 44, marginBottom: 12, opacity: 0.5 }}>📄</div>
      <h1 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 600, margin: 0, color: "#94A3B8" }}>No bills yet</h1>
      <p style={{ marginTop: 8, color: "#64748B", fontSize: isMobile ? 13 : 14, maxWidth: 360, margin: "8px auto 0", lineHeight: 1.5 }}>Upload your first electricity bill to get started with insights and analytics.</p>
    </div>
  );
  if (filtered.length === 0) return (
    <div style={{ textAlign: "center", padding: isMobile ? "60px 16px" : "80px 20px" }}>
      <div style={{ fontSize: isMobile ? 36 : 44, marginBottom: 12, opacity: 0.5 }}>🔍</div>
      <h1 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 600, margin: 0, color: "#94A3B8" }}>No matching bills</h1>
      <p style={{ marginTop: 8, color: "#64748B", fontSize: isMobile ? 13 : 14 }}>Try adjusting your filters.</p>
    </div>
  );

  return (
    <div>
      {/* ===== HEADER ===== */}
      <div className="card anim-in anim-in-1" style={{ padding: isMobile ? "12px 14px" : "14px 18px", marginBottom: isMobile ? 14 : 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Dashboard</h1>
            <p style={{ color: "#64748B", margin: "2px 0 0", fontSize: isMobile ? 11 : 12 }}>
              {accountNames.get(selectedAccount) || selectedAccount} · {total} billing periods
            </p>
          </div>
          <button onClick={() => setShowFilters(true)}
            style={{ background: "transparent", border: "1px solid #1E293B", borderRadius: 8, padding: isMobile ? "6px 10px" : "8px 14px", color: "#94A3B8", fontSize: isMobile ? 12 : 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, minHeight: 36 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
            Filters
          </button>
        </div>
        <div className="desktop-only" style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
          <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
            {accounts.map(a => <option key={a} value={a}>{a}{accountNames.has(a) ? ` — ${accountNames.get(a)}` : ""}</option>)}
          </select>
          <select value={monthFrom} onChange={e => setMonthFrom(e.target.value)}>
            <option value="">Earliest</option>
            {sortedMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span style={{ color: "#64748B", fontSize: 12 }}>to</span>
          <select value={monthTo} onChange={e => setMonthTo(e.target.value)}>
            <option value="">Latest</option>
            {sortedMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* ===== MOBILE FILTERS ===== */}
      {showFilters && (
        <div className="modal-overlay" onClick={() => setShowFilters(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", width: 32, height: 4, borderRadius: 2, background: "#1E293B" }} />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Filters</h3>
              <button onClick={() => setShowFilters(false)} style={{ background: "transparent", border: 0, color: "#64748B", fontSize: 20, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <div style={{ padding: "14px 16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Account</label>
                <select value={selectedAccount} onChange={e => { setSelectedAccount(e.target.value); setShowFilters(false); }}>
                  {accounts.map(a => <option key={a} value={a}>{a}{accountNames.has(a) ? ` — ${accountNames.get(a)}` : ""}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>From</label>
                <select value={monthFrom} onChange={e => { setMonthFrom(e.target.value); setShowFilters(false); }}>
                  <option value="">Earliest</option>
                  {sortedMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>To</label>
                <select value={monthTo} onChange={e => { setMonthTo(e.target.value); setShowFilters(false); }}>
                  <option value="">Latest</option>
                  {sortedMonths.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
              <button onClick={() => { setMonthFrom(""); setMonthTo(""); setSelectedAccount(accounts[0] || ""); setShowFilters(false); }}
                style={{ background: "transparent", border: "1px solid #1E293B", borderRadius: 8, padding: "10px", color: "#64748B", fontSize: 13, cursor: "pointer", marginTop: 4 }}>Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== AT A GLANCE ===== */}
      <div className="section-heading">At a Glance</div>
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard label="Current Bill" value={`₹${(latest?.currentBill ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          change={prev && prev.currentBill ? `${((latest.currentBill! - prev.currentBill) / prev.currentBill * 100).toFixed(1)}% vs last month` : undefined}
          accent={prev && prev.currentBill && latest.currentBill! > prev.currentBill ? "#EF4444" : "#22C55E"} />
        <StatCard label="Consumption" value={`${(latest?.consumption ?? 0).toFixed(0)} kWh`}
          change={prev ? `${((latest.consumption! - prev.consumption!) / prev.consumption! * 100).toFixed(1)}% vs last month` : undefined}
          accent={prev && latest.consumption! > prev.consumption! ? "#F59E0B" : "#22C55E"} />
        <StatCard label="Avg Cost" value={`₹${avgCostPerUnit.toFixed(2)}`} change={`${avgCostPerUnit > 0 ? `${avgCostPerUnit.toFixed(2)}/kWh` : ""}`} />
        <StatCard label="Power Factor" value={avgPf.toFixed(3)}
          change={latest?.solarExport ? `Solar: ${(latest.solarExport).toFixed(0)} kWh this month` : undefined} />
      </div>

      {/* ===== ALERTS ===== */}
      {alerts.length > 0 && (
        <div className="alerts-grid" style={{ marginBottom: 16 }}>
          {alerts.map((a, i) => <AlertCard key={i} type={a.type} message={a.message} />)}
        </div>
      )}

      {/* ===== CONSUMPTION & COST ===== */}
      <div className="section-heading">Consumption &amp; Cost</div>
      <div className="grid-2" style={{ marginBottom: 12 }}>
        <ChartCard title="Monthly Consumption" subtitle={avgConsumption > 0 ? `Avg ${avgConsumption.toFixed(0)} kWh` : undefined}>
          <ResponsiveContainer width="100%" height={chartH}>
            <ComposedChart data={chartDataWithAvg}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" stroke="#475569" fontSize={11} className="axis-x" interval="preserveStartEnd" />
              <YAxis stroke="#475569" fontSize={11} />
              <Tooltip contentStyle={ttStyle} />
              <Legend iconType="rect" iconSize={8} />
              {avgConsumption > 0 && <ReferenceLine y={avgConsumption} stroke="#475569" strokeDasharray="4 4" strokeWidth={1} />}
              <Bar dataKey="consumption" name="Usage" radius={[2, 2, 0, 0]}>
                {chartDataWithAvg.map((d, i) => (
                  <Cell key={i} fill={d.consumption > avgConsumption ? "#F59E0B" : "#3B82F6"} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="rollingAvg" name="3-Mo Avg" stroke="#22C55E" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Month-over-Month" subtitle={latest && prev ? `${((latest.consumption! - prev.consumption!) / prev.consumption! * 100).toFixed(1)}% from last month` : undefined}>
          <ResponsiveContainer width="100%" height={chartH}>
            <BarChart data={momData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" stroke="#475569" fontSize={11} className="axis-x" interval="preserveStartEnd" />
              <YAxis stroke="#475569" fontSize={11} tickFormatter={v => `${v.toFixed(0)}%`} />
              <Tooltip contentStyle={ttStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, "Change"]} />
              <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
              <Bar dataKey="momPct" name="Change" radius={[2, 2, 0, 0]}>
                {momData.map((d, i) => <Cell key={i} fill={d.momPct >= 5 ? "#EF4444" : d.momPct <= -5 ? "#22C55E" : "#F59E0B"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ===== BILL BREAKDOWN ===== */}
      <div className="section-heading">Bill Breakdown</div>
      <div className="grid-1-5" style={{ marginBottom: 12 }}>
        <ChartCard title="Charges Over Time" subtitle={latest ? `Energy ${((latest.energyCharges! / latest.currentBill!) * 100).toFixed(0)}% · Demand ${((latest.demandCharges! / latest.currentBill!) * 100).toFixed(0)}% · Duty ${((latest.electricityDuty! / latest.currentBill!) * 100).toFixed(0)}%` : undefined}>
          <ResponsiveContainer width="100%" height={chartH}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" stroke="#475569" fontSize={11} className="axis-x" interval="preserveStartEnd" />
              <YAxis stroke="#475569" fontSize={11} tickFormatter={v => `₹${v.toFixed(0)}`} />
              <Tooltip contentStyle={ttStyle} />
              <Legend iconType="rect" iconSize={8} />
              <Bar dataKey="energyCharges" name="Energy" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="demandCharges" name="Demand" stackId="a" fill="#F59E0B" />
              <Bar dataKey="duty" name="Duty" stackId="a" fill="#8B5CF6" />
              <Bar dataKey="other" name="Other" stackId="a" fill="#64748B" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Latest Composition" subtitle={latest ? `${fmt(latest.billMonth)} · ₹${latest.currentBill?.toFixed(0) ?? 0}` : undefined}>
          {latestBreakdown.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", height: chartHComp }}>
              <div style={{ flex: 1, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={latestBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={78} paddingAngle={2} dataKey="value">
                      {latestBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={ttStyle} formatter={(v: number) => [`₹${v.toFixed(0)}`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -55%)", textAlign: "center", pointerEvents: "none" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#E2E8F0", lineHeight: 1 }}>₹{(latest?.currentBill ?? 0).toFixed(0)}</div>
                  <div style={{ fontSize: 9, color: "#64748B", marginTop: 1 }}>Total</div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", padding: "6px 0 0" }}>
                {latestBreakdown.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                    <span style={{ color: "#94A3B8" }}>{d.name}</span>
                    <span style={{ color: "#E2E8F0", fontWeight: 600 }}>{((d.value / Math.max(1, latestBreakdown.reduce((s, x) => s + x.value, 0))) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ color: "#64748B", padding: isMobile ? 24 : 40, textAlign: "center", fontSize: 13 }}>No data</div>}
        </ChartCard>
      </div>

      {/* ===== SOLAR ===== */}
      {solarMonths > 0 && (
        <>
          <div className="section-heading" style={{ marginTop: 4 }}>Solar Performance</div>
          <div className="kpi-grid" style={{ marginBottom: 12 }}>
            <StatCard label="Total Exported" value={`${totalSolarExport.toFixed(0)} kWh`} change={`Avg ${avgMonthlyExport.toFixed(0)} kWh/mo`} accent="#F97316" />
            <StatCard label="Grid Savings" value={`₹${solarMonetaryBenefit.toFixed(0)}`} change={`At ₹${avgCostPerUnit.toFixed(2)}/kWh`} accent="#10B981" />
            <StatCard label="Usage Offset" value={`${totalConsumption > 0 ? ((totalSolarExport / totalConsumption) * 100).toFixed(1) : 0}%`} change={`${netConsumption.toFixed(0)} kWh from grid`} />
            <StatCard label="Net Surplus" value={`${latestClosing.toFixed(0)} kWh`} change={netBalanceChange >= 0 ? `+${netBalanceChange.toFixed(0)} kWh growth` : `${netBalanceChange.toFixed(0)} kWh decline`} accent={netBalanceChange >= 0 ? "#22C55E" : "#EF4444"} />
          </div>
          <div className="grid-2" style={{ marginBottom: 12 }}>
            <ChartCard title="Grid vs Solar" subtitle={`${((totalSolarExport / totalConsumption) * 100).toFixed(1)}% offset`}>
              <ResponsiveContainer width="100%" height={chartHSm}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="month" stroke="#475569" fontSize={11} className="axis-x" interval="preserveStartEnd" />
                  <YAxis stroke="#475569" fontSize={11} />
                  <Tooltip contentStyle={ttStyle} />
                  <Legend iconType="rect" iconSize={8} />
                  <Bar dataKey="netConsumption" name="From Grid" fill="#3B82F6" radius={[2, 2, 0, 0]} stackId="a" />
                  <Bar dataKey="solarExport" name="Solar" fill="#F97316" radius={[2, 2, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Cumulative Savings" subtitle={cumulativeSolarSavings.length > 0 ? `₹${cumulativeSolarSavings[cumulativeSolarSavings.length - 1].savings.toFixed(0)} total` : undefined}>
              <ResponsiveContainer width="100%" height={chartHSm}>
                <AreaChart data={cumulativeSolarSavings}>
                  <defs><linearGradient id="cumSolar" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F97316" stopOpacity={0.2} /><stop offset="95%" stopColor="#F97316" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="month" stroke="#475569" fontSize={11} className="axis-x" interval="preserveStartEnd" />
                  <YAxis stroke="#475569" fontSize={11} tickFormatter={v => `₹${v.toFixed(0)}`} />
                  <Tooltip contentStyle={ttStyle} />
                  <Area type="monotone" dataKey="savings" stroke="#F97316" strokeWidth={2} fill="url(#cumSolar)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}

      {/* ===== LOAD & EFFICIENCY ===== */}
      <div className="section-heading">Load &amp; Efficiency</div>
      <div className="grid-2" style={{ marginBottom: 12 }}>
        <ChartCard title="Maximum Demand" subtitle={latest && latest.sanctionedLoad ? `${((latest.billedDemand! / latest.sanctionedLoad) * 100).toFixed(0)}% utilization` : undefined}>
          <ResponsiveContainer width="100%" height={chartHSm}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" stroke="#475569" fontSize={11} className="axis-x" interval="preserveStartEnd" />
              <YAxis stroke="#475569" fontSize={11} />
              <Tooltip contentStyle={ttStyle} />
              <Legend iconType="rect" iconSize={8} />
              <Bar dataKey="billedDemand" name="Billed Demand" radius={[2, 2, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.billedDemand > d.sanctionedLoad ? "#EF4444" : "#F59E0B"} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="sanctionedLoad" name="Sanctioned" stroke="#22C55E" strokeWidth={2} strokeDasharray="6 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Cost per Unit" subtitle={avgCostPerUnit > 0 ? `Avg ₹${avgCostPerUnit.toFixed(2)}/kWh` : undefined}>
          <ResponsiveContainer width="100%" height={chartHSm}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" stroke="#475569" fontSize={11} className="axis-x" interval="preserveStartEnd" />
              <YAxis stroke="#475569" fontSize={11} domain={["auto", "auto"]} tickFormatter={v => `₹${v.toFixed(1)}`} />
              <Tooltip contentStyle={ttStyle} />
              {avgCostPerUnit > 0 && <ReferenceLine y={avgCostPerUnit} stroke="#475569" strokeDasharray="4 4" strokeWidth={1} />}
              <Line type="monotone" dataKey="costPerUnit" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ===== INSIGHTS SUMMARY ===== */}
      <div className="card" style={{ padding: isMobile ? "12px 14px" : "14px 20px", marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: isMobile ? 10 : 20 }}>
          {[
            { label: "Period", value: chartData.length > 0 ? `${chartData[0].month} – ${chartData[chartData.length - 1].month}` : "—" },
            { label: "Avg Consumption", value: `${avgConsumption.toFixed(0)} kWh` },
            { label: "Avg Bill", value: `₹${avgBill.toFixed(0)}` },
            { label: "Total Consumption", value: `${(totalConsumption / 1000).toFixed(1)}k kWh` },
            { label: "Total Bill", value: `₹${(totalBill / 100000).toFixed(1)}L` },
            { label: "Total Subsidy", value: totalSubsidy > 0 ? `₹${(totalSubsidy / 1000).toFixed(1)}k` : "—" },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: "#E2E8F0" }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== BILLING HISTORY ===== */}
      <div className="card table-wrap">
        <div style={{ padding: isMobile ? "12px 14px 10px" : "14px 20px", fontSize: isMobile ? 14 : 15, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1E293B" }}>
          <span>Billing History</span>
          <span style={{ color: "#64748B", fontSize: 11, fontWeight: 400 }}>{sorted.length} records</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr>
              {["Month", "Account", "Consumer", "kWh", "Bill", "Payable", "PF", "Solar", ""].map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[...sorted].reverse().map(b => (
              <tr key={b.id}>
                <td>{fmt(b.billMonth)}</td>
                <td style={{ color: "#94A3B8", fontSize: 11 }}>{b.accountNumber}</td>
                <td style={{ color: "#94A3B8", fontSize: 11 }}>{b.consumerName ?? "—"}</td>
                <td style={{ fontWeight: 600 }}>{b.consumption?.toFixed(0) ?? "—"}</td>
                <td>₹{b.currentBill?.toFixed(0) ?? "—"}</td>
                <td style={{ color: "#22C55E", fontWeight: 600 }}>₹{b.payableAmount?.toFixed(0) ?? "—"}</td>
                <td style={{ color: "#94A3B8" }}>{b.powerFactor?.toFixed(3) ?? "—"}</td>
                <td style={{ color: "#F97316" }}>{b.solarExport?.toFixed(0) ?? "—"}</td>
                <td>
                  <button onClick={() => setViewBill(b)} style={{ background: "#1E293B", border: 0, borderRadius: 6, padding: "6px 12px", color: "#94A3B8", fontSize: 11, cursor: "pointer" }}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {viewBill && (
        <div className="modal-overlay" onClick={() => setViewBill(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? "10px 16px 14px" : "12px 20px 16px", borderBottom: "1px solid #1E293B", position: "relative" }}>
              <div className="mobile-only" style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", width: 32, height: 4, borderRadius: 2, background: "#1E293B" }} />
              <h3 style={{ margin: 0, fontSize: isMobile ? 15 : 16 }}>{viewBill.billNumber}</h3>
              <button onClick={() => setViewBill(null)} style={{ background: "transparent", border: 0, color: "#64748B", fontSize: 20, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <div style={{ padding: isMobile ? "4px 16px 16px" : "6px 20px 20px", overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {Object.entries(LABELS).map(([key, label]) => {
                    let val: any = (viewBill as any)[key];
                    if (val === null || val === undefined || val === "") val = "—";
                    else if (typeof val === "number") {
                      val = val.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
                      const moneyKeys = ["amount", "charges", "bill", "due", "fppa", "subsidy", "arrears", "credit", "debit", "rebate", "deposit", "payment"];
                      if (moneyKeys.some(k => key.toLowerCase().includes(k))) val = `₹ ${val}`;
                    } else if (key === "rawText" && val.length > 200) val = val.slice(0, 200) + "...";
                    return <tr key={key}>
                      <td style={{ padding: "6px 10px", borderBottom: "1px solid #0F172A", color: "#64748B", fontSize: isMobile ? 11 : 12, whiteSpace: isMobile ? "normal" : "nowrap", width: isMobile ? "35%" : "38%" }}>{label}</td>
                      <td style={{ padding: "6px 10px", borderBottom: "1px solid #0F172A", fontSize: isMobile ? 11 : 12, fontFamily: key === "rawText" ? "monospace" : "inherit", wordBreak: "break-all" }}>{val}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
