import prisma from "@/lib/prisma";

export async function getQuizForSeo(id: string) {
  return prisma.quiz.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      isShared: true,
      sharedAt: true,
      _count: {
        select: { questions: true },
      },
    },
  });
}

export async function listSharedQuizzesForSitemap() {
  return prisma.quiz.findMany({
    where: { isShared: true },
    select: {
      id: true,
      sharedAt: true,
      updatedAt: true,
    },
    orderBy: { sharedAt: "desc" },
  });
}
