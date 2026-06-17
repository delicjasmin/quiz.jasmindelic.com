import { DEFAULT_DESCRIPTION, HOME_TITLE, SITE_NAME } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";

export function HomeLanding() {
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: siteUrl,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <section className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            {HOME_TITLE}
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400 sm:text-lg">
            Turn lecture notes, textbooks, and study guides into interactive
            quizzes in seconds. Upload a PDF, choose your settings, and let AI
            create questions you can practice with right away.
          </p>
        </div>

        <ul className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
          <li className="rounded-xl border border-zinc-200 bg-white p-5 text-left dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              PDF to quiz in one step
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Upload any PDF and generate questions directly from its content.
            </p>
          </li>
          <li className="rounded-xl border border-zinc-200 bg-white p-5 text-left dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Flexible question types
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Choose multiple choice, true/false, or a mixed set with adjustable
              difficulty.
            </p>
          </li>
          <li className="rounded-xl border border-zinc-200 bg-white p-5 text-left dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Free to try instantly
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Start without an account. Sign in later to save quizzes and share
              them with others.
            </p>
          </li>
        </ul>
      </div>
    </section>
  );
}
