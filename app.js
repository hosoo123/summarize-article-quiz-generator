const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "if",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "as",
  "by",
  "with",
  "from",
  "that",
  "this",
  "these",
  "those",
  "it",
  "its",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "has",
  "have",
  "had",
  "do",
  "does",
  "did",
  "not",
  "no",
  "nor",
  "so",
  "than",
  "then",
  "too",
  "very",
  "can",
  "could",
  "should",
  "would",
  "will",
  "just",
  "about",
  "into",
  "over",
  "after",
  "before",
  "they",
  "them",
  "their",
  "we",
  "our",
  "you",
  "your",
  "he",
  "she",
  "his",
  "her",
  "i",
  "me",
  "my",
]);

const SAMPLE_ARTICLE = `Honeybees are disappearing from many farms, and scientists say the cause is not one single problem. Pesticides can confuse a bee's sense of direction. Parasites weaken hives during winter. Cities also remove wildflowers that bees use for food.

A healthy hive can hold more than 40,000 bees in summer. Each worker may visit thousands of flowers in a single day. When bees move pollen from plant to plant, apples, almonds, and many vegetables can grow. Without that work, some harvests shrink and food prices rise.

Beekeepers now plant flower strips beside fields and reduce spraying while crops bloom. A few cities have started rooftop hives so bees can feed on garden plants. Researchers are also breeding bees that survive parasites better.

The lesson is practical: protect the insects that feed us, and farms stay more stable. Small changes around fields can keep hives alive through the next season.`;

const articleEl = document.getElementById("article");
const wordCountEl = document.getElementById("word-count");
const lengthEl = document.getElementById("length");
const lengthValueEl = document.getElementById("length-value");
const generateBtn = document.getElementById("generate-btn");
const sampleBtn = document.getElementById("sample-btn");
const errorEl = document.getElementById("error");
const emptyStateEl = document.getElementById("empty-state");
const resultsEl = document.getElementById("results");
const summaryEl = document.getElementById("summary");
const quizForm = document.getElementById("quiz-form");
const scoreEl = document.getElementById("score");
const resetQuizBtn = document.getElementById("reset-quiz");

let currentQuiz = [];

function words(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff\u1800-\u18af'-]+/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => words(sentence).length >= 6);
}

function wordFrequencies(sentences) {
  const freq = new Map();
  sentences.forEach((sentence) => {
    words(sentence).forEach((word) => {
      if (STOP_WORDS.has(word) || word.length < 3) return;
      freq.set(word, (freq.get(word) || 0) + 1);
    });
  });
  return freq;
}

function scoreSentence(sentence, freq) {
  const tokens = words(sentence).filter(
    (word) => !STOP_WORDS.has(word) && word.length >= 3
  );
  if (!tokens.length) return 0;
  const total = tokens.reduce((sum, word) => sum + (freq.get(word) || 0), 0);
  return total / tokens.length;
}

function summarize(text, limit) {
  const sentences = splitSentences(text);
  const freq = wordFrequencies(sentences);
  return sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score: scoreSentence(sentence, freq),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(limit, sentences.length))
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence);
}

function pickBlank(sentence) {
  const candidates = sentence
    .replace(/[“”"']/g, "")
    .match(/\b[A-Za-z][A-Za-z0-9-]{3,}\b/g);

  if (!candidates) return null;

  const unique = [...new Set(candidates)].filter(
    (word) => !STOP_WORDS.has(word.toLowerCase())
  );
  if (!unique.length) return null;

  unique.sort((a, b) => b.length - a.length);
  const answer = unique[0];
  const blanked = sentence.replace(new RegExp(`\\b${answer}\\b`), "______");
  if (blanked === sentence) return null;
  return { answer, blanked };
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function uniqueChoices(correct, pool, count) {
  const extras = pool.filter(
    (item) => item.toLowerCase() !== correct.toLowerCase()
  );
  const picks = [];
  shuffle(extras).forEach((item) => {
    if (picks.length >= count) return;
    if (!picks.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
      picks.push(item);
    }
  });
  return shuffle([correct, ...picks.slice(0, count)]);
}

function buildQuiz(text, summary) {
  const sentences = splitSentences(text);
  const questions = [];
  const usedAnswers = new Set();
  const wordPool = [
    ...new Set(
      words(text).filter((word) => word.length > 4 && !STOP_WORDS.has(word))
    ),
  ];

  summary.forEach((sentence) => {
    if (questions.length >= 5) return;
    const blank = pickBlank(sentence);
    if (!blank || usedAnswers.has(blank.answer.toLowerCase())) return;
    usedAnswers.add(blank.answer.toLowerCase());
    questions.push({
      prompt: `Fill in the blank: ${blank.blanked}`,
      answer: blank.answer,
      choices: uniqueChoices(blank.answer, wordPool, 3),
    });
  });

  sentences.forEach((sentence) => {
    if (questions.length >= 5) return;
    const blank = pickBlank(sentence);
    if (!blank || usedAnswers.has(blank.answer.toLowerCase())) return;
    usedAnswers.add(blank.answer.toLowerCase());
    questions.push({
      prompt: `Fill in the blank: ${blank.blanked}`,
      answer: blank.answer,
      choices: uniqueChoices(blank.answer, wordPool, 3),
    });
  });

  if (summary[0] && questions.length < 5) {
    const decoys = sentences
      .filter((sentence) => sentence !== summary[0])
      .slice(0, 3);
    if (decoys.length >= 2) {
      questions.push({
        prompt: "Which sentence belongs in the brief?",
        answer: summary[0],
        choices: uniqueChoices(summary[0], decoys, 3),
      });
    }
  }

  return questions.slice(0, 5);
}

function renderSummary(sentences) {
  summaryEl.innerHTML = "";
  sentences.forEach((sentence) => {
    const item = document.createElement("li");
    item.textContent = sentence;
    summaryEl.appendChild(item);
  });
}

function renderQuiz(questions) {
  currentQuiz = questions;
  quizForm.innerHTML = "";
  scoreEl.textContent = `${questions.length} questions`;

  questions.forEach((question, index) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "question";
    fieldset.dataset.question = String(index);
    const prompt = document.createElement("p");
    prompt.textContent = `${index + 1}. ${question.prompt}`;
    fieldset.appendChild(prompt);

    const choices = document.createElement("div");
    choices.className = "choices";

    question.choices.forEach((choice, choiceIndex) => {
      const id = `q${index}-c${choiceIndex}`;
      const label = document.createElement("label");
      label.className = "choice";
      label.htmlFor = id;
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q${index}`;
      input.id = id;
      input.value = choice;
      label.append(input, document.createTextNode(choice));
      choices.appendChild(label);
    });

    fieldset.appendChild(choices);
    quizForm.appendChild(fieldset);
  });
}

function showError(message) {
  errorEl.hidden = !message;
  errorEl.textContent = message;
}

function updateWordCount() {
  const count = words(articleEl.value).length;
  wordCountEl.textContent = `${count} word${count === 1 ? "" : "s"}`;
}

function generate() {
  const text = articleEl.value.trim();
  const limit = Number(lengthEl.value);
  const sentences = splitSentences(text);

  if (sentences.length < 4) {
    showError("Paste a longer article — at least four full sentences.");
    return;
  }

  showError("");
  const brief = summarize(text, limit);
  const quiz = buildQuiz(text, brief);

  if (quiz.length < 3) {
    showError("Could not build a quiz from this text. Try a clearer article.");
    return;
  }

  renderSummary(brief);
  renderQuiz(quiz);
  emptyStateEl.hidden = true;
  resultsEl.hidden = false;
}

function checkAnswers(event) {
  event.preventDefault();
  if (!currentQuiz.length) return;

  let correct = 0;
  currentQuiz.forEach((question, index) => {
    const selected = quizForm.querySelector(`input[name="q${index}"]:checked`);
    const labels = quizForm.querySelectorAll(
      `.question[data-question="${index}"] .choice`
    );
    labels.forEach((label) => {
      label.classList.remove("correct", "wrong");
      const value = label.querySelector("input").value;
      if (value === question.answer) label.classList.add("correct");
      if (selected && value === selected.value && value !== question.answer) {
        label.classList.add("wrong");
      }
    });
    if (selected && selected.value === question.answer) correct += 1;
  });

  scoreEl.textContent = `Score: ${correct} / ${currentQuiz.length}`;
}

function resetQuiz() {
  if (!currentQuiz.length) return;
  quizForm.reset();
  quizForm
    .querySelectorAll(".choice")
    .forEach((label) => label.classList.remove("correct", "wrong"));
  scoreEl.textContent = `${currentQuiz.length} questions`;
}

articleEl.addEventListener("input", updateWordCount);
lengthEl.addEventListener("input", () => {
  lengthValueEl.textContent = `${lengthEl.value} sentences`;
});
generateBtn.addEventListener("click", generate);
sampleBtn.addEventListener("click", () => {
  articleEl.value = SAMPLE_ARTICLE;
  updateWordCount();
  showError("");
});
quizForm.addEventListener("submit", checkAnswers);
resetQuizBtn.addEventListener("click", resetQuiz);
updateWordCount();
