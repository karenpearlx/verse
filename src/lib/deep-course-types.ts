export type DeepCourseWrapper = { tag: 'div' | 'section'; class: string };

export type DeepCourseChunk = {
  /** 'html' = verbatim prose section, 'slot' = an interactive region */
  kind: 'html' | 'slot';
  /** raw HTML when kind is 'html'; MODULES | QUIZ | GLOSSARY when kind is 'slot' */
  value: string;
  /** layout elements the slot sat inside, outermost first */
  wrappers?: DeepCourseWrapper[];
};

export type DeepCourseModule = {
  n: number;
  title: string;
  outcome: string;
  badges: string[];
  minutes: number | null;
  /** rendered module body, everything inside the disclosure */
  html: string;
  /** generated per-module quick check, 1–3 questions */
  quiz?: DeepCourseQuestion[];
};

export type DeepCourseQuestion = {
  q: string;
  options: string[];
  answer: number;
  explain: string;
};

export type DeepCourseGlossaryEntry = {
  term: string;
  def: string;
};

export type DeepCourse = {
  slug: string;
  title: string;
  premium: boolean;
  previewCount: number;
  chunks: DeepCourseChunk[];
  modules: DeepCourseModule[];
  quiz: DeepCourseQuestion[];
  glossary: DeepCourseGlossaryEntry[];
};
