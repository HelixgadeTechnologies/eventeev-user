"use client";
import { useState, useEffect } from "react";
import { Loader2, BarChart2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PollsPage() {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingOn, setVotingOn] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const eventId = localStorage.getItem("eventId");
        const token = localStorage.getItem("token");
        if (!eventId) return;

        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
        const res = await fetch(`${API_URL}/api/poll/event/${eventId}`, {
          headers: token ? { "x-auth-token": token } : {}
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setPolls(data);
        }
      } catch (err) {
        console.error("Failed to fetch polls:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolls();
  }, []);

  const handleVote = async (pollId: string, questionId: string, optionId: string) => {
    try {
      setVotingOn(pollId);
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
      
      const res = await fetch(`${API_URL}/api/poll/${pollId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-auth-token": token } : {})
        },
        body: JSON.stringify({ questionId, optionId })
      });

      if (res.ok) {
        // Optimistically update poll data or just refetch
        const updatedPollsRes = await fetch(`${API_URL}/api/poll/event/${localStorage.getItem("eventId")}`, {
          headers: token ? { "x-auth-token": token } : {}
        });
        if (updatedPollsRes.ok) {
           const data = await updatedPollsRes.json();
           if (Array.isArray(data)) setPolls(data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVotingOn(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-10 h-10 animate-spin text-eventeev-orange" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
          <BarChart2 className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-eventeev-navy">Live Polls</h1>
          <p className="text-sm font-medium text-slate-500">Have your say in real-time</p>
        </div>
      </div>

      {polls.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl premium-shadow border border-slate-100 text-center">
          <BarChart2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-eventeev-navy mb-2">No Polls Active</h3>
          <p className="text-slate-500 font-medium">There are currently no polls running for this event.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {polls.map((poll, i) => (
            <div key={poll._id || i} className="bg-white p-6 md:p-8 rounded-3xl premium-shadow border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                  poll.status === "LIVE" ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"
                )}>
                  {poll.status === "LIVE" ? "Live Now" : "Ended"}
                </span>
              </div>
              
              <h2 className="text-2xl font-black text-eventeev-navy mb-6">{poll.title || poll.name || "Poll"}</h2>

              {poll.questions && poll.questions.map((q: any) => (
                <div key={q._id} className="mb-8 last:mb-0">
                  <h3 className="text-lg font-bold text-eventeev-navy mb-4">{q.text}</h3>
                  <div className="space-y-3">
                    {q.options && q.options.map((opt: any) => {
                      const totalVotes = q.options.reduce((sum: number, o: any) => sum + (o.votesCount || 0), 0);
                      const percent = totalVotes === 0 ? 0 : Math.round(((opt.votesCount || 0) / totalVotes) * 100);
                      
                      return (
                        <button
                          key={opt._id}
                          disabled={poll.status !== "LIVE" || votingOn === poll._id}
                          onClick={() => handleVote(poll._id, q._id, opt._id)}
                          className="w-full relative bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left overflow-hidden group hover:border-eventeev-orange transition-colors disabled:hover:border-slate-100"
                        >
                          <div 
                            className="absolute inset-y-0 left-0 bg-eventeev-orange/10 transition-all duration-1000"
                            style={{ width: `${percent}%` }}
                          />
                          <div className="relative z-10 flex justify-between items-center">
                            <span className="font-bold text-eventeev-navy">{opt.text}</span>
                            <span className="text-sm font-black text-eventeev-orange">{percent}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
