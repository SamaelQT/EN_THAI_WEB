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

// ─── Level 1 Set B ────────────────────────────────────────────────────────────

const LEVEL_1B: CutflQuestion[] = [
  {
    id: "cutfl-1-5",
    level: 1,
    section: "vocabulary",
    question: "คำว่า 'บ้าน' (bâan) หมายถึง?",
    options: ["School", "Hospital", "House / Home", "Market"],
    answer: 2,
  },
  {
    id: "cutfl-1-6",
    level: 1,
    section: "vocabulary",
    question: "คำว่า 'น้องสาว' (nÔÔng-sǎaw) หมายถึง?",
    options: ["Older sister", "Younger sister", "Mother", "Aunt"],
    answer: 1,
  },
  {
    id: "cutfl-1-7",
    level: 1,
    section: "grammar",
    question: "ในภาษาไทย ประโยค 'ฉันชอบกินข้าว' มีโครงสร้างแบบใด?",
    options: [
      "Subject + Object + Verb",
      "Subject + Verb + Object",
      "Verb + Subject + Object",
      "Object + Verb + Subject",
    ],
    answer: 1,
  },
  {
    id: "cutfl-1-8",
    level: 1,
    section: "function",
    question: "คุณจะพูดว่าอะไรเมื่อต้องการพูดว่า 'Excuse me'?",
    options: ["ขอโทษครับ/ค่ะ (khɔ̌ɔ-thôot)", "ไม่เป็นไร (mâi-pen-rai)", "สวัสดี (sà-wàt-dee)", "ขอบคุณ (khɔ̀ɔp-khun)"],
    answer: 0,
  },
];

// ─── Level 2 Set B ────────────────────────────────────────────────────────────

const LEVEL_2B: CutflQuestion[] = [
  {
    id: "cutfl-2-5",
    level: 2,
    section: "vocabulary",
    question: "คำว่า 'ตลาด' (tà-làat) หมายถึง?",
    options: ["Restaurant", "Market", "Hospital", "Hotel"],
    answer: 1,
  },
  {
    id: "cutfl-2-6",
    level: 2,
    section: "grammar",
    question: "ในภาษาไทย คำว่า 'ไม่' (mâi) ใช้เพื่อ?",
    options: ["แสดงคำถาม", "แสดงความเป็นเจ้าของ", "แสดงการปฏิเสธ", "แสดงการเปรียบเทียบ"],
    answer: 2,
  },
  {
    id: "cutfl-2-7",
    level: 2,
    section: "vocabulary",
    question: "คำว่า 'หิว' (hǐu) หมายถึง?",
    options: ["Thirsty", "Tired", "Hungry", "Hot"],
    answer: 2,
  },
  {
    id: "cutfl-2-8",
    level: 2,
    section: "function",
    question: "คุณจะตอบอย่างไรเมื่อมีคนถามว่า 'สบายดีไหม' (sà-baai-dee-mǎi)?",
    options: ["ฉันหิวมาก", "สบายดีครับ (sà-baai dee khráp)", "ขอบคุณมาก", "ยินดีต้อนรับ"],
    answer: 1,
  },
];

// ─── Level 3 Set B ────────────────────────────────────────────────────────────

const LEVEL_3B: CutflQuestion[] = [
  {
    id: "cutfl-3-5",
    level: 3,
    section: "vocabulary",
    question: "คำว่า 'อนุญาต' (à-nú-yâat) หมายถึง?",
    options: ["To forbid", "To permit / allow", "To request", "To explain"],
    answer: 1,
  },
  {
    id: "cutfl-3-6",
    level: 3,
    section: "grammar",
    question: "ประโยค 'ถ้าฝนตก ฉันจะอยู่บ้าน' เป็นประโยคประเภทใด?",
    options: ["ประโยคบอกเล่า", "ประโยคแสดงเงื่อนไข", "ประโยคคำถาม", "ประโยคปฏิเสธ"],
    answer: 1,
  },
  {
    id: "cutfl-3-7",
    level: 3,
    section: "vocabulary",
    question: "คำว่า 'ยืม' (yʉʉm) และ 'ให้ยืม' ต่างกันอย่างไร?",
    options: [
      "ยืม = to lend, ให้ยืม = to borrow",
      "ยืม = to borrow, ให้ยืม = to lend",
      "ทั้งสองคำมีความหมายเหมือนกัน",
      "ยืม = to buy, ให้ยืม = to sell",
    ],
    answer: 1,
  },
  {
    id: "cutfl-3-8",
    level: 3,
    section: "reading",
    question: "อ่าน: 'ร้านยาเปิดทุกวันยกเว้นวันอาทิตย์' ร้านยาเปิดกี่วันต่อสัปดาห์?",
    options: ["5 วัน", "6 วัน", "7 วัน", "4 วัน"],
    answer: 1,
  },
];

// ─── Level 4 Set B ────────────────────────────────────────────────────────────

const LEVEL_4B: CutflQuestion[] = [
  {
    id: "cutfl-4-5",
    level: 4,
    section: "vocabulary",
    question: "คำว่า 'ประมวลผล' (prà-muan-phǒn) มีความหมายว่า?",
    options: ["To summarise", "To process / compile results", "To translate", "To distribute"],
    answer: 1,
  },
  {
    id: "cutfl-4-6",
    level: 4,
    section: "grammar",
    question: "คำราชาศัพท์ 'ประทับ' ใช้แทนคำว่า?",
    options: ["นั่ง (to sit)", "นอน (to sleep)", "กิน (to eat)", "เดิน (to walk)"],
    answer: 0,
  },
  {
    id: "cutfl-4-7",
    level: 4,
    section: "vocabulary",
    question: "คำว่า 'โปร่งใส' (prôong-sǎi) ในบริบทการบริหารงานหมายถึง?",
    options: ["Colourless", "Transparent / accountable", "Efficient", "Modern"],
    answer: 1,
  },
  {
    id: "cutfl-4-8",
    level: 4,
    section: "reading",
    question: "อ่าน: 'ที่ประชุมมีมติเป็นเอกฉันท์ให้ดำเนินโครงการต่อไป' ความหมายหลักคือ?",
    options: [
      "ที่ประชุมปฏิเสธโครงการ",
      "ที่ประชุมอนุมัติโครงการอย่างเป็นเอกฉันท์",
      "ที่ประชุมยังไม่ตัดสินใจ",
      "โครงการถูกเลื่อนออกไป",
    ],
    answer: 1,
  },
];

// ─── Level 5 Set B ────────────────────────────────────────────────────────────

const LEVEL_5B: CutflQuestion[] = [
  {
    id: "cutfl-5-5",
    level: 5,
    section: "vocabulary",
    question: "คำว่า 'อำนวยความสะดวก' (am-nuai-khwaam-sà-duak) หมายถึง?",
    options: ["To obstruct", "To facilitate", "To supervise", "To evaluate"],
    answer: 1,
  },
  {
    id: "cutfl-5-6",
    level: 5,
    section: "grammar",
    question: "สำนวน 'ตีงูให้หลังหัก' มีความหมายว่า?",
    options: [
      "ต้องฆ่าสัตว์อันตรายก่อนที่มันจะทำอันตราย",
      "ทำให้ศัตรูหมดพิษสงอย่างเด็ดขาด",
      "ใช้ไม้ตีสัตว์เลื้อยคลาน",
      "หลีกเลี่ยงการเผชิญกับอันตราย",
    ],
    answer: 1,
  },
  {
    id: "cutfl-5-7",
    level: 5,
    section: "grammar",
    question: "คำว่า 'ทั้งนี้' (tháng-níi) ในภาษาเขียนทางการใช้เพื่อ?",
    options: [
      "แสดงการสรุปทั้งหมดอีกครั้ง",
      "เพิ่มข้อมูลที่เกี่ยวข้องหรืออ้างอิงถึงสิ่งที่กล่าวมา",
      "แสดงความขัดแย้งกับประโยคก่อนหน้า",
      "เริ่มต้นเรื่องราวใหม่ทั้งหมด",
    ],
    answer: 1,
  },
  {
    id: "cutfl-5-8",
    level: 5,
    section: "reading",
    question:
      "อ่าน: 'มาตรการดังกล่าวมุ่งเน้นการสร้างสมดุลระหว่างการพัฒนาเศรษฐกิจและการอนุรักษ์สิ่งแวดล้อมอย่างยั่งยืน' ข้อความนี้กล่าวถึงเป้าหมายใด?",
    options: [
      "การเติบโตทางเศรษฐกิจโดยไม่คำนึงถึงสิ่งแวดล้อม",
      "การหยุดการพัฒนาเพื่อรักษาสิ่งแวดล้อม",
      "การสร้างความสมดุลระหว่างการพัฒนาและการอนุรักษ์สิ่งแวดล้อม",
      "การให้ความสำคัญกับสิ่งแวดล้อมมากกว่าเศรษฐกิจ",
    ],
    answer: 2,
  },
];

// ─── Combined ─────────────────────────────────────────────────────────────────

export const CUTFL_QUESTIONS: CutflQuestion[] = [
  ...LEVEL_1, ...LEVEL_1B,
  ...LEVEL_2, ...LEVEL_2B,
  ...LEVEL_3, ...LEVEL_3B,
  ...LEVEL_4, ...LEVEL_4B,
  ...LEVEL_5, ...LEVEL_5B,
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
  const allByLevel = (n: number) => CUTFL_QUESTIONS.filter((q) => q.level === n);
  // Pick exactly 4 questions per level from the combined pool (shuffled)
  return [1, 2, 3, 4, 5].flatMap((n) => shuffle(allByLevel(n)).slice(0, 4));
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
