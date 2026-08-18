/**
 * Pronunciation scoring for the speaking lessons.
 *
 * The browser's SpeechRecognition gives us text, not phonemes, so this can only judge
 * "did the recogniser hear the right words". The old version just counted how many target
 * words appeared anywhere in the transcript, which meant "cat sat mat" scored 100% against
 * "the cat sat on the mat" and a near-miss like "wark" scored 0 against "work".
 *
 * This version aligns the two word sequences and grades each word by edit distance, so the
 * learner gets a per-word breakdown instead of one opaque number.
 *
 * A real phoneme-level assessment (Azure Speech Pronunciation Assessment, Speechace) would
 * be strictly better — this is the honest ceiling of what the Web Speech API supports.
 */

export type WordVerdict = "correct" | "close" | "wrong" | "missing";

export type WordScore = {
  target: string;
  heard: string | null;
  verdict: WordVerdict;
  /** 0-1 similarity for this single word */
  similarity: number;
};

export type PronunciationResult = {
  /** 0-1 overall */
  score: number;
  words: WordScore[];
  /** Words the recogniser heard that aren't in the target sentence */
  extraWords: string[];
  /** Short Vietnamese summary for the UI */
  summary: string;
};

/** Strip punctuation and case so "Hello," and "hello" compare equal. */
function normalise(text: string): string[] {
  return text
    .toLowerCase()
    // Keep letters from every script we teach (Latin, Thai, Hangul) plus digits
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Classic Levenshtein distance. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const cur = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = [...cur];
  }
  return prev[b.length];
}

/** 1 = identical, 0 = nothing in common. */
export function wordSimilarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 1;
  return 1 - editDistance(a, b) / longest;
}

const CLOSE_ENOUGH = 0.99; // treat as correct
const NEAR_MISS = 0.6;     // "close" — recognisable but off

/**
 * Align heard words to target words with a Needleman-Wunsch style DP, so an inserted
 * or dropped word doesn't shift everything after it out of position.
 */
export function scorePronunciation(spoken: string, target: string): PronunciationResult {
  const targetWords = normalise(target);
  const heardWords = normalise(spoken);

  if (targetWords.length === 0) {
    return { score: 0, words: [], extraWords: [], summary: "Không có câu mẫu để so sánh." };
  }

  const n = targetWords.length;
  const m = heardWords.length;
  const GAP = 0.6; // cost of skipping a word on either side

  // dp[i][j] = best cost aligning first i target words with first j heard words
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) dp[i][0] = i * GAP;
  for (let j = 1; j <= m; j++) dp[0][j] = j * GAP;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const matchCost = 1 - wordSimilarity(targetWords[i - 1], heardWords[j - 1]);
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + matchCost, // align
        dp[i - 1][j] + GAP,           // target word not heard
        dp[i][j - 1] + GAP,           // extra word heard
      );
    }
  }

  // Walk the matrix back to recover the alignment
  const words: WordScore[] = [];
  const extraWords: string[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const matchCost = 1 - wordSimilarity(targetWords[i - 1], heardWords[j - 1]);
      if (Math.abs(dp[i][j] - (dp[i - 1][j - 1] + matchCost)) < 1e-9) {
        const similarity = 1 - matchCost;
        words.push({
          target: targetWords[i - 1],
          heard: heardWords[j - 1],
          verdict: similarity >= CLOSE_ENOUGH ? "correct" : similarity >= NEAR_MISS ? "close" : "wrong",
          similarity,
        });
        i--; j--;
        continue;
      }
    }
    if (i > 0 && Math.abs(dp[i][j] - (dp[i - 1][j] + GAP)) < 1e-9) {
      words.push({ target: targetWords[i - 1], heard: null, verdict: "missing", similarity: 0 });
      i--;
      continue;
    }
    extraWords.push(heardWords[j - 1]);
    j--;
  }

  words.reverse();
  extraWords.reverse();

  // Score: average per-word similarity, with a small penalty for words the learner
  // added that aren't in the sentence.
  const base = words.reduce((sum, w) => sum + w.similarity, 0) / words.length;
  const extraPenalty = Math.min(0.25, extraWords.length * 0.05);
  const score = Math.max(0, Math.min(1, base - extraPenalty));

  const missing = words.filter((w) => w.verdict === "missing").map((w) => w.target);
  const wrong = words.filter((w) => w.verdict === "wrong" || w.verdict === "close").map((w) => w.target);

  let summary: string;
  if (score >= 0.9) summary = "Phát âm rất tốt, gần như chuẩn.";
  else if (score >= 0.75) {
    summary = wrong.length > 0
      ? `Khá tốt. Chú ý lại: ${wrong.slice(0, 3).join(", ")}.`
      : "Khá tốt, chỉ còn vài chỗ chưa rõ.";
  } else if (score >= 0.5) {
    const tips: string[] = [];
    if (wrong.length > 0) tips.push(`đọc chưa đúng: ${wrong.slice(0, 3).join(", ")}`);
    if (missing.length > 0) tips.push(`bị thiếu: ${missing.slice(0, 3).join(", ")}`);
    summary = `Cần luyện thêm — ${tips.join("; ")}.`;
  } else {
    summary = missing.length > words.length / 2
      ? "Máy chỉ nghe được rất ít. Nói to, chậm và rõ hơn nhé."
      : `Chưa khớp câu mẫu. Nghe lại phát âm mẫu rồi thử lại.`;
  }

  return { score, words, extraWords, summary };
}
