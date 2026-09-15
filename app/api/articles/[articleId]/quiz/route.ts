import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQuiz } from "@/lib/gemini";

export async function POST(
  request: Request,
  context: { params: Promise<{ articleId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { articleId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { locale?: string };
    const locale = body.locale === "mn" ? "mn" : "en";
    const article = await prisma.article.findFirst({ where: { id: articleId, userId } });
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

    const generated = await generateQuiz(article.title, article.content, article.summary, locale);
    const quiz = await prisma.quiz.create({
      data: {
        articleId,
        questions: {
          create: generated.map((question, order) => ({
            prompt: question.question,
            options: question.options,
            correctIndex: question.correctIndex,
            explanation: question.explanation,
            order,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
          select: { id: true, prompt: true, options: true, order: true },
        },
      },
    });

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    console.error("POST article quiz", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate quiz" },
      { status: 500 },
    );
  }
}
