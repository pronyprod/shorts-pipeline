# Reliability review (27 Nov 2026)

Goal: no missed day and no manual fixing. Errors may happen, but they must heal themselves before a viewer or the
owner notices.

Sources: every CHECK NEEDED / CLEARED / CLAUDE LIMIT / HEALTH ALERT / CATCH-UP line in `shared/PROJECT_LOG.md` since
16 Nov, the GitHub Actions run logs (run numbers below), the Google Sheet, and the channels' upload lists on YouTube
(`tools/yt-local.mjs recent`).

## Top findings

1. **Silent non-uploads.** Five videos the pipeline counted as delivered never reached YouTube:
   - Country Flux Ep021 (27 Nov);
   - PomProds Ep020 and Ep021 (26 + 27 Nov);
   - FaktaMantra Ep020 and Ep021 (26 + 27 Nov).

   Zapier did not upload them. Every check looked at queue rows, never at YouTube, so nothing noticed for two days.
   PomProds had no video from 24 to 27 Nov.
2. **GitHub's schedule is unreliable for every workflow, not only the episode runs.** Since 24 Nov:
   - the hourly Reels job ran 4 times in ~60 h (expected ~40);
   - the stock-queue job ran 4 times (expected ~20);
   - the health job ran 13 times (expected ~20), up to 3 h off its time;
   - on 23 Nov evening GitHub started no episode run at all.

   Any fix that relies on one cron time is not a fix.
3. **One stuck episode blocks its channel.** After a stop and one retry, the old rule waits for a human commit
   (Fakta Ep020 looped 25-26 Nov). Nothing makes the next episode meanwhile.
4. **There is no buffer.** Stock is 0-1 days for PomProds and Fakta, so any one failure is a missed day.
5. **Zapier is a single point of failure that cannot be monitored from here.**
   - Its YouTube step is limited to ~5 uploads per day (5 Nov: Zapier staff, free/trial plans).
   - Throttled runs are held silently until replayed by hand.
   - A free plan has 100 tasks per month (~4 uploads a day = ~120).

## Incidents

Status: **fixed** = a permanent code fix is live; **partly** = mitigated, but it can still cost a day;
**new** = found in this review.

| # | Date | Channel | Incident | Root cause (from the logs) | Status | Can it recur? | Permanent fix | Test |
|---|---|---|---|---|---|---|---|---|
| 1 | 5 Nov | all | 11 of 16 first uploads "On hold: throttled" in Zapier | Zapier free/trial: ~5 YouTube uploads per day (Zapier staff) | partly | yes (#13, #25) | upload cap; upload watchdog (#25) | watchdog test, Phase 1 |
| 2 | 8 Nov | CF | Ep009 stopped: "sun" heard as "son" | whisper homophone, not a voice error | fixed | other homophones | homophone list (voice-match.mjs) + automatic reword once (21 Nov) | AUTO-REWORD worked: CF Ep022, Ep023 (27 Nov) |
| 3 | 10 Nov | CF | Ep009 true peak -0.96 dBTP | mix peak on punch3 | fixed | rarely; the check catches it | checks stop before release; the Reels mix has a final limiter | verify.mjs re-measures TP on every file |
| 4 | 16 Nov | all | commit step "Authentication failed" | the Claude action replaced git's login | fixed | no | push with the workflow token | every run since |
| 5 | 17 Nov | PomProds | run 44103438051 ended without a result file | the 3D render ran in the background and died with the Claude session | fixed | no | render hand-off to a workflow step | every PomProds run since |
| 6 | 18 Nov | PomProds | run 44218429231 stopped at `npm ci` | onnxruntime-node install script got 404 downloading CUDA | fixed | other npm/network errors: yes | `ONNXRUNTIME_NODE_INSTALL_CUDA=skip`; retry npm ci (Phase 1) | - |
| 7 | 18 + 21 Nov | CF | whisper "Illegal instruction" (exit 132) | whisper.cpp compiled on one runner's CPU, cached, run on a CPU without those features | fixed | no | cache per CPU feature set + 1 s self-test + rebuild | "whisper: self-test passed" in every run |
| 8 | 18 Nov | CF | Ep014 files lost in a rebase conflict | two runs appended to the log at once | fixed | no | `.gitattributes` union merge for the log | - |
| 9 | 18 Nov | PomProds | log said "voice unchanged" after a re-voice | Claude misreported | partly | yes | honesty rule; verify.mjs counts Gemini use | - |
| 10 | 14-21 Nov | CF | Ep014 / Ep016 voice lines failed whisper again and again | number words vs digits; unclear wording | fixed | yes, but heals | numbers normalised; automatic reword once | AUTO-REWORD lines 27 Nov |
| 11 | 19 + 25 Nov | PomProds | visual stop (Everest tag hidden; counter 1.5 h vs "8 minutes") | real defects, correctly caught by the visual check | fixed (re-rendered by hand) | yes | the visual check stays; a 2nd stop must park, not block (#22) | parking test, Phase 1 |
| 12 | 22 Nov | PomProds, Fakta | runs ended in seconds ("without a result file") | Claude usage limit after a busy night (late scheduled runs after manual catch-ups) | fixed | yes (Pro plan) | late-night skip; CLAUDE LIMIT label; never counted as a stop | Phase 1 test (e) |
| 13 | 22 Nov | Fakta | Ep018 "On hold: throttled" in Zapier | 6 queue rows in 24 h after late + manual runs | partly | yes (#25) | cap back to 4; late-run rule | - |
| 14 | 23 Nov | PomProds | 07:30 empty | a run after midnight used the "never today" rule | fixed | no | any run may fill today's slot >= 3 h ahead | 12 unit cases |
| 15 | 23-25 Nov | all | no evening runs on 23 Nov; others 10-12 h late | GitHub cron (verified: no runs between 22 Nov 20:46 and 24 Nov 00:04 UTC) | partly | yes, proven daily (#24) | catch-up job; more and odd-minute triggers; chaining (Phase 1) | Phase 1 test (a) |
| 16 | 24 Nov | PomProds | run 45300766976 ended without a result file | Claude ended normally (37 turns) without writing the file; its last message was hidden. Cause NOT verifiable | partly | yes | the last message is shown since 26 Nov; a result file is always written (Phase 1) | Phase 1 test (b) |
| 17 | 24 Nov | Fakta | 24 Nov empty although a run made Ep019 at 08:43 | "never today" rule | fixed | no | today's slot rule | unit case |
| 18 | 25 Nov | Fakta | Ep020 lost its re-take | 1 accidental voice call for Ep019 + 1 HTTP 400 used the 4-request cap | fixed (guard) / partly (400) | 400: yes | gemini-guard (right episode, 4 per run); a 400 no longer counts (Phase 1) | guard test 25 Nov; Phase 1 test (d) |
| 19 | 25-26 Nov | Fakta | catch-up runs 45606956358, 45677897481 ended without a result file | claude-code-action refuses runs started by the github-actions bot | fixed | no | `allowed_bots` | catch-up runs 26 Nov 18:28 (Fakta Ep021) and 27 Nov 07:49 (CF Ep022, Ep023) made episodes |
| 20 | 25-26 Nov | Fakta | Ep020 join check looped (0.15-0.18 s burst at line 4) | noise reduction reshapes the burst, so the first edge pass misses it | fixed | no | AUTO-TRIM of a short edge leftover, no re-take | 5 unit tests; Ep020 delivered with "AUTO-TRIM line 4: 0.18 s" |
| 21 | 25-26 Nov | PomProds, Fakta | Reels version missing for Ep020 | PomProds: no composition in part 2's result; Fakta: cover art in one MP3 | fixed | no | kit lookup; `-vn` | PomProds Ep021 Reels made; ffmpeg test |
| 22 | 25-26 Nov | Fakta | Ep020 blocked the channel for 2 days | the stop-retry rule waits for a human fix after 2 stops | new | yes | park after 2 stops, make the next topic, repair the parked one once a day, drop it after 3 days | Phase 1 test (2) |
| 23 | 22 Nov | (laptop) | the "guard" timer never ran | the laptop went to sleep | lesson | - | nothing may depend on the laptop | - |
| 24 | 24-27 Nov | all | Reels and stock-queue jobs rarely ran | GitHub dropped most hourly cron runs (4 of ~40 Reels runs) | new | yes | every workflow is also started by others (chain), odd minutes, the health job starts them when overdue | Phase 1 test (a) |
| 25 | 25-27 Nov | CF, PomProds, Fakta | 5 queued videos never uploaded, unseen for 2 days | Zapier did not upload rows added 25 Nov 09:25 to 26 Nov 18:42; rows added 27 Nov 06:19 + 07:55 did upload. Throttling/hold or the monthly task limit: Zapier's own pages needed to tell which | new | yes | **upload watchdog**: every queue row is checked on YouTube ~2 h after it is added; missing ones are re-queued within the cap; alert + owner note if Zapier itself is down | Phase 1 test (f) |
| 25b | 27 Nov | all | root cause of #25 confirmed by the owner in Zapier | all 5 runs (25 Nov 09:27 + 12:33, 26 Nov 08:47 + 09:09 + 18:45) "On hold: This YouTube step was throttled"; task limit fine (15/100); throttled runs never retry; 5 in 24 h is the throttle point, rows 22 min apart | yes | - | hard cap 4 per rolling 24 h (throttled rows count), at least 2 h between any two queue rows (all channels), one writer for held stock (queue-later.yml), watchdog: missing after 3 h = throttled, re-queued only 24 h after its row | gap/cap tests 13/13, queue-later simulations |
| 26 | 18 Nov | PomProds | the replaced Ep015 (T3is6Ud5QZs) is still public next to the new one | owner deletion pending | open | - | owner deletes it in Studio | - |

## Failure types that have not happened yet but could

| Risk | What would happen | Guard (Phase 1 unless noted) |
|---|---|---|
| Zapier throttling (confirmed 27 Nov: 5 in 24 h or rows close together) | a run is held for good, the video never uploads | cap 4 per 24 h, 2 h gap, watchdog re-queues after the 24 h window; task limit 15/100 is fine |
| Claude Pro limits (5-hour, weekly) | episode runs stop in seconds | CLAUDE LIMIT (not a stop), catch-up retries, 3-day stock bridges a day |
| CLAUDE_CODE_OAUTH_TOKEN expiry (~1 year after `claude setup-token`) | every Claude step fails | health check: "Claude refused / unauthorised" -> alert naming the secret |
| Gemini free tier changes, or the TTS preview model is retired | Fakta/PomProds voices fail | per-model quota logic; stock bridges; alert on repeated model errors |
| Meta token revoked / Graph API version sunset | Reels stop (YouTube unaffected) | meta.mjs fails loudly (token error = clear message); health lists Reels age |
| YouTube OAuth refresh token revoked | comment/track jobs fail (uploads unaffected) | job error names the secret; health lists it |
| GitHub cron dropped (proven), or schedules disabled after 60 days without commits | jobs do not run | chaining + several triggers; daily commits keep schedules on |
| concurrency group: a new pending run cancels the older pending one | a catch-up or scheduled run silently lost | catch-up only starts when nothing is running or waiting; the next catch-up repeats |
| runner limits (6 h job, ~14 GB disk), Actions cache eviction (7 days unused) | a long render dies; work in progress lost | render timeout 95 min x2; the episode is parked and the next one made |
| network at run time (npm, HuggingFace Kokoro model, whisper source, incompetech) | setup fails | caches; retry once; Reels never block YouTube |
| sheet edits by hand (sorted rows, deleted sample row, duplicate rows) | wrong or duplicate uploads | queue-row validation before every write (date in the future, no duplicate episode or slot, no gap) |
| publish time in the past | YouTube publishes at once, or Zapier errors | validation: >= 2 h ahead, else next slot |
| DST: Pacific daylight time from 14 Mar 2027 moves the Gemini reset to 14:00 WIB | nothing breaks (15:00 is still after it) | - |
| repository made private | release links stop working for Zapier and Meta | note in the README |

## Phase 1 status

Phase 1 changes and their tests are listed at the end of `shared/PROJECT_LOG.md` (entry "Reliability overhaul"),
each with how to undo it.
