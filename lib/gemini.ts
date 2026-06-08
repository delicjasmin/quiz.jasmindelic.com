import {
  GoogleGenerativeAI,
  SchemaType,
  type ResponseSchema,
} from "@google/generative-ai";
import {
  generatedQuestionsSchema,
  type GeneratedQuestion,
  type PersistedQuizSettings,
} from "@/lib/quiz-types";

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

function buildPrompt(
  text: string,
  settings: PersistedQuizSettings,
  pageRange: { start: number; end: number },
): string {
  const questionTypeInstruction =
    settings.questionType === "mixed"
      ? "Use a mix of multiple-choice and true-false questions."
      : settings.questionType === "multiple-choice"
        ? "Use only multiple-choice questions with exactly 4 options each."
        : "Use only true-false questions.";

  return `You are an expert educator creating quiz questions from study material.

Generate exactly ${settings.questionCount} quiz questions based ONLY on the source text below.
Difficulty: ${settings.difficulty}.
${questionTypeInstruction}

Rules:
- Questions must be answerable from the provided text alone.
- Multiple-choice questions must have exactly 4 distinct options and one correct answer.
- True-false questions must not include an options array.
- For true-false, set correctAnswer to "true" or "false" (lowercase).
- For multiple-choice, correctAnswer must exactly match one of the options.
- Keep questions clear and unambiguous.
- Include a brief explanation for each answer.

Source pages: ${pageRange.start}-${pageRange.end}

SOURCE TEXT:
"""
${text}
"""`;
}

function normalizeGeneratedQuestions(
  raw: GeneratedQuestion[],
): GeneratedQuestion[] {
  return raw.map((question) => {
    if (question.type === "true-false") {
      const answer =
        typeof question.correctAnswer === "boolean"
          ? question.correctAnswer
          : question.correctAnswer.toLowerCase() === "true";

      return {
        ...question,
        options: undefined,
        correctAnswer: answer,
      };
    }

    if (!question.options || question.options.length < 2) {
      throw new Error("Multiple-choice questions must include options.");
    }

    const correctText =
      typeof question.correctAnswer === "string"
        ? question.correctAnswer
        : String(question.correctAnswer);

    if (!question.options.includes(correctText)) {
      throw new Error(
        `Correct answer "${correctText}" must match one of the provided options.`,
      );
    }

    return {
      ...question,
      correctAnswer: correctText,
    };
  });
}

function getModelCandidates(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim();

  if (configured) {
    return [configured];
  }

  return ["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
}

function isQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("429") || message.includes("quota");
}

function formatGeminiError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("limit: 0")) {
    return (
      "This Gemini model has no free-tier quota on your API key. " +
      "Try setting GEMINI_MODEL=gemini-2.5-flash in .env, or create a new key at " +
      "https://aistudio.google.com/apikey. If the issue persists, enable billing in " +
      "Google AI Studio (Settings → Billing) — some accounts need this even for free tier."
    );
  }

  if (message.includes("429") || message.includes("quota")) {
    return (
      "Gemini API rate limit reached. Wait a minute and try again, or check your quota at " +
      "https://aistudio.google.com/app/apikey."
    );
  }

  if (message.includes("API_KEY_INVALID") || message.includes("API key not valid")) {
    return (
      "Invalid GEMINI_API_KEY. Create a key at https://aistudio.google.com/apikey " +
      "(keys usually start with AIza)."
    );
  }

  return message;
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
  pageRange: { start: number; end: number },
): Promise<GeneratedQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const prompt = buildPrompt(text, settings, pageRange);
  const models = getModelCandidates();
  const errors: string[] = [];

  for (const modelName of models) {
    try {
      const responseText = await generateWithModel(modelName, prompt, apiKey);
      return parseGeneratedQuestions(responseText, settings.questionCount);
    } catch (error) {
      const formatted = formatGeminiError(error);
      errors.push(`${modelName}: ${formatted}`);

      if (!isQuotaError(error) || models.length === 1) {
        throw new Error(formatted);
      }
    }
  }

  throw new Error(errors.join(" "));
}

function parseGeneratedQuestions(
  responseText: string,
  expectedCount: number,
): GeneratedQuestion[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error("Gemini returned invalid JSON.");
  }

  const validated = generatedQuestionsSchema.safeParse(parsed);

  if (!validated.success) {
    throw new Error("Gemini response did not match the expected question format.");
  }

  if (validated.data.questions.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} questions but received ${validated.data.questions.length}.`,
    );
  }

  return normalizeGeneratedQuestions(validated.data.questions);
}
