"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";

export default function NetworkingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/networking");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-eventeev-orange border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
