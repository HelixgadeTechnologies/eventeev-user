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
  Globe,
  LogOut,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("/api/attendee/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("eventId");
    window.location.href = "/";
  };

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
        
        {/* Desktop Profile Section */}
        {user && (
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-eventeev-orange/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-eventeev-orange" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-eventeev-navy truncate">{user.name}</p>
                <p className="text-xs font-medium text-slate-500 truncate">{user.email}</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 sticky top-0 z-40">
          <h2 className="text-xl font-black text-eventeev-navy">Eventeev</h2>
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-eventeev-navy">{user.name}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-eventeev-orange/10 flex items-center justify-center overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-eventeev-orange" />
                )}
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 p-1">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 relative">
          {children}
        </div>
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
