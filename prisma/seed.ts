import { PrismaClient } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require("better-sqlite3");
import path from "path";

function resolveDbPath(): string {
  const url = process.env.DATABASE_URL;
  if (url?.startsWith("file:")) {
    const p = url.slice(5);
    return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  }
  return path.join(process.cwd(), "prisma", "dev.db");
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3(new Database(resolveDbPath())),
});

// ─── Lesson type ─────────────────────────────────────────────────────────────
type Lesson = {
  id: string;
  language: string;
  type: string;
  level: string;
  title: string;
  description: string;
  content: object;
  xpReward: number;
};

// ─── ENGLISH A1 ───────────────────────────────────────────────────────────────

const english_a1: Lesson[] = [
  {
    id: "vocabulary_english_A1",
    language: "english", type: "vocabulary", level: "A1",
    title: "Từ vựng cơ bản A1 — Chào hỏi & Cuộc sống hàng ngày",
    description: "Học 8 từ vựng thiết yếu nhất cho người mới bắt đầu",
    xpReward: 10,
    content: {
      title: "Từ vựng cơ bản A1 — Chào hỏi & Cuộc sống hàng ngày",
      words: [
        { word: "hello", phonetic: "/həˈloʊ/", meaning: "xin chào", example: "Hello! My name is Lan." },
        { word: "goodbye", phonetic: "/ˌɡʊdˈbaɪ/", meaning: "tạm biệt", example: "Goodbye! See you tomorrow." },
        { word: "please", phonetic: "/pliːz/", meaning: "làm ơn / xin", example: "Can I have some water, please?" },
        { word: "thank you", phonetic: "/ˈθæŋk juː/", meaning: "cảm ơn", example: "Thank you for your help." },
        { word: "sorry", phonetic: "/ˈsɒri/", meaning: "xin lỗi", example: "Sorry, I don't understand." },
        { word: "yes", phonetic: "/jɛs/", meaning: "có / vâng", example: "Yes, I am a student." },
        { word: "no", phonetic: "/noʊ/", meaning: "không", example: "No, I don't like coffee." },
        { word: "help", phonetic: "/hɛlp/", meaning: "giúp đỡ", example: "Can you help me, please?" },
      ],
      quiz: [
        { q: "'Thank you' nghĩa là gì?", options: ["Xin lỗi", "Tạm biệt", "Cảm ơn", "Làm ơn"], answer: 2 },
        { q: "Chọn từ đúng: 'Xin chào' trong tiếng Anh là:", options: ["Goodbye", "Hello", "Sorry", "Please"], answer: 1 },
        { q: "'Sorry' được dùng khi nào?", options: ["Khi cảm ơn ai đó", "Khi chào hỏi", "Khi xin lỗi", "Khi tạm biệt"], answer: 2 },
      ],
    },
  },
  {
    id: "grammar_english_A1",
    language: "english", type: "grammar", level: "A1",
    title: "Ngữ pháp A1 — Động từ To Be (am / is / are)",
    description: "Học cách dùng am, is, are trong câu đơn giản",
    xpReward: 10,
    content: {
      title: "Ngữ pháp A1 — Động từ To Be (am / is / are)",
      explanation: `## Động từ To Be

Động từ **to be** có 3 dạng ở thì hiện tại:

| Chủ ngữ | To Be |
|---------|-------|
| I | **am** |
| He / She / It | **is** |
| You / We / They | **are** |

### Câu khẳng định
- I **am** a student. *(Tôi là học sinh.)*
- She **is** my teacher. *(Cô ấy là giáo viên của tôi.)*
- They **are** from Vietnam. *(Họ đến từ Việt Nam.)*

### Câu phủ định — thêm "not"
- I **am not** tired. *(Tôi không mệt.)*
- He **is not** (isn't) happy. *(Anh ấy không vui.)*

### Câu hỏi — đảo động từ lên đầu
- **Are** you a teacher? *(Bạn có phải là giáo viên không?)*
- **Is** she Vietnamese? *(Cô ấy có phải người Việt không?)*`,
      quiz: [
        { q: "Điền vào chỗ trống: 'I ___ a student.'", options: ["is", "are", "am", "be"], answer: 2 },
        { q: "Câu nào đúng?", options: ["She am happy.", "She are happy.", "She is happy.", "She be happy."], answer: 2 },
        { q: "'They ___ from Japan.' — Điền đúng:", options: ["am", "is", "are", "be"], answer: 2 },
        { q: "Câu phủ định của 'He is tall' là:", options: ["He not is tall.", "He is not tall.", "He are not tall.", "He am not tall."], answer: 1 },
      ],
    },
  },
  {
    id: "reading_english_A1",
    language: "english", type: "reading", level: "A1",
    title: "Đọc hiểu A1 — My Family",
    description: "Đọc đoạn văn ngắn về gia đình và trả lời câu hỏi",
    xpReward: 10,
    content: {
      title: "Đọc hiểu A1 — My Family",
      passage: `My name is Minh. I am 20 years old. I am from Hanoi, Vietnam.

I have a small family. My father is a teacher. His name is Nam. My mother is a doctor. Her name is Lan. I have one sister. Her name is Mai. She is 16 years old.

We live in a house in Hanoi. Our house is small but nice. I love my family very much.`,
      quiz: [
        { q: "Minh bao nhiêu tuổi?", options: ["16 tuổi", "18 tuổi", "20 tuổi", "22 tuổi"], answer: 2 },
        { q: "Bố của Minh làm nghề gì?", options: ["Bác sĩ", "Giáo viên", "Kỹ sư", "Nông dân"], answer: 1 },
        { q: "Tên em gái của Minh là gì?", options: ["Lan", "Nam", "Mai", "Hoa"], answer: 2 },
        { q: "Gia đình Minh sống ở đâu?", options: ["Hồ Chí Minh", "Đà Nẵng", "Huế", "Hà Nội"], answer: 3 },
      ],
    },
  },
  {
    id: "listening_english_A1",
    language: "english", type: "listening", level: "A1",
    title: "Luyện nghe A1 — Giới thiệu bản thân",
    description: "Nghe hội thoại giới thiệu bản thân và trả lời câu hỏi",
    xpReward: 10,
    content: {
      title: "Luyện nghe A1 — Giới thiệu bản thân",
      context: "Hai người gặp nhau lần đầu tại lớp học tiếng Anh. Đọc đoạn hội thoại bên dưới như thể bạn đang nghe.",
      transcript: `Anna: Hi! My name is Anna. What's your name?
Minh: Hello, Anna! My name is Minh.
Anna: Nice to meet you, Minh. Where are you from?
Minh: I'm from Vietnam. And you?
Anna: I'm from the UK. How old are you?
Minh: I'm 22 years old. And you?
Anna: I'm 20. Are you a student?
Minh: Yes, I'm a university student. What about you?
Anna: Me too! I study English literature. What do you study?
Minh: I study computer science. Nice to meet you, Anna!
Anna: Nice to meet you too, Minh!`,
      quiz: [
        { q: "Anna đến từ đâu?", options: ["Mỹ", "Anh", "Úc", "Canada"], answer: 1 },
        { q: "Minh học ngành gì?", options: ["Văn học Anh", "Kinh tế", "Khoa học máy tính", "Y khoa"], answer: 2 },
        { q: "Anna bao nhiêu tuổi?", options: ["18", "19", "20", "22"], answer: 2 },
        { q: "Họ gặp nhau ở đâu theo ngữ cảnh?", options: ["Quán cà phê", "Lớp học", "Công viên", "Siêu thị"], answer: 1 },
      ],
    },
  },
  {
    id: "writing_english_A1",
    language: "english", type: "writing", level: "A1",
    title: "Luyện viết A1 — Giới thiệu bản thân",
    description: "Viết đoạn văn ngắn giới thiệu về bản thân bằng tiếng Anh",
    xpReward: 10,
    content: {
      title: "Luyện viết A1 — Giới thiệu bản thân",
      prompt: "Viết một đoạn văn ngắn (5-6 câu) giới thiệu bản thân. Bao gồm: tên, tuổi, quốc tịch, nghề nghiệp/học sinh, sở thích.",
      tips: [
        "Bắt đầu bằng: 'My name is...' hoặc 'I am...'",
        "Dùng 'I am' (I'm) để nói về bản thân",
        "Dùng 'I like' để nói về sở thích",
        "Kết thúc bằng một câu về gia đình hoặc nơi sống",
      ],
      example: `My name is Linh. I am 21 years old. I am from Vietnam. I am a university student. I study English. I like music and reading books. I live with my family in Ho Chi Minh City.`,
      quiz: [
        { q: "Câu nào đúng ngữ pháp khi giới thiệu tên?", options: ["My name Linh.", "I Linh.", "My name is Linh.", "Name me is Linh."], answer: 2 },
        { q: "Cách nói 'Tôi thích âm nhạc' là:", options: ["I music like.", "I am like music.", "I like music.", "Music I like."], answer: 2 },
        { q: "'I am a student' có thể viết tắt thành:", options: ["I'm a student.", "Im a student.", "I'am a student.", "Iam a student."], answer: 0 },
      ],
    },
  },
  {
    id: "speaking_english_A1",
    language: "english", type: "speaking", level: "A1",
    title: "Luyện nói A1 — Chào hỏi & Giới thiệu",
    description: "Thực hành các câu chào hỏi và giới thiệu cơ bản",
    xpReward: 10,
    content: {
      title: "Luyện nói A1 — Chào hỏi & Giới thiệu",
      topic: "Chào hỏi và giới thiệu bản thân",
      phrases: [
        { phrase: "What's your name?", phonetic: "/wɒts jɔː neɪm/", meaning: "Tên bạn là gì?" },
        { phrase: "My name is...", phonetic: "/maɪ neɪm ɪz/", meaning: "Tên tôi là..." },
        { phrase: "Nice to meet you!", phonetic: "/naɪs tə miːt juː/", meaning: "Rất vui được gặp bạn!" },
        { phrase: "Where are you from?", phonetic: "/wɛr ɑː juː frɒm/", meaning: "Bạn đến từ đâu?" },
        { phrase: "I'm from Vietnam.", phonetic: "/aɪm frɒm ˌvjɛtˈnæm/", meaning: "Tôi đến từ Việt Nam." },
        { phrase: "How are you?", phonetic: "/haʊ ɑː juː/", meaning: "Bạn có khỏe không?" },
        { phrase: "I'm fine, thank you!", phonetic: "/aɪm faɪn ˈθæŋk juː/", meaning: "Tôi khỏe, cảm ơn!" },
      ],
      dialogue: [
        { speaker: "A", text: "Hi! What's your name?", translation: "Chào! Tên bạn là gì?" },
        { speaker: "B", text: "My name is Minh. And you?", translation: "Tên tôi là Minh. Còn bạn?" },
        { speaker: "A", text: "I'm Anna. Nice to meet you!", translation: "Tôi là Anna. Rất vui được gặp bạn!" },
        { speaker: "B", text: "Nice to meet you too! Where are you from?", translation: "Tôi cũng rất vui! Bạn đến từ đâu?" },
        { speaker: "A", text: "I'm from England. How are you?", translation: "Tôi đến từ Anh. Bạn có khỏe không?" },
        { speaker: "B", text: "I'm fine, thank you!", translation: "Tôi khỏe, cảm ơn!" },
      ],
      quiz: [
        { q: "Cách hỏi tên ai đó là:", options: ["What your name?", "What's your name?", "Your name what?", "Name your is?"], answer: 1 },
        { q: "'Nice to meet you' nghĩa là:", options: ["Tạm biệt", "Xin chào", "Rất vui được gặp bạn", "Hẹn gặp lại"], answer: 2 },
        { q: "Trả lời 'How are you?' như thế nào?", options: ["I'm Anna.", "I'm from Vietnam.", "I'm fine, thank you!", "Nice to meet you!"], answer: 2 },
      ],
    },
  },
  {
    id: "review_english_A1",
    language: "english", type: "review", level: "A1",
    title: "Ôn tập A1 — Tổng hợp kiến thức cơ bản",
    description: "Ôn lại toàn bộ kiến thức A1: chào hỏi, to be, từ vựng cơ bản",
    xpReward: 15,
    content: {
      title: "Ôn tập A1 — Tổng hợp kiến thức cơ bản",
      summary: `## Tổng kết A1

### Từ vựng quan trọng
Các từ chào hỏi: hello, goodbye, please, thank you, sorry, yes, no

### Động từ To Be
- I **am** | He/She/It **is** | You/We/They **are**
- Phủ định: am not, is not (isn't), are not (aren't)
- Câu hỏi: Am I? / Is he? / Are you?

### Cấu trúc câu cơ bản
- Giới thiệu: My name is + [tên]
- Nghề nghiệp: I am a + [nghề]
- Xuất xứ: I am from + [nơi]
- Sở thích: I like + [danh từ]`,
      words: [
        { word: "student", phonetic: "/ˈstjuːdənt/", meaning: "học sinh / sinh viên", example: "I am a student." },
        { word: "teacher", phonetic: "/ˈtiːtʃər/", meaning: "giáo viên", example: "She is a teacher." },
        { word: "family", phonetic: "/ˈfæməli/", meaning: "gia đình", example: "I love my family." },
        { word: "friend", phonetic: "/frɛnd/", meaning: "bạn bè", example: "He is my friend." },
        { word: "house", phonetic: "/haʊs/", meaning: "ngôi nhà", example: "We live in a house." },
      ],
      quiz: [
        { q: "Điền đúng: 'She ___ my sister.'", options: ["am", "are", "is", "be"], answer: 2 },
        { q: "'I am from Vietnam.' Câu hỏi tương ứng là:", options: ["Where you from?", "Where are you from?", "Where is you from?", "From where you?"], answer: 1 },
        { q: "'Thank you' — phản hồi thông thường là:", options: ["Sorry!", "Goodbye!", "You're welcome!", "Hello!"], answer: 2 },
        { q: "Câu nào đúng?", options: ["I are a student.", "I am a student.", "I is a student.", "I be a student."], answer: 1 },
        { q: "'Nice to meet you!' — Phản hồi đúng:", options: ["I'm fine!", "Thank you!", "Nice to meet you too!", "Goodbye!"], answer: 2 },
      ],
    },
  },
];

// ─── ENGLISH A2 ───────────────────────────────────────────────────────────────

const english_a2: Lesson[] = [
  {
    id: "vocabulary_english_A2",
    language: "english", type: "vocabulary", level: "A2",
    title: "Từ vựng A2 — Hoạt động hàng ngày",
    description: "Học từ vựng về các hoạt động và thói quen thường ngày",
    xpReward: 10,
    content: {
      title: "Từ vựng A2 — Hoạt động hàng ngày",
      words: [
        { word: "wake up", phonetic: "/weɪk ʌp/", meaning: "thức dậy", example: "I wake up at 6 o'clock every morning." },
        { word: "breakfast", phonetic: "/ˈbrɛkfəst/", meaning: "bữa sáng", example: "She always eats breakfast before school." },
        { word: "commute", phonetic: "/kəˈmjuːt/", meaning: "đi làm / đi học hàng ngày", example: "He commutes to work by bus." },
        { word: "lunch", phonetic: "/lʌntʃ/", meaning: "bữa trưa", example: "We have lunch at noon." },
        { word: "relax", phonetic: "/rɪˈlæks/", meaning: "thư giãn", example: "I like to relax by watching movies." },
        { word: "exercise", phonetic: "/ˈɛksəsaɪz/", meaning: "tập thể dục", example: "She exercises for 30 minutes every day." },
        { word: "go to bed", phonetic: "/ɡoʊ tə bɛd/", meaning: "đi ngủ", example: "I go to bed at 10 pm." },
        { word: "cook", phonetic: "/kʊk/", meaning: "nấu ăn", example: "My mother cooks dinner every evening." },
      ],
      quiz: [
        { q: "'Wake up' nghĩa là gì?", options: ["Đi ngủ", "Thức dậy", "Nấu ăn", "Thư giãn"], answer: 1 },
        { q: "Từ nào có nghĩa là 'bữa sáng'?", options: ["Lunch", "Dinner", "Breakfast", "Snack"], answer: 2 },
        { q: "'She exercises every day.' — 'exercise' nghĩa là gì?", options: ["Ăn sáng", "Đi học", "Tập thể dục", "Đi ngủ"], answer: 2 },
      ],
    },
  },
  {
    id: "grammar_english_A2",
    language: "english", type: "grammar", level: "A2",
    title: "Ngữ pháp A2 — Thì Quá Khứ Đơn (Simple Past)",
    description: "Học cách dùng thì quá khứ đơn để kể về sự kiện đã xảy ra",
    xpReward: 10,
    content: {
      title: "Ngữ pháp A2 — Thì Quá Khứ Đơn (Simple Past)",
      explanation: `## Thì Quá Khứ Đơn (Simple Past)

Dùng để diễn tả **hành động đã xảy ra và kết thúc** trong quá khứ.

### Cách chia động từ
**Động từ có quy tắc:** thêm **-ed**
- work → worked | study → studied | play → played

**Động từ bất quy tắc:** phải học thuộc
- go → went | eat → ate | see → saw | have → had | come → came

### Câu khẳng định
- I **watched** TV last night. *(Tôi xem TV tối qua.)*
- She **went** to school yesterday. *(Cô ấy đi học hôm qua.)*

### Câu phủ định — dùng "did not (didn't)"
- I **didn't watch** TV. | She **didn't go** to school.

### Câu hỏi — dùng "Did"
- **Did** you watch TV last night? *(Tối qua bạn có xem TV không?)*
- **Did** she go to school? → Yes, she did. / No, she didn't.`,
      quiz: [
        { q: "Dạng quá khứ của 'go' là:", options: ["goed", "went", "gone", "goes"], answer: 1 },
        { q: "Câu phủ định đúng: 'I ___ eat breakfast today.'", options: ["didn't", "don't", "not", "wasn't"], answer: 0 },
        { q: "Câu hỏi đúng: '___ you see that movie?'", options: ["Do", "Does", "Did", "Were"], answer: 2 },
        { q: "Dạng quá khứ của 'study' là:", options: ["studyed", "studid", "studied", "studed"], answer: 2 },
      ],
    },
  },
  {
    id: "reading_english_A2",
    language: "english", type: "reading", level: "A2",
    title: "Đọc hiểu A2 — A Day in London",
    description: "Đọc bài về chuyến thăm London và trả lời câu hỏi",
    xpReward: 10,
    content: {
      title: "Đọc hiểu A2 — A Day in London",
      passage: `Last Saturday, my friend Hoa and I visited London. We woke up early and took the train from our hotel.

First, we went to the British Museum. It was very big and interesting. We saw many old things from Egypt and Greece. We spent two hours there.

After the museum, we had lunch at a small café near the Thames River. I ate fish and chips for the first time. It was delicious!

In the afternoon, we walked across Tower Bridge and took many photos. The view of the river was beautiful. Then we visited the Tower of London. It was built over 900 years ago!

In the evening, we were very tired, but very happy. London is an amazing city. I want to go back someday.`,
      quiz: [
        { q: "Hoa và người kể chuyện đi đâu đầu tiên?", options: ["Tower Bridge", "Bảo tàng Anh", "Sông Thames", "Tháp London"], answer: 1 },
        { q: "Họ ăn gì vào buổi trưa?", options: ["Pizza", "Hamburger", "Fish and chips", "Sandwich"], answer: 2 },
        { q: "Tháp London được xây dựng cách đây bao lâu?", options: ["100 năm", "500 năm", "700 năm", "900 năm"], answer: 3 },
        { q: "Chuyến đi diễn ra vào ngày nào?", options: ["Thứ Sáu", "Thứ Bảy", "Chủ Nhật", "Thứ Hai"], answer: 1 },
      ],
    },
  },
  {
    id: "listening_english_A2",
    language: "english", type: "listening", level: "A2",
    title: "Luyện nghe A2 — Đặt bàn tại nhà hàng",
    description: "Nghe hội thoại đặt bàn và gọi món tại nhà hàng",
    xpReward: 10,
    content: {
      title: "Luyện nghe A2 — Đặt bàn tại nhà hàng",
      context: "Một khách hàng gọi điện đến nhà hàng để đặt bàn. Đọc hội thoại bên dưới.",
      transcript: `Waiter: Good evening, Milano Restaurant. How can I help you?
Customer: Hi, I'd like to book a table for tonight, please.
Waiter: Of course. How many people?
Customer: For four people, please.
Waiter: And what time would you like?
Customer: At 7:30, if possible.
Waiter: Let me check... Yes, we have a table at 7:30. Can I have your name, please?
Customer: It's Nguyen, N-G-U-Y-E-N.
Waiter: Perfect. So that's a table for four at 7:30 tonight for Mr. Nguyen.
Customer: Yes, that's right. Also, one of our guests is vegetarian. Is that okay?
Waiter: Of course! We have many vegetarian options on our menu.
Customer: Great. Thank you very much!
Waiter: You're welcome. See you tonight!`,
      quiz: [
        { q: "Khách hàng muốn đặt bàn cho mấy người?", options: ["2 người", "3 người", "4 người", "5 người"], answer: 2 },
        { q: "Họ đặt bàn vào lúc mấy giờ?", options: ["6:30", "7:00", "7:30", "8:00"], answer: 2 },
        { q: "Tên của khách hàng là gì?", options: ["Milano", "Nguyen", "Waiter", "Vegetarian"], answer: 1 },
        { q: "Tại sao khách hàng hỏi về thực đơn chay?", options: ["Anh ấy thích rau", "Một người bạn ăn chay", "Nhà hàng chỉ có đồ chay", "Đồ chay rẻ hơn"], answer: 1 },
      ],
    },
  },
  {
    id: "writing_english_A2",
    language: "english", type: "writing", level: "A2",
    title: "Luyện viết A2 — Kể về kỳ nghỉ cuối tuần",
    description: "Viết đoạn văn về những gì bạn đã làm vào cuối tuần",
    xpReward: 10,
    content: {
      title: "Luyện viết A2 — Kể về kỳ nghỉ cuối tuần",
      prompt: "Viết một đoạn văn (6-8 câu) về cuối tuần vừa rồi của bạn. Dùng thì quá khứ đơn. Bao gồm: bạn làm gì, đi đâu, với ai, cảm giác như thế nào.",
      tips: [
        "Dùng thì quá khứ đơn: went, ate, watched, played, visited...",
        "Thêm từ chỉ thời gian: last weekend, on Saturday, in the morning, then, after that...",
        "Dùng tính từ để mô tả cảm xúc: happy, tired, excited, bored, wonderful",
        "Kết thúc bằng cảm nhận chung về cuối tuần",
      ],
      example: `Last weekend, I had a great time. On Saturday morning, I woke up late and cooked breakfast at home. Then, I met my friends at the park. We played football for two hours. It was a lot of fun!

In the afternoon, we went to a café and had drinks. We talked and laughed a lot. In the evening, I went home and watched a movie with my family. On Sunday, I studied for my exams. It was a busy but enjoyable weekend.`,
      quiz: [
        { q: "Cách bắt đầu câu kể về quá khứ cuối tuần:", options: ["Last weekend, I...", "Next weekend, I...", "Every weekend, I...", "This weekend, I..."], answer: 0 },
        { q: "'We played football.' Đây là thì gì?", options: ["Hiện tại đơn", "Tương lai", "Quá khứ đơn", "Hiện tại tiếp diễn"], answer: 2 },
        { q: "Từ nào KHÔNG phải thì quá khứ?", options: ["went", "ate", "played", "go"], answer: 3 },
      ],
    },
  },
  {
    id: "speaking_english_A2",
    language: "english", type: "speaking", level: "A2",
    title: "Luyện nói A2 — Nói về sở thích",
    description: "Thực hành hội thoại về sở thích và hoạt động yêu thích",
    xpReward: 10,
    content: {
      title: "Luyện nói A2 — Nói về sở thích",
      topic: "Sở thích và hoạt động yêu thích",
      phrases: [
        { phrase: "What do you do in your free time?", phonetic: "/wɒt duː juː duː ɪn jɔː friː taɪm/", meaning: "Bạn thường làm gì vào thời gian rảnh?" },
        { phrase: "I enjoy...", phonetic: "/aɪ ɪnˈdʒɔɪ/", meaning: "Tôi thích..." },
        { phrase: "I'm interested in...", phonetic: "/aɪm ˈɪntrəstɪd ɪn/", meaning: "Tôi quan tâm đến..." },
        { phrase: "I'm not really into...", phonetic: "/aɪm nɒt ˈrɪəli ˈɪntə/", meaning: "Tôi không thực sự thích..." },
        { phrase: "How often do you...?", phonetic: "/haʊ ˈɒfən duː juː/", meaning: "Bạn thường... như thế nào?" },
        { phrase: "Once/twice a week", phonetic: "/wʌns/twaɪs ə wiːk/", meaning: "Một/hai lần một tuần" },
      ],
      dialogue: [
        { speaker: "A", text: "What do you do in your free time, Minh?", translation: "Bạn thường làm gì vào thời gian rảnh, Minh?" },
        { speaker: "B", text: "I enjoy playing football and listening to music. What about you?", translation: "Tôi thích chơi bóng đá và nghe nhạc. Còn bạn?" },
        { speaker: "A", text: "I'm really into photography. I take photos every weekend.", translation: "Tôi rất thích chụp ảnh. Tôi chụp ảnh mỗi cuối tuần." },
        { speaker: "B", text: "That's cool! How often do you play football?", translation: "Thú vị đấy! Bạn chơi bóng đá bao lâu một lần?" },
        { speaker: "A", text: "Twice a week, usually on Tuesday and Thursday.", translation: "Hai lần một tuần, thường vào thứ Ba và thứ Năm." },
      ],
      quiz: [
        { q: "'I enjoy playing football.' — 'enjoy' đi với:", options: ["Động từ nguyên mẫu (to play)", "Danh động từ (playing)", "Tính từ", "Danh từ thuần túy"], answer: 1 },
        { q: "'Once a week' nghĩa là:", options: ["Mỗi ngày", "Hai lần một tuần", "Một lần một tuần", "Mỗi tháng"], answer: 2 },
        { q: "Cách hỏi về sở thích:", options: ["What you like?", "What do you do in your free time?", "You enjoy what?", "Your hobby what is?"], answer: 1 },
      ],
    },
  },
  {
    id: "review_english_A2",
    language: "english", type: "review", level: "A2",
    title: "Ôn tập A2 — Quá khứ & Sở thích",
    description: "Ôn tập thì quá khứ đơn, từ vựng hoạt động hàng ngày và cách diễn đạt sở thích",
    xpReward: 15,
    content: {
      title: "Ôn tập A2 — Quá khứ & Sở thích",
      summary: `## Tổng kết A2

### Thì Quá Khứ Đơn
- Thêm **-ed**: work→worked, play→played, watch→watched
- Bất quy tắc: go→went, eat→ate, see→saw, have→had
- Phủ định: **didn't** + động từ nguyên mẫu
- Câu hỏi: **Did** + chủ ngữ + động từ nguyên mẫu?

### Từ vựng hoạt động hàng ngày
wake up, have breakfast/lunch/dinner, commute, exercise, cook, relax, go to bed

### Diễn đạt sở thích
- I enjoy + V-ing
- I'm interested in + V-ing / noun
- I'm not really into + V-ing / noun
- How often do you...? → Once/twice a week`,
      words: [
        { word: "visited", phonetic: "/ˈvɪzɪtɪd/", meaning: "đã thăm (quá khứ của visit)", example: "I visited my grandmother last Sunday." },
        { word: "enjoyed", phonetic: "/ɪnˈdʒɔɪd/", meaning: "đã thích / đã thưởng thức", example: "We enjoyed the concert very much." },
        { word: "hobby", phonetic: "/ˈhɒbi/", meaning: "sở thích", example: "My hobby is painting." },
        { word: "weekend", phonetic: "/ˈwiːkɛnd/", meaning: "cuối tuần", example: "I relax on the weekend." },
        { word: "exciting", phonetic: "/ɪkˈsaɪtɪŋ/", meaning: "hấp dẫn / thú vị", example: "The trip was very exciting!" },
      ],
      quiz: [
        { q: "Dạng quá khứ của 'eat' là:", options: ["eated", "ate", "eaten", "eats"], answer: 1 },
        { q: "Câu đúng: 'I enjoy ___'", options: ["to swim", "swim", "swimming", "swam"], answer: 2 },
        { q: "'Did you go to the party?' — Trả lời đúng:", options: ["Yes, I went.", "Yes, I go.", "Yes, I did go.", "Yes, I goes."], answer: 0 },
        { q: "'Twice a week' nghĩa là:", options: ["Hai tuần một lần", "Hai lần một tuần", "Mỗi tuần", "Thỉnh thoảng"], answer: 1 },
        { q: "Câu phủ định đúng của 'She went to school':", options: ["She not went to school.", "She didn't went to school.", "She didn't go to school.", "She wasn't go to school."], answer: 2 },
      ],
    },
  },
];

// ─── ENGLISH B1 ───────────────────────────────────────────────────────────────

const english_b1: Lesson[] = [
  {
    id: "vocabulary_english_B1",
    language: "english", type: "vocabulary", level: "B1",
    title: "Từ vựng B1 — Du lịch & Đi lại",
    description: "Từ vựng trung cấp về du lịch, phương tiện và di chuyển",
    xpReward: 12,
    content: {
      title: "Từ vựng B1 — Du lịch & Đi lại",
      words: [
        { word: "destination", phonetic: "/ˌdɛstɪˈneɪʃən/", meaning: "điểm đến", example: "Paris is a popular tourist destination." },
        { word: "accommodation", phonetic: "/əˌkɒməˈdeɪʃən/", meaning: "chỗ ở", example: "We need to book accommodation before the trip." },
        { word: "itinerary", phonetic: "/aɪˈtɪnərəri/", meaning: "lịch trình", example: "Our travel itinerary includes three cities." },
        { word: "currency", phonetic: "/ˈkʌrənsi/", meaning: "tiền tệ", example: "You need to exchange currency before traveling abroad." },
        { word: "departure", phonetic: "/dɪˈpɑːtʃər/", meaning: "sự khởi hành", example: "The departure time is 8:00 AM." },
        { word: "landmark", phonetic: "/ˈlændmɑːrk/", meaning: "địa danh nổi tiếng", example: "The Eiffel Tower is a famous landmark in Paris." },
        { word: "souvenir", phonetic: "/ˌsuːvəˈnɪər/", meaning: "đồ lưu niệm", example: "I bought some souvenirs for my family." },
        { word: "jet lag", phonetic: "/ˈdʒɛt læɡ/", meaning: "mệt mỏi do lệch múi giờ", example: "I felt jet lag after the long flight." },
      ],
      quiz: [
        { q: "'Destination' nghĩa là gì?", options: ["Hành lý", "Điểm đến", "Chỗ ở", "Vé máy bay"], answer: 1 },
        { q: "'We need to book accommodation.' — 'accommodation' là:", options: ["Vé tàu", "Hướng dẫn viên", "Chỗ ở", "Địa danh"], answer: 2 },
        { q: "'Jet lag' xảy ra khi nào?", options: ["Khi đi bộ nhiều", "Khi ăn quá nhiều", "Khi bay qua nhiều múi giờ", "Khi mất hành lý"], answer: 2 },
      ],
    },
  },
  {
    id: "grammar_english_B1",
    language: "english", type: "grammar", level: "B1",
    title: "Ngữ pháp B1 — Thì Hiện Tại Hoàn Thành (Present Perfect)",
    description: "Học cách dùng Present Perfect để nói về kinh nghiệm và kết quả",
    xpReward: 12,
    content: {
      title: "Ngữ pháp B1 — Thì Hiện Tại Hoàn Thành (Present Perfect)",
      explanation: `## Thì Hiện Tại Hoàn Thành

**Cấu trúc:** have/has + Past Participle (V3)

### Khi nào dùng?

**1. Kinh nghiệm trong cuộc sống** (không nói thời điểm cụ thể)
- I **have visited** Japan. *(Tôi đã từng đến Nhật.)*
- She **has never eaten** sushi. *(Cô ấy chưa bao giờ ăn sushi.)*

**2. Hành động vừa xảy ra** — dùng với **just**
- I **have just finished** my homework. *(Tôi vừa xong bài tập.)*

**3. Kết quả của hành động ảnh hưởng đến hiện tại**
- He **has lost** his phone. *(Anh ấy mất điện thoại rồi — vẫn chưa tìm được.)*

### Từ hay dùng cùng
**ever, never, just, already, yet, for, since**

- **Have** you **ever** been to Paris?
- I **haven't** seen that movie **yet**.
- She **has** worked here **for** 5 years / **since** 2020.`,
      quiz: [
        { q: "Câu đúng với Present Perfect:", options: ["I have visit Japan.", "I visited Japan yesterday.", "I have visited Japan.", "I am visit Japan."], answer: 2 },
        { q: "'She ___ never eaten sushi.' — Điền đúng:", options: ["did", "has", "have", "is"], answer: 1 },
        { q: "'I have just finished work.' — 'just' mang nghĩa:", options: ["Chưa bao giờ", "Vừa mới", "Đã từng", "Chưa"], answer: 1 },
        { q: "Chọn câu đúng: 'Tôi làm việc ở đây được 3 năm':", options: ["I work here for 3 years.", "I worked here for 3 years.", "I have worked here for 3 years.", "I am working here since 3 years."], answer: 2 },
      ],
    },
  },
  {
    id: "reading_english_B1",
    language: "english", type: "reading", level: "B1",
    title: "Đọc hiểu B1 — The Benefits of Learning a Foreign Language",
    description: "Đọc bài về lợi ích của việc học ngoại ngữ",
    xpReward: 12,
    content: {
      title: "Đọc hiểu B1 — The Benefits of Learning a Foreign Language",
      passage: `Learning a foreign language is one of the most valuable skills a person can develop in today's globalized world. Beyond simple communication, it offers a wide range of benefits that can transform your personal and professional life.

First, learning a new language significantly improves cognitive abilities. Research shows that bilingual people are better at multitasking, problem-solving, and focusing on tasks. The mental exercise of switching between languages keeps the brain active and may even delay the onset of conditions like dementia.

Second, knowing a foreign language opens doors to new career opportunities. Many international companies prefer employees who can communicate in multiple languages. Whether you work in business, medicine, law, or technology, speaking another language can give you a competitive advantage.

Third, language learning deepens cultural understanding. When you learn a language, you also learn about the history, traditions, and values of the people who speak it. This builds empathy and reduces cultural misunderstandings.

Finally, many learners report that mastering a new language boosts their self-confidence. The sense of achievement when you hold your first real conversation in a foreign language is unforgettable.

In conclusion, the benefits of language learning extend far beyond the classroom — they touch every aspect of your life.`,
      quiz: [
        { q: "Theo bài đọc, người nói hai thứ tiếng giỏi hơn về mặt nào?", options: ["Thể thao", "Đa nhiệm và giải quyết vấn đề", "Âm nhạc", "Nghệ thuật"], answer: 1 },
        { q: "Học ngoại ngữ có thể giúp ích gì trong sự nghiệp?", options: ["Tăng lương ngay lập tức", "Được nhận vào công ty quốc tế dễ hơn", "Không cần phỏng vấn", "Làm việc ít giờ hơn"], answer: 1 },
        { q: "Tại sao học ngôn ngữ giúp hiểu văn hóa?", options: ["Vì bạn phải đi du lịch", "Vì bạn học cả lịch sử và giá trị của người bản ngữ", "Vì sách giáo khoa dạy văn hóa", "Vì giáo viên giải thích"], answer: 1 },
        { q: "Lợi ích cuối cùng được đề cập trong bài là gì?", options: ["Kiếm nhiều tiền hơn", "Có nhiều bạn bè hơn", "Tự tin hơn", "Thông minh hơn"], answer: 2 },
      ],
    },
  },
  {
    id: "listening_english_B1",
    language: "english", type: "listening", level: "B1",
    title: "Luyện nghe B1 — Phỏng vấn về công việc tình nguyện",
    description: "Nghe cuộc phỏng vấn về trải nghiệm tình nguyện",
    xpReward: 12,
    content: {
      title: "Luyện nghe B1 — Phỏng vấn về công việc tình nguyện",
      context: "Một phóng viên đang phỏng vấn sinh viên tên Sarah về trải nghiệm tình nguyện của cô tại một trường học ở vùng nông thôn.",
      transcript: `Reporter: Sarah, you recently volunteered at a school in a rural area. Can you tell us about that experience?
Sarah: Absolutely! I spent three months teaching English at a small school in northern Vietnam. It was an amazing experience that changed my perspective completely.
Reporter: What were the biggest challenges you faced?
Sarah: At first, the language barrier was difficult. Many students spoke very little English, and I spoke very little Vietnamese. But we found creative ways to communicate — using pictures, gestures, and lots of patience!
Reporter: How did you overcome those challenges?
Sarah: I focused on making lessons fun and visual. I used games, songs, and simple stories. After a few weeks, I could see real progress. The students were speaking more confidently and I was picking up Vietnamese words too!
Reporter: What did you gain from the experience?
Sarah: So much! My teaching skills improved dramatically. I also developed greater empathy and patience. Most importantly, I formed genuine friendships with both the students and local teachers. I still keep in touch with several of them.
Reporter: Would you recommend volunteering abroad to other students?
Sarah: Without hesitation! It's challenging, but the personal growth you experience is incredible. You learn as much as you teach.`,
      quiz: [
        { q: "Sarah dạy ở đâu?", options: ["Hà Nội", "Hồ Chí Minh", "Một trường ở miền Bắc Việt Nam", "Đà Nẵng"], answer: 2 },
        { q: "Thách thức lớn nhất ban đầu của Sarah là gì?", options: ["Thời tiết", "Rào cản ngôn ngữ", "Thiếu học sinh", "Không có tài liệu dạy"], answer: 1 },
        { q: "Sarah đã làm gì để vượt qua khó khăn?", options: ["Thuê phiên dịch", "Dùng trò chơi, bài hát và hình ảnh", "Dạy bằng tiếng Việt", "Bỏ cuộc"], answer: 1 },
        { q: "Sarah có giữ liên lạc với học sinh không?", options: ["Không, cô ấy quá bận", "Có, cô ấy vẫn liên lạc với một số người", "Không được phép", "Chỉ với giáo viên"], answer: 1 },
      ],
    },
  },
  {
    id: "writing_english_B1",
    language: "english", type: "writing", level: "B1",
    title: "Luyện viết B1 — Viết email chính thức",
    description: "Học cách viết email chính thức xin việc hoặc hỏi thông tin",
    xpReward: 12,
    content: {
      title: "Luyện viết B1 — Viết email chính thức",
      prompt: "Viết một email chính thức (100-130 từ) gửi đến một công ty để hỏi về chương trình thực tập hè. Bao gồm: lý do viết, thông tin về bản thân, câu hỏi cụ thể, lời kết.",
      tips: [
        "Bắt đầu bằng: 'Dear Sir/Madam,' hoặc 'Dear [Tên],'",
        "Đoạn 1: Giới thiệu bản thân và lý do viết",
        "Đoạn 2: Nêu kỹ năng và lý do quan tâm",
        "Câu hỏi: hỏi về thời gian, yêu cầu, cách nộp hồ sơ",
        "Kết thúc: 'I look forward to hearing from you.' / 'Yours faithfully,'",
      ],
      example: `Dear Sir/Madam,

I am writing to inquire about internship opportunities at your company this summer. I am a third-year student studying Business Administration at the University of Economics in Ho Chi Minh City.

I am particularly interested in your marketing department, as I have experience with social media management and content creation. I believe an internship at your company would help me develop my professional skills significantly.

Could you please provide information about the application process, required qualifications, and the duration of the internship? I would also like to know if the position is paid.

I look forward to hearing from you. Thank you for your time and consideration.

Yours faithfully,
Nguyen Thi Lan`,
      quiz: [
        { q: "Email chính thức thường bắt đầu bằng:", options: ["Hey!", "Hi there,", "Dear Sir/Madam,", "Hello friend,"], answer: 2 },
        { q: "Câu kết thúc phù hợp cho email chính thức:", options: ["See you!", "Bye!", "I look forward to hearing from you.", "Thanks, bye!"], answer: 2 },
        { q: "'I am writing to inquire about...' — 'inquire' nghĩa là:", options: ["Phàn nàn", "Hỏi thông tin", "Xin lỗi", "Cảm ơn"], answer: 1 },
      ],
    },
  },
  {
    id: "speaking_english_B1",
    language: "english", type: "speaking", level: "B1",
    title: "Luyện nói B1 — Bày tỏ ý kiến và quan điểm",
    description: "Thực hành cách bày tỏ ý kiến, đồng ý và không đồng ý lịch sự",
    xpReward: 12,
    content: {
      title: "Luyện nói B1 — Bày tỏ ý kiến và quan điểm",
      topic: "Bày tỏ ý kiến về các vấn đề hàng ngày",
      phrases: [
        { phrase: "In my opinion...", phonetic: "/ɪn maɪ əˈpɪnjən/", meaning: "Theo ý kiến của tôi..." },
        { phrase: "I think/believe that...", phonetic: "/aɪ θɪŋk/bɪˈliːv ðæt/", meaning: "Tôi nghĩ/tin rằng..." },
        { phrase: "I agree with you.", phonetic: "/aɪ əˈɡriː wɪð juː/", meaning: "Tôi đồng ý với bạn." },
        { phrase: "I'm not sure about that.", phonetic: "/aɪm nɒt ʃʊər əˈbaʊt ðæt/", meaning: "Tôi không chắc về điều đó." },
        { phrase: "That's a good point, but...", phonetic: "/ðæts ə ɡʊd pɔɪnt bʌt/", meaning: "Đó là quan điểm hay, nhưng..." },
        { phrase: "On the other hand...", phonetic: "/ɒn ðə ˈʌðər hænd/", meaning: "Mặt khác..." },
      ],
      dialogue: [
        { speaker: "A", text: "I think social media has a negative effect on young people. What do you think?", translation: "Tôi nghĩ mạng xã hội ảnh hưởng tiêu cực đến giới trẻ. Bạn nghĩ sao?" },
        { speaker: "B", text: "In my opinion, it depends on how you use it. Social media can be very useful for learning.", translation: "Theo ý kiến tôi, điều đó phụ thuộc vào cách bạn sử dụng. Mạng xã hội rất hữu ích cho việc học." },
        { speaker: "A", text: "That's a good point, but many teenagers spend too much time scrolling instead of studying.", translation: "Đó là quan điểm hay, nhưng nhiều thanh thiếu niên dành quá nhiều thời gian lướt thay vì học." },
        { speaker: "B", text: "I agree with you on that. On the other hand, it helps people stay connected with friends and family.", translation: "Tôi đồng ý với bạn về điểm đó. Mặt khác, nó giúp mọi người duy trì liên lạc với bạn bè và gia đình." },
      ],
      quiz: [
        { q: "Cách bày tỏ ý kiến lịch sự:", options: ["You are wrong!", "I think that...", "Obviously...", "Everyone knows..."], answer: 1 },
        { q: "'That's a good point, but...' được dùng khi:", options: ["Hoàn toàn đồng ý", "Không nghe thấy", "Thừa nhận ý kiến đối phương nhưng muốn phản bác", "Kết thúc cuộc trò chuyện"], answer: 2 },
        { q: "'On the other hand' dùng để:", options: ["Bắt đầu câu chuyện", "Đưa ra quan điểm trái chiều", "Kết luận", "Chào hỏi"], answer: 1 },
      ],
    },
  },
  {
    id: "review_english_B1",
    language: "english", type: "review", level: "B1",
    title: "Ôn tập B1 — Present Perfect & Kỹ năng giao tiếp",
    description: "Ôn tập Present Perfect, từ vựng du lịch và cách diễn đạt ý kiến",
    xpReward: 15,
    content: {
      title: "Ôn tập B1 — Present Perfect & Kỹ năng giao tiếp",
      summary: `## Tổng kết B1

### Thì Hiện Tại Hoàn Thành
- Cấu trúc: **have/has + V3**
- Từ đi kèm: ever, never, just, already, yet, for, since
- Phân biệt: **I have visited** Japan (kinh nghiệm) vs **I visited** Japan **last year** (thời điểm cụ thể)

### Từ vựng du lịch
destination, accommodation, itinerary, currency, departure, landmark, souvenir, jet lag

### Bày tỏ ý kiến
- In my opinion... / I think/believe that...
- I agree / I'm not sure about that
- That's a good point, but... / On the other hand...`,
      words: [
        { word: "experienced", phonetic: "/ɪkˈspɪəriənst/", meaning: "có kinh nghiệm", example: "She is an experienced teacher." },
        { word: "opportunity", phonetic: "/ˌɒpəˈtjuːnɪti/", meaning: "cơ hội", example: "This is a great opportunity for you." },
        { word: "challenge", phonetic: "/ˈtʃælɪndʒ/", meaning: "thách thức", example: "Learning a new language is a challenge, but worth it." },
        { word: "perspective", phonetic: "/pəˈspɛktɪv/", meaning: "quan điểm / góc nhìn", example: "Travel gives you a new perspective on life." },
        { word: "achieve", phonetic: "/əˈtʃiːv/", meaning: "đạt được", example: "With hard work, you can achieve your goals." },
      ],
      quiz: [
        { q: "Chọn câu đúng với Present Perfect:", options: ["I have went there.", "I have go there.", "I have been there.", "I have being there."], answer: 2 },
        { q: "'Have you ever tried Thai food?' — Trả lời đúng:", options: ["Yes, I have.", "Yes, I did.", "Yes, I do.", "Yes, I had."], answer: 0 },
        { q: "'Accommodation' nghĩa là:", options: ["Điểm đến", "Chỗ ở", "Lịch trình", "Tiền tệ"], answer: 1 },
        { q: "Cách bày tỏ không đồng ý lịch sự:", options: ["You're completely wrong!", "I'm not sure about that.", "That's stupid.", "No way!"], answer: 1 },
        { q: "'I have worked here ___ 2020.' — Điền đúng:", options: ["for", "since", "ago", "before"], answer: 1 },
      ],
    },
  },
];

// ─── ENGLISH B2 ───────────────────────────────────────────────────────────────

const english_b2: Lesson[] = [
  {
    id: "vocabulary_english_B2",
    language: "english", type: "vocabulary", level: "B2",
    title: "Từ vựng B2 — Kinh doanh & Nghề nghiệp",
    description: "Từ vựng nâng cao về môi trường công sở và kinh doanh",
    xpReward: 15,
    content: {
      title: "Từ vựng B2 — Kinh doanh & Nghề nghiệp",
      words: [
        { word: "negotiate", phonetic: "/nɪˈɡoʊʃieɪt/", meaning: "đàm phán", example: "We need to negotiate the contract terms carefully." },
        { word: "collaborate", phonetic: "/kəˈlæbəreɪt/", meaning: "hợp tác", example: "The two companies collaborated on the new project." },
        { word: "implement", phonetic: "/ˈɪmplɪmɛnt/", meaning: "triển khai / thực hiện", example: "We will implement the new strategy next quarter." },
        { word: "revenue", phonetic: "/ˈrɛvənjuː/", meaning: "doanh thu", example: "The company's revenue increased by 20% this year." },
        { word: "innovative", phonetic: "/ˈɪnəveɪtɪv/", meaning: "sáng tạo / đổi mới", example: "They are known for their innovative approach to design." },
        { word: "sustainable", phonetic: "/səˈsteɪnəbəl/", meaning: "bền vững", example: "We need more sustainable business practices." },
        { word: "stakeholder", phonetic: "/ˈsteɪkhoʊldər/", meaning: "bên liên quan", example: "All stakeholders must agree on the decision." },
        { word: "outsource", phonetic: "/ˈaʊtsɔːrs/", meaning: "thuê ngoài", example: "Many companies outsource their IT services." },
      ],
      quiz: [
        { q: "'Negotiate' nghĩa là:", options: ["Ký hợp đồng", "Đàm phán", "Hủy bỏ", "Báo cáo"], answer: 1 },
        { q: "'Sustainable business' nghĩa là:", options: ["Kinh doanh lớn", "Kinh doanh quốc tế", "Kinh doanh bền vững", "Kinh doanh nhanh"], answer: 2 },
        { q: "Công ty 'outsource IT services' tức là:", options: ["Tự làm IT", "Thuê công ty khác làm IT", "Đóng cửa bộ phận IT", "Mua phần mềm IT"], answer: 1 },
      ],
    },
  },
  {
    id: "grammar_english_B2",
    language: "english", type: "grammar", level: "B2",
    title: "Ngữ pháp B2 — Câu Điều Kiện (Conditionals)",
    description: "Nắm vững câu điều kiện loại 2 và loại 3 trong tiếng Anh",
    xpReward: 15,
    content: {
      title: "Ngữ pháp B2 — Câu Điều Kiện (Conditionals)",
      explanation: `## Câu Điều Kiện Loại 2 & 3

### Loại 2 — Giả định không có thật ở hiện tại
**If + S + V2 (quá khứ đơn), S + would + V nguyên mẫu**

Dùng khi điều kiện **không có thật hoặc không thể xảy ra** ở hiện tại/tương lai.

- If I **had** more time, I **would travel** the world. *(Nếu tôi có nhiều thời gian hơn — nhưng tôi không có — tôi sẽ đi du lịch.)*
- If she **spoke** English fluently, she **would get** that job.
- ⚠️ Dùng **were** cho mọi chủ ngữ: If I **were** you, I would apologize.

### Loại 3 — Giả định không có thật trong quá khứ
**If + S + had + V3, S + would have + V3**

Dùng để nói về điều **đã không xảy ra** trong quá khứ — "hối tiếc" hoặc "giả sử ngược lại".

- If I **had studied** harder, I **would have passed** the exam. *(Nếu tôi học chăm hơn — nhưng tôi đã không học — thì tôi đã đỗ rồi.)*
- If she **hadn't missed** the bus, she **would have arrived** on time.

### So sánh
| Loại | Điều kiện | Kết quả |
|------|-----------|---------|
| 2 | If + V2 | would + V |
| 3 | If + had + V3 | would have + V3 |`,
      quiz: [
        { q: "Điền đúng (loại 2): 'If I ___ rich, I would buy a big house.'", options: ["am", "was/were", "have been", "will be"], answer: 1 },
        { q: "Câu điều kiện loại 3 nói về:", options: ["Tương lai có thể xảy ra", "Hiện tại không có thật", "Quá khứ không có thật", "Sự thật hiển nhiên"], answer: 2 },
        { q: "Điền đúng (loại 3): 'If she had known, she ___ told you.'", options: ["would tell", "will have told", "would have told", "had told"], answer: 2 },
        { q: "'If I were you, I would apologize.' — Đây là loại mấy?", options: ["Loại 1", "Loại 2", "Loại 3", "Loại 0"], answer: 1 },
      ],
    },
  },
  {
    id: "reading_english_B2",
    language: "english", type: "reading", level: "B2",
    title: "Đọc hiểu B2 — The Future of Remote Work",
    description: "Phân tích bài viết về xu hướng làm việc từ xa trong thời đại mới",
    xpReward: 15,
    content: {
      title: "Đọc hiểu B2 — The Future of Remote Work",
      passage: `The COVID-19 pandemic fundamentally transformed the way millions of people work, accelerating a shift toward remote work that might otherwise have taken decades. Now, as businesses settle into a post-pandemic reality, a fierce debate has emerged: Is remote work a permanent revolution or merely a temporary adaptation?

Proponents of remote work argue that it offers substantial benefits for both employees and employers. Workers report higher job satisfaction, better work-life balance, and reduced commuting stress. Companies, meanwhile, can tap into a global talent pool unrestricted by geography, and often reduce overhead costs significantly.

However, critics contend that remote work erodes company culture, hampers spontaneous collaboration, and creates isolation among employees. Junior employees, in particular, may miss out on the informal mentorship and networking opportunities that naturally occur in physical office spaces.

The data presents a nuanced picture. Studies show that individual tasks requiring deep concentration are often performed more efficiently at home, while complex projects requiring team coordination tend to benefit from in-person interaction.

Many organizations have responded by adopting hybrid models — allowing employees to split their time between home and office. This approach attempts to capture the benefits of both arrangements while mitigating their respective drawbacks.

The future of work is unlikely to be a simple binary choice. Instead, it will probably be defined by flexibility, trust, and the ability of organizations to adapt their practices to the evolving needs of their workforce.`,
      quiz: [
        { q: "Bài viết cho rằng làm việc từ xa bắt đầu tăng nhanh khi nào?", options: ["Sau khủng hoảng tài chính 2008", "Trong đại dịch COVID-19", "Khi internet ra đời", "Sau năm 2010"], answer: 1 },
        { q: "Hạn chế nào của remote work được đề cập?", options: ["Tốn kém hơn", "Khó kiếm khách hàng", "Làm giảm văn hóa công ty", "Năng suất thấp hơn"], answer: 2 },
        { q: "Theo nghiên cứu, loại công việc nào làm tốt hơn ở nhà?", options: ["Dự án nhóm phức tạp", "Công việc đòi hỏi tập trung cao", "Họp với khách hàng", "Đào tạo nhân viên mới"], answer: 1 },
        { q: "'Hybrid model' trong bài nghĩa là:", options: ["Làm việc hoàn toàn online", "Làm việc hoàn toàn tại văn phòng", "Kết hợp làm ở nhà và văn phòng", "Làm việc ở nước ngoài"], answer: 2 },
      ],
    },
  },
  {
    id: "listening_english_B2",
    language: "english", type: "listening", level: "B2",
    title: "Luyện nghe B2 — Podcast về trí tuệ nhân tạo",
    description: "Nghe đoạn podcast thảo luận về tác động của AI đối với thị trường lao động",
    xpReward: 15,
    content: {
      title: "Luyện nghe B2 — Podcast về trí tuệ nhân tạo",
      context: "Đoạn trích từ podcast công nghệ, nơi hai chuyên gia thảo luận về tác động của trí tuệ nhân tạo (AI) đến thị trường việc làm.",
      transcript: `Host: Welcome back to TechTalks. Today we're discussing how artificial intelligence is reshaping the job market. I'm joined by Dr. Chen, an economist specializing in technology and labor. Dr. Chen, should workers be worried about AI taking their jobs?

Dr. Chen: That's the million-dollar question, isn't it? The short answer is: it's complicated. History shows us that technological revolutions always displace some jobs while creating new ones. The Industrial Revolution eliminated many manual roles, but ultimately created far more employment than it destroyed.

Host: But isn't AI different because it can also do cognitive tasks?

Dr. Chen: Absolutely, and that's what makes this revolution unprecedented. AI can now perform tasks that previously required human intelligence — writing, analyzing data, even diagnosing diseases. The jobs most at risk are those involving repetitive, rule-based cognitive tasks.

Host: What skills should people develop to remain competitive?

Dr. Chen: Critical thinking, creativity, emotional intelligence, and adaptability. These are the distinctly human capabilities that AI currently cannot replicate. Also, understanding how to work alongside AI tools — rather than competing against them — will be crucial.

Host: Any advice for people who are already in the workforce?

Dr. Chen: Continuous learning is non-negotiable. The half-life of professional skills is shrinking. People who thrive will be those who embrace lifelong learning and aren't afraid to reinvent themselves professionally.`,
      quiz: [
        { q: "Dr. Chen là chuyên gia về lĩnh vực gì?", options: ["Kỹ thuật AI", "Kinh tế và công nghệ lao động", "Lập trình máy tính", "Giáo dục"], answer: 1 },
        { q: "Theo Dr. Chen, những công việc nào có nguy cơ bị AI thay thế nhất?", options: ["Công việc sáng tạo", "Công việc lặp đi lặp lại, theo quy tắc", "Công việc y tế", "Công việc quản lý"], answer: 1 },
        { q: "Kỹ năng nào Dr. Chen KHÔNG đề cập?", options: ["Tư duy phản biện", "Trí tuệ cảm xúc", "Lập trình Python", "Khả năng thích nghi"], answer: 2 },
        { q: "Thông điệp chính của Dr. Chen là:", options: ["AI sẽ xóa bỏ mọi việc làm", "Không cần lo lắng về AI", "Học tập liên tục là thiết yếu", "Chỉ học kỹ thuật mới đủ"], answer: 2 },
      ],
    },
  },
  {
    id: "writing_english_B2",
    language: "english", type: "writing", level: "B2",
    title: "Luyện viết B2 — Bài luận tranh luận",
    description: "Viết bài luận tranh luận về một vấn đề xã hội với lập luận rõ ràng",
    xpReward: 15,
    content: {
      title: "Luyện viết B2 — Bài luận tranh luận",
      prompt: "Viết bài luận tranh luận (150-200 từ) về chủ đề: 'Học online có hiệu quả hơn học trực tiếp không?' Bày tỏ quan điểm rõ ràng và đưa ra ít nhất 2 lý do.",
      tips: [
        "Mở bài: Giới thiệu chủ đề + nêu rõ quan điểm của bạn",
        "Thân bài: 2-3 lý do hỗ trợ quan điểm, mỗi lý do một đoạn, có ví dụ cụ thể",
        "Phản biện: Thừa nhận quan điểm đối lập nhưng bác bỏ có lý",
        "Kết bài: Tóm tắt lập luận + kêu gọi hành động hoặc kết luận mạnh",
        "Dùng linking words: Furthermore, However, On the other hand, In conclusion...",
      ],
      example: `Online learning has transformed education, but does it surpass traditional classroom learning? In my view, online learning offers significant advantages when used effectively, though it cannot entirely replace face-to-face education.

Firstly, online learning provides unparalleled flexibility. Students can access lectures at any time, allowing them to balance education with work or family responsibilities. This accessibility has democratized education, enabling people in remote areas to study at prestigious institutions.

Furthermore, technology allows for personalized learning experiences. Adaptive platforms can adjust content to individual learning speeds, which is impossible in a classroom of thirty students.

However, critics rightly point out that online learning lacks the social dimension essential for developing communication skills and building professional networks. Additionally, some students struggle with self-discipline without the structure of a physical classroom.

In conclusion, while online learning offers remarkable advantages in flexibility and accessibility, a hybrid approach combining both methods likely delivers the best educational outcomes.`,
      quiz: [
        { q: "Từ nào dùng để thêm ý tương tự?", options: ["However", "Furthermore", "Although", "Despite"], answer: 1 },
        { q: "Phần 'phản biện' trong bài luận dùng để:", options: ["Kết luận bài", "Thừa nhận quan điểm đối lập rồi bác bỏ", "Giới thiệu chủ đề", "Nêu ví dụ"], answer: 1 },
        { q: "'In my view' được dùng để:", options: ["Đưa ra sự kiện", "Bày tỏ quan điểm cá nhân", "Kết luận", "Phản biện"], answer: 1 },
      ],
    },
  },
  {
    id: "speaking_english_B2",
    language: "english", type: "speaking", level: "B2",
    title: "Luyện nói B2 — Thảo luận chủ đề phức tạp",
    description: "Thực hành thảo luận và lập luận về các vấn đề xã hội",
    xpReward: 15,
    content: {
      title: "Luyện nói B2 — Thảo luận chủ đề phức tạp",
      topic: "Môi trường và trách nhiệm của cá nhân vs doanh nghiệp",
      phrases: [
        { phrase: "It could be argued that...", phonetic: "/ɪt kʊd biː ˈɑːɡjuːd ðæt/", meaning: "Có thể lập luận rằng..." },
        { phrase: "The evidence suggests that...", phonetic: "/ðə ˈɛvɪdəns səˈdʒɛsts ðæt/", meaning: "Bằng chứng cho thấy rằng..." },
        { phrase: "While I understand your point...", phonetic: "/waɪl aɪ ˌʌndəˈstænd jɔː pɔɪnt/", meaning: "Dù tôi hiểu quan điểm của bạn..." },
        { phrase: "To what extent do you think...?", phonetic: "/tə wɒt ɪkˈstɛnt duː juː θɪŋk/", meaning: "Bạn nghĩ đến mức độ nào...?" },
        { phrase: "The root cause of this issue is...", phonetic: "/ðə ruːt kɔːz əv ðɪs ˈɪʃuː ɪz/", meaning: "Nguyên nhân gốc rễ của vấn đề này là..." },
        { phrase: "I'd like to nuance that statement.", phonetic: "/aɪd laɪk tə ˈnjuːɑːns ðæt ˈsteɪtmənt/", meaning: "Tôi muốn làm rõ hơn nhận xét đó." },
      ],
      dialogue: [
        { speaker: "A", text: "To what extent do you think individuals are responsible for climate change?", translation: "Bạn nghĩ cá nhân có trách nhiệm đến mức nào đối với biến đổi khí hậu?" },
        { speaker: "B", text: "It could be argued that corporations bear the greater responsibility. The evidence suggests that just 100 companies are responsible for 71% of global emissions.", translation: "Có thể lập luận rằng các tập đoàn chịu trách nhiệm lớn hơn. Bằng chứng cho thấy 100 công ty chịu trách nhiệm cho 71% lượng khí thải toàn cầu." },
        { speaker: "A", text: "While I understand your point, I'd like to nuance that statement. Consumer demand drives corporate behavior — if we changed our habits, companies would follow.", translation: "Dù tôi hiểu quan điểm của bạn, tôi muốn làm rõ hơn. Nhu cầu tiêu dùng thúc đẩy hành vi doanh nghiệp — nếu chúng ta thay đổi thói quen, công ty sẽ thay đổi theo." },
        { speaker: "B", text: "The root cause of this issue is systemic. Without regulatory frameworks, individual action alone cannot create the scale of change needed.", translation: "Nguyên nhân gốc rễ của vấn đề này mang tính hệ thống. Không có khung pháp lý, hành động cá nhân không thể tạo ra sự thay đổi ở quy mô cần thiết." },
      ],
      quiz: [
        { q: "'The evidence suggests that...' dùng để:", options: ["Đưa ra ý kiến cá nhân", "Trích dẫn dữ liệu/bằng chứng", "Đồng ý hoàn toàn", "Kết thúc cuộc trò chuyện"], answer: 1 },
        { q: "'To what extent' dùng để hỏi về:", options: ["Thời gian", "Địa điểm", "Mức độ", "Nguyên nhân"], answer: 2 },
        { q: "'I'd like to nuance that statement' nghĩa là:", options: ["Tôi đồng ý hoàn toàn", "Tôi muốn bổ sung/làm rõ thêm", "Tôi không hiểu", "Tôi phản đối"], answer: 1 },
      ],
    },
  },
  {
    id: "review_english_B2",
    language: "english", type: "review", level: "B2",
    title: "Ôn tập B2 — Câu điều kiện & Từ vựng nâng cao",
    description: "Ôn tập câu điều kiện loại 2-3, từ vựng kinh doanh và kỹ năng lập luận",
    xpReward: 20,
    content: {
      title: "Ôn tập B2 — Câu điều kiện & Từ vựng nâng cao",
      summary: `## Tổng kết B2

### Câu điều kiện
- **Loại 2:** If + V2, would + V → giả định hiện tại không có thật
- **Loại 3:** If + had + V3, would have + V3 → giả định quá khứ không có thật
- **Lưu ý:** "If I were you..." (không dùng "was" trong văn viết trang trọng)

### Từ vựng kinh doanh
negotiate, collaborate, implement, revenue, innovative, sustainable, stakeholder, outsource

### Lập luận nâng cao
- It could be argued that... / The evidence suggests...
- While I understand your point... / I'd like to nuance that...
- To what extent...? / The root cause of this issue is...`,
      words: [
        { word: "unprecedented", phonetic: "/ʌnˈprɛsɪdɛntɪd/", meaning: "chưa từng có tiền lệ", example: "The pandemic caused unprecedented changes." },
        { word: "implications", phonetic: "/ˌɪmplɪˈkeɪʃənz/", meaning: "hệ quả / ý nghĩa", example: "We need to consider the implications of this decision." },
        { word: "fundamentally", phonetic: "/ˌfʌndəˈmɛntəli/", meaning: "về cơ bản / căn bản", example: "This technology has fundamentally changed communication." },
        { word: "mitigate", phonetic: "/ˈmɪtɪɡeɪt/", meaning: "giảm thiểu", example: "We must mitigate the risks before proceeding." },
        { word: "nuanced", phonetic: "/ˈnjuːɑːnst/", meaning: "tinh tế / nhiều sắc thái", example: "The situation requires a nuanced approach." },
      ],
      quiz: [
        { q: "Điền đúng (loại 3): 'If they ___ harder, they would have succeeded.'", options: ["tried", "had tried", "have tried", "try"], answer: 1 },
        { q: "'Sustainable' nghĩa là:", options: ["Nhanh chóng", "Đắt tiền", "Bền vững", "Sáng tạo"], answer: 2 },
        { q: "Chọn câu điều kiện loại 2 đúng:", options: ["If I will have time, I travel.", "If I had time, I would travel.", "If I have time, I will travel.", "If I had time, I travel."], answer: 1 },
        { q: "'Unprecedented' nghĩa là:", options: ["Đã được dự đoán", "Chưa từng có tiền lệ", "Rất phổ biến", "Được lên kế hoạch"], answer: 1 },
        { q: "'The evidence suggests that...' dùng để:", options: ["Nêu ý kiến cá nhân", "Trích dẫn bằng chứng khách quan", "Phủ nhận ý kiến đối phương", "Kết luận"], answer: 1 },
      ],
    },
  },
];

// ─── THAI A1 ──────────────────────────────────────────────────────────────────

const thai_a1: Lesson[] = [
  {
    id: "vocabulary_thai_A1",
    language: "thai", type: "vocabulary", level: "A1",
    title: "Từ vựng Thái A1 — Chào hỏi cơ bản",
    description: "Học các từ chào hỏi và từ thiết yếu nhất trong tiếng Thái",
    xpReward: 10,
    content: {
      title: "Từ vựng Thái A1 — Chào hỏi cơ bản",
      words: [
        { word: "สวัสดี (Sawadee)", phonetic: "/sa-wat-dee/", meaning: "Xin chào", example: "สวัสดีครับ — Xin chào (nam nói)" },
        { word: "ขอบคุณ (Khob khun)", phonetic: "/khòp-khun/", meaning: "Cảm ơn", example: "ขอบคุณครับ — Cảm ơn rất nhiều" },
        { word: "ใช่ (Chai)", phonetic: "/châi/", meaning: "Đúng / Có", example: "ใช่ครับ — Đúng vậy" },
        { word: "ไม่ (Mai)", phonetic: "/mâi/", meaning: "Không", example: "ไม่ใช่ — Không phải" },
        { word: "ขอโทษ (Kho thot)", phonetic: "/khǒr-thôht/", meaning: "Xin lỗi", example: "ขอโทษครับ — Xin lỗi" },
        { word: "ชื่อ (Chue)", phonetic: "/chʉ̂ʉ/", meaning: "Tên", example: "ชื่ออะไร? — Tên gì?" },
        { word: "ดี (Dee)", phonetic: "/dii/", meaning: "Tốt / Ổn", example: "ฉันสบายดี — Tôi khỏe" },
        { word: "ครับ/ค่ะ (Krap/Ka)", phonetic: "/khráp/ /khâ/", meaning: "Từ lịch sự (nam/nữ)", example: "ขอบคุณครับ / ขอบคุณค่ะ" },
      ],
      quiz: [
        { q: "'สวัสดี' nghĩa là gì?", options: ["Cảm ơn", "Xin lỗi", "Xin chào", "Tạm biệt"], answer: 2 },
        { q: "'ขอบคุณ' phát âm là:", options: ["Sawadee", "Khob khun", "Kho thot", "Chai"], answer: 1 },
        { q: "Từ nào có nghĩa là 'Không'?", options: ["ใช่", "ดี", "ไม่", "ครับ"], answer: 2 },
      ],
    },
  },
  {
    id: "grammar_thai_A1",
    language: "thai", type: "grammar", level: "A1",
    title: "Ngữ pháp Thái A1 — Cấu trúc câu cơ bản",
    description: "Hiểu cấu trúc câu tiếng Thái: chủ ngữ + động từ + tân ngữ",
    xpReward: 10,
    content: {
      title: "Ngữ pháp Thái A1 — Cấu trúc câu cơ bản",
      explanation: `## Cấu trúc câu tiếng Thái

Tiếng Thái có cấu trúc câu **Chủ ngữ + Động từ + Tân ngữ (SVO)** — tương tự tiếng Việt và tiếng Anh.

### Đặc điểm quan trọng

**1. Không chia động từ theo thời**
Tiếng Thái không thay đổi động từ theo thì. Thời gian được xác định bằng từ chỉ thời gian.
- ฉันกิน (Chan kin) = Tôi ăn / Tôi đã ăn / Tôi sẽ ăn

**2. Từ lịch sự cuối câu**
- Nam nói thêm **ครับ (krap)** — ขอบคุณ**ครับ**
- Nữ nói thêm **ค่ะ (ka)** — ขอบคุณ**ค่ะ**

**3. Đại từ nhân xưng**
- Tôi (thân mật): ฉัน (chan) — nữ | ผม (phom) — nam
- Bạn: คุณ (khun)
- Anh/Chị ấy: เขา (khao)

### Ví dụ câu đơn giản
- ฉันชื่อหลาน = **Chan chue Lan** = Tôi tên là Lan
- คุณมาจากไหน = **Khun ma jak nai** = Bạn đến từ đâu?
- ฉันมาจากเวียดนาม = **Chan ma jak Vietnam** = Tôi đến từ Việt Nam`,
      quiz: [
        { q: "Cấu trúc câu tiếng Thái là:", options: ["Động từ + Chủ ngữ + Tân ngữ", "Chủ ngữ + Động từ + Tân ngữ", "Tân ngữ + Chủ ngữ + Động từ", "Không có cấu trúc cố định"], answer: 1 },
        { q: "Nam người Thái thêm từ gì cuối câu để lịch sự?", options: ["ค่ะ (ka)", "ครับ (krap)", "ใช่ (chai)", "ดี (dee)"], answer: 1 },
        { q: "'ผม (Phom)' là đại từ của:", options: ["Nữ giới", "Nam giới", "Trẻ em", "Người lớn tuổi"], answer: 1 },
        { q: "Tiếng Thái xử lý thì (thời gian) như thế nào?", options: ["Chia động từ như tiếng Anh", "Dùng từ chỉ thời gian, không chia động từ", "Thêm hậu tố vào động từ", "Đổi trật tự câu"], answer: 1 },
      ],
    },
  },
  {
    id: "reading_thai_A1",
    language: "thai", type: "reading", level: "A1",
    title: "Đọc hiểu Thái A1 — Giới thiệu bản thân",
    description: "Đọc đoạn văn tiếng Thái đơn giản kèm phiên âm",
    xpReward: 10,
    content: {
      title: "Đọc hiểu Thái A1 — Giới thiệu bản thân",
      passage: `สวัสดีครับ ผมชื่อมิงห์
(Sawadee krap. Phom chue Minh.)
Xin chào. Tôi tên là Minh.

ผมมาจากเวียดนาม
(Phom ma jak Vietnam.)
Tôi đến từ Việt Nam.

ผมอายุยี่สิบสองปี
(Phom aa-yu yii-sip-song pii.)
Tôi hai mươi hai tuổi.

ผมเป็นนักศึกษา
(Phom pen nak-suek-sa.)
Tôi là sinh viên.

ผมชอบเรียนภาษาไทย
(Phom chop rian pha-sa Thai.)
Tôi thích học tiếng Thái.

ยินดีที่ได้รู้จัก
(Yin-dee thi dai roo-jak.)
Rất vui được gặp bạn.`,
      quiz: [
        { q: "'ผมชื่อมิงห์' nghĩa là:", options: ["Tôi từ Việt Nam", "Tôi tên là Minh", "Tôi là sinh viên", "Tôi 22 tuổi"], answer: 1 },
        { q: "'นักศึกษา (Nak-suek-sa)' nghĩa là:", options: ["Giáo viên", "Sinh viên", "Kỹ sư", "Bác sĩ"], answer: 1 },
        { q: "'ยินดีที่ได้รู้จัก' tương đương với câu nào trong tiếng Anh?", options: ["Goodbye!", "Thank you!", "Nice to meet you!", "How are you?"], answer: 2 },
        { q: "Minh thích làm gì theo đoạn văn?", options: ["Học tiếng Anh", "Du lịch", "Học tiếng Thái", "Nấu ăn"], answer: 2 },
      ],
    },
  },
  {
    id: "listening_thai_A1",
    language: "thai", type: "listening", level: "A1",
    title: "Luyện nghe Thái A1 — Hội thoại gặp gỡ lần đầu",
    description: "Nghe hội thoại tiếng Thái khi gặp người mới",
    xpReward: 10,
    content: {
      title: "Luyện nghe Thái A1 — Hội thoại gặp gỡ lần đầu",
      context: "Hai người gặp nhau tại một lớp học tiếng Thái ở Hà Nội. Đọc hội thoại kèm phiên âm và dịch nghĩa.",
      transcript: `Nong: สวัสดีค่ะ ฉันชื่อหนึ่งค่ะ
(Sawadee ka. Chan chue Nueng ka.)
Xin chào. Tôi tên là Nưng.

Minh: สวัสดีครับ ผมชื่อมิงห์ครับ ยินดีที่ได้รู้จักครับ
(Sawadee krap. Phom chue Minh krap. Yin-dee thi dai roo-jak krap.)
Xin chào. Tôi tên là Minh. Rất vui được gặp bạn.

Nong: ยินดีที่ได้รู้จักเหมือนกันค่ะ คุณมาจากไหนคะ
(Yin-dee thi dai roo-jak muan-kan ka. Khun ma jak nai ka?)
Tôi cũng rất vui. Bạn đến từ đâu?

Minh: ผมมาจากเวียดนามครับ แล้วคุณล่ะครับ
(Phom ma jak Vietnam krap. Laew khun la krap?)
Tôi đến từ Việt Nam. Còn bạn?

Nong: ฉันมาจากไทยค่ะ ฉันอยู่ที่กรุงเทพฯ
(Chan ma jak Thai ka. Chan yuu thi Krung Thep.)
Tôi đến từ Thái Lan. Tôi sống ở Bangkok.`,
      quiz: [
        { q: "'คุณมาจากไหน?' nghĩa là:", options: ["Tên bạn là gì?", "Bạn bao nhiêu tuổi?", "Bạn đến từ đâu?", "Bạn có khỏe không?"], answer: 2 },
        { q: "Nưng đến từ đâu?", options: ["Việt Nam", "Thái Lan", "Nhật Bản", "Hàn Quốc"], answer: 1 },
        { q: "'ยินดีที่ได้รู้จักเหมือนกัน' nghĩa là:", options: ["Tôi cũng rất vui được gặp bạn", "Tôi không hiểu", "Hẹn gặp lại", "Cảm ơn bạn"], answer: 0 },
        { q: "Minh sống ở đâu theo hội thoại?", options: ["Bangkok", "Hà Nội (đến từ Việt Nam)", "Chiang Mai", "Hồ Chí Minh"], answer: 1 },
      ],
    },
  },
  {
    id: "writing_thai_A1",
    language: "thai", type: "writing", level: "A1",
    title: "Luyện viết Thái A1 — Tự giới thiệu đơn giản",
    description: "Viết câu giới thiệu bản thân bằng tiếng Thái với phiên âm",
    xpReward: 10,
    content: {
      title: "Luyện viết Thái A1 — Tự giới thiệu đơn giản",
      prompt: "Viết 4-5 câu giới thiệu bản thân bằng tiếng Thái (kèm phiên âm). Bao gồm: tên, quê quán, tuổi, nghề nghiệp.",
      tips: [
        "Bắt đầu bằng: สวัสดีครับ/ค่ะ (Sawadee krap/ka)",
        "Tên: ผม/ฉันชื่อ... (Phom/Chan chue...)",
        "Quê quán: ผม/ฉันมาจาก... (Phom/Chan ma jak...)",
        "Tuổi: ผม/ฉันอายุ... ปี (Phom/Chan aa-yu... pii)",
        "Nghề nghiệp: ผม/ฉันเป็น... (Phom/Chan pen...)",
        "Kết thúc: ยินดีที่ได้รู้จัก (Yin-dee thi dai roo-jak)",
      ],
      example: `สวัสดีครับ (Sawadee krap) — Xin chào.
ผมชื่อมิงห์ (Phom chue Minh) — Tôi tên là Minh.
ผมมาจากฮานอย (Phom ma jak Hanoi) — Tôi đến từ Hà Nội.
ผมอายุยี่สิบสองปี (Phom aa-yu yii-sip-song pii) — Tôi 22 tuổi.
ผมเป็นนักศึกษา (Phom pen nak-suek-sa) — Tôi là sinh viên.
ยินดีที่ได้รู้จักครับ (Yin-dee thi dai roo-jak krap) — Rất vui được gặp bạn.`,
      quiz: [
        { q: "Cách nói 'Tôi tên là...' trong tiếng Thái:", options: ["ผมมาจาก...", "ผมชื่อ...", "ผมเป็น...", "ผมอายุ..."], answer: 1 },
        { q: "'ผมมาจากเวียดนาม' nghĩa là:", options: ["Tôi là người Việt Nam", "Tôi đến từ Việt Nam", "Tôi thích Việt Nam", "Tôi sống ở Việt Nam"], answer: 1 },
        { q: "Nữ giới dùng đại từ nào để nói 'Tôi'?", options: ["ผม (Phom)", "เขา (Khao)", "ฉัน (Chan)", "คุณ (Khun)"], answer: 2 },
      ],
    },
  },
  {
    id: "speaking_thai_A1",
    language: "thai", type: "speaking", level: "A1",
    title: "Luyện nói Thái A1 — Chào hỏi và xã giao",
    description: "Thực hành các mẫu câu chào hỏi cơ bản trong tiếng Thái",
    xpReward: 10,
    content: {
      title: "Luyện nói Thái A1 — Chào hỏi và xã giao",
      topic: "Chào hỏi và hỏi thăm sức khỏe",
      phrases: [
        { phrase: "สวัสดีครับ/ค่ะ", phonetic: "Sawadee krap/ka", meaning: "Xin chào (lịch sự)" },
        { phrase: "คุณสบายดีไหม?", phonetic: "Khun sa-bai-dee mai?", meaning: "Bạn có khỏe không?" },
        { phrase: "สบายดีครับ/ค่ะ ขอบคุณ", phonetic: "Sa-bai-dee krap/ka. Khob-khun.", meaning: "Khỏe, cảm ơn." },
        { phrase: "แล้วคุณล่ะ?", phonetic: "Laew khun la?", meaning: "Còn bạn thì sao?" },
        { phrase: "ลาก่อนครับ/ค่ะ", phonetic: "La-gon krap/ka", meaning: "Tạm biệt" },
        { phrase: "แล้วเจอกันนะ", phonetic: "Laew jer-gan na", meaning: "Hẹn gặp lại" },
      ],
      dialogue: [
        { speaker: "A", text: "สวัสดีครับ คุณสบายดีไหมครับ?", translation: "Xin chào! Bạn có khỏe không?" },
        { speaker: "B", text: "สบายดีค่ะ ขอบคุณค่ะ แล้วคุณล่ะคะ?", translation: "Khỏe, cảm ơn. Còn bạn thì sao?" },
        { speaker: "A", text: "ผมสบายดีครับ ขอบคุณครับ", translation: "Tôi cũng khỏe. Cảm ơn." },
        { speaker: "B", text: "วันนี้คุณไปไหนครับ?", translation: "Hôm nay bạn đi đâu vậy?" },
        { speaker: "A", text: "ผมไปเรียนภาษาไทยครับ ลาก่อนนะครับ", translation: "Tôi đi học tiếng Thái. Tạm biệt nhé!" },
        { speaker: "B", text: "แล้วเจอกันนะคะ!", translation: "Hẹn gặp lại!" },
      ],
      quiz: [
        { q: "'คุณสบายดีไหม?' nghĩa là:", options: ["Tên bạn là gì?", "Bạn đến từ đâu?", "Bạn có khỏe không?", "Bạn bao nhiêu tuổi?"], answer: 2 },
        { q: "'ลาก่อน' nghĩa là:", options: ["Xin chào", "Cảm ơn", "Tạm biệt", "Xin lỗi"], answer: 2 },
        { q: "Khi hỏi lại 'Còn bạn?' trong tiếng Thái:", options: ["สวัสดี", "แล้วคุณล่ะ?", "ขอบคุณ", "ใช่ไหม?"], answer: 1 },
      ],
    },
  },
  {
    id: "review_thai_A1",
    language: "thai", type: "review", level: "A1",
    title: "Ôn tập Thái A1 — Chào hỏi & Câu cơ bản",
    description: "Ôn tập toàn bộ từ vựng và câu chào hỏi tiếng Thái A1",
    xpReward: 15,
    content: {
      title: "Ôn tập Thái A1 — Chào hỏi & Câu cơ bản",
      summary: `## Tổng kết Thái A1

### Từ chào hỏi thiết yếu
- สวัสดี (Sawadee) = Xin chào
- ขอบคุณ (Khob khun) = Cảm ơn
- ขอโทษ (Kho thot) = Xin lỗi
- ลาก่อน (La-gon) = Tạm biệt

### Đại từ nhân xưng
- ผม (Phom) = Tôi (nam)
- ฉัน (Chan) = Tôi (nữ)
- คุณ (Khun) = Bạn/Anh/Chị

### Cấu trúc giới thiệu
- ผม/ฉันชื่อ... = Tôi tên là...
- ผม/ฉันมาจาก... = Tôi đến từ...
- ผม/ฉันเป็น... = Tôi là...

### Từ lịch sự
- ครับ (krap) — nam dùng
- ค่ะ (ka) — nữ dùng`,
      words: [
        { word: "ภาษาไทย (Pha-sa Thai)", phonetic: "/paa-sǎa-tai/", meaning: "Tiếng Thái", example: "ฉันเรียนภาษาไทย — Tôi học tiếng Thái." },
        { word: "ประเทศไทย (Pra-tet Thai)", phonetic: "/prà-thêet-tai/", meaning: "Thái Lan", example: "เขามาจากประเทศไทย — Anh ấy đến từ Thái Lan." },
        { word: "กรุงเทพ (Krung Thep)", phonetic: "/kruŋ-thêep/", meaning: "Bangkok", example: "กรุงเทพเป็นเมืองหลวง — Bangkok là thủ đô." },
        { word: "นักศึกษา (Nak-suek-sa)", phonetic: "/nák-sʉ̀k-sǎa/", meaning: "Sinh viên", example: "ผมเป็นนักศึกษา — Tôi là sinh viên." },
        { word: "ยินดีที่ได้รู้จัก", phonetic: "/yin-dii-thîi-dâai-rúu-jàk/", meaning: "Rất vui được gặp bạn", example: "ยินดีที่ได้รู้จักครับ" },
      ],
      quiz: [
        { q: "'ขอบคุณ' nghĩa là:", options: ["Xin chào", "Xin lỗi", "Cảm ơn", "Tạm biệt"], answer: 2 },
        { q: "Nam người Thái dùng đại từ nào để nói 'Tôi'?", options: ["ฉัน (Chan)", "ผม (Phom)", "คุณ (Khun)", "เขา (Khao)"], answer: 1 },
        { q: "'ผมเป็นนักศึกษา' nghĩa là:", options: ["Tôi là giáo viên", "Tôi là sinh viên", "Tôi là bác sĩ", "Tôi là kỹ sư"], answer: 1 },
        { q: "Từ lịch sự nữ giới dùng cuối câu là:", options: ["ครับ (krap)", "ไหม (mai)", "ค่ะ (ka)", "นะ (na)"], answer: 2 },
        { q: "'ลาก่อน' và 'แล้วเจอกันนะ' đều có nghĩa liên quan đến:", options: ["Chào hỏi", "Tạm biệt", "Cảm ơn", "Xin lỗi"], answer: 1 },
      ],
    },
  },
];

// ─── THAI A2 ──────────────────────────────────────────────────────────────────

const thai_a2: Lesson[] = [
  {
    id: "vocabulary_thai_A2",
    language: "thai", type: "vocabulary", level: "A2",
    title: "Từ vựng Thái A2 — Ăn uống & Đặt món",
    description: "Từ vựng tiếng Thái về thức ăn, nhà hàng và gọi món",
    xpReward: 10,
    content: {
      title: "Từ vựng Thái A2 — Ăn uống & Đặt món",
      words: [
        { word: "อาหาร (A-han)", phonetic: "/ʔaa-hǎan/", meaning: "Thức ăn / Đồ ăn", example: "อาหารไทยอร่อยมาก — Đồ ăn Thái rất ngon." },
        { word: "อร่อย (A-roi)", phonetic: "/ʔà-ròi/", meaning: "Ngon", example: "ต้มยำอร่อยมาก — Tom Yum rất ngon." },
        { word: "เผ็ด (Phet)", phonetic: "/phèt/", meaning: "Cay", example: "ไม่เอาเผ็ด — Không cay nhé." },
        { word: "น้ำ (Nam)", phonetic: "/náam/", meaning: "Nước", example: "ขอน้ำหน่อยครับ — Cho tôi nước với." },
        { word: "ข้าว (Khao)", phonetic: "/khâao/", meaning: "Cơm / Gạo", example: "ขอข้าวผัดครับ — Cho tôi cơm rang." },
        { word: "ราคา (Ra-kha)", phonetic: "/raa-khaa/", meaning: "Giá tiền", example: "ราคาเท่าไหร่? — Giá bao nhiêu?" },
        { word: "เมนู (Menu)", phonetic: "/me-nuu/", meaning: "Thực đơn", example: "ขอเมนูหน่อยครับ — Cho tôi xem thực đơn." },
        { word: "เก็บเงิน (Kep ngern)", phonetic: "/kèp-ŋən/", meaning: "Tính tiền", example: "เก็บเงินด้วยครับ — Tính tiền giúp tôi." },
      ],
      quiz: [
        { q: "'อร่อย' nghĩa là:", options: ["Cay", "Ngon", "Đắt", "Rẻ"], answer: 1 },
        { q: "Khi muốn tính tiền, bạn nói:", options: ["ขอเมนู", "เก็บเงินด้วยครับ", "ขอน้ำ", "อร่อยมาก"], answer: 1 },
        { q: "'ไม่เอาเผ็ด' nghĩa là:", options: ["Thêm cay vào", "Không cay nhé", "Rất cay", "Tôi thích cay"], answer: 1 },
      ],
    },
  },
  {
    id: "grammar_thai_A2",
    language: "thai", type: "grammar", level: "A2",
    title: "Ngữ pháp Thái A2 — Câu hỏi với ไหม và อะไร",
    description: "Học cách đặt câu hỏi Yes/No và câu hỏi thông tin trong tiếng Thái",
    xpReward: 10,
    content: {
      title: "Ngữ pháp Thái A2 — Câu hỏi với ไหม và อะไร",
      explanation: `## Câu hỏi trong tiếng Thái

### 1. Câu hỏi Yes/No — dùng ไหม (mai) cuối câu
Thêm **ไหม** vào cuối câu khẳng định để tạo câu hỏi.

- คุณสบายดี**ไหม**? = Bạn có khỏe không?
- อาหารอร่อย**ไหม**? = Đồ ăn có ngon không?
- คุณชอบภาษาไทย**ไหม**? = Bạn có thích tiếng Thái không?

**Trả lời:**
- Có: ใช่ (chai) / สบายดี (sa-bai-dee)
- Không: ไม่ (mai) / ไม่ใช่ (mai chai)

### 2. Câu hỏi thông tin — từ để hỏi

| Từ hỏi | Phiên âm | Nghĩa |
|--------|----------|-------|
| อะไร | a-rai | Cái gì / Gì |
| ที่ไหน | thi-nai | Ở đâu |
| เมื่อไหร่ | muea-rai | Khi nào |
| ทำไม | tham-mai | Tại sao |
| เท่าไหร่ | thao-rai | Bao nhiêu |
| ใคร | khrai | Ai |

- นี่คือ**อะไร**? = Cái này là cái gì?
- ราคา**เท่าไหร่**? = Giá bao nhiêu?
- ห้องน้ำอยู่**ที่ไหน**? = Nhà vệ sinh ở đâu?`,
      quiz: [
        { q: "Để hỏi Yes/No trong tiếng Thái, thêm gì vào cuối câu?", options: ["อะไร (a-rai)", "ไหม (mai)", "ที่ไหน (thi-nai)", "ทำไม (tham-mai)"], answer: 1 },
        { q: "'ราคาเท่าไหร่?' nghĩa là:", options: ["Ở đâu?", "Khi nào?", "Giá bao nhiêu?", "Tại sao?"], answer: 2 },
        { q: "'ห้องน้ำอยู่ที่ไหน?' hỏi về:", options: ["Giá tiền", "Địa điểm", "Thời gian", "Lý do"], answer: 1 },
        { q: "Cách trả lời 'Không' cho câu hỏi ไหม:", options: ["ใช่", "ดี", "ไม่", "ครับ"], answer: 2 },
      ],
    },
  },
  {
    id: "reading_thai_A2",
    language: "thai", type: "reading", level: "A2",
    title: "Đọc hiểu Thái A2 — Tại nhà hàng",
    description: "Đọc hội thoại đặt món tại nhà hàng Thái",
    xpReward: 10,
    content: {
      title: "Đọc hiểu Thái A2 — Tại nhà hàng",
      passage: `(Tại một nhà hàng Thái. Minh và bồi bàn nói chuyện.)

บอย: สวัสดีครับ ขอเมนูไหมครับ?
(Sawadee krap. Kho menu mai krap?)
Bồi bàn: Xin chào! Anh có muốn xem thực đơn không?

มิงห์: ขอบคุณครับ ขอเมนูด้วยครับ
(Khob khun krap. Kho menu duay krap.)
Minh: Cảm ơn. Vui lòng cho tôi xem thực đơn.

(Sau vài phút)

บอย: พร้อมสั่งไหมครับ?
(Phrom sang mai krap?)
Bồi bàn: Anh sẵn sàng gọi món chưa?

มิงห์: ผมขอต้มยำกุ้งและข้าวผัดครับ ไม่เอาเผ็ดมากครับ
(Phom kho tom-yam-gung lae khao-phat krap. Mai ao phet mak krap.)
Minh: Tôi muốn Tom Yum tôm và cơm rang. Không cay nhiều nhé.

บอย: ได้ครับ ขอน้ำอะไรไหมครับ?
(Dai krap. Kho nam a-rai mai krap?)
Bồi bàn: Được ạ. Anh muốn uống gì không?

มิงห์: ขอน้ำเปล่าครับ
(Kho nam plao krap.)
Minh: Cho tôi nước lọc.`,
      quiz: [
        { q: "Minh gọi món gì?", options: ["Pad Thai và nước cam", "Tom Yum tôm và cơm rang", "Cơm gà và trà", "Phở và cà phê"], answer: 1 },
        { q: "'ไม่เอาเผ็ดมาก' nghĩa là:", options: ["Rất cay", "Không cay nhiều", "Cay vừa phải", "Không ăn được cay"], answer: 1 },
        { q: "'พร้อมสั่งไหม?' nghĩa là:", options: ["Anh muốn gì?", "Ngon không?", "Anh sẵn sàng gọi món chưa?", "Hóa đơn chưa?"], answer: 2 },
        { q: "Minh uống gì?", options: ["Trà Thái", "Nước cam", "Cà phê", "Nước lọc"], answer: 3 },
      ],
    },
  },
  {
    id: "listening_thai_A2",
    language: "thai", type: "listening", level: "A2",
    title: "Luyện nghe Thái A2 — Mua sắm",
    description: "Nghe hội thoại mua sắm tại chợ Thái",
    xpReward: 10,
    content: {
      title: "Luyện nghe Thái A2 — Mua sắm",
      context: "Minh đang mua sắm tại chợ Chatuchak ở Bangkok. Đọc hội thoại kèm dịch nghĩa.",
      transcript: `มิงห์: เสื้อตัวนี้ราคาเท่าไหร่ครับ?
(Suea tua ni ra-kha thao-rai krap?)
Minh: Áo này giá bao nhiêu?

แม่ค้า: สองร้อยบาทค่ะ
(Song roi baht ka.)
Người bán: 200 baht.

มิงห์: แพงไปนิดนึงครับ ลดได้ไหมครับ?
(Phaeng pai nit-nung krap. Lot dai mai krap?)
Minh: Đắt hơi một chút. Bớt được không?

แม่ค้า: ลดให้ร้อยแปดสิบบาทนะคะ
(Lot hai roi paet-sip baht na ka.)
Người bán: Bớt cho 180 baht nhé.

มิงห์: โอเคครับ เอาสองตัวนะครับ สีแดงกับสีน้ำเงิน
(O-ke krap. Ao song tua na krap. Si daeng kap si nam-ngern.)
Minh: Được rồi. Lấy hai cái nhé. Màu đỏ và màu xanh dương.

แม่ค้า: รวมสามร้อยหกสิบบาทค่ะ ขอบคุณค่ะ
(Ruam sam roi hok-sip baht ka. Khob-khun ka.)
Người bán: Tổng cộng 360 baht. Cảm ơn.`,
      quiz: [
        { q: "Giá ban đầu của áo là bao nhiêu?", options: ["150 baht", "180 baht", "200 baht", "360 baht"], answer: 2 },
        { q: "'ลดได้ไหม?' nghĩa là:", options: ["Giá bao nhiêu?", "Bớt được không?", "Mua thêm không?", "Đắt quá!"], answer: 1 },
        { q: "Minh mua bao nhiêu áo?", options: ["1 cái", "2 cái", "3 cái", "4 cái"], answer: 1 },
        { q: "Tổng tiền Minh phải trả là:", options: ["180 baht", "200 baht", "320 baht", "360 baht"], answer: 3 },
      ],
    },
  },
  {
    id: "writing_thai_A2",
    language: "thai", type: "writing", level: "A2",
    title: "Luyện viết Thái A2 — Nhắn tin đặt bàn",
    description: "Viết tin nhắn bằng tiếng Thái để đặt bàn nhà hàng",
    xpReward: 10,
    content: {
      title: "Luyện viết Thái A2 — Nhắn tin đặt bàn",
      prompt: "Viết một tin nhắn ngắn bằng tiếng Thái (kèm phiên âm) để đặt bàn tại nhà hàng. Bao gồm: số người, ngày giờ, tên.",
      tips: [
        "Chào: สวัสดีครับ/ค่ะ",
        "Muốn đặt bàn: อยากจองโต๊ะ (yak jong toh)",
        "Số người: สำหรับ... คน (samrap... khon)",
        "Ngày giờ: วัน... เวลา... (wan... we-la...)",
        "Tên: ชื่อ... (chue...)",
      ],
      example: `สวัสดีครับ (Sawadee krap) — Xin chào.
ผมอยากจองโต๊ะครับ (Phom yak jong toh krap) — Tôi muốn đặt bàn.
สำหรับสี่คนครับ (Samrap si khon krap) — Cho 4 người.
วันเสาร์ เวลาเจ็ดโมงเย็นครับ (Wan-sao we-la jet mong yen krap) — Thứ Bảy, 7 giờ tối.
ชื่อมิงห์ครับ (Chue Minh krap) — Tên là Minh.
ขอบคุณครับ (Khob-khun krap) — Cảm ơn.`,
      quiz: [
        { q: "'อยากจองโต๊ะ' nghĩa là:", options: ["Tôi muốn tính tiền", "Tôi muốn đặt bàn", "Tôi muốn xem thực đơn", "Tôi muốn gọi món"], answer: 1 },
        { q: "'สำหรับสี่คน' nghĩa là:", options: ["Cho 2 người", "Cho 3 người", "Cho 4 người", "Cho 5 người"], answer: 2 },
        { q: "Từ 'วัน (wan)' có nghĩa là:", options: ["Giờ", "Ngày", "Tháng", "Năm"], answer: 1 },
      ],
    },
  },
  {
    id: "speaking_thai_A2",
    language: "thai", type: "speaking", level: "A2",
    title: "Luyện nói Thái A2 — Hỏi đường",
    description: "Thực hành hỏi và chỉ đường trong tiếng Thái",
    xpReward: 10,
    content: {
      title: "Luyện nói Thái A2 — Hỏi đường",
      topic: "Hỏi đường và chỉ đường",
      phrases: [
        { phrase: "ไปที่ไหน?", phonetic: "Pai thi-nai?", meaning: "Đi đâu vậy?" },
        { phrase: "... อยู่ที่ไหนครับ?", phonetic: "... yuu thi-nai krap?", meaning: "... ở đâu?" },
        { phrase: "ตรงไป", phonetic: "Trong pai", meaning: "Đi thẳng" },
        { phrase: "เลี้ยวซ้าย/ขวา", phonetic: "Liao sai/khwa", meaning: "Rẽ trái/phải" },
        { phrase: "ใกล้/ไกล", phonetic: "Klai/klai", meaning: "Gần/xa" },
        { phrase: "ไม่ไกลครับ/ค่ะ", phonetic: "Mai klai krap/ka", meaning: "Không xa đâu" },
      ],
      dialogue: [
        { speaker: "Minh", text: "ขอโทษครับ BTS สยามอยู่ที่ไหนครับ?", translation: "Xin lỗi, ga BTS Siam ở đâu vậy?" },
        { speaker: "Local", text: "ตรงไปประมาณสองร้อยเมตรแล้วเลี้ยวขวาครับ", translation: "Đi thẳng khoảng 200 mét rồi rẽ phải." },
        { speaker: "Minh", text: "ไกลไหมครับ?", translation: "Xa không?" },
        { speaker: "Local", text: "ไม่ไกลครับ ประมาณห้านาทีเดินครับ", translation: "Không xa đâu. Khoảng 5 phút đi bộ." },
        { speaker: "Minh", text: "ขอบคุณมากครับ", translation: "Cảm ơn rất nhiều!" },
        { speaker: "Local", text: "ไม่เป็นไรครับ", translation: "Không có gì!" },
      ],
      quiz: [
        { q: "'เลี้ยวซ้าย' nghĩa là:", options: ["Đi thẳng", "Rẽ phải", "Rẽ trái", "Quay lại"], answer: 2 },
        { q: "'ไม่ไกล' nghĩa là:", options: ["Rất xa", "Không xa", "Rất gần", "Không biết"], answer: 1 },
        { q: "Khi hỏi 'Chỗ X ở đâu?' trong tiếng Thái:", options: ["X ราคาเท่าไหร่?", "X อยู่ที่ไหน?", "X เป็นอะไร?", "X ทำไม?"], answer: 1 },
      ],
    },
  },
  {
    id: "review_thai_A2",
    language: "thai", type: "review", level: "A2",
    title: "Ôn tập Thái A2 — Ăn uống, Mua sắm & Hỏi đường",
    description: "Ôn tập từ vựng và hội thoại thực tế trong cuộc sống hàng ngày",
    xpReward: 15,
    content: {
      title: "Ôn tập Thái A2 — Ăn uống, Mua sắm & Hỏi đường",
      summary: `## Tổng kết Thái A2

### Từ vựng ăn uống
อาหาร (đồ ăn), อร่อย (ngon), เผ็ด (cay), น้ำ (nước), ข้าว (cơm), ราคา (giá)

### Câu hỏi quan trọng
- Yes/No: เพิ่ม **ไหม** cuối câu
- Cái gì: **อะไร** | Ở đâu: **ที่ไหน** | Bao nhiêu: **เท่าไหร่**

### Hỏi đường
- ตรงไป (đi thẳng) | เลี้ยวซ้าย (rẽ trái) | เลี้ยวขวา (rẽ phải)
- ใกล้ (gần) | ไกล (xa) | ไม่ไกล (không xa)

### Mua sắm
- ราคาเท่าไหร่? = Giá bao nhiêu?
- ลดได้ไหม? = Bớt được không?`,
      words: [
        { word: "ต้มยำ (Tom Yam)", phonetic: "/tôm-yam/", meaning: "Canh Tom Yum", example: "ต้มยำกุ้งอร่อยมาก — Tom Yum tôm rất ngon." },
        { word: "บาท (Baht)", phonetic: "/bàat/", meaning: "Baht (tiền Thái)", example: "ราคาร้อยบาท — Giá 100 baht." },
        { word: "ตลาด (Ta-lat)", phonetic: "/tà-làat/", meaning: "Chợ", example: "ไปตลาด — Đi chợ." },
        { word: "รถไฟฟ้า (Rot-fai-fa)", phonetic: "/rót-fai-fáa/", meaning: "Tàu điện (BTS)", example: "นั่งรถไฟฟ้าไปสยาม — Đi tàu điện đến Siam." },
        { word: "สี (Si)", phonetic: "/sǐi/", meaning: "Màu sắc", example: "สีแดง (đỏ), สีน้ำเงิน (xanh dương)" },
      ],
      quiz: [
        { q: "'อาหารอร่อยไหม?' — Để hỏi điều gì?", options: ["Giá bao nhiêu?", "Đồ ăn có ngon không?", "Muốn ăn gì?", "Ở đâu?"], answer: 1 },
        { q: "'เลี้ยวขวา' nghĩa là:", options: ["Đi thẳng", "Rẽ trái", "Rẽ phải", "Quay lại"], answer: 2 },
        { q: "'ลดได้ไหม?' dùng khi:", options: ["Gọi món ăn", "Hỏi đường", "Muốn trả giá", "Đặt bàn"], answer: 2 },
        { q: "'น้ำ (Nam)' nghĩa là:", options: ["Cơm", "Nước", "Đồ ăn", "Thực đơn"], answer: 1 },
        { q: "Để hỏi 'Ở đâu?' trong tiếng Thái dùng từ:", options: ["อะไร", "ทำไม", "ที่ไหน", "เท่าไหร่"], answer: 2 },
      ],
    },
  },
];

// ─── THAI B1 ──────────────────────────────────────────────────────────────────

const thai_b1: Lesson[] = [
  {
    id: "vocabulary_thai_B1",
    language: "thai", type: "vocabulary", level: "B1",
    title: "Từ vựng Thái B1 — Công việc & Nghề nghiệp",
    description: "Từ vựng trung cấp về môi trường làm việc và các ngành nghề",
    xpReward: 12,
    content: {
      title: "Từ vựng Thái B1 — Công việc & Nghề nghiệp",
      words: [
        { word: "งาน (Ngan)", phonetic: "/ŋaan/", meaning: "Công việc", example: "คุณทำงานอะไร? — Bạn làm công việc gì?" },
        { word: "บริษัท (Bo-ri-sat)", phonetic: "/bɔɔ-rí-sàt/", meaning: "Công ty", example: "ฉันทำงานที่บริษัทญี่ปุ่น — Tôi làm ở công ty Nhật." },
        { word: "เงินเดือน (Ngern-duean)", phonetic: "/ŋən-dʉan/", meaning: "Lương tháng", example: "เงินเดือนดีไหม? — Lương có tốt không?" },
        { word: "ประสบการณ์ (Pra-sop-kan)", phonetic: "/prà-sòp-kaan/", meaning: "Kinh nghiệm", example: "คุณมีประสบการณ์กี่ปี? — Bạn có bao nhiêu năm kinh nghiệm?" },
        { word: "สมัครงาน (Sa-mak-ngan)", phonetic: "/sà-màk-ŋaan/", meaning: "Xin việc / Nộp đơn", example: "ฉันอยากสมัครงานที่นี่ — Tôi muốn xin việc ở đây." },
        { word: "ประชุม (Pra-chum)", phonetic: "/prà-chum/", meaning: "Họp", example: "วันนี้มีประชุมสำคัญ — Hôm nay có cuộc họp quan trọng." },
        { word: "โปรเจกต์ (Project)", phonetic: "/proh-jèk/", meaning: "Dự án", example: "โปรเจกต์นี้ใช้เวลาสามเดือน — Dự án này mất 3 tháng." },
        { word: "ทีม (Team)", phonetic: "/thiim/", meaning: "Đội / Nhóm làm việc", example: "ทีมของเรามีสิบคน — Nhóm của chúng tôi có 10 người." },
      ],
      quiz: [
        { q: "'สมัครงาน' nghĩa là:", options: ["Từ chức", "Xin việc", "Họp nhóm", "Tăng lương"], answer: 1 },
        { q: "'ประสบการณ์' trong câu phỏng vấn nghĩa là:", options: ["Bằng cấp", "Kinh nghiệm", "Địa chỉ", "Sở thích"], answer: 1 },
        { q: "'ประชุม' nghĩa là:", options: ["Nghỉ phép", "Họp", "Làm thêm giờ", "Dự án"], answer: 1 },
      ],
    },
  },
  {
    id: "grammar_thai_B1",
    language: "thai", type: "grammar", level: "B1",
    title: "Ngữ pháp Thái B1 — Thể bị động và câu phức",
    description: "Học cách dùng cấu trúc bị động và câu phức trong tiếng Thái",
    xpReward: 12,
    content: {
      title: "Ngữ pháp Thái B1 — Thể bị động và câu phức",
      explanation: `## Cấu trúc nâng cao trong tiếng Thái

### 1. Thể bị động — dùng ถูก (thuk) hoặc ได้รับ (dai-rap)

**ถูก (thuk)** — thường mang nghĩa tiêu cực
- เขา**ถูก**ไล่ออก = Anh ấy bị sa thải
- ฉัน**ถูก**ลงโทษ = Tôi bị phạt

**ได้รับ (dai-rap)** — mang nghĩa tích cực/trung tính
- เธอ**ได้รับ**รางวัล = Cô ấy được nhận giải thưởng
- ฉัน**ได้รับ**เงินเดือนแล้ว = Tôi đã nhận lương rồi

### 2. Câu điều kiện — ถ้า...ก็... (tha...ko...)
**ถ้า** (nếu) + điều kiện + **ก็** (thì) + kết quả

- **ถ้า**คุณทำงานหนัก **ก็**จะประสบความสำเร็จ
= Nếu bạn làm việc chăm chỉ thì sẽ thành công.

- **ถ้า**ฉันมีเวลา **ก็**จะไปเที่ยว
= Nếu tôi có thời gian thì sẽ đi du lịch.

### 3. Câu tương phản — แต่ (tae) = nhưng
- ฉันชอบทำงาน**แต่**เหนื่อยมาก
= Tôi thích làm việc nhưng rất mệt.`,
      quiz: [
        { q: "'เขาถูกไล่ออก' nghĩa là:", options: ["Anh ấy được thăng chức", "Anh ấy bị sa thải", "Anh ấy xin nghỉ", "Anh ấy chuyển việc"], answer: 1 },
        { q: "'ถ้า...ก็...' dùng để diễn đạt:", options: ["Câu hỏi", "Câu điều kiện", "Câu phủ định", "Câu cảm thán"], answer: 1 },
        { q: "Từ nào mang nghĩa 'nhưng' trong tiếng Thái?", options: ["ถ้า (tha)", "ก็ (ko)", "แต่ (tae)", "และ (lae)"], answer: 2 },
        { q: "'ได้รับ (dai-rap)' khác 'ถูก (thuk)' như thế nào?", options: ["Giống nhau hoàn toàn", "ได้รับ tích cực, ถูก tiêu cực", "ถูก tích cực, ได้รับ tiêu cực", "Không liên quan đến bị động"], answer: 1 },
      ],
    },
  },
  {
    id: "reading_thai_B1",
    language: "thai", type: "reading", level: "B1",
    title: "Đọc hiểu Thái B1 — Văn hóa Thái và Tết Songkran",
    description: "Đọc bài về lễ hội Songkran và văn hóa Thái Lan",
    xpReward: 12,
    content: {
      title: "Đọc hiểu Thái B1 — Văn hóa Thái và Tết Songkran",
      passage: `สงกรานต์เป็นเทศกาลปีใหม่ไทยที่สำคัญที่สุด จัดขึ้นในวันที่ 13-15 เมษายนของทุกปี
(Songkran pen thet-sa-kan pi-mai Thai thi sam-khan thi-sut. Chat-khuen nai wan-thi sip-sam thueng sip-ha me-sa-yon khong thuk pi.)
Songkran là lễ hội năm mới Thái Lan quan trọng nhất, diễn ra vào ngày 13-15 tháng 4 hàng năm.

ประเพณีสำคัญของสงกรานต์คือการเล่นน้ำ คนไทยเชื่อว่าน้ำจะชำระล้างสิ่งไม่ดีและนำโชคลาภมาให้
(Pra-pheni sam-khan khong Songkran khue kan-len-nam. Khon-Thai chuea wa nam ja cham-ra-lang sing mai-dee lae nam chok-lap ma hai.)
Truyền thống quan trọng của Songkran là té nước. Người Thái tin rằng nước sẽ gột rửa điều xấu và mang lại may mắn.

นอกจากนี้ ลูกหลานยังนำน้ำอบไปรดมือผู้ใหญ่เพื่อแสดงความเคารพ
(Nok-jak-ni, luk-lan yang nam nam-op pai rot-mue phu-yai phuea sa-daeng khwam-khao-rop.)
Ngoài ra, con cháu còn mang nước thơm té lên tay người lớn tuổi để thể hiện sự kính trọng.

สงกรานต์เป็นโอกาสที่ครอบครัวได้มาอยู่พร้อมหน้ากัน และเป็นเทศกาลที่ดึงดูดนักท่องเที่ยวจากทั่วโลก
(Songkran pen o-kat thi khrop-khruea dai ma yuu phrom-na-kan, lae pen thet-sa-kan thi dueng-dut nak-thong-thiao chak-thua-lok.)
Songkran là dịp để gia đình sum họp, và là lễ hội thu hút du khách từ khắp nơi trên thế giới.`,
      quiz: [
        { q: "Lễ hội Songkran diễn ra vào thời gian nào?", options: ["1-3 tháng 1", "13-15 tháng 4", "5-7 tháng 5", "31 tháng 12"], answer: 1 },
        { q: "Người Thái tin té nước có tác dụng gì?", options: ["Làm mát cơ thể", "Gột rửa điều xấu và mang may mắn", "Tưới cây", "Truyền thống thể thao"], answer: 1 },
        { q: "Con cháu té nước lên tay người lớn để làm gì?", options: ["Vui chơi", "Thể hiện sự kính trọng", "Cầu may mắn cho mình", "Theo quy định pháp luật"], answer: 1 },
        { q: "Songkran thu hút điều gì từ khắp nơi trên thế giới?", options: ["Nhà đầu tư", "Du khách", "Vận động viên", "Học giả"], answer: 1 },
      ],
    },
  },
  {
    id: "listening_thai_B1",
    language: "thai", type: "listening", level: "B1",
    title: "Luyện nghe Thái B1 — Phỏng vấn xin việc",
    description: "Nghe hội thoại phỏng vấn xin việc bằng tiếng Thái",
    xpReward: 12,
    content: {
      title: "Luyện nghe Thái B1 — Phỏng vấn xin việc",
      context: "Minh đang phỏng vấn xin việc tại một công ty ở Bangkok. HR tên Khun Nee đang phỏng vấn.",
      transcript: `คุณนี: สวัสดีครับ คุณมิงห์ ยินดีต้อนรับครับ
(Sawadee krap. Khun Minh. Yin-dee ton-rap krap.)
Khun Nee: Xin chào, anh Minh. Chào mừng anh!

มิงห์: ขอบคุณมากครับ ดีใจที่ได้มาครับ
(Khob-khun mak krap. Dee-jai thi dai ma krap.)
Minh: Cảm ơn nhiều. Tôi rất vui khi được đến đây.

คุณนี: คุณมีประสบการณ์ทำงานด้านการตลาดกี่ปีครับ?
(Khun mi pra-sop-kan tham-ngan dan kan-ta-lat ki pi krap?)
Khun Nee: Anh có bao nhiêu năm kinh nghiệm trong lĩnh vực marketing?

มิงห์: ผมมีประสบการณ์สามปีครับ ที่บริษัทเดิมผมรับผิดชอบแคมเปญโซเชียลมีเดียครับ
(Phom mi pra-sop-kan sam pi krap. Thi bo-ri-sat derm phom rap-phit-chop khaem-phen so-chial-mi-dia krap.)
Minh: Tôi có 3 năm kinh nghiệm. Ở công ty cũ, tôi phụ trách chiến dịch mạng xã hội.

คุณนี: จุดแข็งของคุณคืออะไรครับ?
(Jut-khaeng khong khun khue a-rai krap?)
Khun Nee: Điểm mạnh của anh là gì?

มิงห์: ผมคิดว่าจุดแข็งของผมคือความคิดสร้างสรรค์และการทำงานเป็นทีมครับ ผมชอบแก้ปัญหาด้วยวิธีใหม่ๆ ครับ
(Phom khit wa jut-khaeng khong phom khue khwam-khit-sang-san lae kan-tham-ngan-pen-thim krap.)
Minh: Tôi nghĩ điểm mạnh của tôi là sự sáng tạo và làm việc nhóm. Tôi thích giải quyết vấn đề bằng phương pháp mới.`,
      quiz: [
        { q: "Minh có bao nhiêu năm kinh nghiệm marketing?", options: ["1 năm", "2 năm", "3 năm", "5 năm"], answer: 2 },
        { q: "Ở công ty cũ, Minh phụ trách gì?", options: ["Kế toán", "Chiến dịch mạng xã hội", "Phát triển phần mềm", "Quan hệ khách hàng"], answer: 1 },
        { q: "'จุดแข็ง (jut-khaeng)' nghĩa là:", options: ["Điểm yếu", "Điểm mạnh", "Kinh nghiệm", "Mục tiêu"], answer: 1 },
        { q: "Minh nói điểm mạnh của mình là:", options: ["Kỹ năng kỹ thuật và ngoại ngữ", "Sáng tạo và làm việc nhóm", "Kinh nghiệm và bằng cấp", "Chăm chỉ và đúng giờ"], answer: 1 },
      ],
    },
  },
  {
    id: "writing_thai_B1",
    language: "thai", type: "writing", level: "B1",
    title: "Luyện viết Thái B1 — Email công việc",
    description: "Viết email bằng tiếng Thái để liên hệ công việc",
    xpReward: 12,
    content: {
      title: "Luyện viết Thái B1 — Email công việc",
      prompt: "Viết một email ngắn bằng tiếng Thái (kèm phiên âm, 6-8 câu) để hỏi về một vị trí tuyển dụng. Bao gồm: lý do viết, giới thiệu bản thân, kinh nghiệm, câu hỏi về vị trí.",
      tips: [
        "Mở đầu: เรียนคุณ... (Rian Khun...) = Kính gửi...",
        "Lý do: ผมเขียนมาเพื่อ... (Phom khian ma phuea...) = Tôi viết thư để...",
        "Giới thiệu: ผมชื่อ... มีประสบการณ์... ปี = Tôi tên... có... năm kinh nghiệm",
        "Câu hỏi: อยากทราบว่า... (Yak sap wa...) = Tôi muốn hỏi rằng...",
        "Kết thúc: ขอบคุณสำหรับเวลาของคุณ (Khob-khun samrap we-la khong khun) = Cảm ơn vì thời gian của bạn",
      ],
      example: `เรียนคุณผู้จัดการ (Rian Khun phu-jat-kan) — Kính gửi Quản lý.
ผมเขียนมาเพื่อสอบถามเกี่ยวกับตำแหน่งนักการตลาดที่บริษัทของคุณครับ
(Phom khian ma phuea sob-tham kiao-kap tam-naeng nak-kan-ta-lat thi bo-ri-sat khong khun krap.)
Tôi viết thư để hỏi về vị trí Marketing tại công ty của bạn.

ผมชื่อมิงห์ มีประสบการณ์ด้านการตลาดสามปีครับ
(Phom chue Minh. Mi pra-sop-kan dan kan-ta-lat sam pi krap.)
Tôi tên Minh, có 3 năm kinh nghiệm marketing.

อยากทราบว่าตำแหน่งนี้ยังว่างอยู่ไหมครับ?
(Yak sap wa tam-naeng ni yang wang yuu mai krap?)
Tôi muốn hỏi vị trí này còn trống không?

ขอบคุณสำหรับเวลาของคุณครับ (Khob-khun samrap we-la khong khun krap.)
Cảm ơn vì thời gian của bạn.`,
      quiz: [
        { q: "'เรียนคุณ...' dùng để:", options: ["Kết thúc email", "Mở đầu email trang trọng", "Hỏi câu hỏi", "Giới thiệu bản thân"], answer: 1 },
        { q: "'อยากทราบว่า...' nghĩa là:", options: ["Tôi không biết...", "Tôi muốn hỏi rằng...", "Tôi đồng ý rằng...", "Tôi nghĩ rằng..."], answer: 1 },
        { q: "'ตำแหน่ง (tam-naeng)' trong ngữ cảnh công việc nghĩa là:", options: ["Lương", "Vị trí/chức vụ", "Kinh nghiệm", "Bằng cấp"], answer: 1 },
      ],
    },
  },
  {
    id: "speaking_thai_B1",
    language: "thai", type: "speaking", level: "B1",
    title: "Luyện nói Thái B1 — Thảo luận và bày tỏ ý kiến",
    description: "Thực hành cách bày tỏ ý kiến và thảo luận bằng tiếng Thái",
    xpReward: 12,
    content: {
      title: "Luyện nói Thái B1 — Thảo luận và bày tỏ ý kiến",
      topic: "Bày tỏ ý kiến về cuộc sống và công việc",
      phrases: [
        { phrase: "ผมคิดว่า... (Phom khit wa...)", phonetic: "/phǒm-khít-wâa/", meaning: "Tôi nghĩ rằng... (nam)" },
        { phrase: "ฉันเห็นด้วยว่า... (Chan hen-duay wa...)", phonetic: "/chán-hěn-dûay-wâa/", meaning: "Tôi đồng ý rằng..." },
        { phrase: "ฉันไม่แน่ใจว่า... (Chan mai nae-jai wa...)", phonetic: "/chán-mâi-nâe-jai-wâa/", meaning: "Tôi không chắc rằng..." },
        { phrase: "ตามความเห็นของฉัน... (Tam khwam-hen khong chan...)", phonetic: "/taam-khwaam-hěn-khɔ̌ɔŋ-chán/", meaning: "Theo ý kiến của tôi..." },
        { phrase: "มีข้อดีและข้อเสีย (Mi kho-dee lae kho-sia)", phonetic: "/mii-khɔ̂ɔ-dii-lɛ́ɛ-khɔ̂ɔ-sǐa/", meaning: "Có ưu điểm và nhược điểm" },
      ],
      dialogue: [
        { speaker: "A", text: "คุณคิดอย่างไรกับการทำงานจากที่บ้านครับ?", translation: "Bạn nghĩ thế nào về việc làm việc từ nhà?" },
        { speaker: "B", text: "ผมคิดว่ามีข้อดีและข้อเสียครับ ข้อดีคือประหยัดเวลาเดินทาง", translation: "Tôi nghĩ có ưu và nhược điểm. Ưu điểm là tiết kiệm thời gian đi lại." },
        { speaker: "A", text: "ฉันเห็นด้วยค่ะ แต่ข้อเสียคืออาจรู้สึกโดดเดี่ยวได้", translation: "Tôi đồng ý. Nhưng nhược điểm là có thể cảm thấy cô đơn." },
        { speaker: "B", text: "ตามความเห็นของผม การทำงานแบบไฮบริดดีที่สุดครับ", translation: "Theo ý kiến tôi, làm việc theo mô hình hybrid là tốt nhất." },
      ],
      quiz: [
        { q: "'ผมคิดว่า...' được dùng để:", options: ["Hỏi ý kiến", "Bày tỏ ý kiến của mình", "Đồng ý hoàn toàn", "Phủ nhận"], answer: 1 },
        { q: "'มีข้อดีและข้อเสีย' nghĩa là:", options: ["Tốt lắm", "Không tốt", "Có ưu và nhược điểm", "Không có ý kiến"], answer: 2 },
        { q: "'ฉันเห็นด้วย' nghĩa là:", options: ["Tôi không đồng ý", "Tôi đồng ý", "Tôi không biết", "Tôi thích"], answer: 1 },
      ],
    },
  },
  {
    id: "review_thai_B1",
    language: "thai", type: "review", level: "B1",
    title: "Ôn tập Thái B1 — Công việc & Diễn đạt nâng cao",
    description: "Ôn tập từ vựng công việc, thể bị động và cách bày tỏ ý kiến",
    xpReward: 15,
    content: {
      title: "Ôn tập Thái B1 — Công việc & Diễn đạt nâng cao",
      summary: `## Tổng kết Thái B1

### Từ vựng công việc
งาน (công việc), บริษัท (công ty), เงินเดือน (lương), ประสบการณ์ (kinh nghiệm)
สมัครงาน (xin việc), ประชุม (họp), โปรเจกต์ (dự án), ทีม (nhóm)

### Cấu trúc bị động
- ถูก (thuk) — nghĩa tiêu cực: ถูกไล่ออก (bị sa thải)
- ได้รับ (dai-rap) — nghĩa tích cực: ได้รับรางวัล (được giải thưởng)

### Câu điều kiện
ถ้า... ก็... = Nếu... thì...

### Bày tỏ ý kiến
- ผม/ฉันคิดว่า... = Tôi nghĩ rằng...
- ตามความเห็นของผม/ฉัน... = Theo ý kiến tôi...
- ฉันเห็นด้วย / ไม่เห็นด้วย = Tôi đồng ý / Không đồng ý`,
      words: [
        { word: "ความสำเร็จ (Khwam-sam-ret)", phonetic: "/khwaam-sǎm-rèt/", meaning: "Thành công", example: "ขอให้ประสบความสำเร็จ — Chúc thành công." },
        { word: "ความรับผิดชอบ (Khwam-rap-phit-chop)", phonetic: "/khwaam-ráp-phìt-chɔ̂ɔp/", meaning: "Trách nhiệm", example: "งานนี้มีความรับผิดชอบสูง — Công việc này có trách nhiệm cao." },
        { word: "พัฒนา (Phat-tha-na)", phonetic: "/phát-thá-naa/", meaning: "Phát triển", example: "ฉันอยากพัฒนาทักษะ — Tôi muốn phát triển kỹ năng." },
        { word: "ทักษะ (That-sa)", phonetic: "/thák-sà/", meaning: "Kỹ năng", example: "คุณมีทักษะอะไรบ้าง? — Bạn có những kỹ năng gì?" },
        { word: "โอกาส (O-kat)", phonetic: "/ʔoo-kàat/", meaning: "Cơ hội", example: "นี่คือโอกาสที่ดี — Đây là cơ hội tốt." },
      ],
      quiz: [
        { q: "'เขาถูกเลื่อนตำแหน่ง' — ถูก ở đây mang nghĩa:", options: ["Tiêu cực — bị phạt", "Tích cực — được thăng chức", "Trung tính", "Không xác định"], answer: 1 },
        { q: "'ถ้าคุณขยันก็จะประสบความสำเร็จ' nghĩa là:", options: ["Bạn đã thành công", "Nếu bạn chăm chỉ thì sẽ thành công", "Bạn không chăm chỉ", "Thành công rất khó"], answer: 1 },
        { q: "'ทักษะ (That-sa)' nghĩa là:", options: ["Kinh nghiệm", "Bằng cấp", "Kỹ năng", "Lương"], answer: 2 },
        { q: "Cách nói 'Tôi đồng ý' trong tiếng Thái:", options: ["ฉันไม่เห็นด้วย", "ฉันเห็นด้วย", "ฉันไม่แน่ใจ", "ฉันไม่รู้"], answer: 1 },
        { q: "'โอกาส (O-kat)' nghĩa là:", options: ["Thách thức", "Vấn đề", "Cơ hội", "Kết quả"], answer: 2 },
      ],
    },
  },
];

// ─── Main seed function ───────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Bắt đầu seed bài học...");

  const allLessons: Lesson[] = [
    ...english_a1,
    ...english_a2,
    ...english_b1,
    ...english_b2,
    ...thai_a1,
    ...thai_a2,
    ...thai_b1,
  ];

  let created = 0;
  let skipped = 0;

  for (const lesson of allLessons) {
    const existing = await prisma.lesson.findUnique({ where: { id: lesson.id } });
    if (existing && existing.content !== "{}") {
      skipped++;
      continue;
    }
    await prisma.lesson.upsert({
      where: { id: lesson.id },
      update: {
        title: lesson.title,
        description: lesson.description,
        content: JSON.stringify(lesson.content),
        xpReward: lesson.xpReward,
      },
      create: {
        id: lesson.id,
        language: lesson.language,
        type: lesson.type,
        level: lesson.level,
        title: lesson.title,
        description: lesson.description,
        content: JSON.stringify(lesson.content),
        xpReward: lesson.xpReward,
      },
    });
    created++;
  }

  console.log(`✅ Seed hoàn thành: ${created} bài tạo mới, ${skipped} bài đã có sẵn`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
