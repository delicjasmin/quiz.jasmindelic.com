import { PDFParse } from "pdf-parse";

export type PageRange = {
  start: number;
  end: number;
};

export async function getPdfPageCount(buffer: Buffer): Promise<number> {
  const parser = new PDFParse({ data: buffer });
  try {
    const info = await parser.getInfo();
    return info.total;
  } finally {
    await parser.destroy();
  }
}

export async function extractPdfText(
  buffer: Buffer,
  pageRange: PageRange,
): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const info = await parser.getInfo();

    if (pageRange.start < 1 || pageRange.end > info.total) {
      throw new Error(
        `Page range must be between 1 and ${info.total}. Got ${pageRange.start}-${pageRange.end}.`,
      );
    }

    if (pageRange.start > pageRange.end) {
      throw new Error("Start page must be less than or equal to end page.");
    }

    const result = await parser.getText({
      first: pageRange.start,
      last: pageRange.end,
      pageJoiner: "",
    });

    const text = result.text.trim();

    if (!text) {
      throw new Error(
        "No text could be extracted from the selected pages. The PDF may be image-based or scanned.",
      );
    }

    return text;
  } finally {
    await parser.destroy();
  }
}
