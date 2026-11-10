/*
  src/data/blog_categories.mjs
  ============================================================================
  The ONE list of blog categories. Two things read it:

    1. `npm run new:blog`  - offers these in its menu and puts the new post in
                             the matching folder, so you never move files by hand.
    2. The /blog page and the homepage - show them in THIS order.

  Each entry:
    label     the heading on the site, and the `category:` line in the post
    folder    where the post lives (under src/content/blog/ and, for pictures,
              public/images/blog/). Underscores, no spaces.
    numbered  true = the script asks for a problem number and names the file
              1_title.md, 2_title.md ... so the folder stays in order
    total     how many practice problems the level has (progress bar on the home page)
    blurb     one line shown under the heading on /blog

  A category that is NOT listed here still works (the script can create one),
  it simply appears after these, newest post first.
  ============================================================================
*/
export const BLOG_CATEGORIES = [
  {
    label: '[ PLC-LAB ] Level 1 - Fundamentals',
    folder: 'PLC_LAB/Level_1_Fundamentals',
    numbered: true,
    total: 10,
    blurb: 'Practice problems on the basics: seal-in, timers, counters and simple sequences.',
  },
  {
    label: '[ PLC-LAB ] Level 2 - Intermediate',
    folder: 'PLC_LAB/Level_2_Intermediate',
    numbered: true,
    total: 10,
    blurb: 'Harder problems that combine timers, counters and state logic.',
  },
  {
    label: '[ PLC-LAB ] Level 3 - Industrial And Capstone',
    folder: 'PLC_LAB/Level_3_Industrial_And_Capstone',
    numbered: true,
    total: 10,
    blurb: 'Industrial-style problems and the capstone projects.',
  },
  {
    label: 'PLC-BASICS',
    folder: 'PLC_BASICS',
    numbered: false,
    blurb: 'The theory behind the practice: I/O, instructions, timers and small projects.',
  },
];
