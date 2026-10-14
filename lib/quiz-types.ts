import { z } from "zod";

export const MIN_QUESTION_COUNT = 5;
export const MAX_QUESTION_COUNT = 50;
export const MIN_TIMER_MINUTES = 1;
export const MAX_TIMER_MINUTES = 120;
export const MAX_QUIZ_TITLE_LENGTH = 80;

function normalizeQuizTitle(title: string): string {
  return title.replace(/\s+/g, " ").trim().slice(0, MAX_QUIZ_TITLE_LENGTH);
}

export const quizTitleSchema = z
  .string()
  .transform(normalizeQuizTitle)
  .refine((title) => title.length > 0, "Enter a quiz name.");

const difficultySchema = z.enum(["easy", "medium", "hard"]);
const questionTypeSchema = z.enum(["multiple-choice", "true-false", "mixed"]);
const answerRevealSchema = z.enum(["immediate", "end", "never"]);
const generatedQuestionTypeSchema = z.enum(["multiple-choice", "true-false"]);

export type GeneratedQuestionType = z.infer<typeof generatedQuestionTypeSchema>;

export const persistedQuizSettingsSchema = z.object({
  questionCount: z
    .number()
    .int()
    .min(MIN_QUESTION_COUNT)
    .max(MAX_QUESTION_COUNT),
  timerEnabled: z.boolean(),
  timerMinutes: z.number().int().min(MIN_TIMER_MINUTES).max(MAX_TIMER_MINUTES),
  difficulty: difficultySchema,
  questionType: questionTypeSchema,
  answerReveal: answerRevealSchema,
  shuffleQuestions: z.boolean(),
  shuffleAnswers: z.boolean(),
  pageStart: z.number().int().min(1),
  pageEnd: z.number().int().min(1),
  pageRange: z.string().min(1).optional(),
});

export type PersistedQuizSettings = z.infer<typeof persistedQuizSettingsSchema>;

export function formatQuizPageRange(settings: PersistedQuizSettings): string {
  return settings.pageRange ?? `${settings.pageStart}-${settings.pageEnd}`;
}

/** Settings that can be changed after a quiz is created (no re-generation). */
export const editableQuizSettingsSchema = persistedQuizSettingsSchema.pick({
  timerEnabled: true,
  timerMinutes: true,
  answerReveal: true,
  shuffleQuestions: true,
  shuffleAnswers: true,
});

export type EditableQuizSettings = z.infer<typeof editableQuizSettingsSchema>;

export function pickEditableQuizSettings(
  settings: PersistedQuizSettings,
): EditableQuizSettings {
  return editableQuizSettingsSchema.parse(settings);
}

export const generatedQuestionSchema = z.object({
  type: generatedQuestionTypeSchema,
  question: z.string().min(1),
  options: z.array(z.string().min(1)).nullish(),
  correctAnswer: z.union([z.string().min(1), z.boolean()]),
  explanation: z.string().nullish(),
});

export const generatedQuizSchema = z.object({
  title: quizTitleSchema,
  questions: z.array(generatedQuestionSchema).min(1),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type GeneratedQuiz = {
  title: string;
  questions: GeneratedQuestion[];
};

export type PlayQuestion = {
  id: string;
  type: GeneratedQuestionType;
  question: string;
  options: string[] | null;
  correctAnswer: string | boolean;
  explanation: string | null;
  order: number;
};
