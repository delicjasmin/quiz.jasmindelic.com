import type { Metadata } from "next";
import { HomeLanding } from "./components/HomeLanding";
import QuizSetupForm from "./components/QuizSetupForm";
import {
  buildSocialMetadata,
  DEFAULT_DESCRIPTION,
  HOME_TITLE,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: DEFAULT_DESCRIPTION,
  ...buildSocialMetadata({
    title: HOME_TITLE,
    description: DEFAULT_DESCRIPTION,
  }),
};

export default function Home() {
  return (
    <main>
      <HomeLanding />
      <QuizSetupForm />
    </main>
  );
}
