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
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<"summary" | "quiz" | "submit" | null>(null);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const quizSyncKey = useRef<string | null>(null);

  const loadArticles = useCallback(async () => {
    const data = await readJson(await fetch("/api/articles", { cache: "no-store" }), t("errorGeneric"));
    setArticles(data.articles);
  }, [t]);

  useEffect(() => {
    loadArticles().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [loadArticles]);

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
      setTitle("");
      setContent("");
      await loadArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorSummarize"));
    } finally {
      setWorking(null);
    }
  };

  const createQuiz = useCallback(async () => {
    if (!selected) return;
    setWorking("quiz");
    setError("");
    try {
      const data = await readJson(await fetch(`/api/articles/${selected.id}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      }), t("errorGeneric"));
      setActiveQuiz(data.quiz);
      setSelected((current) => current ? { ...current, quizzes: [data.quiz, ...current.quizzes] } : current);
      setAnswers({});
      setResults(null);
      await loadArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorQuiz"));
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
    void createQuiz();
  }, [locale, selected, activeQuiz, createQuiz, working]);

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    if (Object.keys(answers).length !== activeQuiz.questions.length) {
      setError(t("errorEveryAnswer"));
      return;
    }
    setWorking("submit");
    setError("");
    try {
      const data = await readJson(await fetch(`/api/quizzes/${activeQuiz.id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      }), t("errorGeneric"));
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorSubmit"));
    } finally {
      setWorking(null);
    }
  };

  const score = useMemo(() => results?.filter((item) => item.correct).length ?? 0, [results]);
  const dateLocale = locale === "mn" ? "mn-MN" : "en-US";

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-is-open" : ""}`}>
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="history-toggle" onClick={() => setSidebarOpen((current) => !current)} aria-label={t("toggleHistory")}>
          <History size={24} />
          <span>{t("history")}</span>
        </button>
        <button className="new-button" onClick={() => { setSelected(null); setActiveQuiz(null); setError(""); setSidebarOpen(false); }}>
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

        {!selected ? (
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
        ) : (
          <div className="article-view">
            <button className="back-square" onClick={() => { setSelected(null); setActiveQuiz(null); setShowSource(false); }} aria-label={t("back")}><ChevronLeft size={16} /></button>
            <article className="summary-card figma-summary">
              <div className="summary-label"><BookOpen size={16} /> {t("summarizedContent")}</div>
              <h1>{selected.title}</h1>
              <div className="summary-text">{showSource ? selected.content : selected.summary}</div>
              <div className="summary-actions">
                <button className="ui-button secondary" onClick={() => setShowSource((current) => !current)}>{showSource ? t("seeSummary") : t("seeContent")}</button>
                <button className="ui-button primary" disabled={working !== null} onClick={createQuiz}>
                  {working === "quiz" ? <><LoaderCircle className="spin" size={16} /> {t("generating")}</> : activeQuiz ? t("regenerateQuiz") : t("takeQuiz")}
                </button>
              </div>
            </article>

            <section className="quiz-section" id="quiz">
              <div className="quiz-heading"><div><p className="kicker">{t("knowledgeCheck")}</p><h2>{activeQuiz ? t("testUnderstanding") : t("readyQuiz")}</h2></div>{activeQuiz ? <button className="button ghost" onClick={() => { setAnswers({}); setResults(null); }}><RotateCcw size={17} /> {t("retake")}</button> : null}</div>
              {!activeQuiz || working === "quiz" ? (
                <div className="quiz-empty"><BrainIcon /><p>{working === "quiz" ? t("generating") : t("quizEmpty")}</p>{working !== "quiz" ? <button className="ui-button primary" disabled={working !== null} onClick={createQuiz}>{t("generateQuiz")} <ChevronRight size={18} /></button> : <LoaderCircle className="spin" size={24} />}</div>
              ) : (
                <div className="question-list">
                  {results ? <div className="score-card"><div className="score-ring">{score}/{results.length}</div><div><h3>{score === results.length ? t("perfectScore") : score >= results.length * 0.6 ? t("niceWork") : t("keepLearning")}</h3><p>{t("reviewAnswers")}</p></div></div> : null}
                  {activeQuiz.questions.map((question, index) => {
                    const result = results?.find((item) => item.questionId === question.id);
                    return <article className="question-card" key={question.id}><p className="question-number">{t("questionOf", { n: index + 1, total: activeQuiz.questions.length })}</p><h3>{question.prompt}</h3><div className="options">{question.options.map((option, optionIndex) => {
                      const selectedOption = answers[question.id] === optionIndex;
                      const correct = result?.correctIndex === optionIndex;
                      const wrong = Boolean(result && selectedOption && !result.correct);
                      return <button key={option} disabled={Boolean(results)} className={`${selectedOption ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`} onClick={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}{correct ? <Check size={18} /> : wrong ? <X size={18} /> : null}</button>;
                    })}</div>{result && !result.correct ? <p className="explanation"><strong>{t("why")}</strong> {result.explanation}</p> : null}</article>;
                  })}
                  {!results ? <button className="ui-button primary submit-button" disabled={working !== null} onClick={submitQuiz}>{working === "submit" ? <><LoaderCircle className="spin" size={18} /> {t("checking")}</> : t("checkAnswers")}</button> : null}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

function BrainIcon() {
  return <div className="brain-icon"><Sparkles size={27} /></div>;
}
