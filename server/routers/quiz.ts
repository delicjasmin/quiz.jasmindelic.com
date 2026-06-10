import {
  decodePdfBase64,
  generateQuizFromPdf,
  GUEST_MAX_PAGES,
  GUEST_MAX_QUESTIONS,
} from "@/lib/generate-quiz-from-pdf";
import type { Prisma } from "@/lib/generated/prisma/client";
import { getPdfPageCount } from "@/lib/pdf";
import {
  type GeneratedQuestion,
  editableQuizSettingsSchema,
  generatedQuestionSchema,
  persistedQuizSettingsSchema,
} from "@/lib/quiz-types";
import {
  assertCanGenerate,
  assertCanGetPdfInfo,
  getUsageQuota,
  recordUsageEvent,
  USAGE_ACTIONS,
} from "@/lib/usage-quota";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

const settingsInputSchema = persistedQuizSettingsSchema;

const guestQuizPayloadSchema = z.object({
  localId: z.string().min(1),
  title: z.string().min(1),
  sourceFileName: z.string().min(1),
  settings: persistedQuizSettingsSchema,
  questions: z.array(generatedQuestionSchema).min(1).max(GUEST_MAX_QUESTIONS),
});

function toQuestionCreateInput(
  question: GeneratedQuestion,
  order: number,
): Prisma.QuestionCreateWithoutQuizInput {
  return {
    type: question.type,
    question: question.question,
    options:
      question.type === "multiple-choice"
        ? (question.options ?? [])
        : ["True", "False"],
    correctAnswer: question.correctAnswer,
    explanation: question.explanation ?? undefined,
    order,
  };
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
  getQuota: publicProcedure.query(async ({ ctx }) => {
    const tier = ctx.session?.user ? "authenticated" : "guest";

    return getUsageQuota({
      prisma: ctx.prisma,
      tier,
      userId: ctx.session?.user?.id,
      guestId: ctx.guestId,
    });
  }),

  getPdfInfo: publicProcedure
    .input(z.object({ pdfBase64: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await assertCanGetPdfInfo({
        prisma: ctx.prisma,
        guestId: ctx.guestId,
        ipHash: ctx.ipHash,
      });

      const buffer = decodePdfBase64(input.pdfBase64);
      const pageCount = await getPdfPageCount(buffer);

      await recordUsageEvent({
        prisma: ctx.prisma,
        action: USAGE_ACTIONS.PDF_INFO,
        userId: ctx.session?.user?.id,
        guestId: ctx.guestId,
        ipHash: ctx.ipHash,
      });

      return { pageCount };
    }),

  generateGuest: publicProcedure
    .input(
      z.object({
        pdfBase64: z.string().min(1),
        fileName: z.string().min(1),
        settings: settingsInputSchema,
        localId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertCanGenerate({
        prisma: ctx.prisma,
        tier: "guest",
        guestId: ctx.guestId,
        ipHash: ctx.ipHash,
      });

      const result = await generateQuizFromPdf({
        pdfBase64: input.pdfBase64,
        fileName: input.fileName,
        settings: input.settings,
        maxPages: GUEST_MAX_PAGES,
        maxQuestionCount: GUEST_MAX_QUESTIONS,
        forceDifficulty: "medium",
      });

      await recordUsageEvent({
        prisma: ctx.prisma,
        action: USAGE_ACTIONS.QUIZ_GENERATE,
        guestId: ctx.guestId,
        ipHash: ctx.ipHash,
      });

      return {
        localId: input.localId,
        title: result.title,
        sourceFileName: result.sourceFileName,
        settings: result.persistedSettings,
        questions: result.questions,
      };
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
      await assertCanGenerate({
        prisma: ctx.prisma,
        tier: "authenticated",
        userId: ctx.session.user.id,
        guestId: ctx.guestId,
        ipHash: ctx.ipHash,
      });

      const result = await generateQuizFromPdf({
        pdfBase64: input.pdfBase64,
        fileName: input.fileName,
        settings: input.settings,
      });

      const quiz = await ctx.prisma.quiz.create({
        data: {
          title: result.title,
          sourceFileName: result.sourceFileName,
          settings: result.persistedSettings,
          userId: ctx.session.user.id,
          questions: {
            create: result.questions.map((question, index) =>
              toQuestionCreateInput(question, index + 1),
            ),
          },
        },
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
        },
      });

      await recordUsageEvent({
        prisma: ctx.prisma,
        action: USAGE_ACTIONS.QUIZ_GENERATE,
        userId: ctx.session.user.id,
        guestId: ctx.guestId,
        ipHash: ctx.ipHash,
      });

      return {
        quizId: quiz.id,
        title: quiz.title,
        questionCount: quiz.questions.length,
      };
    }),

  importGuestQuizzes: protectedProcedure
    .input(
      z.object({
        quizzes: z.array(guestQuizPayloadSchema).max(3),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.quizzes.length === 0) {
        return { imported: [] as { localId: string; quizId: string }[] };
      }

      if (input.quizzes.length > 3) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can import at most 3 guest quizzes.",
        });
      }

      const imported: { localId: string; quizId: string }[] = [];

      for (const guestQuiz of input.quizzes) {
        const quiz = await ctx.prisma.quiz.create({
          data: {
            title: guestQuiz.title,
            sourceFileName: guestQuiz.sourceFileName,
            settings: guestQuiz.settings,
            userId: ctx.session.user.id,
            questions: {
              create: guestQuiz.questions.map((question, index) =>
                toQuestionCreateInput(question, index + 1),
              ),
            },
          },
        });

        imported.push({ localId: guestQuiz.localId, quizId: quiz.id });
      }

      return { imported };
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
