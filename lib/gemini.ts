import {
  GoogleGenerativeAI,
  SchemaType,
  type ResponseSchema,
} from "@google/generative-ai";
import {
  buildQuizPrompt,
  parseGeneratedQuestions,
} from "@/lib/quiz-generation-shared";
import type {
  GeneratedQuestion,
  PersistedQuizSettings,
} from "@/lib/quiz-types";
import {
  AI_UNAVAILABLE_MESSAGE,
  isQuotaError,
  toUserFacingError,
} from "@/lib/user-facing-errors";

const questionResponseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["multiple-choice", "true-false"],
          },
          question: { type: SchemaType.STRING },
          options: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          correctAnswer: {
            type: SchemaType.STRING,
            description:
              "For multiple-choice: exact text of the correct option. For true-false: 'true' or 'false'.",
          },
          explanation: { type: SchemaType.STRING },
        },
        required: ["type", "question", "correctAnswer"],
      },
    },
  },
  required: ["questions"],
};

function getModelCandidates(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim();

  if (configured) {
    return [configured];
  }

  return [
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
  ];
}

async function generateWithModel(
  modelName: string,
  prompt: string,
  apiKey: string,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: questionResponseSchema,
    },
  });

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  if (!responseText) {
    throw new Error("Gemini returned an empty response.");
  }

  return responseText;
}

export async function generateQuizQuestions(
  text: string,
  settings: PersistedQuizSettings,
  pageRangeLabel: string,
): Promise<GeneratedQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const prompt = buildQuizPrompt(text, settings, pageRangeLabel);
  const models = getModelCandidates();
  const errors: string[] = [];

  for (const modelName of models) {
    try {
      const responseText = await generateWithModel(modelName, prompt, apiKey);
      return parseGeneratedQuestions(responseText, settings.questionCount);
    } catch (error) {
      console.error(`[gemini] ${modelName} failed:`, error);
      const formatted = toUserFacingError(error, AI_UNAVAILABLE_MESSAGE);
      errors.push(formatted);

      if (!isQuotaError(error) || models.length === 1) {
        throw new Error(formatted);
      }
    }
  }

  throw new Error(errors[0] ?? AI_UNAVAILABLE_MESSAGE);
}
