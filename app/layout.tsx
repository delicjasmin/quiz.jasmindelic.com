import type { Metadata } from "next";
import "./globals.css";
import {
  buildOpenGraph,
  buildTwitter,
  DEFAULT_DESCRIPTION,
  SITE_NAME,
} from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";
import Providers from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} — Create Quizzes from PDFs`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: buildOpenGraph(
    `${SITE_NAME} — Create Quizzes from PDFs`,
    DEFAULT_DESCRIPTION,
  ),
  twitter: buildTwitter(
    `${SITE_NAME} — Create Quizzes from PDFs`,
    DEFAULT_DESCRIPTION,
  ),
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
