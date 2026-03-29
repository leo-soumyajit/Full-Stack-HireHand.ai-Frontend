/**
 * JD Diff Utilities — Computes word-level and item-level diffs
 * between two structured JDs for visual highlighting.
 */

import type { ApiPositionJD } from "@/types/api";

// ── Word-level diff (LCS algorithm) ────────────────────────────────────────

export type DiffSegment = { text: string; type: "same" | "added" | "removed" };

/**
 * Compute LCS table for two arrays of tokens.
 */
function buildLCSTable(a: string[], b: string[]): number[][] {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1].toLowerCase() === b[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}

/**
 * Word-level diff between two strings. Returns segments tagged as
 * 'same', 'added', or 'removed'.
 */
export function diffWords(before: string, after: string): DiffSegment[] {
  // Tokenize: split into words (keeping punctuation attached)
  const tokenize = (s: string) => s.split(/(\s+)/).filter(Boolean);
  const tokensA = tokenize(before);
  const tokensB = tokenize(after);

  const dp = buildLCSTable(tokensA, tokensB);
  const result: DiffSegment[] = [];

  let i = tokensA.length, j = tokensB.length;
  const stack: DiffSegment[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tokensA[i - 1].toLowerCase() === tokensB[j - 1].toLowerCase()) {
      stack.push({ text: tokensA[i - 1], type: "same" });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ text: tokensB[j - 1], type: "added" });
      j--;
    } else {
      stack.push({ text: tokensA[i - 1], type: "removed" });
      i--;
    }
  }

  // Reverse (we built it from the end)
  stack.reverse();

  // Merge consecutive segments of the same type for cleaner output
  for (const seg of stack) {
    const last = result[result.length - 1];
    if (last && last.type === seg.type) {
      last.text += seg.text;
    } else {
      result.push({ ...seg });
    }
  }

  return result;
}

// ── Item-level diff for arrays ─────────────────────────────────────────────

export type ItemDiffStatus = "same" | "added" | "removed" | "modified";

export interface ItemDiff {
  text: string;
  status: ItemDiffStatus;
  /** For 'modified' items, the word-level diff segments */
  wordDiff?: DiffSegment[];
}

/**
 * Compute the similarity between two strings (0–1).
 * Uses word overlap (Jaccard similarity).
 */
function similarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 1 : intersection / union;
}

/**
 * Diff two string arrays (e.g. education, experience, responsibilities).
 * Returns tagged items for the "before" side.
 */
export function diffArrayBefore(before: string[], after: string[]): ItemDiff[] {
  const afterSet = new Set(after.map(s => s.trim()));
  
  return before.map(item => {
    const trimmed = item.trim();
    
    // Exact match → no change
    if (afterSet.has(trimmed)) {
      return { text: trimmed, status: "same" as const };
    }
    
    // Check for similar item (modified)
    const bestMatch = after.reduce<{ text: string; sim: number } | null>((best, afterItem) => {
      const sim = similarity(trimmed, afterItem.trim());
      if (sim > 0.3 && (!best || sim > best.sim)) {
        return { text: afterItem.trim(), sim };
      }
      return best;
    }, null);
    
    if (bestMatch) {
      return {
        text: trimmed,
        status: "modified" as const,
        wordDiff: diffWords(trimmed, bestMatch.text),
      };
    }
    
    // No match → removed
    return { text: trimmed, status: "removed" as const };
  });
}

/**
 * Diff two string arrays for the "after" side.
 */
export function diffArrayAfter(before: string[], after: string[]): ItemDiff[] {
  const beforeSet = new Set(before.map(s => s.trim()));
  
  return after.map(item => {
    const trimmed = item.trim();
    
    // Exact match → no change
    if (beforeSet.has(trimmed)) {
      return { text: trimmed, status: "same" as const };
    }
    
    // Check for similar item (modified)
    const bestMatch = before.reduce<{ text: string; sim: number } | null>((best, beforeItem) => {
      const sim = similarity(trimmed, beforeItem.trim());
      if (sim > 0.3 && (!best || sim > best.sim)) {
        return { text: beforeItem.trim(), sim };
      }
      return best;
    }, null);
    
    if (bestMatch) {
      return {
        text: trimmed,
        status: "modified" as const,
        wordDiff: diffWords(bestMatch.text, trimmed),
      };
    }
    
    // No match → added
    return { text: trimmed, status: "added" as const };
  });
}

/**
 * Diff skill arrays — simple set-based comparison.
 */
export function diffSkills(
  before: string[],
  after: string[],
  side: "before" | "after"
): { text: string; status: "same" | "added" | "removed" }[] {
  const beforeNorm = new Set(before.map(s => s.trim().toLowerCase()));
  const afterNorm = new Set(after.map(s => s.trim().toLowerCase()));

  const items = side === "before" ? before : after;

  return items.map(s => {
    const norm = s.trim().toLowerCase();
    if (beforeNorm.has(norm) && afterNorm.has(norm)) {
      return { text: s.trim(), status: "same" as const };
    }
    return {
      text: s.trim(),
      status: side === "before" ? "removed" as const : "added" as const,
    };
  });
}

/**
 * Full JD diff result for one side.
 */
export interface JDDiffResult {
  purposeChanged: boolean;
  purposeDiff: DiffSegment[];
  education: ItemDiff[];
  experience: ItemDiff[];
  responsibilities: ItemDiff[];
  skills: { text: string; status: "same" | "added" | "removed" }[];
}

/**
 * Compute the complete diff for one side of the comparison.
 */
export function computeJDDiff(
  before: ApiPositionJD,
  after: ApiPositionJD,
  side: "before" | "after"
): JDDiffResult {
  const purposeChanged = before.purpose.trim() !== after.purpose.trim();

  return {
    purposeChanged,
    purposeDiff: purposeChanged ? diffWords(before.purpose, after.purpose) : [],
    education: side === "before"
      ? diffArrayBefore(before.education, after.education)
      : diffArrayAfter(before.education, after.education),
    experience: side === "before"
      ? diffArrayBefore(before.experience, after.experience)
      : diffArrayAfter(before.experience, after.experience),
    responsibilities: side === "before"
      ? diffArrayBefore(before.responsibilities, after.responsibilities)
      : diffArrayAfter(before.responsibilities, after.responsibilities),
    skills: diffSkills(before.skills, after.skills, side),
  };
}
