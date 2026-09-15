import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { summarizeArticle } from "@/lib/gemini";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const articles = await prisma.article.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      summary: true,
      createdAt: true,
      _count: { select: { quizzes: true } },
    },
  });

  return NextResponse.json({ articles });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as { title?: string; content?: string };
    const title = body.title?.trim();
    const content = body.content?.trim();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Article title and content are required" },
        { status: 400 },
      );
    }
    if (content.length < 120) {
      return NextResponse.json(
        { error: "Article must contain at least 120 characters" },
        { status: 400 },
      );
    }
    if (content.length > 30000) {
      return NextResponse.json(
        { error: "Article is too long (maximum 30,000 characters)" },
        { status: 400 },
      );
    }

    const summary = await summarizeArticle(title, content);
    const article = await prisma.article.create({
      data: { userId, title, content, summary },
      include: { quizzes: { include: { questions: { orderBy: { order: "asc" } } } } },
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error("POST /api/articles", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to summarize article" },
      { status: 500 },
    );
  }
}
