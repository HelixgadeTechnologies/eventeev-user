"use client";

import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { InstallBanner } from "../pwa/InstallBanner";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/" || pathname === "/join";

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {!hideNav && <Sidebar />}
      
      <main className={cn(
        "flex-1 flex flex-col",
        !hideNav && "lg:pl-0"
      )}>
        <Header />
        
        <div className={cn(
          "flex-1 overflow-y-auto",
          !hideNav ? "pt-16 pb-24 lg:pb-0" : ""
        )}>
          {children}
        </div>

        {!hideNav && <BottomNav />}
        <InstallBanner />
      </main>
    </div>
  );
}
