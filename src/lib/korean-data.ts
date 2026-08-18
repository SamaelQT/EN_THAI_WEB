// Korean placement questions for Vietnamese learners
// Tests actual Korean knowledge (Hangul, vocabulary, grammar)
// Questions are in Vietnamese to be accessible to learners at all levels
// Pool: 12 questions per level (A1–C1) = 60 total
// Each test run randomly samples 4 per level = 20 questions, so retaking gives a different paper

import type { Question } from "./placement-data";

export const KOREAN_QUESTIONS: Question[] = [

  // ══ A1: Hangul & Basic Vocabulary ════════════════════════════════════════

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
  {
    id: "ko-a1-5",
    section: "vocabulary",
    level: "A1",
    question: "'감사합니다' có nghĩa là gì?",
    options: ["Xin chào", "Cảm ơn", "Xin lỗi", "Tạm biệt"],
    answer: 1,
    explanation: "감사합니다 (gamsahamnida) = Cảm ơn (dạng trang trọng). 고맙습니다 cũng cùng nghĩa.",
  },
  {
    id: "ko-a1-6",
    section: "vocabulary",
    level: "A1",
    question: "Từ nào có nghĩa là 'nước' (để uống)?",
    options: ["불", "물", "발", "말"],
    answer: 1,
    explanation: "물 (mul) = nước. 불 = lửa, 발 = bàn chân, 말 = lời nói/ngựa.",
  },
  {
    id: "ko-a1-7",
    section: "grammar",
    level: "A1",
    question: "Chữ '한' được ghép từ những chữ cái nào?",
    options: ["ㅎ + ㅏ + ㄴ", "ㅎ + ㅓ + ㄴ", "ㄱ + ㅏ + ㄴ", "ㅎ + ㅏ + ㅁ"],
    answer: 0,
    explanation: "한 = phụ âm đầu ㅎ (h) + nguyên âm ㅏ (a) + phụ âm cuối ㄴ (n) → 'han'.",
  },
  {
    id: "ko-a1-8",
    section: "vocabulary",
    level: "A1",
    question: "'학교' có nghĩa là gì?",
    options: ["Bệnh viện", "Trường học", "Công ty", "Nhà hàng"],
    answer: 1,
    explanation: "학교 (hakgyo) = trường học. 병원 = bệnh viện, 회사 = công ty, 식당 = nhà hàng.",
  },
  {
    id: "ko-a1-9",
    section: "vocabulary",
    level: "A1",
    question: "Khi chia tay và người kia sẽ rời đi, bạn nói gì?",
    options: ["안녕히 가세요", "안녕히 계세요", "처음 뵙겠습니다", "잘 먹겠습니다"],
    answer: 0,
    explanation: "안녕히 가세요 = nói với người ĐI. 안녕히 계세요 = nói với người Ở LẠI.",
  },
  {
    id: "ko-a1-10",
    section: "vocabulary",
    level: "A1",
    question: "'선생님' có nghĩa là gì?",
    options: ["Học sinh", "Bác sĩ", "Giáo viên", "Bạn bè"],
    answer: 2,
    explanation: "선생님 (seonsaengnim) = giáo viên. 학생 = học sinh, 의사 = bác sĩ, 친구 = bạn bè.",
  },
  {
    id: "ko-a1-11",
    section: "vocabulary",
    level: "A1",
    question: "Số '십' trong tiếng Hàn (số Hán-Hàn) là số mấy?",
    options: ["Năm", "Bảy", "Mười", "Một trăm"],
    answer: 2,
    explanation: "십 (sip) = 10. 오 = 5, 칠 = 7, 백 = 100.",
  },
  {
    id: "ko-a1-12",
    section: "vocabulary",
    level: "A1",
    question: "'저는 베트남 사람이에요' nghĩa là gì?",
    options: ["Tôi thích Việt Nam", "Tôi là người Việt Nam", "Tôi đang ở Việt Nam", "Tôi học tiếng Việt"],
    answer: 1,
    explanation: "저는 = tôi, 베트남 = Việt Nam, 사람 = người, 이에요 = là.",
  },

  // ══ A2: Basic Sentences & Particles ══════════════════════════════════════

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
  {
    id: "ko-a2-5",
    section: "grammar",
    level: "A2",
    question: "Chọn trợ từ đúng: '저는 커피___ 마셔요.' (Tôi uống cà phê)",
    options: ["가", "를", "에", "도"],
    answer: 1,
    explanation: "커피 là tân ngữ → dùng 을/를. 커피 kết thúc bằng nguyên âm → 를.",
  },
  {
    id: "ko-a2-6",
    section: "grammar",
    level: "A2",
    question: "Trợ từ '에서' dùng để làm gì?",
    options: [
      "Chỉ nơi diễn ra hành động (ở đâu làm gì)",
      "Chỉ thời gian",
      "Chỉ người nhận",
      "Chỉ phương tiện",
    ],
    answer: 0,
    explanation: "에서 = tại/ở (nơi diễn ra hành động). VD: 도서관에서 공부해요 = học ở thư viện. 에 chỉ điểm đến hoặc vị trí tồn tại.",
  },
  {
    id: "ko-a2-7",
    section: "vocabulary",
    level: "A2",
    question: "'얼마예요?' được dùng khi nào?",
    options: ["Hỏi giờ", "Hỏi giá tiền", "Hỏi tên", "Hỏi đường"],
    answer: 1,
    explanation: "얼마예요? = Bao nhiêu tiền? Dùng khi mua sắm.",
  },
  {
    id: "ko-a2-8",
    section: "grammar",
    level: "A2",
    question: "Câu '오늘 날씨가 좋아요' nghĩa là gì?",
    options: [
      "Hôm nay thời tiết đẹp",
      "Hôm qua trời mưa",
      "Ngày mai sẽ nóng",
      "Tôi thích thời tiết này",
    ],
    answer: 0,
    explanation: "오늘 = hôm nay, 날씨 = thời tiết, 좋아요 = tốt/đẹp.",
  },
  {
    id: "ko-a2-9",
    section: "grammar",
    level: "A2",
    question: "Đâu là cách nói 'Tôi không ăn' đúng?",
    options: ["저는 먹어요 안", "저는 안 먹어요", "저는 먹 안 어요", "안 저는 먹어요"],
    answer: 1,
    explanation: "안 đứng NGAY TRƯỚC động từ: 안 먹어요 = không ăn.",
  },
  {
    id: "ko-a2-10",
    section: "vocabulary",
    level: "A2",
    question: "'지금 몇 시예요?' hỏi điều gì?",
    options: ["Bây giờ là mấy giờ?", "Hôm nay ngày mấy?", "Bạn ở đâu?", "Cái này giá bao nhiêu?"],
    answer: 0,
    explanation: "지금 = bây giờ, 몇 시 = mấy giờ.",
  },
  {
    id: "ko-a2-11",
    section: "reading",
    level: "A2",
    question: "'저는 매일 아침 7시에 일어나요.' Người nói làm gì lúc 7 giờ?",
    options: ["Đi ngủ", "Thức dậy", "Ăn sáng", "Đi làm"],
    answer: 1,
    explanation: "매일 = mỗi ngày, 아침 = buổi sáng, 일어나다 = thức dậy.",
  },
  {
    id: "ko-a2-12",
    section: "grammar",
    level: "A2",
    question: "'-(으)세요' được dùng để làm gì?",
    options: [
      "Diễn tả quá khứ",
      "Đề nghị / yêu cầu lịch sự",
      "Phủ định",
      "So sánh",
    ],
    answer: 1,
    explanation: "-(으)세요 = hãy... (yêu cầu lịch sự) hoặc kính ngữ hiện tại. VD: 앉으세요 = mời ngồi.",
  },

  // ══ B1: Tense, Connectors & Common Patterns ══════════════════════════════

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
  {
    id: "ko-b1-5",
    section: "grammar",
    level: "B1",
    question: "'-(으)면' diễn đạt ý nghĩa gì?",
    options: ["Nếu / khi mà (điều kiện)", "Mặc dù", "Bởi vì", "Sau khi"],
    answer: 0,
    explanation: "-(으)면 = nếu. VD: 시간이 있으면 같이 가요 = Nếu có thời gian thì cùng đi nhé.",
  },
  {
    id: "ko-b1-6",
    section: "grammar",
    level: "B1",
    question: "Câu nào diễn đạt 'Tôi phải đi bây giờ'?",
    options: [
      "지금 가도 돼요",
      "지금 가야 해요",
      "지금 갈까요?",
      "지금 가지 마세요",
    ],
    answer: 1,
    explanation: "-아/어야 하다 = phải làm gì. -아/어도 되다 = được phép. -(으)ㄹ까요? = ...nhé? 지 마세요 = đừng.",
  },
  {
    id: "ko-b1-7",
    section: "grammar",
    level: "B1",
    question: "Sự khác nhau giữa '안 가요' và '못 가요' là gì?",
    options: [
      "Không có khác biệt",
      "안 가요 = không đi (do ý muốn); 못 가요 = không đi được (do hoàn cảnh)",
      "안 가요 dùng cho quá khứ; 못 가요 cho tương lai",
      "못 가요 là dạng kính ngữ của 안 가요",
    ],
    answer: 1,
    explanation: "안 = phủ định chủ ý. 못 = phủ định khả năng (bị cản trở).",
  },
  {
    id: "ko-b1-8",
    section: "grammar",
    level: "B1",
    question: "'-아/어 주세요' được dùng khi nào?",
    options: [
      "Khi nhờ ai đó làm giúp mình việc gì",
      "Khi từ chối lời mời",
      "Khi kể lại chuyện quá khứ",
      "Khi so sánh hai vật",
    ],
    answer: 0,
    explanation: "-아/어 주세요 = xin hãy làm giúp. VD: 도와주세요 = xin giúp tôi với.",
  },
  {
    id: "ko-b1-9",
    section: "reading",
    level: "B1",
    question: "'약속에 늦어서 죄송합니다.' Người nói đang làm gì?",
    options: [
      "Xin lỗi vì đến trễ hẹn",
      "Hủy cuộc hẹn",
      "Đề nghị dời lịch hẹn",
      "Cảm ơn vì đã chờ",
    ],
    answer: 0,
    explanation: "약속 = cuộc hẹn, 늦다 = trễ, -아/어서 = vì, 죄송합니다 = xin lỗi.",
  },
  {
    id: "ko-b1-10",
    section: "grammar",
    level: "B1",
    question: "'-(으)ㄹ 거예요' diễn đạt điều gì?",
    options: ["Quá khứ hoàn thành", "Dự định / tương lai", "Kinh nghiệm đã từng", "Mệnh lệnh"],
    answer: 1,
    explanation: "-(으)ㄹ 거예요 = sẽ (dự định hoặc dự đoán). VD: 내일 갈 거예요 = ngày mai tôi sẽ đi.",
  },
  {
    id: "ko-b1-11",
    section: "vocabulary",
    level: "B1",
    question: "'-아/어 본 적이 있다' nghĩa là gì?",
    options: [
      "Đã từng làm việc gì đó (kinh nghiệm)",
      "Đang định làm việc gì đó",
      "Không bao giờ làm việc gì đó",
      "Bắt buộc phải làm việc gì đó",
    ],
    answer: 0,
    explanation: "-아/어 본 적이 있다 = đã từng. VD: 한국에 가 본 적이 있어요 = Tôi đã từng đến Hàn Quốc.",
  },
  {
    id: "ko-b1-12",
    section: "grammar",
    level: "B1",
    question: "Chọn câu đúng để nói 'Tôi đang ăn cơm'.",
    options: ["밥을 먹었어요", "밥을 먹고 있어요", "밥을 먹을 거예요", "밥을 먹고 싶어요"],
    answer: 1,
    explanation: "-고 있다 = đang làm (tiếp diễn). 먹었어요 = đã ăn, 먹을 거예요 = sẽ ăn, 먹고 싶어요 = muốn ăn.",
  },

  // ══ B2: Honorifics, Complex Patterns & Formal Register ═══════════════════

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
  {
    id: "ko-b2-5",
    section: "grammar",
    level: "B2",
    question: "'-(으)ㄴ/는데' trong câu '식당에 갔는데 문을 닫았어요' có vai trò gì?",
    options: [
      "Nêu bối cảnh dẫn đến vế sau",
      "Diễn tả mục đích",
      "Diễn tả điều kiện bắt buộc",
      "Diễn tả sự lựa chọn",
    ],
    answer: 0,
    explanation: "-(으)ㄴ/는데 nêu bối cảnh/tình huống nền: 'Tôi đã đến nhà hàng, nhưng (hóa ra) họ đóng cửa.'",
  },
  {
    id: "ko-b2-6",
    section: "grammar",
    level: "B2",
    question: "Câu bị động của '경찰이 도둑을 잡았어요' là gì?",
    options: [
      "도둑이 경찰에게 잡혔어요",
      "경찰이 도둑에게 잡았어요",
      "도둑을 경찰이 잡혀요",
      "경찰에게 도둑이 잡아요",
    ],
    answer: 0,
    explanation: "잡다 → 잡히다 (bị động). 'Tên trộm đã bị cảnh sát bắt.'",
  },
  {
    id: "ko-b2-7",
    section: "grammar",
    level: "B2",
    question: "'-기로 하다' diễn đạt điều gì?",
    options: ["Quyết định / hẹn sẽ làm gì", "Đã từng làm gì", "Bị buộc phải làm gì", "Không thể làm gì"],
    answer: 0,
    explanation: "-기로 하다 = quyết định làm gì. VD: 담배를 끊기로 했어요 = Tôi đã quyết định bỏ thuốc.",
  },
  {
    id: "ko-b2-8",
    section: "reading",
    level: "B2",
    question: "'이 제품은 가격에 비해 품질이 아주 좋습니다.' nghĩa là gì?",
    options: [
      "Sản phẩm này đắt hơn chất lượng của nó",
      "So với giá thì sản phẩm này chất lượng rất tốt",
      "Sản phẩm này giá rẻ nhưng chất lượng kém",
      "Giá và chất lượng của sản phẩm này đều thấp",
    ],
    answer: 1,
    explanation: "-에 비해 = so với. 가격에 비해 품질이 좋다 = chất lượng tốt so với mức giá.",
  },
  {
    id: "ko-b2-9",
    section: "grammar",
    level: "B2",
    question: "Trong văn viết trang trọng (báo cáo, thông báo), đuôi câu nào phù hợp nhất?",
    options: ["-어요/-아요", "-ㅂ니다/-습니다", "-지?", "-네"],
    answer: 1,
    explanation: "-ㅂ니다/-습니다 (하십시오체) là dạng trang trọng nhất, dùng trong báo cáo, thuyết trình, tin tức.",
  },
  {
    id: "ko-b2-10",
    section: "grammar",
    level: "B2",
    question: "'-(으)려고' và '-(으)러' khác nhau ở điểm nào?",
    options: [
      "Không khác nhau",
      "-(으)러 chỉ đi kèm động từ di chuyển (가다/오다); -(으)려고 dùng rộng hơn",
      "-(으)려고 chỉ dùng ở quá khứ",
      "-(으)러 là dạng kính ngữ",
    ],
    answer: 1,
    explanation: "밥을 먹으러 갔어요 (đi để ăn — có 가다). 밥을 먹으려고 일찍 왔어요 (đến sớm để ăn — vế sau tự do).",
  },
  {
    id: "ko-b2-11",
    section: "vocabulary",
    level: "B2",
    question: "'눈치가 빠르다' nghĩa là gì?",
    options: [
      "Mắt nhìn rất tinh",
      "Nhanh nhạy đọc được ý người khác / tinh ý",
      "Chạy rất nhanh",
      "Hay thay đổi ý kiến",
    ],
    answer: 1,
    explanation: "눈치 là khả năng đọc bầu không khí, ý tứ người khác. 눈치가 빠르다 = tinh ý, nhanh hiểu.",
  },
  {
    id: "ko-b2-12",
    section: "grammar",
    level: "B2",
    question: "Câu tường thuật của '내일 오겠다고 했어요' cho biết điều gì?",
    options: [
      "Người nói tự hứa sẽ đến",
      "Ai đó đã nói rằng họ sẽ đến vào ngày mai",
      "Người nói hỏi ngày mai có đến không",
      "Ai đó đã đến vào hôm qua",
    ],
    answer: 1,
    explanation: "-겠다고 하다 là câu tường thuật gián tiếp cho ý định: '(Ai đó) nói rằng ngày mai sẽ đến.'",
  },

  // ══ C1: Advanced Grammar & Nuance ════════════════════════════════════════

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
  {
    id: "ko-c1-5",
    section: "grammar",
    level: "C1",
    question: "'-기 마련이다' diễn đạt sắc thái gì?",
    options: [
      "Điều đó tất yếu sẽ xảy ra, là lẽ đương nhiên",
      "Điều đó hiếm khi xảy ra",
      "Điều đó bị cấm",
      "Điều đó đã xảy ra rồi",
    ],
    answer: 0,
    explanation: "-기 마련이다 = lẽ tất nhiên là. VD: 사람은 실수하기 마련이다 = Con người thì tất nhiên sẽ mắc lỗi.",
  },
  {
    id: "ko-c1-6",
    section: "grammar",
    level: "C1",
    question: "Trong '값이 싼 대신에 품질이 떨어진다', '-는 대신에' mang nghĩa gì?",
    options: [
      "Bù lại / đổi lấy (được cái này thì mất cái kia)",
      "Ngay sau khi",
      "Nhờ vào",
      "Bất chấp",
    ],
    answer: 0,
    explanation: "-는 대신에 = thay vào đó/bù lại. Câu: 'Giá rẻ nhưng bù lại chất lượng kém.'",
  },
  {
    id: "ko-c1-7",
    section: "reading",
    level: "C1",
    question: "'그는 실력도 실력이지만 무엇보다 성실하다.' Ý chính của câu này là gì?",
    options: [
      "Anh ấy không có năng lực nhưng chăm chỉ",
      "Năng lực thì đã đành, nhưng trên hết anh ấy rất chăm chỉ/thành thật",
      "Anh ấy chỉ giỏi chứ không chăm",
      "Anh ấy vừa dở vừa lười",
    ],
    answer: 1,
    explanation: "'A도 A이지만' = A thì cũng đúng đấy, nhưng... 무엇보다 = hơn hết. Nhấn mạnh 성실함.",
  },
  {
    id: "ko-c1-8",
    section: "grammar",
    level: "C1",
    question: "'-(으)ㄹ 리가 없다' nghĩa là gì?",
    options: [
      "Không có lý nào lại như vậy (không thể nào)",
      "Chắc chắn sẽ như vậy",
      "Có thể sẽ như vậy",
      "Đã từng như vậy",
    ],
    answer: 0,
    explanation: "-(으)ㄹ 리가 없다 = không đời nào, không thể có chuyện. VD: 그가 거짓말할 리가 없어요.",
  },
  {
    id: "ko-c1-9",
    section: "vocabulary",
    level: "C1",
    question: "'발이 넓다' được dùng để miêu tả người như thế nào?",
    options: [
      "Người có bàn chân to",
      "Người quen biết rộng, giao thiệp nhiều",
      "Người hay đi du lịch",
      "Người chạy nhanh",
    ],
    answer: 1,
    explanation: "발이 넓다 (nghĩa bóng) = quan hệ rộng, quen biết nhiều người.",
  },
  {
    id: "ko-c1-10",
    section: "grammar",
    level: "C1",
    question: "'-더라고요' được dùng khi nào?",
    options: [
      "Kể lại điều bản thân đã trực tiếp trải nghiệm/chứng kiến trong quá khứ",
      "Ra lệnh cho người khác",
      "Dự đoán tương lai",
      "Nêu điều kiện giả định",
    ],
    answer: 0,
    explanation: "-더라고요 = hồi tưởng, kể lại điều mình đã tận mắt thấy. VD: 그 식당 음식이 맛있더라고요.",
  },
  {
    id: "ko-c1-11",
    section: "reading",
    level: "C1",
    question: "'정부는 물가 안정을 위해 다각도로 대책을 마련하고 있다.' Câu này nói gì?",
    options: [
      "Chính phủ đang chuẩn bị đối sách từ nhiều góc độ để ổn định giá cả",
      "Chính phủ đã từ bỏ việc kiểm soát giá cả",
      "Giá cả đã ổn định nhờ chính phủ",
      "Người dân yêu cầu chính phủ hạ giá",
    ],
    answer: 0,
    explanation: "물가 안정 = ổn định vật giá, 다각도로 = từ nhiều góc độ, 대책을 마련하다 = chuẩn bị đối sách.",
  },
  {
    id: "ko-c1-12",
    section: "grammar",
    level: "C1",
    question: "Phân biệt '-든지' và '-거나' trong câu tiếng Hàn:",
    options: [
      "Hoàn toàn giống nhau trong mọi ngữ cảnh",
      "Cả hai đều nêu lựa chọn, nhưng -든지 nhấn mạnh 'bất kể cái nào cũng được'",
      "-거나 chỉ dùng với danh từ",
      "-든지 chỉ dùng trong câu hỏi",
    ],
    answer: 1,
    explanation: "-거나 = hoặc (liệt kê lựa chọn). -든지 nhấn mạnh sự vô điều kiện: 뭘 하든지 상관없어요 = làm gì cũng được.",
  },
];

/** Fisher-Yates shuffle, returns a new array */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sample 4 random questions per level (A1–C1) from the 60-question pool,
 * then shuffle the whole set. Retaking the test gives a different paper.
 */
export function getKoreanQuestions(): Question[] {
  const levels = ["A1", "A2", "B1", "B2", "C1"];
  const selected: Question[] = [];
  for (const level of levels) {
    const levelPool = KOREAN_QUESTIONS.filter((q) => q.level === level);
    selected.push(...shuffle(levelPool).slice(0, 4));
  }
  return shuffle(selected);
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
