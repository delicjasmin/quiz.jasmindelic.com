import type { Metadata } from "next";

export const SITE_NAME = "AI Quiz Generator";

export const DEFAULT_DESCRIPTION =
  "Upload a PDF and generate multiple-choice or true/false quiz questions with AI. Free to try without an account.";

export const HOME_TITLE = "Create Quizzes from PDFs with AI";

export const NOINDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
};

export function buildOpenGraph(
  title: string,
  description: string,
  path = "/",
): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title,
    description,
    url: path,
  };
}

export function buildTwitter(
  title: string,
  description: string,
): NonNullable<Metadata["twitter"]> {
  return {
    card: "summary_large_image",
    title,
    description,
  };
}
