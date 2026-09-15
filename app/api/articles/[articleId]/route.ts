import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ articleId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { articleId } = await context.params;
  const article = await prisma.article.findFirst({
    where: { id: articleId, userId },
    include: {
      quizzes: {
        orderBy: { createdAt: "desc" },
        include: {
          questions: {
            orderBy: { order: "asc" },
            select: { id: true, prompt: true, options: true, order: true },
          },
        },
      },
    },
  });

  if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
  return NextResponse.json({ article });
}
