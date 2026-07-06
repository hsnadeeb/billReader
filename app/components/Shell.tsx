"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Upload", icon: "📄" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/bills", label: "Bills", icon: "📋" },
];

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link href={href} style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
      color: active ? "#3B82F6" : "#64748B", fontSize: 10, fontWeight: active ? 600 : 400,
      textDecoration: "none", transition: "color 0.15s", padding: "6px 12px",
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {NAV_ITEMS.map(item => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            borderRadius: 8, fontSize: 14, textDecoration: "none",
            background: active ? "#1E293B" : "transparent",
            color: active ? "#3B82F6" : "#94A3B8",
            fontWeight: active ? 600 : 400,
          }}>
            <span>{item.icon}</span> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Desktop sidebar */}
      <aside className="sidebar" style={{
        position: "fixed", top: 0, left: 0, width: 220, height: "100vh",
        background: "#111827", borderRight: "1px solid #1E293B", padding: "24px 20px",
        display: "flex", flexDirection: "column", zIndex: 100,
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 36, fontSize: 18 }}>⚡ Energy AI</h2>
        <SidebarNav />
      </aside>

      {/* Mobile top bar */}
      <header className="mobile-header" style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 52,
        background: "#111827", borderBottom: "1px solid #1E293B",
        display: "flex", alignItems: "center", padding: "0 16px", zIndex: 100,
      }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>⚡ Energy AI</span>
      </header>

      {/* Main */}
      <main className="main-content" style={{ flex: 1 }}>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 60,
        background: "#111827", borderTop: "1px solid #1E293B",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        zIndex: 100,
      }}>
        {NAV_ITEMS.map(item => <NavLink key={item.href} {...item} />)}
      </nav>
    </div>
  );
}
