"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronRight,
  ChevronLeft,
  FileText,
  History,
  LoaderCircle,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

type ArticleListItem = {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  _count: { quizzes: number };
};

type Question = { id: string; prompt: string; options: string[]; order: number };
type Quiz = { id: string; createdAt: string; questions: Question[] };

function detectQuizLocale(quiz: Quiz): "en" | "mn" {
  const sample = quiz.questions.map((question) => question.prompt).join(" ");
  return /[\u0400-\u04FF]/.test(sample) ? "mn" : "en";
}

type Article = {
  id: string;
  title: string;
  content: string;
  summary: string;
  createdAt: string;
  quizzes: Quiz[];
};

type Result = {
  questionId: string;
  selectedIndex: number;
  correctIndex: number;
  correct: boolean;
  explanation: string;
};

type Screen = "compose" | "summary" | "quiz" | "results";

async function readJson(response: Response, fallbackError: string) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || fallbackError);
  return data;
}

export function Dashboard() {
  const { t, locale } = useI18n();
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [selected, setSelected] = useState<Article | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Result[] | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [screen, setScreen] = useState<Screen>("compose");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<"summary" | "quiz" | "submit" | null>(null);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const quizSyncKey = useRef<string | null>(null);

  const loadArticles = useCallback(async () => {
    const data = await readJson(await fetch("/api/articles", { cache: "no-store" }), t("errorGeneric"));
    setArticles(data.articles);
  }, [t]);

  useEffect(() => {
    loadArticles().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [loadArticles]);

  const resetToCompose = () => {
    setSelected(null);
    setActiveQuiz(null);
    setAnswers({});
    setResults(null);
    setQuestionIndex(0);
    setShowSource(false);
    setCancelOpen(false);
    setScreen("compose");
    setError("");
  };

  const leaveQuizToSummary = () => {
    setAnswers({});
    setResults(null);
    setQuestionIndex(0);
    setCancelOpen(false);
    setScreen("summary");
  };

  const openArticle = async (id: string) => {
    setError("");
    setLoading(true);
    try {
      const data = await readJson(await fetch(`/api/articles/${id}`, { cache: "no-store" }), t("errorGeneric"));
      setSelected(data.article);
      const quiz = data.article.quizzes?.[0] ?? null;
      setActiveQuiz(quiz);
      setAnswers({});
      setResults(null);
      setQuestionIndex(0);
      setShowSource(false);
      setCancelOpen(false);
      setScreen("summary");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorOpen"));
    } finally {
      setLoading(false);
    }
  };

  const createSummary = async () => {
    if (!title.trim() || content.trim().length < 120) {
      setError(t("errorTitleContent"));
      return;
    }
    setWorking("summary");
    setError("");
    try {
      const data = await readJson(await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, locale }),
      }), t("errorGeneric"));
      setSelected(data.article);
      setActiveQuiz(null);
      setAnswers({});
      setResults(null);
      setQuestionIndex(0);
      setShowSource(false);
      setTitle("");
      setContent("");
      setScreen("summary");
      await loadArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorSummarize"));
    } finally {
      setWorking(null);
    }
  };

  const createQuiz = useCallback(async (startAfter = false) => {
    if (!selected) return null;
    setWorking("quiz");
    setError("");
    try {
      const data = await readJson(await fetch(`/api/articles/${selected.id}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      }), t("errorGeneric"));
      setActiveQuiz(data.quiz);
      setSelected((current) => (current ? { ...current, quizzes: [data.quiz, ...current.quizzes] } : current));
      setAnswers({});
      setResults(null);
      setQuestionIndex(0);
      await loadArticles();
      if (startAfter) setScreen("quiz");
      return data.quiz as Quiz;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorQuiz"));
      return null;
    } finally {
      setWorking(null);
    }
  }, [selected, locale, t, loadArticles]);

  useEffect(() => {
    if (!selected || !activeQuiz || working === "quiz") return;
    if (detectQuizLocale(activeQuiz) === locale) {
      quizSyncKey.current = `${selected.id}:${locale}`;
      return;
    }
    const key = `${selected.id}:${locale}`;
    if (quizSyncKey.current === key) return;
    quizSyncKey.current = key;
    void createQuiz(screen === "quiz" || screen === "results");
  }, [locale, selected, activeQuiz, createQuiz, working, screen]);

  const submitQuiz = useCallback(async (finalAnswers: Record<string, number>) => {
    if (!activeQuiz) return;
    if (Object.keys(finalAnswers).length !== activeQuiz.questions.length) {
      setError(t("errorEveryAnswer"));
      return;
    }
    setWorking("submit");
    setError("");
    try {
      const data = await readJson(await fetch(`/api/quizzes/${activeQuiz.id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers }),
      }), t("errorGeneric"));
      setResults(data.results);
      setScreen("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorSubmit"));
    } finally {
      setWorking(null);
    }
  }, [activeQuiz, t]);

  const startQuiz = async () => {
    if (!selected) return;
    setCancelOpen(false);
    setAnswers({});
    setResults(null);
    setQuestionIndex(0);
    if (!activeQuiz) {
      await createQuiz(true);
      return;
    }
    setScreen("quiz");
  };

  const chooseAnswer = (questionId: string, optionIndex: number) => {
    if (!activeQuiz || working === "submit") return;
    const nextAnswers = { ...answers, [questionId]: optionIndex };
    setAnswers(nextAnswers);
    if (questionIndex < activeQuiz.questions.length - 1) {
      setQuestionIndex((current) => current + 1);
      return;
    }
    void submitQuiz(nextAnswers);
  };

  const restartQuiz = () => {
    setAnswers({});
    setResults(null);
    setQuestionIndex(0);
    setCancelOpen(false);
    setScreen("quiz");
  };

  const score = useMemo(() => results?.filter((item) => item.correct).length ?? 0, [results]);
  const dateLocale = locale === "mn" ? "mn-MN" : "en-US";
  const currentQuestion = activeQuiz?.questions[questionIndex] ?? null;

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-is-open" : ""}`}>
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="history-toggle" onClick={() => setSidebarOpen((current) => !current)} aria-label={t("toggleHistory")}>
          <History size={24} />
          <span>{t("history")}</span>
        </button>
        <button className="new-button" onClick={() => { resetToCompose(); setSidebarOpen(false); }}>
          <Plus size={16} /> <span>{t("newSummary")}</span>
        </button>
        <div className="history-list">
          {loading && articles.length === 0 ? <p className="muted">{t("loadingHistory")}</p> : null}
          {!loading && articles.length === 0 ? <p className="empty-copy">{t("emptyHistory")}</p> : null}
          {articles.map((article) => (
            <button key={article.id} className={`history-item ${selected?.id === article.id ? "active" : ""}`} onClick={() => { openArticle(article.id); setSidebarOpen(false); }}>
              <FileText size={17} />
              <span><strong>{article.title}</strong><small>{new Date(article.createdAt).toLocaleDateString(dateLocale)} · {article._count.quizzes} {t("quizCount")}</small></span>
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
      </aside>

      <section className="workspace">
        {error ? <div className="error-banner"><X size={17} />{error}<button onClick={() => setError("")} aria-label={t("dismiss")}><X size={15} /></button></div> : null}

        {screen === "compose" ? (
          <div className="composer">
            <button className="back-square" onClick={() => setSidebarOpen(true)} aria-label={t("openHistory")}><ChevronLeft size={16} /></button>
            <div className="form-card">
              <div className="generator-header">
                <h1><Sparkles size={32} /> {t("generatorTitle")}</h1>
                <p>{t("generatorBody")}</p>
              </div>
              <label><span><FileText size={15} /> {t("articleTitle")}</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t("articleTitlePlaceholder")} maxLength={180} /></label>
              <label><span><FileText size={15} /> {t("articleContent")}</span><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder={t("articleContentPlaceholder")} /></label>
              <div className="form-footer"><small>{content.length.toLocaleString(dateLocale)} / 30,000</small><button className="ui-button primary" disabled={working !== null} onClick={createSummary}>{working === "summary" ? <><LoaderCircle className="spin" size={16} /> {t("summarizing")}</> : t("generateSummary")}</button></div>
            </div>
          </div>
        ) : null}

        {screen === "summary" && selected ? (
          <div className="composer">
            <button className="back-square" onClick={resetToCompose} aria-label={t("back")}><ChevronLeft size={16} /></button>
            <article className="summary-card figma-summary">
              <div className="summary-label"><BookOpen size={16} /> {t("summarizedContent")}</div>
              <h1>{selected.title}</h1>
              <div className="summary-text">{showSource ? selected.content : selected.summary}</div>
              <div className="summary-actions">
                <button className="ui-button secondary" onClick={() => setShowSource((current) => !current)}>{showSource ? t("seeSummary") : t("seeContent")}</button>
                <button className="ui-button primary" disabled={working !== null} onClick={startQuiz}>
                  {working === "quiz" ? <><LoaderCircle className="spin" size={16} /> {t("generating")}</> : t("takeQuiz")}
                </button>
              </div>
            </article>
          </div>
        ) : null}

        {screen === "quiz" && activeQuiz && currentQuestion ? (
          <div className="composer quiz-stage">
            <div className="quiz-card">
              <div className="quiz-card-header">
                <div>
                  <h1><Sparkles size={22} /> {t("quickTest")}</h1>
                  <p>{t("quickTestBody")}</p>
                </div>
                <button className="quiz-close" onClick={() => setCancelOpen(true)} aria-label={t("closeQuiz")}><X size={18} /></button>
              </div>
              <div className="quiz-panel">
                <div className="quiz-question-row">
                  <h2>{currentQuestion.prompt}</h2>
                  <span>{t("progressOf", { n: questionIndex + 1, total: activeQuiz.questions.length })}</span>
                </div>
                <div className="options quiz-options">
                  {currentQuestion.options.map((option, optionIndex) => (
                    <button
                      key={`${currentQuestion.id}-${optionIndex}`}
                      disabled={working === "submit"}
                      className={answers[currentQuestion.id] === optionIndex ? "selected" : ""}
                      onClick={() => chooseAnswer(currentQuestion.id, optionIndex)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {working === "submit" ? <p className="quiz-checking"><LoaderCircle className="spin" size={16} /> {t("checking")}</p> : null}
              </div>
            </div>

            {cancelOpen ? (
              <div className="modal-backdrop" role="presentation">
                <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-quiz-title">
                  <h3 id="cancel-quiz-title">{t("cancelConfirmTitle")}</h3>
                  <p>{t("cancelConfirmBody")}</p>
                  <div className="confirm-actions">
                    <button className="ui-button primary" onClick={() => setCancelOpen(false)}>{t("goBack")}</button>
                    <button className="ui-button danger" onClick={leaveQuizToSummary}>{t("cancelQuiz")}</button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {screen === "results" && activeQuiz && results ? (
          <div className="composer">
            <div className="quiz-card results-card">
              <div className="quiz-card-header">
                <div>
                  <h1><Sparkles size={22} /> {t("quizCompleted")}</h1>
                  <p>{t("quizCompletedBody")}</p>
                </div>
              </div>
              <h2 className="score-line">{t("yourScore", { score, total: results.length })}</h2>
              <div className="result-list">
                {activeQuiz.questions.map((question) => {
                  const result = results.find((item) => item.questionId === question.id);
                  if (!result) return null;
                  const selectedAnswer = question.options[result.selectedIndex] ?? "—";
                  const correctAnswer = question.options[result.correctIndex] ?? "—";
                  return (
                    <div className={`result-item ${result.correct ? "correct" : "wrong"}`} key={question.id}>
                      <span className="result-icon">{result.correct ? <Check size={14} /> : <X size={14} />}</span>
                      <div>
                        <strong>{question.prompt}</strong>
                        <p>{t("yourAnswer", { answer: selectedAnswer })}</p>
                        {!result.correct ? <p className="correct-line">{t("correctAnswer", { answer: correctAnswer })}</p> : null}
                        {result.explanation ? <p className="why-line"><strong>{t("why")}</strong> {result.explanation}</p> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="summary-actions results-actions">
                <button className="ui-button secondary" onClick={restartQuiz}><RotateCcw size={16} /> {t("restartQuiz")}</button>
                <button className="ui-button primary" onClick={leaveQuizToSummary}><Save size={16} /> {t("saveAndLeave")}</button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
