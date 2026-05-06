// CU-TFL: Chulalongkorn University Test of Foreign Languages (Thai)
// Levels 1–5 (Level 1 = beginner, Level 5 = advanced)
// 4 questions per level, 20 total

export type CutflQuestion = {
  id: string;
  level: 1 | 2 | 3 | 4 | 5;
  section: "vocabulary" | "grammar" | "reading" | "function";
  question: string;
  options: string[];
  answer: number;
};

// ─── Level 1 – Beginner (A1 equivalent) ──────────────────────────────────────

const LEVEL_1: CutflQuestion[] = [
  {
    id: "cutfl-1-1",
    level: 1,
    section: "vocabulary",
    question: "คำว่า 'ขอบคุณ' (khɔ̀ɔp-khun) แปลเป็นภาษาอังกฤษว่าอะไร?",
    options: ["Sorry", "Hello", "Thank you", "Goodbye"],
    answer: 2,
  },
  {
    id: "cutfl-1-2",
    level: 1,
    section: "vocabulary",
    question: "สีแดง (sĭi daeng) คือสีอะไร?",
    options: ["Blue", "Green", "Yellow", "Red"],
    answer: 3,
  },
  {
    id: "cutfl-1-3",
    level: 1,
    section: "grammar",
    question: "ภาษาไทยมีโครงสร้างประโยคพื้นฐานแบบใด?",
    options: [
      "SOV (Subject-Object-Verb)",
      "SVO (Subject-Verb-Object)",
      "VSO (Verb-Subject-Object)",
      "OVS (Object-Verb-Subject)",
    ],
    answer: 1,
  },
  {
    id: "cutfl-1-4",
    level: 1,
    section: "function",
    question: "ต้องการพูดว่า 'I don't understand' เป็นภาษาไทย ควรพูดว่า?",
    options: ["ไม่ชอบ (mâi chɔ̂ɔp)", "ไม่อยาก (mâi yàak)", "ไม่เข้าใจ (mâi khâo-jai)", "ไม่ได้ (mâi dâai)"],
    answer: 2,
  },
];

// ─── Level 2 – Elementary (A2 equivalent) ────────────────────────────────────

const LEVEL_2: CutflQuestion[] = [
  {
    id: "cutfl-2-1",
    level: 2,
    section: "vocabulary",
    question: "คำว่า 'ใกล้' (glâi) มีความหมายว่า?",
    options: ["Far", "Left", "Near", "Right"],
    answer: 2,
  },
  {
    id: "cutfl-2-2",
    level: 2,
    section: "grammar",
    question: "ในภาษาไทย คำลงท้ายสุภาพสำหรับผู้หญิงคือ?",
    options: ["ครับ (khráp)", "ค่ะ / คะ (khâ / khá)", "นะ (ná)", "จ้า (jâa)"],
    answer: 1,
  },
  {
    id: "cutfl-2-3",
    level: 2,
    section: "reading",
    question: "อ่านประโยค: 'ร้านนี้เปิดตั้งแต่ 8 โมงเช้าถึง 5 โมงเย็น' ร้านเปิดให้บริการกี่ชั่วโมง?",
    options: ["7 ชั่วโมง", "8 ชั่วโมง", "9 ชั่วโมง", "10 ชั่วโมง"],
    answer: 2,
  },
  {
    id: "cutfl-2-4",
    level: 2,
    section: "grammar",
    question: "คำว่า 'ของ' (khɔ̌ɔng) ในภาษาไทยใช้เพื่อแสดงความหมายใด?",
    options: ["แสดงเวลา", "แสดงสถานที่", "แสดงความเป็นเจ้าของ", "แสดงการกระทำ"],
    answer: 2,
  },
];

// ─── Level 3 – Intermediate (B1 equivalent) ──────────────────────────────────

const LEVEL_3: CutflQuestion[] = [
  {
    id: "cutfl-3-1",
    level: 3,
    section: "vocabulary",
    question: "คำว่า 'จำเป็น' (jam-pen) มีความหมายว่า?",
    options: ["Possible", "Difficult", "Necessary", "Important"],
    answer: 2,
  },
  {
    id: "cutfl-3-2",
    level: 3,
    section: "grammar",
    question: "คำว่า 'กำลัง' (gam-lang) ในภาษาไทยใช้เพื่อ?",
    options: [
      "แสดงเหตุการณ์ในอดีต",
      "แสดงการกระทำต่อเนื่องในปัจจุบัน",
      "แสดงเหตุการณ์ในอนาคต",
      "แสดงความเป็นเจ้าของ",
    ],
    answer: 1,
  },
  {
    id: "cutfl-3-3",
    level: 3,
    section: "grammar",
    question: "คำว่า 'แล้ว' (láew) ในประโยค 'ฉันกินข้าวแล้ว' แสดงถึง?",
    options: ["กำลังกินอยู่", "กินเสร็จแล้ว", "อยากจะกิน", "เพิ่งเริ่มกิน"],
    answer: 1,
  },
  {
    id: "cutfl-3-4",
    level: 3,
    section: "reading",
    question: "อ่าน: 'หากฝนตก นักท่องเที่ยวควรหลีกเลี่ยงการเดินป่า' ข้อความนี้แนะนำว่า?",
    options: [
      "ควรออกไปเดินป่าทุกวัน",
      "ห้ามออกจากบ้านเมื่อฝนตก",
      "ไม่ควรเดินป่าเมื่อฝนตก",
      "นักท่องเที่ยวชอบฝน",
    ],
    answer: 2,
  },
];

// ─── Level 4 – Upper-Intermediate (B2 equivalent) ────────────────────────────

const LEVEL_4: CutflQuestion[] = [
  {
    id: "cutfl-4-1",
    level: 4,
    section: "vocabulary",
    question: "คำว่า 'เจรจา' (jee-rá-jaa) มีความหมายว่า?",
    options: ["To celebrate", "To investigate", "To announce", "To negotiate"],
    answer: 3,
  },
  {
    id: "cutfl-4-2",
    level: 4,
    section: "grammar",
    question: "คำเชื่อม 'ถึงแม้ว่า' (thŷng mâe wâa) ใช้เพื่อเชื่อมประโยคที่แสดงความหมายใด?",
    options: ["เหตุผล", "ผลลัพธ์", "ความขัดแย้ง / ยกเว้น", "เงื่อนไขที่เป็นจริง"],
    answer: 2,
  },
  {
    id: "cutfl-4-3",
    level: 4,
    section: "vocabulary",
    question: "คำราชาศัพท์ 'เสวย' ใช้แทนคำว่า?",
    options: ["นอน (to sleep)", "พูด (to speak)", "กิน (to eat)", "เดิน (to walk)"],
    answer: 2,
  },
  {
    id: "cutfl-4-4",
    level: 4,
    section: "reading",
    question: "อ่าน: 'บริษัทได้ดำเนินการปรับโครงสร้างองค์กรเพื่อเพิ่มประสิทธิภาพการดำเนินงาน' ความหมายหลักคือ?",
    options: [
      "บริษัทกำลังจะปิดตัวลง",
      "บริษัทปรับโครงสร้างเพื่อให้ทำงานได้ดีขึ้น",
      "บริษัทกำลังเพิ่มจำนวนพนักงาน",
      "บริษัทกำลังเปลี่ยนผลิตภัณฑ์หลัก",
    ],
    answer: 1,
  },
];

// ─── Level 5 – Advanced (C1 equivalent) ──────────────────────────────────────

const LEVEL_5: CutflQuestion[] = [
  {
    id: "cutfl-5-1",
    level: 5,
    section: "vocabulary",
    question: "คำว่า 'ดุลยพินิจ' (dun-yá-phí-nít) ในภาษาทางการหมายถึง?",
    options: ["Regulation", "Agreement", "Discretion / personal judgment", "Authority"],
    answer: 2,
  },
  {
    id: "cutfl-5-2",
    level: 5,
    section: "grammar",
    question: "สำนวน 'น้ำขึ้นให้รีบตัก' มีความหมายว่า?",
    options: [
      "ควรดื่มน้ำให้มากเมื่อร้อน",
      "ควรรีบฉวยโอกาสในขณะที่มี",
      "น้ำท่วมเป็นอันตรายอย่างยิ่ง",
      "ควรรอจนกว่าสถานการณ์จะสมบูรณ์",
    ],
    answer: 1,
  },
  {
    id: "cutfl-5-3",
    level: 5,
    section: "grammar",
    question: "คำว่า 'อนึ่ง' (à-nŷng) ในภาษาเขียนทางการใช้เพื่อ?",
    options: [
      "เริ่มต้นเรื่องใหม่ทั้งหมด",
      "แสดงการเพิ่มเติมข้อมูลหรือประเด็นย่อย",
      "สรุปประเด็นทั้งหมด",
      "แสดงความขัดแย้งกับประโยคก่อน",
    ],
    answer: 1,
  },
  {
    id: "cutfl-5-4",
    level: 5,
    section: "reading",
    question:
      "อ่าน: 'การพัฒนาอย่างยั่งยืนมิได้หมายถึงเพียงการอนุรักษ์ทรัพยากรธรรมชาติ แต่ยังครอบคลุมถึงความเป็นธรรมทางสังคมและเศรษฐกิจด้วย' ข้อความนี้นิยาม 'การพัฒนาอย่างยั่งยืน' อย่างไร?",
    options: [
      "เน้นเฉพาะการอนุรักษ์สิ่งแวดล้อม",
      "ครอบคลุมทั้งสิ่งแวดล้อม ความเป็นธรรมทางสังคม และเศรษฐกิจ",
      "เน้นการเติบโตทางเศรษฐกิจเป็นหลัก",
      "เน้นความก้าวหน้าทางเทคโนโลยีสีเขียว",
    ],
    answer: 1,
  },
];

// ─── Combined ─────────────────────────────────────────────────────────────────

export const CUTFL_QUESTIONS: CutflQuestion[] = [
  ...LEVEL_1,
  ...LEVEL_2,
  ...LEVEL_3,
  ...LEVEL_4,
  ...LEVEL_5,
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getCutflQuestions(): CutflQuestion[] {
  const byLevel = (n: number) => CUTFL_QUESTIONS.filter((q) => q.level === n);
  return [1, 2, 3, 4, 5].flatMap((n) => shuffle(byLevel(n)));
}

export type CutflResult = {
  score: number;
  level: string;
  rawLabel: string;
  description: string;
};

export function calculateCutflResult(
  questions: CutflQuestion[],
  answers: (number | null)[]
): CutflResult {
  const stats: Record<number, { correct: number; total: number }> = {};
  for (let i = 0; i < questions.length; i++) {
    const lvl = questions[i].level;
    if (!stats[lvl]) stats[lvl] = { correct: 0, total: 0 };
    stats[lvl].total++;
    if (answers[i] === questions[i].answer) stats[lvl].correct++;
  }

  // Highest level with ≥2/4 correct
  let achieved = 0;
  for (let lvl = 5; lvl >= 1; lvl--) {
    const s = stats[lvl];
    if (s && s.correct / s.total >= 0.5) {
      achieved = lvl;
      break;
    }
  }

  const totalCorrect = Object.values(stats).reduce((s, v) => s + v.correct, 0);
  const score = Math.round((totalCorrect / questions.length) * 100);

  const LEVELS: Record<number, { label: string; description: string }> = {
    0: { label: "Pre-Level 1", description: "ต้องการพัฒนาพื้นฐานภาษาไทย เริ่มจากคำศัพท์และประโยคง่ายๆ" },
    1: { label: "Level 1", description: "รู้คำศัพท์และประโยคพื้นฐาน สามารถสื่อสารได้ในสถานการณ์ง่ายมาก" },
    2: { label: "Level 2", description: "สื่อสารในชีวิตประจำวันได้ เข้าใจและตอบสนองในสถานการณ์คุ้นเคย" },
    3: { label: "Level 3", description: "เข้าใจใจความสำคัญของเนื้อหาที่คุ้นเคย สื่อสารและอ่านข้อมูลได้หลากหลายขึ้น" },
    4: { label: "Level 4", description: "ใช้ภาษาไทยได้คล่องในหลายบริบท รวมถึงภาษาทางการและกึ่งทางการ" },
    5: { label: "Level 5", description: "เชี่ยวชาญภาษาไทยในระดับสูง เข้าใจสำนวน ภาษาทางการ และนัยความหมาย" },
  };

  const info = LEVELS[achieved];
  return {
    score,
    level: info.label,
    rawLabel: `CU-TFL ${info.label}`,
    description: info.description,
  };
}
