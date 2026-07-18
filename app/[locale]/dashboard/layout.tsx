"use client";

// The visual shell is now entirely handled by the global AppLayout (Sidebar & BottomNav)
// This file is kept just as a transparent pass-through for the dashboard route group.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full relative">
      {children}
    </div>
  );
}
