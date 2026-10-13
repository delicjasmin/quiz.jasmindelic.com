import type { Metadata } from "next";
import "./globals.css";
import {
  buildSocialMetadata,
  DEFAULT_DESCRIPTION,
  SITE_NAME,
} from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";
import Providers from "./providers";

const defaultTitle = `${SITE_NAME} — Create Quizzes from PDFs`;

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: defaultTitle,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "education",
  keywords: [
    "quiz generator",
    "PDF quiz",
    "AI quiz maker",
    "study tool",
    "multiple choice generator",
    "true false quiz",
  ],
  ...buildSocialMetadata({
    title: defaultTitle,
    description: DEFAULT_DESCRIPTION,
  }),
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "nbppaTv03Oa4Aw9L1UZJ-I-zhBHEK7oIqY6wM-j68z0",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
