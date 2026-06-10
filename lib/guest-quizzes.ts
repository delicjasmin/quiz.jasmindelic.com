import type { GeneratedQuestion, PersistedQuizSettings } from "@/lib/quiz-types";

const STORAGE_KEY = "quiz-app:guest-quizzes:v1";
const MAX_STORED_QUIZZES = 3;

export type GuestQuizQuestion = {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  correctAnswer: string | boolean;
  explanation: string | null;
  order: number;
};

export type GuestQuiz = {
  localId: string;
  title: string;
  sourceFileName: string;
  settings: PersistedQuizSettings;
  questions: GuestQuizQuestion[];
  createdAt: string;
};

export type GuestQuizGenerateResult = {
  localId: string;
  title: string;
  sourceFileName: string;
  settings: PersistedQuizSettings;
  questions: GeneratedQuestion[];
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function toPlayQuestion(
  question: GeneratedQuestion,
  order: number,
  localId: string,
): GuestQuizQuestion {
  return {
    id: `${localId}-q${order}`,
    type: question.type,
    question: question.question,
    options:
      question.type === "multiple-choice"
        ? (question.options ?? [])
        : ["True", "False"],
    correctAnswer: question.correctAnswer,
    explanation: question.explanation ?? null,
    order,
  };
}

export function listGuestQuizzes(): GuestQuiz[] {
  if (!isBrowser()) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as GuestQuiz[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getGuestQuiz(localId: string): GuestQuiz | null {
  return listGuestQuizzes().find((quiz) => quiz.localId === localId) ?? null;
}

export function saveGuestQuiz(payload: GuestQuizGenerateResult): GuestQuiz {
  const quiz: GuestQuiz = {
    localId: payload.localId,
    title: payload.title,
    sourceFileName: payload.sourceFileName,
    settings: payload.settings,
    questions: payload.questions.map((question, index) =>
      toPlayQuestion(question, index + 1, payload.localId),
    ),
    createdAt: new Date().toISOString(),
  };

  if (!isBrowser()) return quiz;

  const existing = listGuestQuizzes().filter(
    (item) => item.localId !== quiz.localId,
  );
  const next = [quiz, ...existing].slice(0, MAX_STORED_QUIZZES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  return quiz;
}

export function clearGuestQuizzes(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
}

export function guestQuizzesForImport(): GuestQuiz[] {
  return listGuestQuizzes();
}

export function createGuestLocalId(): string {
  if (isBrowser() && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `guest-${Date.now()}`;
}
