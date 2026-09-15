# Briefly — Summarize Article & Quiz Generator

Briefly is a full-stack Next.js application that turns an article into an AI summary and a five-question multiple-choice quiz. Users authenticate with Clerk, and their articles, quizzes, and quiz attempts are stored in PostgreSQL through Prisma.

## Features

- Clerk email/social authentication
- Gemini article summarization
- Gemini-generated multiple-choice quizzes
- Per-user article and quiz history
- Quiz scoring, correct answers, and explanations
- Responsive dashboard

## Local setup

1. Install packages:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your own values.

3. Create the database tables:

```bash
npx prisma db push
```

4. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Server-only PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public Clerk frontend identifier |
| `CLERK_SECRET_KEY` | Server-only Clerk secret |
| `GEMINI_API_KEY` | Server-only Google AI Studio API key |
| `GEMINI_MODEL` | Optional Gemini model override |

Never commit `.env.local` or paste secret keys into client components.

## Deploying to Vercel

Add all required environment variables in **Vercel → Project Settings → Environment Variables**, then deploy. Run `npx prisma db push` once against the production `DATABASE_URL` before using the app.

## Application flow

1. The user signs in through Clerk.
2. The browser sends an article to `POST /api/articles`.
3. The server asks Gemini for a summary and saves it with Prisma.
4. `POST /api/articles/[articleId]/quiz` generates and stores five questions.
5. `POST /api/quizzes/[quizId]/attempts` checks answers on the server and saves the score.
