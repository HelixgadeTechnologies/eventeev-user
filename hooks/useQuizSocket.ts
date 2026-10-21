"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { initSocket, getSocket } from "@/lib/socket";

export type GameState =
  | "idle"
  | "joining"
  | "lobby"
  | "question_active"
  | "answer_locked"
  | "round_reveal"
  | "game_over";

export interface QuizQuestion {
  questionIndex: number;
  totalQuestions: number;
  question: string;
  options: string[];
  timeLimitSeconds: number;
  startedAt?: number;
  imageUrl?: string;
}

export interface QuizRoundResult {
  questionIndex: number;
  correctOptionIndex: number;
  selectedOptionIndex: number | null;
  isCorrect: boolean;
  pointsAdded: number;
  totalScore: number;
  streak: number;
  rank?: number;
}

export interface QuizGameOverData {
  sessionId?: string;
  finalScore: number;
  finalRank: number;
  totalParticipants: number;
  topLeaderboard?: Array<{ name: string; score: number; rank: number }>;
}

export interface QuizSessionData {
  _id?: string;
  id?: string;
  pin: string;
  status: string;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  currentQuestion?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface UseQuizSocketReturn {
  gameState: GameState;
  pin: string;
  nickname: string;
  sessionData: QuizSessionData | null;
  currentQuestion: QuizQuestion | null;
  roundResult: QuizRoundResult | null;
  gameOverData: QuizGameOverData | null;
  selectedOptionIndex: number | null;
  totalScore: number;
  streak: number;
  timeLeft: number;
  error: string;
  isSandbox: boolean;
  isConnected: boolean;
  joinGame: (pin: string, nickname: string) => Promise<boolean>;
  submitAnswer: (optionIndex: number) => void;
  leaveGame: () => void;
  startSandboxDemo: () => void;
}

// Sample questions for sandbox demo mode
const DEMO_QUESTIONS: QuizQuestion[] = [
  {
    questionIndex: 0,
    totalQuestions: 3,
    question: "What is the primary mission of Eventeev for B2B events?",
    options: [
      "To maximize serendipitous human connections",
      "To automate manual badge printing only",
      "To eliminate physical event spaces",
      "To replace keynote speakers with chatbots"
    ],
    timeLimitSeconds: 15
  },
  {
    questionIndex: 1,
    totalQuestions: 3,
    question: "Which feature powers real-time attendee engagement during live sessions?",
    options: [
      "Paper Feedback Forms",
      "Pulse Q&A, Live Polls & Trivia",
      "Standard Email Newsletters",
      "Static PDF Agendas"
    ],
    timeLimitSeconds: 15
  },
  {
    questionIndex: 2,
    totalQuestions: 3,
    question: "What geometric shape represents the RED card in Kahoot?",
    options: [
      "Square",
      "Circle",
      "Triangle",
      "Diamond"
    ],
    timeLimitSeconds: 12
  }
];

const DEMO_CORRECT_ANSWERS = [0, 1, 2];

// Normalize question data from any backend schema variations
export function normalizeQuestion(data: Record<string, unknown> | null | undefined): QuizQuestion {
  const rawQ = (data?.currentQuestion || data?.question || data) as Record<string, unknown> | string | undefined;
  const questionText =
    typeof rawQ === "string"
      ? rawQ
      : ((rawQ?.question || rawQ?.title || rawQ?.text || data?.title || data?.question || "Question") as string);

  let rawOptions = (data?.options || (typeof rawQ === "object" ? rawQ?.options : null) || []) as unknown[];
  if (!Array.isArray(rawOptions) || rawOptions.length === 0) {
    rawOptions = ["Option A", "Option B", "Option C", "Option D"];
  }

  const options: string[] = rawOptions.map((opt: unknown) => {
    if (typeof opt === "string") return opt;
    if (typeof opt === "object" && opt !== null) {
      const o = opt as Record<string, unknown>;
      return String(o.text || o.title || o.option || o.label || "");
    }
    return String(opt);
  });

  const rawQObj = typeof rawQ === "object" && rawQ !== null ? rawQ : null;

  const timeLimitSeconds = Number(
    data?.timeLimitSeconds ||
    data?.duration ||
    data?.timeLimit ||
    rawQObj?.timeLimitSeconds ||
    rawQObj?.timeLimit ||
    rawQObj?.duration ||
    15
  );

  const questionIndex = Number(
    data?.questionIndex ??
    data?.currentQuestionIndex ??
    rawQObj?.questionIndex ??
    0
  );

  const totalQuestions = Number(
    data?.totalQuestions ??
    data?.questionsCount ??
    rawQObj?.totalQuestions ??
    5
  );

  return {
    questionIndex,
    totalQuestions,
    question: questionText,
    options,
    timeLimitSeconds,
    imageUrl: (data?.imageUrl || rawQObj?.imageUrl) as string | undefined
  };
}

// Trigger gentle mobile haptic feedback if available
function triggerHaptic(pattern: number | number[] = 30) {
  if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors on unsupported browsers
    }
  }
}

export function useQuizSocket(): UseQuizSocketReturn {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [pin, setPin] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [sessionData, setSessionData] = useState<QuizSessionData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [roundResult, setRoundResult] = useState<QuizRoundResult | null>(null);
  const [gameOverData, setGameOverData] = useState<QuizGameOverData | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [isSandbox, setIsSandbox] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sandboxTimeouts = useRef<NodeJS.Timeout[]>([]);
  const runSandboxQuestionRef = useRef<(qIndex: number, currentPoints: number, currentStreak: number) => void>(() => {});

  // Synchronized refs to avoid listener tearing in effects
  const gameStateRef = useRef(gameState);
  const timeLeftRef = useRef(timeLeft);
  const totalScoreRef = useRef(totalScore);
  const streakRef = useRef(streak);
  const selectedOptionIndexRef = useRef(selectedOptionIndex);
  const currentQuestionRef = useRef(currentQuestion);
  const pinRef = useRef(pin);
  const nicknameRef = useRef(nickname);
  const sessionDataRef = useRef(sessionData);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { totalScoreRef.current = totalScore; }, [totalScore]);
  useEffect(() => { streakRef.current = streak; }, [streak]);
  useEffect(() => { selectedOptionIndexRef.current = selectedOptionIndex; }, [selectedOptionIndex]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);
  useEffect(() => { pinRef.current = pin; }, [pin]);
  useEffect(() => { nicknameRef.current = nickname; }, [nickname]);
  useEffect(() => { sessionDataRef.current = sessionData; }, [sessionData]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      sandboxTimeouts.current.forEach(clearTimeout);
    };
  }, []);

  // Countdown timer for active questions (runs during question_active and answer_locked)
  useEffect(() => {
    if ((gameState === "question_active" || gameState === "answer_locked") && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [gameState, timeLeft]);

  // Handler for question start / game start
  const handleQuestionStart = useCallback((data: Record<string, unknown>) => {
    if (!data) return;

    const q = normalizeQuestion(data);
    setCurrentQuestion(q);
    setTimeLeft(q.timeLimitSeconds);
    setSelectedOptionIndex(null);
    setRoundResult(null);
    setGameState("question_active");

    triggerHaptic([60, 40, 60]);
  }, []);

  // Handler for round reveal / question ended
  const handleQuestionEnded = useCallback((data: Record<string, unknown>) => {
    const currentOption = selectedOptionIndexRef.current;
    const currentTotal = totalScoreRef.current;
    const currentStreakCount = streakRef.current;
    const currentRemaining = timeLeftRef.current;
    const activeQ = currentQuestionRef.current;

    const correctOptionIndex = Number(data?.correctOptionIndex ?? data?.correctAnswer ?? 0);
    const isCorrect =
      typeof data?.isCorrect === "boolean"
        ? data.isCorrect
        : currentOption !== null && currentOption === correctOptionIndex;

    const points =
      typeof data?.pointsAdded === "number"
        ? data.pointsAdded
        : (isCorrect ? Math.max(100, Math.round(currentRemaining * 50) + 500) : 0);

    const newScore = currentTotal + points;
    const newStreak = isCorrect ? currentStreakCount + 1 : 0;

    setTotalScore(newScore);
    setStreak(newStreak);

    setRoundResult({
      questionIndex: Number(data?.questionIndex ?? activeQ?.questionIndex ?? 0),
      correctOptionIndex,
      selectedOptionIndex: currentOption,
      isCorrect,
      pointsAdded: points,
      totalScore: newScore,
      streak: newStreak,
      rank: typeof data?.rank === "number" ? data.rank : undefined
    });

    setGameState("round_reveal");

    if (isCorrect) {
      triggerHaptic([70, 50, 70]);
    } else {
      triggerHaptic(120);
    }
  }, []);

  // Handler for game over
  const handleGameOver = useCallback((data: Record<string, unknown>) => {
    const currentTotal = totalScoreRef.current;
    const playerNick = nicknameRef.current || "Player";
    const currentSessionId =
      sessionDataRef.current?._id || sessionDataRef.current?.sessionId;

    const topLeaderboard = Array.isArray(data?.topLeaderboard)
      ? (data.topLeaderboard as Array<{ name: string; score: number; rank: number }>)
      : [
          { name: playerNick, score: currentTotal, rank: 1 },
          { name: "Sarah Chen", score: Math.max(0, currentTotal - 150), rank: 2 },
          { name: "Marcus Thorne", score: Math.max(0, currentTotal - 300), rank: 3 }
        ];

    setGameOverData({
      sessionId: typeof currentSessionId === "string" ? currentSessionId : undefined,
      finalScore: typeof data?.finalScore === "number" ? data.finalScore : currentTotal,
      finalRank: typeof data?.finalRank === "number" ? data.finalRank : 1,
      totalParticipants: typeof data?.totalParticipants === "number" ? data.totalParticipants : 24,
      topLeaderboard
    });
    setGameState("game_over");
    triggerHaptic([100, 80, 100, 80, 150]);
  }, []);

  // Time expired handler: If time runs out during live question without answer
  useEffect(() => {
    if (timeLeft === 0 && gameState === "question_active" && !isSandbox) {
      const timeout = setTimeout(() => {
        if (gameStateRef.current === "question_active") {
          handleQuestionEnded({
            questionIndex: currentQuestionRef.current?.questionIndex ?? 0,
            isCorrect: false,
            pointsAdded: 0
          });
        }
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [timeLeft, gameState, isSandbox, handleQuestionEnded]);

  // Stable Real-Time Socket Connection & Event Listeners
  useEffect(() => {
    if (isSandbox || !sessionData) return;

    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => {
      setIsConnected(true);
      const currentPin = pinRef.current;
      const sId = sessionDataRef.current?._id || sessionDataRef.current?.sessionId;
      const nick = nicknameRef.current;

      if (currentPin) {
        socket.emit("join_quiz_session", {
          pin: currentPin,
          sessionId: sId,
          nickname: nick
        });
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    if (socket.connected) {
      onConnect();
    }

    // Join room on mount
    const currentPin = pin;
    const currentSessionId = sessionData?._id || sessionData?.sessionId || sessionData?.id;
    socket.emit("join_quiz_session", {
      pin: currentPin,
      sessionId: currentSessionId,
      nickname
    });

    // Generic game state change handler from admin
    const handleGameStateChange = (data: Record<string, unknown>) => {
      if (!data) return;

      const status = data.status || data.gameState || data.state;
      if (status === "active" || status === "in_progress") {
        handleQuestionStart(data);
      } else if (status === "reveal" || status === "revealed" || status === "round_reveal") {
        handleQuestionEnded(data);
      } else if (status === "finished" || status === "ended" || status === "game_over") {
        handleGameOver(data);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("game_started", handleQuestionStart);
    socket.on("quiz_started", handleQuestionStart);
    socket.on("start_quiz", handleQuestionStart);
    socket.on("admin_start", handleQuestionStart);
    socket.on("question_start", handleQuestionStart);
    socket.on("question_started", handleQuestionStart);
    socket.on("new_question", handleQuestionStart);
    socket.on("next_question", handleQuestionStart);
    socket.on("game_state_changed", handleGameStateChange);
    socket.on("state_change", handleGameStateChange);
    socket.on("session_updated", handleGameStateChange);
    socket.on("game_status", handleGameStateChange);
    socket.on("question_ended", handleQuestionEnded);
    socket.on("round_ended", handleQuestionEnded);
    socket.on("round_result", handleQuestionEnded);
    socket.on("game_over", handleGameOver);
    socket.on("quiz_ended", handleGameOver);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("game_started", handleQuestionStart);
      socket.off("quiz_started", handleQuestionStart);
      socket.off("start_quiz", handleQuestionStart);
      socket.off("admin_start", handleQuestionStart);
      socket.off("question_start", handleQuestionStart);
      socket.off("question_started", handleQuestionStart);
      socket.off("new_question", handleQuestionStart);
      socket.off("next_question", handleQuestionStart);
      socket.off("game_state_changed", handleGameStateChange);
      socket.off("state_change", handleGameStateChange);
      socket.off("session_updated", handleGameStateChange);
      socket.off("game_status", handleGameStateChange);
      socket.off("question_ended", handleQuestionEnded);
      socket.off("round_ended", handleQuestionEnded);
      socket.off("round_result", handleQuestionEnded);
      socket.off("game_over", handleGameOver);
      socket.off("quiz_ended", handleGameOver);
    };
  }, [isSandbox, sessionData, pin, nickname, handleQuestionStart, handleQuestionEnded, handleGameOver]);

  // Active Lobby State Polling Guard
  useEffect(() => {
    if (gameState !== "lobby" || !sessionData || isSandbox) return;

    const currentPin = pin || sessionData?.pin;
    const currentNick = nickname;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";

    let isSubscribed = true;

    const verifyLobbyState = async () => {
      if (!currentPin) return;

      try {
        let res = await fetch(`${API_URL}/api/game/quiz/session/${encodeURIComponent(currentPin)}`, {
          headers: { "Cache-Control": "no-cache" }
        }).catch(() => null);

        let data: Record<string, unknown> | null = null;
        if (res && res.ok) {
          data = await res.json().catch(() => null);
        } else {
          res = await fetch(`${API_URL}/api/game/quiz/session/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
            body: JSON.stringify({ pin: currentPin, nickname: currentNick })
          }).catch(() => null);

          if (res && res.ok) {
            data = await res.json().catch(() => null);
          }
        }

        if (!isSubscribed || !data) return;

        const isLive =
          data.status === "active" ||
          data.status === "in_progress" ||
          data.status === "started" ||
          Boolean(data.currentQuestion);

        if (isLive) {
          handleQuestionStart(data);
        }
      } catch {
        // Silently continue to next poll cycle
      }
    };

    const pollTimer = setInterval(verifyLobbyState, 2500);

    return () => {
      isSubscribed = false;
      clearInterval(pollTimer);
    };
  }, [gameState, sessionData, pin, nickname, isSandbox, handleQuestionStart]);

  // Progression Poller: Automatically advance questions if websocket packet is delayed
  useEffect(() => {
    if (isSandbox || !sessionData) return;
    if (gameState !== "round_reveal" && gameState !== "answer_locked") return;

    const currentPin = pin || sessionData?.pin;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
    let isMounted = true;

    const checkProgression = async () => {
      if (!currentPin) return;

      try {
        const res = await fetch(`${API_URL}/api/game/quiz/session/${encodeURIComponent(currentPin)}`, {
          headers: { "Cache-Control": "no-cache" }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data) return;

        // Check if game is completed
        if (data.status === "finished" || data.gameState === "game_over") {
          handleGameOver(data);
          return;
        }

        const serverQIndex = Number(data.currentQuestionIndex ?? data.questionIndex ?? 0);
        const localQIndex = Number(currentQuestionRef.current?.questionIndex ?? 0);

        if (serverQIndex > localQIndex && (data.status === "active" || data.currentQuestion)) {
          handleQuestionStart(data);
        } else if (data.status === "reveal" && gameStateRef.current === "answer_locked") {
          handleQuestionEnded(data);
        }
      } catch {
        // Silently continue
      }
    };

    const pollInterval = setInterval(checkProgression, 1800);
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [gameState, isSandbox, sessionData, pin, handleQuestionStart, handleQuestionEnded, handleGameOver]);

  // Join Game via API + Socket
  const joinGame = useCallback(async (gamePin: string, playerNickname: string): Promise<boolean> => {
    if (!gamePin || !playerNickname) return false;

    const normalizedPin = gamePin.trim().toUpperCase();
    const cleanNick = playerNickname.trim();

    setGameState("joining");
    setError("");
    setPin(normalizedPin);
    setNickname(cleanNick);
    setIsSandbox(false);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
      const res = await fetch(`${API_URL}/api/game/quiz/session/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: normalizedPin, nickname: cleanNick })
      });

      const data = await res.json();

      if (res.ok) {
        setSessionData(data.session || data);

        const socket = initSocket();
        socket.emit("join_quiz_session", {
          pin: normalizedPin,
          sessionId: data.session?._id || data._id || data.sessionId,
          nickname: cleanNick
        });

        const isAlreadyLive =
          data.status === "active" ||
          data.status === "in_progress" ||
          data.status === "started" ||
          Boolean(data.currentQuestion);

        if (isAlreadyLive) {
          handleQuestionStart(data);
        } else {
          setGameState("lobby");
        }
        return true;
      } else {
        setError(data.message || "Game session not found or has already ended.");
        setGameState("idle");
        return false;
      }
    } catch (err) {
      console.error("Failed to join game:", err);
      setError("Network connection issue. Please check your internet connection.");
      setGameState("idle");
      return false;
    }
  }, [handleQuestionStart]);

  // Submit Answer
  const submitAnswer = useCallback((optionIndex: number) => {
    if (gameStateRef.current !== "question_active" || selectedOptionIndexRef.current !== null) return;

    triggerHaptic(35);
    setSelectedOptionIndex(optionIndex);
    setGameState("answer_locked");

    // SANDBOX DEMO SUBMISSION
    if (isSandbox) {
      sandboxTimeouts.current.forEach(clearTimeout);
      sandboxTimeouts.current = [];

      const currentQ = currentQuestionRef.current;
      const qIndex = currentQ?.questionIndex ?? 0;
      const correctIndex = DEMO_CORRECT_ANSWERS[qIndex] ?? 0;
      const isCorrect = optionIndex === correctIndex;
      const timeTaken = Math.max(0.2, (currentQ?.timeLimitSeconds ?? 15) - timeLeftRef.current);
      const added = isCorrect ? Math.round(500 + Math.max(0, 1 - timeTaken / 30) * 500) : 0;
      const newScore = totalScoreRef.current + added;
      const newStreak = isCorrect ? streakRef.current + 1 : 0;

      // 1. Show locked selection for 1.2s, then show round result
      const revealTimeout = setTimeout(() => {
        setTotalScore(newScore);
        setStreak(newStreak);
        setRoundResult({
          questionIndex: qIndex,
          correctOptionIndex: correctIndex,
          selectedOptionIndex: optionIndex,
          isCorrect,
          pointsAdded: added,
          totalScore: newScore,
          streak: newStreak,
          rank: 1
        });
        setGameState("round_reveal");
        triggerHaptic(isCorrect ? [70, 50, 70] : 120);

        // 2. Display round result for 3.5s then advance to next question or final podium
        const nextStepTimeout = setTimeout(() => {
          if (qIndex + 1 < DEMO_QUESTIONS.length) {
            runSandboxQuestionRef.current(qIndex + 1, newScore, newStreak);
          } else {
            // GAME OVER - Final Points & Podium!
            setGameOverData({
              sessionId: "demo_session_123",
              finalScore: newScore,
              finalRank: 1,
              totalParticipants: 24,
              topLeaderboard: [
                { name: nicknameRef.current || "AttendeePlayer", score: newScore, rank: 1 },
                { name: "Sarah Chen", score: Math.max(600, newScore - 180), rank: 2 },
                { name: "Marcus Thorne", score: Math.max(400, newScore - 350), rank: 3 }
              ]
            });
            setGameState("game_over");
            triggerHaptic([100, 80, 100, 80, 150]);
          }
        }, 3500);

        sandboxTimeouts.current.push(nextStepTimeout);
      }, 1200);

      sandboxTimeouts.current.push(revealTimeout);
      return;
    }

    // LIVE GAME SUBMISSION
    const currentPin = pinRef.current;
    const currentSession = sessionDataRef.current;
    const activeQ = currentQuestionRef.current;
    const remaining = timeLeftRef.current;
    const playerNick = nicknameRef.current;
    const timeTaken = Math.max(0, (activeQ?.timeLimitSeconds ?? 20) - remaining);

    // 1. Emit via real-time WebSocket
    const socket = getSocket();
    if (socket && currentSession) {
      socket.emit("submit_quiz_answer", {
        pin: currentPin,
        sessionId: currentSession._id || currentSession.sessionId,
        questionIndex: activeQ?.questionIndex ?? 0,
        selectedOptionIndex: optionIndex,
        timeElapsedSeconds: timeTaken,
        nickname: playerNick
      });
    }

    // 2. Submit to backend REST endpoint for Kahoot scoring evaluation: PATCH /api/game/quiz/session/:pin/submit
    if (currentPin) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
      fetch(`${API_URL}/api/game/quiz/session/${encodeURIComponent(currentPin)}/submit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: playerNick,
          questionIndex: activeQ?.questionIndex ?? 0,
          answer: [optionIndex],
          answerIndex: optionIndex,
          timeTaken
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.currentScore === "number") {
            const newScore = data.currentScore;
            const newStreak = typeof data.streak === "number" ? data.streak : streakRef.current;
            setTotalScore(newScore);
            setStreak(newStreak);

            // After 1.2s lock-in, display round reveal
            setTimeout(() => {
              if (gameStateRef.current === "answer_locked") {
                setRoundResult({
                  questionIndex: activeQ?.questionIndex ?? 0,
                  correctOptionIndex: typeof data.correctOptionIndex === "number" ? data.correctOptionIndex : optionIndex,
                  selectedOptionIndex: optionIndex,
                  isCorrect: Boolean(data.isCorrect),
                  pointsAdded: data.points || 0,
                  totalScore: newScore,
                  streak: newStreak,
                  rank: data.rank
                });
                setGameState("round_reveal");
                triggerHaptic(data.isCorrect ? [70, 50, 70] : 120);
              }
            }, 1200);
          }
        })
        .catch(() => {});
    }
  }, [isSandbox]);

  // Leave Game
  const leaveGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    sandboxTimeouts.current.forEach(clearTimeout);

    const socket = getSocket();
    if (socket && pinRef.current) {
      socket.emit("leave_quiz_session", { pin: pinRef.current, nickname: nicknameRef.current });
    }

    setGameState("idle");
    setPin("");
    setNickname("");
    setSessionData(null);
    setCurrentQuestion(null);
    setRoundResult(null);
    setGameOverData(null);
    setSelectedOptionIndex(null);
    setTotalScore(0);
    setStreak(0);
    setTimeLeft(0);
    setError("");
    setIsSandbox(false);
  }, []);

  // Sandbox demo flow for instant testing of all questions to final podium
  useEffect(() => {
    runSandboxQuestionRef.current = (qIndex: number, currentPoints: number, currentStreak: number) => {
      sandboxTimeouts.current.forEach(clearTimeout);
      sandboxTimeouts.current = [];

      if (qIndex >= DEMO_QUESTIONS.length) {
        // Game Over - Show Final Points & Podium
        setGameOverData({
          sessionId: "demo_session_123",
          finalScore: currentPoints,
          finalRank: 1,
          totalParticipants: 24,
          topLeaderboard: [
            { name: nicknameRef.current || "AttendeePlayer", score: currentPoints, rank: 1 },
            { name: "Sarah Chen", score: Math.max(600, currentPoints - 180), rank: 2 },
            { name: "Marcus Thorne", score: Math.max(400, currentPoints - 350), rank: 3 }
          ]
        });
        setGameState("game_over");
        triggerHaptic([100, 80, 100, 80, 150]);
        return;
      }

      const q = DEMO_QUESTIONS[qIndex];
      setCurrentQuestion(q);
      setStreak(currentStreak);
      setTimeLeft(q.timeLimitSeconds);
      setSelectedOptionIndex(null);
      setRoundResult(null);
      setGameState("question_active");
      triggerHaptic([60, 40, 60]);

      // If user does not answer before question timer expires
      const autoAdvanceTimeout = setTimeout(() => {
        if (selectedOptionIndexRef.current === null && gameStateRef.current === "question_active") {
          const correctIndex = DEMO_CORRECT_ANSWERS[qIndex];
          setRoundResult({
            questionIndex: qIndex,
            correctOptionIndex: correctIndex,
            selectedOptionIndex: null,
            isCorrect: false,
            pointsAdded: 0,
            totalScore: currentPoints,
            streak: 0,
            rank: 1
          });
          setStreak(0);
          setGameState("round_reveal");
          triggerHaptic(120);

          // After 3.5s on round reveal, move to next question or game over
          const nextQTimeout = setTimeout(() => {
            runSandboxQuestionRef.current(qIndex + 1, currentPoints, 0);
          }, 3500);
          sandboxTimeouts.current.push(nextQTimeout);
        }
      }, (q.timeLimitSeconds + 0.5) * 1000);

      sandboxTimeouts.current.push(autoAdvanceTimeout);
    };
  }, []);

  const startSandboxDemo = useCallback(() => {
    setIsSandbox(true);
    setPin("DEMO88");
    const demoNick = nickname || "AttendeePlayer";
    setNickname(demoNick);
    setSessionData({ _id: "demo_session_123", pin: "DEMO88", status: "waiting" });
    setGameState("lobby");
    setTotalScore(0);
    setStreak(0);

    sandboxTimeouts.current.forEach(clearTimeout);
    sandboxTimeouts.current = [];

    // Simulate 2.5 seconds in lobby then admin starts Q1
    const t1 = setTimeout(() => {
      runSandboxQuestionRef.current(0, 0, 0);
    }, 2500);
    sandboxTimeouts.current.push(t1);
  }, [nickname]);

  return {
    gameState,
    pin,
    nickname,
    sessionData,
    currentQuestion,
    roundResult,
    gameOverData,
    selectedOptionIndex,
    totalScore,
    streak,
    timeLeft,
    error,
    isSandbox,
    isConnected,
    joinGame,
    submitAnswer,
    leaveGame,
    startSandboxDemo
  };
}
