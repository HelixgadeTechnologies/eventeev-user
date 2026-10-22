"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, ArrowRight, ShieldCheck, Mail, User, Calendar, MapPin, X, FileText, Ticket, LogIn, Sparkles, LogOut, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function JoinPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [authMode, setAuthMode] = useState<"join" | "signin">("join");
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Returning attendee state
  const [existingSession, setExistingSession] = useState<{ user: any; event?: any; ticket?: any } | null>(null);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginEventCode, setLoginEventCode] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  
  const router = useRouter();

  // On mount: check if attendee already has an active session
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedEventId = localStorage.getItem("eventId");
        if (!token) return;

        const res = await fetch("/api/attendee/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const user = data.user || data.attendee;
          if (user && (user.email || user.name)) {
            let eventInfo = null;
            if (storedEventId) {
              try {
                const evRes = await fetch(`/api/event/public/${storedEventId}`);
                if (evRes.ok) {
                  const evData = await evRes.json();
                  eventInfo = evData.event || (evData._id ? evData : null);
                }
              } catch (e) {}
            }
            setExistingSession({ user, event: eventInfo, ticket: data.ticket || null });
          }
        }
      } catch (e) {
        console.warn("Could not verify active session:", e);
      }
    };

    checkActiveSession();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = loginIdentifier.trim();
    if (!cleanId) return;

    setLoginLoading(true);
    try {
      const isEmail = cleanId.includes("@");
      const payload: any = {};
      if (isEmail) {
        payload.email = cleanId;
      } else {
        payload.orderId = cleanId;
      }

      const cleanEvCode = (loginEventCode || code).trim();
      if (cleanEvCode) {
        payload.eventId = cleanEvCode;
      }

      const res = await fetch("/api/attendee/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        localStorage.setItem("token", data.token);
        if (data.eventId) {
          localStorage.setItem("eventId", data.eventId);
        }

        router.push(
          `/auth/handoff?token=${encodeURIComponent(data.token)}&eventId=${encodeURIComponent(
            data.eventId || ""
          )}&orderId=${encodeURIComponent(data.ticket?.orderId || "")}&welcome=true`
        );
      } else {
        setError(
          data.error ||
            "No active ticket or attendee registration found with that email or reference. Please double-check your code or register for the event."
        );
      }
    } catch (err) {
      console.error("Login submission error:", err);
      setError("Failed to sign in. Please check your internet connection and try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 5) return;
    
    setLoadingEvent(true);
    try {
      const response = await fetch(`/api/event/public/${code}`);
      const data = await response.json();
      
      // The local API returns { event: {...} }, but the live backend returns the event object directly (with _id)
      const eventData = data.event || (data._id ? data : null);
      
      if (response.ok && eventData) {
        setEventDetails(eventData);

        // If the user already has a token in localStorage, check if they are already in the database for this event
        const existingToken = localStorage.getItem("token");
        if (existingToken) {
          try {
            const meRes = await fetch("/api/attendee/me", {
              headers: { Authorization: `Bearer ${existingToken}` },
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              const userEmail = meData?.user?.email;
              if (userEmail) {
                const actualEvId = eventData._id || eventData.id || code;
                const checkRes = await fetch(
                  `/api/attendee/check-event?email=${encodeURIComponent(userEmail)}&eventId=${encodeURIComponent(actualEvId)}`
                );
                if (checkRes.ok) {
                  const checkData = await checkRes.json();
                  if (checkData.isAttendee) {
                    if (checkData.token) localStorage.setItem("token", checkData.token);
                    localStorage.setItem("eventId", checkData.eventId || actualEvId);
                    router.push("/dashboard");
                    return;
                  }
                }
              }
            }
          } catch (e) {
            // Proceed to Step 2 normally
          }
        }

        setStep(2);
      } else {
        setError(data.message || data.error || "Event not found. Please check the ID.");
      }
    } catch (err) {
      console.error("Error fetching event:", err);
      setError("Failed to verify event. Please try again.");
    } finally {
      setLoadingEvent(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;
    
    setLoading(true);
    try {
      const actualEventId = eventDetails?._id || eventDetails?.id || code;

      // Check if this attendee's info is already in the database
      const checkRes = await fetch(
        `/api/attendee/check-event?email=${encodeURIComponent(email)}&eventId=${encodeURIComponent(actualEventId)}&name=${encodeURIComponent(fullName)}`
      );
      const checkData = await checkRes.json().catch(() => ({}));

      if (checkRes.ok && checkData.isAttendee) {
        // User info already in database — skip ticket selection and enter dashboard directly
        if (checkData.token) localStorage.setItem("token", checkData.token);
        localStorage.setItem("eventId", checkData.eventId || actualEventId);
        router.push("/dashboard");
        return;
      }

      // Step 1: Authenticate / create attendee record for new users
      const authResponse = await fetch("/api/attendee/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, email }),
      });
      const authData = await authResponse.json();
      if (authResponse.ok && authData.token) {
        localStorage.setItem("token", authData.token);
      } else {
        setError(authData.error || "Failed to authenticate. Please try again.");
        setLoading(false);
        return;
      }


      // Step 3: Not yet registered — fetch available ticket tiers
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://eventeevapi.onrender.com';
      
      let fetchedTickets: any[] = [];
      try {
        const response = await fetch(`${baseUrl}/api/ticket/event/${actualEventId}`);
        if (response.ok) {
          const data = await response.json();
          fetchedTickets = Array.isArray(data) ? data : [];
        }
      } catch (e) {
        console.warn("Could not fetch tickets from backend API, building from event details.");
      }

      const uniqueTickets: any[] = [];
      const seen = new Set();
      for (const t of fetchedTickets) {
        const ticketName = t.name || t.tier || t.title || 'General Admission';
        const ticketPrice = t.price ?? t.amount ?? (eventDetails?.isPaid ? (eventDetails?.price || 5000) : 0);
        const key = `${ticketName}-${t.type || 'Standard'}-${ticketPrice}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueTickets.push({ ...t, name: ticketName, price: ticketPrice, type: t.type || (ticketPrice > 0 ? 'Paid' : 'Free') });
        }
      }

      if (uniqueTickets.length === 0) {
        const defaultPrice = eventDetails?.isPaid ? (eventDetails?.price || 5000) : (eventDetails?.price || 0);
        uniqueTickets.push({
          id: 'default_tier_1',
          name: defaultPrice > 0 ? 'Standard Ticket' : 'Free Admission',
          price: defaultPrice,
          type: defaultPrice > 0 ? 'Paid' : 'Free'
        });
      }

      setTickets(uniqueTickets);
      setSelectedTicket(uniqueTickets[0]);
      setStep(3);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError("Failed to fetch tickets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    
    setLoading(true);
    try {
      const eventId = eventDetails?._id || eventDetails?.id || code;
      const ticketPrice = selectedTicket.price ?? selectedTicket.amount ?? (eventDetails?.isPaid ? (eventDetails?.price || 0) : 0);
      const ticketTierName = selectedTicket.name || selectedTicket.tier || selectedTicket.title || "General Admission";
      
      if (ticketPrice > 0) {
        const ticketId = selectedTicket._id || selectedTicket.id;
        // Paid Ticket Flow
        const response = await fetch(`/api/payment/initialize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            eventId, 
            name: fullName, 
            email, 
            ticketId,
            ticketTier: ticketTierName,
            amount: ticketPrice
          }),
        });
        
        const data = await response.json().catch(() => ({}));
        
        if (response.ok && data.authorization_url) {
          window.location.href = data.authorization_url;
        } else {
          setError(data.message || data.error || data.details?.message || "Failed to initialize payment.");
          setLoading(false);
        }
      } else {
        // Free Ticket Flow
        const ticketId = selectedTicket._id || selectedTicket.id;
        const response = await fetch(`/api/attendee/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email, 
            name: fullName, 
            eventId,
            ticketId,
            ticketTier: ticketTierName 
          }),
        });
        
        const data = await response.json().catch(() => ({}));
        const token = data.token || localStorage.getItem("token");
        
        if (response.ok && (data.token || data.attendee || token)) {
          if (token) localStorage.setItem("token", token);
          const finalEvId = data.eventId || eventId;
          localStorage.setItem("eventId", finalEvId);
          router.push(
            `/auth/handoff?token=${encodeURIComponent(token || "")}&eventId=${encodeURIComponent(
              finalEvId
            )}&welcome=true`
          );
        } else {
          console.error("Failed to register:", data);
          setError(data.message || data.error || "Failed to register. Please try again.");
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Error during checkout:", err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm mb-24"
      >
        <div className="mb-8">
          <div className="flex items-center justify-center mx-auto mb-6">
            <Image src="/icons/eventeev-logo.png" alt="Eventeev Logo" width={200} height={60} className="object-contain" priority style={{ width: 'auto', height: 'auto' }} />
          </div>
          <p className="text-eventeev-slate text-base sm:text-lg font-medium">
            {step === 1 && (authMode === "join" ? "Enter your Event ID to join the ecosystem." : "Sign in to access your digital pass & progress.")}
            {step === 2 && "Provide your details to continue."}
            {step === 3 && "Select a ticket to complete your registration."}
          </p>
        </div>

        {/* Existing Session Auto-Resume Banner */}
        {step === 1 && existingSession && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-5 rounded-3xl bg-gradient-to-br from-orange-50 via-white to-amber-50 border-2 border-orange-200/90 shadow-lg shadow-orange-500/10 text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 w-20 h-20 bg-orange-400/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-eventeev-orange to-orange-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-orange-500/30 flex-shrink-0">
                {existingSession.user?.name ? existingSession.user.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-eventeev-orange">
                    Active Pass Detected
                  </span>
                </div>
                <h4 className="text-base font-black text-eventeev-navy truncate leading-tight">
                  {existingSession.user?.name || "Welcome Back!"}
                </h4>
                <p className="text-xs text-slate-500 font-medium truncate">
                  {existingSession.user?.email}
                </p>
              </div>
            </div>

            {existingSession.event && (
              <div className="mb-4 px-3 py-2 bg-white/90 rounded-xl border border-orange-100 flex items-center gap-2 text-xs text-slate-700 font-semibold shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-eventeev-orange flex-shrink-0" />
                <span className="truncate">{existingSession.event.title || "Your Event"}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="flex-1 py-3 px-4 bg-eventeev-orange hover:bg-orange-600 active:scale-[0.98] text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                <span>Resume Journey</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("eventId");
                  setExistingSession(null);
                }}
                className="py-3 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="Switch Account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 1 Mode Toggle */}
        {step === 1 && (
          <div className="mb-6 p-1 bg-slate-100 rounded-2xl flex items-center gap-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setAuthMode("join");
                setError(null);
              }}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer",
                authMode === "join"
                  ? "bg-white text-eventeev-navy shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Join / Register
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("signin");
                setError(null);
              }}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5",
                authMode === "signin"
                  ? "bg-white text-eventeev-orange shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Ticket className="w-3.5 h-3.5" />
              Already Have a Ticket?
            </button>
          </div>
        )}

        <div className="relative min-h-[200px]">
          <AnimatePresence mode="wait">
            {step === 1 && authMode === "join" && (
              <motion.form
                key="step1-join"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleNextStep}
                className="space-y-6 w-full"
              >
                <div className="relative group">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="EVENT ID (e.g. 60d5ec...)"
                    className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xl font-bold tracking-widest text-eventeev-navy focus:border-eventeev-orange focus:bg-white focus:outline-none transition-all duration-300 placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={code.length < 5 || loadingEvent}
                  className={cn(
                    "w-full h-16 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-xl",
                    code.length >= 5 && !loadingEvent
                      ? "bg-eventeev-orange text-white hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {loadingEvent ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {step === 1 && authMode === "signin" && (
              <motion.form
                key="step1-signin"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4 w-full text-left"
              >
                <div className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="Email or Ticket Ref (ORD-XXXXXX)"
                      className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-100 rounded-xl text-base font-semibold text-eventeev-navy focus:border-eventeev-orange focus:bg-white focus:outline-none transition-all duration-300 placeholder:text-slate-300 placeholder:font-normal"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={loginEventCode}
                      onChange={(e) => setLoginEventCode(e.target.value)}
                      placeholder="Event ID or Slug (Optional)"
                      className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-semibold text-eventeev-navy focus:border-eventeev-orange focus:bg-white focus:outline-none transition-all duration-300 placeholder:text-slate-300 placeholder:font-normal"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-medium px-1 leading-relaxed">
                  Enter the email address you used to register or your 6-character order code from your receipt.
                </p>

                <button
                  type="submit"
                  disabled={!loginIdentifier.trim() || loginLoading}
                  className={cn(
                    "w-full h-16 mt-2 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-xl",
                    loginIdentifier.trim() && !loginLoading
                      ? "bg-eventeev-orange text-white hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {loginLoading ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In & Access Pass
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleJoin}
                className="space-y-4 w-full"
              >
                {eventDetails && (
                  <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden mb-6 shadow-sm text-left">
                    {/* Banner Image */}
                    <div className="relative h-32 w-full bg-slate-50">
                      {(eventDetails.thumbnailImage || eventDetails.bannerImage || eventDetails.bannerUrl) ? (
                        <img 
                          src={eventDetails.thumbnailImage || eventDetails.bannerImage || eventDetails.bannerUrl} 
                          alt={eventDetails.title} 
                          className="absolute inset-0 w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-slate-300" />
                          </div>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-eventeev-navy shadow-sm">
                        Joining Event
                      </div>
                    </div>
                    
                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-eventeev-navy leading-tight">{eventDetails.title}</h3>
                        {eventDetails.description && (
                          <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                            {eventDetails.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                          <div className="mt-0.5 w-5 flex justify-center"><Calendar className="w-4 h-4 text-eventeev-orange" /></div>
                          <div>
                            {eventDetails.startDate ? new Date(eventDetails.startDate).toLocaleDateString() : new Date(eventDetails.date).toLocaleDateString()}
                            {eventDetails.endDate && eventDetails.endDate !== eventDetails.startDate ? ` - ${new Date(eventDetails.endDate).toLocaleDateString()}` : ''}
                          </div>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                          <div className="mt-0.5 w-5 flex justify-center"><MapPin className="w-4 h-4 text-eventeev-orange" /></div>
                          <span className="line-clamp-2">{eventDetails.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-100 rounded-xl text-lg font-medium text-eventeev-navy focus:border-eventeev-orange focus:bg-white focus:outline-none transition-all duration-300 placeholder:text-slate-300"
                    required
                  />
                </div>
                
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-100 rounded-xl text-lg font-medium text-eventeev-navy focus:border-eventeev-orange focus:bg-white focus:outline-none transition-all duration-300 placeholder:text-slate-300"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!fullName || !email || loading}
                  className={cn(
                    "w-full h-16 mt-2 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-xl",
                    fullName && email && !loading
                      ? "bg-eventeev-orange text-white hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Join Event
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="text-slate-400 font-medium text-sm hover:text-slate-600 transition-colors"
                >
                  Back to Event ID
                </button>
              </motion.form>
            )}

            {step === 3 && (
              <motion.form
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleCheckout}
                className="space-y-4 w-full"
              >
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 pb-2 no-scrollbar">
                  {tickets.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
                      <p className="text-slate-500 font-medium">No tickets available.</p>
                    </div>
                  ) : (
                    tickets.filter((t: any) => !t.soldOut).map((ticket: any) => {
                      const isSelected = selectedTicket && ((selectedTicket.id && selectedTicket.id === (ticket.id || ticket._id)) || (selectedTicket._id && selectedTicket._id === (ticket.id || ticket._id)));
                      return (
                        <div 
                          key={ticket.id || ticket._id} 
                          onClick={() => setSelectedTicket(ticket)}
                          className={cn(
                            "cursor-pointer p-4 rounded-xl border-2 transition-all text-left flex justify-between items-center group",
                            isSelected 
                              ? "border-eventeev-orange bg-orange-50 shadow-sm" 
                              : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                          )}
                        >
                          <div>
                            <h4 className={cn("font-bold", isSelected ? "text-eventeev-orange" : "text-eventeev-navy")}>{ticket.name}</h4>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{ticket.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-lg text-eventeev-navy">
                              {ticket.price > 0 ? `₦${ticket.price}` : 'FREE'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!selectedTicket || loading}
                  className={cn(
                    "w-full h-16 mt-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-xl",
                    selectedTicket && !loading
                      ? "bg-eventeev-orange text-white hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {selectedTicket?.price > 0 ? 'Proceed to Payment' : 'Complete Registration'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="text-slate-400 font-medium text-sm hover:text-slate-600 transition-colors mt-2"
                >
                  Back to Details
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {step === 1 && (
          <>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-slate-100" />
              <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">or scan</span>
              <div className="h-[1px] flex-1 bg-slate-100" />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowQrModal(true)}
              className="mt-8 flex items-center gap-3 mx-auto px-6 py-3 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md transition-all text-slate-600 font-bold cursor-pointer"
            >
              <QrCode className="w-5 h-5 text-eventeev-orange" />
              Scan QR Code
            </motion.button>
          </>
        )}
      </motion.div>

      <div className="absolute bottom-12 left-0 right-0 px-8">
        <p className="text-slate-400 text-xs font-medium">
          By joining, you agree to our{" "}
          <button 
            onClick={() => setShowTermsModal(true)} 
            className="text-slate-600 underline font-bold hover:text-eventeev-orange transition-colors cursor-pointer"
          >
            Terms of Service
          </button>.
        </p>
      </div>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center relative"
            >
              <button 
                onClick={() => setShowQrModal(false)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-eventeev-orange mx-auto flex items-center justify-center mb-4">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-eventeev-navy mb-2">QR Scanner</h3>
              <p className="text-slate-500 text-sm mb-6 font-medium">
                Point your camera at the event badge or QR poster, or enter your code below.
              </p>
              <div className="w-full h-40 bg-slate-900 rounded-2xl flex items-center justify-center text-white/50 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 border-2 border-eventeev-orange border-dashed m-4 rounded-xl animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Camera Viewfinder</span>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-3.5 bg-eventeev-navy text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
              >
                Close Scanner
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terms of Service Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 text-left relative max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-eventeev-orange" />
                  <h3 className="text-xl font-bold text-eventeev-navy">Terms of Service</h3>
                </div>
                <button 
                  onClick={() => setShowTermsModal(false)} 
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 text-sm text-slate-600 font-medium pr-2">
                <p>Welcome to Eventeev! By registering for and using our platform at events, you agree to the following terms:</p>
                <h4 className="font-bold text-eventeev-navy">1. Acceptable Use</h4>
                <p>Attendees must use Eventeev responsibly. Harassment, unauthorized promotional content, or misuse of networking features is strictly prohibited.</p>
                <h4 className="font-bold text-eventeev-navy">2. Privacy & Data</h4>
                <p>Your profile information is shared only with event organizers and connection requests you explicitly accept within the Networking Hub.</p>
                <h4 className="font-bold text-eventeev-navy">3. Event Tickets</h4>
                <p>Tickets are non-transferable unless permitted by the event organizer. All digital tickets are stored securely under your account.</p>
              </div>
              <div className="pt-4 border-t border-slate-100 mt-4">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="w-full py-3.5 bg-eventeev-orange text-white rounded-2xl font-bold hover:bg-orange-600 transition-colors"
                >
                  I Understand & Agree
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Error Modal */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-6">
                  <ShieldCheck className="w-8 h-8 opacity-0 hidden" />
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-eventeev-navy mb-3">Oops!</h3>
                <p className="text-slate-500 mb-8 font-medium leading-relaxed">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="w-full h-14 bg-eventeev-navy text-white rounded-2xl font-bold text-lg hover:bg-slate-800 active:scale-[0.98] transition-all duration-300 shadow-xl shadow-slate-900/10"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
