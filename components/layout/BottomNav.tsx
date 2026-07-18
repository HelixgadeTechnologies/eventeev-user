"use client";

import Link from "next/link";
import { usePathname } from "@/i18n/routing";
import { Home, Users, MessageSquare, Mic2, FileText, Calendar, Gamepad2, BarChart2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/dashboard" },
  { label: "Schedule", icon: Calendar, href: "/dashboard/schedule" },
  { label: "Speakers", icon: Mic2, href: "/dashboard/speakers" },
  { label: "Network", icon: Globe, href: "/dashboard/networking" },
  { label: "Chat", icon: MessageSquare, href: "/dashboard/chat" },
  { label: "Games", icon: Gamepad2, href: "/dashboard/games" },
  { label: "Polls", icon: BarChart2, href: "/dashboard/polls" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 glass border-t border-white/20 flex items-center overflow-x-auto no-scrollbar z-50 rounded-t-3xl shadow-2xl lg:hidden">
      <div className="flex gap-2 px-4 items-center min-w-max mx-auto h-full">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/dashboard" 
            ? pathname.endsWith("/dashboard") 
            : pathname.includes(item.href);
          return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center transition-all duration-300",
              isActive ? "text-eventeev-orange scale-110" : "text-eventeev-slate/60 hover:text-eventeev-slate"
            )}
          >
            <item.icon className={cn("w-6 h-6 mb-1", isActive && "stroke-[2.5px]")} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            {isActive && (
              <div className="absolute -bottom-2 w-1.5 h-1.5 bg-eventeev-orange rounded-full" />
            )}
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
