import OpenAI from "openai";
import {
  buildQuizPrompt,
  parseGeneratedQuestions,
} from "@/lib/quiz-generation-shared";
import type {
  GeneratedQuiz,
  PersistedQuizSettings,
} from "@/lib/quiz-types";
import {
  AI_UNAVAILABLE_MESSAGE,
  toUserFacingError,
} from "@/lib/user-facing-errors";

const questionResponseJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["multiple-choice", "true-false"],
          },
          question: { type: "string" },
          options: {
            type: ["array", "null"],
            items: { type: "string" },
          },
          correctAnswer: { type: "string" },
          explanation: { type: ["string", "null"] },
        },
        required: [
          "type",
          "question",
          "options",
          "correctAnswer",
          "explanation",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "questions"],
  additionalProperties: false,
} as const;

function getModelName(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";
}

async function generateWithModel(
  modelName: string,
  prompt: string,
  apiKey: string,
): Promise<string> {
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: modelName,
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "quiz_questions",
        strict: true,
        schema: questionResponseJsonSchema,
      },
    },
  });

  const responseText = response.choices[0]?.message?.content;

  if (!responseText) {
    throw new Error("OpenAI returned an empty response.");
  }

  return responseText;
}

export async function generateQuizQuestions(
  text: string,
  settings: PersistedQuizSettings,
  pageRangeLabel: string,
): Promise<GeneratedQuiz> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const prompt = buildQuizPrompt(text, settings, pageRangeLabel);
  const modelName = getModelName();

  const maxAttempts = 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const responseText = await generateWithModel(modelName, prompt, apiKey);
      return parseGeneratedQuestions(responseText, settings.questionCount);
    } catch (error) {
      lastError = error;
      console.error(`[openai] ${modelName} attempt ${attempt} failed:`, error);

      const message = error instanceof Error ? error.message : String(error);
      const isRetryableFormatError =
        message.includes("expected question format") ||
        (message.includes("Expected") &&
          message.includes("questions but received")) ||
        message.includes("invalid JSON");

      if (attempt < maxAttempts && isRetryableFormatError) {
        continue;
      }

      break;
    }
  }

  throw new Error(toUserFacingError(lastError, AI_UNAVAILABLE_MESSAGE));
}
