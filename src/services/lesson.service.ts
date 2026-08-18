import { prisma } from "@/lib/db";
import { createNotification } from "./notification.service";
import { generateJson } from "@/lib/ai-client";

/** Human name of the target language, used all over the prompt. */
function targetLangName(language: string): string {
  return language === "korean" ? "Korean" : language === "thai" ? "Thai" : "English";
}

/**
 * Extra hard rules for Korean lessons.
 * Without this the model happily writes romanised Korean ("annyeonghaseyo") instead of
 * real Hangul, which is useless for a learner who must read 한글.
 */
const KOREAN_SCRIPT_RULES = `
⚠️⚠️ KOREAN SCRIPT LOCK — THE MOST IMPORTANT RULE OF THIS LESSON ⚠️⚠️
The target language is Korean. Every Korean text you write MUST be in real Hangul (한글) characters.
- "word", "phrase", "example", "passage", "transcript", "dialogue[].text", "useful_phrases", quiz questions and quiz options → REAL HANGUL ONLY
- Romanisation is NEVER the main text. It goes ONLY in the separate "phonetic" field.
- FORBIDDEN: "word": "annyeonghaseyo" / "phrase": "Jeoneun haksaengieyo" / options: ["meogeoyo","masyeoyo",...]
- CORRECT:   "word": "안녕하세요", "phonetic": "annyeonghaseyo (an-nyŏng-ha-se-yo)"
- CORRECT:   "phrase": "저는 학생이에요", "phonetic": "jeoneun haksaeng-ieyo"
- CORRECT:   quiz options: ["먹어요", "마셔요", "자요", "가요"]
- The "phonetic" field = Revised Romanization of Korean. Never IPA, never Vietnamese spelling.
- Use natural, modern Korean with the correct politeness level for the learner's level
  (A1–A2: 해요체 -아/어요; B1+: mix 해요체 and 합니다체 where the context calls for it).
- Particles (은/는, 이/가, 을/를, 에/에서…) must be grammatically correct — learners are tested on them.
- Grammar lesson titles: Korean grammar pattern first, Vietnamese in parentheses,
  e.g. "-고 싶다 (Diễn tả mong muốn)", "-았/었어요 (Thì quá khứ)", "존댓말 (Kính ngữ)".
`;

function buildSystemPrompt(language: string): string {
  const TL = targetLangName(language);
  return `You are an expert language teacher creating structured lessons for Vietnamese learners studying ${TL}.
Output ONLY valid JSON — no markdown wrapper, no extra text before or after.

LANGUAGE RULES:
- Lesson body (explanations, grammar notes, tips): Vietnamese — learners need L1 support to understand
- Quiz questions ("q" field) and options: IN THE TARGET LANGUAGE (${TL}) — the quiz IS the practice
- Exception: vocabulary "meaning" quiz questions ask for Vietnamese translation → options in Vietnamese
- All example sentences must include Vietnamese translation alongside
${language === "korean" ? KOREAN_SCRIPT_RULES : ""}
⚠️ CONTENT FIELDS LANGUAGE LOCK — THESE FIELDS MUST BE 100% ${TL.toUpperCase()}, ZERO VIETNAMESE:
- "passage" (reading lesson): write the full reading text in ${TL} only — no Vietnamese words, no translations embedded, no parenthetical notes in Vietnamese inside the passage
- "transcript" (listening lesson): spoken dialogue in ${TL} only — no Vietnamese inside
- "example" (writing lesson): the sample essay/writing must be ${TL} only
- "phrases[].phrase" (speaking lesson): the phrase itself must be ${TL} only
- "words[].example" (vocabulary/review): the example sentence must be ${TL} only
Vietnamese is ONLY allowed in: explanation, meaning, example_vi, guide, prompt, context, quiz question text (for comprehension Qs), and vocab_highlight[].meaning fields.
VIOLATION EXAMPLE (FORBIDDEN): passage contains "Công ty (company) đã..." or "She works at công ty..."
CORRECT: passage is entirely natural ${TL} prose with no Vietnamese anywhere inside it.

QUIZ RULES — THE QUIZ MUST FEEL LIKE A REAL ${TL.toUpperCase()} TEST, NOT A VIETNAMESE TEST:
- For grammar lessons: ALL questions written in ${TL}, testing ONLY the grammar point of this lesson
- For vocabulary lessons: most questions in ${TL} testing word usage, 1-2 questions asking Vietnamese meaning
- For reading/listening: questions can be Vietnamese (comprehension), options in ${TL}
- NEVER put random unrelated topics in quiz — every question must test the exact lesson content
- NEVER prefix options with A) B) C) D) — UI adds labels automatically
- NEVER mix Vietnamese and ${TL} in same option: "go / đi", "went (quá khứ)" → FORBIDDEN
- Each option is a clean word/phrase/sentence in exactly one language

GRAMMAR TITLE RULE: Always use the ${TL} grammar term first, Vietnamese in parentheses.
Examples: "Simple Future Tense (Thì Tương Lai Đơn)", "Present Perfect (Thì Hiện Tại Hoàn Thành)", "Passive Voice (Câu Bị Động)"

TRANSCRIPT RULE: The "transcript" field must contain ONLY ${TL} — no Vietnamese inside it.`;
}


type ExamExample = { question: string; options: string[]; answer: number };
type GenerateRequest = { lessonType: string; language: string; level: string; topic?: string; examType?: string; weekNumber?: number; totalWeeks?: number; dayId?: string; examExamples?: ExamExample[] };

export function topicToSlug(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildPrompt({ lessonType, language, level, topic, examType, weekNumber, totalWeeks, dayId, examExamples }: GenerateRequest): string {
  const langLabel = language === "english" ? "tiếng Anh" : language === "korean" ? "tiếng Hàn" : "tiếng Thái";
  // TL = name of the target language, injected everywhere a prompt used to hardcode "English"
  const TL = targetLangName(language);
  const isKorean = language === "korean";
  // Script note repeated inside the schema so the model cannot "forget" it after a long prompt
  const scriptNote = isKorean
    ? " — VIẾT BẰNG HANGUL (한글) THẬT, TUYỆT ĐỐI KHÔNG dùng chữ Latinh phiên âm"
    : "";

  // ── Detailed exam format specs ────────────────────────────────────────────
  const examContext: Record<string, string> = {
    TOEIC: `BỐI CẢNH: Ôn thi TOEIC L&R (ETS format).

TOEIC PART 5 — Incomplete Sentences (grammar/vocab quiz):
- Each question: one sentence with one blank, 4 options of THE SAME PART OF SPEECH or WORD FORM
- Distractors: same root word in different forms (submit/submits/submitted/submitting) OR near-synonyms that don't fit grammatically
- Topics: business email, contracts, HR policy, logistics, office procedures, financial reports
- Example: "The new policy requires all staff to _____ their expense reports by the 5th of each month." → (A) submit (B) submits (C) submitted (D) submitting
- NEVER use random everyday topics — always business/professional context

TOEIC PART 6 — Text Completion (reading quiz):
- Short business text (email/memo/notice) with 4 blanks → each blank has 4 options
- Text types: internal memo, email thread, announcement, advertisement, form

TOEIC PART 7 — Reading Comprehension (reading passage & quiz):
- Text types: single passage (email, article, notice, advertisement, form) or double/triple passage
- Q types: main purpose ("What is the purpose of this email?"), specific detail ("According to the notice, when will..."), inference ("What can be inferred about..."), vocabulary in context ("The word 'expedite' in paragraph 2 is closest in meaning to..."), NOT GIVEN type
- Passage MUST include: date, sender/recipient (for emails), formal business tone
- Word count: 150-200 words for single passage

TOEIC LISTENING (listening transcript & quiz):
- Part 1: photo description — short statements about what's in a picture
- Part 2: question-response — one question + short answer
- Part 3: short conversation between 2-3 people in business setting (32 exchanges minimum)
- Part 4: monologue — announcement, voicemail, advertisement, news report
- Transcript must sound natural, use contractions, hesitations for realism`,

    IELTS: `BỐI CẢNH: Ôn thi IELTS Academic (British Council/IDP format).

IELTS READING (Academic):
- Text types: academic article, scientific report, journal excerpt — formal register
- Q types: True/False/Not Given, Matching headings, Multiple choice, Short answer, Sentence completion
- Passage: 700-900 words (in real test), for lesson use 180-220 words with 3-4 paragraphs

IELTS LISTENING:
- Section 1: conversation between 2 speakers, everyday social context (e.g. booking, enquiry)
- Section 2: monologue, everyday social context (e.g. tour guide, announcement)
- Section 3: conversation up to 4 speakers, educational context (e.g. seminar, tutorial)
- Section 4: academic lecture/talk — formal vocabulary, complex ideas
- Q types: form completion, note completion, multiple choice, matching

IELTS WRITING:
- Task 1: describe visual data (graph, chart, diagram, map) — 150+ words, objective tone, no personal opinion
- Task 2: argumentative/discursive essay — 250+ words, clear position, 4-5 paragraphs structure

IELTS SPEAKING:
- Part 1: personal questions about familiar topics (2-4 minutes)
- Part 2: individual long turn — describe something using cue card (1-2 minutes)
- Part 3: two-way discussion, abstract topics related to Part 2 theme (4-5 minutes)`,

    general: `Bài học theo khung CEFR tổng quát, tập trung giao tiếp thực tế và ngữ pháp nền tảng.`,
  };
  const examNote = examType && examContext[examType] ? `\n${examContext[examType]}\n` : "";

  // ── Inject real exam examples from DB ─────────────────────────────────────
  let examplesSection = "";
  if (examExamples && examExamples.length > 0) {
    const formatted = examExamples.map((ex, i) =>
      `Example ${i + 1}:\nQ: "${ex.question}"\nOptions: ${ex.options.map((o, idx) => `(${String.fromCharCode(65 + idx)}) ${o}`).join(" | ")}\nAnswer: (${String.fromCharCode(65 + ex.answer)}) ${ex.options[ex.answer]}`
    ).join("\n\n");
    examplesSection = `\n=== REAL ${examType} QUESTIONS — Model your quiz questions EXACTLY on this style, difficulty, and format ===\n${formatted}\n`;
  }

  // Per-lesson-type quiz specification
  // CRITICAL RULE applied to ALL types: quiz must test ONLY what appears in this lesson's content.
  // A student who read this lesson carefully should answer all 10 correctly.
  // A student who skipped this lesson should find the quiz challenging.
  // 10 questions with deliberately mixed formats — a 6-question single-format quiz felt too short
  // and too repetitive to actually check understanding.
  const quizSpecs: Record<string, string> = {
    grammar: `GRAMMAR QUIZ — EXACTLY 10 questions in ${TL}, testing ONLY "${topic ?? "this lesson's grammar point"}":
⚠️ ALIGNMENT: Every question MUST use the SAME sentence patterns and contexts from YOUR explanation section above.
⚠️ FORMAT VARIETY IS MANDATORY — do not write 10 questions of the same shape:
- Q1-Q2: Fill-in-blank using sentence patterns FROM your explanation → 4 word-form options
- Q3: "Which sentence is correct?" → 4 complete sentences all using this grammar point
- Q4: "Identify the error" → use a SPECIFIC wrong pattern from your 'Lỗi thường gặp ❌→✅' section above
- Q5: Transformation: rewrite/convert a sentence (affirmative → negative, or statement → question) → 4 options
- Q6: Choose the sentence that expresses one of YOUR explanation's usage cases → 4 options
- Q7: Signal-word question — which time expression / marker fits this structure → 4 options
- Q8: Two-blank sentence (both blanks must be correct together) → 4 option pairs
- Q9: Short mini-dialogue (2 turns) — pick the correct reply using this grammar point → 4 options
- Q10: Real-life sentence in the contexts YOUR lesson covered → 4 options
ALL questions and options in ${TL}. Zero Vietnamese in questions or options.${scriptNote ? `\n⚠️ Questions and options${scriptNote}.` : ""}`,

    vocabulary: `VOCABULARY QUIZ — EXACTLY 10 questions using ONLY the words from your words array above:
⚠️ ALIGNMENT: Q1-Q8 MUST use exact words from your words array. NEVER test a word not in this lesson.
⚠️ FORMAT VARIETY IS MANDATORY — mix these shapes, do not repeat one shape 10 times:
- Q1-Q3: Fill-in-blank using context similar to the example sentences in your words array → 4 word options (all from your words array)
- Q4: "Which sentence uses '[exact word from your words array]' correctly?" → 4 complete ${TL} sentences
- Q5: Synonym / closest-meaning question for a word in your array → 4 ${TL} options
- Q6: Odd-one-out: which word does NOT belong to this topic → 4 options from your array + 1 unrelated
- Q7: Collocation: which word goes together with '[word from your array]' → 4 ${TL} options
- Q8: Short 2-line dialogue with a blank → pick the right word from your array
- Q9-Q10: "What does '[word from your words array]' mean?" → 4 Vietnamese meaning options (two DIFFERENT words)
Questions Q1-Q8 in ${TL}. Q9-Q10 in ${TL} with Vietnamese options only.${scriptNote ? `\n⚠️ Toàn bộ từ và câu ${TL}${scriptNote}.` : ""}`,

    reading: `READING QUIZ — EXACTLY 10 questions about YOUR passage above:
⚠️ ALIGNMENT: EVERY question must be answerable from the passage you just wrote. No outside knowledge needed.
⚠️ FORMAT VARIETY IS MANDATORY:
- Q1-Q3: Comprehension questions in Vietnamese asking about SPECIFIC information in YOUR passage → options in ${TL} (phrases taken directly from or closely paraphrasing the passage)
- Q4: Vocabulary in context: "'[word from your passage]' trong bài gần nghĩa nhất với..." → 4 ${TL} options
- Q5: Inference question in Vietnamese about something IMPLIED by YOUR passage → options in ${TL}
- Q6: True / False / Not Given about one statement from YOUR passage
- Q7: Reference question — "'it' / '그것' trong đoạn 2 chỉ cái gì?" → 4 ${TL} options
- Q8: Detail question about a number, name, date or place in YOUR passage
- Q9: Which sentence best summarises paragraph [n] of YOUR passage → 4 ${TL} options
- Q10: Main idea/purpose in Vietnamese → options matching YOUR passage's actual topic and scope`,

    listening: `LISTENING QUIZ — EXACTLY 10 questions about YOUR transcript above:
⚠️ ALIGNMENT: EVERY question must be answerable from your transcript. No outside knowledge needed.
⚠️ FORMAT VARIETY IS MANDATORY:
- Q1-Q3: Comprehension questions in Vietnamese about SPECIFIC information in YOUR transcript → options in ${TL} (words/phrases from your transcript)
- Q4: "Ai là người nói câu '[quote from your transcript]'?" → speaker names as options
- Q5: What does [speaker] say about [topic from your transcript]? → options in ${TL}
- Q6: Test one of YOUR key_phrases: meaning or usage → 4 ${TL} options
- Q7: Gap-fill — reproduce one exact line from the transcript with a blank → 4 ${TL} options
- Q8: Sequence question — what happens FIRST/NEXT in the conversation → options in ${TL}
- Q9: Detail question about a number, time, price or place mentioned in the transcript
- Q10: Purpose/tone of YOUR specific conversation or monologue → options in ${TL}`,

    speaking: `SPEAKING QUIZ — EXACTLY 10 questions using ONLY phrases from your phrases array and dialogue above:
⚠️ ALIGNMENT: ONLY test phrases that appear in your phrases array or dialogue. Never invent new phrases.
⚠️ FORMAT VARIETY IS MANDATORY:
- Q1-Q2: "Which phrase is most appropriate when [situation from YOUR lesson]?" → 4 options all from YOUR phrases array
- Q3-Q4: Fill-in-blank: complete the dialogue using a phrase from YOUR phrases array → 4 options from your array
- Q5: Politeness/register — which version is the polite one for this situation → 4 ${TL} options
- Q6: Which reply is the natural response to '[line from YOUR dialogue]' → 4 ${TL} options
- Q7: Word-order question — put the phrase in the correct order → 4 ${TL} options
- Q8: "In which situation would you use '[phrase from YOUR array]'?" → 4 situational options
- Q9-Q10: "What does '[exact phrase from YOUR array]' mean?" → 4 Vietnamese options (two DIFFERENT phrases)`,

    writing: `WRITING QUIZ — EXACTLY 10 questions about the writing skills in YOUR guide section above:
⚠️ ALIGNMENT: Test ONLY structures, linking words, and phrases taught in YOUR guide and example text.
⚠️ FORMAT VARIETY IS MANDATORY:
- Q1-Q2: Questions in ${TL} testing sentence structure FROM this lesson → ${TL} options
- Q3: Fill-in-blank with correct linking word/phrase FROM your guide's examples → ${TL} options
- Q4: Which sentence is the better OPENING sentence for this writing type → 4 ${TL} options
- Q5: Which sentence is the better CLOSING sentence → 4 ${TL} options
- Q6: Register — which version is more formal/appropriate → 4 ${TL} options
- Q7: Which sentence does NOT belong in this paragraph (off-topic) → 4 ${TL} options
- Q8: Correct the error in a sentence taken from a typical learner draft → 4 ${TL} options
- Q9: "Which structure is correct for [writing type from YOUR lesson]?" → ${TL} options based on YOUR guide
- Q10: "What does '[useful phrase from YOUR example text]' mean?" → 4 Vietnamese options`,

    review: `REVIEW QUIZ — EXACTLY 10 mixed questions reviewing the week's content:
⚠️ ALIGNMENT: Use ONLY words from your words array and grammar from your summary/explanation above.
⚠️ FORMAT VARIETY IS MANDATORY — spread questions evenly across the week's topics:
- Q1-Q2: Grammar fill-in-blank using the grammar points in YOUR summary → ${TL} options
- Q3-Q4: Vocabulary usage from YOUR words array in ${TL} sentences → ${TL} options
- Q5: "Which sentence correctly uses [grammar/vocab from YOUR lesson]?" → ${TL} options
- Q6: Error identification using a typical mistake with this week's grammar → ${TL} options
- Q7: Short dialogue completion → ${TL} options
- Q8: Sentence transformation (tense / politeness / negation) → ${TL} options
- Q9-Q10: "What does '[word from YOUR words array]' mean?" → Vietnamese meaning options (two DIFFERENT words)`,
  };

  const quizRequirements = quizSpecs[lessonType] ?? quizSpecs.vocabulary;

  // Every question must explain itself. A learner who picks the wrong option needs to
  // know WHY their choice is wrong, not just which letter was right.
  const explanationSpec = `
=== EXPLANATION SPECIFICATION — APPLIES TO EVERY QUIZ QUESTION ===
Each quiz item MUST carry two extra fields, both written in TIẾNG VIỆT:

"explanation": 2-4 câu giải thích ĐÁP ÁN ĐÚNG, theo đúng thứ tự này:
  1. Nêu quy tắc / điểm ngữ pháp / nghĩa của từ đang được kiểm tra (gọi tên nó ra).
  2. Chỉ rõ dấu hiệu TRONG CHÍNH CÂU HỎI khiến đáp án đó đúng
     (từ khóa, thì, trợ từ, chủ ngữ, ngữ cảnh...).
  3. Dịch nghĩa câu đúng sang tiếng Việt HOÀN TOÀN (không để sót chữ Hàn/Anh/Thái trong bản dịch).
  Viết thành đoạn văn xuôi liền mạch — KHÔNG đánh số "1." "2." "3." trong câu trả lời.
  Ví dụ tốt: "Dùng thì hiện tại hoàn thành vì có 'since 2020' — mốc thời gian bắt đầu
  kéo dài tới hiện tại. Chủ ngữ 'She' là ngôi thứ 3 số ít nên dùng 'has', không phải 'have'.
  → 'Cô ấy đã sống ở Hà Nội từ năm 2020.'"
  Ví dụ XẤU (CẤM): "Đáp án B là đúng." / "Vì đây là cách dùng đúng."

"why_wrong": mảng có ĐÚNG số phần tử bằng số options, cùng thứ tự với options.
  - Vị trí của đáp án ĐÚNG: để chuỗi rỗng ""
  - Mỗi vị trí SAI: 1 câu tiếng Việt nói rõ SAI Ở ĐÂU và sai vì lý do gì —
    phải cụ thể tới mức người học nhận ra lỗi của chính mình.
    Ví dụ tốt: "'have' sai vì chủ ngữ 'She' là ngôi thứ 3 số ít, phải dùng 'has'."
    Ví dụ tốt: "'먹어요' là dạng thường, câu này nói với người lớn tuổi nên phải dùng kính ngữ '드세요'."
    Ví dụ XẤU (CẤM): "Đáp án này sai." / "Không phù hợp." / "Sai ngữ pháp."
  - TUYỆT ĐỐI không để trống hoặc lặp lại cùng một câu cho nhiều phương án sai.
`;

  const schemas: Record<string, string> = {
    vocabulary: `{
  "title": "string — ${TL} topic name + Vietnamese (e.g. ${isKorean ? "'금융 어휘 (Từ vựng Tài chính & Ngân hàng)', '사무용품 (Từ vựng Đồ dùng Văn phòng)'" : "'Finance & Banking Vocabulary (Từ vựng Tài chính & Ngân hàng)', 'Office Equipment (Từ vựng Đồ dùng Văn phòng)'"})",
  "words": [
    {
      "word": "string — từ gốc bằng ${TL}${scriptNote}",
      "phonetic": "string — ${isKorean ? "phiên âm Revised Romanization (VD: 안녕하세요 → 'annyeonghaseyo'). KHÔNG dùng IPA" : "phiên âm IPA"}",
      "meaning": "string — nghĩa tiếng Việt chính xác",
      "example": "string — 1 complete example sentence in ${TL} ONLY (no Vietnamese inside the sentence)${scriptNote}, relevant to the topic",
      "example_vi": "string — dịch nghĩa câu ví dụ sang tiếng Việt"
    }
  ],
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0, "explanation": "string", "why_wrong": ["string","string","string","string"] }]
}
YÊU CẦU words: Tạo ĐÚNG 10 từ vựng thuộc CHỦ ĐỀ "${topic ?? "chủ đề bài học"}" ở trình độ ${level}.
- Mỗi từ PHẢI thực sự thuộc chủ đề đó — KHÔNG dùng từ chung chung (hello, good, very...) không liên quan đến chủ đề
- Chọn từ đặc trưng nhất, hữu ích nhất cho chủ đề này (danh từ chuyên ngành, động từ đặc trưng, tính từ miêu tả...)
- Mỗi câu ví dụ phải hoàn chỉnh, tự nhiên, đặt từ đó vào ngữ cảnh thực tế của chủ đề
- ${weekNumber ? `Đây là tuần ${weekNumber} — chọn từ khó hơn so với tuần đầu, không trùng lặp với từ vựng cơ bản đã học` : ""}`,

    grammar: `{
  "title": "string — ${TL} grammar term first, Vietnamese in parentheses (e.g. ${isKorean ? "'-고 싶다 (Diễn tả mong muốn)', '-았/었어요 (Thì quá khứ)', '존댓말 (Kính ngữ)'" : "'Simple Future Tense (Thì Tương Lai Đơn)', 'Present Perfect (Thì Hiện Tại Hoàn Thành)', 'Passive Voice (Câu Bị Động)'"})",
  "explanation": "string — giải thích ngữ pháp chi tiết BẰNG TIẾNG VIỆT theo cấu trúc markdown sau:\n## 1. Khi nào dùng?\n(Liệt kê 3-4 trường hợp sử dụng chính, mỗi trường hợp có 1 câu ví dụ kèm dịch nghĩa)\n\n## 2. Cấu trúc câu\n| Loại câu | Công thức | Ví dụ | Dịch nghĩa |\n|----------|-----------|-------|-----------|\n(Tạo bảng đầy đủ: Khẳng định / Phủ định / Câu hỏi Yes-No / Câu hỏi Wh-)\n\n## 3. Từ/dấu hiệu nhận biết\n(Liệt kê 5-7 signal words thường gặp, mỗi cái có 1 ví dụ ngắn + dịch)\n\n## 4. Ví dụ tình huống thực tế\n(Viết 4 câu ví dụ đa dạng tình huống, in đậm phần ngữ pháp trọng tâm, kèm dịch nghĩa tiếng Việt)\n\n## 5. Lỗi thường gặp ❌→✅\n(Liệt kê 3 lỗi sai phổ biến, mỗi lỗi: câu sai → câu đúng → giải thích ngắn)",
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0, "explanation": "string", "why_wrong": ["string","string","string","string"] }]
}`,

    reading: `{
  "title": "string — specific ${TL} article title${scriptNote}",
  "passage": "string — ${isKorean ? "300-400 âm tiết" : "180-220 word"} reading passage written 100% in ${TL}${scriptNote}. ABSOLUTELY NO Vietnamese inside this field — not a single Vietnamese word, no translations in parentheses, no notes. Write natural, flowing ${TL} prose only. Include at least 3 clear paragraphs. Use the lesson vocabulary naturally in context.",
  "vocab_highlight": [
    { "word": "string — difficult word from the passage (${TL}${scriptNote})", "meaning": "string — nghĩa tiếng Việt" }
  ],
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0, "explanation": "string", "why_wrong": ["string","string","string","string"] }]
}
YÊU CẦU: vocab_highlight có 5-6 từ quan trọng từ đoạn văn. Quiz ĐÚNG 10 câu kiểm tra ý chính, chi tiết, từ vựng trong bài, tham chiếu và suy luận.`,

    listening: `{
  "title": "string — tên bài nghe cụ thể",
  "context": "string — mô tả tình huống bằng tiếng Việt (ai đang nói, ở đâu, về chủ đề gì)",
  "transcript": "string — CRITICAL FORMAT: each speaker turn MUST be on its own line separated by \\n. Speaker labels MUST be plain ASCII names (${isKorean ? "Minsu, Jiyeong, Manager" : "John, Emily, Manager"}, etc.) not just A/B — the UI matches them to voices. Only the spoken text is in ${TL}${scriptNote}. Example value: ${isKorean ? "'Minsu: 안녕하세요, 오늘 회의 시작할까요?\\\\nJiyeong: 네, 좋아요. 먼저 일정부터 확인하죠.\\\\nMinsu: 알겠습니다.'" : "'John: Good morning, everyone.\\\\nEmily: Good morning! Are we ready to start?\\\\nJohn: Yes, let us begin with the agenda.'"} — natural spoken ${TL} only, NO Vietnamese inside transcript",
  "key_phrases": [
    { "phrase": "string — cụm từ quan trọng trong transcript (${TL}${scriptNote})", "meaning": "string — nghĩa tiếng Việt" }
  ],
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0, "explanation": "string", "why_wrong": ["string","string","string","string"] }]
}
TRANSCRIPT REQUIREMENT: The transcript MUST use \\n to separate each speaker turn — never write all turns as one continuous paragraph. Speaker names stay in Latin letters so the UI can assign a different voice to each one. Minimum 10 speaker turns for dialogue, minimum ${isKorean ? "250 âm tiết" : "150 words"}.
key_phrases: 5-6 cụm quan trọng từ transcript. Quiz ĐÚNG 10 câu.`,

    writing: `{
  "title": "string — tên bài viết cụ thể",
  "prompt": "string — đề bài viết rõ ràng bằng tiếng Việt, nêu rõ yêu cầu (viết gì, bao nhiêu từ, cho ai)",
  "structure": [
    { "part": "string — tên phần (Mở bài / Thân bài 1 / Thân bài 2 / Kết bài)", "guide": "string — hướng dẫn viết phần đó bằng tiếng Việt" }
  ],
  "useful_phrases": ["string — cụm từ hữu ích: cụm ${TL}${scriptNote} + ' – ' + nghĩa tiếng Việt"],
  "example": "string — complete sample writing (${isKorean ? "150-250 âm tiết" : "80-120 words"}) in ${TL} ONLY${scriptNote} — zero Vietnamese inside the writing sample itself",
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0, "explanation": "string", "why_wrong": ["string","string","string","string"] }]
}
YÊU CẦU: structure có 4 phần. useful_phrases có 6-8 cụm. Quiz ĐÚNG 10 câu về cấu trúc văn bản, từ nối, văn phong và từ vựng học thuật.`,

    speaking: `{
  "title": "string — tên bài nói cụ thể",
  "topic": "string — chủ đề câu hỏi gợi mở bằng tiếng Việt",
  "phrases": [
    { "phrase": "string — câu mẫu bằng ${TL}${scriptNote}", "phonetic": "string — ${isKorean ? "phiên âm Revised Romanization" : "phiên âm"}", "meaning": "string — nghĩa tiếng Việt", "usage_tip": "string — gợi ý khi nào dùng câu này" }
  ],
  "dialogue": [
    { "speaker": "string — A hoặc B", "text": "string — câu nói bằng ${TL}${scriptNote}", "translation": "string — dịch nghĩa tiếng Việt" }
  ],
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0, "explanation": "string", "why_wrong": ["string","string","string","string"] }]
}
YÊU CẦU: phrases có ĐÚNG 8 câu mẫu thực tế. dialogue có 8-10 lượt thoại tạo hội thoại hoàn chỉnh. Quiz ĐÚNG 10 câu về ngữ cảnh dùng các phrases.`,

    review: `{
  "title": "string — tên bài ôn tập cụ thể",
  "summary": "string — tóm tắt các điểm ngữ pháp và từ vựng quan trọng của tuần, trình bày bằng markdown có đầu mục rõ ràng, dài ít nhất 10 dòng",
  "words": [
    { "word": "string — bằng ${TL}${scriptNote}", "phonetic": "string — ${isKorean ? "Revised Romanization" : "phiên âm"}", "meaning": "string — nghĩa tiếng Việt", "example": "string — câu ví dụ bằng ${TL}${scriptNote}", "example_vi": "string — dịch nghĩa" }
  ],
  "quiz": [{ "q": "string", "options": ["A","B","C","D"], "answer": 0, "explanation": "string", "why_wrong": ["string","string","string","string"] }]
}
YÊU CẦU: words có 10 từ quan trọng nhất của chủ đề tuần. Quiz ĐÚNG 10 câu ôn tập tổng hợp cả ngữ pháp lẫn từ vựng.`,
  };

  const schema = schemas[lessonType] ?? schemas.vocabulary;
  // Include dayId as a unique seed so each roadmap day gets fresh AI content (not cached repeat)
  const uniqueSeed = dayId ? `\nMÃ BÀI HỌC DUY NHẤT: ${dayId.slice(-8)} — tạo nội dung HOÀN TOÀN MỚI, không lặp lại bài trước.\n` : "";
  const topicLine = topic ? `CHỦ ĐỀ BÀI HỌC: "${topic}"\n${uniqueSeed}` : uniqueSeed;

  // Week-based difficulty context
  let weekContext = "";
  if (weekNumber && totalWeeks) {
    const pct = Math.round((weekNumber / totalWeeks) * 100);
    if (pct <= 25) {
      weekContext = `\nVỊ TRÍ TRONG KHÓA HỌC: Tuần ${weekNumber}/${totalWeeks} (giai đoạn đầu – xây nền tảng, giải thích kỹ, ví dụ đơn giản và rõ ràng).\n`;
    } else if (pct <= 60) {
      weekContext = `\nVỊ TRÍ TRONG KHÓA HỌC: Tuần ${weekNumber}/${totalWeeks} (giai đoạn giữa – nâng độ phức tạp, thêm ngoại lệ, tình huống thực tế đa dạng).\n`;
    } else {
      weekContext = `\nVỊ TRÍ TRONG KHÓA HỌC: Tuần ${weekNumber}/${totalWeeks} (giai đoạn cuối – nội dung nâng cao, câu phức, học thuật/thi cử, quiz khó).\n`;
    }
  }

  return `Create a ${lessonType} lesson in ${langLabel} for CEFR level ${level}.
${topicLine}${weekContext}${examNote}${examplesSection}
=== QUIZ SPECIFICATION (follow exactly) ===
${quizRequirements}
${explanationSpec}

=== CONTENT QUALITY ===
- Every example sentence must be complete and natural, not a fragment
- Every ${TL} sentence must have a Vietnamese translation alongside
- Depth must be enough that the learner genuinely understands after one read
- Difficulty must match level ${level} precisely

=== QUIZ ALIGNMENT — MANDATORY ===
After writing the lesson content, generate the quiz LAST. For each question ask yourself:
"Is this word / grammar structure / sentence actually IN the lesson content I just wrote?"
If the answer is NO → rewrite the question using content that IS in the lesson.
A learner who read ONLY this lesson should answer ALL 10 quiz questions correctly.
The quiz must have EXACTLY 10 questions and no two questions may use the same format twice in a row.

Return valid JSON matching the schema below. NO text outside the JSON object:

${schema}${isKorean ? `

=== FINAL CHECK BEFORE YOU ANSWER (KOREAN) ===
Re-read your own JSON. Every Korean word, sentence, transcript line, phrase and quiz option
must be written in Hangul (한글). If you find any Korean written with Latin letters
(e.g. "annyeonghaseyo", "jeoneun", "meogeoyo") outside the "phonetic" field, rewrite it in 한글 now.` : ""}`;
}

// ── Achievement rules ──────────────────────────────────────────────────────

const ACHIEVEMENT_RULES = [
  { code: "first_lesson",  name: "Bước đầu tiên", description: "Hoàn thành bài học đầu tiên",      icon: "🎯", category: "lesson",     xpReward: 50,  check: (t: number, s: number, x: number) => t === 1 },
  { code: "lessons_10",    name: "Siêng năng",     description: "Hoàn thành 10 bài học",            icon: "📚", category: "lesson",     xpReward: 100, check: (t: number) => t >= 10 },
  { code: "lessons_50",    name: "Học giả",        description: "Hoàn thành 50 bài học",            icon: "🏆", category: "lesson",     xpReward: 300, check: (t: number) => t >= 50 },
  { code: "streak_7",      name: "Lửa tuần",       description: "Học liên tiếp 7 ngày",             icon: "🔥", category: "streak",     xpReward: 100, check: (t: number, s: number) => s >= 7 },
  { code: "streak_30",     name: "Lửa tháng",      description: "Học liên tiếp 30 ngày",            icon: "🌟", category: "streak",     xpReward: 500, check: (t: number, s: number) => s >= 30 },
  { code: "perfect_score", name: "Hoàn hảo",       description: "Đạt 100% trong bài kiểm tra",      icon: "💯", category: "score",      xpReward: 75,  check: (t: number, s: number, x: number, score: number) => score === 100 },
  { code: "xp_500",        name: "Tích lũy",       description: "Đạt 500 XP",                       icon: "⭐", category: "milestone",  xpReward: 50,  check: (t: number, s: number, x: number) => x >= 500 },
] as const;

// ── completeLesson ─────────────────────────────────────────────────────────

export async function completeLesson(
  userId: string,
  opts: { lessonType: string; language: string; level: string; score: number; timeSpent?: number; dayId?: string }
) {
  const { lessonType, language, level, score, timeSpent, dayId } = opts;

  // Resolve lesson ID: roadmap days use day_<id>, free practice uses type_lang_level
  const resolvedLessonId = dayId ? `day_${dayId}` : `${lessonType}_${language}_${level}`;

  // Upsert placeholder lesson
  const lesson = await prisma.lesson.upsert({
    where: { id: resolvedLessonId },
    update: {},
    create: {
      id: resolvedLessonId,
      language, type: lessonType, level,
      title: `${lessonType} – ${level}`,
      content: "{}",
      xpReward: score >= 70 ? 15 : 8,
    },
  });

  // Repeating a lesson is good practice, but it must not be an XP farm:
  // full XP the first time, a token amount for every replay after that.
  const previousAttempts = await prisma.lessonProgress.count({
    where: { userId, lessonId: lesson.id },
  });
  const isReplay = previousAttempts > 0;

  await prisma.lessonProgress.create({
    data: {
      userId,
      lessonId: lesson.id,
      score,
      timeSpent: timeSpent ?? null,
      attempts: previousAttempts + 1,
    },
  });

  const xpGained = isReplay ? 3 : score >= 70 ? 15 : 8;
  await prisma.user.update({ where: { id: userId }, data: { totalXp: { increment: xpGained } } });

  // ── Streak ──────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const streak = await prisma.streak.findUnique({ where: { userId_language: { userId, language } } });
  let newStreak = 1;

  if (streak) {
    const last = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null;
    if (last) {
      last.setHours(0, 0, 0, 0);
      const diff = Math.round((today.getTime() - last.getTime()) / 86400000);
      if (diff === 0) newStreak = streak.currentStreak;
      else if (diff === 1) newStreak = streak.currentStreak + 1;
      else newStreak = (streak.frozenUntil && new Date(streak.frozenUntil) >= today) ? streak.currentStreak : 1;
    }
    await prisma.streak.update({
      where: { userId_language: { userId, language } },
      data: { currentStreak: newStreak, longestStreak: Math.max(newStreak, streak.longestStreak), lastActivityDate: new Date(), frozenUntil: null },
    });
  } else {
    await prisma.streak.create({
      data: { userId, language, currentStreak: 1, longestStreak: 1, lastActivityDate: new Date() },
    });
  }

  // ── Achievements ────────────────────────────────────────────
  const [totalLessons, currentUser] = await Promise.all([
    prisma.lessonProgress.count({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { totalXp: true } }),
  ]);
  const totalXp = currentUser?.totalXp ?? 0;
  const newAchievements: string[] = [];

  for (const rule of ACHIEVEMENT_RULES) {
    if (!rule.check(totalLessons, newStreak, totalXp, score)) continue;
    const exists = await prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: rule.code } },
    });
    if (exists) continue;

    await prisma.achievement.upsert({
      where: { code: rule.code },
      update: {},
      create: { id: rule.code, code: rule.code, name: rule.name, description: rule.description, icon: rule.icon, category: rule.category, xpReward: rule.xpReward },
    });
    await prisma.userAchievement.create({ data: { userId, achievementId: rule.code, language } });
    await prisma.user.update({ where: { id: userId }, data: { totalXp: { increment: rule.xpReward } } });
    await createNotification({ userId, type: "achievement", title: `Thành tích mới: ${rule.name} ${rule.icon}`, body: rule.description });
    newAchievements.push(rule.name);
  }

  // ── Roadmap progression ─────────────────────────────────────
  let weekAdvanced = false;
  let checkpointReady = false;
  let checkpointTopics: string[] = [];

  if (dayId) {
    const day = await prisma.roadmapDay.findUnique({
      where: { id: dayId },
      include: { week: { include: { days: true, roadmap: true } } },
    });

    if (day && day.week.roadmap.userId === userId && day.status !== "completed") {
      await prisma.roadmapDay.update({ where: { id: dayId }, data: { status: "completed", completedAt: new Date() } });

      // ── Checkpoint after day 5: collect titles of days 1-5 for a summary quiz ──
      if (day.dayNumber === 5) {
        try {
          const day1to5Ids = day.week.days
            .filter((d) => d.dayNumber >= 1 && d.dayNumber <= 5)
            .map((d) => `day_${d.id}`);
          const lessonRecs = await prisma.lesson.findMany({
            where: { id: { in: day1to5Ids }, NOT: { content: "{}" } },
            select: { title: true },
          });
          const titles = lessonRecs.map((l) => l.title).filter(Boolean);
          if (titles.length >= 3) {
            checkpointReady = true;
            checkpointTopics = titles;
          }
        } catch { /* ignore — checkpoint is optional */ }
      }

      const allDone = day.week.days.map((d) => d.id === dayId ? { ...d, status: "completed" } : d).every((d) => d.status === "completed");
      if (allDone) {
        await prisma.roadmapWeek.update({ where: { id: day.week.id }, data: { status: "completed" } });
        const nextWeek = await prisma.roadmapWeek.findFirst({
          where: { roadmapId: day.week.roadmapId, weekNumber: day.week.weekNumber + 1, status: "pending" },
        });
        if (nextWeek) {
          await prisma.roadmapWeek.update({ where: { id: nextWeek.id }, data: { status: "active" } });
          weekAdvanced = true;
        } else {
          await prisma.roadmap.update({ where: { id: day.week.roadmapId }, data: { status: "completed" } });
          await createNotification({ userId, type: "roadmap_completed", title: "🎓 Hoàn thành lộ trình!", body: "Bạn đã hoàn thành toàn bộ lộ trình học tập. Chúc mừng!" });
        }
      }
    }
  }

  return { xpGained, newStreak, newAchievements, weekAdvanced, checkpointReady, checkpointTopics };
}

// ── ETS quiz replacement ───────────────────────────────────────────────────

/** Fisher-Yates shuffle, returns a new array */
function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Try to find real ETS questions that match this lesson's topic.
 *
 * Design principle: the quiz must test what the lesson teaches.
 * - Lessons with a topic (grammar/vocab): ONLY use topic-matched questions.
 *   If fewer than 6 match → return null so the AI quiz (which IS topic-specific) is used instead.
 * - Review lessons (no specific topic): broader fallback is acceptable.
 * - Always shuffle so users see different questions each visit.
 */
async function getETSQuiz(
  examType: string | undefined,
  lessonType: string,
  topic?: string,
  level?: string
): Promise<{ q: string; options: string[]; answer: number }[] | null> {
  if (!examType || (examType !== "TOEIC" && examType !== "IELTS")) return null;

  const typeMap: Record<string, string[]> = {
    grammar: ["grammar"],
    vocabulary: ["vocabulary"],
    reading: ["reading"],
    listening: ["listening"],
    review: ["grammar", "vocabulary"],
  };
  const types = typeMap[lessonType];
  if (!types) return null;

  const isReview = lessonType === "review";

  // Extract keywords from topic for grammarPoint matching
  // e.g. "Present Perfect Tense (Thì Hiện Tại Hoàn Thành)" → ["present","perfect","tense","hiện","hoàn","thành"]
  const topicKeywords = topic
    ? topic
        .toLowerCase()
        .replace(/[()]/g, " ")
        .split(/[\s,_-]+/)
        .filter((w) => w.length > 3)
    : [];

  const baseWhere = {
    exam: examType,
    type: { in: types },
    answer: { gte: 0 },
    ...(level ? { level } : {}),
  };

  // ── Step 1: Topic-matched (strict) ──────────────────────────────────────
  // Take a larger pool (50) then shuffle so every visit returns different questions.
  if (topicKeywords.length > 0) {
    const pool = await prisma.examQuestion.findMany({
      where: {
        ...baseWhere,
        OR: topicKeywords.map((kw) => ({
          grammarPoint: { contains: kw, mode: "insensitive" as const },
        })),
      },
      take: 50,
    });
    if (pool.length >= 6) {
      const picked = shuffleArr(pool).slice(0, 10);
      return picked.map((q) => ({ q: q.question, options: q.options, answer: q.answer }));
    }
    // Not enough topic-relevant questions → for non-review lessons, let AI quiz stay
    // (AI quiz is generated specifically for this topic and is more relevant than
    //  randomly pulling unrelated grammar/vocab questions from the DB)
    if (!isReview) return null;
  }

  // ── Step 2: Broader fallback — only for review / no-topic lessons ────────
  if (isReview || !topic) {
    const pool = await prisma.examQuestion.findMany({
      where: baseWhere,
      take: 80,
    });
    if (pool.length >= 10) {
      const picked = shuffleArr(pool).slice(0, 10);
      return picked.map((q) => ({ q: q.question, options: q.options, answer: q.answer }));
    }

    // Step 3: Ignore level
    const fallback = await prisma.examQuestion.findMany({
      where: { exam: examType, type: { in: types }, answer: { gte: 0 } },
      take: 80,
    });
    if (fallback.length >= 10) {
      const picked = shuffleArr(fallback).slice(0, 10);
      return picked.map((q) => ({ q: q.question, options: q.options, answer: q.answer }));
    }
  }

  return null; // not enough — AI generates quiz
}

// ── Quiz sanitising ────────────────────────────────────────────────────────

export type QuizItem = {
  q: string;
  options: string[];
  answer: number;
  /** Why the correct option is correct — rule + the clue in the question + translation */
  explanation?: string;
  /** Parallel to options: why each wrong option is wrong ("" at the correct index) */
  whyWrong?: string[];
};

/**
 * Drop malformed questions coming back from the AI.
 *
 * Without this a single bad item (missing options, `answer: 4` on a 4-option list,
 * duplicated question) either renders a blank choice the learner can never get right,
 * or crashes the quiz screen when `options[answer]` is undefined.
 */
export function sanitizeQuiz(raw: unknown): QuizItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: QuizItem[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const { q, options, answer, explanation } = rec;
    // Accept either casing — the AI schema uses why_wrong, our own types use whyWrong
    const rawWhyWrong = rec.why_wrong ?? rec.whyWrong;

    if (typeof q !== "string" || q.trim().length === 0) continue;
    if (!Array.isArray(options)) continue;

    const opts = options
      .filter((o): o is string => typeof o === "string")
      // The UI renders its own A) B) C) labels — strip any the model embedded
      .map((o) => o.replace(/^[A-Da-d1-4][.)]\s*/u, "").trim())
      .filter((o) => o.length > 0);

    // Any dropped option would shift every index, making `answer` and `why_wrong`
    // point at the wrong choice — safer to discard the whole question.
    if (opts.length !== options.length) continue;
    // Need at least 2 distinct choices for the question to mean anything
    if (opts.length < 2 || new Set(opts).size !== opts.length) continue;
    if (typeof answer !== "number" || !Number.isInteger(answer) || answer < 0 || answer >= opts.length) continue;

    const key = q.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    // Align why_wrong with the (possibly filtered) options list; blank at the correct index.
    // Generic filler like "Đáp án này sai." teaches nothing, so drop it.
    const USELESS = /^(đáp án (này )?sai|sai|không (đúng|phù hợp)|incorrect|wrong)\.?$/i;
    const whyWrongSrc = Array.isArray(rawWhyWrong) ? rawWhyWrong : [];
    const whyWrong = opts.map((_, i) => {
      if (i === answer) return "";
      const v = whyWrongSrc[i];
      if (typeof v !== "string") return "";
      const t = v.trim();
      return USELESS.test(t) ? "" : t;
    });

    out.push({
      q: q.trim(),
      options: opts,
      answer,
      ...(typeof explanation === "string" && explanation.trim() ? { explanation: explanation.trim() } : {}),
      ...(whyWrong.some((w) => w.length > 0) ? { whyWrong } : {}),
    });
  }

  return out;
}

// ── Korean cache validation ────────────────────────────────────────────────

const HANGUL_RE = /[가-힯ᄀ-ᇿ㄰-㆏]/;

/**
 * True when a cached Korean lesson actually contains Hangul.
 *
 * Lessons generated before the Korean script rules were added came back romanised
 * ("annyeonghaseyo" instead of 안녕하세요). Those rows are still in the DB, so we
 * detect them here and regenerate instead of serving the broken cache.
 */
function koreanLessonHasHangul(lesson: Record<string, unknown>): boolean {
  const parts: string[] = [];
  const push = (v: unknown) => { if (typeof v === "string") parts.push(v); };

  push(lesson.passage);
  push(lesson.transcript);
  push(lesson.example);
  for (const w of (lesson.words as { word?: unknown }[] | undefined) ?? []) push(w?.word);
  for (const p of (lesson.phrases as { phrase?: unknown }[] | undefined) ?? []) push(p?.phrase);
  for (const q of (lesson.quiz as { q?: unknown; options?: unknown }[] | undefined) ?? []) {
    push(q?.q);
    for (const o of (q?.options as unknown[] | undefined) ?? []) push(o);
  }

  // Nothing checkable (e.g. a grammar lesson whose body is all Vietnamese) → accept it
  if (parts.length === 0) return true;
  return parts.some((p) => HANGUL_RE.test(p));
}

/** Parse cached lesson JSON, returning null when the cache is unusable for this language. */
function parseCachedLesson(content: string, language: string): Record<string, unknown> | null {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }
  if (language === "korean" && !koreanLessonHasHangul(parsed)) return null;
  return parsed;
}

// ── Groq helper ────────────────────────────────────────────────────────────

async function callAI(prompt: string, language: string): Promise<{ lesson: any; provider: string; fellBack: boolean }> {
  const { data, provider, fellBack } = await generateJson({
    messages: [
      { role: "system", content: buildSystemPrompt(language) },
      { role: "user", content: prompt },
    ],
    // Slightly above default so repeated lessons on the same topic don't come back identical
    temperature: 0.8,
  });
  return { lesson: JSON.parse(data || "{}"), provider, fellBack };
}

// ── generateLesson ─────────────────────────────────────────────────────────

async function fetchExamExamples(examType: string | undefined, lessonType: string): Promise<ExamExample[]> {
  if (!examType || (examType !== "TOEIC" && examType !== "IELTS")) return [];
  try {
    const rows = await prisma.examQuestion.findMany({
      where: { exam: examType, type: lessonType },
      take: 3,
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => ({ question: r.question, options: r.options, answer: r.answer }));
  } catch {
    return [];
  }
}

/**
 * Generate lesson content via AI.
 * The AI quiz (lesson.quiz) is kept as-is — it's crafted by the AI specifically for this lesson's topic.
 * ETS questions from the DB are NOT used here because keyword matching is too imprecise:
 * e.g. topic "Past Simple" → keyword "past" → accidentally pulls past_perfect, past_continuous questions.
 * ETS questions are used in /review simulations where topic matching is less critical.
 */
async function generateLessonContent(req: GenerateRequest): Promise<Record<string, unknown>> {
  const { lesson, provider, fellBack } = await callAI(buildPrompt(req), req.language);
  // Never persist or ship a quiz with malformed questions — the quiz screen assumes
  // options[answer] exists.
  lesson.quiz = sanitizeQuiz(lesson.quiz);
  // Non-enumerable so it never lands in the cached JSON we write to the database
  Object.defineProperty(lesson, "_aiProvider", { value: provider, enumerable: false });
  Object.defineProperty(lesson, "_aiFellBack", { value: fellBack, enumerable: false });
  return lesson;
}

export async function generateLesson(lessonType: string, language: string, level: string, topic?: string, userId?: string, examType?: string, weekNumber?: number, totalWeeks?: number, dayId?: string) {
  if (!lessonType || !language || !level) throw new Error("Missing fields");
  const examExamples = await fetchExamExamples(examType, lessonType);

  // Roadmap day lesson: each day gets its own unique cached content
  if (dayId) {
    const dayLessonId = `day_${dayId}`;

    // Return cached lesson unless user already completed it (then generate fresh variant)
    const alreadyCompleted = userId
      ? await prisma.lessonProgress.findFirst({ where: { userId, lessonId: dayLessonId } })
      : null;

    if (!alreadyCompleted) {
      const existing = await prisma.lesson.findUnique({ where: { id: dayLessonId } });
      if (existing && existing.content !== "{}") {
        const cachedLesson = parseCachedLesson(existing.content, language);
        if (cachedLesson) return cachedLesson;
        // unusable cache (bad JSON, or romanised Korean) → fall through and regenerate
      }
    }

    if (!process.env.GROQ_API_KEY) {
      const err = new Error("Bài học này chưa có sẵn.") as Error & { code: string };
      err.code = "NO_API_KEY";
      throw err;
    }

    const lesson = await generateLessonContent({ lessonType, language, level, topic, examType, weekNumber, totalWeeks, dayId, examExamples });

    if (!alreadyCompleted) {
      await prisma.lesson.upsert({
        where: { id: dayLessonId },
        update: { content: JSON.stringify(lesson), title: String(lesson.title ?? dayLessonId) },
        create: { id: dayLessonId, language, type: lessonType, level, title: String(lesson.title ?? dayLessonId), content: JSON.stringify(lesson), xpReward: 15 },
      });
    }
    return lesson;
  }

  // Topic-based lesson: unique ID per topic, skip fallback chain
  if (topic) {
    const slug = topicToSlug(topic);
    const examSuffix = examType && examType !== "general" ? `_${examType.toLowerCase()}` : "";
    const topicId = `${lessonType}_${language}_${level}_${slug}${examSuffix}`;

    const alreadyCompleted = userId
      ? await prisma.lessonProgress.findFirst({ where: { userId, lessonId: topicId } })
      : null;

    if (!alreadyCompleted) {
      const existing = await prisma.lesson.findUnique({ where: { id: topicId } });
      if (existing && existing.content !== "{}") {
        // Return cached lesson with its original AI quiz — do not replace with ETS questions
        // (ETS keyword matching is too broad and pulls off-topic questions)
        const cachedLesson = parseCachedLesson(existing.content, language);
        if (cachedLesson) return cachedLesson;
      }
    }

    if (!process.env.GROQ_API_KEY) {
      const err = new Error("Bài học này chưa có sẵn.") as Error & { code: string };
      err.code = "NO_API_KEY";
      throw err;
    }

    const lesson = await generateLessonContent({ lessonType, language, level, topic, examType, weekNumber, totalWeeks, examExamples });

    if (!alreadyCompleted) {
      await prisma.lesson.upsert({
        where: { id: topicId },
        update: { content: JSON.stringify(lesson), title: String(lesson.title ?? topicId) },
        create: { id: topicId, language, type: lessonType, level, title: String(lesson.title ?? topicId), content: JSON.stringify(lesson), xpReward: 15 },
      });
    }
    return lesson;
  }

  // No topic: seeded lesson
  const lessonId = `${lessonType}_${language}_${level}`;
  const exact = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (exact && exact.content !== "{}") {
    const cachedLesson = parseCachedLesson(exact.content, language);
    if (cachedLesson) return cachedLesson;
  }

  const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const targetIdx = LEVEL_ORDER.indexOf(level);
  const fallbacks = await prisma.lesson.findMany({
    where: { language, type: lessonType, content: { not: "{}" } },
  });
  if (fallbacks.length > 0) {
    const sorted = fallbacks.sort((a, b) => {
      const da = Math.abs(LEVEL_ORDER.indexOf(a.level) - targetIdx);
      const db = Math.abs(LEVEL_ORDER.indexOf(b.level) - targetIdx);
      return da - db;
    });
    for (const candidate of sorted) {
      const cachedLesson = parseCachedLesson(candidate.content, language);
      if (cachedLesson) return cachedLesson;
    }
  }

  const anyLesson = await prisma.lesson.findFirst({ where: { language, content: { not: "{}" } } });
  if (anyLesson) {
    const cachedLesson = parseCachedLesson(anyLesson.content, language);
    if (cachedLesson) return cachedLesson;
  }

  if (!process.env.GROQ_API_KEY) {
    const err = new Error("Bài học này chưa có sẵn.") as Error & { code: string };
    err.code = "NO_API_KEY";
    throw err;
  }

  const lesson = await generateLessonContent({ lessonType, language, level, examExamples });
  await prisma.lesson.upsert({
    where: { id: lessonId },
    update: { content: JSON.stringify(lesson), title: String(lesson.title ?? lessonId) },
    create: { id: lessonId, language, type: lessonType, level, title: String(lesson.title ?? lessonId), content: JSON.stringify(lesson), xpReward: 15 },
  });
  return lesson;
}
