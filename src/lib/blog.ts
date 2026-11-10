/*
  src/lib/blog.ts
  ------------------------------------------------------------------------
  Small helpers shared by the blog pages, so the grouping and ordering
  rules live in ONE place.
------------------------------------------------------------------------- */
import type { CollectionEntry } from 'astro:content';
import { BLOG_CATEGORIES } from '../data/blog_categories.mjs';

export type BlogEntry = CollectionEntry<'blog'>;

export interface BlogGroup {
  category: string;
  blurb?: string;
  /** Registered categories show even when empty ("coming soon"). */
  registered: boolean;
  entries: BlogEntry[];
}

const byDateDesc = (a: BlogEntry, b: BlogEntry) => b.data.date.valueOf() - a.data.date.valueOf();

/**
 * Groups posts by category.
 *  1. Categories from src/data/blog_categories.mjs come first, in that order.
 *  2. Any other category follows, the most recently updated one first.
 */
export function groupPosts(posts: BlogEntry[]): BlogGroup[] {
  const registered: BlogGroup[] = BLOG_CATEGORIES.map((c) => ({
    category: c.label,
    blurb: c.blurb,
    registered: true,
    entries: posts.filter((p) => p.data.category === c.label).sort(byDateDesc),
  }));

  const known = new Set(BLOG_CATEGORIES.map((c) => c.label));
  const others = [...new Set(posts.map((p) => p.data.category))]
    .filter((c) => !known.has(c))
    .map<BlogGroup>((category) => ({
      category,
      registered: false,
      entries: posts.filter((p) => p.data.category === category).sort(byDateDesc),
    }))
    .sort((a, b) => b.entries[0].data.date.valueOf() - a.entries[0].data.date.valueOf());

  return [...registered, ...others];
}

/** "[ PLC-LAB ] Level 1 - Fundamentals" -> { tag: "PLC-LAB", title: "Level 1 - Fundamentals" } */
export function splitCategory(category: string): { tag?: string; title: string } {
  const match = category.match(/^\[\s*(.+?)\s*\]\s*(.*)$/);
  return match ? { tag: match[1], title: match[2] } : { title: category };
}

/** URL-safe id for a heading, used for the jump links on /blog. */
export const categoryAnchor = (category: string) =>
  category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Reading time in whole minutes (about 200 words a minute, minimum 1). */
export function readingMinutes(body = ''): number {
  const words = body.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
