# Instagram and Facebook Reels: setup (owner, one time)

The job `.github/workflows/meta-post.yml` (script `ci/meta.mjs`, no Claude) posts every video as a Reel once it is
public on YouTube: Instagram for all three channels, Facebook for Country Flux (more Pages later). It uses ONE token,
from a *system user* of the Prony Production business portfolio. A system user token with expiry "Never" does not run
out, so there is nothing to renew every 60 days.

The steps marked **(owner)** need your Facebook login. Claude does the rest.

## 1. The Meta app: DONE (21 Nov 2026, Claude in the browser)

**Prony Shorts Poster**, app ID `1012084897929515`.

- Type: Business. Business portfolio: Prony Production (`1477700050972330`).
- Contact email: the business email.
- Privacy policy and data-deletion URL: `docs/privacy.md` on GitHub.
- Category: Business and Pages.
- Product **Instagram** added.
- Mode **Live** (Aktif).
- No App Review is needed: the app only posts to accounts of its own portfolio (Standard access).

## 2. Link each Instagram account to its Facebook Page (owner)

The Instagram API only sees an Instagram account through the Facebook Page it is linked to.

Facebook → switch to the Page **Country Flux** → Settings → Linked accounts → Instagram → Connect → log in as
@countryflux… → allow.

PomProds and FaktaMantra: do the same as soon as their Pages exist (see step 6).

## 3. System user and token (owner, about 5 minutes)

business.facebook.com/settings (portfolio Prony Production) → Users → **System users** → Add

- Name: `shorts-poster`. Role: **Employee**.

Select it → **Assign assets**:

- Apps → Prony Shorts Poster → **Manage app** (full control).
- Pages → Country Flux → **Content** and **Insights**.
- Instagram accounts → all three → **Content** (and Insights if offered).

Then **Generate new token**:

- App: Prony Shorts Poster.
- Token expiration: **Never**.
- Permissions, tick exactly these:
  - `business_management`
  - `pages_show_list`
  - `pages_read_engagement`
  - `pages_manage_posts`
  - `instagram_basic`
  - `instagram_content_publish`
  - `instagram_manage_insights` and `read_insights` (added 23 Nov 2026: reach and plays per Reel for the caption
    safety brake)
- Generate → **copy the token** (it is shown only once). Do not send it in chat or email.

## 4. Put the token in GitHub (owner)

github.com/pronyprod/shorts-pipeline → Settings → Secrets and variables → Actions → **New repository secret**

- Name: `META_TOKEN`
- Secret: paste the token → Add secret.

Then tell Claude "token is in". Claude then:

1. runs `whoami`, which shows which Pages and Instagram accounts the token sees;
2. runs a test post, which uploads and processes but publishes nothing;
3. sets the repository variable `META_POSTING=on`.

## 5. What runs every day (nothing to do)

- The job runs hourly from 08:10 to 23:10 WIB, only while `META_POSTING` is `on`.
- It takes a video only after its YouTube publish time plus 30 minutes.
- Fresh videos go first, then the old backlog, oldest first.
- At most 2 Reels per channel and platform per day (`MAX_REELS_PER_DAY`), at least 4 hours apart (`MIN_GAP_HOURS`).
- Each link goes into the Uploads columns *Instagram link* / *Facebook link* and into `ci/meta/posted.json`.
- An episode that fails 3 times is skipped and listed in the run summary, so the drip never blocks.

## 6. Adding the PomProds and FaktaMantra Pages later (owner, 2 minutes each)

1. Link the Instagram account to the new Page (step 2). From then on, Instagram posting for that channel starts by
   itself on the next hourly run, as soon as the Page is also assigned to the system user (point 2 below).
2. Business settings → System users → `shorts-poster` → Assign assets → Pages → the new Page → Content + Insights.
   **No new token is needed.**
3. For Facebook Reels on that Page too: GitHub → Settings → Secrets and variables → Actions → **Variables** →
   `META_FB_CHANNELS` → add the channel. All three is `countryballs whatif fakta`. Or tell Claude to do it.
