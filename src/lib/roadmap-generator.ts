export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const LEVEL_ORDER: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Weeks needed to advance between adjacent levels (minimum)
const WEEKS_PER_LEVEL_UP: Record<string, number> = {
  "A1→A2": 4,
  "A2→B1": 6,
  "B1→B2": 8,
  "B2→C1": 12,
  "C1→C2": 16,
};

export type ExamTarget = "TOEIC" | "IELTS" | "general";

// TOEIC score → min level required
const TOEIC_LEVEL: { score: number; level: Level }[] = [
  { score: 990, level: "C1" },
  { score: 785, level: "B2" },
  { score: 550, level: "B1" },
  { score: 255, level: "A2" },
  { score: 0, level: "A1" },
];

// IELTS band → level
const IELTS_LEVEL: { band: number; level: Level }[] = [
  { band: 8.0, level: "C2" },
  { band: 7.0, level: "C1" },
  { band: 5.5, level: "B2" },
  { band: 4.0, level: "B1" },
  { band: 3.0, level: "A2" },
  { band: 0, level: "A1" },
];

export function getTargetLevel(
  exam: ExamTarget,
  targetScore: number
): Level {
  if (exam === "TOEIC") {
    for (const entry of TOEIC_LEVEL) {
      if (targetScore >= entry.score) return entry.level;
    }
    return "A1";
  }
  if (exam === "IELTS") {
    // targetScore stored as band * 10 (e.g. 65 = 6.5)
    const band = targetScore / 10;
    for (const entry of IELTS_LEVEL) {
      if (band >= entry.band) return entry.level;
    }
    return "A1";
  }
  return "B1"; // general default
}

export function calculateRequiredWeeks(from: Level, to: Level): number {
  const fromIdx = LEVEL_ORDER.indexOf(from);
  const toIdx = LEVEL_ORDER.indexOf(to);
  if (toIdx <= fromIdx) return 0;

  let weeks = 0;
  for (let i = fromIdx; i < toIdx; i++) {
    const key = `${LEVEL_ORDER[i]}→${LEVEL_ORDER[i + 1]}`;
    weeks += WEEKS_PER_LEVEL_UP[key] ?? 8;
  }
  return weeks;
}

export function isFeasible(
  from: Level,
  to: Level,
  availableWeeks: number,
  weeklyHours: number
): { feasible: boolean; minWeeks: number; message?: string } {
  const minWeeks = Math.ceil(calculateRequiredWeeks(from, to) / (weeklyHours / 7));
  if (availableWeeks < minWeeks) {
    return {
      feasible: false,
      minWeeks,
      message: `Mục tiêu này cần tối thiểu ${minWeeks} tuần với ${weeklyHours} giờ/tuần. Bạn chỉ có ${availableWeeks} tuần — hãy điều chỉnh deadline hoặc mục tiêu.`,
    };
  }
  return { feasible: true, minWeeks };
}

type WeekPlan = {
  weekNumber: number;
  theme: string;
  skills: string[];
  startDate: Date;
};

const ENGLISH_WEEK_THEMES: Record<Level, string[]> = {
  A1: [
    "Giới thiệu bản thân & gia đình",
    "Số đếm, màu sắc, thời gian",
    "Đồ vật hàng ngày & nhà cửa",
    "Thức ăn & mua sắm",
  ],
  A2: [
    "Động từ thường gặp & thì hiện tại",
    "Du lịch & phương tiện",
    "Sức khỏe & cơ thể",
    "Nghề nghiệp & nơi làm việc",
    "Thì quá khứ đơn",
    "So sánh & tính từ",
  ],
  B1: [
    "Từ vựng TOEIC – Văn phòng",
    "Thì hoàn thành & liên tục",
    "Điều kiện type 1 & 2",
    "Từ đồng nghĩa & trái nghĩa",
    "Đọc hiểu – Email & thư",
    "Nghe – Thông báo & hướng dẫn",
    "Viết – Paragraph cơ bản",
    "Phát âm – Trọng âm từ",
  ],
  B2: [
    "Collocation nâng cao",
    "Câu bị động & đảo ngữ",
    "Từ vựng học thuật (AWL)",
    "Đọc hiểu – Bài báo & essay",
    "Nghe – Lecture & podcast",
    "Viết – Opinion essay",
    "TOEIC Part 5 & 6 chiến lược",
    "TOEIC Part 7 – Đọc nhiều đoạn",
    "IELTS Task 1 – Biểu đồ",
    "IELTS Task 2 – Luận điểm",
    "Phrasal verbs trong ngữ cảnh",
    "Grammar – Subjunctive & Inversion",
  ],
  C1: [
    "Idioms & fixed expressions",
    "Academic writing nâng cao",
    "Listening – native speed content",
    "Speaking – Fluency & cohesion",
    "IELTS Speaking Part 2 & 3",
    "Vocabulary in context – C1 level",
    "Complex grammar – Cleft & Fronting",
    "Error correction & proofreading",
    "Mock IELTS test & review",
    "Mock TOEIC test & review",
    "Presentation & public speaking",
    "Negotiation & formal language",
    "Literature & media analysis",
    "Final review & exam strategies",
    "Practice under exam conditions",
    "Confidence building & mindset",
  ],
  C2: [
    "Advanced literature analysis",
    "Nuance & register mastery",
    "Native-level idioms",
    "Advanced academic writing",
  ],
};

const THAI_WEEK_THEMES: Record<Level, string[]> = {
  A1: [
    "ตัวอักษรไทย – พยัญชนะ",
    "ตัวอักษรไทย – สระและวรรณยุกต์",
    "คำทักทายและแนะนำตัว",
    "ตัวเลขและเวลา",
  ],
  A2: [
    "คำกริยาพื้นฐาน",
    "อาหารและการสั่งอาหาร",
    "การนับและการซื้อของ",
    "ครอบครัวและคน",
    "สี รูปร่าง ขนาด",
    "การเดินทางในเมือง",
  ],
  B1: [
    "คำศัพท์ธุรกิจพื้นฐาน",
    "การนัดหมายและการประชุม",
    "สถานที่และทิศทาง",
    "สุขภาพและร่างกาย",
    "วันหยุดและเทศกาล",
    "คำลักษณนาม",
    "ประโยคซับซ้อน",
    "การอ่านป้ายและประกาศ",
  ],
  B2: [
    "คำศัพท์ธุรกิจขั้นสูง",
    "การเจรจาต่อรอง",
    "ข่าวและสื่อ",
    "วัฒนธรรมและสังคมไทย",
    "การเขียนอีเมลทางการ",
    "สำนวนและสุภาษิต",
    "ภาษาทางการและไม่เป็นทางการ",
    "การฟังภาษาไทยระดับกลาง",
    "ไวยากรณ์ขั้นสูง",
    "การออกเสียงขั้นสูง",
    "บทอ่านระดับกลาง",
    "การสนทนาในสถานการณ์จริง",
  ],
  C1: [
    "ภาษาระดับสูงในบริบทธุรกิจ",
    "การพูดในที่สาธารณะ",
    "วรรณกรรมไทย",
    "สำนวนสุภาพระดับสูง",
    "การเขียนเชิงวิชาการ",
    "ภาษาทางการในเอกสารราชการ",
    "การนำเสนอระดับมืออาชีพ",
    "ทบทวนและประเมินผล",
  ],
  C2: [
    "ความเชี่ยวชาญระดับเจ้าของภาษา",
    "วรรณกรรมและบทกวี",
    "ภาษาระดับ register สูงสุด",
    "ทบทวนขั้นสุดท้าย",
  ],
};

const SKILL_ROTATION = [
  ["vocabulary", "grammar"],
  ["listening", "vocabulary"],
  ["reading", "grammar"],
  ["vocabulary", "speaking"],
  ["writing", "vocabulary"],
  ["grammar", "listening"],
  ["review", "vocabulary"],
];

export function generateWeeklyPlan(
  language: "english" | "thai",
  fromLevel: Level,
  toLevel: Level,
  totalWeeks: number,
  startDate: Date
): WeekPlan[] {
  const themes =
    language === "english" ? ENGLISH_WEEK_THEMES : THAI_WEEK_THEMES;

  const fromIdx = LEVEL_ORDER.indexOf(fromLevel);
  const toIdx = LEVEL_ORDER.indexOf(toLevel);

  // Collect themes across levels
  const allThemes: string[] = [];
  for (let i = fromIdx; i <= toIdx; i++) {
    const lvl = LEVEL_ORDER[i];
    allThemes.push(...(themes[lvl] ?? []));
  }

  const plans: WeekPlan[] = [];
  for (let w = 0; w < totalWeeks; w++) {
    const themeIdx = w % allThemes.length;
    const skillIdx = w % SKILL_ROTATION.length;
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + w * 7);

    plans.push({
      weekNumber: w + 1,
      theme: allThemes[themeIdx] ?? `Ôn tập tuần ${w + 1}`,
      skills: SKILL_ROTATION[skillIdx],
      startDate: weekStart,
    });
  }
  return plans;
}
