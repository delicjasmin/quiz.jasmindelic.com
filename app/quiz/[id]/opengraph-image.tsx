import { getQuizForSeo } from "@/lib/quiz-seo";
import { DEFAULT_DESCRIPTION, HOME_TITLE, SITE_NAME } from "@/lib/seo";
import { OgImageContent } from "@/lib/og-image-content";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type QuizOgImageProps = {
  params: Promise<{ id: string }>;
};

export default async function QuizOpenGraphImage({ params }: QuizOgImageProps) {
  const { id } = await params;
  const quiz = await getQuizForSeo(id);

  if (!quiz?.isShared) {
    return new ImageResponse(
      <OgImageContent title={HOME_TITLE} subtitle={DEFAULT_DESCRIPTION} />,
      { ...size },
    );
  }

  const subtitle =
    quiz.description ??
    `Take this ${quiz._count.questions}-question quiz on ${SITE_NAME}.`;

  return new ImageResponse(
    <OgImageContent
      title={quiz.title}
      subtitle={subtitle}
      badge={`${quiz._count.questions} questions`}
    />,
    { ...size },
  );
}
