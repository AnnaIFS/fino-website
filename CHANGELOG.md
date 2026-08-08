# Site change log

A record of significant changes to fino.website, newest first, with the exact command
to restore an earlier version.

## How to go back to a previous version

Each entry below has a tag name. To restore the whole site to how it looked at that tag:

```
cd ~/fino-website
git checkout <tag-name> -- .
git commit -m "Restore site to <tag-name>"
```

Nothing is ever deleted, so you can always move forward again the same way.
To see the list of available tags: `git tag -l`

---

## 2026-08-08 · Full copy pass and a two-family menu

Tag before this change: **`before-copy-pass-2026-08-08`**

A full editorial pass across every page, plus a restructured navigation.

What changed:

- **Voice cleanup site-wide**: the word "real" went from 45 uses to 2, "actually" from 11
  to 4, and every "not X, but Y" construction is gone. The "No this. No that. Just the
  other" formula now appears only on the landing pages, where it answers objections.
- **No more positioning against anyone else.** The offsites page opened by criticising
  other retreats and now opens by saying what ours is. The same went for the workshop
  and consultant comparisons on the homepage, Circles, and the AI page.
- **One thesis, said once.** The About page stated the same idea three times. Now the
  hero, the origin story, and the name section each make a different point.
- **Homepage**: "The Only Thing AI Cannot Automate Is You" was arguing against the AI
  offering two cards above it. Replaced with "We Work on Both Systems at Once," which is
  the actual business.
- **Navigation**: eight menu items became five, grouped into Programs (Circles, Coaching,
  Offsites) and AI & Operations (AI Integration, Fractional Operations, Law Firms,
  Studio), with dropdowns on desktop and grouped sections on mobile.
- **Dario's profile**: rewritten. "Medicine man" and "vision quester" are out, and two
  facts were corrected against his own site (he co-founded Fuoco Sacro, and the Florida
  organization is the Sumak Kawsay Foundation).
- **Overclaims softened**: "We have heard every concern," "we have never had to convince
  an entire firm," and the guaranteed-timeline promises are gone or hedged honestly.
- **Law firms**: engagements now state a starting price of $3,500.
- **SEO**: nine meta descriptions trimmed to the 150 to 160 character range so they stop
  getting cut off in search results. The Circles FAQ structured data was also re-synced
  to the answers now on the page, which Google requires.
- **The book now links straight to Amazon** from every place a visitor can click:
  Anna's author credential on four pages, the homepage novel button, and the Circles
  entry offer. No stop at annamilaeva.com along the way.
- **Footer** rebuilt as a proper sitemap in the same two families as the menu, and it
  now includes the Law Firms and FINO Studio pages, which it had been missing.

## 2026-08-08 · The novel enters the site

Tag before this change: **`before-book-2026-08-08`**
Tag after this change: **`book-integration-v1`**

Anna's novel *Already In A Meeting* was integrated into FINO as a door into the team
work, not as a separate product. The book's own home stays at annamilaeva.com/book and
every link on FINO points there.

What changed:

- **Homepage**: new "The Novel" section between the founders and the closing call to
  action. Book cover, two paragraphs, links to the book and to the Circles entry offer.
- **Circles page**: new "A Smaller Way to Start" entry offer between "Is This Right for
  Your Team?" and the FAQ. The team reads the novel, then FINO facilitates one session
  on it. This is the low-commitment first step before the 8-week program.
- **About page and homepage**: "Author of *Already In A Meeting*" added to Anna's
  credentials, and her name now links to annamilaeva.com.
- **Self-led AI Integration page**: one paragraph added naming the fractional operations
  work (workflows, SOPs, internal tools), which the site was not saying anywhere.
- **Landing page bios**: authorship added to Anna's bio on the Circles and AI landing pages.
- **Behind the scenes**: book schema and personal-site links for search engines,
  a book entry in `llms.txt` for AI assistants, refreshed sitemap dates,
  new image `images/book-cover.jpg`, new CSS classes for the two book blocks.

What deliberately did not change: the hero, the four service cards, the navigation menu,
the name story, and Dario's bio.
