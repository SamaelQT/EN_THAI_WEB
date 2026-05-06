export type Question = {
  id: string;
  section: "vocabulary" | "grammar" | "reading" | "listening_sim";
  level: "A1" | "A2" | "B1" | "B2" | "C1";
  question: string;
  options: string[];
  answer: number; // index
  explanation?: string;
};

export const ENGLISH_QUESTIONS: Question[] = [
  // ── A1 Vocabulary ──────────────────────────────────────────────
  {
    id: "en-v-a1-1",
    section: "vocabulary",
    level: "A1",
    question: "What is the opposite of 'hot'?",
    options: ["warm", "cold", "sunny", "wet"],
    answer: 1,
  },
  {
    id: "en-v-a1-2",
    section: "vocabulary",
    level: "A1",
    question: "Choose the correct word: 'I drink _____ every morning.'",
    options: ["coffee", "run", "happy", "blue"],
    answer: 0,
  },
  {
    id: "en-v-a1-3",
    section: "vocabulary",
    level: "A1",
    question: "Which word means a place where you sleep?",
    options: ["kitchen", "bedroom", "garden", "office"],
    answer: 1,
  },
  // ── A1 Grammar ──────────────────────────────────────────────────
  {
    id: "en-g-a1-1",
    section: "grammar",
    level: "A1",
    question: "Complete: 'She _____ a teacher.'",
    options: ["am", "is", "are", "be"],
    answer: 1,
  },
  {
    id: "en-g-a1-2",
    section: "grammar",
    level: "A1",
    question: "Which is correct?",
    options: [
      "He don't like fish.",
      "He doesn't likes fish.",
      "He doesn't like fish.",
      "He not like fish.",
    ],
    answer: 2,
  },
  {
    id: "en-g-a1-3",
    section: "grammar",
    level: "A1",
    question: "Choose the correct plural: 'one child → two _____'",
    options: ["childs", "childrens", "children", "child"],
    answer: 2,
  },
  // ── A2 Vocabulary ──────────────────────────────────────────────
  {
    id: "en-v-a2-1",
    section: "vocabulary",
    level: "A2",
    question: "'Reliable' means someone you can _____.",
    options: ["avoid", "trust", "ignore", "fear"],
    answer: 1,
  },
  {
    id: "en-v-a2-2",
    section: "vocabulary",
    level: "A2",
    question: "What does 'exhausted' mean?",
    options: ["very happy", "very hungry", "very tired", "very angry"],
    answer: 2,
  },
  {
    id: "en-v-a2-3",
    section: "vocabulary",
    level: "A2",
    question: "Choose the correct word: 'The meeting was _____ to next Monday.'",
    options: ["postponed", "invited", "created", "opened"],
    answer: 0,
  },
  // ── A2 Grammar ──────────────────────────────────────────────────
  {
    id: "en-g-a2-1",
    section: "grammar",
    level: "A2",
    question: "Complete: 'By the time I arrived, she _____ already left.'",
    options: ["has", "had", "have", "was"],
    answer: 1,
  },
  {
    id: "en-g-a2-2",
    section: "grammar",
    level: "A2",
    question: "Which sentence uses 'used to' correctly?",
    options: [
      "I used to playing football.",
      "I used to play football.",
      "I am used to play football.",
      "I use to play football.",
    ],
    answer: 1,
  },
  {
    id: "en-g-a2-3",
    section: "grammar",
    level: "A2",
    question: "Choose the correct comparative: 'This exam is _____ than the last one.'",
    options: ["more difficult", "difficulter", "most difficult", "more difficultly"],
    answer: 0,
  },
  // ── B1 Vocabulary ──────────────────────────────────────────────
  {
    id: "en-v-b1-1",
    section: "vocabulary",
    level: "B1",
    question: "What does 'elaborate' mean?",
    options: [
      "to make simpler",
      "to explain in more detail",
      "to remove something",
      "to combine items",
    ],
    answer: 1,
  },
  {
    id: "en-v-b1-2",
    section: "vocabulary",
    level: "B1",
    question: "'Despite' is closest in meaning to:",
    options: ["because of", "in addition to", "even though", "as a result of"],
    answer: 2,
  },
  {
    id: "en-v-b1-3",
    section: "vocabulary",
    level: "B1",
    question: "Choose the best word: 'The company needs to _____ its costs to remain competitive.'",
    options: ["increase", "duplicate", "reduce", "celebrate"],
    answer: 2,
  },
  // ── B1 Grammar ──────────────────────────────────────────────────
  {
    id: "en-g-b1-1",
    section: "grammar",
    level: "B1",
    question: "Complete the conditional: 'If I _____ more time, I would learn another language.'",
    options: ["have", "had", "will have", "having"],
    answer: 1,
  },
  {
    id: "en-g-b1-2",
    section: "grammar",
    level: "B1",
    question: "Which is a correct passive sentence?",
    options: [
      "The report written by the manager.",
      "The report was wrote by the manager.",
      "The report was written by the manager.",
      "The report has write by the manager.",
    ],
    answer: 2,
  },
  {
    id: "en-g-b1-3",
    section: "grammar",
    level: "B1",
    question: "Choose the correct relative clause: 'The man _____ called yesterday is my uncle.'",
    options: ["which", "whose", "whom", "who"],
    answer: 3,
  },
  // ── B2 Vocabulary ──────────────────────────────────────────────
  {
    id: "en-v-b2-1",
    section: "vocabulary",
    level: "B2",
    question: "'Ambiguous' describes something that:",
    options: [
      "is very clear",
      "can be interpreted in multiple ways",
      "is completely wrong",
      "is very old",
    ],
    answer: 1,
  },
  {
    id: "en-v-b2-2",
    section: "vocabulary",
    level: "B2",
    question: "The word closest in meaning to 'mitigate' is:",
    options: ["worsen", "ignore", "reduce", "create"],
    answer: 2,
  },
  {
    id: "en-v-b2-3",
    section: "vocabulary",
    level: "B2",
    question: "Choose the correct collocation: 'The new policy will _____ significant changes in the sector.'",
    options: ["make", "bring about", "do", "cause of"],
    answer: 1,
  },
  // ── B2 Grammar ──────────────────────────────────────────────────
  {
    id: "en-g-b2-1",
    section: "grammar",
    level: "B2",
    question: "Choose the correct inversion: 'Not only _____ the exam, but she also got the highest score.'",
    options: [
      "she passed",
      "did she pass",
      "she did pass",
      "passed she",
    ],
    answer: 1,
  },
  {
    id: "en-g-b2-2",
    section: "grammar",
    level: "B2",
    question: "Complete: 'It is essential that every employee _____ on time.'",
    options: ["arrives", "arrive", "will arrive", "is arriving"],
    answer: 1,
  },
  // ── B2 Reading ──────────────────────────────────────────────────
  {
    id: "en-r-b2-1",
    section: "reading",
    level: "B2",
    question:
      "Read: 'The proliferation of social media has fundamentally altered the way people consume news, raising concerns about the credibility of information.' What is the main concern mentioned?",
    options: [
      "People spend too much time on social media.",
      "The reliability of news shared on social media.",
      "Traditional media is becoming obsolete.",
      "Social media companies earn too much profit.",
    ],
    answer: 1,
  },
  // ── C1 Vocabulary ──────────────────────────────────────────────
  {
    id: "en-v-c1-1",
    section: "vocabulary",
    level: "C1",
    question: "'Obfuscate' means to:",
    options: [
      "make something clear",
      "deliberately make something difficult to understand",
      "support someone's argument",
      "identify a problem quickly",
    ],
    answer: 1,
  },
  {
    id: "en-v-c1-2",
    section: "vocabulary",
    level: "C1",
    question: "Choose the correct meaning of 'ephemeral':",
    options: ["lasting forever", "very important", "lasting for a very short time", "difficult to understand"],
    answer: 2,
  },
  // ── C1 Grammar ──────────────────────────────────────────────────
  {
    id: "en-g-c1-1",
    section: "grammar",
    level: "C1",
    question: "Choose the correct mixed conditional: 'If the board _____ the proposal last year, we _____ in a better position now.'",
    options: [
      "approved / will be",
      "had approved / would be",
      "has approved / would have been",
      "approved / would be",
    ],
    answer: 1,
  },
  {
    id: "en-g-c1-2",
    section: "grammar",
    level: "C1",
    question: "Which sentence uses a cleft structure correctly?",
    options: [
      "What I need is your support.",
      "What I need your support.",
      "It is what I need your support.",
      "That what I need is support.",
    ],
    answer: 0,
  },
  // ── C1 Reading ──────────────────────────────────────────────────
  {
    id: "en-r-c1-1",
    section: "reading",
    level: "C1",
    question:
      "Read: 'The author argues that economic rationalism, while effective at optimizing short-term gains, systematically undermines the social fabric that sustains long-term prosperity.' The author's stance is best described as:",
    options: [
      "strongly pro-capitalist",
      "critical of purely economic approaches to governance",
      "supportive of short-term economic policies",
      "neutral and objective",
    ],
    answer: 1,
  },
];

export const THAI_QUESTIONS: Question[] = [
  // ── A1 ──────────────────────────────────────────────────────────
  {
    id: "th-v-a1-1",
    section: "vocabulary",
    level: "A1",
    question: "คำว่า 'สวัสดี' (sà-wàt-dee) หมายความว่าอะไร?",
    options: ["Goodbye", "Hello / Good day", "Thank you", "Sorry"],
    answer: 1,
  },
  {
    id: "th-v-a1-2",
    section: "vocabulary",
    level: "A1",
    question: "เลขอะไรในภาษาไทยที่ออกเสียงว่า 'สาม' (săam)?",
    options: ["1", "2", "3", "4"],
    answer: 2,
  },
  {
    id: "th-v-a1-3",
    section: "vocabulary",
    level: "A1",
    question: "คำว่า 'น้ำ' (náam) หมายถึงอะไร?",
    options: ["Fire", "Food", "Water", "Air"],
    answer: 2,
  },
  {
    id: "th-g-a1-1",
    section: "grammar",
    level: "A1",
    question: "ภาษาไทยมีโครงสร้างประโยคพื้นฐานอย่างไร?",
    options: [
      "SOV (Subject-Object-Verb)",
      "SVO (Subject-Verb-Object)",
      "VSO (Verb-Subject-Object)",
      "OVS (Object-Verb-Subject)",
    ],
    answer: 1,
  },
  {
    id: "th-g-a1-2",
    section: "grammar",
    level: "A1",
    question: "ในภาษาไทย คำลงท้ายสุภาพสำหรับผู้หญิงคือ?",
    options: ["ครับ (khráp)", "ค่ะ/คะ (khâ/khá)", "นะ (ná)", "จ้า (jâa)"],
    answer: 1,
  },
  // ── A2 ──────────────────────────────────────────────────────────
  {
    id: "th-v-a2-1",
    section: "vocabulary",
    level: "A2",
    question: "'กิน' (gin) และ 'ทาน' (taan) ต่างกันอย่างไร?",
    options: [
      "กิน = drink, ทาน = eat",
      "กิน = eat (informal), ทาน = eat (polite)",
      "กิน = polite, ทาน = informal",
      "They mean completely different things",
    ],
    answer: 1,
  },
  {
    id: "th-v-a2-2",
    section: "vocabulary",
    level: "A2",
    question: "คำว่า 'แพง' (phaeng) หมายถึง?",
    options: ["Cheap", "Expensive", "Free", "Average"],
    answer: 1,
  },
  {
    id: "th-g-a2-1",
    section: "grammar",
    level: "A2",
    question: "ในภาษาไทย การแสดงความเป็นเจ้าของใช้คำว่า?",
    options: ["ของ (khɔ̌ɔng)", "ใน (nai)", "กับ (gàp)", "ที่ (thîi)"],
    answer: 0,
  },
  {
    id: "th-g-a2-2",
    section: "grammar",
    level: "A2",
    question: "ภาษาไทยมีกี่วรรณยุกต์?",
    options: ["3", "4", "5", "6"],
    answer: 2,
  },
  // ── B1 ──────────────────────────────────────────────────────────
  {
    id: "th-v-b1-1",
    section: "vocabulary",
    level: "B1",
    question: "คำว่า 'สะดวก' (sà-duak) หมายถึง?",
    options: ["Difficult", "Convenient / Comfortable", "Expensive", "Beautiful"],
    answer: 1,
  },
  {
    id: "th-v-b1-2",
    section: "vocabulary",
    level: "B1",
    question: "'ประชุม' (prà-chum) หมายถึง?",
    options: ["To eat", "To sleep", "To meet / have a meeting", "To travel"],
    answer: 2,
  },
  {
    id: "th-g-b1-1",
    section: "grammar",
    level: "B1",
    question: "คำว่า 'กำลัง' (gam-lang) ใช้เพื่อ?",
    options: [
      "แสดงอดีต",
      "แสดงปัจจุบันกาลต่อเนื่อง",
      "แสดงอนาคต",
      "แสดงความสมบูรณ์",
    ],
    answer: 1,
  },
  {
    id: "th-g-b1-2",
    section: "grammar",
    level: "B1",
    question: "คำลักษณนามสำหรับหนังสือในภาษาไทยคือ?",
    options: ["ตัว (tua)", "เล่ม (lêm)", "ใบ (bai)", "อัน (an)"],
    answer: 1,
  },
  // ── B1 extra ─────────────────────────────────────────────────────
  {
    id: "th-v-b1-3",
    section: "vocabulary",
    level: "B1",
    question: "'เปลี่ยนแปลง' (plìan-plæng) หมายถึง?",
    options: ["To repeat", "To change", "To stop", "To begin"],
    answer: 1,
  },
  {
    id: "th-v-b1-4",
    section: "vocabulary",
    level: "B1",
    question: "คำว่า 'เข้าใจ' (khâo-jai) หมายถึง?",
    options: ["To enter", "To think", "To understand", "To remember"],
    answer: 2,
  },
  {
    id: "th-g-b1-3",
    section: "grammar",
    level: "B1",
    question: "คำว่า 'เคย' (khoei) ใช้เพื่อแสดง?",
    options: ["ความถี่ในปัจจุบัน", "ประสบการณ์ในอดีต", "ความตั้งใจในอนาคต", "ความสามารถ"],
    answer: 1,
  },
  {
    id: "th-r-b1-1",
    section: "reading",
    level: "B1",
    question: "อ่าน: 'วันนี้อากาศดีมาก เหมาะสำหรับการออกกำลังกายกลางแจ้ง' ประโยคนี้แนะนำว่าอะไร?",
    options: [
      "ควรอยู่บ้าน",
      "ควรออกไปออกกำลังกาย",
      "อากาศไม่ดี",
      "ไม่ควรออกกำลังกาย",
    ],
    answer: 1,
  },
  // ── B2 ──────────────────────────────────────────────────────────
  {
    id: "th-v-b2-1",
    section: "vocabulary",
    level: "B2",
    question: "คำว่า 'วิเคราะห์' (wí-khráw) หมายถึง?",
    options: ["To create", "To analyze", "To destroy", "To compare"],
    answer: 1,
  },
  {
    id: "th-v-b2-2",
    section: "vocabulary",
    level: "B2",
    question: "'ยืนยัน' (yeun-yan) หมายถึง?",
    options: ["To deny", "To confirm", "To suggest", "To ignore"],
    answer: 1,
  },
  {
    id: "th-v-b2-3",
    section: "vocabulary",
    level: "B2",
    question: "คำว่า 'ตรงประเด็น' (trong-prà-den) หมายถึง?",
    options: ["Off-topic", "Relevant / to the point", "Confusing", "Formal"],
    answer: 1,
  },
  {
    id: "th-g-b2-1",
    section: "grammar",
    level: "B2",
    question: "ประโยค 'ถ้าฉันมีเงินมาก ฉันจะไปเที่ยวญี่ปุ่น' เป็นประโยคประเภทใด?",
    options: [
      "เงื่อนไขที่เป็นจริงในปัจจุบัน",
      "เงื่อนไขสมมุติ",
      "เงื่อนไขในอดีต",
      "ประโยคบอกเล่า",
    ],
    answer: 1,
  },
  {
    id: "th-g-b2-2",
    section: "grammar",
    level: "B2",
    question: "ในภาษาไทยทางการ คำว่า 'ท่าน' ใช้แทน?",
    options: ["I / me (formal)", "You / he / she (respectful)", "They", "We"],
    answer: 1,
  },
  {
    id: "th-r-b2-1",
    section: "reading",
    level: "B2",
    question:
      "อ่าน: 'บริษัทประกาศว่าจะขยายธุรกิจไปยังตลาดต่างประเทศในปีหน้า' ข้อความนี้หมายความว่า?",
    options: [
      "บริษัทจะปิดตัว",
      "บริษัทจะเข้าสู่ตลาดต่างประเทศ",
      "บริษัทลดขนาดลง",
      "บริษัทจะเปลี่ยนผลิตภัณฑ์",
    ],
    answer: 1,
  },
  // ── C1 ──────────────────────────────────────────────────────────
  {
    id: "th-v-c1-1",
    section: "vocabulary",
    level: "C1",
    question: "คำว่า 'ประนีประนอม' (prà-nii-prà-noom) หมายถึง?",
    options: ["To argue strongly", "To compromise", "To celebrate", "To investigate"],
    answer: 1,
  },
  {
    id: "th-v-c1-2",
    section: "vocabulary",
    level: "C1",
    question: "'ดุลยพินิจ' (dun-yá-phí-nít) หมายถึง?",
    options: ["Regulation", "Discretion / judgment", "Agreement", "Authority"],
    answer: 1,
  },
  {
    id: "th-g-c1-1",
    section: "grammar",
    level: "C1",
    question: "สำนวน 'น้ำขึ้นให้รีบตัก' มีความหมายว่า?",
    options: [
      "ควรดื่มน้ำให้มาก",
      "ควรฉวยโอกาสในขณะที่มี",
      "น้ำท่วมเป็นอันตราย",
      "ควรรอจังหวะที่เหมาะสม",
    ],
    answer: 1,
  },
  {
    id: "th-r-c1-1",
    section: "reading",
    level: "C1",
    question:
      "อ่านประโยค: 'การพัฒนาเศรษฐกิจอย่างรวดเร็วได้ส่งผลกระทบต่อสิ่งแวดล้อมอย่างมีนัยสำคัญ' ประโยคนี้กล่าวถึงอะไร?",
    options: [
      "ข้อดีของการพัฒนาเศรษฐกิจ",
      "ผลกระทบด้านสิ่งแวดล้อมจากการพัฒนาเศรษฐกิจ",
      "วิธีแก้ปัญหาสิ่งแวดล้อม",
      "ความสำคัญของเศรษฐกิจ",
    ],
    answer: 1,
  },
  {
    id: "th-r-c1-2",
    section: "reading",
    level: "C1",
    question:
      "อ่าน: 'นโยบายดังกล่าวถูกวิพากษ์วิจารณ์ว่าขาดความโปร่งใสและเอื้อประโยชน์แก่กลุ่มทุนขนาดใหญ่' ผู้เขียนมีทัศนะอย่างไร?",
    options: [
      "สนับสนุนนโยบาย",
      "วิจารณ์นโยบายเรื่องความโปร่งใสและความเป็นธรรม",
      "เป็นกลาง",
      "ไม่แสดงความคิดเห็น",
    ],
    answer: 1,
  },
];

export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const LEVEL_ORDER: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Kept for server fallback only
export function scoreToLevel(score: number): Level {
  if (score >= 95) return "C2";
  if (score >= 85) return "C1";
  if (score >= 70) return "B2";
  if (score >= 52) return "B1";
  if (score >= 35) return "A2";
  return "A1";
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 4 câu mỗi level, random trong từng level, sau đó shuffle tổng
export function getQuestionsForTest(language: "english" | "thai"): Question[] {
  const pool = language === "english" ? ENGLISH_QUESTIONS : THAI_QUESTIONS;
  const levels: Level[] = ["A1", "A2", "B1", "B2", "C1"];
  const selected: Question[] = [];
  for (const level of levels) {
    const levelPool = pool.filter((q) => q.level === level);
    selected.push(...fisherYatesShuffle(levelPool).slice(0, 4));
  }
  return fisherYatesShuffle(selected);
}

// Trọng số theo level: A1=1, A2=2, B1=3, B2=4, C1=5
const LEVEL_WEIGHTS: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 };
const MAX_SCORE = 4 * (1 + 2 + 3 + 4 + 5); // 60

// null = bỏ qua câu hỏi = 0 điểm
export function calculateScore(questions: Question[], answers: (number | null)[]): number {
  let earned = 0;
  for (let i = 0; i < questions.length; i++) {
    if (answers[i] === questions[i].answer) {
      earned += LEVEL_WEIGHTS[questions[i].level] ?? 1;
    }
  }
  return Math.round((earned / MAX_SCORE) * 100);
}

// Level = level cao nhất đúng ≥ 2/4 câu (bỏ qua = sai)
export function determineLevel(questions: Question[], answers: (number | null)[]): Level {
  const stats: Record<string, { correct: number; total: number }> = {};
  for (let i = 0; i < questions.length; i++) {
    const lvl = questions[i].level;
    if (!stats[lvl]) stats[lvl] = { correct: 0, total: 0 };
    stats[lvl].total++;
    if (answers[i] === questions[i].answer) stats[lvl].correct++;
  }
  const order: Level[] = ["C1", "B2", "B1", "A2", "A1"];
  for (const lvl of order) {
    const s = stats[lvl];
    if (s && s.correct / s.total >= 0.5) return lvl;
  }
  return "A1";
}
