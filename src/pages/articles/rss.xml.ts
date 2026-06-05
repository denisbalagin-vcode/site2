import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getAllArticles } from "../../lib/articles";
import { asset } from "../../utils/asset";

export async function GET(context: APIContext) {
  const articles = await getAllArticles();
  return rss({
    title: "Статьи Formit",
    description:
      "Материалы команды Formit об инсоляции, КЕО и работе с Revit-моделями.",
    site: context.site ?? "https://formit.pro",
    items: articles.map((article) => ({
      title: article.title,
      description: article.description,
      pubDate: article.publishedAt,
      link: asset(`/articles/${article.slug}`),
      categories: article.tags,
    })),
    customData: "<language>ru-ru</language>",
  });
}
