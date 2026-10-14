import type { MetadataRoute } from "next";
import { listSharedQuizzesForSitemap } from "@/lib/quiz-seo";
import { getSiteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const sharedQuizzes = await listSharedQuizzesForSitemap();

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...sharedQuizzes.map((quiz) => ({
      url: `${siteUrl}/quiz/${quiz.id}`,
      lastModified: quiz.sharedAt ?? quiz.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
