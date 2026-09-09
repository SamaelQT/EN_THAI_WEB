/**
 * Content bank + deterministic scheduler for "Kế hoạch cấp tốc" (Cram Plan).
 *
 * Block timing is arithmetic (durations must sum exactly to whatever time the learner
 * actually has), not language generation — so it stays out of the AI's hands entirely.
 * The only thing AI touches for this feature is a single short intro blurb, generated
 * in cram-plan.service.ts with its own timeout and a canned fallback.
 *
 * Every skill's suggested block(s) are authored once at a "realistic full session"
 * length (mirroring how a real exam actually allocates time per skill); buildCramPlan()
 * then scales every block proportionally to fit the time the learner reports having,
 * so the total always matches exactly.
 */

export type Skill = "vocabulary" | "grammar" | "reading" | "listening" | "speaking" | "writing" | "conversation";
export type GoalType = "exam" | "upcoming_need" | "skill_push";
export type LevelTier = "beginner" | "intermediate" | "advanced";

export type LinkType = "lesson" | "conversation" | "review" | "none";

export type BlockTemplate = {
  title: string;
  goalText: string;
  checklist: string[];
  /** Markdown-ish plain text: sample sentences / frameworks / technique notes. */
  template?: string;
  /** Suggested minutes for a "full" session — scaled to fit the learner's actual time. */
  suggestedMin: number;
  linkType: LinkType;
  linkLessonType?: string;
  /** Falls back to `${goalLabel} — ${title}` when omitted. */
  linkTopicSuffix?: string;
  linkScenario?: string;
};

export function levelTierOf(level: string): LevelTier {
  if (level === "A1" || level === "A2" || level === "Beginner" || level === "Elementary") return "beginner";
  if (level === "C1" || level === "C2" || level === "Advanced" || level === "Proficient") return "advanced";
  return "intermediate";
}

const cefrToLevel = (l: LevelTier) => (l === "beginner" ? "A2" : l === "advanced" ? "C1" : "B1");

// ── VSTEP (English) ─────────────────────────────────────────────────────────
// Ported from the one-off VSTEP B1 cram artifact — the content that started this feature.

const VSTEP: Partial<Record<Skill, BlockTemplate[]>> = {
  speaking: [
    {
      title: "Nói — Part 1: Giới thiệu & hỏi đáp",
      goalText: "Giới thiệu bản thân trôi chảy 60-90 giây · trả lời tự nhiên 5-6 câu hỏi xã giao.",
      checklist: [
        "Điền thông tin thật của mình vào khung giới thiệu",
        "Đọc to khung giới thiệu 3 lần liên tiếp",
        "Tự trả lời 5 câu hỏi thường gặp, không nhìn giấy",
        "Ghi âm 1 lần, nghe lại, sửa từ phát âm sai",
      ],
      template:
        "Khung giới thiệu:\n\"Good morning. My name is ___, and I'm from ___, Vietnam. I'm currently working as ___ at ___. In my free time, I enjoy ___ because it helps me ___. I live with my family in ___.\"\n\n" +
        "Câu hỏi hay gặp (trả lời 2-3 câu, luôn kèm lý do): Do you work or study? · What do you do in your free time? · Tell me about your hometown. · Do you like your job? · What are your future plans?",
      suggestedMin: 45,
      linkType: "conversation",
      linkScenario: "interview",
    },
    {
      title: "Nói — Part 2 & 3: Thảo luận & trình bày mở rộng",
      goalText: "Áp dụng 1 khung trả lời cho mọi chủ đề · phản xạ nói liên tục 3-5 phút không đứt quãng.",
      checklist: [
        "Học thuộc khung trả lời",
        "Luyện nói chủ đề Công nghệ trong đời sống",
        "Luyện nói chủ đề Ô nhiễm môi trường",
        "Luyện phản xạ hỏi-đáp qua app (để AI hỏi ngược lại)",
      ],
      template:
        "Khung trả lời (dùng cho mọi chủ đề): \"In my opinion, ___. The main reason is that ___. For example, ___. Therefore, I believe that ___.\"\n\n" +
        "Ngân hàng chủ đề hay ra: Công nghệ · Môi trường · Giáo dục trẻ em · Làm việc từ xa · Du lịch · Sức khỏe & thể thao · Mạng xã hội.",
      suggestedMin: 45,
      linkType: "conversation",
      linkScenario: "friend",
    },
  ],
  writing: [
    {
      title: "Viết — Task 1: Email/Thư",
      goalText: "Viết hoàn chỉnh ~120 từ, đúng cấu trúc, đúng văn phong theo yêu cầu đề.",
      checklist: [
        "Đọc khung mẫu",
        "Chọn 1 tình huống: phàn nàn / mời / xin nghỉ / cảm ơn",
        "Viết bài hoàn chỉnh khoảng 120 từ",
        "Dán bài vào app, bấm \"AI nhận xét bài viết\"",
        "Sửa lại bài theo đúng góp ý",
      ],
      template:
        "Mở: \"Dear [Name] / Sir or Madam, I am writing to [complain about / ask for / thank you for / invite you to] ...\"\n" +
        "Thân: 2-3 ý chính, mỗi ý 1-2 câu, có chi tiết cụ thể.\n" +
        "Kết: \"I look forward to hearing from you. Best regards, [Tên]\"",
      suggestedMin: 60,
      linkType: "lesson",
      linkLessonType: "writing",
      linkTopicSuffix: "Task 1 - Email tình huống thực tế",
    },
    {
      title: "Viết — Task 2: Bài luận quan điểm",
      goalText: "Viết ~250 từ, quan điểm rõ ràng, 2 lý do có ví dụ, kết luận mạch lạc.",
      checklist: [
        "Đọc khung mẫu",
        "Chọn 1 đề: làm việc tại nhà / mạng xã hội lợi hay hại",
        "Viết hoàn chỉnh ~250 từ trong đúng thời gian được chia",
        "Dán vào app chấm điểm, đọc kỹ phần sửa lỗi",
      ],
      template:
        "Mở bài: \"In my opinion, I believe that ...\" (nêu lại đề + quan điểm)\n" +
        "Thân 1: Lý do 1 + ví dụ. Thân 2: Lý do 2 + ví dụ.\n" +
        "Kết: \"In conclusion, ...\"",
      suggestedMin: 60,
      linkType: "lesson",
      linkLessonType: "writing",
      linkTopicSuffix: "Task 2 - Bài luận quan điểm",
    },
  ],
  listening: [
    {
      title: "Nghe — Kỹ thuật & thực hành",
      goalText: "Quen tốc độ nói tự nhiên · luyện bắt từ khóa thay vì dịch từng từ.",
      checklist: [
        "Đọc trước câu hỏi/đáp án trước khi nghe (nếu đề cho phép)",
        "Nghe 1 bài trong app, làm quiz ngay khi vừa nghe xong",
        "Xem transcript, ghi lại từ/cụm nghe sai",
      ],
      template:
        "Kỹ thuật nhanh: nghe ý chính trước, đừng cố hiểu 100% câu chữ · loại ngay đáp án rõ sai · số, tên riêng, thời gian thường là đáp án — nghe kỹ đoạn đó.",
      suggestedMin: 30,
      linkType: "lesson",
      linkLessonType: "listening",
    },
  ],
  reading: [
    {
      title: "Đọc — Kỹ thuật & thực hành",
      goalText: "Luyện skim (đọc lướt ý chính) và scan (tìm từ khóa) · quản lý thời gian khi thi thật.",
      checklist: [
        "Đọc câu hỏi trước, gạch chân từ khóa",
        "Scan đoạn văn tìm từ khóa tương ứng — không đọc toàn bộ",
        "Làm 1 bài đọc trong app, bấm giờ thật",
      ],
      suggestedMin: 30,
      linkType: "lesson",
      linkLessonType: "reading",
    },
  ],
  vocabulary: [
    {
      title: "Từ vựng — Ôn nhanh theo chủ đề thi",
      goalText: "Ôn 10 từ trọng tâm, ưu tiên từ dùng được cho cả Nói và Viết.",
      checklist: ["Học 10 từ mới trong app", "Đặt câu với 3 từ bất kỳ", "Nghe lại phát âm từng từ"],
      suggestedMin: 25,
      linkType: "lesson",
      linkLessonType: "vocabulary",
    },
  ],
  grammar: [
    {
      title: "Ngữ pháp — Điểm hay sai",
      goalText: "Rà lại các lỗi ngữ pháp cơ bản hay mất điểm nhất khi viết/nói nhanh.",
      checklist: ["Đọc lại giải thích trong app", "Làm hết quiz cuối bài", "Ghi lại 2 lỗi hay sai nhất"],
      suggestedMin: 25,
      linkType: "lesson",
      linkLessonType: "grammar",
    },
  ],
};

// ── TOPIK (Korean) ───────────────────────────────────────────────────────────
// TOPIK I (cấp 1-2): chỉ Nghe + Đọc. TOPIK II (cấp 3-6): Nghe + Đọc + Viết.
// KHÔNG có phần thi Nói chính thức ở TOPIK — khác VSTEP. Nếu người học chọn kỹ năng
// "speaking" cho mục tiêu TOPIK, đó là luyện giao tiếp thêm, không phải nội dung thi.

const TOPIK: Partial<Record<Skill, BlockTemplate[]>> = {
  listening: [
    {
      title: "듣기 (Nghe) — Kỹ thuật & thực hành",
      goalText: "Nghe hội thoại ngắn/dài quen thuộc trong đời sống · bắt đúng chủ đề và chi tiết chính.",
      checklist: [
        "Đọc trước đáp án bằng tiếng Hàn nếu đề cho phép",
        "Nghe 1 bài trong app, làm quiz ngay sau khi nghe",
        "Xem transcript Hangul, note lại từ/ngữ pháp nghe chưa ra",
      ],
      template:
        "Kỹ thuật: 2 câu đầu hội thoại thường cho biết chủ đề + quan hệ người nói · nghe kỹ trợ từ (은/는/이/가/을/를) để biết ai làm gì · số đếm/thời gian/địa điểm hay là đáp án.",
      suggestedMin: 35,
      linkType: "lesson",
      linkLessonType: "listening",
    },
  ],
  reading: [
    {
      title: "읽기 (Đọc) — Kỹ thuật & thực hành",
      goalText: "Đọc nhanh đoạn văn ngắn, nắm ý chính và suy luận được ý không nói trực tiếp.",
      checklist: [
        "Đọc câu hỏi trước, xác định dạng câu hỏi (ý chính / chi tiết / suy luận)",
        "Scan đoạn văn tìm từ khóa Hangul tương ứng",
        "Làm 1 bài đọc trong app, bấm giờ thật",
      ],
      suggestedMin: 35,
      linkType: "lesson",
      linkLessonType: "reading",
    },
  ],
  writing: [
    {
      title: "쓰기 (Viết) — Điền câu & đoạn ngắn",
      goalText: "Viết hoàn chỉnh 1 đoạn ngắn theo cấu trúc quen thuộc (TOPIK II).",
      checklist: [
        "Đọc khung viết đoạn văn mẫu",
        "Chọn 1 chủ đề quen thuộc (thói quen hàng ngày, sở thích, dự định)",
        "Viết hoàn chỉnh, đúng ngữ pháp trình độ đang học",
        "Dán vào app, bấm \"AI nhận xét bài viết\"",
      ],
      template:
        "Khung đoạn văn: câu chủ đề nêu ý chính (저는 ... -습니다/ㅂ니다) → 2-3 câu chi tiết dùng liên từ đã học (-고, -지만, -아서/어서) → câu kết tóm lại ý.",
      suggestedMin: 45,
      linkType: "lesson",
      linkLessonType: "writing",
    },
  ],
  speaking: [
    {
      title: "말하기 — Luyện phản xạ giao tiếp (không phải phần thi TOPIK)",
      goalText: "TOPIK không thi Nói — block này chỉ để phản xạ nhanh, không phải kỹ thuật thi cử.",
      checklist: [
        "Chọn 1 tình huống hội thoại quen thuộc",
        "Luyện phản xạ hỏi-đáp cùng AI",
      ],
      template: "Lưu ý: đây là luyện giao tiếp thêm, KHÔNG cần cho điểm TOPIK — ưu tiên thời gian cho Nghe/Đọc/Viết trước nếu đang thi TOPIK.",
      suggestedMin: 25,
      linkType: "conversation",
      linkScenario: "friend",
    },
  ],
  vocabulary: [
    {
      title: "어휘 (Từ vựng) — Ôn nhanh theo chủ đề",
      goalText: "Ôn 10 từ trọng tâm hay gặp trong đề TOPIK.",
      checklist: ["Học 10 từ mới trong app", "Đặt câu với 3 từ bất kỳ"],
      suggestedMin: 25,
      linkType: "lesson",
      linkLessonType: "vocabulary",
    },
  ],
  grammar: [
    {
      title: "문법 (Ngữ pháp) — Trợ từ & đuôi câu hay sai",
      goalText: "Rà lại trợ từ (은/는/이/가/을/를) và đuôi câu cơ bản hay nhầm.",
      checklist: ["Đọc lại giải thích trong app", "Làm hết quiz cuối bài"],
      suggestedMin: 25,
      linkType: "lesson",
      linkLessonType: "grammar",
    },
  ],
};

// ── CU-TFL (Thai) ─────────────────────────────────────────────────────────────

const CUTFL: Partial<Record<Skill, BlockTemplate[]>> = {
  listening: [
    {
      title: "ฟัง (Nghe) — Kỹ thuật & thực hành",
      goalText: "Nghe hội thoại/thông báo quen thuộc, bắt đúng thanh điệu và từ khóa.",
      checklist: [
        "Nghe 1 bài trong app, làm quiz ngay sau khi nghe",
        "Xem transcript, note lại từ nghe sai do thanh điệu",
      ],
      template: "Kỹ thuật: thanh điệu đổi nghĩa hoàn toàn — nghe kỹ từ có thể gây nhầm (ครับ/ค่ะ ở cuối câu báo hiệu người nói nam/nữ, không phải nội dung chính).",
      suggestedMin: 35,
      linkType: "lesson",
      linkLessonType: "listening",
    },
  ],
  reading: [
    {
      title: "อ่าน (Đọc) — Kỹ thuật & thực hành",
      goalText: "Đọc lướt tìm ý chính, nhận diện từ phân loại (classifier) và trợ từ cuối câu.",
      checklist: ["Đọc câu hỏi trước, gạch chân từ khóa", "Làm 1 bài đọc trong app, bấm giờ thật"],
      suggestedMin: 35,
      linkType: "lesson",
      linkLessonType: "reading",
    },
  ],
  writing: [
    {
      title: "เขียน (Viết) — Đoạn ngắn quen thuộc",
      goalText: "Viết đoạn ngắn đúng cấu trúc, dùng đúng tiểu từ lịch sự phù hợp ngữ cảnh.",
      checklist: [
        "Đọc khung viết mẫu",
        "Chọn 1 chủ đề quen thuộc",
        "Viết hoàn chỉnh, để ý tiểu từ cuối câu (ครับ/ค่ะ)",
        "Dán vào app, bấm \"AI nhận xét bài viết\"",
      ],
      suggestedMin: 45,
      linkType: "lesson",
      linkLessonType: "writing",
    },
  ],
  speaking: [
    {
      title: "พูด (Nói) — Giới thiệu & hỏi đáp cơ bản",
      goalText: "Nói trôi chảy phần giới thiệu bản thân, dùng đúng tiểu từ lịch sự.",
      checklist: ["Luyện nói phần giới thiệu bản thân 3 lần", "Luyện phản xạ hỏi-đáp cùng AI"],
      suggestedMin: 35,
      linkType: "conversation",
      linkScenario: "interview",
    },
  ],
  vocabulary: [
    {
      title: "คำศัพท์ (Từ vựng) — Ôn nhanh theo chủ đề",
      goalText: "Ôn 10 từ trọng tâm hay gặp.",
      checklist: ["Học 10 từ mới trong app", "Đặt câu với 3 từ bất kỳ"],
      suggestedMin: 25,
      linkType: "lesson",
      linkLessonType: "vocabulary",
    },
  ],
  grammar: [
    {
      title: "ไวยากรณ์ (Ngữ pháp) — Từ phân loại & tiểu từ",
      goalText: "Rà lại classifier và tiểu từ cuối câu hay nhầm.",
      checklist: ["Đọc lại giải thích trong app", "Làm hết quiz cuối bài"],
      suggestedMin: 25,
      linkType: "lesson",
      linkLessonType: "grammar",
    },
  ],
};

// ── Non-exam goals (phỏng vấn, giao tiếp cơ bản...) — dùng chung cho cả 3 ngôn ngữ ──

const INTERVIEW: Partial<Record<Skill, BlockTemplate[]>> = {
  speaking: [
    {
      title: "Nói — Giới thiệu bản thân cho phỏng vấn",
      goalText: "Giới thiệu bản thân, kinh nghiệm, điểm mạnh — trả lời tự nhiên, không học vẹt.",
      checklist: [
        "Chuẩn bị 1 đoạn giới thiệu ngắn (30-45 giây): tên, kinh nghiệm, điểm mạnh",
        "Luyện trả lời: vì sao muốn công việc này, điểm mạnh/yếu của bạn",
        "Luyện phản xạ qua kịch bản Phỏng vấn với AI",
      ],
      template: "Khung: \"[Chào hỏi]. Tôi là ..., có kinh nghiệm ... Tôi mạnh về ... vì ... Tôi muốn ứng tuyển vị trí này vì ...\"",
      suggestedMin: 45,
      linkType: "conversation",
      linkScenario: "interview",
    },
  ],
  listening: [
    {
      title: "Nghe — Câu hỏi phỏng vấn thường gặp",
      goalText: "Nghe quen giọng người phỏng vấn hỏi các câu thường gặp.",
      checklist: ["Nghe 1 bài hội thoại công sở trong app", "Ghi lại các câu hỏi nghe được"],
      suggestedMin: 20,
      linkType: "lesson",
      linkLessonType: "listening",
    },
  ],
  vocabulary: [
    {
      title: "Từ vựng — Công việc & kỹ năng",
      goalText: "Từ vựng mô tả kinh nghiệm, kỹ năng, tính cách trong công việc.",
      checklist: ["Học 10 từ về công việc/kỹ năng", "Đặt câu mô tả bản thân với 3 từ"],
      suggestedMin: 20,
      linkType: "lesson",
      linkLessonType: "vocabulary",
    },
  ],
};

const BASIC_CONVERSATION: Partial<Record<Skill, BlockTemplate[]>> = {
  speaking: [
    {
      title: "Nói — Giao tiếp hàng ngày cơ bản",
      goalText: "Nói được các câu chào hỏi, hỏi đường, gọi món — không cần từ chuyên ngành.",
      checklist: [
        "Luyện chào hỏi và giới thiệu bản thân ngắn gọn",
        "Chọn 1-2 tình huống thực tế để luyện phản xạ (nhà hàng, mua sắm, hỏi đường)",
      ],
      suggestedMin: 40,
      linkType: "conversation",
      linkScenario: "restaurant",
    },
  ],
  listening: [
    {
      title: "Nghe — Hội thoại đời sống hàng ngày",
      goalText: "Nghe quen tốc độ nói tự nhiên trong tình huống thường gặp.",
      checklist: ["Nghe 1 bài hội thoại đời sống trong app", "Nghe lại transcript, note từ mới"],
      suggestedMin: 25,
      linkType: "lesson",
      linkLessonType: "listening",
    },
  ],
  vocabulary: [
    {
      title: "Từ vựng — Đời sống hàng ngày",
      goalText: "Từ vựng dùng ngay được: chào hỏi, số đếm, đồ ăn, phương hướng.",
      checklist: ["Học 10 từ đời sống hàng ngày", "Nghe lại phát âm từng từ"],
      suggestedMin: 20,
      linkType: "lesson",
      linkLessonType: "vocabulary",
    },
  ],
};

/** Program banks keyed by `examType` or non-exam `goalLabel` identifier. */
const PROGRAMS: Record<string, Partial<Record<Skill, BlockTemplate[]>>> = {
  VSTEP: VSTEP,
  TOPIK: TOPIK,
  CUTFL: CUTFL,
  interview: INTERVIEW,
  basic_conversation: BASIC_CONVERSATION,
};

// ── Generic fallback — used whenever no program matches a selected skill ──────

function genericTemplate(skill: Skill, tier: LevelTier): BlockTemplate {
  const level = cefrToLevel(tier);
  const byLessonType: Record<Skill, { title: string; lessonType?: string; scenario?: string }> = {
    vocabulary: { title: "Từ vựng", lessonType: "vocabulary" },
    grammar: { title: "Ngữ pháp", lessonType: "grammar" },
    reading: { title: "Đọc hiểu", lessonType: "reading" },
    listening: { title: "Nghe", lessonType: "listening" },
    writing: { title: "Viết", lessonType: "writing" },
    speaking: { title: "Nói", lessonType: "speaking" },
    conversation: { title: "Giao tiếp", scenario: "friend" },
  };
  const info = byLessonType[skill];
  return {
    title: `${info.title} — Luyện tập (${level})`,
    goalText: `Ôn tập kỹ năng ${info.title.toLowerCase()} ở trình độ ${level}.`,
    checklist: ["Mở bài luyện tập trong app", "Hoàn thành bài và làm quiz cuối bài"],
    suggestedMin: 30,
    linkType: info.scenario ? "conversation" : "lesson",
    linkLessonType: info.lessonType,
    linkScenario: info.scenario,
  };
}

// ── Scheduler ─────────────────────────────────────────────────────────────────

export type ResolvedBlock = {
  order: number;
  skill: Skill;
  title: string;
  goalText: string;
  durationMin: number;
  checklist: string[];
  checklistDone: boolean[];
  template: string | null;
  linkType: LinkType;
  linkLessonType: string | null;
  linkTopic: string | null;
  linkExamType: string | null;
  linkScenario: string | null;
};

export type BuildCramPlanInput = {
  language: string;
  goalType: GoalType;
  goalLabel: string;
  examType?: string | null;
  level: string;
  skills: Skill[];
  availableMinutes: number;
};

/**
 * Resolve every selected skill to 1+ block templates (program-specific when one
 * matches, generic fallback otherwise), then scale every block's suggested duration
 * proportionally so the total lands exactly on `availableMinutes`.
 */
export function buildCramPlan(input: BuildCramPlanInput): { blocks: ResolvedBlock[]; totalMinutes: number } {
  const tier = levelTierOf(input.level);
  // "skill_push" (luyện chung chung, không gắn tình huống cụ thể) deliberately does NOT
  // resolve to the interview/basic_conversation banks — those are for a specific
  // real-world scenario. Only "upcoming_need" goals get matched to one.
  const programKey = input.examType || (input.goalType === "upcoming_need" ? programKeyFromGoalLabel(input.goalLabel) : undefined);
  const program = programKey ? PROGRAMS[programKey] : undefined;

  type Picked = BlockTemplate & { skill: Skill };
  const picked: Picked[] = [];
  for (const skill of input.skills) {
    const fromProgram = program?.[skill];
    if (fromProgram && fromProgram.length > 0) {
      for (const t of fromProgram) picked.push({ ...t, skill });
    } else {
      picked.push({ ...genericTemplate(skill, tier), skill });
    }
  }

  if (picked.length === 0) return { blocks: [], totalMinutes: 0 };

  const suggestedTotal = picked.reduce((s, b) => s + b.suggestedMin, 0);
  const scale = input.availableMinutes > 0 && suggestedTotal > 0 ? input.availableMinutes / suggestedTotal : 1;

  // A flat 10-minute floor overshoots when many skills are packed into very little
  // time (e.g. 6 blocks in 45 minutes needs ~7.5 min/block, but 6×10=60 > 45 — the
  // total must never exceed what the learner actually has). The floor is capped at
  // whatever an equal split of the available time allows, so floor × block-count can
  // never itself exceed availableMinutes.
  const perBlockFloor = Math.max(1, Math.min(10, Math.floor(input.availableMinutes / picked.length / 5) * 5));
  const scaled = picked.map((b) => Math.max(perBlockFloor, Math.round((b.suggestedMin * scale) / 5) * 5));

  // Rounding to 5-minute increments still leaves the sum a few minutes off target —
  // fold the remainder into the single largest block so the total is always exact.
  let drift = input.availableMinutes - scaled.reduce((s, m) => s + m, 0);
  if (drift !== 0) {
    let biggestIdx = 0;
    for (let i = 1; i < scaled.length; i++) if (scaled[i] > scaled[biggestIdx]) biggestIdx = i;
    scaled[biggestIdx] = Math.max(perBlockFloor, scaled[biggestIdx] + drift);
    // Re-check: only reachable if clamping at the floor above ate part of the drift —
    // apply whatever remains directly so the total always lands exactly on target,
    // even if it means this one block dips below the nominal floor.
    drift = input.availableMinutes - scaled.reduce((s, m) => s + m, 0);
    if (drift !== 0) scaled[biggestIdx] += drift;
  }

  const blocks: ResolvedBlock[] = picked.map((b, i) => ({
    order: i,
    skill: b.skill,
    title: b.title,
    goalText: b.goalText,
    durationMin: scaled[i],
    checklist: b.checklist,
    checklistDone: b.checklist.map(() => false),
    template: b.template ?? null,
    linkType: b.linkType,
    linkLessonType: b.linkLessonType ?? null,
    linkTopic: b.linkType === "lesson" ? `${input.goalLabel} - ${b.linkTopicSuffix ?? b.title}` : null,
    linkExamType: input.examType && input.examType !== "general" ? input.examType : null,
    linkScenario: b.linkScenario ?? null,
  }));

  return { blocks, totalMinutes: blocks.reduce((s, b) => s + b.durationMin, 0) };
}

function programKeyFromGoalLabel(goalLabel: string): string | undefined {
  const g = goalLabel.toLowerCase();
  if (g.includes("phỏng vấn") || g.includes("interview")) return "interview";
  return "basic_conversation";
}

/** Exam types with an authored program bank — used by the UI to show what's available. */
export const KNOWN_EXAM_TYPES = Object.keys(PROGRAMS).filter((k) => k === k.toUpperCase());
