"use client";

import { useEffect, useMemo, useState } from "react";

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
  pdfPath: string | null;
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
  powerFactor: "Power Factor", solarExport: "Solar Export (kWh)",
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

const moneyKeys = ["amount", "charges", "bill", "due", "fppa", "subsidy", "arrears", "credit", "debit", "rebate", "deposit", "payment"];

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [monthFrom, setMonthFrom] = useState("");
  const [monthTo, setMonthTo] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const [viewTab, setViewTab] = useState<"data" | "pdf">("pdf");

  async function loadBills() {
    setLoading(true);
    try {
      const res = await fetch("/api/bills");
      const json = await res.json();
      setBills(json.data ?? []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  useEffect(() => { loadBills(); }, []);

  const accounts = useMemo(() => Array.from(new Set(bills.map(b => b.accountNumber))).sort(), [bills]);

  useEffect(() => {
    if (!accountFilter && accounts.length > 0) setAccountFilter(accounts[0]);
  }, [accounts, accountFilter]);

  const sortedMonths = useMemo(() => {
    const set = new Set(bills.map(b => b.billMonth));
    return Array.from(set).sort((a, b) => {
      const da = parseBillMonth(a), db = parseBillMonth(b);
      if (!da || !db) return 0;
      return da.getTime() - db.getTime();
    });
  }, [bills]);

  const filteredBills = useMemo(() => {
    const q = search.toLowerCase();
    return bills.filter(bill => {
      if (accountFilter && bill.accountNumber !== accountFilter) return false;
      if (monthFrom) { const d = parseBillMonth(bill.billMonth), f = parseBillMonth(monthFrom); if (d && f && d.getTime() < f.getTime()) return false; }
      if (monthTo) { const d = parseBillMonth(bill.billMonth), t = parseBillMonth(monthTo); if (d && t && d.getTime() > t.getTime()) return false; }
      return (
        bill.accountNumber.toLowerCase().includes(q) ||
        bill.billNumber.toLowerCase().includes(q) ||
        bill.billMonth.toLowerCase().includes(q) ||
        (bill.consumerName ?? "").toLowerCase().includes(q) ||
        (bill.meterNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [search, accountFilter, monthFrom, monthTo, bills]);

  const accountName = useMemo(() => {
    for (const b of bills) {
      if (b.accountNumber === accountFilter && b.consumerName) return b.consumerName;
    }
    return null;
  }, [bills, accountFilter]);

  async function deleteBill(id: string) {
    if (!confirm("Delete this bill?")) return;
    const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBills(prev => prev.filter(x => x.id !== id));
      if (viewBill?.id === id) setViewBill(null);
    }
  }

  async function deleteAll() {
    if (!confirm(`Delete all ${bills.length} bills? This cannot be undone.`)) return;
    setDeletingAll(true);
    try {
      const res = await fetch("/api/bills", { method: "DELETE" });
      if (res.ok) setBills([]);
    } catch (err) { console.error(err); }
    setDeletingAll(false);
  }

  if (loading) return <div style={{ textAlign: "center", padding: 80, opacity: 0.5 }}>Loading...</div>;

  return (
    <div>
      {/* Header */}
      <div className="header-row" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Bills</h1>
          <p style={{ color: "#64748B", margin: "4px 0 0", fontSize: 13 }}>
            {accountName || accountFilter} &middot; {filteredBills.length} records
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: 260, padding: "10px 14px", borderRadius: 10, border: "1px solid #334155", background: "#111827", color: "white", outline: "none", fontSize: 13 }} />
        </div>
      </div>

      {/* Filters */}
      <div className="filters-row" style={{ marginBottom: 20 }}>
        <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} style={{ ...sel, width: "100%" }}>
          {accounts.map(a => <option key={a} value={a}>{a}{bills.find(b => b.accountNumber === a && b.consumerName) ? ` — ${bills.find(b => b.accountNumber === a && b.consumerName)!.consumerName}` : ""}</option>)}
        </select>

        <span className="filter-label" style={{ color: "#64748B", fontSize: 12 }}>From</span>
        <select value={monthFrom} onChange={e => setMonthFrom(e.target.value)} style={{ ...sel, flex: 1 }}>
          <option value="">Earliest</option>
          {sortedMonths.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <span className="filter-label" style={{ color: "#64748B", fontSize: 12 }}>To</span>
        <select value={monthTo} onChange={e => setMonthTo(e.target.value)} style={{ ...sel, flex: 1 }}>
          <option value="">Latest</option>
          {sortedMonths.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          {bills.length > 0 && (
            <>
              <button onClick={() => window.open(`/api/bills/export?accounts=${accountFilter}`)}
                style={{ flex: 1, background: "#16A34A", color: "white", border: 0, borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Export</button>
              <button onClick={deleteAll} disabled={deletingAll}
                style={{ flex: 1, background: "#DC2626", color: "white", border: 0, borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                {deletingAll ? "Deleting..." : "Delete All"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap" style={{ background: "#111827", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#1E293B" }}>
              {["Month", "Account", "Meter", "Consumer", "Units", "Bill", "Payable", "PF", "Solar", ""].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && filteredBills.length === 0 && (
              <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: "#64748B" }}>No bills found</td></tr>
            )}
            {filteredBills.map(bill => (
              <tr key={bill.id} style={{ transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#1a2332"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={td}>{fmt(bill.billMonth)}</td>
                <td style={td}>{bill.accountNumber}</td>
                <td style={td}>{bill.meterNumber ?? "—"}</td>
                <td style={td}>{bill.consumerName ?? "—"}</td>
                <td style={{ ...td, fontWeight: 600 }}>{bill.consumption?.toFixed(0) ?? "—"}</td>
                <td style={{ ...td, fontWeight: 600 }}>₹ {bill.currentBill?.toFixed(0) ?? "—"}</td>
                <td style={{ ...td, color: "#22c55e", fontWeight: 600 }}>₹ {bill.payableAmount?.toFixed(0) ?? "—"}</td>
                <td style={td}>{bill.powerFactor?.toFixed(3) ?? "—"}</td>
                <td style={{ ...td, color: bill.solarExport ? "#F97316" : "#64748B" }}>{bill.solarExport?.toFixed(0) ?? "—"}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button onClick={() => { setViewBill(bill); setViewTab(bill.pdfPath ? "pdf" : "data"); }}
                      style={{ background: "#3B82F6", color: "white", border: 0, borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontSize: 11, fontWeight: 500 }}>View</button>
                    <button onClick={() => deleteBill(bill.id)}
                      style={{ background: "#DC2626", color: "white", border: 0, borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11 }}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {viewBill && (
        <div className="modal-overlay" onClick={() => setViewBill(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #1E293B" }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 16 }}>{viewBill.billNumber}</span>
                <span style={{ color: "#64748B", fontSize: 13, marginLeft: 12 }}>{fmt(viewBill.billMonth)}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {viewBill.pdfPath && (
                  <div style={{ display: "flex", background: "#1E293B", borderRadius: 8, overflow: "hidden" }}>
                    <button onClick={() => setViewTab("pdf")} style={{ ...tabBtn, background: viewTab === "pdf" ? "#3B82F6" : "transparent", color: viewTab === "pdf" ? "white" : "#94A3B8" }}>PDF</button>
                    <button onClick={() => setViewTab("data")} style={{ ...tabBtn, background: viewTab === "data" ? "#3B82F6" : "transparent", color: viewTab === "data" ? "white" : "#94A3B8" }}>Data</button>
                  </div>
                )}
                <button onClick={() => setViewBill(null)} style={{ background: "none", border: 0, color: "#94A3B8", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "4px 8px" }}>&times;</button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              {viewTab === "pdf" && viewBill.pdfPath ? (
                <iframe src={`/api/bills/${viewBill.id}/pdf`} style={{ width: "100%", height: "75vh", border: "none" }} title="Bill PDF" />
              ) : (
                <div style={{ padding: "12px 20px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {Object.entries(LABELS).map(([key, label]) => {
                        let val: any = (viewBill as any)[key];
                        if (val === null || val === undefined || val === "") val = "—";
                        else if (typeof val === "number") {
                          val = val.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
                          if (moneyKeys.some(k => key.toLowerCase().includes(k))) val = `₹ ${val}`;
                        } else if (key === "rawText" && val.length > 200) val = val.slice(0, 200) + "...";
                        return (
                          <tr key={key}>
                            <td style={{ padding: "8px 12px", borderBottom: "1px solid #0F172A", color: "#94A3B8", fontSize: 12, whiteSpace: "nowrap", width: "40%" }}>{label}</td>
                            <td style={{ padding: "8px 12px", borderBottom: "1px solid #0F172A", fontSize: 12, fontFamily: key === "rawText" ? "monospace" : "inherit", wordBreak: "break-all", whiteSpace: key === "rawText" ? "pre-wrap" : "normal", maxHeight: key === "rawText" ? 100 : "none", overflow: key === "rawText" ? "hidden" : "visible" }}>{val}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const sel: React.CSSProperties = {
  padding: "9px 12px", borderRadius: 9, border: "1px solid #334155",
  background: "#111827", color: "white", outline: "none", fontSize: 13,
  cursor: "pointer", minWidth: 150,
};

const th: React.CSSProperties = {
  padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#94A3B8",
  fontWeight: 500, whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "10px 16px", borderTop: "1px solid #1E293B", fontSize: 13, whiteSpace: "nowrap",
};

const tabBtn: React.CSSProperties = {
  padding: "6px 14px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500,
  transition: "all 0.15s",
};
