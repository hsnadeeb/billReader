"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
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

function inr(n: number, decimals = 0): string {
  return n.toLocaleString("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}

const LABELS: Record<string, string> = {
  accountNumber: "Account No",
  billNumber: "Bill No",
  billMonth: "Bill Month",
  consumerName: "Consumer Name",
  fatherName: "Father Name",
  address: "Address",
  division: "Division",
  subdivision: "Subdivision",
  category: "Category",
  connectionType: "Connection Type",
  supplyType: "Supply Type",
  meterNumber: "Meter Number",
  sanctionedLoad: "Sanctioned Load (kW)",
  billedDemand: "Billed Demand (kW)",
  securityDeposit: "Security Deposit",
  billDate: "Bill Date",
  dueDate: "Due Date",
  disconnectionDate: "Disconnection Date",
  billingStart: "Billing Start",
  billingEnd: "Billing End",
  connectionDate: "Connection Date",
  previousReading: "Previous Reading (kWh)",
  currentReading: "Current Reading (kWh)",
  consumption: "Consumption (kWh)",
  previousKVAH: "Previous Reading (kVAh)",
  currentKVAH: "Current Reading (kVAh)",
  kvaConsumption: "Consumption (kVAh)",
  powerFactor: "Power Factor",
  solarExport: "Solar Export",
  openingSolarBalance: "Opening Solar Balance",
  closingSolarBalance: "Closing Solar Balance",
  previousDue: "Previous Due (₹)",
  currentBill: "Current Bill (₹)",
  payableAmount: "Payable Amount (₹)",
  energyCharges: "Energy Charges (₹)",
  demandCharges: "Demand Charges (₹)",
  electricityDuty: "Electricity Duty (₹)",
  fppa: "FPPA Surcharge (₹)",
  minimumCharges: "Minimum Charges (₹)",
  excessDemandPenalty: "Excess Demand Penalty (₹)",
  otherCharges: "Other Charges (₹)",
  subsidy: "Subsidy (₹)",
  arrears: "Arrears (₹)",
  credit: "Credit (₹)",
  debit: "Debit (₹)",
  rebate: "Rebate (₹)",
  meterCharges: "Meter Charges (₹)",
  dueSecurity: "Due Security (₹)",
  paymentDate: "Payment Date",
  paymentAmount: "Payment Amount (₹)",
  paymentMode: "Payment Mode",
  receiptNumber: "Receipt Number",
  rawText: "Raw PDF Text",
};

// Palette is assigned by meaning, not decoration:
// amber = energy/usage, violet = demand, teal = solar/positive, red = alerts, slate = neutral/other
const C = {
  amber: "#F5A623",
  violet: "#8D85F2",
  teal: "#4FD1AE",
  red: "#F2685C",
  slate: "#5B6472",
};
const PIE_COLORS = [C.amber, C.violet, "#3D4451", "#2A2F39"];

const ttStyle = {
  background: "#15181F",
  border: "1px solid #262B34",
  borderRadius: 8,
  color: "#E7E9EE",
  fontSize: 12,
  padding: "8px 12px",
  fontFamily: "var(--font-mono)",
};

function SectionHeading({ title, note }: { title: string; note?: string }) {
  return (
    <div className="section-heading">
      <span className="section-heading__title">{title}</span>
      {note && <span className="section-heading__note">{note}</span>}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card chart-card ${className ?? ""}`}>
      <div className="chart-header">
        <h3>{title}</h3>
        {subtitle && <span className="chart-subtitle">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function Delta({
  value,
  invert = false,
  suffix = "% vs last month",
}: {
  value: number | null;
  invert?: boolean;
  suffix?: string;
}) {
  if (value === null || !isFinite(value))
    return <span className="delta delta--flat">No prior data</span>;
  const good = invert ? value <= 0 : value <= 0;
  const cls =
    Math.abs(value) < 0.5
      ? "delta--flat"
      : value > 0
        ? invert
          ? "delta--bad"
          : "delta--bad"
        : "delta--good";
  const sign = value > 0 ? "+" : "";
  return (
    <span className={`delta ${cls}`}>
      {value > 0 ? "▲" : value < 0 ? "▼" : "—"} {sign}
      {value.toFixed(1)}
      {suffix}
    </span>
  );
}

// Signature element: an analog-meter-style demand dial. Ties the visual
// language of the page back to the physical object it describes — a utility meter.
function DemandDial({
  billed,
  sanctioned,
}: {
  billed: number;
  sanctioned: number;
}) {
  const pct = sanctioned > 0 ? billed / sanctioned : 0;
  const clamped = Math.min(1.15, Math.max(0, pct));
  const startAngle = -120,
    endAngle = 120; // 240 degree sweep
  const sweep = endAngle - startAngle;
  const angle = startAngle + clamped * sweep;
  const r = 62,
    cx = 80,
    cy = 78;
  const toXY = (deg: number, radius: number) => {
    const rad = (deg - 90) * (Math.PI / 180);
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  };
  const arcPath = (a0: number, a1: number, radius: number) => {
    const [x0, y0] = toXY(a0, radius);
    const [x1, y1] = toXY(a1, radius);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1}`;
  };
  const over = pct > 1;
  const needleColor = over ? C.red : pct > 0.85 ? C.amber : C.teal;
  const ticks = Array.from(
    { length: 13 },
    (_, i) => startAngle + (i * sweep) / 12,
  );
  const [nx, ny] = toXY(angle, r - 10);

  return (
    <div className="dial">
      <svg viewBox="0 0 160 118" width="100%" height="auto">
        <path
          d={arcPath(startAngle, endAngle, r)}
          stroke="#232830"
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={arcPath(
            startAngle,
            Math.min(endAngle, startAngle + sweep * Math.min(1, clamped)),
            r,
          )}
          stroke={needleColor}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
        />
        {ticks.map((t, i) => {
          const [x1, y1] = toXY(t, r + 8);
          const [x2, y2] = toXY(t, r + 2);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#3A404B"
              strokeWidth={1.5}
            />
          );
        })}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={needleColor}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={4} fill={needleColor} />
        <text
          x={cx}
          y={cy - 22}
          textAnchor="middle"
          className="dial__value"
          fill="#EDEFF2"
        >
          {(pct * 100).toFixed(0)}%
        </text>
      </svg>
      <div className="dial__caption">
        <span style={{ color: needleColor }}>{billed.toFixed(1)} kW</span>
        <span className="dial__of">
          {" "}
          of {sanctioned.toFixed(0)} kW sanctioned
        </span>
      </div>
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const w = 220,
    h = 56,
    pad = 4;
  const min = Math.min(...data),
    max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y];
  });
  const path = pts
    .map(
      (p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`,
    )
    .join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      preserveAspectRatio="none"
    >
      <path d={path} fill="none" stroke={color} strokeWidth={2} />
      <circle cx={lx} cy={ly} r={3} fill={color} />
    </svg>
  );
}

function AlertRow({
  type,
  message,
}: {
  type: "warning" | "info" | "success";
  message: string;
}) {
  const color =
    type === "warning" ? C.red : type === "success" ? C.teal : C.violet;
  return (
    <div className="insight-row">
      <span className="insight-row__dot" style={{ background: color }} />
      <span className="insight-row__text">{message}</span>
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
  const [chartH, setChartH] = useState(260);
  const [chartHSm, setChartHSm] = useState(240);
  const [chartHComp, setChartHComp] = useState(260);

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 480px)");
    const mqTablet = window.matchMedia("(max-width: 900px)");
    const mqSmall = window.matchMedia("(max-width: 768px)");
    const update = () => {
      const mob = mqMobile.matches;
      const tab = mqTablet.matches;
      setIsMobile(mqSmall.matches);
      setChartH(mob ? 200 : tab ? 220 : 260);
      setChartHSm(mob ? 180 : tab ? 200 : 240);
      setChartHComp(mob ? 200 : tab ? 220 : 260);
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
    for (const b of bills) {
      if (!map.has(b.accountNumber) && b.consumerName)
        map.set(b.accountNumber, b.consumerName);
    }
    return map;
  }, [bills]);

  const accounts = useMemo(
    () => Array.from(new Set(bills.map((b) => b.accountNumber))).sort(),
    [bills],
  );

  useEffect(() => {
    if (!selectedAccount && accounts.length > 0)
      setSelectedAccount(accounts[0]);
  }, [accounts, selectedAccount]);

  const sortedMonths = useMemo(() => {
    const set = new Set(bills.map((b) => b.billMonth));
    return Array.from(set).sort((a, b) => {
      const da = parseBillMonth(a),
        db = parseBillMonth(b);
      if (!da || !db) return 0;
      return da.getTime() - db.getTime();
    });
  }, [bills]);

  useEffect(() => {
    loadBills();
  }, []);

  async function loadBills() {
    try {
      const res = await fetch("/api/bills");
      const json = await res.json();
      setBills(json.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(
    () =>
      bills.filter((b) => {
        if (selectedAccount && b.accountNumber !== selectedAccount)
          return false;
        if (monthFrom) {
          const d = parseBillMonth(b.billMonth),
            f = parseBillMonth(monthFrom);
          if (d && f && d.getTime() < f.getTime()) return false;
        }
        if (monthTo) {
          const d = parseBillMonth(b.billMonth),
            t = parseBillMonth(monthTo);
          if (d && t && d.getTime() > t.getTime()) return false;
        }
        return true;
      }),
    [bills, selectedAccount, monthFrom, monthTo],
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const da = parseBillMonth(a.billMonth),
          db = parseBillMonth(b.billMonth);
        if (!da || !db) return 0;
        return da.getTime() - db.getTime();
      }),
    [filtered],
  );

  const chartData = useMemo(
    () =>
      sorted.map((b) => ({
        month: fmt(b.billMonth),
        _month: b.billMonth,
        consumption: b.consumption ?? 0,
        billAmount: b.currentBill ?? 0,
        payable: b.payableAmount ?? 0,
        energyCharges: b.energyCharges ?? 0,
        demandCharges: b.demandCharges ?? 0,
        duty: b.electricityDuty ?? 0,
        powerFactor: b.powerFactor ?? 0,
        costPerUnit:
          b.consumption && b.consumption > 0
            ? (b.currentBill ?? 0) / b.consumption
            : 0,
        other:
          (b.currentBill ?? 0) -
          (b.energyCharges ?? 0) -
          (b.demandCharges ?? 0) -
          (b.electricityDuty ?? 0),
        solarExport: b.solarExport ?? 0,
        openingBal: b.openingSolarBalance ?? 0,
        closingBal: b.closingSolarBalance ?? 0,
        balanceChange:
          (b.closingSolarBalance ?? 0) - (b.openingSolarBalance ?? 0),
        netConsumption: Math.max(
          0,
          (b.consumption ?? 0) - (b.solarExport ?? 0),
        ),
        solarOffsetPct:
          b.consumption && b.consumption > 0
            ? Math.min(100, ((b.solarExport ?? 0) / b.consumption) * 100)
            : 0,
        sanctionedLoad: b.sanctionedLoad ?? 0,
        billedDemand: b.billedDemand ?? 0,
        solarMonetary:
          (b.solarExport ?? 0) *
          ((b.currentBill ?? 0) / Math.max(1, b.consumption ?? 0)),
      })),
    [sorted],
  );

  const rollingAvg = useMemo(
    () =>
      chartData.map((d, i) => {
        const slice = chartData.slice(Math.max(0, i - 2), i + 1);
        return slice.reduce((s, x) => s + x.consumption, 0) / slice.length;
      }),
    [chartData],
  );

  const chartDataWithAvg = useMemo(
    () => chartData.map((d, i) => ({ ...d, rollingAvg: rollingAvg[i] })),
    [chartData, rollingAvg],
  );

  const momData = useMemo(
    () =>
      chartData.map((d, i) => {
        if (i === 0) return { ...d, momPct: 0, billMomPct: 0 };
        const prev = chartData[i - 1];
        return {
          ...d,
          momPct:
            prev.consumption > 0
              ? ((d.consumption - prev.consumption) / prev.consumption) * 100
              : 0,
          billMomPct:
            prev.billAmount > 0
              ? ((d.billAmount - prev.billAmount) / prev.billAmount) * 100
              : 0,
        };
      }),
    [chartData],
  );

  const cumulativeSolarSavings = useMemo(() => {
    let sum = 0;
    return chartData.map((d) => {
      sum += d.solarMonetary;
      return { month: d.month, savings: sum };
    });
  }, [chartData]);

  const latest = sorted[sorted.length - 1];
  const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null;

  const total = filtered.length;
  const totalConsumption = filtered.reduce(
    (a, b) => a + (b.consumption ?? 0),
    0,
  );
  const totalBill = filtered.reduce((a, b) => a + (b.currentBill ?? 0), 0);
  const totalSolarExport = filtered.reduce(
    (a, b) => a + (b.solarExport ?? 0),
    0,
  );
  const totalSubsidy = filtered.reduce((a, b) => a + (b.subsidy ?? 0), 0);
  const avgConsumption = total > 0 ? totalConsumption / total : 0;
  const avgBill = total > 0 ? totalBill / total : 0;
  const avgCostPerUnit =
    totalBill > 0 && totalConsumption > 0 ? totalBill / totalConsumption : 0;
  const avgPf =
    total > 0
      ? filtered.reduce((a, b) => a + (b.powerFactor ?? 0), 0) / total
      : 0;
  const solarMonths = chartData.filter((d) => d.solarExport > 0).length;
  const avgMonthlyExport = solarMonths > 0 ? totalSolarExport / solarMonths : 0;
  const firstOpening =
    sorted.length > 0 ? (sorted[0].openingSolarBalance ?? 0) : 0;
  const latestClosing =
    sorted.length > 0
      ? (sorted[sorted.length - 1].closingSolarBalance ?? 0)
      : 0;
  const netBalanceChange = latestClosing - firstOpening;
  const solarMonetaryBenefit = totalSolarExport * avgCostPerUnit;
  const netConsumption = Math.max(0, totalConsumption - totalSolarExport);

  const billDeltaPct =
    prev && prev.currentBill
      ? ((latest.currentBill! - prev.currentBill) / prev.currentBill) * 100
      : null;
  const consumptionDeltaPct =
    prev && prev.consumption
      ? ((latest.consumption! - prev.consumption) / prev.consumption) * 100
      : null;
  const billSparkline = chartData.slice(-6).map((d) => d.billAmount);

  const latestBreakdown = [
    { name: "Energy", value: Math.max(0, latest?.energyCharges ?? 0) },
    { name: "Demand", value: Math.max(0, latest?.demandCharges ?? 0) },
    { name: "Duty", value: Math.max(0, latest?.electricityDuty ?? 0) },
    {
      name: "Other",
      value: Math.max(
        0,
        (latest?.currentBill ?? 0) -
          (latest?.energyCharges ?? 0) -
          (latest?.demandCharges ?? 0) -
          (latest?.electricityDuty ?? 0),
      ),
    },
  ].filter((d) => d.value > 0);

  const alerts: { type: "warning" | "info" | "success"; message: string }[] =
    [];
  if (
    latest &&
    latest.billedDemand &&
    latest.sanctionedLoad &&
    latest.billedDemand > latest.sanctionedLoad
  ) {
    alerts.push({
      type: "warning",
      message: `Max demand exceeded — ${latest.billedDemand} kW against ${latest.sanctionedLoad} kW sanctioned.`,
    });
  }
  if (prev && latest && prev.currentBill && latest.currentBill) {
    const billChange =
      ((latest.currentBill - prev.currentBill) / prev.currentBill) * 100;
    if (billChange > 15)
      alerts.push({
        type: "warning",
        message: `Bill up ${billChange.toFixed(0)}% on last month.`,
      });
    else if (billChange < -10)
      alerts.push({
        type: "success",
        message: `Bill down ${Math.abs(billChange).toFixed(0)}% on last month.`,
      });
  }
  if (latest && latest.powerFactor && latest.powerFactor < 0.9) {
    alerts.push({
      type: "warning",
      message: `Power factor is low at ${latest.powerFactor.toFixed(3)} — may attract a penalty.`,
    });
  }
  if (solarMonths > 0 && chartData.length >= 2) {
    const lastSolar = chartData[chartData.length - 1].solarExport;
    const prevSolar = chartData[chartData.length - 2].solarExport;
    if (lastSolar > 0 && prevSolar > 0) {
      const solarDrop = ((prevSolar - lastSolar) / prevSolar) * 100;
      if (solarDrop > 20)
        alerts.push({
          type: "info",
          message: `Solar export dropped ${solarDrop.toFixed(0)}% from last month.`,
        });
    }
  }
  if (totalSubsidy > 0)
    alerts.push({
      type: "success",
      message: `₹${inr(totalSubsidy)} in subsidy received across ${total} bills.`,
    });
  if (alerts.length === 0)
    alerts.push({
      type: "info",
      message:
        "Nothing unusual this period — consumption, demand and power factor are all in range.",
    });

  if (loading)
    return (
      <div className="dash-root">
        <div className="skeleton-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton--card" />
          ))}
        </div>
        <div className="skeleton skeleton--chart" />
        <div className="skeleton skeleton--chart" />
      </div>
    );
  if (bills.length === 0)
    return (
      <div className="dash-root">
        <div className="empty-state">
          <div className="empty-state__mark">⚡</div>
          <h1>No bills yet</h1>
          <p>
            Upload your first electricity bill and this page turns it into a
            running record of usage, cost and solar performance.
          </p>
        </div>
      </div>
    );
  if (filtered.length === 0)
    return (
      <div className="dash-root">
        <div className="empty-state">
          <div className="empty-state__mark">◐</div>
          <h1>No bills match these filters</h1>
          <p>Try widening the date range or choosing a different account.</p>
        </div>
      </div>
    );

  return (
    <div className="dash-root">
      {/* ===== TOPBAR ===== */}
      <div className="topbar">
        <div>
          <h1 className="topbar__title">Power &amp; billing</h1>
          <p className="topbar__meta">
            {accountNames.get(selectedAccount) || selectedAccount} · {total}{" "}
            billing period{total === 1 ? "" : "s"}
            {sortedMonths.length > 0 && (
              <>
                {" "}
                · {fmt(sortedMonths[0])}–
                {fmt(sortedMonths[sortedMonths.length - 1])}
              </>
            )}
          </p>
        </div>
        <button
          className="btn-ghost mobile-only"
          onClick={() => setShowFilters(true)}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          Filters
        </button>
        <div className="topbar__filters desktop-only">
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a} value={a}>
                {a}
                {accountNames.has(a) ? ` — ${accountNames.get(a)}` : ""}
              </option>
            ))}
          </select>
          <select
            value={monthFrom}
            onChange={(e) => setMonthFrom(e.target.value)}
          >
            <option value="">Earliest</option>
            {sortedMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <span className="topbar__filter-sep">→</span>
          <select value={monthTo} onChange={(e) => setMonthTo(e.target.value)}>
            <option value="">Latest</option>
            {sortedMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ===== MOBILE FILTERS ===== */}
      {showFilters && (
        <div className="modal-overlay" onClick={() => setShowFilters(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="modal-content__header">
              <h3>Filters</h3>
              <button
                className="icon-btn"
                onClick={() => setShowFilters(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content__body">
              <div className="field">
                <label>Account</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => {
                    setSelectedAccount(e.target.value);
                    setShowFilters(false);
                  }}
                >
                  {accounts.map((a) => (
                    <option key={a} value={a}>
                      {a}
                      {accountNames.has(a) ? ` — ${accountNames.get(a)}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>From</label>
                <select
                  value={monthFrom}
                  onChange={(e) => {
                    setMonthFrom(e.target.value);
                    setShowFilters(false);
                  }}
                >
                  <option value="">Earliest</option>
                  {sortedMonths.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>To</label>
                <select
                  value={monthTo}
                  onChange={(e) => {
                    setMonthTo(e.target.value);
                    setShowFilters(false);
                  }}
                >
                  <option value="">Latest</option>
                  {sortedMonths.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn-ghost"
                style={{ justifyContent: "center", marginTop: 4 }}
                onClick={() => {
                  setMonthFrom("");
                  setMonthTo("");
                  setSelectedAccount(accounts[0] || "");
                  setShowFilters(false);
                }}
              >
                Reset filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== HERO ===== */}
      <div className="hero-grid">
        <div className="card hero-readout">
          <div className="hero-readout__label">
            Current bill · {latest ? fmt(latest.billMonth) : "—"}
          </div>
          <div className="hero-readout__value">
            ₹{inr(latest?.currentBill ?? 0)}
          </div>
          <Delta value={billDeltaPct} />
          {billSparkline.length > 1 && (
            <div className="hero-readout__spark">
              <Sparkline
                data={billSparkline}
                color={
                  billDeltaPct !== null && billDeltaPct > 0 ? C.red : C.teal
                }
              />
            </div>
          )}
          <div className="hero-readout__foot">
            <div>
              <span className="hero-readout__foot-num">
                {(latest?.consumption ?? 0).toFixed(0)}
              </span>{" "}
              kWh used <Delta value={consumptionDeltaPct} suffix="%" />
            </div>
            <div>
              <span className="hero-readout__foot-num">
                ₹{avgCostPerUnit.toFixed(2)}
              </span>{" "}
              avg cost / kWh
            </div>
          </div>
        </div>

        <div className="card hero-dial">
          <div className="hero-dial__label">Demand vs sanctioned load</div>
          <DemandDial
            billed={latest?.billedDemand ?? 0}
            sanctioned={latest?.sanctionedLoad ?? 1}
          />
        </div>

        <div className="card hero-insights">
          <div className="hero-insights__label">What&rsquo;s worth knowing</div>
          <div className="insight-list">
            {alerts.slice(0, 4).map((a, i) => (
              <AlertRow key={i} type={a.type} message={a.message} />
            ))}
          </div>
        </div>
      </div>

      {/* ===== CONSUMPTION & COST ===== */}
      <SectionHeading
        title="Consumption &amp; cost"
        note={`Average ${avgConsumption.toFixed(0)} kWh / month`}
      />
      <div className="grid-2">
        <ChartCard
          title="Monthly consumption"
          subtitle="Bars above the dashed line ran hotter than average"
        >
          <ResponsiveContainer width="100%" height={chartH}>
            <ComposedChart data={chartDataWithAvg}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1D2128"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#4B525F"
                fontSize={11}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#4B525F"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={ttStyle}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Legend
                iconType="plainline"
                iconSize={10}
                wrapperStyle={{ fontSize: 12, color: "#8B93A1" }}
              />
              {avgConsumption > 0 && (
                <ReferenceLine
                  y={avgConsumption}
                  stroke="#4B525F"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}
              <Bar
                dataKey="consumption"
                name="kWh used"
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
              >
                {chartDataWithAvg.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.consumption > avgConsumption ? C.amber : "#3A6FF7"}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="rollingAvg"
                name="3-mo avg"
                stroke={C.teal}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Month-over-month change"
          subtitle="Consumption swing vs the previous bill"
        >
          <ResponsiveContainer width="100%" height={chartH}>
            <BarChart data={momData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1D2128"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#4B525F"
                fontSize={11}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#4B525F"
                fontSize={11}
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={ttStyle}
                formatter={(v: number) => [`${v.toFixed(1)}%`, "Change"]}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <ReferenceLine y={0} stroke="#4B525F" strokeWidth={1} />
              <Bar
                dataKey="momPct"
                name="Change"
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
              >
                {momData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={
                      d.momPct >= 5 ? C.red : d.momPct <= -5 ? C.teal : C.slate
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ===== BILL BREAKDOWN ===== */}
      <SectionHeading title="Where the bill goes" />
      <div className="grid-1-5">
        <ChartCard
          title="Charges over time"
          subtitle="Energy, demand, duty and other charges stacked per month"
        >
          <ResponsiveContainer width="100%" height={chartH}>
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1D2128"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#4B525F"
                fontSize={11}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#4B525F"
                fontSize={11}
                tickFormatter={(v) => `₹${v.toFixed(0)}`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={ttStyle} />
              <Legend
                iconType="plainline"
                iconSize={10}
                wrapperStyle={{ fontSize: 12, color: "#8B93A1" }}
              />
              <Bar
                dataKey="energyCharges"
                name="Energy"
                stackId="a"
                fill={PIE_COLORS[0]}
              />
              <Bar
                dataKey="demandCharges"
                name="Demand"
                stackId="a"
                fill={PIE_COLORS[1]}
              />
              <Bar
                dataKey="duty"
                name="Duty"
                stackId="a"
                fill={PIE_COLORS[2]}
              />
              <Bar
                dataKey="other"
                name="Other"
                stackId="a"
                fill={PIE_COLORS[3]}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Latest composition"
          subtitle={
            latest
              ? `${fmt(latest.billMonth)} · ₹${inr(latest.currentBill ?? 0)}`
              : undefined
          }
        >
          {latestBreakdown.length > 0 ? (
            <div className="donut-wrap" style={{ height: chartHComp }}>
              <div className="donut-wrap__chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={latestBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={76}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {latestBreakdown.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={ttStyle}
                      formatter={(v: number) => [`₹${inr(v)}`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-wrap__center">
                  <div className="donut-wrap__center-value">
                    ₹{inr(latest?.currentBill ?? 0)}
                  </div>
                  <div className="donut-wrap__center-label">Total</div>
                </div>
              </div>
              <div className="legend-row">
                {latestBreakdown.map((d, i) => (
                  <div key={i} className="legend-row__item">
                    <span
                      className="legend-row__dot"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="legend-row__name">{d.name}</span>
                    <span className="legend-row__pct">
                      {(
                        (d.value /
                          Math.max(
                            1,
                            latestBreakdown.reduce((s, x) => s + x.value, 0),
                          )) *
                        100
                      ).toFixed(0)}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-inline">No charge data for this bill</div>
          )}
        </ChartCard>
      </div>

      {/* ===== SOLAR ===== */}
      {solarMonths > 0 && (
        <>
          <SectionHeading
            title="Solar performance"
            note={`${((totalSolarExport / totalConsumption) * 100).toFixed(1)}% of usage offset`}
          />
          <div className="kpi-strip">
            <div className="kpi-strip__item">
              <span className="kpi-strip__label">Total exported</span>
              <span className="kpi-strip__value" style={{ color: C.teal }}>
                {totalSolarExport.toFixed(0)} <small>kWh</small>
              </span>
              <span className="kpi-strip__sub">
                avg {avgMonthlyExport.toFixed(0)} kWh / mo
              </span>
            </div>
            <div className="kpi-strip__item">
              <span className="kpi-strip__label">Grid savings</span>
              <span className="kpi-strip__value" style={{ color: C.teal }}>
                ₹{inr(solarMonetaryBenefit)}
              </span>
              <span className="kpi-strip__sub">
                at ₹{avgCostPerUnit.toFixed(2)} / kWh
              </span>
            </div>
            <div className="kpi-strip__item">
              <span className="kpi-strip__label">Usage offset</span>
              <span className="kpi-strip__value">
                {totalConsumption > 0
                  ? ((totalSolarExport / totalConsumption) * 100).toFixed(1)
                  : 0}
                <small>%</small>
              </span>
              <span className="kpi-strip__sub">
                {netConsumption.toFixed(0)} kWh still from grid
              </span>
            </div>
            <div className="kpi-strip__item">
              <span className="kpi-strip__label">Net banked surplus</span>
              <span
                className="kpi-strip__value"
                style={{ color: netBalanceChange >= 0 ? C.teal : C.red }}
              >
                {latestClosing.toFixed(0)} <small>kWh</small>
              </span>
              <span className="kpi-strip__sub">
                {netBalanceChange >= 0 ? "+" : ""}
                {netBalanceChange.toFixed(0)} kWh since start
              </span>
            </div>
          </div>
          <div className="grid-2">
            <ChartCard
              title="Grid vs solar"
              subtitle="What powered your home each month"
            >
              <ResponsiveContainer width="100%" height={chartHSm}>
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1D2128"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#4B525F"
                    fontSize={11}
                    interval="preserveStartEnd"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#4B525F"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={ttStyle} />
                  <Legend
                    iconType="plainline"
                    iconSize={10}
                    wrapperStyle={{ fontSize: 12, color: "#8B93A1" }}
                  />
                  <Bar
                    dataKey="netConsumption"
                    name="From grid"
                    fill="#3A6FF7"
                    radius={[3, 3, 0, 0]}
                    stackId="a"
                  />
                  <Bar
                    dataKey="solarExport"
                    name="Solar"
                    fill={C.teal}
                    radius={[3, 3, 0, 0]}
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard
              title="Cumulative savings"
              subtitle={
                cumulativeSolarSavings.length > 0
                  ? `₹${inr(cumulativeSolarSavings[cumulativeSolarSavings.length - 1].savings)} banked so far`
                  : undefined
              }
            >
              <ResponsiveContainer width="100%" height={chartHSm}>
                <AreaChart data={cumulativeSolarSavings}>
                  <defs>
                    <linearGradient id="cumSolar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.teal} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1D2128"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#4B525F"
                    fontSize={11}
                    interval="preserveStartEnd"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#4B525F"
                    fontSize={11}
                    tickFormatter={(v) => `₹${v.toFixed(0)}`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={ttStyle} />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stroke={C.teal}
                    strokeWidth={2}
                    fill="url(#cumSolar)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}

      {/* ===== LOAD & EFFICIENCY ===== */}
      <SectionHeading title="Load &amp; efficiency" />
      <div className="grid-2">
        <ChartCard
          title="Billed demand vs sanctioned"
          subtitle="Red bars mean the sanctioned load was exceeded that month"
        >
          <ResponsiveContainer width="100%" height={chartHSm}>
            <ComposedChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1D2128"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#4B525F"
                fontSize={11}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#4B525F"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={ttStyle} />
              <Legend
                iconType="plainline"
                iconSize={10}
                wrapperStyle={{ fontSize: 12, color: "#8B93A1" }}
              />
              <Bar
                dataKey="billedDemand"
                name="Billed demand"
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
              >
                {chartData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.billedDemand > d.sanctionedLoad ? C.red : C.amber}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="sanctionedLoad"
                name="Sanctioned"
                stroke={C.teal}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Cost per unit"
          subtitle={
            avgCostPerUnit > 0
              ? `Average ₹${avgCostPerUnit.toFixed(2)} / kWh across the period`
              : undefined
          }
        >
          <ResponsiveContainer width="100%" height={chartHSm}>
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1D2128"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#4B525F"
                fontSize={11}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#4B525F"
                fontSize={11}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `₹${v.toFixed(1)}`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={ttStyle} />
              {avgCostPerUnit > 0 && (
                <ReferenceLine
                  y={avgCostPerUnit}
                  stroke="#4B525F"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}
              <Line
                type="monotone"
                dataKey="costPerUnit"
                stroke={C.violet}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ===== PERIOD SUMMARY ===== */}
      <div className="card summary-strip">
        {[
          {
            label: "Period",
            value:
              chartData.length > 0
                ? `${chartData[0].month} – ${chartData[chartData.length - 1].month}`
                : "—",
          },
          {
            label: "Avg consumption",
            value: `${avgConsumption.toFixed(0)} kWh`,
          },
          { label: "Avg bill", value: `₹${inr(avgBill)}` },
          {
            label: "Total consumption",
            value: `${(totalConsumption / 1000).toFixed(1)}k kWh`,
          },
          {
            label: "Total billed",
            value: `₹${(totalBill / 100000).toFixed(1)}L`,
          },
          {
            label: "Total subsidy",
            value:
              totalSubsidy > 0 ? `₹${(totalSubsidy / 1000).toFixed(1)}k` : "—",
          },
        ].map((item) => (
          <div key={item.label} className="summary-strip__item">
            <div className="summary-strip__label">{item.label}</div>
            <div className="summary-strip__value">{item.value}</div>
          </div>
        ))}
      </div>

      {/* ===== BILLING HISTORY ===== */}
      <div className="card table-wrap">
        <div className="table-wrap__header">
          <span>Billing history</span>
          <span className="table-wrap__count">{sorted.length} records</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Account</th>
                <th>Consumer</th>
                <th className="num">kWh</th>
                <th className="num">Bill</th>
                <th className="num">Payable</th>
                <th className="num">PF</th>
                <th className="num">Solar</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...sorted].reverse().map((b) => (
                <tr key={b.id}>
                  <td>{fmt(b.billMonth)}</td>
                  <td className="dim">{b.accountNumber}</td>
                  <td className="dim">{b.consumerName ?? "—"}</td>
                  <td className="num strong">
                    {b.consumption?.toFixed(0) ?? "—"}
                  </td>
                  <td className="num">₹{inr(b.currentBill ?? 0)}</td>
                  <td
                    className="num"
                    style={{ color: C.teal, fontWeight: 600 }}
                  >
                    ₹{inr(b.payableAmount ?? 0)}
                  </td>
                  <td className="num dim">
                    {b.powerFactor?.toFixed(3) ?? "—"}
                  </td>
                  <td className="num" style={{ color: C.amber }}>
                    {b.solarExport?.toFixed(0) ?? "—"}
                  </td>
                  <td>
                    <button className="btn-view" onClick={() => setViewBill(b)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {viewBill && (
        <div className="modal-overlay" onClick={() => setViewBill(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle mobile-only" />
            <div className="modal-content__header">
              <h3>{viewBill.billNumber}</h3>
              <button className="icon-btn" onClick={() => setViewBill(null)}>
                ×
              </button>
            </div>
            <div className="modal-content__body modal-content__body--scroll">
              <table className="detail-table">
                <tbody>
                  {Object.entries(LABELS).map(([key, label]) => {
                    let val: any = (viewBill as any)[key];
                    if (val === null || val === undefined || val === "")
                      val = "—";
                    else if (typeof val === "number") {
                      const formatted = val.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      });
                      const moneyKeys = [
                        "amount",
                        "charges",
                        "bill",
                        "due",
                        "fppa",
                        "subsidy",
                        "arrears",
                        "credit",
                        "debit",
                        "rebate",
                        "deposit",
                        "payment",
                      ];
                      val = moneyKeys.some((k) => key.toLowerCase().includes(k))
                        ? `₹ ${formatted}`
                        : formatted;
                    } else if (key === "rawText" && val.length > 200)
                      val = val.slice(0, 200) + "…";
                    return (
                      <tr key={key}>
                        <td className="detail-table__label">{label}</td>
                        <td
                          className={
                            key === "rawText" ? "detail-table__mono" : ""
                          }
                        >
                          {val}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap");

        :root {
          --ink: #0a0c10;
          --surface: #12151b;
          --surface-2: #181c24;
          --line: #232830;
          --text: #edeff2;
          --text-dim: #8b93a1;
          --text-faint: #565d6b;
          --font-body: "Inter", -apple-system, sans-serif;
          --font-mono: "IBM Plex Mono", "SFMono-Regular", monospace;
        }

        .dash-root {
          font-family: var(--font-body);
          color: var(--text);
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px 20px 60px;
        }
        .dash-root * {
          box-sizing: border-box;
        }
        .dash-root :focus-visible {
          outline: 2px solid ${C.teal};
          outline-offset: 2px;
        }

        .card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 14px;
        }

        select {
          background: var(--surface-2);
          border: 1px solid var(--line);
          color: var(--text);
          border-radius: 8px;
          padding: 7px 10px;
          font-size: 13px;
          font-family: var(--font-body);
        }

        .btn-ghost {
          background: transparent;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 8px 14px;
          color: var(--text-dim);
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          min-height: 36px;
        }
        .btn-ghost:hover {
          color: var(--text);
          border-color: #323844;
        }

        .desktop-only {
          display: flex;
        }
        .mobile-only {
          display: none;
        }
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
            display: flex !important;
          }
        }

        /* ===== Topbar ===== */
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }
        .topbar__title {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .topbar__meta {
          color: var(--text-dim);
          margin: 4px 0 0;
          font-size: 13px;
        }
        .topbar__filters {
          align-items: center;
          gap: 8px;
        }
        .topbar__filter-sep {
          color: var(--text-faint);
          font-size: 12px;
        }

        /* ===== Section heading ===== */
        .section-heading {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin: 30px 0 12px;
          padding-top: 2px;
        }
        .section-heading__title {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-dim);
        }
        .section-heading__note {
          font-size: 12px;
          color: var(--text-faint);
          font-family: var(--font-mono);
        }

        /* ===== Hero ===== */
        .hero-grid {
          display: grid;
          grid-template-columns: 1.3fr 0.9fr 1fr;
          gap: 14px;
        }
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr;
          }
        }

        .hero-readout,
        .hero-dial,
        .hero-insights {
          padding: 20px;
        }
        .hero-readout__label,
        .hero-dial__label,
        .hero-insights__label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-faint);
          margin-bottom: 10px;
        }
        .hero-readout__value {
          font-family: var(--font-mono);
          font-size: 38px;
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .hero-readout__spark {
          margin: 14px 0 6px;
          opacity: 0.9;
        }
        .hero-readout__foot {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 10px;
          padding-top: 12px;
          border-top: 1px solid var(--line);
          font-size: 12px;
          color: var(--text-dim);
        }
        .hero-readout__foot-num {
          font-family: var(--font-mono);
          color: var(--text);
          font-weight: 600;
        }

        .hero-dial {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .dial {
          width: 100%;
          max-width: 200px;
        }
        .dial__value {
          font-family: var(--font-mono);
          font-size: 20px;
          font-weight: 600;
        }
        .dial__caption {
          margin-top: -6px;
          font-size: 12px;
          font-family: var(--font-mono);
        }
        .dial__of {
          color: var(--text-faint);
        }

        .delta {
          font-size: 12px;
          font-family: var(--font-mono);
        }
        .delta--good {
          color: ${C.teal};
        }
        .delta--bad {
          color: ${C.red};
        }
        .delta--flat {
          color: var(--text-faint);
        }

        .insight-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .insight-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .insight-row__dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }
        .insight-row__text {
          font-size: 13px;
          line-height: 1.45;
          color: #d7dae0;
        }

        /* ===== Chart cards ===== */
        .chart-card {
          padding: 18px 18px 10px;
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 8px;
          flex-wrap: wrap;
          gap: 4px;
        }
        .chart-header h3 {
          font-size: 14px;
          font-weight: 600;
          margin: 0;
        }
        .chart-subtitle {
          font-size: 11.5px;
          color: var(--text-faint);
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .grid-1-5 {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 14px;
        }
        @media (max-width: 900px) {
          .grid-2,
          .grid-1-5 {
            grid-template-columns: 1fr;
          }
        }

        .donut-wrap {
          display: flex;
          flex-direction: column;
        }
        .donut-wrap__chart {
          flex: 1;
          position: relative;
        }
        .donut-wrap__center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -55%);
          text-align: center;
          pointer-events: none;
        }
        .donut-wrap__center-value {
          font-family: var(--font-mono);
          font-size: 16px;
          font-weight: 600;
          line-height: 1;
        }
        .donut-wrap__center-label {
          font-size: 9px;
          color: var(--text-faint);
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .legend-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
          padding: 8px 0 4px;
        }
        .legend-row__item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
        }
        .legend-row__dot {
          width: 7px;
          height: 7px;
          border-radius: 2px;
        }
        .legend-row__name {
          color: var(--text-dim);
        }
        .legend-row__pct {
          font-family: var(--font-mono);
          font-weight: 600;
        }
        .empty-inline {
          color: var(--text-faint);
          padding: 40px;
          text-align: center;
          font-size: 13px;
        }

        /* ===== KPI strip (solar) ===== */
        .kpi-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 14px;
        }
        @media (max-width: 700px) {
          .kpi-strip {
            grid-template-columns: 1fr 1fr;
          }
        }
        .kpi-strip__item {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 14px 16px;
        }
        .kpi-strip__label {
          display: block;
          font-size: 11px;
          color: var(--text-faint);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }
        .kpi-strip__value {
          font-family: var(--font-mono);
          font-size: 20px;
          font-weight: 600;
        }
        .kpi-strip__value small {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-dim);
        }
        .kpi-strip__sub {
          display: block;
          font-size: 11px;
          color: var(--text-faint);
          margin-top: 4px;
        }

        /* ===== Summary strip ===== */
        .summary-strip {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
          padding: 16px 20px;
          margin: 30px 0 14px;
        }
        @media (max-width: 700px) {
          .summary-strip {
            grid-template-columns: 1fr 1fr;
          }
        }
        .summary-strip__label {
          font-size: 10px;
          color: var(--text-faint);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 3px;
        }
        .summary-strip__value {
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 600;
        }

        /* ===== Table ===== */
        .table-wrap__header {
          padding: 16px 20px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--line);
        }
        .table-wrap__count {
          color: var(--text-faint);
          font-size: 11px;
          font-weight: 400;
          font-family: var(--font-mono);
        }
        .table-scroll {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 680px;
        }
        th {
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-faint);
          font-weight: 500;
          padding: 10px 14px;
          border-bottom: 1px solid var(--line);
        }
        td {
          padding: 10px 14px;
          border-bottom: 1px solid #191d24;
          font-size: 13px;
          font-family: var(--font-mono);
        }
        th.num,
        td.num {
          text-align: right;
        }
        td.dim {
          color: var(--text-dim);
          font-family: var(--font-body);
          font-size: 12px;
        }
        td.strong {
          font-weight: 600;
        }
        .btn-view {
          background: var(--surface-2);
          border: 1px solid var(--line);
          border-radius: 6px;
          padding: 5px 12px;
          color: var(--text-dim);
          font-size: 11px;
          font-family: var(--font-body);
          cursor: pointer;
        }
        .btn-view:hover {
          color: var(--text);
          border-color: #323844;
        }
        tr:hover td {
          background: rgba(255, 255, 255, 0.015);
        }

        /* ===== Modal ===== */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(5, 6, 9, 0.7);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 100;
        }
        @media (min-width: 769px) {
          .modal-overlay {
            align-items: center;
          }
        }
        .modal-content {
          background: var(--surface);
          border: 1px solid var(--line);
          width: 100%;
          max-width: 560px;
          max-height: 85vh;
          border-radius: 16px 16px 0 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        @media (min-width: 769px) {
          .modal-content {
            border-radius: 16px;
          }
        }
        .sheet-handle {
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          height: 4px;
          border-radius: 2px;
          background: var(--line);
        }
        .modal-content__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px 14px;
          border-bottom: 1px solid var(--line);
        }
        .modal-content__header h3 {
          margin: 0;
          font-size: 15px;
          font-family: var(--font-mono);
        }
        .icon-btn {
          background: transparent;
          border: 0;
          color: var(--text-faint);
          font-size: 20px;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-content__body {
          padding: 16px 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .modal-content__body--scroll {
          overflow: auto;
          padding-top: 8px;
        }
        .field label {
          font-size: 11px;
          color: var(--text-faint);
          margin-bottom: 4px;
          display: block;
        }

        .detail-table {
          width: 100%;
          border-collapse: collapse;
        }
        .detail-table td {
          font-family: var(--font-body);
          font-size: 12.5px;
          padding: 7px 10px;
          border-bottom: 1px solid #191d24;
          word-break: break-word;
        }
        .detail-table__label {
          color: var(--text-faint);
          width: 40%;
          white-space: nowrap;
        }
        .detail-table__mono {
          font-family: var(--font-mono);
          font-size: 11px;
          word-break: break-all;
        }

        /* ===== Empty / loading ===== */
        .empty-state {
          text-align: center;
          padding: 100px 20px;
        }
        .empty-state__mark {
          font-size: 34px;
          margin-bottom: 14px;
          opacity: 0.6;
        }
        .empty-state h1 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: var(--text-dim);
        }
        .empty-state p {
          margin: 8px auto 0;
          color: var(--text-faint);
          font-size: 13px;
          max-width: 360px;
          line-height: 1.6;
        }

        .skeleton {
          background: linear-gradient(
            90deg,
            var(--surface) 0%,
            var(--surface-2) 50%,
            var(--surface) 100%
          );
          background-size: 200% 100%;
          border: 1px solid var(--line);
          border-radius: 12px;
          animation: shimmer 1.6s infinite;
        }
        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 16px;
        }
        .skeleton--card {
          height: 140px;
        }
        .skeleton--chart {
          height: 280px;
          margin-bottom: 14px;
        }
        @media (max-width: 900px) {
          .skeleton-grid {
            grid-template-columns: 1fr;
          }
        }
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .anim-in {
          animation: fadeIn 0.35s ease both;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton,
          .anim-in {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
