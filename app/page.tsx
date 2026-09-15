"use client";

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Dashboard } from "@/components/dashboard";
import { LanguageSelector } from "@/components/language-selector";
import { I18nProvider, useI18n } from "@/lib/i18n";

function HomeContent() {
  const { t } = useI18n();

  return (
    <main className="quiz-app">
      <header className="app-header">
        <a className="app-title" href="/">{t("appTitle")}</a>
        <nav className="header-actions">
          <LanguageSelector />
          <SignedOut>
            <SignInButton mode="modal"><button className="ui-button secondary">{t("signIn")}</button></SignInButton>
            <SignUpButton mode="modal"><button className="ui-button primary">{t("signUp")}</button></SignUpButton>
          </SignedOut>
          <SignedIn><UserButton appearance={{ elements: { avatarBox: "clerk-avatar" } }} /></SignedIn>
        </nav>
      </header>

      <SignedOut>
        <section className="auth-welcome">
          <div className="auth-card">
            <h1>{t("welcomeTitle")}</h1>
            <p>{t("welcomeBody")}</p>
            <SignInButton mode="modal"><button className="ui-button primary">{t("signInContinue")}</button></SignInButton>
          </div>
        </section>
      </SignedOut>

      <SignedIn><Dashboard /></SignedIn>
    </main>
  );
}

export default function Home() {
  return (
    <I18nProvider>
      <HomeContent />
    </I18nProvider>
  );
}
