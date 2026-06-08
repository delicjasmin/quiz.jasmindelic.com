import { generateQuizQuestions } from "@/lib/gemini";
import { extractPdfText, getPdfPageCount } from "@/lib/pdf";
import {
  editableQuizSettingsSchema,
  persistedQuizSettingsSchema,
} from "@/lib/quiz-types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

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

async function assertQuizOwner(
  ctx: { prisma: typeof import("@/lib/prisma").default },
  quizId: string,
  userId: string,
) {
  const quiz = await ctx.prisma.quiz.findFirst({
    where: { id: quizId, userId },
  });

  if (!quiz) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Quiz not found.",
    });
  }

  return quiz;
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

  listMine: protectedProcedure.query(async ({ ctx }) => {
    const quizzes = await ctx.prisma.quiz.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    return quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      sourceFileName: quiz.sourceFileName,
      isShared: quiz.isShared,
      sharedAt: quiz.sharedAt,
      createdAt: quiz.createdAt,
      questionCount: quiz._count.questions,
      settings: persistedQuizSettingsSchema.parse(quiz.settings),
    }));
  }),

  getForPlay: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const quiz = await ctx.prisma.quiz.findUnique({
        where: { id: input.id },
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (!quiz) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quiz not found.",
        });
      }

      const isOwner = ctx.session?.user?.id === quiz.userId;

      if (!isOwner && !quiz.isShared) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this quiz.",
        });
      }

      return {
        id: quiz.id,
        title: quiz.title,
        sourceFileName: quiz.sourceFileName,
        settings: quiz.settings,
        isOwner,
        isShared: quiz.isShared,
        questions: quiz.questions.map((question) => ({
          id: question.id,
          type: question.type,
          question: question.question,
          options: question.options as string[] | null,
          correctAnswer: question.correctAnswer as string | boolean,
          explanation: question.explanation,
          order: question.order,
        })),
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertQuizOwner(ctx, input.id, ctx.session.user.id);
      await ctx.prisma.quiz.delete({ where: { id: input.id } });
      return { success: true };
    }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        settings: editableQuizSettingsSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const quiz = await assertQuizOwner(ctx, input.id, ctx.session.user.id);
      const existing = persistedQuizSettingsSchema.parse(quiz.settings);
      const settings = { ...existing, ...input.settings };

      const updated = await ctx.prisma.quiz.update({
        where: { id: input.id },
        data: { settings },
      });

      return {
        id: updated.id,
        settings: persistedQuizSettingsSchema.parse(updated.settings),
      };
    }),

  setShared: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isShared: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertQuizOwner(ctx, input.id, ctx.session.user.id);

      const quiz = await ctx.prisma.quiz.update({
        where: { id: input.id },
        data: {
          isShared: input.isShared,
          sharedAt: input.isShared ? new Date() : null,
        },
      });

      return {
        id: quiz.id,
        isShared: quiz.isShared,
        sharedAt: quiz.sharedAt,
      };
    }),
});
