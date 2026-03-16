"use client";

import Sidebar from "./Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex",
      height: "100vh",
      overflow: "hidden",
    }}>
      <Sidebar />
      <main
        className="cosmic-grid"
        style={{
          flex: 1,
          minWidth: 0,          /* CRITICAL: prevents flex children from overflowing */
          overflowX: "hidden",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        {children}
      </main>
    </div>
  );
}
