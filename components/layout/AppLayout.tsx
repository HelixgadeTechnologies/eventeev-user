"use client";

import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { usePathname } from "next/navigation";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/" || pathname === "/join";

  return (
    <main className="flex-1 overflow-y-auto pt-16 pb-24 bg-[#F8FAFC]">
      <Header />
      {children}
      {!hideNav && <BottomNav />}
    </main>
  );
}
