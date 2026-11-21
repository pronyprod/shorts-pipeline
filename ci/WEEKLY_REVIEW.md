# Weekly review (GitHub Actions, Sundays): what works, and lean the banks towards it

Owner, 22 Nov 2026: more views, zero daily work. You run unattended on a Linux runner; nobody answers questions.

## Input
- `ci-out/review/episodes.json` (and `.csv`): one record per YouTube episode: channel, episode, posted date, views at
  48 h, average % viewed, subscribers gained, average view duration (s), title, topic, hook, hashtags, pinned comment.
  Rows without numbers are too new (YouTube Analytics is 2-3 days behind): skip them.
- The repo: each channel's episode files (What If / PomProds: `whatif-video/src/whatif/episodes/epNNN.ts` and the kit
  file's `style`; Fakta: `fakta-video/src/episodes/`; Countryballs: `countryballs-video/src/countryballs/episodes/` and
  the format in the bank), the banks `shared/FLAG_PAIR_BANK.md`, `shared/WHATIF_BANK.md`, `shared/FAKTA_BANK.md`, and the
  previous `shared/WHAT_WORKS.md` if it exists.
- `ci-out/context.json`: `{ "test": true|false, "date": "YYYY-MM-DD" }`.

## 1. Write `shared/WHAT_WORKS.md` (replace it every week)
Per channel (Country Flux = Countryballs, PomProds = What If, Fakta Unik):
- A table of the episodes with numbers, best first by views at 48 h, with average % viewed, subs, and what the episode
  was (format / category / style, hook type, title pattern).
- **What works** and **what does not**, for: topics/categories, hooks (the first line), styles (What If: A/B/D/P),
  formats (Countryballs sub-formats), title patterns (question, number, CAPS word, emoji, "What if you ..."), length.
  Name the episodes behind each claim. With fewer than 3 episodes behind a pattern, say "early sign", not a rule.
  Views and average % viewed can disagree: report both (reach vs retention).
- **Next 2 weeks:** 3-5 concrete instructions for that channel (e.g. "more Real survivor in style D", "title with a
  number in the first 3 words", "drop Kenapa how-it-works").
- At the top: the date, the data window, and a 3-line summary for the owner.
- At the end, a machine-readable block the pipeline can use later, exactly in this shape:

```json
{ "date": "YYYY-MM-DD", "ranking": ["countryballs", "fakta", "whatif"], "medianViews": { "countryballs": 0, "whatif": 0, "fakta": 0 }, "medianAvgPctViewed": { "countryballs": 0, "whatif": 0, "fakta": 0 } }
```

## 2. Lean each bank towards what works
For each of the three banks:
- Re-order only the UNUSED items (never touch rows marked DONE/used, never renumber items, never delete an item; move
  a weak one to the end and mark it `(deprioritised YYYY-MM-DD: reason)`). Where the bank has an **Order:** line or a
  suggested-episodes list, rewrite that so the next 14 episodes lean towards what works, while keeping each bank's
  own rotation rules (no category twice in a row, timely slot, style rules, monetisation guardrails, owner rules).
- Add 3-6 NEW ideas per channel in the same direction, in the bank's own table format, marked
  `(added by weekly review YYYY-MM-DD)`. Every idea needs its anchors to verify; facts are checked again when the
  episode is made. Nothing political, tragic, graphic or unsafe; nothing another channel's characters or catchphrases.
- Keep everything the owner wrote. If the evidence is too thin (fewer than 5 episodes with numbers for a channel),
  change nothing in that bank's order, add only 2 ideas, and say so.

## 3. Log
Append to `shared/PROJECT_LOG.md` one entry: `- **Weekly review (YYYY-MM-DD, cloud):**` with 2-4 lines: best and worst
per channel with numbers, what changed in each bank (moved/added counts), and the top instruction per channel.
In a test run start it with `TEST RUN (cloud):`.

## Rules
- Do not commit or push, and do not touch `.github/`, `ci/` or `tools/`, the episode files, or anything else. Only
  `shared/WHAT_WORKS.md`, the three banks and the log. The workflow commits.
- Numbers only from the input file; never invent or estimate a number. Quote them with the episode they belong to.
- Finish with `ci-out/review/result.json`: `{ "status": "done", "changed": ["shared/WHAT_WORKS.md", ...] }`.
