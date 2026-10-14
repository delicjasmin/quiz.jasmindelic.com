/**
 * Ensures every question has a canonical `options` array.
 * For true/false questions the LLM may omit options entirely; we always store
 * the two explicit strings so the player never has to special-case them.
 */
export function normalizeQuestionOptions(
  type: string,
  options: string[] | null | undefined,
): string[] {
  if (type === "multiple-choice") return options ?? [];
  return ["True", "False"];
}

export function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function deriveQuizTitle(fileName: string): string {
  return fileName.replace(/\.pdf$/i, "").trim() || "Untitled Quiz";
}

export function formatQuizDate(date: Date | string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}
