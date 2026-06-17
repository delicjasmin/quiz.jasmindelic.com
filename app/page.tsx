import type { Metadata } from "next";
import { HomeLanding } from "./components/HomeLanding";
import QuizSetupForm from "./components/QuizSetupForm";
import {
  buildOpenGraph,
  buildTwitter,
  DEFAULT_DESCRIPTION,
  HOME_TITLE,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: DEFAULT_DESCRIPTION,
  openGraph: buildOpenGraph(HOME_TITLE, DEFAULT_DESCRIPTION),
  twitter: buildTwitter(HOME_TITLE, DEFAULT_DESCRIPTION),
};

export default function Home() {
  return (
    <main>
      <HomeLanding />
      <QuizSetupForm />
    </main>
  );
}
