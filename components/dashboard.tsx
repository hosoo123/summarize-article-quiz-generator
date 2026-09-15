"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  LoaderCircle,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";

type ArticleListItem = {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  _count: { quizzes: number };
};

type Question = { id: string; prompt: string; options: string[]; order: number };
type Quiz = { id: string; createdAt: string; questions: Question[] };
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

async function readJson(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

export function Dashboard() {
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

  const loadArticles = useCallback(async () => {
    const data = await readJson(await fetch("/api/articles", { cache: "no-store" }));
    setArticles(data.articles);
  }, []);

  useEffect(() => {
    loadArticles().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [loadArticles]);

  const openArticle = async (id: string) => {
    setError("");
    setLoading(true);
    try {
      const data = await readJson(await fetch(`/api/articles/${id}`, { cache: "no-store" }));
      setSelected(data.article);
      const quiz = data.article.quizzes?.[0] ?? null;
      setActiveQuiz(quiz);
      setAnswers({});
      setResults(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open article");
    } finally {
      setLoading(false);
    }
  };

  const createSummary = async () => {
    if (!title.trim() || content.trim().length < 120) {
      setError("Add a title and at least 120 characters of article text.");
      return;
    }
    setWorking("summary");
    setError("");
    try {
      const data = await readJson(await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      }));
      setSelected(data.article);
      setActiveQuiz(null);
      setAnswers({});
      setResults(null);
      setTitle("");
      setContent("");
      await loadArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not summarize article");
    } finally {
      setWorking(null);
    }
  };

  const createQuiz = async () => {
    if (!selected) return;
    setWorking("quiz");
    setError("");
    try {
      const data = await readJson(await fetch(`/api/articles/${selected.id}/quiz`, { method: "POST" }));
      setActiveQuiz(data.quiz);
      setSelected((current) => current ? { ...current, quizzes: [data.quiz, ...current.quizzes] } : current);
      setAnswers({});
      setResults(null);
      await loadArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate quiz");
    } finally {
      setWorking(null);
    }
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    if (Object.keys(answers).length !== activeQuiz.questions.length) {
      setError("Choose an answer for every question.");
      return;
    }
    setWorking("submit");
    setError("");
    try {
      const data = await readJson(await fetch(`/api/quizzes/${activeQuiz.id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      }));
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit quiz");
    } finally {
      setWorking(null);
    }
  };

  const score = useMemo(() => results?.filter((item) => item.correct).length ?? 0, [results]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="sidebar-label">Workspace</p>
          <button className="new-button" onClick={() => { setSelected(null); setActiveQuiz(null); setError(""); }}>
            <Plus size={18} /> New summary
          </button>
        </div>
        <div className="history-heading"><span><Clock3 size={16} /> History</span><small>{articles.length}</small></div>
        <div className="history-list">
          {loading && articles.length === 0 ? <p className="muted">Loading history…</p> : null}
          {!loading && articles.length === 0 ? <p className="empty-copy">Your saved summaries will appear here.</p> : null}
          {articles.map((article) => (
            <button key={article.id} className={`history-item ${selected?.id === article.id ? "active" : ""}`} onClick={() => openArticle(article.id)}>
              <FileText size={17} />
              <span><strong>{article.title}</strong><small>{new Date(article.createdAt).toLocaleDateString()} · {article._count.quizzes} quiz</small></span>
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
      </aside>

      <section className="workspace">
        {error ? <div className="error-banner"><X size={17} />{error}<button onClick={() => setError("")} aria-label="Dismiss"><X size={15} /></button></div> : null}

        {!selected ? (
          <div className="composer">
            <div className="eyebrow"><Sparkles size={15} /> New study material</div>
            <h1>Turn an article into<br /><em>something memorable.</em></h1>
            <p>Paste your source below. Briefly will create a clear summary, then help you test what you learned.</p>
            <div className="form-card">
              <label>Article title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. How sleep shapes memory" maxLength={180} /></label>
              <label>Article text<textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Paste the complete article here…" /></label>
              <div className="form-footer"><small>{content.length.toLocaleString()} / 30,000 characters</small><button className="button primary" disabled={working !== null} onClick={createSummary}>{working === "summary" ? <><LoaderCircle className="spin" size={18} /> Summarizing…</> : <>Create summary <Sparkles size={18} /></>}</button></div>
            </div>
          </div>
        ) : (
          <div className="article-view">
            <button className="back-link" onClick={() => { setSelected(null); setActiveQuiz(null); }}><ArrowLeft size={17} /> New article</button>
            <div className="article-heading"><div><p className="kicker">Saved summary</p><h1>{selected.title}</h1><p>{new Date(selected.createdAt).toLocaleString()}</p></div><BookOpen size={28} /></div>
            <article className="summary-card"><div className="section-title"><span><Sparkles size={19} /> AI summary</span></div><div className="summary-text">{selected.summary}</div></article>

            <section className="quiz-section">
              <div className="quiz-heading"><div><p className="kicker">Knowledge check</p><h2>{activeQuiz ? "Test your understanding" : "Ready for a quick quiz?"}</h2></div>{activeQuiz ? <button className="button ghost" onClick={() => { setAnswers({}); setResults(null); }}><RotateCcw size={17} /> Retake</button> : null}</div>
              {!activeQuiz ? (
                <div className="quiz-empty"><BrainIcon /><p>Generate up to five questions based only on this article.</p><button className="button primary" disabled={working !== null} onClick={createQuiz}>{working === "quiz" ? <><LoaderCircle className="spin" size={18} /> Generating…</> : <>Generate quiz <ChevronRight size={18} /></>}</button></div>
              ) : (
                <div className="question-list">
                  {results ? <div className="score-card"><div className="score-ring">{score}/{results.length}</div><div><h3>{score === results.length ? "Perfect score!" : score >= results.length * 0.6 ? "Nice work!" : "Keep learning."}</h3><p>Review each answer below, then retake the quiz whenever you are ready.</p></div></div> : null}
                  {activeQuiz.questions.map((question, index) => {
                    const result = results?.find((item) => item.questionId === question.id);
                    return <article className="question-card" key={question.id}><p className="question-number">Question {index + 1} of {activeQuiz.questions.length}</p><h3>{question.prompt}</h3><div className="options">{question.options.map((option, optionIndex) => {
                      const selectedOption = answers[question.id] === optionIndex;
                      const correct = result?.correctIndex === optionIndex;
                      const wrong = Boolean(result && selectedOption && !result.correct);
                      return <button key={option} disabled={Boolean(results)} className={`${selectedOption ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`} onClick={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}{correct ? <Check size={18} /> : wrong ? <X size={18} /> : null}</button>;
                    })}</div>{result && !result.correct ? <p className="explanation"><strong>Why:</strong> {result.explanation}</p> : null}</article>;
                  })}
                  {!results ? <button className="button primary submit-button" disabled={working !== null} onClick={submitQuiz}>{working === "submit" ? <><LoaderCircle className="spin" size={18} /> Checking…</> : "Check my answers"}</button> : null}
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
