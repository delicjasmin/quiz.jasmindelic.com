import type {
  GeneratedQuestion,
  PersistedQuizSettings,
  PlayQuestion,
} from "@/lib/quiz-types";
import { normalizeQuestionOptions } from "@/lib/quiz-utils";
import { GUEST_LIFETIME_LIMIT } from "@/lib/usage-limits";

const STORAGE_KEY = "quiz-app:guest-quizzes:v1";
const GUEST_QUIZZES_CHANGED_EVENT = "quiz-app:guest-quizzes-changed";
const EMPTY_GUEST_QUIZZES: GuestQuiz[] = [];

let cachedRaw: string | null | undefined;
let cachedSnapshot: GuestQuiz[] = EMPTY_GUEST_QUIZZES;

function notifyGuestQuizzesChanged(): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(GUEST_QUIZZES_CHANGED_EVENT));
}

function invalidateGuestQuizzesCache(): void {
  cachedRaw = undefined;
}

function readGuestQuizzesFromStorage(): GuestQuiz[] {
  if (!isBrowser()) return EMPTY_GUEST_QUIZZES;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedSnapshot;

    cachedRaw = raw;
    if (!raw) {
      cachedSnapshot = EMPTY_GUEST_QUIZZES;
      return cachedSnapshot;
    }

    const parsed = JSON.parse(raw) as GuestQuiz[];
    cachedSnapshot = Array.isArray(parsed) ? parsed : EMPTY_GUEST_QUIZZES;
    return cachedSnapshot;
  } catch {
    cachedRaw = null;
    cachedSnapshot = EMPTY_GUEST_QUIZZES;
    return cachedSnapshot;
  }
}

function persistGuestQuizzes(quizzes: GuestQuiz[]): void {
  if (quizzes.length === 0) {
    localStorage.removeItem(STORAGE_KEY);
    cachedRaw = null;
    cachedSnapshot = EMPTY_GUEST_QUIZZES;
  } else {
    const raw = JSON.stringify(quizzes);
    localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedSnapshot = quizzes;
  }
  notifyGuestQuizzesChanged();
}

export type GuestQuiz = {
  localId: string;
  title: string;
  sourceFileName: string;
  settings: PersistedQuizSettings;
  questions: PlayQuestion[];
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
): PlayQuestion {
  return {
    id: `${localId}-q${order}`,
    type: question.type,
    question: question.question,
    options: normalizeQuestionOptions(question.type, question.options),
    correctAnswer: question.correctAnswer,
    explanation: question.explanation ?? null,
    order,
  };
}

export function subscribeGuestQuizzes(onStoreChange: () => void): () => void {
  if (!isBrowser()) return () => {};

  const handler = () => {
    invalidateGuestQuizzesCache();
    onStoreChange();
  };
  window.addEventListener(GUEST_QUIZZES_CHANGED_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(GUEST_QUIZZES_CHANGED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function getGuestQuizzes(): GuestQuiz[] {
  return readGuestQuizzesFromStorage();
}

export function getGuestQuizzesServerSnapshot(): GuestQuiz[] {
  return EMPTY_GUEST_QUIZZES;
}

export function getGuestQuiz(localId: string): GuestQuiz | null {
  return (
    readGuestQuizzesFromStorage().find((quiz) => quiz.localId === localId) ??
    null
  );
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

  const existing = readGuestQuizzesFromStorage().filter(
    (item) => item.localId !== quiz.localId,
  );
  const next = [quiz, ...existing].slice(0, GUEST_LIFETIME_LIMIT);
  persistGuestQuizzes(next);

  return quiz;
}

export function removeGuestQuiz(localId: string): void {
  if (!isBrowser()) return;

  const next = readGuestQuizzesFromStorage().filter(
    (quiz) => quiz.localId !== localId,
  );
  persistGuestQuizzes(next);
}

export function clearGuestQuizzes(): void {
  if (!isBrowser()) return;
  persistGuestQuizzes([]);
}

export function createGuestLocalId(): string {
  return crypto.randomUUID();
}
