import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ quizId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { quizId } = await context.params;
    const body = (await request.json()) as { answers?: Record<string, number> };
    const answers = body.answers ?? {};
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, article: { userId } },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    if (quiz.questions.some((question) => !Number.isInteger(answers[question.id]))) {
      return NextResponse.json({ error: "Answer every question first" }, { status: 400 });
    }

    const results = quiz.questions.map((question) => {
      const selectedIndex = answers[question.id];
      return {
        questionId: question.id,
        selectedIndex,
        correctIndex: question.correctIndex,
        correct: selectedIndex === question.correctIndex,
        explanation: question.explanation,
      };
    });
    const score = results.filter((result) => result.correct).length;

    const attempt = await prisma.quizAttempt.create({
      data: { quizId, userId, score, total: results.length, answers },
    });

    return NextResponse.json({ attemptId: attempt.id, score, total: results.length, results });
  } catch (error) {
    console.error("POST quiz attempt", error);
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}
