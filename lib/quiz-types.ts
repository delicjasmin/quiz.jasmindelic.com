import { z } from "zod";

export const difficultySchema = z.enum(["easy", "medium", "hard"]);
export const questionTypeSchema = z.enum([
  "multiple-choice",
  "true-false",
  "mixed",
]);
export const answerRevealSchema = z.enum(["immediate", "end", "never"]);

export const persistedQuizSettingsSchema = z.object({
  questionCount: z.number().int().min(5).max(50),
  timerEnabled: z.boolean(),
  timerMinutes: z.number().int().min(1).max(120),
  difficulty: difficultySchema,
  questionType: questionTypeSchema,
  answerReveal: answerRevealSchema,
  shuffleQuestions: z.boolean(),
  shuffleAnswers: z.boolean(),
  pageStart: z.number().int().min(1),
  pageEnd: z.number().int().min(1),
});

export type PersistedQuizSettings = z.infer<typeof persistedQuizSettingsSchema>;

export const generatedQuestionSchema = z.object({
  type: z.enum(["multiple-choice", "true-false"]),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).optional(),
  correctAnswer: z.union([z.string().min(1), z.boolean()]),
  explanation: z.string().optional(),
});

export const generatedQuestionsSchema = z.object({
  questions: z.array(generatedQuestionSchema).min(1),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
