const CHARS_PER_TOKEN = 3.5;

/** Stay under the model's 272k input-token limit, leaving room for instructions. */
const MAX_SOURCE_TOKENS = 200_000;
export const MAX_SOURCE_CHARS = Math.floor(MAX_SOURCE_TOKENS * CHARS_PER_TOKEN);

function clipToBreak(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;

  const slice = text.slice(0, maxChars);
  const breakAt = Math.max(
    slice.lastIndexOf("\n\n"),
    slice.lastIndexOf("\n"),
    slice.lastIndexOf(". "),
  );

  if (breakAt >= Math.floor(maxChars * 0.5)) {
    return slice.slice(0, breakAt).trim();
  }

  return slice.trim();
}

function splitBlocks(text: string, maxChars: number): string[] {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const units: string[] = [];

  for (const block of blocks) {
    if (block.length <= maxChars) {
      units.push(block);
      continue;
    }

    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length <= 1) {
      units.push(block);
      continue;
    }

    let chunk = "";
    for (const line of lines) {
      const next = chunk ? `${chunk}\n${line}` : line;
      if (next.length > maxChars && chunk) {
        units.push(chunk);
        chunk = line;
      } else {
        chunk = next;
      }
    }

    if (chunk) units.push(chunk);
  }

  return units.length > 0 ? units : [text];
}

function pickEven(units: string[], count: number): string[] {
  if (count >= units.length) return units;
  if (count <= 1) return [units[0] ?? ""];

  const picked: string[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < count; i++) {
    const index = Math.round((i * (units.length - 1)) / (count - 1));
    if (seen.has(index)) continue;
    seen.add(index);
    picked.push(units[index] ?? "");
  }

  return picked;
}

function joinedLength(parts: string[]): number {
  if (parts.length === 0) return 0;
  return (
    parts.reduce((sum, part) => sum + part.length, 0) + (parts.length - 1) * 2
  );
}

export function fitSourceText(
  text: string,
  maxChars = MAX_SOURCE_CHARS,
): string {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length <= maxChars) return trimmed;

  const units = splitBlocks(trimmed, maxChars);
  let best: string[] = [];

  for (let count = units.length; count >= 1; count--) {
    const picked = pickEven(units, count);
    if (joinedLength(picked) <= maxChars) {
      best = picked;
      break;
    }
  }

  if (best.length === 0) {
    return clipToBreak(units[0] ?? trimmed, maxChars);
  }

  const joined = best.join("\n\n");
  if (joined.length <= maxChars) return joined;
  return clipToBreak(joined, maxChars);
}
