function isQuotaMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("429") ||
    lower.includes("quota") ||
    lower.includes("rate limit")
  );
}

export const AI_UNAVAILABLE_MESSAGE =
  "The AI service is temporarily unavailable. Please try again later.";

export function guestPageLimitMessage(maxPages: number): string {
  return `Free quizzes are limited to ${maxPages} pages. Sign in with Google to use more pages or choose a smaller page range.`;
}

export function isQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return isQuotaMessage(message);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

function stripTechnicalPrefix(message: string): string {
  return message.replace(/^\[GoogleGenerativeAI Error\]:\s*/i, "").trim();
}

function looksTechnical(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("googlegenerativeai") ||
    lower.includes("generativelanguage.googleapis.com") ||
    lower.includes("error fetching from") ||
    lower.includes("gemini_api_key") ||
    lower.includes("openai_api_key") ||
    lower.includes("openai.com") ||
    lower.includes("gemini-2") ||
    lower.includes("gemini-1") ||
    lower.includes("gemini-0") ||
    lower.includes("aistudio.google.com") ||
    /\[(\d{3})\s/.test(message)
  );
}

function mapKnownErrors(message: string): string | null {
  const lower = message.toLowerCase();

  if (
    lower.includes("503") ||
    lower.includes("service unavailable") ||
    lower.includes("high demand")
  ) {
    return "The AI service is busy right now. Please wait a moment and try again.";
  }

  if (isQuotaMessage(message)) {
    return "Too many quiz generation requests were sent. Please wait a minute and try again.";
  }

  if (
    lower.includes("500") ||
    lower.includes("502") ||
    lower.includes("504") ||
    lower.includes("internal server error")
  ) {
    return "The AI service encountered a problem. Please try again in a few moments.";
  }

  if (
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid")
  ) {
    return "Quiz generation is not available right now. Please try again later.";
  }

  if (
    lower.includes("gemini_api_key is not configured") ||
    lower.includes("openai_api_key is not configured")
  ) {
    return "Quiz generation is not available right now. Please try again later.";
  }

  if (
    lower.includes("fetch failed") ||
    lower.includes("network") ||
    lower.includes("econnreset") ||
    lower.includes("enotfound") ||
    lower.includes("etimedout")
  ) {
    return "Could not reach the AI service. Check your connection and try again.";
  }

  if (lower.includes("empty response")) {
    return "The AI returned an empty response. Please try again.";
  }

  if (
    lower.includes("invalid json") ||
    lower.includes("expected question format") ||
    (lower.includes("expected") && lower.includes("questions"))
  ) {
    return "The AI returned an unexpected response. Please try again.";
  }

  if (lower.includes("multiple-choice questions must include options")) {
    return "The AI returned an invalid question format. Please try again.";
  }

  if (
    lower.includes("not valid json") ||
    lower.includes("request entity too large") ||
    lower.includes("content too large")
  ) {
    return "The upload was too large for the server. Choose a smaller page range and try again.";
  }

  if (isInputTokenLimitMessage(message)) {
    return "The selected text was too long for the AI. Please try again; a shorter excerpt of the pages will be used.";
  }

  return null;
}

export function isInputTokenLimitMessage(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("input tokens exceed") ||
    lower.includes("token limit") ||
    (lower.includes("tokens") && lower.includes("configured limit")) ||
    lower.includes("shorter excerpt of the pages will be used")
  );
}

export function toUserFacingError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const message = stripTechnicalPrefix(getErrorMessage(error));

  if (!message) {
    return fallback;
  }

  const mapped = mapKnownErrors(message);
  if (mapped) {
    return mapped;
  }

  if (looksTechnical(message)) {
    return fallback;
  }

  return message;
}
