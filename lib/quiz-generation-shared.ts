import {
  generatedQuestionsSchema,
  type GeneratedQuestion,
  type PersistedQuizSettings,
} from "@/lib/quiz-types";

export function buildQuizPrompt(
  text: string,
  settings: PersistedQuizSettings,
  pageRangeLabel: string,
): string {
  const questionTypeInstruction =
    settings.questionType === "mixed"
      ? "Use a mix of multiple-choice and true-false questions."
      : settings.questionType === "multiple-choice"
        ? "Use only multiple-choice questions with exactly 4 options each."
        : "Use only true-false questions.";

  return `You are an expert educator creating quiz questions from study material.

Generate exactly ${settings.questionCount} quiz questions based ONLY on the source text below.
Difficulty: ${settings.difficulty}.
${questionTypeInstruction}

Rules:
- Questions must be answerable from the provided text alone.
- Multiple-choice questions must have exactly 4 distinct options and one correct answer.
- True-false questions must not include an options array.
- For true-false, set correctAnswer to "true" or "false" (lowercase).
- For multiple-choice, correctAnswer must exactly match one of the options.
- Keep questions clear and unambiguous.
- Include a brief explanation for each answer.

Source pages: ${pageRangeLabel}

SOURCE TEXT:
"""
${text}
"""`;
}

export function normalizeGeneratedQuestions(
  raw: GeneratedQuestion[],
): GeneratedQuestion[] {
  return raw.map((question) => {
    if (question.type === "true-false") {
      const answer =
        typeof question.correctAnswer === "boolean"
          ? question.correctAnswer
          : question.correctAnswer.toLowerCase() === "true";

      return {
        ...question,
        options: undefined,
        correctAnswer: answer,
      };
    }

    if (!question.options || question.options.length < 2) {
      throw new Error("Multiple-choice questions must include options.");
    }

    const correctText =
      typeof question.correctAnswer === "string"
        ? question.correctAnswer
        : String(question.correctAnswer);

    if (!question.options.includes(correctText)) {
      throw new Error(
        `Correct answer "${correctText}" must match one of the provided options.`,
      );
    }

    return {
      ...question,
      correctAnswer: correctText,
    };
  });
}

export function parseGeneratedQuestions(
  responseText: string,
  expectedCount: number,
): GeneratedQuestion[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error("The AI returned invalid JSON.");
  }

  const validated = generatedQuestionsSchema.safeParse(parsed);

  if (!validated.success) {
    console.error(
      "[quiz-generation] Response validation failed:",
      validated.error.flatten(),
    );
    throw new Error(
      "The AI response did not match the expected question format.",
    );
  }

  if (validated.data.questions.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} questions but received ${validated.data.questions.length}.`,
    );
  }

  return normalizeGeneratedQuestions(validated.data.questions);
}
