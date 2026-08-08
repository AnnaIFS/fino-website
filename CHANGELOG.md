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
