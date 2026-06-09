import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Коллекция «Статьи».
 *
 * Сейчас статьи лежат в репозитории как Markdown-файлы
 * (`src/content/articles/*.md`) и загружаются glob-лоадером на этапе сборки.
 * Это временное решение на период статического хостинга (GitHub Pages).
 *
 * При переезде на полноценный бэкенд + БД источником станет API — менять
 * нужно будет ТОЛЬКО слой доступа `src/lib/articles.ts`, а эта схема
 * остаётся контрактом данных (в т.ч. для будущей админ-панели).
 */
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    /** Заголовок статьи. */
    title: z.string(),
    /** Краткое описание для карточки и SEO/OG. */
    description: z.string(),
    /** Автор — сотрудник компании. */
    author: z.string(),
    /** Должность/роль автора (выводится рядом с именем). */
    authorRole: z.string().default(''),
    /** Дата публикации. */
    publishedAt: z.coerce.date(),
    /** Дата последнего обновления (необязательно). */
    updatedAt: z.coerce.date().optional(),
    /** Теги для фильтрации и навигации. */
    tags: z.array(z.string()).default([]),
    /** Путь к обложке (в /public или абсолютный URL). */
    cover: z.string().optional(),
    /** Черновик — не публикуется на сайте. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles };
