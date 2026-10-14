export function parsePageRangeSpec(
  spec: string,
  maxPage: number,
): number[] {
  const trimmed = spec.trim();

  if (!trimmed) {
    throw new Error("Page range cannot be empty.");
  }

  const pages = new Set<number>();
  const parts = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);

    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);

      if (start < 1 || end < 1) {
        throw new Error(`Invalid page range "${part}".`);
      }

      if (start > end) {
        throw new Error(
          `Invalid page range "${part}" (start must be ≤ end).`,
        );
      }

      for (let page = start; page <= end; page++) {
        pages.add(page);
      }

      continue;
    }

    if (!/^\d+$/.test(part)) {
      throw new Error(`Invalid page "${part}".`);
    }

    const page = Number(part);

    if (page < 1) {
      throw new Error(`Invalid page "${part}".`);
    }

    pages.add(page);
  }

  const sorted = [...pages].sort((a, b) => a - b);

  if (sorted.length === 0) {
    throw new Error("No pages selected.");
  }

  for (const page of sorted) {
    if (page > maxPage) {
      throw new Error(
        `Page ${page} exceeds document length (${maxPage} pages).`,
      );
    }
  }

  return sorted;
}
