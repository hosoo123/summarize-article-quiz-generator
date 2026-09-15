const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

export type GeneratedQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

async function generate(prompt: string, json = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const response = await fetch(`${API_ROOT}/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: json ? 0.25 : 0.35,
        maxOutputTokens: json ? 2200 : 1000,
        ...(json ? { responseMimeType: "application/json" } : {}),
      },
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as GeminiResponse;
  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini request failed (${response.status})`);
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

export function summarizeArticle(title: string, content: string) {
  return generate(`You are an expert study assistant. Summarize the article below accurately.

Requirements:
- Keep the original language of the article.
- Start with a concise overview.
- Then list 3-6 important points using bullets.
- Preserve important names, dates, numbers, and conclusions.
- Do not invent facts that are not in the source.

Title: ${title}

Article:
${content}`);
}

export async function generateQuiz(
  title: string,
  content: string,
  summary: string,
): Promise<GeneratedQuestion[]> {
  const raw = await generate(`Create exactly 5 multiple-choice questions from this article.

Return ONLY a JSON array. Every object must have this shape:
{
  "question": "question text",
  "options": ["option A", "option B", "option C", "option D"],
  "correctIndex": 0,
  "explanation": "short explanation based on the article"
}

Rules:
- Use the same language as the article.
- Include exactly four plausible options per question.
- correctIndex must be an integer from 0 to 3.
- Test understanding, not trivia outside the article.
- Do not use trick questions.

Title: ${title}
Summary: ${summary}
Article: ${content}`, true);

  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed: unknown = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("Gemini returned an invalid quiz");

  const questions = parsed.slice(0, 5).map((item) => {
    const value = item as Partial<GeneratedQuestion>;
    if (
      typeof value.question !== "string" ||
      !Array.isArray(value.options) ||
      value.options.length !== 4 ||
      !value.options.every((option) => typeof option === "string") ||
      !Number.isInteger(value.correctIndex) ||
      Number(value.correctIndex) < 0 ||
      Number(value.correctIndex) > 3
    ) {
      throw new Error("Gemini returned a malformed question");
    }
    return {
      question: value.question,
      options: value.options,
      correctIndex: Number(value.correctIndex),
      explanation:
        typeof value.explanation === "string"
          ? value.explanation
          : "See the source article for this answer.",
    };
  });

  if (questions.length === 0) throw new Error("Gemini did not generate questions");
  return questions;
}
