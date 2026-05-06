import { getQuestionsForTest, calculateScore, determineLevel } from "./placement-data";
import { getToeicQuestions, calculateToeicResult, type ToeicQuestion } from "./toeic-data";
import { getIeltsQuestions, calculateIeltsResult, type IeltsQuestion } from "./ielts-data";
import { getCutflQuestions, calculateCutflResult, type CutflQuestion } from "./cutfl-data";
import type { Question } from "./placement-data";

export type TestType = "cefr" | "toeic" | "ielts" | "cutfl";
export type Language = "english" | "thai";

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
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function castAs<T>(v: unknown): T { return v as T; }

export function getTestQuestions(language: Language, testType: TestType): ActiveQuestion[] {
  switch (testType) {
    case "cefr":
      return castAs<ActiveQuestion[]>(getQuestionsForTest(language));
    case "toeic":
      return castAs<ActiveQuestion[]>(getToeicQuestions());
    case "ielts":
      return castAs<ActiveQuestion[]>(getIeltsQuestions());
    case "cutfl":
      return castAs<ActiveQuestion[]>(getCutflQuestions());
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
  }
}
