# Briefly — Хэл солих & Шалгалт үүсгэх баримт бичиг

Энэ файлд төсөлд нэмсэн **English / Монгол** хэл солих боломж, AI шалгалтын асуулт хэрхэн хэлээр үүсдэг, мөн `Unterminated string in JSON` алдаа юу болохыг дэлгэрэнгүй тайлбарлав.

---

## 1. Товч агуулга

| Онцлог | Тайлбар |
|--------|---------|
| Хэл солигч | Header-ийн баруун дээд талд (Sign in / UserButton-ийн өмнө) |
| Дэмжигдэх хэл | `en` (English), `mn` (Монгол) |
| UI орчуулга | Товчлуур, гарчиг, алдааны мессеж гэх мэт бүх интерфейс текст |
| AI агуулга | Товчлол + шалгалтын асуулт/сонголт/тайлбар сонгосон хэлээр |
| Хадгалалт | Сонгосон хэл `localStorage`-д (`briefly-locale`) хадгалагдана |

---

## 2. Шинээр нэмэгдсэн / өөрчлөгдсөн файлууд

### `lib/i18n.tsx`
**Зорилго:** Аппын орчуулга + одоогийн хэлний төлөв.

- `Locale` төрөл: `"en" | "mn"`
- `translations` объект: англи, монгол бүх UI текст
- `I18nProvider`: React Context-ээр хэл дамжуулна
- `useI18n()`: `{ locale, setLocale, t }` буцаана
- `t("key")`: орчуулга авна; `{n}`, `{total}` зэрэг хувьсагч солино
- Хэл солиход `document.documentElement.lang` шинэчлэгдэнэ
- Анхны ачаалалд `localStorage`-аас хэл сэргээнэ

### `components/language-selector.tsx`
**Зорилго:** [shadcn Language Selector](https://www.shadcn.io/examples/dropdown-menu-language-selector) маягийн dropdown.

- Languages icon + туг (🇺🇸 / 🇲🇳) + хэлний нэр
- Radio-style сонголт (`menuitemradio`)
- Гадна дарахад / Escape дархад хаагдана
- Header-ийн баруун талд байрлана

### `app/page.tsx`
**Зорилго:** Нүүр хуудсыг орчуулгатай болгох.

- `I18nProvider`-оор бүтэн хуудсыг орооно
- Header дээр `<LanguageSelector />` нэмсэн
- Sign in / Sign up / Welcome текстүүд `t(...)` ашиглана

### `components/dashboard.tsx`
**Зорилго:** Dashboard UI орчуулга + шалгалтыг хэлээр үүсгэх.

- Бүх товчлуур/мессеж `t(...)` ашиглана
- Товчлол үүсгэхэд `locale` API руу илгээнэ
- Шалгалт үүсгэхэд `locale` API руу илгээнэ
- `detectQuizLocale()`: асуултын текстэд кирилл үсэг байвал `mn`, эсрэгээрээ `en`
- UI хэл болон шалгалтын хэл таарахгүй бол **автоматаар дахин үүсгэнэ**
- Нэг удаагийн хамгаалалт (`quizSyncKey`): алдаа гарвал хязгааргүй дахин дуудахаас сэргийлнэ
- **Шинэ асуулт** товч: одоогийн хэлээр шалгалтыг дахин generate хийнэ

### `lib/gemini.ts`
**Зорилго:** Gemini AI-д хэлний дүрэм өгөх + JSON найдвартай parse хийх.

- `summarizeArticle(..., locale)` — товчлолыг сонгосон хэлээр
- `generateQuiz(..., locale)` — асуултуудыг сонгосон хэлээр
- Монгол үед: “бүх асуулт/сонголт/тайлбар монгол кириллээр”
- Англи үед: бүгд англиар
- `maxOutputTokens` quiz-д `8192` болгосон (тасалдахаас сэргийлэх)
- JSON parse алдаа гарвал **1 удаа дахин оролдоно**
- Алдааны мессежийг хэрэглэгчид ойлгомжтой болгосон

### `app/api/articles/route.ts`
- `POST` body-аас `locale` уншина (`"mn"` эсвэл default `"en"`)
- `summarizeArticle(title, content, locale)` дуудна

### `app/api/articles/[articleId]/quiz/route.ts`
- `POST` body-аас `locale` уншина
- `generateQuiz(..., locale)` дуудна
- Үүссэн асуултуудыг Prisma-аар DB-д хадгална

### `app/globals.css`
- `.language-selector`, `.language-trigger`, `.language-menu`, `.language-option` стиль
- Жижиг дэлгэц дээр хэлний текстийг нууж, зөвхөн icon/туг үлдээнэ

---

## 3. Хэрхэн ажилладаг вэ? (урсгал)

```text
1. Хэрэглэгч header дээр English эсвэл Монгол сонгоно
2. locale = "en" | "mn"  →  localStorage-д хадгалагдана
3. UI бүх текст тэр хэл рүү солигдоно

4. "Товчлол үүсгэх" дарахад:
   Frontend → POST /api/articles { title, content, locale }
   Backend  → Gemini: summary-г locale хэлээр бич
   DB       → Article хадгална

5. "Шалгалт өгөх / Шинэ асуулт" дарахад:
   Frontend → POST /api/articles/:id/quiz { locale }
   Backend  → Gemini: 5 асуултыг locale хэлээр JSON-оор буцаа
   DB       → Quiz + Question хадгална
   UI       → Асуулт, A/B/C/D сонголт харагдана

6. Хэл солиход (жишээ: EN → MN):
   Хэрэв одоогийн quiz өөр хэлээр байвал
   → автоматаар шинэ quiz generate хийнэ
```

---

## 4. `Unterminated string in JSON` алдаа юу вэ?

### Алдааны жишээ
```text
SyntaxError: Unterminated string in JSON at position 608 (line 18 column 32)
```

### Энгийн тайлбар
Энэ бол **таны код буруу бичсэн гэсэн үг биш**.  
Gemini AI шалгалтын асуултуудыг **JSON** хэлбэрээр буцаах ёстой. Гэтэл хариу нь **дутуу тасарсан** (жишээ нь string хаалт `"...` дуусаагүй) үед `JSON.parse()` ажиллахгүй, энэ алдаа гардаг.

### Яагаад гардаг вэ?
1. **Хариу тасарсан (truncation)** — `maxOutputTokens` хүрэлцээгүй, ялангуяа монгол текст илүү урт болдог
2. **Буруу escape** — текст дотор `"` эсвэл мөр таслалт JSON-ыг эвддэг
3. **Бүрэн бус массив** — `[` нээгдээд `]` хаагдаагүй

### Terminal дээр хаана гарч байсан бэ?
```text
POST article quiz SyntaxError: Unterminated string in JSON ...
  at generateQuiz (lib/gemini.ts → JSON.parse)
  at POST (.../quiz/route.ts)
POST /api/articles/.../quiz 500
```

### Юу хийж засав?
1. Quiz-ийн `maxOutputTokens`-ийг **2200 → 8192** болгосон
2. Тайлбарыг богино байлгахыг prompt-д заасан
3. JSON parse амжилтгүй бол **дахин 1 удаа generate** хийнэ
4. Алдааны мессежийг:  
   `Quiz JSON was cut off or invalid... Please generate the quiz again.` гэж тодорхой болгосон

### Хэрэглэгч юу хийх вэ?
Алдаа гарвал **Шинэ асуулт** товчийг дахин дарна. Ихэнх тохиолдолд 2 дахь оролдлого амжилттай болдог.

---

## 5. Яагаад UI монгол байхад асуулт англиар гардаг байсан бэ?

### Шалтгаан
1. Хуучин шалгалт **англиар** generate хийгдэж DB-д хадгалагдсан байсан
2. Хэл солиход UI л солигдож, **хуучин quiz автоматаар орчуулагдахгүй** байсан
3. “Шалгалт өгөх” товч заримдаа зөвхөн `#quiz` руу гүйлгээд, дахин generate хийдэггүй байсан

### Одоо яаж шийдсэн бэ?
- Generate хийх бүрт одоогийн `locale`-г Gemini-д өгнө
- Асуултын хэл UI хэлтэй таарахгүй бол автомат дахин үүсгэнэ
- **Шинэ асуулт** товчоор гараар дахин үүсгэж болно

---

## 6. Гол API-ууд

| Method | Path | Body | Үйлдэл |
|--------|------|------|--------|
| `POST` | `/api/articles` | `{ title, content, locale }` | Нийтлэл товчлох, хадгалах |
| `GET` | `/api/articles` | — | Түүх жагсаах |
| `GET` | `/api/articles/:id` | — | Нэг нийтлэл + quiz-ууд |
| `POST` | `/api/articles/:id/quiz` | `{ locale }` | Шалгалт үүсгэх |
| `POST` | `/api/quizzes/:id/attempts` | `{ answers }` | Хариулт шалгах |

`locale` зөвхөн `"mn"` байвал монгол; бусад бүх утга `"en"` гэж үзнэ.

---

## 7. Туршилтын checklist

1. Header дээр **Монгол** сонгох → UI бүгд монгол болох
2. Нийтлэл paste хийгээд товчлол үүсгэх → summary монголоор
3. Шалгалт үүсгэх → асуулт/сонголт монголоор
4. **English** руу солих → шалгалт автоматаар англиар дахин үүсэх
5. Дахин **Монгол** руу солих → дахин монголоор үүсэх
6. Хэрэв JSON алдаа гарвал **Шинэ асуулт** дахин дарах

---

## 8. Техникийн тэмдэглэл

- Full shadcn/ui суулгаагүй; төслийн одоогийн CSS-тэй нийцсэн custom dropdown ашигласан
- Орчуулга нь `next-intl` биш, хөнгөн custom i18n Context
- Quiz хэл илрүүлэх нь кирилл regex (`/\u0400-\u04FF/`)
- Clerk auth өөрчлөгдөөгүй; зөвхөн header-д language selector нэмэгдсэн
- Database schema-д `locale` багана нэмээгүй (client-side detection + generate үед locale илгээнэ)

---

## 9. Холбоотой файлуудын жагсаалт

```text
lib/i18n.tsx
lib/gemini.ts
components/language-selector.tsx
components/dashboard.tsx
app/page.tsx
app/globals.css
app/api/articles/route.ts
app/api/articles/[articleId]/quiz/route.ts
```

---

*Сүүлд шинэчилсэн: 2026-09-15 — хэл солих, locale-aware quiz, JSON truncation засвар.*
