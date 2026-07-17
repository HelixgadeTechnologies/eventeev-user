"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Home, 
  Calendar, 
  Users, 
  MessageSquare, 
  Gamepad2, 
  BarChart2, 
  Link as LinkIcon, 
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/schedule", label: "Schedule", icon: Calendar },
  { href: "/dashboard/speakers", label: "Speakers", icon: Users },
  { href: "/dashboard/networking", label: "Networking", icon: Globe },
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/games", label: "Games", icon: Gamepad2 },
  { href: "/dashboard/polls", label: "Polls", icon: BarChart2 },
  { href: "/dashboard/resources", label: "Resources", icon: LinkIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 shadow-sm z-10">
        <div className="p-6">
          <h2 className="text-2xl font-black text-eventeev-navy">Eventeev</h2>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            // Check if exact match for dashboard home, or starts with for subpages
            const isActive = item.href === "/dashboard" 
              ? pathname.endsWith("/dashboard") 
              : pathname.includes(item.href);
              
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all",
                  isActive 
                    ? "bg-eventeev-orange/10 text-eventeev-orange" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-eventeev-navy"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-eventeev-orange" : "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
        <div className="flex overflow-x-auto no-scrollbar py-2 px-2 gap-1 items-center">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/dashboard" 
              ? pathname.endsWith("/dashboard") 
              : pathname.includes(item.href);
              
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className="flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-14 rounded-xl relative"
              >
                {isActive && (
                  <motion.div 
                    layoutId="mobileNavIndicator"
                    className="absolute inset-0 bg-eventeev-orange/10 rounded-xl"
                  />
                )}
                <item.icon className={cn("w-5 h-5 mb-1 z-10", isActive ? "text-eventeev-orange" : "text-slate-400")} />
                <span className={cn("text-[10px] font-bold z-10", isActive ? "text-eventeev-orange" : "text-slate-500")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
