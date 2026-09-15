import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { ArrowRight, BookOpen, BrainCircuit, Sparkles } from "lucide-react";
import { Dashboard } from "@/components/dashboard";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Briefly home">
          <span className="brand-mark"><Sparkles size={18} /></span>
          Briefly
        </a>
        <nav className="header-actions">
          <SignedOut>
            <SignInButton mode="modal"><button className="button ghost">Sign in</button></SignInButton>
            <SignUpButton mode="modal"><button className="button primary">Get started</button></SignUpButton>
          </SignedOut>
          <SignedIn><UserButton /></SignedIn>
        </nav>
      </header>

      <SignedOut>
        <section className="hero" id="top">
          <div className="eyebrow"><Sparkles size={15} /> Your AI study companion</div>
          <h1>Read less.<br /><em>Understand more.</em></h1>
          <p className="hero-copy">
            Turn a long article into a focused summary and a five-question quiz in seconds.
            Save your work, test your understanding, and return whenever you need it.
          </p>
          <SignUpButton mode="modal">
            <button className="button primary hero-button">Summarize an article <ArrowRight size={18} /></button>
          </SignUpButton>
          <div className="feature-row">
            <article><BookOpen /><h3>Clear summaries</h3><p>Keep the essential facts, arguments, names, and dates.</p></article>
            <article><BrainCircuit /><h3>Useful quizzes</h3><p>Generate questions that test real understanding.</p></article>
            <article><Sparkles /><h3>Saved history</h3><p>Reopen an article or retake a previous quiz anytime.</p></article>
          </div>
        </section>
      </SignedOut>

      <SignedIn><Dashboard /></SignedIn>
    </main>
  );
}
