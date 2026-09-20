---
title: "Building my portfolio website with Astro and Claude AI"
category: "Web Development"
summary: "How I built a dark navy and teal portfolio and blog from scratch, where every project and post is just a Markdown file."
cover: "/images/projects/building-my-portfolio-website-with-astro.png"
stack: ["web-development", "portfolio", "markdown", "astro"]
date: 2026-09-20
draft: false
---

I studied electronic engineering, and I spend most of my time around circuits, microcontrollers and, more recently, PLCs. What I did not have was one proper place to show that work. My projects were scattered across folders, GitHub repos and half finished notes.

Yes i know some basic **HTML**,**CSS** and **Java Script** but i am no expect and i had to build this project, So I built one with AI, yes with Claude AI. This post is the story of how I made my portfolio and blog website from scratch without knowing much, what I chose, and what went wrong along the way.

> **The short version:** built with Astro and Claude, powered by Markdown, styled in dark navy and teal, and designed so that adding a new project or post takes a few minutes.

<!--
📸 SCREENSHOT 1: the homepage hero section.
Save it as images/homepage-hero.png, then remove the comment markers around the line below.

![The AmweCodex homepage with the dark navy hero section](./images/projects/Others/homepage-hero.png)
-->
![The AmweCodex homepage with the dark navy hero section](/images/projects/Others/homepage-hero.png)

## What I wanted the site to do

Before writing any code, I wrote down what the site had to do:

- Show my **Engineering Projects** with pictures and full detail pages.
- Hold a **Blog** where I document my PLC learning journey and other topics.
- Let people **Download my Resume** with one click.
- Link to my **GitHub, LinkedIn, YouTube and Email**.
- Let me add new content by **only writing a Markdown file**, with no code changes.

That last point drove almost every decision.

## Why I chose Astro

I wanted something fast, simple and friendly to Markdown. Astro fits that well. It builds plain static HTML pages, so the site loads quickly, and its content collections let me treat every post and project as a Markdown file with a clear structure.

| Tool | What I use it for |
| --- | --- |
| Astro | Builds the pages and handles routing |
| Markdown | Every blog post and project |
| CSS | The dark theme, layout and animations |
| Astro Image component | Optimised images |
| Fraunces (serif font) | Headings that feel personal, not corporate |

## The look and feel

I wanted the site to feel calm and technical, like a control-room screen at night. That meant a dark navy background, soft blue-grey text, and one bright teal accent for anything clickable or important.

![The seven colours used across the site](/images/projects/Others/colour-palette.svg)

A few design choices I am happy with:

- **Fraunces** for the display headings, paired with a clean sans-serif for body text.
- **Pill-shaped buttons** for a friendly, modern feel.
- **Orbiting social icons** in the hero section, which give the homepage a bit of life without being distracting.

## How the site is laid out

The header has five tabs: Home, About, Projects, Blog and Contact. Projects and Blog each open their own listing page, and clicking any item opens a full detail page, not just a small card.

![A map of the site and the pages each tab leads to](/images/projects/Others/site-map.svg)

The homepage shows my three latest projects and three latest posts, so visitors always see what is new. My skills live on the About page, in the same card style.

A simplified view of the project folder:

```text
src/
├── content/
│   ├── blog/          ← one Markdown file per post
│   └── projects/      ← one Markdown file per project
├── pages/
│   ├── index.astro
│   ├── about.astro
│   ├── projects/
│   └── blog/
│       └── [...id].astro   ← the post detail template
└── components/
```

## From Markdown file to web page

This is the part I enjoy most. To publish something new, I create a Markdown file, fill in a few lines at the top (the frontmatter), and write. Astro does the rest.

![How a Markdown file becomes a page on the website](/images/projects/Others/markdown-to-page.svg)

A post starts like this:

```yaml
---
title: "My first PLC program in CODESYS"
description: "Turning an LED on with ladder logic."
pubDate: 2026-10-01
category: "PLC"
tags: ["plc", "codesys", "ladder-logic"]
---
```

Because the content collection checks this frontmatter, a typo like a missing date shows up as a clear error while I work, not as a broken page after I publish.

I also added a terminal command that creates a new post or project file with the frontmatter already filled in. It removes the boring part, so I can go straight to writing.

## Problems I ran into

Nothing worked perfectly the first time, and that is part of the story.

**Too much empty space under the header.** The gap between the header and the page content looked awkward on every page. I fixed it once, site-wide, instead of patching each page.

**The Contact tab was always underlined.** It looked like I was permanently on the Contact page. It is a small bug, but it made the whole header feel broken. The lesson: test the navigation on every page, not only the homepage.

**Organising projects into categories.** My first attempts at grouping projects into folders did not work. Once I had a clear category field in the frontmatter, grouping became simple. Blog posts are now grouped by topic too, so the blog is not only about PLCs.

**Blog posts felt too narrow on a laptop.** I wanted a wider reading area on big screens but the same comfortable width on small devices. One line of CSS did it:

```css
.container.narrow {
  max-width: max(760px, 75%);
}
```

On a phone, the page stays at 760px or less. On a laptop, it grows to 75% of the screen.

**Image warnings.** Astro's analyser told me my profile picture should use the Image component. Switching to it gave me properly optimised images.

<!--
📸 SCREENSHOT 2: a project detail page.
Save it as images/project-detail.png, then remove the comment markers around the line below.

![A project detail page on the AmweCodex site](./images/projects/Others/project-detail.png)
-->

## What I learnt

- **Start with the workflow, not the design.** Deciding that everything would be Markdown made the rest easier.
- **Small details matter.** Spacing and one wrong underline change how professional a site feels.
- **Build in rounds.** I got the base working first, then improved it in stages.

## What is next

The site is a living project, and I have a list of upgrades I am working through:

- A **light theme** alongside the dark one
- A **mobile menu** that works nicely on small screens
- Better **code block styling**, since my PLC posts will include a lot of code
- A **sitemap** and proper **social preview images**
- Possibly reading time, a table of contents, and previous/next post links

The bigger goal is the reason I built the site in the first place: a series documenting my PLC learning journey, starting with CODESYS and using only free tools. Every step will be written up here.

## Follow along

If you want to see the code or watch the journey unfold, find me on [GitHub](https://github.com/AmweCodex) and [YouTube](https://youtube.com/@AmweCodex).

Thanks for reading. See you in the next post.
