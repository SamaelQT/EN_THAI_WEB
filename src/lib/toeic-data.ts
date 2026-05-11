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

// ─── Part 5 – Easy Set B ─────────────────────────────────────────────────────

const P5_EASY_B: ToeicQuestion[] = [
  {
    id: "toeic-p5-e6",
    part: "part5",
    difficulty: "easy",
    question: "The sales team will meet _____ Monday morning to discuss Q4 targets.",
    options: ["on", "at", "in", "for"],
    answer: 0,
  },
  {
    id: "toeic-p5-e7",
    part: "part5",
    difficulty: "easy",
    question: "All meeting rooms _____ reserved in advance through the online booking system.",
    options: ["can be", "must be", "will", "has"],
    answer: 1,
  },
  {
    id: "toeic-p5-e8",
    part: "part5",
    difficulty: "easy",
    question: "The technician repaired the printer _____ a few minutes.",
    options: ["on", "at", "in", "for"],
    answer: 2,
  },
  {
    id: "toeic-p5-e9",
    part: "part5",
    difficulty: "easy",
    question: "Employees _____ submit their timesheets by the last working day of the month.",
    options: ["ought", "should", "would", "may be"],
    answer: 1,
  },
];

// ─── Part 5 – Medium Set B ────────────────────────────────────────────────────

const P5_MEDIUM_B: ToeicQuestion[] = [
  {
    id: "toeic-p5-m6",
    part: "part5",
    difficulty: "medium",
    question: "The marketing manager suggested that the team _____ a new campaign before the end of the quarter.",
    options: ["launched", "launch", "launching", "to launch"],
    answer: 1,
  },
  {
    id: "toeic-p5-m7",
    part: "part5",
    difficulty: "medium",
    question: "The report _____ by the committee was forwarded to the board for final review.",
    options: ["preparing", "prepares", "prepared", "preparer"],
    answer: 2,
  },
  {
    id: "toeic-p5-m8",
    part: "part5",
    difficulty: "medium",
    question: "All customer inquiries will _____ within two business days of receipt.",
    options: ["addressed", "be addressed", "address", "addressing"],
    answer: 1,
  },
  {
    id: "toeic-p5-m9",
    part: "part5",
    difficulty: "medium",
    question: "The position requires _____ in project management and strong communication skills.",
    options: ["expertise", "expert", "expertly", "expertness"],
    answer: 0,
  },
];

// ─── Part 5 – Hard Set B ──────────────────────────────────────────────────────

const P5_HARD_B: ToeicQuestion[] = [
  {
    id: "toeic-p5-h6",
    part: "part5",
    difficulty: "hard",
    question: "Rarely _____ a product that simultaneously reduces costs and improves quality.",
    options: [
      "we have seen",
      "have we seen",
      "did we saw",
      "we saw",
    ],
    answer: 1,
  },
  {
    id: "toeic-p5-h7",
    part: "part5",
    difficulty: "hard",
    question: "The merger agreement, _____ after months of negotiation, was seen as a landmark deal in the industry.",
    options: [
      "finalizing",
      "having been finalized",
      "to be finalize",
      "been finalized",
    ],
    answer: 1,
  },
  {
    id: "toeic-p5-h8",
    part: "part5",
    difficulty: "hard",
    question: "The unexpected decline in sales was attributed _____ to the supply chain disruptions earlier in the year.",
    options: ["largely", "large", "largeness", "enlarge"],
    answer: 0,
  },
  {
    id: "toeic-p5-h9",
    part: "part5",
    difficulty: "hard",
    question: "_____ the regulatory approval is granted, the company plans to launch the product in three new markets.",
    options: ["In case of", "Provided that", "Apart from", "Given to"],
    answer: 1,
  },
];

// ─── Part 7 – Easy Set B ──────────────────────────────────────────────────────

const PASSAGE_EASY_B =
  "To: All Staff\nFrom: Director of Communications\nRe: Company Newsletter – Submission Deadline\n\n" +
  "The next edition of our company newsletter will be published on November 1st. " +
  "All staff members are encouraged to submit articles, department updates, or personal achievements. " +
  "The submission deadline is October 20th. " +
  "Content should be sent to newsletter@company.com. " +
  "Submissions may be edited for length and clarity. " +
  "The newsletter will be distributed digitally to all employees and posted on the staff intranet.";

const P7_EASY_B: ToeicQuestion[] = [
  {
    id: "toeic-p7-e4",
    part: "part7",
    difficulty: "easy",
    passage: PASSAGE_EASY_B,
    question: "When will the newsletter be published?",
    options: ["October 1st", "October 20th", "November 1st", "November 20th"],
    answer: 2,
  },
  {
    id: "toeic-p7-e5",
    part: "part7",
    difficulty: "easy",
    passage: PASSAGE_EASY_B,
    question: "What is the deadline for content submissions?",
    options: ["October 11th", "October 20th", "November 1st", "November 15th"],
    answer: 1,
  },
  {
    id: "toeic-p7-e6",
    part: "part7",
    difficulty: "easy",
    passage: PASSAGE_EASY_B,
    question: "How will the newsletter be distributed?",
    options: [
      "Printed and mailed to employees",
      "Delivered during the staff meeting",
      "Digitally to all employees",
      "Posted on the company's social media",
    ],
    answer: 2,
  },
];

// ─── Part 7 – Medium Set B ────────────────────────────────────────────────────

const PASSAGE_MEDIUM_B =
  "INTERNAL ANNOUNCEMENT\nFrom: Operations Manager\nTo: All Branch Offices\nRe: Updated Customer Service Protocol – Effective March 1st\n\n" +
  "Effective March 1st, all customer service representatives are required to follow the revised three-step resolution protocol for handling complaints. " +
  "Step one requires acknowledgment of the customer's concern within four business hours of first contact. " +
  "Step two involves offering a resolution or escalating to a supervisor if the issue exceeds the representative's authority. " +
  "Step three requires a follow-up call or email within three business days to confirm customer satisfaction. " +
  "All interactions must be logged in the CRM system within one hour of completion. " +
  "Non-compliance may result in a formal performance review.";

const P7_MEDIUM_B: ToeicQuestion[] = [
  {
    id: "toeic-p7-m5",
    part: "part7",
    difficulty: "medium",
    passage: PASSAGE_MEDIUM_B,
    question: "What is the first step in the new complaint resolution protocol?",
    options: [
      "Offer a refund immediately",
      "Escalate to a supervisor",
      "Acknowledge the customer's concern within four hours",
      "Log the interaction in the CRM system",
    ],
    answer: 2,
  },
  {
    id: "toeic-p7-m6",
    part: "part7",
    difficulty: "medium",
    passage: PASSAGE_MEDIUM_B,
    question: "When should a representative escalate a complaint?",
    options: [
      "After 3 business days",
      "When the issue is beyond their authority",
      "Only with the customer's written permission",
      "After the CRM log is completed",
    ],
    answer: 1,
  },
  {
    id: "toeic-p7-m7",
    part: "part7",
    difficulty: "medium",
    passage: PASSAGE_MEDIUM_B,
    question: "How soon must interactions be logged in the CRM system?",
    options: ["Within 30 minutes", "Within one hour", "Within four hours", "Within one business day"],
    answer: 1,
  },
  {
    id: "toeic-p7-m8",
    part: "part7",
    difficulty: "medium",
    passage: PASSAGE_MEDIUM_B,
    question: "What may happen to a representative who does not follow the new protocol?",
    options: [
      "Immediate dismissal",
      "A pay reduction",
      "A formal performance review",
      "Reassignment to another department",
    ],
    answer: 2,
  },
];

// ─── Part 7 – Hard Set B ──────────────────────────────────────────────────────

const PASSAGE_HARD_B =
  "The debate over shareholder primacy versus stakeholder capitalism has intensified following a series of high-profile corporate governance failures. " +
  "Proponents of shareholder primacy argue that companies maximise societal benefit by focusing exclusively on generating returns for investors, " +
  "allowing market mechanisms to allocate resources efficiently. " +
  "Critics contend that this model systematically externalises costs onto employees, communities, and the environment — " +
  "parties that bear significant risk without holding formal voting rights. " +
  "A growing coalition of institutional investors has begun incorporating environmental, social, and governance (ESG) criteria into investment frameworks, " +
  "signalling a structural shift in expectations of corporate accountability. " +
  "Whether this trend represents a fundamental recalibration of capitalism or merely reputational management remains highly contested.";

const P7_HARD_B: ToeicQuestion[] = [
  {
    id: "toeic-p7-h4",
    part: "part7",
    difficulty: "hard",
    passage: PASSAGE_HARD_B,
    question: "What is the main subject of the article?",
    options: [
      "The benefits of ESG investing for retail investors",
      "The debate between shareholder and stakeholder business models",
      "How corporate governance failures led to new regulations",
      "Why institutional investors outperform retail investors",
    ],
    answer: 1,
  },
  {
    id: "toeic-p7-h5",
    part: "part7",
    difficulty: "hard",
    passage: PASSAGE_HARD_B,
    question: "What do critics argue about the shareholder primacy model?",
    options: [
      "It gives employees too much influence over decisions",
      "It transfers all financial risk to the government",
      "It shifts costs onto stakeholders who have no voting rights",
      "It results in excessive regulation of financial markets",
    ],
    answer: 2,
  },
  {
    id: "toeic-p7-h6",
    part: "part7",
    difficulty: "hard",
    passage: PASSAGE_HARD_B,
    question: "The author's tone regarding ESG adoption can best be described as:",
    options: [
      "Strongly supportive and optimistic",
      "Neutral and analytical with unresolved conclusions",
      "Dismissive and critical of institutional investors",
      "Alarmed by recent corporate governance failures",
    ],
    answer: 1,
  },
];

// ─── Selection helpers ────────────────────────────────────────────────────────

function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));
}

function pickOne<T>(a: T[], b: T[]): T[] {
  return Math.random() < 0.5 ? [...a] : [...b];
}

// Weights: easy=1, medium=2, hard=3
const WEIGHTS: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
// Always 8 easy + 9 medium + 8 hard = MAX_RAW 50 regardless of which specific questions are picked
const MAX_RAW = 50;

export function getToeicQuestions(): ToeicQuestion[] {
  // Pick 5 Part 5 from combined pool per tier
  const p5Easy   = pickN([...P5_EASY, ...P5_EASY_B], 5);
  const p5Medium = pickN([...P5_MEDIUM, ...P5_MEDIUM_B], 5);
  const p5Hard   = pickN([...P5_HARD, ...P5_HARD_B], 5);
  // Randomly pick one Part 7 passage set per tier
  const p7Easy   = pickOne(P7_EASY, P7_EASY_B);
  const p7Medium = pickOne(P7_MEDIUM, P7_MEDIUM_B);
  const p7Hard   = pickOne(P7_HARD, P7_HARD_B);
  return [...p5Easy, ...p5Medium, ...p5Hard, ...p7Easy, ...p7Medium, ...p7Hard];
}

// Keep backward-compat export (all questions combined, not used for tests directly)
export const TOEIC_QUESTIONS: ToeicQuestion[] = [
  ...P5_EASY, ...P5_EASY_B,
  ...P5_MEDIUM, ...P5_MEDIUM_B,
  ...P5_HARD, ...P5_HARD_B,
  ...P7_EASY, ...P7_EASY_B,
  ...P7_MEDIUM, ...P7_MEDIUM_B,
  ...P7_HARD, ...P7_HARD_B,
];

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
