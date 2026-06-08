import { getCollection, type CollectionEntry } from "astro:content";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  СЛОЙ ДОСТУПА К СТАТЬЯМ — единственная точка получения данных.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Страницы и компоненты импортируют ТОЛЬКО функции отсюда и тип `Article`.
 * Они не знают, откуда берутся статьи.
 *
 * Сегодня источник — Astro Content Collections (Markdown в репозитории).
 * Когда появится бэкенд + БД, тело функций ниже заменяется на сетевые
 * запросы, например:
 *
 *     const res = await fetch(`${import.meta.env.PUBLIC_ARTICLES_API}/articles`);
 *     const data = await res.json();
 *     return data.map(normalizeFromApi);
 *
 * Сигнатуры функций и форма типа `Article` при этом не меняются — страницы
 * трогать не нужно. Тот же контракт реализует будущая админ-панель.
 */

/** Нормализованная статья — стабильный контракт для всего сайта. */
export interface Article {
  /** Уникальный идентификатор / часть URL (`/articles/<slug>`). */
  slug: string;
  title: string;
  description: string;
  author: string;
  authorRole: string;
  publishedAt: Date;
  updatedAt?: Date;
  tags: string[];
  cover?: string;
  /**
   * Запись коллекции для рендера тела статьи (`render(entry)`).
   * Это деталь текущего (статического) источника. При переезде на бэкенд
   * здесь будет готовый HTML/Markdown из API, а рендер — соответствующим.
   */
  entry: CollectionEntry<"articles">;
}

/** Приводит запись коллекции к стабильному типу `Article`. */
function normalize(entry: CollectionEntry<"articles">): Article {
  const d = entry.data;
  return {
    slug: entry.id,
    title: d.title,
    description: d.description,
    author: d.author,
    authorRole: d.authorRole,
    publishedAt: d.publishedAt,
    updatedAt: d.updatedAt,
    tags: d.tags,
    cover: d.cover,
    entry,
  };
}

// Кеш на уровне модуля: коллекция за сборку не меняется, поэтому считаем её
// один раз. Производные геттеры ниже переиспользуют результат вместо повторного
// прохода по всей коллекции.
let cache: Article[] | null = null;

/** Все опубликованные статьи, по убыванию даты публикации. */
export async function getAllArticles(): Promise<Article[]> {
  if (cache) return cache;
  const entries = await getCollection("articles", ({ data }) => !data.draft);
  cache = entries
    .map(normalize)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  return cache;
}

/** Одна статья по slug (или `undefined`, если не найдена/черновик). */
export async function getArticleBySlug(
  slug: string,
): Promise<Article | undefined> {
  const all = await getAllArticles();
  return all.find((a) => a.slug === slug);
}

/** Статьи с указанным тегом. */
export async function getArticlesByTag(tag: string): Promise<Article[]> {
  const all = await getAllArticles();
  return all.filter((a) => a.tags.includes(tag));
}

/** Уникальные теги по всем опубликованным статьям (по алфавиту). */
export async function getAllTags(): Promise<string[]> {
  const all = await getAllArticles();
  const set = new Set<string>();
  all.forEach((a) => a.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
}

/** Формат даты для вывода (ru). */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
