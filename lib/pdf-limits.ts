export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export const MAX_PDF_MB = 10;

/**
 * Quiz generation sends extracted text, not the PDF. This cap stays under
 * Vercel's 4.5MB serverless request-body limit after JSON encoding.
 */
export const MAX_SOURCE_TEXT_CHARS = 3_000_000;
const MAX_SOURCE_CHARS_PER_PAGE = 40_000;

export const NO_EXTRACTABLE_TEXT_MESSAGE =
  "No text could be extracted from the selected pages. The PDF may be image-based or scanned.";

export const SOURCE_TEXT_TOO_LONG_MESSAGE =
  "The selected pages are too long to upload. Choose a smaller page range.";

export function sourceTextTooLong(
  text: string,
  selectedPageCount: number,
): boolean {
  return (
    text.length > MAX_SOURCE_TEXT_CHARS ||
    text.length > selectedPageCount * MAX_SOURCE_CHARS_PER_PAGE
  );
}
