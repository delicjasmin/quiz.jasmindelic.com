import { generateQuizQuestions as generateWithGemini } from "@/lib/gemini";
import { generateQuizQuestions as generateWithOpenAI } from "@/lib/openai";
import type {
  GeneratedQuestion,
  PersistedQuizSettings,
} from "@/lib/quiz-types";

type LlmProvider = "gemini" | "openai";

function getProvider(): LlmProvider {
  const configured = process.env.LLM_PROVIDER?.trim().toLowerCase();

  if (configured === "openai" || configured === "gemini") {
    return configured;
  }

  if (process.env.OPENAI_API_KEY?.trim()) {
    return "openai";
  }

  return "gemini";
}

export async function generateQuizQuestions(
  text: string,
  settings: PersistedQuizSettings,
  pageRangeLabel: string,
): Promise<GeneratedQuestion[]> {
  const provider = getProvider();

  if (provider === "openai") {
    return generateWithOpenAI(text, settings, pageRangeLabel);
  }

  return generateWithGemini(text, settings, pageRangeLabel);
}
