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
        temperature: json ? 0.2 : 0.35,
        // Mongolian quiz JSON is longer; low limits often cut strings mid-way.
        maxOutputTokens: json ? 8192 : 1000,
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

function extractJsonArray(raw: string) {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini returned incomplete quiz JSON. Please try again.");
  }
  return cleaned.slice(start, end + 1);
}

function parseQuizJson(raw: string): unknown {
  try {
    return JSON.parse(extractJsonArray(raw));
  } catch {
    throw new Error(
      "Quiz JSON was cut off or invalid (Unterminated string). Please generate the quiz again.",
    );
  }
}

function outputLanguage(locale: "en" | "mn" = "en") {
  if (locale === "mn") {
    return `CRITICAL LANGUAGE RULE:
- The entire quiz MUST be written in Mongolian Cyrillic (монгол хэл).
- Translate every question, every option, and every explanation into Mongolian.
- Do NOT write English sentences. Proper nouns (Temüjin, Börte, Bekhter, etc.) may stay as names.
- Example question style: "Тэмүжин гэр бүлийнхээ дотор байр сууриа хэрхэн бэхжүүлсэн бэ?"`;
  }
  return `CRITICAL LANGUAGE RULE:
- The entire quiz MUST be written in English.
- Translate every question, every option, and every explanation into English if the article is not English.`;
}

export function summarizeArticle(
  title: string,
  content: string,
  locale: "en" | "mn" = "en",
) {
  const languageRule =
    locale === "mn"
      ? "Write the entire summary in Mongolian Cyrillic (монгол хэл). Translate from the article language if needed."
      : "Write the entire summary in English. Translate from the article language if needed.";

  return generate(`You are an expert study assistant. Summarize the article below accurately.

Requirements:
- ${languageRule}
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
  locale: "en" | "mn" = "en",
): Promise<GeneratedQuestion[]> {
  const languageName = locale === "mn" ? "Mongolian Cyrillic" : "English";
  const prompt = `Create exactly 5 multiple-choice questions from this article.

Output language: ${languageName}
${outputLanguage(locale)}

Return ONLY a valid JSON array (no markdown). Keep explanations short (1 sentence).
Every object must have this shape:
{
  "question": "question text in ${languageName}",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0,
  "explanation": "short explanation in ${languageName}"
}

Rules:
- question, options, and explanation must ALL be in ${languageName}.
- Exactly four options per question.
- correctIndex is an integer from 0 to 3.
- Do not truncate JSON. Close every string and bracket.
- Test understanding from the article only.

Title: ${title}
Summary: ${summary}
Article: ${content}`;

  let raw = await generate(prompt, true);
  let parsed: unknown;
  try {
    parsed = parseQuizJson(raw);
  } catch {
    // One retry: model sometimes truncates Mongolian JSON mid-string.
    raw = await generate(prompt, true);
    parsed = parseQuizJson(raw);
  }

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
