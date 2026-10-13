import type { Metadata } from "next";

export const SITE_NAME = "AI Quiz Generator";

export const DEFAULT_DESCRIPTION =
  "Upload a PDF and generate multiple-choice or true/false quiz questions with AI. Free to try without an account.";

export const HOME_TITLE = "Create Quizzes from PDFs with AI";

export const NOINDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
};

function twitterHandle() {
  const handle = process.env.NEXT_PUBLIC_TWITTER_HANDLE?.trim();
  if (!handle) return undefined;
  return handle.startsWith("@") ? handle : `@${handle}`;
}

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
  const handle = twitterHandle();

  return {
    card: "summary_large_image",
    title,
    description,
    ...(handle ? { site: handle, creator: handle } : {}),
  };
}

type SocialMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  imagePath?: string;
  imageAlt?: string;
};

export function buildSocialMetadata({
  title,
  description,
  path = "/",
  imagePath = "/opengraph-image",
  imageAlt,
}: SocialMetadataOptions): Pick<
  Metadata,
  "openGraph" | "twitter" | "alternates"
> {
  return {
    alternates: {
      canonical: path,
    },
    openGraph: {
      ...buildOpenGraph(title, description, path),
      images: [
        {
          url: imagePath,
          width: 1200,
          height: 630,
          alt: imageAlt ?? title,
        },
      ],
    },
    twitter: {
      ...buildTwitter(title, description),
      images: [imagePath],
    },
  };
}
