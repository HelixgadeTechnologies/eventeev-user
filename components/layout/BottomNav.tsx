"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageSquare, Mic2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/dashboard" },
  { label: "Network", icon: Users, href: "/networking" },
  { label: "Chat", icon: MessageSquare, href: "/chat" },
  { label: "Speakers", icon: Mic2, href: "/speakers" },
  { label: "Resources", icon: FileText, href: "/resources" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-20 glass border-t border-white/20 px-6 flex items-center justify-between z-50 rounded-t-3xl shadow-2xl">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
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
    </nav>
  );
}
