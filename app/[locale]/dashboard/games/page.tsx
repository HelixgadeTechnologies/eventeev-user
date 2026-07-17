"use client";
import { useState } from "react";
import { Loader2, Gamepad2, Zap, ArrowRight } from "lucide-react";

export default function GamesPage() {
  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || !nickname) return;
    
    setLoading(true);
    setError("");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
      const res = await fetch(`${API_URL}/api/game/quiz/session/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, nickname })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSessionData(data);
      } else {
        setError(data.message || "Failed to join game");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
          <Gamepad2 className="w-6 h-6 text-eventeev-orange" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-eventeev-navy">Games Hub</h1>
          <p className="text-sm font-medium text-slate-500">Play live trivia and win points</p>
        </div>
      </div>

      {!sessionData ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white p-8 md:p-12 rounded-3xl premium-shadow border border-slate-100 max-w-md w-full">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-eventeev-orange" />
            </div>
            <h2 className="text-2xl font-black text-eventeev-navy text-center mb-2">Join a Live Game</h2>
            <p className="text-slate-500 font-medium text-center text-sm mb-8">
              Enter the Game PIN provided by the organizer on the main screen to jump in!
            </p>

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Game PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.toUpperCase())}
                  className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 focus:outline-none focus:border-eventeev-orange transition-colors font-black text-center text-xl text-eventeev-navy placeholder:text-slate-300 tracking-widest"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Your Nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 focus:outline-none focus:border-eventeev-orange transition-colors font-bold text-center text-eventeev-navy placeholder:text-slate-400"
                />
              </div>

              {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

              <button
                type="submit"
                disabled={!pin || !nickname || loading}
                className="w-full h-14 bg-eventeev-navy hover:bg-slate-800 disabled:opacity-50 text-white font-black text-lg rounded-2xl transition-all shadow-xl shadow-slate-900/10 mt-4 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enter Game"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center bg-white p-12 rounded-3xl premium-shadow border border-slate-100 max-w-lg w-full">
            <h2 className="text-4xl font-black text-eventeev-navy mb-4">You're in!</h2>
            <p className="text-lg font-bold text-slate-500 mb-8">
              Look at the main screen. The game will start shortly!
            </p>
            <div className="inline-block bg-slate-100 px-6 py-3 rounded-xl font-bold text-eventeev-navy">
              Nickname: <span className="text-eventeev-orange">{nickname}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
