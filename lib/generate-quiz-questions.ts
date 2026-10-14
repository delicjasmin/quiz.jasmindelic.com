import { fitSourceText, MAX_SOURCE_CHARS } from "@/lib/fit-source-text";
import { generateQuizQuestions as generateWithGemini } from "@/lib/gemini";
import { generateQuizQuestions as generateWithOpenAI } from "@/lib/openai";
import type {
  GeneratedQuestion,
  PersistedQuizSettings,
} from "@/lib/quiz-types";
import { isInputTokenLimitMessage } from "@/lib/user-facing-errors";

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
  const run = (source: string) =>
    provider === "openai"
      ? generateWithOpenAI(source, settings, pageRangeLabel)
      : generateWithGemini(source, settings, pageRangeLabel);

  const fitted = fitSourceText(text);

  try {
    return await run(fitted);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const shorter = fitSourceText(text, Math.floor(MAX_SOURCE_CHARS / 2));

    if (!isInputTokenLimitMessage(message) || shorter.length >= fitted.length) {
      throw error;
    }

    return run(shorter);
  }
}
