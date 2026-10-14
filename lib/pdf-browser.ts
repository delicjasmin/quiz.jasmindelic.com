"use client";

import { sourceTextTooLong } from "@/lib/pdf-limits";
import type { PDFDocumentProxy } from "pdfjs-dist";

async function openPdf(file: File): Promise<PDFDocumentProxy> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");

  if (!GlobalWorkerOptions.workerSrc) {
    GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
  }

  const data = new Uint8Array(await file.arrayBuffer());

  try {
    return await getDocument({ data }).promise;
  } catch (error) {
    if (error instanceof Error && error.name === "PasswordException") {
      throw new Error("This PDF is password-protected and cannot be read.");
    }

    if (error instanceof Error && error.name === "InvalidPDFException") {
      throw new Error("This file is not a valid PDF.");
    }

    throw new Error("Failed to read the PDF file.");
  }
}

export async function readPdfPageCount(file: File): Promise<number> {
  const pdf = await openPdf(file);

  try {
    return pdf.numPages;
  } finally {
    await pdf.destroy();
  }
}

export async function extractPdfText(
  file: File,
  pages: number[],
): Promise<string> {
  const pdf = await openPdf(file);
  const chunks: string[] = [];

  try {
    for (const pageNumber of pages) {
      if (pageNumber < 1 || pageNumber > pdf.numPages) {
        throw new Error(
          `Page range must be between 1 and ${pdf.numPages}. Got page ${pageNumber}.`,
        );
      }

      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      let text = "";

      for (const item of content.items) {
        if (!("str" in item) || !item.str) continue;
        text += item.str;
        text += item.hasEOL ? "\n" : " ";
      }

      const trimmed = text.replace(/[ \t]+\n/g, "\n").trim();
      if (trimmed) chunks.push(trimmed);
      page.cleanup();
    }
  } finally {
    await pdf.destroy();
  }

  const combined = chunks.join("\n\n").trim();

  if (!combined) {
    throw new Error(
      "No text could be extracted from the selected pages. The PDF may be image-based or scanned.",
    );
  }

  if (sourceTextTooLong(combined, pages.length)) {
    throw new Error(
      "The selected pages are too long to upload. Choose a smaller page range.",
    );
  }

  return combined;
}
