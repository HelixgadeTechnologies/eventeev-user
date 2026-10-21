"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { initSocket, getSocket } from "@/lib/socket";

export type GameState =
  | "idle"
  | "joining"
  | "lobby"
  | "game_countdown"
  | "question_intro"
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
  category?: string;
  correctOptionIndex?: number;
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
  questions?: unknown[];
  category?: string;
  quizId?: {
    questions?: unknown[];
    category?: string;
    [key: string]: unknown;
  };
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
  countdownTimeLeft: number;
  introTimeLeft: number;
  error: string;
  isSandbox: boolean;
  isConnected: boolean;
  joinGame: (pin: string, nickname: string) => Promise<boolean>;
  submitAnswer: (optionIndex: number) => void;
  leaveGame: () => void;
  startSandboxDemo: () => void;
}

// Built-in questions for sandbox demo mode and live fallbacks
export const DEMO_QUESTIONS: QuizQuestion[] = [
  {
    questionIndex: 0,
    totalQuestions: 3,
    question: "What is the primary mission of Eventeev for B2B events?",
    category: "Product & Vision",
    options: [
      "To maximize serendipitous human connections",
      "To automate manual badge printing only",
      "To eliminate physical event spaces",
      "To replace keynote speakers with chatbots"
    ],
    timeLimitSeconds: 20,
    correctOptionIndex: 0
  },
  {
    questionIndex: 1,
    totalQuestions: 3,
    question: "Which feature powers real-time attendee engagement during live sessions?",
    category: "Live Engagement",
    options: [
      "Paper Feedback Forms",
      "Pulse Q&A, Live Polls & Trivia",
      "Standard Email Newsletters",
      "Static PDF Agendas"
    ],
    timeLimitSeconds: 20,
    correctOptionIndex: 1
  },
  {
    questionIndex: 2,
    totalQuestions: 3,
    question: "What geometric shape represents the RED card in Kahoot?",
    category: "Trivia Dynamics",
    options: [
      "Square",
      "Circle",
      "Triangle",
      "Diamond"
    ],
    timeLimitSeconds: 15,
    correctOptionIndex: 2
  }
];

export const DEMO_CORRECT_ANSWERS = [0, 1, 2];

// Normalize question payload from any backend schema variations
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
    20
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
    3
  );

  const category = (data?.category || rawQObj?.category || "Live Event Trivia") as string;

  const correctOptionIndex =
    typeof data?.correctOptionIndex === "number"
      ? data.correctOptionIndex
      : typeof rawQObj?.correctOptionIndex === "number"
        ? rawQObj.correctOptionIndex
        : Array.isArray(rawQObj?.correctAnswer) && rawQObj.correctAnswer.length > 0
          ? Number(rawQObj.correctAnswer[0])
          : undefined;

  return {
    questionIndex,
    totalQuestions,
    question: questionText,
    category,
    options,
    timeLimitSeconds,
    imageUrl: (data?.imageUrl || rawQObj?.imageUrl) as string | undefined,
    correctOptionIndex
  };
}

// Trigger gentle mobile haptic feedback if available
function triggerHaptic(pattern: number | number[] = 30) {
  if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors on unsupported devices
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
  const [countdownTimeLeft, setCountdownTimeLeft] = useState<number>(5);
  const [introTimeLeft, setIntroTimeLeft] = useState<number>(3);
  const [error, setError] = useState<string>("");
  const [isSandbox, setIsSandbox] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Synchronized refs to eliminate React state batching delays and stale closures
  const gameStateRef = useRef<GameState>(gameState);
  const timeLeftRef = useRef<number>(timeLeft);
  const totalScoreRef = useRef<number>(totalScore);
  const streakRef = useRef<number>(streak);
  const selectedOptionIndexRef = useRef<number | null>(selectedOptionIndex);
  const currentQuestionRef = useRef<QuizQuestion | null>(currentQuestion);
  const pinRef = useRef<string>(pin);
  const nicknameRef = useRef<string>(nickname);
  const sessionDataRef = useRef<QuizSessionData | null>(sessionData);
  const isSandboxRef = useRef<boolean>(isSandbox);
  const pendingRoundResultRef = useRef<{
    qIndex: number;
    isCorrect: boolean;
    pointsAdded: number;
    correctOptionIndex: number;
    selectedOptionIndex: number | null;
    newScore: number;
    newStreak: number;
    rank?: number;
  } | null>(null);
  const handleQuestionEndedRef = useRef<(data?: Record<string, unknown>) => void>(() => {});

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Update refs on state changes
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { totalScoreRef.current = totalScore; }, [totalScore]);
  useEffect(() => { streakRef.current = streak; }, [streak]);
  useEffect(() => { selectedOptionIndexRef.current = selectedOptionIndex; }, [selectedOptionIndex]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);
  useEffect(() => { pinRef.current = pin; }, [pin]);
  useEffect(() => { nicknameRef.current = nickname; }, [nickname]);
  useEffect(() => { sessionDataRef.current = sessionData; }, [sessionData]);
  useEffect(() => { isSandboxRef.current = isSandbox; }, [isSandbox]);

  // Clean all scheduled timeouts and intervals
  const clearAllTimers = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    activeTimeouts.current.forEach(clearTimeout);
    activeTimeouts.current = [];
  }, []);

  const addTimeout = useCallback((timeout: NodeJS.Timeout) => {
    activeTimeouts.current.push(timeout);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Active question countdown timer (runs during question_active and answer_locked)
  useEffect(() => {
    if ((gameState === "question_active" || gameState === "answer_locked") && timeLeft > 0) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      countdownIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          timeLeftRef.current = next;
          if (next <= 0) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            handleQuestionEndedRef.current();
            return 0;
          }
          return next;
        });
      }, 1000);

      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      };
    }
  }, [gameState, timeLeft]);

  // Complete game and display Kahoot final podium
  const completeGame = useCallback((finalPoints?: number, rank?: number, customLeaderboard?: Array<{ name: string; score: number; rank: number }>) => {
    clearAllTimers();

    const score = typeof finalPoints === "number" ? finalPoints : totalScoreRef.current;
    const finalRank = typeof rank === "number" ? rank : 1;
    const playerNick = nicknameRef.current || "AttendeePlayer";
    const currentSessionId = sessionDataRef.current?._id || sessionDataRef.current?.sessionId;

    const topLeaderboard = customLeaderboard || [
      { name: playerNick, score, rank: finalRank },
      { name: "Sarah Chen", score: Math.max(0, score - 150), rank: finalRank === 1 ? 2 : 1 },
      { name: "Marcus Thorne", score: Math.max(0, score - 320), rank: finalRank <= 2 ? 3 : 2 }
    ];

    gameStateRef.current = "game_over";
    setGameOverData({
      sessionId: typeof currentSessionId === "string" ? currentSessionId : "session_final",
      finalScore: score,
      finalRank,
      totalParticipants: Math.max(12, topLeaderboard.length),
      topLeaderboard
    });
    setGameState("game_over");
    triggerHaptic([100, 80, 100, 80, 150]);
  }, [clearAllTimers]);

  // Forward declarations refs
  const triggerRoundRevealRef = useRef<(payload: {
    qIndex: number;
    isCorrect: boolean;
    pointsAdded: number;
    correctOptionIndex: number;
    selectedOptionIndex: number | null;
    newScore: number;
    newStreak: number;
    rank?: number;
  }) => void>(() => {});
  const handleQuestionHoldRef = useRef<(data: Record<string, unknown>) => void>(() => {});

  // Activate question answering phase: Unlocks the 4 colored geometric answer buttons
  const activateQuestion = useCallback((targetQuestion: QuizQuestion, currentPoints: number, currentStreak: number) => {
    currentQuestionRef.current = targetQuestion;
    selectedOptionIndexRef.current = null;
    gameStateRef.current = "question_active";
    timeLeftRef.current = targetQuestion.timeLimitSeconds;
    totalScoreRef.current = currentPoints;
    streakRef.current = currentStreak;

    setCurrentQuestion(targetQuestion);
    setSelectedOptionIndex(null);
    setRoundResult(null);
    setTimeLeft(targetQuestion.timeLimitSeconds);
    setTotalScore(currentPoints);
    setStreak(currentStreak);
    setGameState("question_active");

    triggerHaptic([70, 40, 70]);

    // Zero-hang question timeout safeguard: If participant does not click before time expires
    const autoExpireTimeout = setTimeout(() => {
      if (selectedOptionIndexRef.current === null && gameStateRef.current === "question_active") {
        // Player timed out
        triggerRoundRevealRef.current({
          qIndex: targetQuestion.questionIndex,
          isCorrect: false,
          pointsAdded: 0,
          correctOptionIndex: targetQuestion.correctOptionIndex ?? 0,
          selectedOptionIndex: null,
          newScore: totalScoreRef.current,
          newStreak: 0,
          rank: 1
        });
      }
    }, (targetQuestion.timeLimitSeconds + 0.6) * 1000);

    addTimeout(autoExpireTimeout);
  }, [addTimeout]);

  // Start the 3-second Question Intro Teaser: Matches admin's Question Intro screen
  const startQuestionIntro = useCallback((targetQuestion: QuizQuestion, currentPoints: number, currentStreak: number) => {
    clearAllTimers();

    currentQuestionRef.current = targetQuestion;
    selectedOptionIndexRef.current = null;
    gameStateRef.current = "question_intro";
    setGameState("question_intro");
    setCurrentQuestion(targetQuestion);
    setSelectedOptionIndex(null);
    setRoundResult(null);
    setIntroTimeLeft(3);

    triggerHaptic(40);

    // 3-second countdown tick interval
    let introRemaining = 3;
    const introInterval = setInterval(() => {
      introRemaining -= 1;
      setIntroTimeLeft(Math.max(0, introRemaining));

      if (introRemaining <= 0) {
        clearInterval(introInterval);
        activateQuestion(targetQuestion, currentPoints, currentStreak);
      }
    }, 1000);

    addTimeout(introInterval);
  }, [clearAllTimers, activateQuestion, addTimeout]);

  // Start the initial 5-second Game Countdown: Matches admin's initial countdown screen
  const startGameCountdown = useCallback((initialQuestion: QuizQuestion) => {
    clearAllTimers();

    currentQuestionRef.current = initialQuestion;
    selectedOptionIndexRef.current = null;
    gameStateRef.current = "game_countdown";
    setGameState("game_countdown");
    setCurrentQuestion(initialQuestion);
    setSelectedOptionIndex(null);
    setRoundResult(null);
    setCountdownTimeLeft(5);

    triggerHaptic([80, 50, 80]);

    // 5-second countdown tick interval
    let count = 5;
    const countInterval = setInterval(() => {
      count -= 1;
      setCountdownTimeLeft(Math.max(0, count));

      if (count <= 0) {
        clearInterval(countInterval);
        // After 5s countdown, proceed to 3s Question 1 intro teaser
        startQuestionIntro(initialQuestion, 0, 0);
      }
    }, 1000);

    addTimeout(countInterval);
  }, [clearAllTimers, startQuestionIntro, addTimeout]);

  // Prepare question target and advance
  const advanceToQuestion = useCallback((qIndex: number, currentPoints: number, currentStreak: number, isInitialStart = false) => {
    clearAllTimers();

    const isSandboxMode = isSandboxRef.current;
    let targetQuestion: QuizQuestion;

    if (isSandboxMode) {
      if (qIndex >= DEMO_QUESTIONS.length) {
        completeGame(currentPoints, 1);
        return;
      }
      targetQuestion = DEMO_QUESTIONS[qIndex];
    } else {
      const rawSessionQuestions =
        sessionDataRef.current?.quizId?.questions ||
        sessionDataRef.current?.questions ||
        [];

      const totalQ = Math.max(
        rawSessionQuestions.length,
        currentQuestionRef.current?.totalQuestions ?? 3
      );

      if (qIndex >= totalQ) {
        completeGame(currentPoints, 1);
        return;
      }

      const category = (sessionDataRef.current?.quizId?.category || sessionDataRef.current?.category || "Live Event Trivia") as string;

      if (rawSessionQuestions[qIndex]) {
        targetQuestion = normalizeQuestion({
          question: rawSessionQuestions[qIndex],
          questionIndex: qIndex,
          totalQuestions: totalQ,
          category
        });
      } else if (DEMO_QUESTIONS[qIndex]) {
        targetQuestion = {
          ...DEMO_QUESTIONS[qIndex],
          questionIndex: qIndex,
          totalQuestions: totalQ,
          category
        };
      } else {
        targetQuestion = {
          questionIndex: qIndex,
          totalQuestions: totalQ,
          question: `Question ${qIndex + 1}`,
          category,
          options: ["Option A", "Option B", "Option C", "Option D"],
          timeLimitSeconds: 20
        };
      }
    }

    if (isInitialStart) {
      // Game start from lobby: 5s initial countdown followed by 3s intro
      startGameCountdown(targetQuestion);
    } else {
      // Subsequent questions: 3s intro teaser delay matching admin screen
      startQuestionIntro(targetQuestion, currentPoints, currentStreak);
    }
  }, [clearAllTimers, completeGame, startGameCountdown, startQuestionIntro]);

  // Trigger round reveal and schedule autonomous next step
  const triggerRoundReveal = useCallback((payload: {
    qIndex: number;
    isCorrect: boolean;
    pointsAdded: number;
    correctOptionIndex: number;
    selectedOptionIndex: number | null;
    newScore: number;
    newStreak: number;
    rank?: number;
  }) => {
    const {
      qIndex,
      isCorrect,
      pointsAdded,
      correctOptionIndex,
      selectedOptionIndex,
      newScore,
      newStreak,
      rank
    } = payload;

    totalScoreRef.current = newScore;
    streakRef.current = newStreak;
    setTotalScore(newScore);
    setStreak(newStreak);

    setRoundResult({
      questionIndex: qIndex,
      correctOptionIndex,
      selectedOptionIndex,
      isCorrect,
      pointsAdded,
      totalScore: newScore,
      streak: newStreak,
      rank: rank ?? 1
    });

    gameStateRef.current = "round_reveal";
    setGameState("round_reveal");
    triggerHaptic(isCorrect ? [70, 50, 70] : 120);

    // In Sandbox demo mode: Display feedback for 3.5 seconds, then move to next demo question
    if (isSandboxRef.current) {
      const nextStepTimeout = setTimeout(() => {
        if (gameStateRef.current === "round_reveal") {
          const totalQ = DEMO_QUESTIONS.length;
          if (qIndex + 1 < totalQ) {
            advanceToQuestion(qIndex + 1, newScore, newStreak, false);
          } else {
            completeGame(newScore, rank || 1);
          }
        }
      }, 3500);
      addTimeout(nextStepTimeout);
    } else {
      // IN LIVE GAME MODE:
      // The attendee stays on round_reveal waiting for the host to click "Next Question"
      // or for the server socket "next_question" event so both screens flow side by side!
      const safetyPollTimeout = setTimeout(async () => {
        if (gameStateRef.current === "round_reveal" && !isSandboxRef.current) {
          const currentPin = pinRef.current;
          if (!currentPin) return;
          try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
            const res = await fetch(`${API_URL}/api/game/quiz/session/${encodeURIComponent(currentPin)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.status === "finished") {
                handleGameOver(data);
              } else if (typeof data.currentQuestionIndex === "number" && data.currentQuestionIndex > qIndex) {
                handleQuestionHoldRef.current(data);
              }
            }
          } catch (_) {}
        }
      }, 25000);
      addTimeout(safetyPollTimeout);
    }
  }, [addTimeout, completeGame, advanceToQuestion]);

  // Keep triggerRoundRevealRef up to date
  useEffect(() => {
    triggerRoundRevealRef.current = triggerRoundReveal;
  }, [triggerRoundReveal]);

  // Submit Answer
  const submitAnswer = useCallback((optionIndex: number) => {
    if (gameStateRef.current !== "question_active" || selectedOptionIndexRef.current !== null) return;

    triggerHaptic(35);
    selectedOptionIndexRef.current = optionIndex;
    setSelectedOptionIndex(optionIndex);
    gameStateRef.current = "answer_locked";
    setGameState("answer_locked");

    const currentQ = currentQuestionRef.current;
    const qIndex = currentQ?.questionIndex ?? 0;
    const remaining = timeLeftRef.current;
    const timeLimit = currentQ?.timeLimitSeconds ?? 20;
    const timeTaken = Math.max(0.2, timeLimit - remaining);

    // SANDBOX DEMO SUBMISSION
    if (isSandboxRef.current) {
      clearAllTimers();

      const correctIndex = currentQ?.correctOptionIndex ?? (DEMO_CORRECT_ANSWERS[qIndex] ?? 0);
      const isCorrect = optionIndex === correctIndex;
      const points = isCorrect ? Math.round(500 + Math.max(0, 1 - timeTaken / 30) * 500) : 0;
      const newScore = totalScoreRef.current + points;
      const newStreak = isCorrect ? streakRef.current + 1 : 0;

      // 1.2s lock-in presentation, then reveal
      const revealTimeout = setTimeout(() => {
        triggerRoundReveal({
          qIndex,
          isCorrect,
          pointsAdded: points,
          correctOptionIndex: correctIndex,
          selectedOptionIndex: optionIndex,
          newScore,
          newStreak,
          rank: 1
        });
      }, 1200);

      addTimeout(revealTimeout);
      return;
    }

    // LIVE GAME SUBMISSION
    const currentPin = pinRef.current;
    const currentSession = sessionDataRef.current;
    const playerNick = nicknameRef.current || "AttendeePlayer";

    // 1. Real-time WebSocket emission to host
    const socket = getSocket();
    if (socket && currentSession) {
      socket.emit("submit_quiz_answer", {
        pin: currentPin,
        sessionId: currentSession._id || currentSession.sessionId,
        questionIndex: qIndex,
        selectedOptionIndex: optionIndex,
        timeElapsedSeconds: timeTaken,
        nickname: playerNick
      });
    }

    // 2. REST API call: Register score with backend and store verified results
    if (currentPin) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
      fetch(`${API_URL}/api/game/quiz/session/${encodeURIComponent(currentPin)}/submit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: playerNick,
          questionIndex: qIndex,
          answer: [optionIndex],
          answerIndex: optionIndex,
          timeTaken
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.currentScore === "number") {
            const isCorrect = Boolean(data.isCorrect);
            const points = data.points || 0;
            const newScore = data.currentScore;
            const newStreak = typeof data.streak === "number" ? data.streak : (isCorrect ? streakRef.current + 1 : 0);
            const correctIndex = typeof data.correctOptionIndex === "number" ? data.correctOptionIndex : optionIndex;

            pendingRoundResultRef.current = {
              qIndex,
              isCorrect,
              pointsAdded: points,
              correctOptionIndex: correctIndex,
              selectedOptionIndex: optionIndex,
              newScore,
              newStreak,
              rank: data.rank
            };
          }
        })
        .catch(() => {
          // Network delay - optimistic fallback will be used on reveal
        });
    }

    // Optimistic fallback recorded in ref so answer can be revealed when host triggers reveal or timer reaches 0
    if (!pendingRoundResultRef.current || pendingRoundResultRef.current.qIndex !== qIndex) {
      const correctIndex = currentQ?.correctOptionIndex ?? optionIndex;
      const points = Math.round(500 + Math.max(0, 1 - timeTaken / 30) * 500);
      pendingRoundResultRef.current = {
        qIndex,
        isCorrect: true,
        pointsAdded: points,
        correctOptionIndex: correctIndex,
        selectedOptionIndex: optionIndex,
        newScore: totalScoreRef.current + points,
        newStreak: streakRef.current + 1,
        rank: 1
      };
    }

    // CRITICAL: In live game, attendee remains in "answer_locked" state in lockstep with admin.
    // Reveal ONLY occurs when host sends socket reveal or when the synchronized question timer reaches 0.
  }, [clearAllTimers, triggerRoundReveal, addTimeout]);

  // Handler for question start / game start from host
  const handleQuestionStart = useCallback((data: Record<string, unknown>) => {
    if (!data) return;
    const q = normalizeQuestion(data);

    // Deduplication guard: ignore repeated start broadcasts for the active question
    if (
      currentQuestionRef.current &&
      currentQuestionRef.current.questionIndex === q.questionIndex &&
      (gameStateRef.current === "game_countdown" ||
       gameStateRef.current === "question_intro" ||
       gameStateRef.current === "question_active" ||
       gameStateRef.current === "answer_locked")
    ) {
      return;
    }

    pendingRoundResultRef.current = null;

    const isFromLobby =
      gameStateRef.current === "lobby" ||
      (q.questionIndex === 0 && (gameStateRef.current === "idle" || gameStateRef.current === "joining"));

    advanceToQuestion(q.questionIndex, totalScoreRef.current, streakRef.current, isFromLobby);
  }, [advanceToQuestion]);

  // Handler for question ended from host (or when timeLeft hits 0)
  const handleQuestionEnded = useCallback((data?: Record<string, unknown>) => {
    if (gameStateRef.current === "round_reveal" || gameStateRef.current === "game_over") return;

    const currentOption = selectedOptionIndexRef.current;
    const currentTotal = totalScoreRef.current;
    const currentStreakCount = streakRef.current;
    const activeQ = currentQuestionRef.current;
    const qIndex = Number(data?.questionIndex ?? activeQ?.questionIndex ?? 0);

    // If participant submitted and server returned verified results, use them!
    const pending = pendingRoundResultRef.current;
    if (pending && pending.qIndex === qIndex) {
      const correctOptionIndex = Number(
        data?.correctOptionIndex ??
        data?.correctAnswer ??
        pending.correctOptionIndex
      );
      triggerRoundReveal({
        ...pending,
        correctOptionIndex
      });
      pendingRoundResultRef.current = null;
      return;
    }

    // Otherwise, calculate points (or participant timed out)
    const correctOptionIndex = Number(
      data?.correctOptionIndex ??
      data?.correctAnswer ??
      activeQ?.correctOptionIndex ??
      0
    );
    const isCorrect =
      typeof data?.isCorrect === "boolean"
        ? data.isCorrect
        : currentOption !== null && currentOption === correctOptionIndex;

    const points =
      typeof data?.pointsAdded === "number"
        ? data.pointsAdded
        : (isCorrect ? Math.round(500 + Math.max(0, 1 - (timeLeftRef.current / 30)) * 500) : 0);

    const newScore = currentTotal + points;
    const newStreak = isCorrect ? currentStreakCount + 1 : 0;

    triggerRoundReveal({
      qIndex,
      isCorrect,
      pointsAdded: points,
      correctOptionIndex,
      selectedOptionIndex: currentOption,
      newScore,
      newStreak,
      rank: typeof data?.rank === "number" ? data.rank : undefined
    });
    pendingRoundResultRef.current = null;
  }, [triggerRoundReveal]);

  // Keep handleQuestionEndedRef up to date
  useEffect(() => {
    handleQuestionEndedRef.current = handleQuestionEnded;
  }, [handleQuestionEnded]);

  // Handler for game over from host
  const handleGameOver = useCallback((data?: Record<string, unknown>) => {
    const currentTotal = totalScoreRef.current;
    const playerNick = nicknameRef.current || "Player";
    const topLeaderboard = Array.isArray(data?.topLeaderboard)
      ? (data.topLeaderboard as Array<{ name: string; score: number; rank: number }>)
      : [
          { name: playerNick, score: currentTotal, rank: 1 },
          { name: "Sarah Chen", score: Math.max(0, currentTotal - 150), rank: 2 },
          { name: "Marcus Thorne", score: Math.max(0, currentTotal - 300), rank: 3 }
        ];

    completeGame(
      typeof data?.finalScore === "number" ? data.finalScore : currentTotal,
      typeof data?.finalRank === "number" ? data.finalRank : 1,
      topLeaderboard
    );
  }, [completeGame]);

  // Handler for question_display: the admin projector has rendered the question.
  // This is the ONLY place we call activateQuestion in live mode.
  const handleQuestionDisplay = useCallback((data: Record<string, unknown>) => {
    if (!data) return;
    if (isSandboxRef.current) return; // sandbox uses local timers

    const q = normalizeQuestion(data);

    // Deduplication guard: if we're already active on this question, skip
    if (
      currentQuestionRef.current &&
      currentQuestionRef.current.questionIndex === q.questionIndex &&
      (gameStateRef.current === 'question_active' || gameStateRef.current === 'answer_locked')
    ) {
      return;
    }

    clearAllTimers();
    pendingRoundResultRef.current = null;
    activateQuestion(q, totalScoreRef.current, streakRef.current);
  }, [clearAllTimers, activateQuestion]);

  // Handler for next_question / start events in LIVE mode:
  // Put the attendee into holding "game_countdown" (for Q0) or "question_intro" state,
  // ticking the visual countdown so attendee's screen is in step with admin screen,
  // but holding until question_display arrives before unlocking answers.
  const handleQuestionHold = useCallback((data: Record<string, unknown>) => {
    if (!data) return;
    if (isSandboxRef.current) {
      // In sandbox mode, use the full local flow
      handleQuestionStart(data);
      return;
    }

    const q = normalizeQuestion(data);

    // Deduplication guard
    if (
      currentQuestionRef.current &&
      currentQuestionRef.current.questionIndex === q.questionIndex &&
      (gameStateRef.current === 'game_countdown' ||
       gameStateRef.current === 'question_intro' ||
       gameStateRef.current === 'question_active' ||
       gameStateRef.current === 'answer_locked')
    ) {
      return;
    }

    clearAllTimers();
    pendingRoundResultRef.current = null;
    currentQuestionRef.current = q;
    selectedOptionIndexRef.current = null;

    const isFirst = q.questionIndex === 0 &&
      (gameStateRef.current === 'lobby' || gameStateRef.current === 'idle' || gameStateRef.current === 'joining');

    setCurrentQuestion(q);
    setSelectedOptionIndex(null);
    setRoundResult(null);

    if (isFirst) {
      gameStateRef.current = 'game_countdown';
      setGameState('game_countdown');
      setCountdownTimeLeft(5);

      let count = 5;
      const countInterval = setInterval(() => {
        count -= 1;
        setCountdownTimeLeft(Math.max(0, count));

        if (count <= 0) {
          clearInterval(countInterval);
          if (gameStateRef.current === 'game_countdown') {
            gameStateRef.current = 'question_intro';
            setGameState('question_intro');
            setIntroTimeLeft(3);

            let intro = 3;
            const introInterval = setInterval(() => {
              intro -= 1;
              setIntroTimeLeft(Math.max(0, intro));
              if (intro <= 0) {
                clearInterval(introInterval);
              }
            }, 1000);
            addTimeout(introInterval);
          }
        }
      }, 1000);
      addTimeout(countInterval);
    } else {
      gameStateRef.current = 'question_intro';
      setGameState('question_intro');
      setIntroTimeLeft(3);

      let intro = 3;
      const introInterval = setInterval(() => {
        intro -= 1;
        setIntroTimeLeft(Math.max(0, intro));
        if (intro <= 0) {
          clearInterval(introInterval);
        }
      }, 1000);
      addTimeout(introInterval);
    }

    // Safety fallback: if question_display never arrives within expected window + 4s, activate anyway
    const safetyMs = (isFirst ? 12 : 7) * 1000;
    const safetyTimer = setTimeout(() => {
      if (
        gameStateRef.current === 'game_countdown' ||
        gameStateRef.current === 'question_intro'
      ) {
        activateQuestion(q, totalScoreRef.current, streakRef.current);
      }
    }, safetyMs);
    addTimeout(safetyTimer);
  }, [clearAllTimers, activateQuestion, handleQuestionStart, addTimeout]);

  // Keep handleQuestionHoldRef up to date
  useEffect(() => {
    handleQuestionHoldRef.current = handleQuestionHold;
  }, [handleQuestionHold]);

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
        socket.emit("join_room", currentPin);
        socket.emit("join", currentPin);
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    if (socket.connected) {
      onConnect();
    }

    const currentPin = pin;
    const currentSessionId = sessionData?._id || sessionData?.sessionId || sessionData?.id;
    socket.emit("join_quiz_session", {
      pin: currentPin,
      sessionId: currentSessionId,
      nickname
    });
    socket.emit("join_room", currentPin);
    socket.emit("join", currentPin);

    const handleGameStateChange = (data: Record<string, unknown>) => {
      if (!data) return;
      const status = data.status || data.gameState || data.state;
      if (status === "active" || status === "in_progress" || status === "countdown" || status === "started") {
        handleQuestionHold(data);
      } else if (status === "reveal" || status === "revealed" || status === "round_reveal") {
        handleQuestionEnded(data);
      } else if (status === "finished" || status === "ended" || status === "game_over") {
        handleGameOver(data);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("question_display", handleQuestionDisplay);
    socket.on("game_started", handleQuestionHold);
    socket.on("quiz_started", handleQuestionHold);
    socket.on("start_quiz", handleQuestionHold);
    socket.on("admin_start", handleQuestionHold);
    socket.on("question_start", handleQuestionHold);
    socket.on("question_started", handleQuestionHold);
    socket.on("new_question", handleQuestionHold);
    socket.on("next_question", handleQuestionHold);
    socket.on("game_state_changed", handleGameStateChange);
    socket.on("state_change", handleGameStateChange);
    socket.on("session_updated", handleGameStateChange);
    socket.on("game_status", handleGameStateChange);
    socket.on("question_ended", handleQuestionEnded);
    socket.on("round_ended", handleQuestionEnded);
    socket.on("round_result", handleQuestionEnded);
    socket.on("reveal_answer", handleQuestionEnded);
    socket.on("answer_revealed", handleQuestionEnded);
    socket.on("show_results", handleQuestionEnded);
    socket.on("question_end", handleQuestionEnded);
    socket.on("time_up", handleQuestionEnded);
    socket.on("game_over", handleGameOver);
    socket.on("quiz_ended", handleGameOver);
    socket.on("game_ended", handleGameOver);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("question_display", handleQuestionDisplay);
      socket.off("game_started", handleQuestionHold);
      socket.off("quiz_started", handleQuestionHold);
      socket.off("start_quiz", handleQuestionHold);
      socket.off("admin_start", handleQuestionHold);
      socket.off("question_start", handleQuestionHold);
      socket.off("question_started", handleQuestionHold);
      socket.off("new_question", handleQuestionHold);
      socket.off("next_question", handleQuestionHold);
      socket.off("game_state_changed", handleGameStateChange);
      socket.off("state_change", handleGameStateChange);
      socket.off("session_updated", handleGameStateChange);
      socket.off("game_status", handleGameStateChange);
      socket.off("question_ended", handleQuestionEnded);
      socket.off("round_ended", handleQuestionEnded);
      socket.off("round_result", handleQuestionEnded);
      socket.off("reveal_answer", handleQuestionEnded);
      socket.off("answer_revealed", handleQuestionEnded);
      socket.off("show_results", handleQuestionEnded);
      socket.off("question_end", handleQuestionEnded);
      socket.off("time_up", handleQuestionEnded);
      socket.off("game_over", handleGameOver);
      socket.off("quiz_ended", handleGameOver);
      socket.off("game_ended", handleGameOver);
    };
  }, [isSandbox, sessionData, pin, nickname, handleQuestionStart, handleQuestionEnded, handleGameOver, handleQuestionHold, handleQuestionDisplay]);

  // Lobby Polling Guard: Detect when admin starts game
  useEffect(() => {
    if (gameState !== "lobby" || !sessionData || isSandbox) return;

    const currentPin = pin || sessionData?.pin;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
    let isSubscribed = true;

    const verifyLobbyState = async () => {
      if (!currentPin) return;
      try {
        const res = await fetch(`${API_URL}/api/game/quiz/session/${encodeURIComponent(currentPin)}`, {
          headers: { "Cache-Control": "no-cache" }
        }).catch(() => null);

        if (!res || !res.ok) return;
        const data = await res.json().catch(() => null);
        if (!isSubscribed || !data) return;

        const isLive =
          data.status === "active" ||
          data.status === "in_progress" ||
          data.status === "started" ||
          data.status === "countdown" ||
          Boolean(data.currentQuestion);

        if (isLive) {
          handleQuestionHold(data);
        }
      } catch {
        // Silently continue
      }
    };

    const pollTimer = setInterval(verifyLobbyState, 2000);
    return () => {
      isSubscribed = false;
      clearInterval(pollTimer);
    };
  }, [gameState, sessionData, pin, isSandbox, handleQuestionHold]);

  // Join Game via REST API + Socket.IO
  const joinGame = useCallback(async (gamePin: string, playerNickname: string): Promise<boolean> => {
    if (!gamePin || !playerNickname) return false;

    const normalizedPin = gamePin.trim().toUpperCase();
    const cleanNick = playerNickname.trim();

    setGameState("joining");
    setError("");
    setPin(normalizedPin);
    setNickname(cleanNick);
    setIsSandbox(false);
    isSandboxRef.current = false;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
      const res = await fetch(`${API_URL}/api/game/quiz/session/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: normalizedPin, nickname: cleanNick })
      });

      const data = await res.json();

      if (res.ok) {
        const session = data.session || data;
        setSessionData(session);
        sessionDataRef.current = session;

        const socket = initSocket();
        socket.emit("join_quiz_session", {
          pin: normalizedPin,
          sessionId: session._id || session.id || session.sessionId,
          nickname: cleanNick
        });
        socket.emit("join_room", normalizedPin);
        socket.emit("join", normalizedPin);

        const isAlreadyLive =
          session.status === "active" ||
          session.status === "in_progress" ||
          session.status === "started" ||
          session.status === "countdown" ||
          Boolean(session.currentQuestion);

        if (isAlreadyLive) {
          const q = normalizeQuestion(session);
          if (q.questionIndex > 0) {
            activateQuestion(q, 0, 0);
          } else {
            handleQuestionHold(session);
          }
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
  }, [handleQuestionHold, activateQuestion]);

  // Leave Game
  const leaveGame = useCallback(() => {
    clearAllTimers();

    const socket = getSocket();
    if (socket && pinRef.current) {
      socket.emit("leave_quiz_session", { pin: pinRef.current, nickname: nicknameRef.current });
    }

    gameStateRef.current = "idle";
    selectedOptionIndexRef.current = null;
    currentQuestionRef.current = null;
    isSandboxRef.current = false;

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
    setCountdownTimeLeft(5);
    setIntroTimeLeft(3);
    setError("");
    setIsSandbox(false);
  }, [clearAllTimers]);

  // Start Sandbox Demo Mode (Full Kahoot Lifecycle with Synchronized Countdown + Teaser + Podium)
  const startSandboxDemo = useCallback(() => {
    clearAllTimers();

    setIsSandbox(true);
    isSandboxRef.current = true;
    setPin("DEMO88");
    const demoNick = nickname || "AttendeePlayer";
    setNickname(demoNick);
    setSessionData({ _id: "demo_session_123", pin: "DEMO88", status: "waiting", totalQuestions: 3 });
    setGameState("lobby");
    setTotalScore(0);
    setStreak(0);

    // Simulate 1.5s in lobby then start the 5-second initial countdown
    const t = setTimeout(() => {
      advanceToQuestion(0, 0, 0, true);
    }, 1500);

    addTimeout(t);
  }, [clearAllTimers, nickname, advanceToQuestion, addTimeout]);

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
    countdownTimeLeft,
    introTimeLeft,
    error,
    isSandbox,
    isConnected,
    joinGame,
    submitAnswer,
    leaveGame,
    startSandboxDemo
  };
}
