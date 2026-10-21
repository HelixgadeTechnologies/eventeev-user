"use client";

import { useState, useEffect } from "react";
import { Loader2, Gamepad2, Zap, Sparkles } from "lucide-react";
import { useQuizSocket } from "@/hooks/useQuizSocket";
import { KahootOptionGrid } from "@/components/games/KahootOptionGrid";
import { KahootQuestionHeader } from "@/components/games/KahootQuestionHeader";
import { KahootWaitingLobby } from "@/components/games/KahootWaitingLobby";
import { KahootAnswerLocked } from "@/components/games/KahootAnswerLocked";
import { KahootResultOverlay } from "@/components/games/KahootResultOverlay";
import { KahootPodium } from "@/components/games/KahootPodium";
import { motion, AnimatePresence } from "framer-motion";

export default function GamesPage() {
  const [inputPin, setInputPin] = useState("");
  const [inputNickname, setInputNickname] = useState("");
  const [loadingUser, setLoadingUser] = useState(false);

  const {
    gameState,
    pin,
    nickname,
    currentQuestion,
    roundResult,
    gameOverData,
    selectedOptionIndex,
    totalScore,
    streak,
    timeLeft,
    error,
    isSandbox,
    joinGame,
    submitAnswer,
    leaveGame,
    startSandboxDemo
  } = useQuizSocket();

  // Auto-scroll to top whenever a new question is activated on mobile
  useEffect(() => {
    if (gameState === "question_active") {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [gameState, currentQuestion?.questionIndex]);

  // Prefill nickname from attendee profile if available
  useEffect(() => {
    const fetchAttendee = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        setLoadingUser(true);
        const res = await fetch("/api/attendee/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const name = data.user?.name || data.name;
          if (name) {
            setInputNickname((prev) => prev || name);
          }
        }
      } catch {
        // Silently continue
      } finally {
        setLoadingUser(false);
      }
    };

    fetchAttendee();
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPin.trim() || !inputNickname.trim()) return;
    await joinGame(inputPin.trim(), inputNickname.trim());
  };

  return (
    <div className="p-3 sm:p-4 md:p-8 pb-24 lg:pb-8 max-w-4xl mx-auto h-full min-h-[calc(100vh-80px)] flex flex-col justify-between">
      {/* Header (only shown during idle state) */}
      {gameState === "idle" && (
        <div className="flex items-center gap-3 mb-5 md:mb-8 pt-2">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shadow-xs">
            <Gamepad2 className="w-6 h-6 text-eventeev-orange" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-eventeev-navy">Games Hub</h1>
            <p className="text-xs md:text-sm font-medium text-slate-500">
              Live trivia, rapid-fire questions, and attendee leaderboards
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area based on Game State */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* STATE 1: PIN & Nickname Entry */}
          {gameState === "idle" && (
            <motion.div
              key="pin_entry"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="flex-1 flex items-center justify-center py-4"
            >
              <div className="bg-white p-6 sm:p-8 md:p-10 rounded-3xl premium-shadow border border-slate-100 max-w-md w-full relative overflow-hidden">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xs">
                  <Zap className="w-8 h-8 text-eventeev-orange" />
                </div>
                <h2 className="text-2xl font-black text-eventeev-navy text-center mb-1">
                  Join a Live Game
                </h2>
                <p className="text-slate-500 font-medium text-center text-xs md:text-sm mb-6">
                  Enter the Game PIN displayed on the main event stage to participate!
                </p>

                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1.5 ml-1">
                      Game PIN
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 549821"
                      value={inputPin}
                      onChange={(e) => setInputPin(e.target.value.toUpperCase())}
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 focus:outline-none focus:border-eventeev-orange focus:ring-2 focus:ring-orange-100 transition-all font-black text-center text-xl text-eventeev-navy placeholder:text-slate-300 tracking-widest uppercase font-mono"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1.5 ml-1">
                      Your Nickname
                    </label>
                    <input
                      type="text"
                      placeholder={loadingUser ? "Loading name..." : "Enter your player name"}
                      value={inputNickname}
                      onChange={(e) => setInputNickname(e.target.value)}
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 focus:outline-none focus:border-eventeev-orange focus:ring-2 focus:ring-orange-100 transition-all font-bold text-center text-eventeev-navy placeholder:text-slate-400"
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-xl"
                    >
                      <p className="text-red-600 text-xs font-bold text-center leading-tight">
                        {error}
                      </p>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={!inputPin.trim() || !inputNickname.trim()}
                    className="w-full h-14 bg-eventeev-navy hover:bg-slate-800 disabled:opacity-40 text-white font-black text-base md:text-lg rounded-2xl transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Enter Game
                  </button>
                </form>

                {/* Instant Sandbox Preview Option */}
                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-400 font-medium mb-3">
                    Want to test the Kahoot controller right now?
                  </p>
                  <button
                    type="button"
                    onClick={startSandboxDemo}
                    className="inline-flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-eventeev-orange border border-orange-200/80 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Try Kahoot Demo (3 Questions)
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 2: Joining in Flight */}
          {gameState === "joining" && (
            <motion.div
              key="joining"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8"
            >
              <Loader2 className="w-10 h-10 animate-spin text-eventeev-orange" />
              <p className="text-lg font-black text-eventeev-navy">Connecting to game session...</p>
            </motion.div>
          )}

          {/* STATE 3: In Lobby Waiting for Host */}
          {gameState === "lobby" && (
            <KahootWaitingLobby
              key="lobby"
              pin={pin}
              nickname={nickname}
              onLeave={leaveGame}
              onStartDemo={startSandboxDemo}
              isSandbox={isSandbox}
            />
          )}

          {/* STATE 4: Active Question Playing (Kahoot 2x2 Grid) */}
          {gameState === "question_active" && currentQuestion && (
            <motion.div
              key={`question_${currentQuestion.questionIndex}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex-1 flex flex-col w-full h-full"
            >
              <KahootQuestionHeader
                questionNumber={currentQuestion.questionIndex + 1}
                totalQuestions={currentQuestion.totalQuestions}
                questionText={currentQuestion.question}
                timeLeft={timeLeft}
                maxTime={currentQuestion.timeLimitSeconds}
                score={totalScore}
                streak={streak}
                onExit={leaveGame}
              />

              <KahootOptionGrid
                options={currentQuestion.options}
                selectedOptionIndex={selectedOptionIndex}
                onSelectOption={submitAnswer}
              />
            </motion.div>
          )}

          {/* STATE 5: Answer Submitted / Locked In */}
          {gameState === "answer_locked" && (
            <motion.div
              key="answer_locked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col w-full h-full"
            >
              <KahootQuestionHeader
                questionNumber={(currentQuestion?.questionIndex ?? 0) + 1}
                totalQuestions={currentQuestion?.totalQuestions ?? 3}
                questionText={currentQuestion?.question ?? "Question in progress"}
                timeLeft={timeLeft}
                maxTime={currentQuestion?.timeLimitSeconds ?? 15}
                score={totalScore}
                streak={streak}
                onExit={leaveGame}
              />

              <KahootAnswerLocked
                selectedOptionIndex={selectedOptionIndex ?? 0}
                optionText={
                  selectedOptionIndex !== null && currentQuestion?.options
                    ? currentQuestion.options[selectedOptionIndex]
                    : undefined
                }
                timeLeft={timeLeft}
              />
            </motion.div>
          )}

          {/* STATE 6: Round Result Reveal */}
          {gameState === "round_reveal" && (
            <KahootResultOverlay
              key="round_reveal"
              isCorrect={roundResult?.isCorrect ?? false}
              pointsAdded={roundResult?.pointsAdded ?? 0}
              totalScore={roundResult?.totalScore ?? totalScore}
              streak={roundResult?.streak ?? streak}
              correctOptionIndex={roundResult?.correctOptionIndex ?? 0}
              correctOptionText={
                currentQuestion?.options?.[roundResult?.correctOptionIndex ?? 0]
              }
              rank={roundResult?.rank ?? 1}
            />
          )}

          {/* STATE 7: Final Game Over / Podium */}
          {gameState === "game_over" && (
            <KahootPodium
              key="game_over"
              finalScore={gameOverData?.finalScore ?? totalScore}
              finalRank={gameOverData?.finalRank ?? 1}
              totalParticipants={gameOverData?.totalParticipants ?? 24}
              topLeaderboard={gameOverData?.topLeaderboard ?? [
                { name: nickname || "Player", score: totalScore, rank: 1 },
                { name: "Sarah Chen", score: Math.max(0, totalScore - 150), rank: 2 },
                { name: "Marcus Thorne", score: Math.max(0, totalScore - 300), rank: 3 }
              ]}
              onPlayAgain={() => {
                leaveGame();
                setInputPin("");
              }}
              onExit={leaveGame}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
