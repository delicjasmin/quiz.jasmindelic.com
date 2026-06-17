import { auth } from "@/lib/auth";
import { NOINDEX_ROBOTS } from "@/lib/seo";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { GuestQuizzesPage } from "./GuestQuizzesPage";
import { QuizzesPage } from "./QuizzesPage";

export const metadata: Metadata = {
  title: "My Quizzes",
  robots: NOINDEX_ROBOTS,
};

export default async function MyQuizzesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return <GuestQuizzesPage />;
  }

  return <QuizzesPage />;
}
