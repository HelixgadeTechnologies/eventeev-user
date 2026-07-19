"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";

// The visual shell is now entirely handled by the global AppLayout (Sidebar & BottomNav)
// This file is kept just as a transparent pass-through for the dashboard route group.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const eventId = localStorage.getItem("eventId");
    if (!token || !eventId) {
      router.push("/");
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await fetch("/api/attendee/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.user || !data.user.email) {
            router.push("/");
          } else {
            setIsAuthenticated(true);
          }
        } else {
          router.push("/");
        }
      } catch (err) {
        console.error("Auth check failed", err);
        router.push("/");
      }
    };

    checkAuth();
  }, [router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-full relative">
      {children}
    </div>
  );
}
