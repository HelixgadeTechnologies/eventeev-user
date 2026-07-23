"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setErrorMessage("No payment reference found.");
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch(`/api/payment/verify?reference=${reference}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          if (data.token) {
            localStorage.setItem("token", data.token);
          }
          if (data.eventId) {
            localStorage.setItem("eventId", data.eventId.toString());
          }
          
          // Auto redirect to event dashboard after short delay
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Payment verification failed.");
        }
      } catch (error) {
        setStatus("error");
        setErrorMessage("An unexpected error occurred during verification.");
      }
    };

    verifyPayment();
  }, [reference, router]);

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-slate-50 border border-slate-100 rounded-3xl p-8 shadow-xl"
      >
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 animate-spin text-eventeev-orange" />
            <h2 className="text-xl font-bold text-eventeev-navy mt-4">Verifying Payment...</h2>
            <p className="text-slate-500 font-medium text-sm">Please wait while we confirm your ticket.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle2 className="w-20 h-20 text-green-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-eventeev-navy mt-2">Payment Successful!</h2>
            <p className="text-slate-500 font-medium text-sm">Your ticket is confirmed! Redirecting to your event dashboard...</p>
            
            <button
              onClick={handleGoToDashboard}
              className="mt-6 w-full py-4 bg-eventeev-orange hover:bg-orange-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
            >
              Go to Event Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <XCircle className="w-20 h-20 text-red-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-eventeev-navy mt-4">Payment Verification Issue</h2>
            <p className="text-slate-500 font-medium text-sm">{errorMessage}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 px-6 py-3.5 bg-eventeev-navy text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors w-full"
            >
              Back to Home
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
