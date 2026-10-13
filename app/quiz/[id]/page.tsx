import type { Metadata } from "next";
import { getQuizForSeo } from "@/lib/quiz-seo";
import { buildSocialMetadata, NOINDEX_ROBOTS } from "@/lib/seo";
import { QuizPlayer } from "./QuizPlayer";

type QuizPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: QuizPageProps): Promise<Metadata> {
  const { id } = await params;
  const quiz = await getQuizForSeo(id);

  if (!quiz || !quiz.isShared) {
    return {
      title: "Quiz",
      robots: NOINDEX_ROBOTS,
    };
  }

  const description =
    quiz.description ??
    `Take this ${quiz._count.questions}-question quiz: ${quiz.title}`;

  return {
    title: quiz.title,
    description,
    ...buildSocialMetadata({
      title: quiz.title,
      description,
      path: `/quiz/${quiz.id}`,
      imagePath: `/quiz/${quiz.id}/opengraph-image`,
      imageAlt: quiz.title,
    }),
  };
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { id } = await params;

  return <QuizPlayer quizId={id} />;
}
