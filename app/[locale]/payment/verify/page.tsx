"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
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
          localStorage.setItem("token", data.token);
          if (data.eventId) {
            localStorage.setItem("eventId", data.eventId);
          }
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
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
            <h2 className="text-2xl font-bold text-eventeev-navy mt-4">Payment Successful!</h2>
            <p className="text-slate-500 font-medium">Your ticket is confirmed. Redirecting to your dashboard...</p>
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
            <h2 className="text-2xl font-bold text-eventeev-navy mt-4">Payment Failed</h2>
            <p className="text-slate-500 font-medium">{errorMessage}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 px-6 py-3 bg-eventeev-navy text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
