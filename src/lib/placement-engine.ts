import { getQuestionsForTest, calculateScore, determineLevel } from "./placement-data";
import { getToeicQuestions, calculateToeicResult, type ToeicQuestion } from "./toeic-data";
import { getIeltsQuestions, calculateIeltsResult, type IeltsQuestion } from "./ielts-data";
import { getCutflQuestions, calculateCutflResult, type CutflQuestion } from "./cutfl-data";
import { getKoreanQuestions, calculateKoreanResult } from "./korean-data";
import type { Question } from "./placement-data";

export type TestType = "cefr" | "toeic" | "ielts" | "cutfl" | "topik";
export type Language = "english" | "thai" | "korean";

export type ActiveQuestion = {
  id: string;
  section: string;
  level: string;
  passage?: string;
  question: string;
  options: string[];
  answer: number;
};

export type PlacementResult = {
  score: number;
  level: string;
  rawLabel: string;
  description: string;
};

export const TEST_TYPES: Record<Language, TestType[]> = {
  english: ["cefr", "toeic", "ielts"],
  thai: ["cefr", "cutfl"],
  korean: ["cefr", "topik"],
};

export const TEST_META: Record<TestType, { label: string; desc: string; questionCount: number }> = {
  cefr: {
    label: "CEFR (Trình độ tổng quát)",
    desc: "20 câu · Đánh giá A1–C2 · Ngữ pháp + Từ vựng + Đọc hiểu",
    questionCount: 20,
  },
  toeic: {
    label: "TOEIC (Tiếng Anh thương mại)",
    desc: "25 câu · Part 5 + Part 7 · Ước lượng điểm TOEIC",
    questionCount: 25,
  },
  ielts: {
    label: "IELTS Academic (Học thuật)",
    desc: "25 câu · True/False/NG + Trắc nghiệm · Ước lượng Band IELTS",
    questionCount: 25,
  },
  cutfl: {
    label: "CU-TFL (Tiếng Thái cho người nước ngoài)",
    desc: "20 câu · Level 1–5 · Từ vựng + Ngữ pháp + Đọc hiểu",
    questionCount: 20,
  },
  topik: {
    label: "TOPIK (Tiếng Hàn cho người nước ngoài)",
    desc: "20 câu · TOPIK I & II · Từ vựng + Ngữ pháp + Đọc hiểu",
    questionCount: 20,
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function castAs<T>(v: unknown): T { return v as T; }

// ── Server-side scoring ────────────────────────────────────────────────────
// The browser picks a random subset of questions, so it tells the server which ids
// it served. The server then re-scores from its own copy of the answer key —
// the level in the database is never whatever the client claimed it was.

import { ENGLISH_QUESTIONS, ENGLISH_QUESTIONS_B, THAI_QUESTIONS, THAI_QUESTIONS_B } from "./placement-data";
import { TOEIC_QUESTIONS } from "./toeic-data";
import { IELTS_QUESTIONS } from "./ielts-data";
import { CUTFL_QUESTIONS } from "./cutfl-data";
import { KOREAN_QUESTIONS } from "./korean-data";

const ALL_QUESTIONS_BY_ID = new Map<string, ActiveQuestion>();
for (const pool of [
  ENGLISH_QUESTIONS, ENGLISH_QUESTIONS_B, THAI_QUESTIONS, THAI_QUESTIONS_B,
  TOEIC_QUESTIONS, IELTS_QUESTIONS, CUTFL_QUESTIONS, KOREAN_QUESTIONS,
] as { id: string }[][]) {
  for (const q of pool) ALL_QUESTIONS_BY_ID.set(q.id, q as unknown as ActiveQuestion);
}

/**
 * Re-score a submitted placement test from the server's own answer key.
 * Returns null when the ids don't resolve — the caller should reject the submission
 * rather than trusting the client's numbers.
 */
export function scoreSubmission(
  testType: TestType,
  questionIds: string[],
  answers: (number | null)[],
): PlacementResult | null {
  if (!Array.isArray(questionIds) || questionIds.length === 0) return null;
  if (!Array.isArray(answers) || answers.length !== questionIds.length) return null;

  const questions: ActiveQuestion[] = [];
  for (const id of questionIds) {
    const q = ALL_QUESTIONS_BY_ID.get(id);
    if (!q) return null;
    questions.push(q);
  }

  const cleanAnswers = answers.map((a) =>
    typeof a === "number" && Number.isInteger(a) && a >= 0 ? a : null
  );

  return calculateTestResult(testType, questions, cleanAnswers);
}

export function getTestQuestions(language: Language, testType: TestType): ActiveQuestion[] {
  switch (testType) {
    case "cefr": {
      if (language === "korean") return castAs<ActiveQuestion[]>(getKoreanQuestions());
      const cefrLang: "english" | "thai" = language === "thai" ? "thai" : "english";
      return castAs<ActiveQuestion[]>(getQuestionsForTest(cefrLang));
    }
    case "toeic":
      return castAs<ActiveQuestion[]>(getToeicQuestions());
    case "ielts":
      return castAs<ActiveQuestion[]>(getIeltsQuestions());
    case "cutfl":
      return castAs<ActiveQuestion[]>(getCutflQuestions());
    case "topik":
      return castAs<ActiveQuestion[]>(getKoreanQuestions());
  }
}

export function calculateTestResult(
  testType: TestType,
  questions: ActiveQuestion[],
  answers: (number | null)[]
): PlacementResult {
  switch (testType) {
    case "cefr": {
      const score = calculateScore(castAs<Question[]>(questions), answers);
      const level = determineLevel(castAs<Question[]>(questions), answers);
      const LEVEL_DESC: Record<string, string> = {
        A1: "Mới bắt đầu. Biết các từ và cụm từ cơ bản nhất.",
        A2: "Sơ cấp. Giao tiếp được trong tình huống đơn giản hàng ngày.",
        B1: "Trung cấp. Xử lý được hầu hết tình huống khi đi du lịch.",
        B2: "Trung cao. Giao tiếp trôi chảy với người bản ngữ.",
        C1: "Nâng cao. Sử dụng ngôn ngữ linh hoạt trong học thuật và công việc.",
        C2: "Thành thạo. Gần như tương đương người bản ngữ.",
      };
      return {
        score,
        level,
        rawLabel: `CEFR ${level}`,
        description: LEVEL_DESC[level] ?? "",
      };
    }
    case "toeic":
      return calculateToeicResult(castAs<ToeicQuestion[]>(questions), answers);
    case "ielts":
      return calculateIeltsResult(castAs<IeltsQuestion[]>(questions), answers);
    case "cutfl":
      return calculateCutflResult(castAs<CutflQuestion[]>(questions), answers);
    case "topik":
      return calculateKoreanResult(castAs<Question[]>(questions), answers);
  }
}
