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

export interface UseQuizSocketReturn {
  gameState: GameState;
  pin: string;
  nickname: string;
  sessionData: any;
  currentQuestion: QuizQuestion | null;
  roundResult: QuizRoundResult | null;
  gameOverData: QuizGameOverData | null;
  selectedOptionIndex: number | null;
  totalScore: number;
  streak: number;
  timeLeft: number;
  error: string;
  isSandbox: boolean;
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

export function useQuizSocket(): UseQuizSocketReturn {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState("");
  const [sessionData, setSessionData] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [roundResult, setRoundResult] = useState<QuizRoundResult | null>(null);
  const [gameOverData, setGameOverData] = useState<QuizGameOverData | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState("");
  const [isSandbox, setIsSandbox] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sandboxStepRef = useRef<number>(0);
  const sandboxTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      sandboxTimeouts.current.forEach(clearTimeout);
    };
  }, []);

  // Countdown timer for active questions
  useEffect(() => {
    if (gameState === "question_active" && timeLeft > 0) {
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

  // Real-time socket event listeners
  useEffect(() => {
    if (isSandbox || !sessionData) return;

    const socket = getSocket();
    if (!socket) return;

    const currentPin = pin;
    const currentSessionId = sessionData?._id || sessionData?.sessionId || sessionData?.id;

    // Join room on socket
    socket.emit("join_quiz_session", {
      pin: currentPin,
      sessionId: currentSessionId,
      nickname
    });

    // Listen for game started / question start
    const handleQuestionStart = (data: any) => {
      const q: QuizQuestion = {
        questionIndex: data.questionIndex ?? 0,
        totalQuestions: data.totalQuestions ?? 5,
        question: data.question || data.title || "Question",
        options: data.options || [],
        timeLimitSeconds: data.timeLimitSeconds || data.duration || 15,
        imageUrl: data.imageUrl
      };

      setCurrentQuestion(q);
      setTimeLeft(q.timeLimitSeconds);
      setSelectedOptionIndex(null);
      setRoundResult(null);
      setGameState("question_active");
    };

    // Listen for round end / reveal
    const handleQuestionEnded = (data: any) => {
      const isCorrect = data.isCorrect ?? (data.correctOptionIndex === selectedOptionIndex);
      const points = data.pointsAdded ?? (isCorrect ? Math.max(100, Math.round(timeLeft * 50)) : 0);
      const newScore = totalScore + points;
      const newStreak = isCorrect ? streak + 1 : 0;

      setTotalScore(newScore);
      setStreak(newStreak);

      setRoundResult({
        questionIndex: data.questionIndex ?? (currentQuestion?.questionIndex ?? 0),
        correctOptionIndex: data.correctOptionIndex ?? 0,
        selectedOptionIndex,
        isCorrect,
        pointsAdded: points,
        totalScore: newScore,
        streak: newStreak,
        rank: data.rank
      });

      setGameState("round_reveal");
    };

    // Listen for game over
    const handleGameOver = (data: any) => {
      setGameOverData({
        sessionId: currentSessionId,
        finalScore: data.finalScore ?? totalScore,
        finalRank: data.finalRank ?? 1,
        totalParticipants: data.totalParticipants ?? 24,
        topLeaderboard: data.topLeaderboard || [
          { name: nickname, score: totalScore, rank: 1 },
          { name: "Sarah Chen", score: Math.max(0, totalScore - 150), rank: 2 },
          { name: "Marcus Thorne", score: Math.max(0, totalScore - 300), rank: 3 }
        ]
      });
      setGameState("game_over");
    };

    socket.on("game_started", handleQuestionStart);
    socket.on("question_start", handleQuestionStart);
    socket.on("new_question", handleQuestionStart);
    socket.on("question_ended", handleQuestionEnded);
    socket.on("round_ended", handleQuestionEnded);
    socket.on("game_over", handleGameOver);
    socket.on("quiz_ended", handleGameOver);

    return () => {
      socket.off("game_started", handleQuestionStart);
      socket.off("question_start", handleQuestionStart);
      socket.off("new_question", handleQuestionStart);
      socket.off("question_ended", handleQuestionEnded);
      socket.off("round_ended", handleQuestionEnded);
      socket.off("game_over", handleGameOver);
      socket.off("quiz_ended", handleGameOver);
    };
  }, [isSandbox, sessionData, pin, nickname, selectedOptionIndex, totalScore, streak, currentQuestion, timeLeft]);

  // Join Game via API + Socket
  const joinGame = useCallback(async (gamePin: string, playerNickname: string): Promise<boolean> => {
    if (!gamePin || !playerNickname) return false;

    setGameState("joining");
    setError("");
    setPin(gamePin.toUpperCase());
    setNickname(playerNickname);
    setIsSandbox(false);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://eventeevapi.onrender.com";
      const res = await fetch(`${API_URL}/api/game/quiz/session/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: gamePin.toUpperCase(), nickname: playerNickname })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSessionData(data);
        const socket = initSocket();
        socket.emit("join_quiz_session", {
          pin: gamePin.toUpperCase(),
          sessionId: data._id || data.sessionId,
          nickname: playerNickname
        });

        // Check if game was ALREADY started
        if (data.status === "in_progress" || data.status === "active" || data.currentQuestion) {
          const q: QuizQuestion = {
            questionIndex: data.currentQuestionIndex || 0,
            totalQuestions: data.totalQuestions || 5,
            question: data.currentQuestion?.question || "Question in progress",
            options: data.currentQuestion?.options || ["A", "B", "C", "D"],
            timeLimitSeconds: data.currentQuestion?.timeLimit || 15
          };
          setCurrentQuestion(q);
          setTimeLeft(q.timeLimitSeconds);
          setGameState("question_active");
        } else {
          setGameState("lobby");
        }
        return true;
      } else {
        // If live session not found, we inform the user but also provide sandbox option
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
  }, []);

  // Submit Answer
  const submitAnswer = useCallback((optionIndex: number) => {
    if (gameState !== "question_active" || selectedOptionIndex !== null) return;

    setSelectedOptionIndex(optionIndex);
    setGameState("answer_locked");

    if (isSandbox) {
      // Sandbox mode will trigger round reveal automatically in timeout
      return;
    }

    // Emit answer via socket
    const socket = getSocket();
    if (socket && sessionData) {
      socket.emit("submit_quiz_answer", {
        pin,
        sessionId: sessionData?._id || sessionData?.sessionId,
        questionIndex: currentQuestion?.questionIndex ?? 0,
        selectedOptionIndex: optionIndex,
        timeElapsedSeconds: (currentQuestion?.timeLimitSeconds ?? 15) - timeLeft,
        nickname
      });
    }
  }, [gameState, selectedOptionIndex, isSandbox, pin, sessionData, currentQuestion, timeLeft, nickname]);

  // Leave Game
  const leaveGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    sandboxTimeouts.current.forEach(clearTimeout);

    const socket = getSocket();
    if (socket && pin) {
      socket.emit("leave_quiz_session", { pin, nickname });
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
  }, [pin, nickname]);

  // Sandbox demo flow for instant local testing of all Kahoot phases
  const startSandboxDemo = useCallback(() => {
    setIsSandbox(true);
    setPin("DEMO88");
    setNickname(nickname || "ChampionPlayer");
    setSessionData({ _id: "demo_session_123", pin: "DEMO88", status: "waiting" });
    setGameState("lobby");
    setTotalScore(0);
    setStreak(0);
    sandboxStepRef.current = 0;

    sandboxTimeouts.current.forEach(clearTimeout);
    sandboxTimeouts.current = [];

    // Simulate 3 seconds in lobby then start Q1
    const t1 = setTimeout(() => {
      runSandboxQuestion(0, 0, 0);
    }, 3000);
    sandboxTimeouts.current.push(t1);
  }, [nickname]);

  const runSandboxQuestion = (qIndex: number, currentPoints: number, currentStreak: number) => {
    if (qIndex >= DEMO_QUESTIONS.length) {
      // Game Over
      setGameOverData({
        sessionId: "demo_session_123",
        finalScore: currentPoints,
        finalRank: 1,
        totalParticipants: 42,
        topLeaderboard: [
          { name: nickname || "ChampionPlayer", score: currentPoints, rank: 1 },
          { name: "Elena Kovic", score: Math.max(1200, currentPoints - 100), rank: 2 },
          { name: "Marcus Thorne", score: Math.max(900, currentPoints - 350), rank: 3 }
        ]
      });
      setGameState("game_over");
      return;
    }

    const q = DEMO_QUESTIONS[qIndex];
    setCurrentQuestion(q);
    setTimeLeft(q.timeLimitSeconds);
    setSelectedOptionIndex(null);
    setRoundResult(null);
    setGameState("question_active");

    // Auto advance question after timeLimit + 1s if user doesn't answer
    const autoAdvanceTimeout = setTimeout(() => {
      setSelectedOptionIndex((prevChoice) => {
        const chosen = prevChoice;
        const correctIndex = DEMO_CORRECT_ANSWERS[qIndex];
        const isCorrect = chosen === correctIndex;
        const added = isCorrect ? 500 + Math.round(Math.random() * 200) : 0;
        const newScore = currentPoints + added;
        const newStreak = isCorrect ? currentStreak + 1 : 0;

        setTotalScore(newScore);
        setStreak(newStreak);

        setRoundResult({
          questionIndex: qIndex,
          correctOptionIndex: correctIndex,
          selectedOptionIndex: chosen,
          isCorrect,
          pointsAdded: added,
          totalScore: newScore,
          streak: newStreak,
          rank: 1
        });

        setGameState("round_reveal");

        // After 4s on round reveal, move to next question or game over
        const nextQTimeout = setTimeout(() => {
          runSandboxQuestion(qIndex + 1, newScore, newStreak);
        }, 4000);
        sandboxTimeouts.current.push(nextQTimeout);

        return chosen;
      });
    }, (q.timeLimitSeconds + 1) * 1000);

    sandboxTimeouts.current.push(autoAdvanceTimeout);
  };

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
    joinGame,
    submitAnswer,
    leaveGame,
    startSandboxDemo
  };
}
