import { CanvasFactory } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

export type PageRange = {
  start: number;
  end: number;
};

function createParser(buffer: Buffer) {
  return new PDFParse({ data: buffer, CanvasFactory });
}

export async function getPdfPageCount(buffer: Buffer): Promise<number> {
  const parser = createParser(buffer);
  try {
    const info = await parser.getInfo();
    return info.total;
  } finally {
    await parser.destroy();
  }
}

export async function extractPdfTextFromPages(
  buffer: Buffer,
  pages: number[],
): Promise<string> {
  const parser = createParser(buffer);
  try {
    const info = await parser.getInfo();

    for (const page of pages) {
      if (page < 1 || page > info.total) {
        throw new Error(
          `Page range must be between 1 and ${info.total}. Got page ${page}.`,
        );
      }
    }

    const result = await parser.getText({
      partial: pages,
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

export async function extractPdfText(
  buffer: Buffer,
  pageRange: PageRange,
): Promise<string> {
  const pages: number[] = [];

  for (let page = pageRange.start; page <= pageRange.end; page++) {
    pages.push(page);
  }

  return extractPdfTextFromPages(buffer, pages);
}
