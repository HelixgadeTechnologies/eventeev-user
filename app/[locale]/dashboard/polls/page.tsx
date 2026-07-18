"use client";
import { useState, useEffect } from "react";
import { Loader2, BarChart2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PollsPage() {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingPoll, setSubmittingPoll] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [votedPolls, setVotedPolls] = useState<Record<string, boolean>>({});
  
  // Track selected options: { [pollId_questionId]: optionId }
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

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
        
        // Load locally saved voted polls
        const savedVotes = localStorage.getItem("eventeev_voted_polls");
        if (savedVotes) {
          setVotedPolls(JSON.parse(savedVotes));
        }
      } catch (err) {
        console.error("Failed to fetch polls:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolls();
  }, []);

  const handleOptionSelect = (pollId: string, questionId: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [`${pollId}_${questionId}`]: optionId
    }));
  };

  const submitAllVotes = async (poll: any) => {
    try {
      setSubmittingPoll(poll._id);
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
      
      const votePromises = [];
      
      // Submit vote for each question in this poll that has a selected option
      for (const q of poll.questions) {
        const optionId = selectedOptions[`${poll._id}_${q._id}`];
        if (optionId) {
          votePromises.push(
            fetch(`${API_URL}/api/poll/${poll._id}/vote`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { "x-auth-token": token } : {})
              },
              body: JSON.stringify({ questionId: q._id, optionId })
            })
          );
        }
      }

      if (votePromises.length > 0) {
        await Promise.all(votePromises);
        
        // Refetch polls to get updated vote counts
        const updatedPollsRes = await fetch(`${API_URL}/api/poll/event/${localStorage.getItem("eventId")}`, {
          headers: token ? { "x-auth-token": token } : {}
        });
        if (updatedPollsRes.ok) {
           const data = await updatedPollsRes.json();
           if (Array.isArray(data)) setPolls(data);
        }
        setShowSuccessModal(true);
        
        // Record that user voted in this poll
        setVotedPolls(prev => {
          const updated = { ...prev, [poll._id]: true };
          localStorage.setItem("eventeev_voted_polls", JSON.stringify(updated));
          return updated;
        });
        
        // Clear selected options for this poll
        setSelectedOptions(prev => {
          const next = { ...prev };
          poll.questions.forEach((q: any) => {
            delete next[`${poll._id}_${q._id}`];
          });
          return next;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPoll(null);
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
                {votedPolls[poll._id] && (
                  <span className="text-xs font-bold text-eventeev-orange flex items-center gap-1 bg-eventeev-orange/10 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Voted
                  </span>
                )}
              </div>
              
              <h2 className="text-2xl font-black text-eventeev-navy mb-6">{poll.title || poll.name || "Poll"}</h2>

              {poll.questions && poll.questions.map((q: any) => (
                <div key={q._id} className="mb-8 last:mb-0">
                  <h3 className="text-lg font-bold text-eventeev-navy mb-4">{q.text}</h3>
                  <div className="space-y-3">
                    {q.options && q.options.map((opt: any) => {
                      const totalVotes = q.options.reduce((sum: number, o: any) => sum + (o.votesCount || 0), 0);
                      const percent = totalVotes === 0 ? 0 : Math.round(((opt.votesCount || 0) / totalVotes) * 100);
                      const isSelected = selectedOptions[`${poll._id}_${q._id}`] === opt._id;
                      const hasVoted = votedPolls[poll._id];
                      
                      return (
                        <button
                          key={opt._id}
                          disabled={poll.status !== "LIVE" || submittingPoll === poll._id || hasVoted}
                          onClick={() => handleOptionSelect(poll._id, q._id, opt._id)}
                          className={cn(
                            "w-full relative bg-slate-50 border rounded-2xl p-4 text-left overflow-hidden transition-colors",
                            isSelected && !hasVoted ? "border-eventeev-orange shadow-md" : "border-slate-100",
                            !hasVoted && "hover:border-eventeev-orange/50",
                            hasVoted && "cursor-default"
                          )}
                        >
                          {(hasVoted || poll.status !== "LIVE") && (
                            <div 
                              className="absolute inset-y-0 left-0 bg-eventeev-orange/10 transition-all duration-1000"
                              style={{ width: `${percent}%` }}
                            />
                          )}
                          <div className="relative z-10 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              {!hasVoted && poll.status === "LIVE" && (
                                <div className={cn(
                                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                  isSelected ? "border-eventeev-orange" : "border-slate-300"
                                )}>
                                  {isSelected && <div className="w-2.5 h-2.5 bg-eventeev-orange rounded-full" />}
                                </div>
                              )}
                              <span className="font-bold text-eventeev-navy">{opt.text}</span>
                            </div>
                            {(hasVoted || poll.status !== "LIVE") && (
                              <span className="text-sm font-black text-eventeev-orange flex items-center gap-2">
                                {percent}%
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">({opt.votesCount || 0} votes)</span>
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {!votedPolls[poll._id] ? (
                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => submitAllVotes(poll)}
                    disabled={poll.status !== "LIVE" || submittingPoll === poll._id || !poll.questions?.some((q: any) => selectedOptions[`${poll._id}_${q._id}`])}
                    className="px-8 py-3.5 bg-eventeev-navy hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-2xl transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2"
                  >
                    {submittingPoll === poll._id ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Poll"}
                  </button>
                </div>
              ) : (
                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
                  <p className="text-sm font-bold text-slate-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> You've already voted in this poll
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center premium-shadow border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-eventeev-navy mb-2">Vote Submitted!</h3>
            <p className="text-slate-500 font-medium mb-8">
              Your response has been successfully recorded. Thank you for participating!
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-eventeev-navy font-black rounded-2xl transition-colors"
              >
                Vote on Another Question
              </button>
              <button
                onClick={() => window.location.href = "/dashboard"}
                className="w-full py-4 bg-eventeev-navy hover:bg-slate-800 text-white font-black rounded-2xl transition-all shadow-lg shadow-slate-900/10"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
