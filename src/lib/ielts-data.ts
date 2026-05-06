export type IeltsQuestion = {
  id: string;
  band: "4.0" | "5.0" | "6.0" | "7.0" | "8.0";
  passage: string;
  question: string;
  options: string[];
  answer: number;
};

// ─── Band 4.0 – Simple passage, direct comprehension ────────────────────────

const PASSAGE_4 =
  "Many cities around the world are investing in public transportation to reduce traffic congestion. " +
  "Buses, trains and metro systems can move large numbers of people efficiently. " +
  "Research shows that cities with well-developed public transport networks tend to have lower air pollution levels. " +
  "However, constructing new transport infrastructure requires significant financial investment from local governments.";

const BAND_4: IeltsQuestion[] = [
  {
    id: "ielts-4-1",
    band: "4.0",
    passage: PASSAGE_4,
    question: "Cities invest in public transport mainly to reduce traffic congestion. (True / False / Not Given)",
    options: ["True", "False", "Not Given"],
    answer: 0,
  },
  {
    id: "ielts-4-2",
    band: "4.0",
    passage: PASSAGE_4,
    question: "Buses carry more passengers per journey than trains. (True / False / Not Given)",
    options: ["True", "False", "Not Given"],
    answer: 2,
  },
  {
    id: "ielts-4-3",
    band: "4.0",
    passage: PASSAGE_4,
    question: "Good public transport is linked to lower pollution levels.",
    options: ["True", "False", "Not Given"],
    answer: 0,
  },
  {
    id: "ielts-4-4",
    band: "4.0",
    passage: PASSAGE_4,
    question: "According to the passage, what is a major challenge of building new transport systems?",
    options: [
      "Lack of government interest",
      "High construction costs",
      "Insufficient passenger demand",
      "Environmental regulations",
    ],
    answer: 1,
  },
  {
    id: "ielts-4-5",
    band: "4.0",
    passage: PASSAGE_4,
    question: "What is the main idea of the passage?",
    options: [
      "Public transport is always more efficient than cars",
      "Investing in public transport benefits cities despite the cost",
      "Governments are reluctant to fund transport projects",
      "Metro systems are the best form of public transport",
    ],
    answer: 1,
  },
];

// ─── Band 5.0 – Moderate complexity, requires some inference ─────────────────

const PASSAGE_5 =
  "The term 'fast fashion' describes the rapid production of large quantities of inexpensive, trend-driven clothing. " +
  "While this model has made fashionable clothing accessible to a far broader population, it has attracted criticism for its environmental consequences. " +
  "The fashion industry as a whole is estimated to account for approximately 10% of annual global carbon emissions, " +
  "and an estimated 85% of all textiles produced eventually end up in landfills or are incinerated. " +
  "Some major brands have responded by launching 'sustainable' product lines, " +
  "though critics contend that these initiatives represent a form of 'greenwashing' — " +
  "the practice of making misleading environmental claims — rather than a fundamental shift in business practices.";

const BAND_5: IeltsQuestion[] = [
  {
    id: "ielts-5-1",
    band: "5.0",
    passage: PASSAGE_5,
    question: "Fast fashion has made fashionable clothing less accessible to ordinary consumers. (True / False / Not Given)",
    options: ["True", "False", "Not Given"],
    answer: 1,
  },
  {
    id: "ielts-5-2",
    band: "5.0",
    passage: PASSAGE_5,
    question: "The fashion industry produces more carbon emissions than the aviation industry. (True / False / Not Given)",
    options: ["True", "False", "Not Given"],
    answer: 2,
  },
  {
    id: "ielts-5-3",
    band: "5.0",
    passage: PASSAGE_5,
    question: "Critics believe most brands' sustainable lines represent genuine long-term change. (True / False / Not Given)",
    options: ["True", "False", "Not Given"],
    answer: 1,
  },
  {
    id: "ielts-5-4",
    band: "5.0",
    passage: PASSAGE_5,
    question: "According to the passage, what percentage of textiles end up in landfills or are incinerated?",
    options: ["65%", "75%", "85%", "95%"],
    answer: 2,
  },
  {
    id: "ielts-5-5",
    band: "5.0",
    passage: PASSAGE_5,
    question: "In this context, 'greenwashing' most closely means:",
    options: [
      "A genuine commitment to environmental sustainability",
      "Using green colours in product packaging",
      "Making misleading claims about environmental practices",
      "A government regulation on carbon emissions",
    ],
    answer: 2,
  },
];

// ─── Band 6.0 – Academic passage, inference required ─────────────────────────

const PASSAGE_6 =
  "Neuroplasticity — the brain's capacity to reorganise itself by forming new neural connections throughout life — " +
  "has significantly revised our understanding of cognitive development and rehabilitation. " +
  "Traditional neuroscience held that the adult brain was largely fixed and immutable following an early developmental window. " +
  "However, research conducted over the past three decades has demonstrated that targeted practice, " +
  "environmental enrichment, and certain forms of cognitive stimulation can induce measurable structural changes in the adult brain. " +
  "This discovery carries profound implications for education, suggesting that intelligence should not be conceived of as a fixed genetic endowment " +
  "but rather as a dynamic capacity that can be meaningfully cultivated through sustained and deliberate effort.";

const BAND_6: IeltsQuestion[] = [
  {
    id: "ielts-6-1",
    band: "6.0",
    passage: PASSAGE_6,
    question: "Traditional neuroscience believed the adult brain was essentially unchangeable. (True / False / Not Given)",
    options: ["True", "False", "Not Given"],
    answer: 0,
  },
  {
    id: "ielts-6-2",
    band: "6.0",
    passage: PASSAGE_6,
    question: "Neuroplasticity research began less than ten years ago. (True / False / Not Given)",
    options: ["True", "False", "Not Given"],
    answer: 1,
  },
  {
    id: "ielts-6-3",
    band: "6.0",
    passage: PASSAGE_6,
    question: "The passage suggests that intelligence is entirely determined by genetics. (True / False / Not Given)",
    options: ["True", "False", "Not Given"],
    answer: 1,
  },
  {
    id: "ielts-6-4",
    band: "6.0",
    passage: PASSAGE_6,
    question: "What does the discovery of neuroplasticity imply for educational practice?",
    options: [
      "Schools should focus only on gifted students",
      "Intelligence can be improved through effort and the right environment",
      "The brain stops developing after early childhood",
      "Genetic testing should be used to predict academic potential",
    ],
    answer: 1,
  },
  {
    id: "ielts-6-5",
    band: "6.0",
    passage: PASSAGE_6,
    question: "The word 'immutable' in the passage most nearly means:",
    options: ["highly adaptable", "completely silent", "incapable of change", "poorly understood"],
    answer: 2,
  },
];

// ─── Band 7.0 – Complex academic text, nuanced inference ─────────────────────

const PASSAGE_7 =
  "The 'paradox of choice', a concept introduced by psychologist Barry Schwartz, proposes that an abundance of options, " +
  "while ostensibly liberating, can paradoxically diminish subjective wellbeing and produce decision paralysis. " +
  "Schwartz argues that in contemporary consumer societies, where choice has proliferated exponentially, " +
  "individuals experience heightened anxiety during the selection process and intensified regret following decisions. " +
  "This regret is amplified by the presence of unchosen alternatives, which function as a persistent benchmark against which chosen outcomes are unfavourably measured. " +
  "Furthermore, Schwartz contends that the burden of choice transfers responsibility for outcomes entirely to the individual, " +
  "thereby converting failed or merely adequate choices into sources of self-reproach. " +
  "His analysis constitutes a direct challenge to the foundational economic assumption that maximising available choice invariably maximises individual and collective welfare.";

const BAND_7: IeltsQuestion[] = [
  {
    id: "ielts-7-1",
    band: "7.0",
    passage: PASSAGE_7,
    question: "Schwartz argues that having more choices consistently leads to greater satisfaction. (True / False / Not Given)",
    options: ["True", "False", "Not Given"],
    answer: 1,
  },
  {
    id: "ielts-7-2",
    band: "7.0",
    passage: PASSAGE_7,
    question: "Decision paralysis is unrelated to the number of options available. (True / False / Not Given)",
    options: ["True", "False", "Not Given"],
    answer: 1,
  },
  {
    id: "ielts-7-3",
    band: "7.0",
    passage: PASSAGE_7,
    question: "According to Schwartz, why do people feel regret after making a choice?",
    options: [
      "Because they lack sufficient information before deciding",
      "Because unchosen alternatives serve as an unfavourable comparison standard",
      "Because most products fail to meet advertised expectations",
      "Because people fundamentally distrust their own judgement",
    ],
    answer: 1,
  },
  {
    id: "ielts-7-4",
    band: "7.0",
    passage: PASSAGE_7,
    question: "What economic assumption does Schwartz challenge?",
    options: [
      "That free markets produce efficient outcomes",
      "That consumer spending drives economic growth",
      "That maximising choice always maximises welfare",
      "That individuals act rationally in all decisions",
    ],
    answer: 2,
  },
  {
    id: "ielts-7-5",
    band: "7.0",
    passage: PASSAGE_7,
    question: "The phrase 'ostensibly liberating' implies that increased choice:",
    options: [
      "is genuinely and completely freeing",
      "appears to offer freedom but may not in practice",
      "has been proven to restrict individual autonomy",
      "is universally experienced as oppressive",
    ],
    answer: 1,
  },
];

// ─── Band 8.0 – Highly complex, subtle reasoning ─────────────────────────────

const PASSAGE_8 =
  "The proposed Anthropocene epoch — defined by the dominant and measurable imprint of human activity on Earth's geology, climate systems, and biosphere — " +
  "remains a subject of scientific, philosophical, and political contention. " +
  "Proponents of its formal adoption into the International Chronostratigraphic Chart argue that anthropogenic forces " +
  "have inaugurated geologically significant and potentially irreversible transformations sufficient to demarcate a distinct stratigraphic boundary. " +
  "Detractors, however, challenge both the empirical adequacy of the proposed boundary markers and the epistemological implications of inscribing human civilisation into geological nomenclature. " +
  "A deeper set of objections concerns the concept's anthropocentrism: by naming a geological epoch after humanity, critics contend, " +
  "the designation risks naturalising the very processes of environmental degradation it purports to describe, " +
  "thereby obscuring questions of differential responsibility and historical causation. " +
  "The debate, in this sense, transcends geological taxonomy and raises fundamental questions about collective accountability and obligations to future generations.";

const BAND_8: IeltsQuestion[] = [
  {
    id: "ielts-8-1",
    band: "8.0",
    passage: PASSAGE_8,
    question: "The Anthropocene epoch is officially recognised in the International Chronostratigraphic Chart. (True / False / Not Given)",
    options: ["True", "False", "Not Given"],
    answer: 1,
  },
  {
    id: "ielts-8-2",
    band: "8.0",
    passage: PASSAGE_8,
    question: "The debate about the Anthropocene concerns scientific questions only. (True / False / Not Given)",
    options: ["True", "False", "Not Given"],
    answer: 1,
  },
  {
    id: "ielts-8-3",
    band: "8.0",
    passage: PASSAGE_8,
    question: "Proponents of the Anthropocene concept believe the changes it describes may be permanent. (True / False / Not Given)",
    options: ["True", "False", "Not Given"],
    answer: 0,
  },
  {
    id: "ielts-8-4",
    band: "8.0",
    passage: PASSAGE_8,
    question: "According to critics, what risk does naming an epoch after humanity create?",
    options: [
      "It overstates the scientific evidence for climate change",
      "It may legitimise environmental degradation by making it appear natural",
      "It attributes too much blame to developing nations",
      "It confuses geological and biological timescales",
    ],
    answer: 1,
  },
  {
    id: "ielts-8-5",
    band: "8.0",
    passage: PASSAGE_8,
    question: "The passage suggests that the Anthropocene debate is ultimately significant because it:",
    options: [
      "will definitively resolve questions about geological dating",
      "raises questions about responsibility across generations",
      "demonstrates the limits of scientific methodology",
      "shows that human activity has no geological equivalent",
    ],
    answer: 1,
  },
];

// ─── Combined ─────────────────────────────────────────────────────────────────

export const IELTS_QUESTIONS: IeltsQuestion[] = [
  ...BAND_4,
  ...BAND_5,
  ...BAND_6,
  ...BAND_7,
  ...BAND_8,
];

const BAND_ORDER = ["4.0", "5.0", "6.0", "7.0", "8.0"] as const;

export function getIeltsQuestions(): IeltsQuestion[] {
  // Questions served in band order (difficulty progression)
  return [...IELTS_QUESTIONS];
}

export type IeltsResult = {
  score: number;
  level: string;
  rawLabel: string;
  description: string;
};

export function calculateIeltsResult(
  questions: IeltsQuestion[],
  answers: (number | null)[]
): IeltsResult {
  // Count correct per band
  const correct: Record<string, number> = {};
  for (let i = 0; i < questions.length; i++) {
    const b = questions[i].band;
    if (!correct[b]) correct[b] = 0;
    if (answers[i] === questions[i].answer) correct[b]++;
  }

  // Highest band with ≥3/5 correct
  let achievedBand = "Below 4.0";
  for (const band of [...BAND_ORDER].reverse()) {
    if ((correct[band] ?? 0) >= 3) {
      achievedBand = band;
      break;
    }
  }

  const totalCorrect = Object.values(correct).reduce((s, v) => s + v, 0);
  const score = Math.round((totalCorrect / questions.length) * 100);

  const DESCRIPTIONS: Record<string, string> = {
    "Below 4.0": "Chưa đủ. Cần xây dựng nền tảng từ vựng và kỹ năng đọc học thuật.",
    "4.0": "Giới hạn. Bạn hiểu ý chính nhưng gặp khó khăn với ngôn ngữ phức tạp.",
    "5.0": "Khiêm tốn. Bạn xử lý được nội dung quen thuộc nhưng thường mắc lỗi suy luận.",
    "6.0": "Có năng lực. Bạn hiểu các đoạn văn học thuật phức tạp hơn dù còn một số khó khăn.",
    "7.0": "Tốt. Bạn xử lý ngôn ngữ học thuật chi tiết và suy luận ngụ ý hiệu quả.",
    "8.0": "Rất tốt. Bạn nắm bắt tốt các lập luận phức tạp và ngôn ngữ hàm ý cao.",
  };

  return {
    score,
    level: achievedBand,
    rawLabel: `IELTS Band ${achievedBand}`,
    description: DESCRIPTIONS[achievedBand] ?? "",
  };
}
