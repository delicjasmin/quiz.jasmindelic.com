import { TRPCError } from "@trpc/server";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

export const GUEST_MAX_PAGES = 5;
export const GUEST_MAX_QUESTIONS = 10;

export function decodePdfBase64(pdfBase64: string): Buffer {
  const buffer = Buffer.from(pdfBase64, "base64");

  if (buffer.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The uploaded PDF is empty.",
    });
  }

  if (buffer.length > MAX_PDF_BYTES) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The PDF exceeds the 10MB size limit.",
    });
  }

  return buffer;
}

export function deriveQuizTitle(fileName: string): string {
  return fileName.replace(/\.pdf$/i, "").trim() || "Untitled Quiz";
}
