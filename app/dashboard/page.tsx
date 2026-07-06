"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine, LabelList,
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

const COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6", "#EF4444", "#EC4899", "#14B8A6", "#F97316"];

const ttStyle = { background: "rgba(15, 23, 42, 0.97)", border: "1px solid rgba(51, 65, 85, 0.6)", borderRadius: 10, color: "#fff", fontSize: 13, boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)", backdropFilter: "blur(8px)", padding: "10px 14px" };

function Card({ title, value, subtitle, accent, icon }: {
  title: string; value: string; subtitle?: string; accent?: string; icon?: string;
}) {
  const iconBg = accent ? accent + "18" : "#3B82F618";
  return (
    <div className="kpi-card" style={{ borderRadius: 12, height: "100%", position: "relative", overflow: "hidden" }}>
      <div className="kpi-accent" style={{ background: `linear-gradient(90deg, ${accent || "#3B82F6"}, ${accent || "#3B82F6"}88)` }} />
      <div style={{ padding: "20px 22px 18px", display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <span style={{ color: "#94A3B8", fontSize: 12, fontWeight: 500, lineHeight: "36px", letterSpacing: "0.02em" }}>{title}</span>
          {icon && <div className="kpi-icon" style={{ background: `${accent || "#3B82F6"}18` }}>{icon}</div>}
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.03em", color: "#F1F5F9" }}>{value}</div>
        {subtitle && <div style={{ color: "#64748B", marginTop: "auto", paddingTop: 10, fontSize: 11, borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="chart-card anim-in" style={{ borderRadius: 14, height: "100%" }}>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 4, height: 18, borderRadius: 4, background: "linear-gradient(180deg, #3B82F6, #60A5FA)", flexShrink: 0, boxShadow: "0 0 12px rgba(59, 130, 246, 0.3)" }} />
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#F1F5F9", letterSpacing: "-0.01em" }}>{title}</h3>
          {subtitle && <span style={{ color: "#64748B", fontSize: 11, marginTop: 1 }}>{subtitle}</span>}
        </div>
      </div>
      {children}
    </div>
  );
}

function AlertCard({ type, message }: { type: "warning" | "info" | "success"; message: string }) {
  const colors = { warning: { bg: "rgba(153, 27, 27, 0.15)", border: "rgba(153, 27, 27, 0.4)", icon: "⚠", text: "#FCA5A5" }, info: { bg: "rgba(59, 130, 246, 0.12)", border: "rgba(59, 130, 246, 0.3)", icon: "ℹ", text: "#93C5FD" }, success: { bg: "rgba(21, 128, 61, 0.12)", border: "rgba(21, 128, 61, 0.3)", icon: "✓", text: "#86EFAC" } };
  const c = colors[type];
  return <div className="alert-card" style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 16, flexShrink: 0 }}>{c.icon}</span><span style={{ color: c.text, fontSize: 13, lineHeight: 1.4 }}>{message}</span></div>;
}

function BillingCard({ b, onView }: { b: Bill; onView: (b: Bill) => void }) {
  return (
    <div className="billing-card" onClick={() => onView(b)} style={{ background: "rgba(17,24,39,0.8)", backdropFilter: "blur(16px)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "transform 0.2s ease, border-color 0.2s ease" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#F1F5F9" }}>{fmt(b.billMonth)}</div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{b.accountNumber} · {b.consumerName ?? "—"}</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#22C55E" }}>₹ {(b.payableAmount ?? 0).toFixed(0)}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <div><div style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>kWh</div><div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0", marginTop: 1 }}>{b.consumption?.toFixed(0) ?? "—"}</div></div>
        <div><div style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Bill</div><div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0", marginTop: 1 }}>₹ {(b.currentBill ?? 0).toFixed(0)}</div></div>
        <div><div style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Solar</div><div style={{ fontSize: 13, fontWeight: 600, color: "#F97316", marginTop: 1 }}>{b.solarExport?.toFixed(0) ?? "—"}</div></div>
      </div>
    </div>
  );
}

function SolarBalTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  const labelMap: Record<string, string> = { Opening: "#94A3B8", Closing: "#F97316", "Net Change": "#22c55e" };
  return (
    <div style={ttStyle}>
      <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 12 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
          <span style={{ color: labelMap[p.name] || p.color }}>{p.name}</span>
          <span style={{ color: "#E2E8F0", fontWeight: 600, marginLeft: "auto" }}>{p.value.toFixed(0)} kWh</span>
        </div>
      ))}
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
    alerts.push({ type: "warning", message: `Maximum demand exceeded! Billed ${latest.billedDemand} kW vs sanctioned ${latest.sanctionedLoad} kW.` });
  }
  if (prev && latest && prev.currentBill && latest.currentBill) {
    const billChange = ((latest.currentBill - prev.currentBill) / prev.currentBill) * 100;
    if (billChange > 15) alerts.push({ type: "warning", message: `Bill increased ${billChange.toFixed(0)}% this month.` });
    else if (billChange < -10) alerts.push({ type: "success", message: `Bill dropped ${Math.abs(billChange).toFixed(0)}% this month.` });
  }
  if (latest && latest.powerFactor && latest.powerFactor < 0.9) {
    alerts.push({ type: "warning", message: `Power factor is low (${latest.powerFactor.toFixed(3)}). May incur penalties.` });
  }
  if (solarMonths > 0 && chartData.length >= 2) {
    const lastSolar = chartData[chartData.length - 1].solarExport;
    const prevSolar = chartData[chartData.length - 2].solarExport;
    if (lastSolar > 0 && prevSolar > 0) {
      const solarDrop = ((prevSolar - lastSolar) / prevSolar) * 100;
      if (solarDrop > 20) alerts.push({ type: "info", message: `Solar generation dropped ${solarDrop.toFixed(0)}% compared to last month.` });
    }
  }
  if (totalSubsidy > 0) alerts.push({ type: "success", message: `Total subsidy availed: ₹ ${totalSubsidy.toFixed(0)} across ${total} bills.` });

  if (loading) return (
    <div style={{ padding: "40px 0" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        {[1,2,3,4,5,6].map(i => <div key={i} style={{ flex: 1, height: 100, background: "linear-gradient(135deg, #111827 0%, #1a2332 100%)", borderRadius: 12, border: "1px solid rgba(51,65,85,0.3)", animation: "pulse 2s infinite" }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[1,2].map(i => <div key={i} style={{ height: 320, background: "linear-gradient(135deg, #111827 0%, #1a2332 100%)", borderRadius: 12, border: "1px solid rgba(51,65,85,0.3)", animation: "pulse 2s infinite" }} />)}
      </div>
    </div>
  );
  if (bills.length === 0) return <div style={{ textAlign: "center", padding: "80px 20px", opacity: 0.6 }}><div style={{ fontSize: 48, marginBottom: 16 }}>📄</div><h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>No bills yet</h1><p style={{ marginTop: 12, color: "#64748B", fontSize: 14, maxWidth: 400, margin: "12px auto 0" }}>Upload your first electricity bill to get started with insights and analytics.</p></div>;
  if (filtered.length === 0) return <div style={{ textAlign: "center", padding: "80px 20px", opacity: 0.6 }}><div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div><h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>No matching bills</h1><p style={{ marginTop: 12, color: "#64748B", fontSize: 14 }}>Try adjusting your filters to see more data.</p></div>;

  return (
    <div>
      {/* ============ HEADER ============ */}
      <div className="anim-in anim-in-1" style={{ marginBottom: 20, borderRadius: 14, padding: "16px 18px", background: "linear-gradient(135deg, rgba(17,24,39,0.8), rgba(17,24,39,0.5))", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 32px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="live-dot" />
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Energy Dashboard</h1>
          </div>
          <button onClick={() => setShowFilters(true)}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", color: "#94A3B8", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
            Filters
          </button>
        </div>
        <p style={{ color: "#64748B", margin: "6px 0 0", fontSize: 12 }}>
          {accountNames.get(selectedAccount) || selectedAccount} · {total} billing periods
        </p>

        {/* Desktop inline filters */}
        <div className="desktop-only" style={{ marginTop: 14 }}>
          <div className="filters-row">
            <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
              {accounts.map(a => <option key={a} value={a}>{a}{accountNames.has(a) ? ` — ${accountNames.get(a)}` : ""}</option>)}
            </select>
            <span className="filter-label" style={{ color: "#64748B", fontSize: 12, fontWeight: 500 }}>From</span>
            <select value={monthFrom} onChange={e => setMonthFrom(e.target.value)}>
              <option value="">Earliest</option>
              {sortedMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <span className="filter-label" style={{ color: "#64748B", fontSize: 12, fontWeight: 500 }}>To</span>
            <select value={monthTo} onChange={e => setMonthTo(e.target.value)}>
              <option value="">Latest</option>
              {sortedMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ============ MOBILE FILTER BOTTOM SHEET ============ */}
      {showFilters && (
        <div className="modal-overlay" onClick={() => setShowFilters(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Filters</h3>
              <button onClick={() => setShowFilters(false)} style={{ background: "rgba(255,255,255,0.06)", border: 0, borderRadius: 8, width: 32, height: 32, color: "#94A3B8", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <div style={{ padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: 14, overflow: "auto" }}>
              <div>
                <label style={{ fontSize: 11, color: "#64748B", fontWeight: 500, marginBottom: 6, display: "block" }}>Account</label>
                <select value={selectedAccount} onChange={e => { setSelectedAccount(e.target.value); setShowFilters(false); }}>
                  {accounts.map(a => <option key={a} value={a}>{a}{accountNames.has(a) ? ` — ${accountNames.get(a)}` : ""}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#64748B", fontWeight: 500, marginBottom: 6, display: "block" }}>From</label>
                <select value={monthFrom} onChange={e => { setMonthFrom(e.target.value); setShowFilters(false); }}>
                  <option value="">Earliest</option>
                  {sortedMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#64748B", fontWeight: 500, marginBottom: 6, display: "block" }}>To</label>
                <select value={monthTo} onChange={e => { setMonthTo(e.target.value); setShowFilters(false); }}>
                  <option value="">Latest</option>
                  {sortedMonths.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
              <button onClick={() => { setMonthFrom(""); setMonthTo(""); setSelectedAccount(accounts[0] || ""); setShowFilters(false); }}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px", color: "#94A3B8", fontSize: 13, fontWeight: 500, cursor: "pointer", marginTop: 4 }}>Reset Filters</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ 1. OVERVIEW (Executive Dashboard) ============ */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <Card title="Current Bill" value={`₹ ${(latest?.currentBill ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          subtitle={prev && prev.currentBill ? `${((latest.currentBill! - prev.currentBill) / prev.currentBill * 100).toFixed(1)}% vs last month` : undefined}
          accent={prev && prev.currentBill && latest.currentBill! > prev.currentBill ? "#EF4444" : "#22C55E"} icon="💰" />
        <Card title="Current Consumption" value={`${(latest?.consumption ?? 0).toFixed(0)} kWh`}
          subtitle={prev ? `${((latest.consumption! - prev.consumption!) / prev.consumption! * 100).toFixed(1)}% vs last month` : undefined}
          accent={prev && latest.consumption! > prev.consumption! ? "#F59E0B" : "#22C55E"} icon="⚡" />
        <Card title="Solar Generation" value={`${(latest?.solarExport ?? 0).toFixed(0)} kWh`}
          subtitle={solarMonths > 0 ? `Avg ${avgMonthlyExport.toFixed(0)} kWh/mo` : undefined} accent="#F97316" icon="☀️" />
        <Card title="Net Units" value={`${Math.max(0, (latest?.consumption ?? 0) - (latest?.solarExport ?? 0)).toFixed(0)} kWh`}
          subtitle={latest && latest.solarExport && latest.solarExport > 0 ? `${((latest.solarExport / latest.consumption) * 100).toFixed(0)}% offset by solar` : "From grid"} accent="#3B82F6" icon="📊" />
        <Card title="Sanctioned Load" value={`${(latest?.sanctionedLoad ?? 0).toFixed(1)} kW`} accent="#8B5CF6" icon="🏭" />
        <Card title="Max Demand" value={`${(latest?.billedDemand ?? 0).toFixed(2)} kW`}
          subtitle={latest && latest.sanctionedLoad ? `${((latest.billedDemand! / latest.sanctionedLoad) * 100).toFixed(0)}% utilization` : undefined}
          accent={latest && latest.billedDemand && latest.sanctionedLoad && latest.billedDemand > latest.sanctionedLoad ? "#EF4444" : "#14B8A6"} icon="📈" />
      </div>

      {/* ============ 8. ALERTS ============ */}
      {alerts.length > 0 && (
        <div className="alerts-grid" style={{ marginBottom: 20 }}>
            {alerts.map((a, i) => <AlertCard key={i} type={a.type} message={a.message} />)}
          </div>
      )}

      {/* ============ 2. CONSUMPTION ANALYSIS ============ */}
      <div className="section-title" style={{ marginBottom: 16, marginTop: 8 }}>
          <div className="section-accent" />
          <span>Consumption Analysis</span>
          <div style={{ height: 1, flex: 1, background: "linear-gradient(to right, #1E293B, transparent)" }} />
        </div>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <ChartCard title="Monthly Consumption" subtitle={avgConsumption > 0 ? `Avg ${avgConsumption.toFixed(0)} kWh  ·  Latest ${(latest?.consumption ?? 0).toFixed(0)} kWh` : "Energy usage trend with 3-month rolling average"}>
          <ResponsiveContainer width="100%" height={chartH}>
            <ComposedChart data={chartDataWithAvg}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} className="axis-x" interval="preserveStartEnd" />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip contentStyle={ttStyle} formatter={(v: number, n: string) => [n === "Usage" ? `${v.toFixed(0)} kWh` : `${v.toFixed(0)} kWh`, n]} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
              <ReferenceLine y={avgConsumption} stroke="#64748B" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: "Avg", position: "insideTopRight", fill: "#64748B", fontSize: 10 }} />
              <Bar dataKey="consumption" name="Usage" radius={[3, 3, 0, 0]}>
                {chartDataWithAvg.map((d, i) => (
                  <Cell key={i} fill={d.consumption > avgConsumption ? "#F59E0B" : "#3B82F6"} />
                ))}
                <LabelList dataKey="consumption" position="top" fill="#94A3B8" fontSize={10} formatter={(v: number) => v > 0 ? v.toFixed(0) : ""} />
              </Bar>
              <Line type="monotone" dataKey="rollingAvg" name="3-Mo Avg" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 3, fill: "#22C55E" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Month-over-Month Change" subtitle={latest && prev ? `${((latest.consumption! - prev.consumption!) / prev.consumption! * 100).toFixed(1)}% from last month` : "% change vs previous month"}>
          <ResponsiveContainer width="100%" height={chartH}>
            <BarChart data={momData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} className="axis-x" interval="preserveStartEnd" />
              <YAxis stroke="#64748B" fontSize={11} tickFormatter={v => `${v.toFixed(0)}%`} />
              <Tooltip contentStyle={ttStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, "Change"]} />
              <ReferenceLine y={0} stroke="#64748B" strokeWidth={1.5} />
              <Bar dataKey="momPct" name="Change %" radius={[3, 3, 0, 0]}>
                {momData.map((d, i) => <Cell key={i} fill={d.momPct >= 5 ? "#EF4444" : d.momPct <= -5 ? "#22C55E" : "#F59E0B"} />)}
                <LabelList dataKey="momPct" position="top" fill="#94A3B8" fontSize={10} formatter={(v: number) => v === 0 ? "" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ============ 3. BILL ANALYSIS ============ */}
      <div className="section-title" style={{ marginBottom: 16 }}>
          <div className="section-accent" />
          <span>Bill Analysis</span>
          <div style={{ height: 1, flex: 1, background: "linear-gradient(to right, #1E293B, transparent)" }} />
        </div>
        <div className="grid-1-5" style={{ marginBottom: 16 }}>
        <ChartCard title="Charges Breakdown" subtitle={latest ? `Energy ${((latest.energyCharges! / latest.currentBill!) * 100).toFixed(0)}%  ·  Demand ${((latest.demandCharges! / latest.currentBill!) * 100).toFixed(0)}%  ·  Duty ${((latest.electricityDuty! / latest.currentBill!) * 100).toFixed(0)}%` : "Monthly composition of charges"}>
          <ResponsiveContainer width="100%" height={chartH}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} className="axis-x" interval="preserveStartEnd" />
              <YAxis stroke="#64748B" fontSize={11} tickFormatter={v => `₹${v.toFixed(0)}`} />
              <Tooltip contentStyle={ttStyle} formatter={(v: number) => [`₹ ${v.toFixed(0)}`]} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
              <Bar dataKey="energyCharges" name="Energy" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="demandCharges" name="Demand" stackId="a" fill="#F59E0B" />
              <Bar dataKey="duty" name="Duty" stackId="a" fill="#8B5CF6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="other" name="Other" stackId="a" fill="#64748B" radius={[4, 4, 0, 0]} />
              <ReferenceLine y={0} stroke="transparent" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Latest Bill Composition" subtitle={latest ? `${fmt(latest.billMonth)}  ·  ₹ ${latest.currentBill?.toFixed(0) ?? 0} total` : ""}>
          {latestBreakdown.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", height: chartHComp }}>
              <div style={{ position: "relative", flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={latestBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                      {latestBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={ttStyle} formatter={(v: number) => [`₹ ${v.toFixed(0)}`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -55%)", textAlign: "center", pointerEvents: "none" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#E2E8F0", lineHeight: 1 }}>₹{(latest?.currentBill ?? 0).toFixed(0)}</div>
                  <div style={{ fontSize: 9, color: "#64748B", marginTop: 2 }}>Total</div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", padding: "8px 0 0" }}>
                {latestBreakdown.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                    <span style={{ color: "#94A3B8" }}>{d.name}</span>
                    <span style={{ color: "#E2E8F0", fontWeight: 600 }}>{((d.value / Math.max(1, latestBreakdown.reduce((s, x) => s + x.value, 0))) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ color: "#64748B", padding: 40, textAlign: "center" }}>No data</div>}
        </ChartCard>
      </div>

      {/* ============ 4. SOLAR DASHBOARD ============ */}
      {solarMonths > 0 && (
        <>
          <div className="section-title" style={{ marginBottom: 16 }}>
            <div className="section-accent" style={{ background: "#F97316" }} />
            <span>Solar Performance</span>
            <div style={{ height: 1, flex: 1, background: "linear-gradient(to right, #1E293B, transparent)" }} />
          </div>
          <div className="kpi-grid-solar" style={{ marginBottom: 14 }}>
            <Card title="Total Exported" value={`${totalSolarExport.toFixed(0)} kWh`} subtitle={`Avg ${avgMonthlyExport.toFixed(0)} kWh/mo`} accent="#F97316" icon="☀️" />
            <Card title="Grid Savings" value={`₹ ${solarMonetaryBenefit.toFixed(0)}`} subtitle={`At ₹${avgCostPerUnit.toFixed(2)}/kWh`} accent="#10B981" icon="💵" />
            <Card title="Usage Offset" value={`${totalConsumption > 0 ? ((totalSolarExport / totalConsumption) * 100).toFixed(1) : 0}%`} subtitle={`${netConsumption.toFixed(0)} kWh from grid`} accent="#3B82F6" icon="📉" />
            <Card title="Net Surplus" value={`${latestClosing.toFixed(0)} kWh`} subtitle={netBalanceChange >= 0 ? `Grew ${netBalanceChange.toFixed(0)} kWh` : `Down ${Math.abs(netBalanceChange).toFixed(0)} kWh`} accent={netBalanceChange >= 0 ? "#22C55E" : "#EF4444"} icon="⚖️" />
            <Card title="Cumulative Savings" value={`₹ ${cumulativeSolarSavings.length > 0 ? cumulativeSolarSavings[cumulativeSolarSavings.length - 1].savings.toFixed(0) : 0}`} accent="#F59E0B" icon="🏦" />
          </div>
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <ChartCard title="Consumption vs Solar Generation" subtitle={totalConsumption > 0 ? `${((totalSolarExport / totalConsumption) * 100).toFixed(1)}% of usage offset by solar` : "Grid usage vs solar contribution"}>
              <ResponsiveContainer width="100%" height={chartHSm}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} className="axis-x" interval="preserveStartEnd" />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={ttStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                  <Bar dataKey="consumption" name="From Grid" fill="#3B82F6" radius={[3, 3, 0, 0]} stackId="a" />
                  <Bar dataKey="solarExport" name="Solar Offset" fill="#F97316" radius={[3, 3, 0, 0]} stackId="a" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Cumulative Solar Savings" subtitle={cumulativeSolarSavings.length > 0 ? `₹ ${cumulativeSolarSavings[cumulativeSolarSavings.length - 1].savings.toFixed(0)} total` : "Estimated monetary benefit over time"}>
              <ResponsiveContainer width="100%" height={chartHSm}>
                <AreaChart data={cumulativeSolarSavings}>
                  <defs><linearGradient id="cumSolar" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F97316" stopOpacity={0.3} /><stop offset="95%" stopColor="#F97316" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} className="axis-x" interval="preserveStartEnd" />
                  <YAxis stroke="#64748B" fontSize={11} tickFormatter={v => `₹${v.toFixed(0)}`} />
                  <Tooltip contentStyle={ttStyle} formatter={(v: number) => [`₹ ${v.toFixed(0)}`, "Savings"]} />
                  <Area type="monotone" dataKey="savings" stroke="#F97316" strokeWidth={2.5} fill="url(#cumSolar)" />
                  {cumulativeSolarSavings.length > 0 && (
                    <ReferenceLine y={cumulativeSolarSavings[cumulativeSolarSavings.length - 1].savings} stroke="#F97316" strokeDasharray="4 4" strokeWidth={1} label={{ value: `₹${cumulativeSolarSavings[cumulativeSolarSavings.length - 1].savings.toFixed(0)}`, position: "insideTopRight", fill: "#F97316", fontSize: 11, fontWeight: 600 }} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <ChartCard title="Solar Balance Trend" subtitle={netBalanceChange >= 0 ? `Growing  ·  Net +${netBalanceChange.toFixed(0)} kWh` : `Declining  ·  Net ${netBalanceChange.toFixed(0)} kWh`}>
              <ResponsiveContainer width="100%" height={chartHXs}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="balPos" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22C55E" stopOpacity={0.25} /><stop offset="95%" stopColor="#22C55E" stopOpacity={0} /></linearGradient>
                    <linearGradient id="balNeg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} /><stop offset="95%" stopColor="#EF4444" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} className="axis-x" interval="preserveStartEnd" />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={ttStyle} formatter={(v: number) => [`${v.toFixed(0)} kWh`]} />
                  <Area type="monotone" dataKey="closingBal" name="Closing Balance" stroke={netBalanceChange >= 0 ? "#22C55E" : "#EF4444"} fill={netBalanceChange >= 0 ? "url(#balPos)" : "url(#balNeg)"} strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Solar Offset %" subtitle={chartData.length > 0 ? `Latest ${chartData[chartData.length - 1].solarOffsetPct.toFixed(0)}%` : "Portion of consumption covered by solar"}>
              <ResponsiveContainer width="100%" height={chartHXs}>
                <AreaChart data={chartData}>
                  <defs><linearGradient id="solarOff" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F97316" stopOpacity={0.25} /><stop offset="95%" stopColor="#F97316" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} className="axis-x" interval="preserveStartEnd" />
                  <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={ttStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, "Offset"]} />
                  <ReferenceLine y={50} stroke="#64748B" strokeDasharray="4 4" strokeWidth={1} label={{ value: "50%", position: "right", fill: "#64748B", fontSize: 10 }} />
                  <Area type="monotone" dataKey="solarOffsetPct" stroke="#F97316" fill="url(#solarOff)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}

      {/* ============ 5. LOAD ANALYSIS ============ */}
      <div className="section-title" style={{ marginBottom: 16 }}>
          <div className="section-accent" style={{ background: "#F59E0B" }} />
          <span>Load &amp; Cost Efficiency</span>
          <div style={{ height: 1, flex: 1, background: "linear-gradient(to right, #1E293B, transparent)" }} />
        </div>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <ChartCard title="Maximum Demand Trend" subtitle={latest && latest.sanctionedLoad ? `${((latest.billedDemand! / latest.sanctionedLoad) * 100).toFixed(0)}% utilization` : "Billed demand vs sanctioned load"}>
          <ResponsiveContainer width="100%" height={chartHSm}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} className="axis-x" interval="preserveStartEnd" />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip contentStyle={ttStyle} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
              <Bar dataKey="billedDemand" name="Billed Demand" radius={[3, 3, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.billedDemand > d.sanctionedLoad ? "#EF4444" : "#F59E0B"} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="sanctionedLoad" name="Sanctioned Load" stroke="#22C55E" strokeWidth={2.5} strokeDasharray="6 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Effective Cost per Unit" subtitle={avgCostPerUnit > 0 ? `Avg ₹${avgCostPerUnit.toFixed(2)}/kWh` : "₹ per kWh over time"}>
          <ResponsiveContainer width="100%" height={chartHSm}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} className="axis-x" interval="preserveStartEnd" />
              <YAxis stroke="#64748B" fontSize={11} domain={["auto", "auto"]} tickFormatter={v => `₹${v.toFixed(1)}`} />
              <Tooltip contentStyle={ttStyle} formatter={(v: number) => [`₹ ${v.toFixed(2)}`, "per kWh"]} />
              <ReferenceLine y={avgCostPerUnit} stroke="#64748B" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: "Avg", position: "insideTopRight", fill: "#64748B", fontSize: 10 }} />
              <Line type="monotone" dataKey="costPerUnit" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ============ 7. TREND ANALYSIS ============ */}
      <div className="section-title" style={{ marginBottom: 16 }}>
          <div className="section-accent" style={{ background: "#8B5CF6" }} />
          <span>Trend Analysis</span>
          <div style={{ height: 1, flex: 1, background: "linear-gradient(to right, #1E293B, transparent)" }} />
        </div>
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="trend-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "#3B82F6" }} />
            <span style={{ color: "#64748B", fontSize: 11 }}>Avg Monthly Consumption</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{avgConsumption.toFixed(0)} <span style={{ fontSize: 14, fontWeight: 400, color: "#64748B" }}>kWh</span></div>
          <div style={{ color: "#94A3B8", fontSize: 12, marginTop: 6 }}>
            {chartData.length >= 2 ? `${chartData[0].consumption.toFixed(0)} → ${chartData[chartData.length - 1].consumption.toFixed(0)} kWh` : ""}
          </div>
        </div>
        <div className="trend-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "#22C55E" }} />
            <span style={{ color: "#64748B", fontSize: 11 }}>Avg Monthly Bill</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>₹ {avgBill.toFixed(0)}</div>
          <div style={{ color: "#94A3B8", fontSize: 12, marginTop: 6 }}>
            {chartData.length >= 2 ? `₹ ${chartData[0].billAmount.toFixed(0)} → ₹ ${chartData[chartData.length - 1].billAmount.toFixed(0)}` : ""}
          </div>
        </div>
        <div className="trend-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "#8B5CF6" }} />
            <span style={{ color: "#64748B", fontSize: 11 }}>Avg Cost per Unit</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>₹ {avgCostPerUnit.toFixed(2)} <span style={{ fontSize: 14, fontWeight: 400, color: "#64748B" }}>/kWh</span></div>
          <div style={{ color: "#94A3B8", fontSize: 12, marginTop: 6 }}>
            {chartData.length >= 2 ? `₹ ${chartData[0].costPerUnit.toFixed(2)} → ₹ ${chartData[chartData.length - 1].costPerUnit.toFixed(2)}` : ""}
          </div>
        </div>
      </div>

      {/* ============ INSIGHTS BAR ============ */}
      <div className="insights-bar insights-card" style={{ borderRadius: 14, padding: "16px 24px", marginBottom: 20 }}>
        <div><span style={{ color: "#64748B", fontSize: 11 }}>Period</span><div style={{ color: "#E2E8F0", fontSize: 13, fontWeight: 600, marginTop: 2 }}>{chartData.length > 0 ? `${chartData[0].month} — ${chartData[chartData.length - 1].month}` : "—"}</div></div>
        <div><span style={{ color: "#64748B", fontSize: 11 }}>Total Consumption</span><div style={{ color: "#E2E8F0", fontSize: 13, fontWeight: 600, marginTop: 2 }}>{(totalConsumption / 1000).toFixed(1)}k kWh</div></div>
        <div><span style={{ color: "#64748B", fontSize: 11 }}>Total Bill</span><div style={{ color: "#E2E8F0", fontSize: 13, fontWeight: 600, marginTop: 2 }}>₹ {(totalBill / 100000).toFixed(1)}L</div></div>
        <div><span style={{ color: "#64748B", fontSize: 11 }}>Avg Power Factor</span><div style={{ color: avgPf >= 0.95 ? "#22C55E" : avgPf >= 0.9 ? "#F59E0B" : "#EF4444", fontSize: 13, fontWeight: 600, marginTop: 2 }}>{avgPf.toFixed(3)}</div></div>
        <div><span style={{ color: "#64748B", fontSize: 11 }}>Subsidy</span><div style={{ color: "#10B981", fontSize: 13, fontWeight: 600, marginTop: 2 }}>₹ {(totalSubsidy / 100000).toFixed(2)}L</div></div>
        <div><span style={{ color: "#64748B", fontSize: 11 }}>Solar Offset</span><div style={{ color: "#F97316", fontSize: 13, fontWeight: 600, marginTop: 2 }}>{totalConsumption > 0 ? `${((totalSolarExport / totalConsumption) * 100).toFixed(1)}%` : "—"}</div></div>
      </div>

      {/* ============ BILLING HISTORY ============ */}
      <div className={`anim-in ${isMobile ? "" : "table-wrap"}`} style={{ borderRadius: 14 }}>
        <div style={{ padding: isMobile ? "0 0 12px" : "16px 22px", fontSize: 15, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: isMobile ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 4, height: 18, borderRadius: 4, background: "linear-gradient(180deg, #3B82F6, #60A5FA)", boxShadow: "0 0 12px rgba(59,130,246,0.3)" }} />
            <span style={{ letterSpacing: "-0.01em" }}>Billing History</span>
          </div>
          <span style={{ color: "#64748B", fontSize: 12, fontWeight: 400 }}>{sorted.length} records</span>
        </div>

        {/* DESKTOP TABLE */}
        <div className="desktop-only" style={{ overflow: "auto", maxHeight: "calc(100vh - 300px)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead className="table-header">
            <tr style={{ background: "#1E293B" }}>
              {["Month", "Account", "Consumer", "Meter", "kWh", "Energy", "Demand", "Duty", "Bill", "Payable", "₹/kWh", "PF", "Solar", "Bal"].map(h => <th key={h} style={th}>{h}</th>)}
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {[...sorted].reverse().map(b => (
              <tr key={b.id} className="table-row">
                <td style={td}>{fmt(b.billMonth)}</td>
                <td style={td}>{b.accountNumber}</td>
                <td style={td}>{b.consumerName ?? "—"}</td>
                <td style={td}>{b.meterNumber ?? "—"}</td>
                <td style={{ ...td, fontWeight: 600 }}>{b.consumption?.toFixed(0) ?? "—"}</td>
                <td style={td}>₹ {b.energyCharges?.toFixed(0) ?? "—"}</td>
                <td style={td}>₹ {b.demandCharges?.toFixed(0) ?? "—"}</td>
                <td style={td}>₹ {b.electricityDuty?.toFixed(0) ?? "—"}</td>
                <td style={{ ...td, fontWeight: 600 }}>₹ {b.currentBill?.toFixed(0) ?? "—"}</td>
                <td style={{ ...td, color: "#22c55e", fontWeight: 600 }}>₹ {b.payableAmount?.toFixed(0) ?? "—"}</td>
                <td style={td}>{b.consumption && b.consumption > 0 ? `₹ ${((b.currentBill ?? 0) / b.consumption).toFixed(2)}` : "—"}</td>
                <td style={td}>{b.powerFactor?.toFixed(3) ?? "—"}</td>
                <td style={{ ...td, color: "#F97316" }}>{b.solarExport?.toFixed(0) ?? "—"}</td>
                <td style={td}>{b.closingSolarBalance?.toFixed(0) ?? "—"}</td>
                <td style={{ ...td, textAlign: "center" }}>
                  <button onClick={() => setViewBill(b)} className="btn-view" style={{ color: "white", border: 0, borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="mobile-only" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...sorted].reverse().map(b => <BillingCard key={b.id} b={b} onView={setViewBill} />)}
        </div>
      </div>

      {/* ============ DETAIL MODAL ============ */}
      {viewBill && (
        <div className="modal-overlay" onClick={() => setViewBill(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 22px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, position: "relative" }}>
              <div className="mobile-only" style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
              <h3 style={{ margin: 0, fontSize: 17 }}>{viewBill.billNumber}</h3>
              <button onClick={() => setViewBill(null)} style={{ background: "rgba(255,255,255,0.06)", border: 0, color: "#94A3B8", cursor: "pointer", fontSize: 18, lineHeight: 1, borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>&times;</button>
            </div>
            <div style={{ padding: "6px 22px 22px" }}>
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
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #0F172A", color: "#94A3B8", fontSize: 12, whiteSpace: "nowrap", width: "40%" }}>{label}</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #0F172A", fontSize: 12, fontFamily: key === "rawText" ? "monospace" : "inherit", wordBreak: "break-all" }}>{val}</td>
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

const th: React.CSSProperties = {
  padding: "11px 14px", textAlign: "left", fontSize: 11, color: "#94A3B8",
  fontWeight: 600, whiteSpace: "nowrap", letterSpacing: "0.03em", textTransform: "uppercase",
};

const td: React.CSSProperties = {
  padding: "10px 14px", borderTop: "1px solid rgba(30, 41, 59, 0.6)", fontSize: 12, whiteSpace: "nowrap",
};
