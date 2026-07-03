import { getQuestionsForTest, calculateScore, determineLevel } from "./placement-data";
import { getToeicQuestions, calculateToeicResult, type ToeicQuestion } from "./toeic-data";
import { getIeltsQuestions, calculateIeltsResult, type IeltsQuestion } from "./ielts-data";
import { getCutflQuestions, calculateCutflResult, type CutflQuestion } from "./cutfl-data";
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

export function getTestQuestions(language: Language, testType: TestType): ActiveQuestion[] {
  switch (testType) {
    case "cefr": {
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
      // TOPIK uses the general CEFR question set until dedicated TOPIK questions are added
      return castAs<ActiveQuestion[]>(getQuestionsForTest("english" as "english" | "thai"));
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
    case "topik": {
      const score = calculateScore(castAs<Question[]>(questions), answers);
      const level = determineLevel(castAs<Question[]>(questions), answers);
      const TOPIK_DESC: Record<string, string> = {
        A1: "TOPIK I – Cấp độ 1. Biết từ và câu cơ bản nhất.",
        A2: "TOPIK I – Cấp độ 2. Giao tiếp được trong tình huống hàng ngày.",
        B1: "TOPIK II – Cấp độ 3. Dùng tiếng Hàn trong hầu hết tình huống.",
        B2: "TOPIK II – Cấp độ 4. Giao tiếp trôi chảy về nhiều chủ đề.",
        C1: "TOPIK II – Cấp độ 5. Sử dụng tiếng Hàn trong học thuật và công việc.",
        C2: "TOPIK II – Cấp độ 6. Thành thạo, gần như tương đương người bản ngữ.",
      };
      return {
        score,
        level,
        rawLabel: `TOPIK ${level}`,
        description: TOPIK_DESC[level] ?? "",
      };
    }
  }
}
