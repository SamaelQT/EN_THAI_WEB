// Korean placement questions for Vietnamese learners
// Tests actual Korean knowledge (Hangul, vocabulary, grammar)
// Questions are in Vietnamese to be accessible to learners at all levels
// 4 questions per level (A1–C1) = 20 total

import type { Question } from "./placement-data";

export const KOREAN_QUESTIONS: Question[] = [

  // ── A1: Hangul & Basic Vocabulary ────────────────────────────────────────

  {
    id: "ko-a1-1",
    section: "vocabulary",
    level: "A1",
    question: "'안녕하세요' (Annyeonghaseyo) có nghĩa là gì?",
    options: ["Cảm ơn", "Xin chào", "Tạm biệt", "Xin lỗi"],
    answer: 1,
    explanation: "안녕하세요 là câu chào hỏi lịch sự trong tiếng Hàn, dùng khi gặp mặt.",
  },
  {
    id: "ko-a1-2",
    section: "vocabulary",
    level: "A1",
    question: "Trong tiếng Hàn, '하나, 둘, 셋' là gì?",
    options: ["Thứ Hai, Thứ Ba, Thứ Tư", "Một, Hai, Ba", "Sáng, Trưa, Tối", "Đỏ, Xanh, Vàng"],
    answer: 1,
    explanation: "하나 (hana) = 1, 둘 (dul) = 2, 셋 (set) = 3 — dãy số Hàn thuần.",
  },
  {
    id: "ko-a1-3",
    section: "grammar",
    level: "A1",
    question: "Chữ Hangul nào đọc là 'ga'?",
    options: ["나", "가", "다", "라"],
    answer: 1,
    explanation: "가 = ga, 나 = na, 다 = da, 라 = ra.",
  },
  {
    id: "ko-a1-4",
    section: "vocabulary",
    level: "A1",
    question: "'밥' (bap) trong tiếng Hàn có nghĩa là gì?",
    options: ["Nước", "Bánh mì", "Cơm / Bữa ăn", "Thịt"],
    answer: 2,
    explanation: "밥 nghĩa là cơm hoặc bữa ăn — từ cực kỳ phổ biến trong văn hóa Hàn.",
  },

  // ── A2: Basic Sentences & Particles ──────────────────────────────────────

  {
    id: "ko-a2-1",
    section: "grammar",
    level: "A2",
    question: "Câu '저는 학생이에요' nghĩa là gì?",
    options: ["Tôi đi học", "Tôi là học sinh", "Tôi thích học", "Tôi không học"],
    answer: 1,
    explanation: "저는 (tôi + trợ từ chủ đề), 학생 (học sinh), 이에요 (là) → 'Tôi là học sinh'.",
  },
  {
    id: "ko-a2-2",
    section: "grammar",
    level: "A2",
    question: "Trợ từ nào dùng để chỉ chủ đề câu trong tiếng Hàn?",
    options: ["을/를", "이/가", "은/는", "에서"],
    answer: 2,
    explanation: "은/는 là trợ từ chủ đề (topic marker). 이/가 là trợ từ chủ ngữ. 을/를 là tân ngữ.",
  },
  {
    id: "ko-a2-3",
    section: "vocabulary",
    level: "A2",
    question: "'어디에 가요?' có nghĩa là gì?",
    options: ["Bạn ăn gì?", "Bạn đi đâu?", "Bạn tên gì?", "Bạn bao nhiêu tuổi?"],
    answer: 1,
    explanation: "어디 = đâu, 에 = trợ từ địa điểm, 가요 = đi (lịch sự) → 'Đi đâu vậy?'",
  },
  {
    id: "ko-a2-4",
    section: "grammar",
    level: "A2",
    question: "Để phủ định động từ trong tiếng Hàn, ta thêm gì trước động từ?",
    options: ["못", "안", "Cả hai đều đúng tùy ngữ cảnh", "Không có cách nào"],
    answer: 2,
    explanation: "안 (an) = phủ định ý chí (không muốn). 못 (mot) = phủ định khả năng (không thể). Cả hai đều đúng tùy ngữ cảnh.",
  },

  // ── B1: Tense, Connectors & Common Patterns ───────────────────────────────

  {
    id: "ko-b1-1",
    section: "grammar",
    level: "B1",
    question: "Đuôi '-았어요 / -었어요' dùng để diễn đạt điều gì?",
    options: ["Hành động đang diễn ra", "Hành động đã xảy ra trong quá khứ", "Hành động sẽ xảy ra", "Ý muốn làm gì đó"],
    answer: 1,
    explanation: "-았/었어요 là đuôi thì quá khứ lịch sự. VD: 먹었어요 = đã ăn.",
  },
  {
    id: "ko-b1-2",
    section: "grammar",
    level: "B1",
    question: "'-고 싶다' được dùng để diễn đạt điều gì?",
    options: ["Khả năng làm việc gì", "Mong muốn / Ý muốn", "Sự so sánh", "Điều kiện"],
    answer: 1,
    explanation: "동사 + -고 싶다 = muốn làm gì. VD: 먹고 싶다 = muốn ăn.",
  },
  {
    id: "ko-b1-3",
    section: "reading",
    level: "B1",
    question: "'저는 매일 운동을 하지만 별로 살이 빠지지 않아요.' Câu này nói về điều gì?",
    options: [
      "Người nói thích tập thể dục và đã giảm cân",
      "Người nói tập thể dục hàng ngày nhưng không giảm cân",
      "Người nói muốn bắt đầu tập thể dục",
      "Người nói không thích tập thể dục",
    ],
    answer: 1,
    explanation: "매일 = hàng ngày, 운동 = thể dục, 하지만 = nhưng, 살이 빠지다 = giảm cân, 않아요 = không.",
  },
  {
    id: "ko-b1-4",
    section: "grammar",
    level: "B1",
    question: "Cách nói 'Tôi có thể nói tiếng Hàn' trong tiếng Hàn là gì?",
    options: [
      "저는 한국어를 말하고 싶어요",
      "저는 한국어를 말할 수 있어요",
      "저는 한국어를 말하면 안 돼요",
      "저는 한국어를 말해야 해요",
    ],
    answer: 1,
    explanation: "-ㄹ/을 수 있다 = có thể làm gì. 말할 수 있어요 = có thể nói.",
  },

  // ── B2: Honorifics, Complex Patterns & Formal Register ───────────────────

  {
    id: "ko-b2-1",
    section: "grammar",
    level: "B2",
    question: "Dạng kính ngữ (존댓말) của động từ '먹다' (ăn) khi nói với người lớn tuổi hơn là gì?",
    options: ["먹어", "먹어요", "드세요", "먹자"],
    answer: 2,
    explanation: "드세요 (드시다) là dạng kính ngữ cao nhất của 먹다. 먹어요 là lịch sự thông thường. 먹어/먹자 là thân mật.",
  },
  {
    id: "ko-b2-2",
    section: "grammar",
    level: "B2",
    question: "'-아/어서' và '-기 때문에' đều dùng để diễn đạt điều gì?",
    options: ["Đối lập / tương phản", "Nguyên nhân / lý do", "Điều kiện giả định", "Mục đích"],
    answer: 1,
    explanation: "Cả hai đều diễn đạt nguyên nhân. -아/어서 dùng cho câu miêu tả, -기 때문에 nhấn mạnh lý do hơn.",
  },
  {
    id: "ko-b2-3",
    section: "reading",
    level: "B2",
    question: "'회의가 끝나는 대로 연락 주세요.' nghĩa là gì?",
    options: [
      "Xin liên lạc khi cuộc họp bắt đầu",
      "Xin liên lạc ngay khi cuộc họp kết thúc",
      "Xin liên lạc nếu cuộc họp bị hủy",
      "Cuộc họp đã kết thúc rồi",
    ],
    answer: 1,
    explanation: "-는 대로 = ngay khi..., 회의가 끝나다 = cuộc họp kết thúc, 연락 주세요 = xin liên lạc.",
  },
  {
    id: "ko-b2-4",
    section: "grammar",
    level: "B2",
    question: "Cấu trúc '-았/었으면 좋겠다' dùng để diễn đạt điều gì?",
    options: [
      "Hành động đã hoàn thành trong quá khứ",
      "Mong muốn điều gì đó xảy ra (ước muốn)",
      "Điều kiện thực tế",
      "Lời khuyên cho người khác",
    ],
    answer: 1,
    explanation: "-았/었으면 좋겠다 = ước gì / mong rằng. VD: 비가 안 왔으면 좋겠다 = Ước gì trời không mưa.",
  },

  // ── C1: Advanced Grammar & Nuance ────────────────────────────────────────

  {
    id: "ko-c1-1",
    section: "grammar",
    level: "C1",
    question: "'-ㄹ/을 뿐만 아니라' có nghĩa là gì?",
    options: ["Mặc dù... nhưng", "Không chỉ... mà còn", "Dù... vẫn", "Nếu... thì"],
    answer: 1,
    explanation: "-ㄹ 뿐만 아니라 = không chỉ... mà còn. VD: 예쁠 뿐만 아니라 똑똑해요 = Không chỉ đẹp mà còn thông minh.",
  },
  {
    id: "ko-c1-2",
    section: "reading",
    level: "C1",
    question: "'아무리 열심히 해도 결과가 좋지 않을 때는 방법을 바꿔 보세요.' Câu này khuyên điều gì?",
    options: [
      "Hãy cố gắng hơn nữa dù kết quả không tốt",
      "Nên từ bỏ khi kết quả không tốt",
      "Khi cố gắng mà không có kết quả, hãy thay đổi phương pháp",
      "Kết quả không quan trọng, quan trọng là nỗ lực",
    ],
    answer: 2,
    explanation: "아무리 -아/어도 = dù có... đến mấy, 방법을 바꾸다 = thay đổi phương pháp, 보세요 = hãy thử.",
  },
  {
    id: "ko-c1-3",
    section: "grammar",
    level: "C1",
    question: "Sự khác biệt giữa '-(으)ㄹ 텐데' và '-(으)ㄹ 것 같다' là gì?",
    options: [
      "Không có sự khác biệt, dùng thay thế nhau được",
      "-(으)ㄹ 텐데 diễn đạt dự đoán kèm lo ngại; -(으)ㄹ 것 같다 là suy đoán trung tính hơn",
      "-(으)ㄹ 텐데 chỉ dùng cho quá khứ; -(으)ㄹ 것 같다 dùng cho tương lai",
      "-(으)ㄹ 것 같다 là kính ngữ của -(으)ㄹ 텐데",
    ],
    answer: 1,
    explanation: "-(으)ㄹ 텐데 mang hàm ý lo lắng hoặc quan tâm đến người nghe. -(으)ㄹ 것 같다 là suy đoán/dự đoán trung tính.",
  },
  {
    id: "ko-c1-4",
    section: "reading",
    level: "C1",
    question: "'사공이 많으면 배가 산으로 간다'는 속담의 의미는? (Tục ngữ: Nhiều người lái thuyền, thuyền leo lên núi)",
    options: [
      "Đi thuyền trên núi rất nguy hiểm",
      "Cần nhiều người để làm việc lớn",
      "Khi có quá nhiều người chỉ đạo, công việc sẽ thất bại",
      "Người lái thuyền giỏi có thể đi khắp nơi",
    ],
    answer: 2,
    explanation: "Tương đương tục ngữ Việt 'Lắm thầy nhiều ma'. Quá nhiều người ra lệnh dẫn đến hỗn loạn.",
  },
];

export function getKoreanQuestions(): Question[] {
  return KOREAN_QUESTIONS;
}

export function calculateKoreanResult(
  questions: Question[],
  answers: (number | null)[]
): { score: number; level: string; rawLabel: string; description: string } {
  const levelOrder = ["A1", "A2", "B1", "B2", "C1"] as const;
  const correctByLevel: Record<string, number> = {};
  const totalByLevel: Record<string, number> = {};

  for (const l of levelOrder) {
    correctByLevel[l] = 0;
    totalByLevel[l] = 0;
  }

  questions.forEach((q, i) => {
    if (!totalByLevel[q.level]) totalByLevel[q.level] = 0;
    totalByLevel[q.level]++;
    if (answers[i] === q.answer) correctByLevel[q.level]++;
  });

  const correct = answers.filter((a, i) => a === questions[i]?.answer).length;
  const score = Math.round((correct / questions.length) * 100);

  // Determine level: highest level where user got ≥50% correct
  let finalLevel = "A1";
  for (const l of levelOrder) {
    const total = totalByLevel[l] ?? 0;
    const got = correctByLevel[l] ?? 0;
    if (total > 0 && got / total >= 0.5) finalLevel = l;
  }

  const TOPIK_DESC: Record<string, string> = {
    A1: "TOPIK I – Cấp độ 1. Biết Hangul và từ vựng cơ bản nhất.",
    A2: "TOPIK I – Cấp độ 2. Giao tiếp được trong tình huống hàng ngày đơn giản.",
    B1: "TOPIK II – Cấp độ 3. Dùng tiếng Hàn trong hầu hết tình huống quen thuộc.",
    B2: "TOPIK II – Cấp độ 4. Giao tiếp trôi chảy về nhiều chủ đề khác nhau.",
    C1: "TOPIK II – Cấp độ 5. Sử dụng tiếng Hàn trong môi trường học thuật và chuyên nghiệp.",
  };

  return {
    score,
    level: finalLevel,
    rawLabel: `TOPIK ${finalLevel}`,
    description: TOPIK_DESC[finalLevel] ?? "",
  };
}
