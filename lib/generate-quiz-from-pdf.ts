import { generateQuizQuestions } from "@/lib/generate-quiz-questions";
import { parsePageRangeSpec } from "@/lib/page-range";
import { decodePdfBase64, deriveQuizTitle } from "@/lib/pdf-limits";
import { extractPdfTextFromPages, getPdfPageCount } from "@/lib/pdf";
import {
  formatQuizPageRange,
  type GeneratedQuestion,
  type PersistedQuizSettings,
} from "@/lib/quiz-types";
import { toUserFacingError } from "@/lib/user-facing-errors";
import { TRPCError } from "@trpc/server";

export { GUEST_MAX_PAGES, GUEST_MAX_QUESTIONS } from "@/lib/pdf-limits";
export { decodePdfBase64, deriveQuizTitle } from "@/lib/pdf-limits";

export type GenerateQuizFromPdfInput = {
  pdfBase64: string;
  fileName: string;
  settings: PersistedQuizSettings;
  maxPages?: number;
  maxQuestionCount?: number;
  forceDifficulty?: PersistedQuizSettings["difficulty"];
};

export type GenerateQuizFromPdfResult = {
  title: string;
  sourceFileName: string;
  persistedSettings: PersistedQuizSettings;
  questions: GeneratedQuestion[];
};

export async function generateQuizFromPdf(
  input: GenerateQuizFromPdfInput,
): Promise<GenerateQuizFromPdfResult> {
  const buffer = decodePdfBase64(input.pdfBase64);
  const pageCount = await getPdfPageCount(buffer);

  const pageRangeSpec =
    input.settings.pageRange ??
    `${input.settings.pageStart}-${input.settings.pageEnd}`;

  let selectedPages: number[];
  try {
    selectedPages = parsePageRangeSpec(pageRangeSpec, pageCount);
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error instanceof Error ? error.message : "Invalid page range.",
    });
  }

  if (input.maxPages !== undefined && selectedPages.length > input.maxPages) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Free quizzes are limited to ${input.maxPages} pages. Sign in with Google to use more pages or choose a smaller page range.`,
    });
  }

  const questionCount = input.maxQuestionCount
    ? Math.min(input.settings.questionCount, input.maxQuestionCount)
    : input.settings.questionCount;

  const persistedSettings: PersistedQuizSettings = {
    ...input.settings,
    questionCount,
    difficulty: input.forceDifficulty ?? input.settings.difficulty,
    pageRange: pageRangeSpec,
    pageStart: selectedPages[0],
    pageEnd: selectedPages[selectedPages.length - 1],
  };

  let extractedText: string;
  try {
    extractedText = await extractPdfTextFromPages(buffer, selectedPages);
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        error instanceof Error
          ? error.message
          : "Failed to extract text from the PDF.",
    });
  }

  let questions: GeneratedQuestion[];
  try {
    questions = await generateQuizQuestions(
      extractedText,
      persistedSettings,
      formatQuizPageRange(persistedSettings),
    );
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: toUserFacingError(
        error,
        "Could not generate quiz questions. Please try again.",
      ),
    });
  }

  return {
    title: deriveQuizTitle(input.fileName),
    sourceFileName: input.fileName,
    persistedSettings,
    questions,
  };
}
