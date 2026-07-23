"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Loader2 } from "lucide-react";

// The visual shell is now entirely handled by the global AppLayout (Sidebar & BottomNav)
// This file is kept just as a transparent pass-through for the dashboard route group.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Must run client-side only so localStorage is available
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
          // Token is invalid or expired — clear and go home
          localStorage.removeItem("token");
          localStorage.removeItem("eventId");
          router.push("/");
        }
      } catch (err) {
        console.error("Auth check failed", err);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Show full-screen loader while verifying auth so the user doesn't see a blank screen
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-eventeev-orange" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-full relative">
      {children}
    </div>
  );
}
