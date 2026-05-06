export type ToeicQuestion = {
  id: string;
  part: "part5" | "part7";
  difficulty: "easy" | "medium" | "hard";
  passage?: string;
  question: string;
  options: string[];
  answer: number;
};

// ─── Part 5 – Easy (basic grammar/prepositions/tense) ───────────────────────

const P5_EASY: ToeicQuestion[] = [
  {
    id: "toeic-p5-e1",
    part: "part5",
    difficulty: "easy",
    question: "The manager asked all employees to submit their timesheets _____ Friday.",
    options: ["on", "at", "in", "for"],
    answer: 0,
  },
  {
    id: "toeic-p5-e2",
    part: "part5",
    difficulty: "easy",
    question: "The company _____ founded in 1990 by two engineers.",
    options: ["is", "was", "were", "has"],
    answer: 1,
  },
  {
    id: "toeic-p5-e3",
    part: "part5",
    difficulty: "easy",
    question: "Please _____ any technical issues to the IT help desk immediately.",
    options: ["report", "reporting", "reported", "reports"],
    answer: 0,
  },
  {
    id: "toeic-p5-e4",
    part: "part5",
    difficulty: "easy",
    question: "The new safety guidelines _____ effective starting next Monday.",
    options: ["become", "becomes", "became", "becoming"],
    answer: 0,
  },
  {
    id: "toeic-p5-e5",
    part: "part5",
    difficulty: "easy",
    question: "We are looking for _____ experienced marketing coordinator to join our team.",
    options: ["a", "an", "the", "—"],
    answer: 1,
  },
];

// ─── Part 5 – Medium (passive voice, relative clauses, business vocab) ────────

const P5_MEDIUM: ToeicQuestion[] = [
  {
    id: "toeic-p5-m1",
    part: "part5",
    difficulty: "medium",
    question: "The annual budget report _____ to all department heads by the end of this week.",
    options: [
      "will be distributed",
      "will distribute",
      "is distributing",
      "has distribute",
    ],
    answer: 0,
  },
  {
    id: "toeic-p5-m2",
    part: "part5",
    difficulty: "medium",
    question: "The candidate _____ application was shortlisted has been contacted for an interview.",
    options: ["whose", "which", "who", "that"],
    answer: 0,
  },
  {
    id: "toeic-p5-m3",
    part: "part5",
    difficulty: "medium",
    question: "The board of directors decided to _____ the project timeline by three weeks.",
    options: ["extend", "extension", "extends", "extending"],
    answer: 0,
  },
  {
    id: "toeic-p5-m4",
    part: "part5",
    difficulty: "medium",
    question: "The CEO insisted on _____ the contract before the merger announcement.",
    options: ["finalizing", "finalize", "to finalize", "finalized"],
    answer: 0,
  },
  {
    id: "toeic-p5-m5",
    part: "part5",
    difficulty: "medium",
    question: "The new policy _____ employees from using personal devices on the factory floor.",
    options: ["prohibits", "prevents from", "restricts of", "denies"],
    answer: 0,
  },
];

// ─── Part 5 – Hard (subjunctive, inversion, advanced constructions) ──────────

const P5_HARD: ToeicQuestion[] = [
  {
    id: "toeic-p5-h1",
    part: "part5",
    difficulty: "hard",
    question: "The compliance committee recommended that each regional office _____ its internal audit procedures.",
    options: ["revises", "revise", "revised", "revising"],
    answer: 1,
  },
  {
    id: "toeic-p5-h2",
    part: "part5",
    difficulty: "hard",
    question: "Not only _____ the quarterly targets, but the division also secured three major new clients.",
    options: [
      "the company exceeded",
      "did the company exceed",
      "exceeded the company",
      "the company did exceed",
    ],
    answer: 1,
  },
  {
    id: "toeic-p5-h3",
    part: "part5",
    difficulty: "hard",
    question: "The proposal, _____ by three independent departments, was approved by the full board.",
    options: [
      "having been reviewed",
      "being reviewed",
      "to be reviewed",
      "having reviewed",
    ],
    answer: 0,
  },
  {
    id: "toeic-p5-h4",
    part: "part5",
    difficulty: "hard",
    question: "Revenue rose 18% in Q3; _____, operating expenses also climbed, compressing profit margins.",
    options: ["however", "therefore", "furthermore", "similarly"],
    answer: 0,
  },
  {
    id: "toeic-p5-h5",
    part: "part5",
    difficulty: "hard",
    question: "The acquisition agreement contains a _____ provision that prevents either party from withdrawing for 120 days.",
    options: ["lock-in", "opt-out", "stand-alone", "break-even"],
    answer: 0,
  },
];

// ─── Part 7 – Easy (short email/notice, 3 questions) ─────────────────────────

const PASSAGE_EASY =
  "To: All Staff\nFrom: Human Resources Department\nRe: Office Closure – National Holiday\n\n" +
  "Please be advised that our offices will be closed on Monday, October 14th in observance of the national holiday. " +
  "Regular working hours will resume on Tuesday, October 15th. " +
  "If you have urgent matters requiring attention during the closure, please contact your direct supervisor by email. " +
  "Employees who need to work remotely on that day must obtain prior approval from their manager no later than Friday, October 11th. " +
  "We wish everyone a pleasant long weekend.";

const P7_EASY: ToeicQuestion[] = [
  {
    id: "toeic-p7-e1",
    part: "part7",
    difficulty: "easy",
    passage: PASSAGE_EASY,
    question: "Why will the office be closed on October 14th?",
    options: ["Staff training day", "Building maintenance", "National holiday", "Annual company retreat"],
    answer: 2,
  },
  {
    id: "toeic-p7-e2",
    part: "part7",
    difficulty: "easy",
    passage: PASSAGE_EASY,
    question: "When will normal working hours resume?",
    options: ["Monday, October 14th", "Tuesday, October 15th", "Wednesday, October 16th", "Friday, October 11th"],
    answer: 1,
  },
  {
    id: "toeic-p7-e3",
    part: "part7",
    difficulty: "easy",
    passage: PASSAGE_EASY,
    question: "What must employees do if they wish to work remotely on the holiday?",
    options: [
      "Send an email to HR",
      "Submit a written request to the CEO",
      "Get approval from their manager by Friday",
      "No action is required",
    ],
    answer: 2,
  },
];

// ─── Part 7 – Medium (policy memo, 4 questions) ───────────────────────────────

const PASSAGE_MEDIUM =
  "MEMORANDUM\nTo: All Employees\nFrom: Finance Department\nRe: Updated Travel Reimbursement Policy – Effective January 1\n\n" +
  "The Finance Department is pleased to announce updates to our travel reimbursement policy. " +
  "Effective January 1, employees must submit all expense receipts within 14 business days of returning from a trip. " +
  "Claims submitted after this deadline will not be processed regardless of circumstances. " +
  "The maximum daily meal allowance will increase from $45 to $60. " +
  "All hotel accommodations must be booked through the company's approved travel portal. " +
  "Bookings made outside the portal will be reimbursed only at the equivalent portal rate, not the actual cost paid. " +
  "For questions or exceptions, contact traveldesk@company.com.";

const P7_MEDIUM: ToeicQuestion[] = [
  {
    id: "toeic-p7-m1",
    part: "part7",
    difficulty: "medium",
    passage: PASSAGE_MEDIUM,
    question: "What is the new deadline for submitting travel receipts?",
    options: ["7 business days", "14 business days", "30 calendar days", "60 calendar days"],
    answer: 1,
  },
  {
    id: "toeic-p7-m2",
    part: "part7",
    difficulty: "medium",
    passage: PASSAGE_MEDIUM,
    question: "What is the new daily meal reimbursement limit?",
    options: ["$45", "$50", "$55", "$60"],
    answer: 3,
  },
  {
    id: "toeic-p7-m3",
    part: "part7",
    difficulty: "medium",
    passage: PASSAGE_MEDIUM,
    question: "What happens if an employee books a hotel outside the approved portal?",
    options: [
      "The booking is fully reimbursed",
      "The booking is not reimbursed at all",
      "Reimbursement is limited to the portal equivalent rate",
      "The employee must seek manager approval first",
    ],
    answer: 2,
  },
  {
    id: "toeic-p7-m4",
    part: "part7",
    difficulty: "medium",
    passage: PASSAGE_MEDIUM,
    question: "What can be inferred about the previous meal allowance policy?",
    options: [
      "There was no daily limit before",
      "The previous limit was higher than $60",
      "The limit was $45 per day",
      "Meals were not reimbursable before",
    ],
    answer: 2,
  },
];

// ─── Part 7 – Hard (analytical article, 3 questions) ─────────────────────────

const PASSAGE_HARD =
  "The accelerated adoption of hybrid work arrangements has fundamentally altered commercial real estate markets worldwide. " +
  "Major corporations, once anchored to flagship city-center headquarters, are now renegotiating long-term leases or transitioning to flexible co-working arrangements. " +
  "A recent industry survey revealed that 64% of Fortune 500 companies intend to reduce their overall office footprint by at least 20% over the next three years. " +
  "While this shift promises significant cost savings — commercial lease expenses represent the second-largest operational cost for most large organizations — " +
  "it also introduces complex challenges related to team cohesion, knowledge transfer, and corporate culture. " +
  "Real estate analysts predict that secondary urban markets and suburban office corridors will benefit disproportionately as companies seek cost-effective alternatives to premium downtown locations. " +
  "Meanwhile, landlords of class-A city-center properties face mounting pressure to repurpose or significantly upgrade underperforming assets.";

const P7_HARD: ToeicQuestion[] = [
  {
    id: "toeic-p7-h1",
    part: "part7",
    difficulty: "hard",
    passage: PASSAGE_HARD,
    question: "What is the primary subject of the article?",
    options: [
      "The benefits of remote work for individual employees",
      "The effect of hybrid work on commercial real estate",
      "Strategies for maintaining corporate culture remotely",
      "The financial performance of co-working companies",
    ],
    answer: 1,
  },
  {
    id: "toeic-p7-h2",
    part: "part7",
    difficulty: "hard",
    passage: PASSAGE_HARD,
    question: "According to the article, what percentage of Fortune 500 firms plan to cut office space?",
    options: ["44%", "54%", "64%", "74%"],
    answer: 2,
  },
  {
    id: "toeic-p7-h3",
    part: "part7",
    difficulty: "hard",
    passage: PASSAGE_HARD,
    question: "What can be inferred about class-A city-center property landlords?",
    options: [
      "They are benefiting from the hybrid work trend",
      "They face increasing challenges due to reduced office demand",
      "They are converting offices into residential units",
      "They have already signed new long-term leases with major tenants",
    ],
    answer: 1,
  },
];

// ─── All questions combined ───────────────────────────────────────────────────

export const TOEIC_QUESTIONS: ToeicQuestion[] = [
  ...P5_EASY,
  ...P5_MEDIUM,
  ...P5_HARD,
  ...P7_EASY,
  ...P7_MEDIUM,
  ...P7_HARD,
];

// Weights: easy=1, medium=2, hard=3
const WEIGHTS: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
const MAX_RAW = TOEIC_QUESTIONS.reduce((s, q) => s + WEIGHTS[q.difficulty], 0); // 50

export function getToeicQuestions(): ToeicQuestion[] {
  // shuffle within each difficulty tier, then interleave
  const byDiff = (d: string) =>
    [...TOEIC_QUESTIONS.filter((q) => q.difficulty === d)].sort(() => Math.random() - 0.5);
  return [...byDiff("easy"), ...byDiff("medium"), ...byDiff("hard")];
}

export type ToeicResult = {
  score: number;
  level: string;
  rawLabel: string;
  description: string;
};

export function calculateToeicResult(
  questions: ToeicQuestion[],
  answers: (number | null)[]
): ToeicResult {
  let earned = 0;
  for (let i = 0; i < questions.length; i++) {
    if (answers[i] === questions[i].answer) {
      earned += WEIGHTS[questions[i].difficulty] ?? 1;
    }
  }
  const pct = earned / MAX_RAW;
  const score = Math.round(pct * 100);

  let level: string;
  let rawLabel: string;
  let description: string;

  if (pct >= 0.9) {
    level = "Proficient";
    rawLabel = "~905–990";
    description = "Xuất sắc. Bạn có thể hiểu và sử dụng tiếng Anh thương mại ở mức chuyên nghiệp cao nhất.";
  } else if (pct >= 0.76) {
    level = "Advanced";
    rawLabel = "~785–900";
    description = "Nâng cao. Bạn giao tiếp hiệu quả trong hầu hết môi trường công việc quốc tế.";
  } else if (pct >= 0.56) {
    level = "Upper-Intermediate";
    rawLabel = "~605–780";
    description = "Trung cao. Bạn xử lý tốt các tình huống kinh doanh thông thường và có thể làm việc trong môi trường quốc tế.";
  } else if (pct >= 0.36) {
    level = "Intermediate";
    rawLabel = "~405–600";
    description = "Trung cấp. Bạn hiểu các tình huống kinh doanh quen thuộc nhưng cần cải thiện độ chính xác.";
  } else if (pct >= 0.21) {
    level = "Elementary";
    rawLabel = "~255–400";
    description = "Sơ cấp. Bạn xử lý được các tình huống giao tiếp cơ bản nhưng gặp khó khăn với nội dung phức tạp.";
  } else {
    level = "Beginner";
    rawLabel = "~10–250";
    description = "Mới bắt đầu. Cần xây dựng nền tảng từ vựng và ngữ pháp tiếng Anh.";
  }

  return { score, level, rawLabel: `TOEIC ${rawLabel}`, description };
}
