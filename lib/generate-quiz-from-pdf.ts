import { generateQuizQuestions } from "@/lib/generate-quiz-questions";
import { parsePageRangeSpec } from "@/lib/page-range";
import {
  NO_EXTRACTABLE_TEXT_MESSAGE,
  SOURCE_TEXT_TOO_LONG_MESSAGE,
  sourceTextTooLong,
} from "@/lib/pdf-limits";
import {
  formatQuizPageRange,
  type GeneratedQuestion,
  type PersistedQuizSettings,
} from "@/lib/quiz-types";
import {
  guestPageLimitMessage,
  toUserFacingError,
} from "@/lib/user-facing-errors";
import { TRPCError } from "@trpc/server";

type GenerateQuizFromPdfInput = {
  sourceText: string;
  pageCount: number;
  fileName: string;
  settings: PersistedQuizSettings;
  maxPages?: number;
  maxQuestionCount?: number;
  forceDifficulty?: PersistedQuizSettings["difficulty"];
};

type GenerateQuizFromPdfResult = {
  title: string;
  sourceFileName: string;
  persistedSettings: PersistedQuizSettings;
  questions: GeneratedQuestion[];
};

export async function generateQuizFromPdf(
  input: GenerateQuizFromPdfInput,
): Promise<GenerateQuizFromPdfResult> {
  const pageCount = input.pageCount;
  const sourceText = input.sourceText.trim();

  if (!sourceText) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: NO_EXTRACTABLE_TEXT_MESSAGE,
    });
  }

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
      message: guestPageLimitMessage(input.maxPages),
    });
  }

  if (sourceTextTooLong(sourceText, selectedPages.length)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: SOURCE_TEXT_TOO_LONG_MESSAGE,
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

  let generated: Awaited<ReturnType<typeof generateQuizQuestions>>;
  try {
    generated = await generateQuizQuestions(
      sourceText,
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
    title: generated.title,
    sourceFileName: input.fileName,
    persistedSettings,
    questions: generated.questions,
  };
}
