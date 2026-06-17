import { NOINDEX_ROBOTS } from "@/lib/seo";
import type { Metadata } from "next";
import { GuestLocalQuizPlayer } from "./GuestLocalQuizPlayer";

export const metadata: Metadata = {
  title: "Quiz",
  robots: NOINDEX_ROBOTS,
};

type GuestQuizPageProps = {
  params: Promise<{ localId: string }>;
};

export default async function GuestQuizPage({ params }: GuestQuizPageProps) {
  const { localId } = await params;

  return <GuestLocalQuizPlayer localId={localId} />;
}
