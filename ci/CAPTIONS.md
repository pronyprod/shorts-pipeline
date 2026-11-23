# Reels captions (Instagram + Facebook) — rules for Claude

Owner, 23 Nov 2026. Job: `.github/workflows/meta-captions.yml`. You write caption files; `ci/meta.mjs` posts them.

## The job

`ci-out/caption-todo.json` lists the episodes that need a caption file. For each entry, write the file named in its
`file` field. That file holds:

- `youtubeTitle`, `youtubeDescription`, `hookLine`, `topic`, `episodeHashtags`, `question`;
- `language`: Indonesian for FaktaMantra, English for the others;
- `plainFallback`: what is posted if you write nothing.

Write ONLY files under `ci/meta/captions/`. Touch nothing else.

```json
{
  "written": "<ISO time now>",
  "episode": "Ep017",
  "trend": { "source": "<the trend in a few words>", "sourceUrl": "<a news/official page from the last 7 days>", "why": "<the real, factual link to this video>" },
  "instagram": { "trend": "<caption>", "plain": "<caption>" },
  "facebook": { "trend": "<caption>", "plain": "<caption>" }
}
```

If no good trend fits, set `"trend": null` and leave out both `trend` captions. The plain captions are always required.

## Instagram caption (both variants)

```
<line 1: hook>
<line 2: the surprising fact from the video>
<line 3: a question that invites comments>

Voiceover: AI
Music: <exactly the "Music:" credit from youtubeDescription, if it has one>

#tag1 #tag2 #tag3
```

- **Line 1, trend variant:** a trend-adjacent hook. Find what people are searching or talking about NOW: news, sports,
  films, series, celebrities, events, holidays. Use web search, and for FaktaMantra search for Indonesia (Indonesian
  news and trends).
  - Connect the trend to the video with a TRUE statement, e.g. "Ronaldo's free kicks hit 130 km/h. Lightning moves
    far faster, and this man was hit 7 times."
  - Every number and claim must be checked on a reliable page; the `sourceUrl` must support the trend part.
- **Line 1, plain variant:** a plain, searchable hook (the question people would type), e.g. "What happens if
  lightning hits you 7 times?"
- **Line 2:** the surprising fact, taken from the video (title, hook line, description). Never a fact the video does
  not say.
- **Line 3:** one question that is easy to answer in a comment.
- **Hashtags:** at most 5, specific to the topic and the niche. One may be the trend's name or event (trend variant
  only).
  - Never #reels, #shorts, #viral, #fyp, #foryou, #explore, #trending.
  - Never a hashtag of a person or brand that is not the trend you named.

## Facebook caption (both variants)

Shorter:

```
<hook: trend hook, or plain hook>
<the question>

Voiceover: AI
Music: <credit, if any>

#tag1 #tag2
```

Use 1 to 3 hashtags.

## Hard rules for trend hooks

If any of these rules would be broken, use no trend (`"trend": null`).

1. **Only TRUE statements.** No invented numbers, no "reportedly", no rumours.
2. **Never claim or suggest the person, team or event is in the video.** The video has no celebrities.
3. **Only a REAL link** between the trend and the video's topic: same physical quantity, place, animal, country, flag,
   number or science. No K-pop idol on a science Reel, no film star on a flag quiz unless there is a true topical
   link.
4. **Nothing political:** elections, parties, politicians, government decisions, protests, wars and conflicts.
5. **Nothing tragic or sensitive:** disasters with victims, deaths, accidents, crime, terror, illness outbreaks,
   religion, ethnicity.
6. **Nothing about minors:** no child celebrities, no news about children.
7. **No mocking** of a person, country or group. Countries and flags are treated with respect.
8. **Fresh trends only:** the trend must be current (about the last 7 days, or an event happening this week).
9. **For FaktaMantra** the whole caption is in natural, casual Indonesian (like the YouTube titles). The other
   channels are in English.
10. **Length:** each line short (under about 150 characters); the whole Instagram caption under 600 characters.

`node ci/meta.mjs check-captions` runs after you:

- It removes any variant that breaks the format: the Voiceover line, the hashtag counts and bans, the question, the
  line count.
- It removes trend variants that have no `trend.source` plus `sourceUrl`.

A removed variant is not posted: the plain one is used instead.
