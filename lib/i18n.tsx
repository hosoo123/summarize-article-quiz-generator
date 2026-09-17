"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "mn";

const translations = {
  en: {
    appTitle: "Quiz app",
    signIn: "Sign in",
    signUp: "Sign up",
    welcomeTitle: "Article Quiz Generator",
    welcomeBody: "Sign in to summarize articles, generate quizzes, and save your history.",
    signInContinue: "Sign in to continue",
    history: "History",
    newSummary: "New summary",
    loadingHistory: "Loading history…",
    emptyHistory: "Your saved summaries will appear here.",
    quizCount: "quiz",
    generatorTitle: "Article Quiz Generator",
    generatorBody:
      "Paste your article below to generate a summarize and quiz question. Your articles will saved in the sidebar for future reference.",
    articleTitle: "Article Title",
    articleTitlePlaceholder: "Enter article title",
    articleContent: "Article Content",
    articleContentPlaceholder: "Paste your article here...",
    generateSummary: "Generate summary",
    summarizing: "Summarizing…",
    summarizedContent: "Summarized content",
    seeSummary: "See summary",
    seeContent: "See content",
    takeQuiz: "Take a quiz",
    knowledgeCheck: "Knowledge check",
    testUnderstanding: "Test your understanding",
    readyQuiz: "Ready for a quick quiz?",
    retake: "Retake",
    quizEmpty: "Generate up to five questions based only on this article.",
    generateQuiz: "Generate quiz",
    generating: "Generating…",
    perfectScore: "Perfect score!",
    niceWork: "Nice work!",
    keepLearning: "Keep learning.",
    reviewAnswers: "Review each answer below, then retake the quiz whenever you are ready.",
    questionOf: "Question {n} of {total}",
    progressOf: "{n} / {total}",
    why: "Why:",
    checkAnswers: "Check my answers",
    checking: "Checking…",
    dismiss: "Dismiss",
    openHistory: "Open history",
    back: "Back",
    toggleHistory: "Toggle history",
    errorTitleContent: "Add a title and at least 120 characters of article text.",
    errorEveryAnswer: "Choose an answer for every question.",
    errorGeneric: "Something went wrong",
    errorOpen: "Could not open article",
    errorSummarize: "Could not summarize article",
    errorQuiz: "Could not generate quiz",
    errorSubmit: "Could not submit quiz",
    language: "Language",
    english: "English",
    mongolian: "Монгол",
    regenerateQuiz: "New questions",
    quickTest: "Quick test",
    quickTestBody: "Take a quick test about your knowledge from your content.",
    quizCompleted: "Quiz completed",
    quizCompletedBody: "Let's see what you did.",
    yourScore: "Your score: {score} / {total}",
    yourAnswer: "Your answer: {answer}",
    correctAnswer: "Correct: {answer}",
    restartQuiz: "Restart quiz",
    saveAndLeave: "Save and leave",
    cancelConfirmTitle: "Are you sure?",
    cancelConfirmBody: "If you press 'Cancel', this quiz will restart from the beginning.",
    goBack: "Go back",
    cancelQuiz: "Cancel quiz",
    closeQuiz: "Close quiz",
  },
  mn: {
    appTitle: "Шалгалтын апп",
    signIn: "Нэвтрэх",
    signUp: "Бүртгүүлэх",
    welcomeTitle: "Нийтлэлээс шалгалт үүсгэгч",
    welcomeBody:
      "Нэвтэрч нийтлэл товчлох, шалгалт үүсгэх, түүхээ хадгалах боломжтой.",
    signInContinue: "Үргэлжлүүлэхийн тулд нэвтэрнэ үү",
    history: "Түүх",
    newSummary: "Шинэ товчлол",
    loadingHistory: "Түүх ачаалж байна…",
    emptyHistory: "Хадгалсан товчлолууд энд харагдана.",
    quizCount: "шалгалт",
    generatorTitle: "Нийтлэлээс шалгалт үүсгэгч",
    generatorBody:
      "Доор нийтлэлээ буулгаж товчлол болон шалгалтын асуулт үүсгэнэ үү. Нийтлэлүүд таны түүхэнд хадгалагдана.",
    articleTitle: "Нийтлэлийн гарчиг",
    articleTitlePlaceholder: "Гарчиг оруулна уу",
    articleContent: "Нийтлэлийн агуулга",
    articleContentPlaceholder: "Нийтлэлээ энд буулгана уу...",
    generateSummary: "Товчлол үүсгэх",
    summarizing: "Товчилж байна…",
    summarizedContent: "Товчилсон агуулга",
    seeSummary: "Товчлол харах",
    seeContent: "Агуулга харах",
    takeQuiz: "Шалгалт өгөх",
    knowledgeCheck: "Мэдлэг шалгах",
    testUnderstanding: "Ойлголтоо шалгаарай",
    readyQuiz: "Богино шалгалт өгөхөд бэлэн үү?",
    retake: "Дахин өгөх",
    quizEmpty: "Зөвхөн энэ нийтлэлд үндэслэн таван хүртэл асуулт үүсгэнэ.",
    generateQuiz: "Шалгалт үүсгэх",
    generating: "Үүсгэж байна…",
    perfectScore: "Төгс оноо!",
    niceWork: "Сайн байна!",
    keepLearning: "Үргэлжлүүлэн суралцаарай.",
    reviewAnswers: "Доорх хариултуудыг хянаад хүссэн үедээ дахин өгөөрэй.",
    questionOf: "Асуулт {n} / {total}",
    progressOf: "{n} / {total}",
    why: "Яагаад:",
    checkAnswers: "Хариултаа шалгах",
    checking: "Шалгаж байна…",
    dismiss: "Хаах",
    openHistory: "Түүх нээх",
    back: "Буцах",
    toggleHistory: "Түүх нээх/хаах",
    errorTitleContent: "Гарчиг болон дор хаяж 120 тэмдэгттэй нийтлэл оруулна уу.",
    errorEveryAnswer: "Бүх асуултад хариулт сонгоно уу.",
    errorGeneric: "Алдаа гарлаа",
    errorOpen: "Нийтлэл нээж чадсангүй",
    errorSummarize: "Нийтлэл товчилж чадсангүй",
    errorQuiz: "Шалгалт үүсгэж чадсангүй",
    errorSubmit: "Шалгалт илгээж чадсангүй",
    language: "Хэл",
    english: "English",
    mongolian: "Монгол",
    regenerateQuiz: "Шинэ асуулт",
    quickTest: "Шуурхай шалгалт",
    quickTestBody: "Агуулгаасаа мэдлэгээ хурдан шалгаарай.",
    quizCompleted: "Шалгалт дууслаа",
    quizCompletedBody: "Үр дүнгээ харцгаая.",
    yourScore: "Таны оноо: {score} / {total}",
    yourAnswer: "Таны хариулт: {answer}",
    correctAnswer: "Зөв: {answer}",
    restartQuiz: "Дахин эхлүүлэх",
    saveAndLeave: "Хадгалаад гарах",
    cancelConfirmTitle: "Итгэлтэй байна уу?",
    cancelConfirmBody: "Хэрэв 'Цуцлах' дарвал шалгалт эхнээсээ дахин эхэлнэ.",
    goBack: "Буцах",
    cancelQuiz: "Шалгалт цуцлах",
    closeQuiz: "Шалгалт хаах",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const STORAGE_KEY = "briefly-locale";
const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "mn") setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let value: string = translations[locale][key] ?? translations.en[key] ?? key;
      if (vars) {
        for (const [name, replacement] of Object.entries(vars)) {
          value = value.replaceAll(`{${name}}`, String(replacement));
        }
      }
      return value;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
