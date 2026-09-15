import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Dashboard } from "@/components/dashboard";

export default function Home() {
  return (
    <main className="quiz-app">
      <header className="app-header">
        <a className="app-title" href="/">Quiz app</a>
        <nav className="header-actions">
          <SignedOut>
            <SignInButton mode="modal"><button className="ui-button secondary">Sign in</button></SignInButton>
            <SignUpButton mode="modal"><button className="ui-button primary">Sign up</button></SignUpButton>
          </SignedOut>
          <SignedIn><UserButton appearance={{ elements: { avatarBox: "clerk-avatar" } }} /></SignedIn>
        </nav>
      </header>

      <SignedOut>
        <section className="auth-welcome">
          <div className="auth-card">
            <h1>Article Quiz Generator</h1>
            <p>Sign in to summarize articles, generate quizzes, and save your history.</p>
            <SignInButton mode="modal"><button className="ui-button primary">Sign in to continue</button></SignInButton>
          </div>
        </section>
      </SignedOut>

      <SignedIn><Dashboard /></SignedIn>
    </main>
  );
}
