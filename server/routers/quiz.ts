import { generateQuizQuestions } from "@/lib/gemini";
import { extractPdfText, getPdfPageCount } from "@/lib/pdf";
import { persistedQuizSettingsSchema } from "@/lib/quiz-types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

const settingsInputSchema = persistedQuizSettingsSchema;

function decodePdfBase64(pdfBase64: string): Buffer {
  const buffer = Buffer.from(pdfBase64, "base64");

  if (buffer.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The uploaded PDF is empty.",
    });
  }

  if (buffer.length > MAX_PDF_BYTES) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The PDF exceeds the 10MB size limit.",
    });
  }

  return buffer;
}

function deriveQuizTitle(fileName: string): string {
  return fileName.replace(/\.pdf$/i, "").trim() || "Untitled Quiz";
}

export const quizRouter = router({
  getPdfInfo: protectedProcedure
    .input(z.object({ pdfBase64: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const buffer = decodePdfBase64(input.pdfBase64);
      const pageCount = await getPdfPageCount(buffer);
      return { pageCount };
    }),

  generate: protectedProcedure
    .input(
      z.object({
        pdfBase64: z.string().min(1),
        fileName: z.string().min(1),
        settings: settingsInputSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const buffer = decodePdfBase64(input.pdfBase64);
      const pageCount = await getPdfPageCount(buffer);

      if (input.settings.pageStart > pageCount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Start page must be between 1 and ${pageCount}.`,
        });
      }

      if (input.settings.pageEnd > pageCount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `End page must be between 1 and ${pageCount}.`,
        });
      }

      if (input.settings.pageStart > input.settings.pageEnd) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start page must be less than or equal to end page.",
        });
      }

      const pageRange = {
        start: input.settings.pageStart,
        end: input.settings.pageEnd,
      };

      let extractedText: string;
      try {
        extractedText = await extractPdfText(buffer, pageRange);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Failed to extract text from the PDF.",
        });
      }

      let questions;
      try {
        questions = await generateQuizQuestions(
          extractedText,
          input.settings,
          pageRange,
        );
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to generate quiz questions.",
        });
      }

      const quiz = await ctx.prisma.quiz.create({
        data: {
          title: deriveQuizTitle(input.fileName),
          sourceFileName: input.fileName,
          settings: input.settings,
          userId: ctx.session.user.id,
          questions: {
            create: questions.map((question, index) => ({
              type: question.type,
              question: question.question,
              options:
                question.type === "multiple-choice"
                  ? question.options
                  : ["True", "False"],
              correctAnswer: question.correctAnswer,
              explanation: question.explanation,
              order: index + 1,
            })),
          },
        },
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
        },
      });

      return {
        quizId: quiz.id,
        title: quiz.title,
        questionCount: quiz.questions.length,
      };
    }),
});
