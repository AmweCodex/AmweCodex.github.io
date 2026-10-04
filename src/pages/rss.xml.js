/*
  src/pages/rss.xml.js  →  the blog feed at /rss.xml
  ------------------------------------------------------------------------
  Feed readers (and anyone who subscribes) get a new item every time you
  publish a post. Drafts are left out, and the newest post comes first.
  Nothing here needs editing when you add a post: it reads the same blog
  collection as the /blog page.
------------------------------------------------------------------------- */
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  return rss({
    title: 'AmweCodex Blog',
    description: "Notes from Musawandile Shamase's engineering and PLC learning journey.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: post.data.date,
      link: `/blog/${post.id}/`,
      categories: [post.data.category, ...post.data.tags],
    })),
    customData: '<language>en-za</language>',
  });
}
