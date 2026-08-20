export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const LEVEL_ORDER: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

const WEEKS_PER_LEVEL_UP: Record<string, number> = {
  "A1→A2": 4,
  "A2→B1": 6,
  "B1→B2": 8,
  "B2→C1": 12,
  "C1→C2": 16,
};

export type ExamTarget = "TOEIC" | "IELTS" | "general";

const TOEIC_LEVEL: { score: number; level: Level }[] = [
  { score: 990, level: "C1" },
  { score: 785, level: "B2" },
  { score: 550, level: "B1" },
  { score: 255, level: "A2" },
  { score: 0, level: "A1" },
];

const IELTS_LEVEL: { band: number; level: Level }[] = [
  { band: 8.0, level: "C2" },
  { band: 7.0, level: "C1" },
  { band: 5.5, level: "B2" },
  { band: 4.0, level: "B1" },
  { band: 3.0, level: "A2" },
  { band: 0, level: "A1" },
];

export function getTargetLevel(exam: ExamTarget, targetScore: number): Level {
  if (exam === "TOEIC") {
    for (const entry of TOEIC_LEVEL) {
      if (targetScore >= entry.score) return entry.level;
    }
    return "A1";
  }
  if (exam === "IELTS") {
    const band = targetScore / 10;
    for (const entry of IELTS_LEVEL) {
      if (band >= entry.band) return entry.level;
    }
    return "A1";
  }
  return "B1";
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

// ─── Scheduling helpers ───────────────────────────────────────────────────────

/**
 * Normalise a busyDays array so scheduling can never loop forever.
 * If the caller marks all 7 weekdays as busy there is no date left to schedule on,
 * so we drop the constraint entirely rather than spinning.
 */
export function safeBusyDays(busyDays: number[] | null | undefined): number[] {
  const unique = [...new Set((busyDays ?? []).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))];
  return unique.length >= 7 ? [] : unique;
}

/** Next date strictly after `from` that is not a busy day */
export function nextNonBusyDate(from: Date, busyDays: number[]): Date {
  const busy = safeBusyDays(busyDays);
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  while (busy.includes(d.getDay())) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

/**
 * Produce a list of `count` calendar dates starting from (and including) `startDate`,
 * skipping any day whose getDay() is in busyDays.
 * sessionsPerDay > 1 means the same calendar date is repeated that many times.
 */
export function scheduleDates(startDate: Date, count: number, busyDays: number[], sessionsPerDay = 1): Date[] {
  const busy = safeBusyDays(busyDays);
  const perDay = Math.max(1, Math.floor(sessionsPerDay));
  const dates: Date[] = [];
  const d = new Date(startDate);
  d.setHours(0, 0, 0, 0);
  // If startDate itself is a busy day, advance to first non-busy
  while (busy.includes(d.getDay())) {
    d.setDate(d.getDate() + 1);
  }
  while (dates.length < count) {
    for (let s = 0; s < perDay && dates.length < count; s++) {
      dates.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
    while (busy.includes(d.getDay())) {
      d.setDate(d.getDate() + 1);
    }
  }
  return dates;
}

// ─── TOEIC Week Themes ────────────────────────────────────────────────────────
// Focused on Listening (Part 1-4) + Reading (Part 5-7). No speaking/writing.

export const TOEIC_WEEK_THEMES: Record<Level, string[]> = {
  A1: [
    "Part 1 – Mô tả ảnh cơ bản: Vật thể & địa điểm",
    "Part 2 – Câu hỏi Yes/No đơn giản",
    "Từ vựng TOEIC – Số đếm, thời gian, ngày tháng",
    "Từ vựng TOEIC – Đồ vật văn phòng thông dụng",
  ],
  A2: [
    "Part 1 – Mô tả người và hành động trong ảnh",
    "Part 2 – Câu hỏi Wh- (What / Where / When / Who)",
    "Part 5 – Nhận biết từ loại: Danh từ & Động từ",
    "Part 5 – Mạo từ a/an/the trong câu TOEIC",
    "Từ vựng TOEIC – Văn phòng & thiết bị cơ bản",
    "Part 2 – Tag questions & Câu hỏi gián tiếp",
  ],
  B1: [
    "Part 3 – Hội thoại ngắn: Chủ đề công việc & cuộc hẹn",
    "Part 4 – Bài nói: Thông báo nội bộ & hướng dẫn",
    "Part 5 – Giới từ & Liên từ thông dụng",
    "Part 5 – Đại từ & Câu bị động cơ bản",
    "Part 6 – Điền từ vào đoạn email & memo",
    "Part 7 – Đọc email & thư từ đơn lẻ",
    "Từ vựng TOEIC – Tài chính, ngân hàng & kế toán",
    "Từ vựng TOEIC – Nhân sự, tuyển dụng & phúc lợi",
  ],
  B2: [
    "Part 3 – Hội thoại 3 người & câu hỏi suy luận ngụ ý",
    "Part 4 – Bài nói dài: Quảng cáo, tin tức & báo cáo",
    "Part 5 – Thì hoàn thành & Câu điều kiện",
    "Part 5 – Câu bị động nâng cao & Câu phức",
    "Part 6 – Câu nối ý & cohesion devices trong đoạn văn",
    "Part 7 – Đọc nhiều đoạn: Email + Thông báo ghép",
    "Part 7 – Biểu đồ & Bảng biểu kèm văn bản",
    "Part 7 – Câu hỏi suy luận & NOT TRUE",
    "Từ vựng TOEIC – Logistics, vận chuyển & xuất nhập khẩu",
    "Từ vựng TOEIC – Marketing, bán hàng & chăm sóc khách hàng",
    "Chiến lược quản lý thời gian – Phân bổ 120 phút thi",
    "Mock Test Part 5 & 6 – Phân tích lỗi sai chi tiết",
  ],
  C1: [
    "Mock TOEIC Full Test – Phân tích toàn diện Part 1-7",
    "Part 7 – Double & Triple passages: Chiến lược đọc nhanh",
    "Part 3 & 4 – Kỹ năng dự đoán đáp án trước khi nghe",
    "Từ vựng C1 – Business English nâng cao",
    "Ngữ pháp nâng cao – Inversion, Cleft sentences",
    "Tốc độ đọc – Speed reading Part 7 mục tiêu 990",
    "Mock Test 990 – Phân tích lỗi sai & chiến lược điểm cao",
    "Final sprint – Điểm 900+ mindset & exam conditions",
  ],
  C2: [
    "Perfect 990 strategies & error-zero mindset",
    "Advanced business vocabulary mastery",
    "Full mock test under timed conditions",
    "Final exam review & confidence building",
  ],
};

// ─── IELTS Week Themes ────────────────────────────────────────────────────────
// All 4 skills: Listening, Reading, Writing (Task 1 & 2), Speaking (3 parts).

export const IELTS_WEEK_THEMES: Record<Level, string[]> = {
  A1: [
    "Phát âm nền tảng – Âm cơ bản tiếng Anh cho IELTS",
    "Từ vựng A1 – Chủ đề cuộc sống hàng ngày",
    "Ngữ pháp nền – Thì hiện tại & quá khứ",
    "Giới thiệu cấu trúc bài thi IELTS 4 kỹ năng",
  ],
  A2: [
    "Listening Section 1 – Form completion & Note taking",
    "Reading – Kỹ năng skimming & scanning cơ bản",
    "Writing Task 1 General – Viết thư thân mật (Band 4)",
    "Speaking Part 1 – Giới thiệu bản thân & câu trả lời ngắn",
    "Từ vựng IELTS – Gia đình, nhà cửa & cuộc sống hàng ngày",
    "Ngữ pháp IELTS – Câu đơn, câu ghép & linking words",
  ],
  B1: [
    "Listening Section 2 – Monologue hướng dẫn & thông tin địa điểm",
    "Reading – True / False / Not Given strategies",
    "Reading – Matching headings & paragraph features",
    "Writing Task 2 – Cấu trúc bài essay: Intro & Body",
    "Writing Task 1 Academic – Mô tả biểu đồ đường & cột",
    "Speaking Part 2 – Cue card: Chuẩn bị 1 phút, nói 2 phút",
    "Từ vựng IELTS – Giáo dục, xã hội & môi trường",
    "Ngữ pháp IELTS – Câu phức, mệnh đề quan hệ & liên từ nâng cao",
  ],
  B2: [
    "Listening Section 3 – Thảo luận học thuật nhóm",
    "Listening Section 4 – Lecture học thuật & điền từ",
    "Reading – Matching information & sentence completion",
    "Reading – Summary completion & diagram labelling",
    "Writing Task 2 – Opinion essay Band 6-7: Lập luận & dẫn chứng",
    "Writing Task 2 – Discussion essay: Both sides + Opinion",
    "Writing Task 1 Academic – Biểu đồ tròn & bảng số liệu",
    "Writing Task 1 Academic – Process diagram & Map description",
    "Speaking Part 3 – Thảo luận chủ đề trừu tượng & phản biện",
    "Collocation & AWL – Từ vựng học thuật cấp độ B2",
    "Ngữ pháp IELTS – Câu bị động, đảo ngữ & câu điều kiện",
    "Mock Test Band 6 – Phân tích từng kỹ năng & cải thiện",
  ],
  C1: [
    "Listening – Suy luận & câu hỏi khó Section 3 & 4",
    "Reading – Passage học thuật phức tạp & câu hỏi suy luận",
    "Writing Task 2 – Argumentative essay Band 7-8",
    "Writing Task 2 – Problem-solution & Cause-effect essay",
    "Writing Task 1 – Tổng hợp & so sánh nhiều biểu đồ",
    "Speaking – Fluency, coherence & cohesion Band 7",
    "Speaking – Từ vựng phong phú & phát âm chuẩn",
    "Lexical resource C1 – Paraphrase & synonyms nâng cao",
    "Grammatical range – Complex structures & varied tenses",
    "Mock IELTS Test – Target Band 7 toàn diện",
    "Mock IELTS Test – Target Band 7.5 & Writing correction",
    "Chiến lược làm bài thi IELTS – Phân bổ thời gian tối ưu",
  ],
  C2: [
    "IELTS Band 8-9 – Chiến lược đạt điểm gần hoàn hảo",
    "Academic writing mastery – Sophistication & precision",
    "Near-native pronunciation, intonation & fluency",
    "Final mock test & confidence building for exam day",
  ],
};

// ─── CEFR Week Themes (General English) ──────────────────────────────────────
// Pure communicative competence — no exam branding.

export const CEFR_WEEK_THEMES: Record<Level, string[]> = {
  A1: [
    "Giới thiệu bản thân & gia đình",
    "Số đếm, màu sắc & thời gian",
    "Đồ vật hàng ngày & nhà cửa",
    "Thức ăn, đồ uống & mua sắm",
  ],
  A2: [
    "Động từ thường gặp & thì hiện tại đơn",
    "Du lịch & phương tiện giao thông",
    "Sức khỏe & cơ thể",
    "Nghề nghiệp & nơi làm việc",
    "Thì quá khứ đơn & quá khứ liên tục",
    "So sánh hơn & so sánh nhất",
  ],
  B1: [
    "Giao tiếp hàng ngày – Ý kiến & cảm xúc",
    "Thì hiện tại hoàn thành & hoàn thành liên tục",
    "Câu điều kiện loại 1 & loại 2",
    "Từ đồng nghĩa, trái nghĩa & từ ghép",
    "Đọc hiểu – Email & thư từ thông dụng",
    "Nghe – Thông báo, hướng dẫn & bài phát biểu",
    "Viết – Đoạn văn cơ bản có cấu trúc rõ ràng",
    "Phát âm – Trọng âm từ & nhịp điệu câu",
  ],
  B2: [
    "Collocation nâng cao & cụm từ thành ngữ",
    "Câu bị động, đảo ngữ & câu nhấn mạnh",
    "Từ vựng học thuật (AWL) căn bản",
    "Đọc hiểu – Bài báo, bài luận & báo cáo",
    "Nghe – Bài giảng, podcast & phim tài liệu",
    "Viết – Opinion essay có lập luận",
    "Phrasal verbs & idioms trong ngữ cảnh thực tế",
    "Ngữ pháp – Subjunctive & Inversion",
    "Kỹ năng thuyết trình & diễn đạt ý kiến",
    "Văn phong trang trọng & thân mật trong từng bối cảnh",
    "Phân tích & đánh giá văn bản phức tạp",
    "Ôn tập & củng cố toàn diện B2",
  ],
  C1: [
    "Idioms, fixed expressions & cultural references",
    "Viết học thuật nâng cao – Argumentation & cohesion",
    "Nghe – Nội dung tốc độ tự nhiên, giọng vùng miền",
    "Nói – Fluency, coherence & discourse markers",
    "Từ vựng trong ngữ cảnh – Nuance & connotation C1",
    "Ngữ pháp phức tạp – Cleft sentences & Fronting",
    "Sửa lỗi nâng cao & proofreading kỹ năng",
    "Thuyết trình chuyên nghiệp & public speaking",
    "Đàm phán, thương lượng & ngôn ngữ trang trọng",
    "Phân tích văn học, truyền thông & phong cách tác giả",
    "Phong cách viết đa dạng – Creative & analytical",
    "Ôn tập toàn diện C1 & chuẩn bị tiến lên C2",
  ],
  C2: [
    "Phân tích văn học & ngôn ngữ học nâng cao",
    "Sắc thái ngôn ngữ, register & stylistic variation",
    "Thành ngữ & cách diễn đạt ở mức bản ngữ",
    "Viết học thuật & sáng tạo cấp độ cao nhất",
  ],
};

// Keep ENGLISH_WEEK_THEMES as alias for CEFR (used by existing code paths & free practice)
export const ENGLISH_WEEK_THEMES: Record<Level, string[]> = CEFR_WEEK_THEMES;

// ─── Thai Week Themes — spoken-only (romanized) ───────────────────────────────
// For learners who want to SPEAK Thai without learning the 44-consonant script.
// Titles are in Vietnamese on purpose: a learner who can't read Thai script
// shouldn't be handed a roadmap whose week titles they cannot read either.
// Content is taught through romanized transcription (paiboon-style) + audio.

export const THAI_SPOKEN_WEEK_THEMES: Record<Level, string[]> = {
  A1: [
    "Chào hỏi & giới thiệu bản thân",
    "5 thanh điệu tiếng Thái (nghe & bắt chước)",
    "Số đếm, giá tiền, thời gian",
    "Câu hỏi cơ bản: ai, gì, ở đâu, bao nhiêu",
  ],
  A2: [
    "Gọi món & ăn uống ở quán",
    "Đi chợ, mặc cả, mua sắm",
    "Đi lại: taxi, xe ôm, hỏi đường",
    "Gia đình, bạn bè, nghề nghiệp",
    "Thời tiết & trò chuyện xã giao",
    "Đặt phòng khách sạn & check-in",
  ],
  B1: [
    "Trò chuyện nơi làm việc",
    "Hẹn gặp, sắp lịch, xác nhận",
    "Đi khám bệnh & mô tả triệu chứng",
    "Kể lại một câu chuyện đã xảy ra",
    "Bày tỏ ý kiến, đồng ý & phản đối",
    "Lễ hội và văn hóa Thái trong hội thoại",
    "Gọi điện thoại & nhắn tin",
    "Xử lý tình huống rắc rối (mất đồ, nhầm lẫn)",
  ],
  B2: [
    "Thương lượng & đàm phán trong công việc",
    "Trình bày ý tưởng trong cuộc họp",
    "Tiếng Thái thân mật vs lịch sự (register)",
    "Thành ngữ & cách nói tự nhiên hàng ngày",
    "Nghe hiểu người Thái nói nhanh",
    "Tranh luận về chủ đề xã hội",
    "Kể chuyện dài mạch lạc",
    "Hài hước & cách nói bóng gió",
    "Giao tiếp qua điện thoại trong công việc",
    "Phân biệt giọng vùng miền",
    "Phỏng vấn xin việc bằng tiếng Thái",
    "Hội thoại tình huống thực tế nâng cao",
  ],
  C1: [
    "Thuyết trình chuyên nghiệp bằng tiếng Thái",
    "Ngôn ngữ trang trọng trong kinh doanh",
    "Nghe podcast & tin tức tiếng Thái",
    "Kính ngữ và cách xưng hô theo thứ bậc",
    "Diễn đạt sắc thái tinh tế",
    "Phản biện và bảo vệ quan điểm",
    "Giao tiếp đa văn hóa Việt – Thái",
    "Tổng ôn giao tiếp toàn diện",
  ],
  C2: [
    "Nói tiếng Thái tự nhiên như người bản xứ",
    "Sắc thái, ẩn ý và ngữ điệu nâng cao",
    "Hùng biện và thuyết phục",
    "Tổng ôn cuối khóa",
  ],
};

// ─── Thai Week Themes ─────────────────────────────────────────────────────────

export const THAI_WEEK_THEMES: Record<Level, string[]> = {
  A1: [
    "ตัวอักษรไทย – พยัญชนะ 44 ตัว",
    "ตัวอักษรไทย – สระและวรรณยุกต์",
    "คำทักทายและแนะนำตัว",
    "ตัวเลขและเวลา",
  ],
  A2: [
    "คำกริยาพื้นฐานในชีวิตประจำวัน",
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
    "วันหยุดและเทศกาลไทย",
    "คำลักษณนาม",
    "ประโยคซับซ้อน",
    "การอ่านป้ายและประกาศ",
  ],
  B2: [
    "คำศัพท์ธุรกิจขั้นสูง",
    "การเจรจาต่อรองและการโน้มน้าว",
    "ข่าวและสื่อภาษาไทย",
    "วัฒนธรรมและสังคมไทยเชิงลึก",
    "การเขียนอีเมลและจดหมายทางการ",
    "สำนวนและสุภาษิตไทย",
    "ภาษาทางการและไม่เป็นทางการ",
    "การฟังภาษาไทยระดับกลาง",
    "ไวยากรณ์ขั้นสูง",
    "การออกเสียงขั้นสูง – วรรณยุกต์ซับซ้อน",
    "บทอ่านระดับกลาง",
    "การสนทนาในสถานการณ์จริง",
  ],
  C1: [
    "ภาษาระดับสูงในบริบทธุรกิจ",
    "การพูดในที่สาธารณะเป็นภาษาไทย",
    "วรรณกรรมไทยคัดสรร",
    "สำนวนสุภาพและภาษาราชสำนัก",
    "การเขียนเชิงวิชาการภาษาไทย",
    "ภาษาทางการในเอกสารราชการ",
    "การนำเสนอระดับมืออาชีพ",
    "ทบทวนและประเมินผลรอบด้าน",
  ],
  C2: [
    "ความเชี่ยวชาญระดับเจ้าของภาษา",
    "วรรณกรรม บทกวี และสุนทรพจน์ไทย",
    "ภาษาระดับ register สูงสุด",
    "ทบทวนขั้นสุดท้าย",
  ],
};

// ─── Korean Week Themes ───────────────────────────────────────────────────────

export const KOREAN_WEEK_THEMES: Record<Level, string[]> = {
  A1: [
    "Hangul & Basic Pronunciation (자음과 모음)", "Greetings & Introductions (인사와 소개)",
    "Numbers & Counting (숫자와 세기)", "Colors & Shapes (색깔과 모양)",
    "Family & People (가족과 사람들)", "Daily Routines (일상 생활)",
    "Food & Drinks (음식과 음료)", "Review & Practice Week 1",
  ],
  A2: [
    "Shopping & Prices (쇼핑과 가격)", "Transportation (교통수단)",
    "Weather & Seasons (날씨와 계절)", "Home & Furniture (집과 가구)",
    "Hobbies & Free Time (취미와 여가)", "Health & Body (건강과 신체)",
    "Directions & Places (방향과 장소)", "Review & Practice Week 2",
  ],
  B1: [
    "Work & Jobs (직업과 일)", "Restaurants & Food Culture (식당 문화)",
    "Travel & Tourism (여행)", "News & Current Events (뉴스)",
    "Korean Culture & Traditions (한국 문화)", "Technology & Social Media (기술과 SNS)",
    "Opinions & Discussions (의견 나누기)", "Review & Practice Week 3",
  ],
  B2: [
    "Business Korean (비즈니스 한국어)", "Academic Writing (학술 글쓰기)",
    "Korean Society & Issues (한국 사회)", "Environment (환경)",
    "Arts & Entertainment (예술과 엔터테인먼트)", "Advanced Grammar Patterns (고급 문법)",
    "Formal vs Informal Korean (경어와 반말)", "Review & Practice Week 4",
  ],
  C1: [
    "Korean Literature (한국 문학)", "Philosophy & Abstract Concepts (철학 개념)",
    "Media & Journalism (미디어)", "Law & Politics (법과 정치)",
    "Economics (경제)", "Scientific Discourse (과학 담화)",
    "Nuanced Expression (미묘한 표현)", "Review & Practice Week 5",
  ],
  C2: [
    "Native-level Idioms (관용어)", "Regional Dialects (사투리)",
    "Historical Korean (역사적 한국어)", "Literary Analysis (문학 분석)",
    "Debate & Rhetoric (토론과 수사)", "Korean Proverbs (속담)",
    "Creative Expression (창의적 표현)", "Final Review Week 6",
  ],
};

// ─── Skill pools per exam ─────────────────────────────────────────────────────

/**
 * TOEIC: tests only Listening + Reading → no speaking, no writing sessions
 * IELTS: tests all 4 skills → full pool
 * general (CEFR): flexible, follows learningFocus preference
 */
export const FOCUS_SKILLS: Record<string, string[]> = {
  comprehensive:  ["vocabulary", "grammar", "listening", "reading", "speaking", "writing", "review"],
  conversational: ["vocabulary", "listening", "speaking", "review"],
  academic:       ["vocabulary", "grammar", "reading", "writing", "review"],
};

export const TOEIC_SKILLS: Record<string, string[]> = {
  comprehensive:  ["vocabulary", "grammar", "listening", "reading", "review"],
  conversational: ["vocabulary", "listening", "review"],
  academic:       ["vocabulary", "grammar", "reading", "review"],
};

export const IELTS_SKILLS: Record<string, string[]> = {
  comprehensive:  ["vocabulary", "grammar", "listening", "reading", "speaking", "writing", "review"],
  conversational: ["vocabulary", "listening", "speaking", "review"],
  academic:       ["vocabulary", "grammar", "reading", "writing", "review"],
};

/** Choose skills for a given week, cycling through the focus skill pool */
function getWeekSkills(weekIdx: number, n: number, focusSkills: string[]): string[] {
  const offset = (weekIdx * n) % focusSkills.length;
  return Array.from({ length: n }, (_, i) => focusSkills[(offset + i) % focusSkills.length]);
}

// ─── Main generator ───────────────────────────────────────────────────────────

export type WeekPlan = {
  weekNumber: number;
  theme: string;
  skills: string[];
  startDate: Date;
  scheduledDates: Date[]; // one calendar date per lesson/skill
};

export function generateWeeklyPlan(
  language: "english" | "thai" | "korean",
  fromLevel: Level,
  toLevel: Level,
  totalWeeks: number,
  startDate: Date,
  busyDays: number[] = [],
  weeklyHours = 7,
  learningFocus = "comprehensive",
  targetExam = "general",
  scriptMode = "native"
): WeekPlan[] {
  // Spoken-only Thai: no script means no alphabet weeks and no reading/writing sessions
  const spokenOnly = scriptMode === "romanized" && language === "thai";

  // Pick the right theme pool
  let themes: Record<Level, string[]>;
  if (language === "thai") {
    themes = spokenOnly ? THAI_SPOKEN_WEEK_THEMES : THAI_WEEK_THEMES;
  } else if (language === "korean") {
    themes = KOREAN_WEEK_THEMES;
  } else if (targetExam === "TOEIC") {
    themes = TOEIC_WEEK_THEMES;
  } else if (targetExam === "IELTS") {
    themes = IELTS_WEEK_THEMES;
  } else {
    themes = CEFR_WEEK_THEMES;
  }

  // Pick the right skill pool
  let skillPool: Record<string, string[]>;
  if (targetExam === "TOEIC") {
    skillPool = TOEIC_SKILLS;
  } else if (targetExam === "IELTS") {
    skillPool = IELTS_SKILLS;
  } else {
    skillPool = FOCUS_SKILLS;
  }

  const fromIdx = LEVEL_ORDER.indexOf(fromLevel);
  const toIdx = LEVEL_ORDER.indexOf(toLevel);

  const allThemes: string[] = [];
  for (let i = fromIdx; i <= toIdx; i++) {
    allThemes.push(...(themes[LEVEL_ORDER[i]] ?? []));
  }

  // Resolve skill pool for this focus.
  // Spoken-only overrides the focus: reading and writing Thai are meaningless
  // when the learner has deliberately opted out of the script.
  const focusSkills = spokenOnly
    ? FOCUS_SKILLS.conversational
    : (skillPool[learningFocus] ?? skillPool.comprehensive);

  // Lessons per week: allow multiple sessions per day for high-intensity
  const availableDaysPerWeek = Math.max(1, 7 - busyDays.length);
  // sessionsPerDay: how many lessons fit in a day given weeklyHours spread across available days
  const sessionsPerDay = Math.max(1, Math.round(weeklyHours / availableDaysPerWeek));
  const lessonsPerWeek = availableDaysPerWeek * sessionsPerDay;

  // Build a flat list of all lesson dates across the entire roadmap
  const totalLessons = totalWeeks * lessonsPerWeek;
  const allDates = scheduleDates(startDate, totalLessons, busyDays, sessionsPerDay);

  const plans: WeekPlan[] = [];
  let lessonIdx = 0;

  for (let w = 0; w < totalWeeks; w++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + w * 7);

    const skills = getWeekSkills(w, lessonsPerWeek, focusSkills);
    const scheduledDates = allDates.slice(lessonIdx, lessonIdx + lessonsPerWeek);
    lessonIdx += lessonsPerWeek;

    plans.push({
      weekNumber: w + 1,
      theme: allThemes[w % allThemes.length] ?? `Ôn tập tuần ${w + 1}`,
      skills,
      startDate: weekStart,
      scheduledDates,
    });
  }

  return plans;
}
