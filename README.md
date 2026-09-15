# Bug Bakery — training platform

Three applications in one repo:

| App | Port | What it is |
| --- | --- | --- |
| `server` | 5000 | Express + MongoDB + Socket.IO. Owns all content, auth, uploads, and broadcasts every change. |
| `client` | 5173 | The public site. Renders entirely from the API and repaints live over the socket. |
| `cms` | 5174 | The admin app. Edit sections, programs, lessons, media, colours — publishing is instant. |

Shared between the two frontends:

```
shared/
  types.ts     every interface the API exchanges
  styles.ts    the design tokens: primary / secondary / tertiary and the rest
  theme.css    those tokens as CSS, imported by both apps
  media.ts     media url helpers
  duration.ts  lesson run times
  ui/          the component library (Button, TextBox, Chip, CollapsibleCard, …)
brand/         the logo, its colourways and the section icons, as SVG source
```

## Getting started

You need Node 20+ and a MongoDB you can reach (local `mongod`, or an Atlas connection string).

```bash
npm install
cp server/.env.example server/.env     # then edit MONGO_URI and JWT_SECRET
npm run seed                           # loads the content and creates the admin account
npm run dev                            # starts all three
```

Then open:

- the site — <http://localhost:5173>
- the bootcamp — <http://localhost:5173/bootcamp>
- the CMS — <http://localhost:5174>

The seeded account is `admin@bugbakery.local` / `admin1234`. Change it from the CMS after your
first sign-in, and set a real `JWT_SECRET` before deploying anywhere.

Run one app at a time with `npm run dev:api`, `npm run dev:site` or `npm run dev:cms`.

## How realtime works

Every write on the server calls `emitChange(resource, action, doc)`, which pushes a
`content:changed` event to two rooms:

- **`site`** — every public visitor. The site invalidates its cached page and refetches, so the
  change appears without a reload.
- **`cms`** — signed-in editors. Same event, plus presence (who else is editing) and `lead:new`
  when someone submits the enrolment form.

Enrolment requests are deliberately **only** broadcast to the `cms` room — visitors never see
other people's submissions.

To see it: open the site in one window and the CMS in another, change a colour under
**Colours & type**, and hit save.

## Changing the palette

`shared/styles.ts` is the single source of truth. Each token maps to a CSS custom property that
Tailwind's utilities compile against — `bg-primary` resolves to `var(--color-primary)`. The CMS
writes new values to the `Theme` document, the server broadcasts it, and `applyTheme()` sets the
properties on `:root` in every open tab.

That means **primary, secondary and tertiary are editable at runtime from the CMS**, with no
rebuild. `DEFAULT_THEME` in `styles.ts` and the `@theme` block in `theme.css` are the fallbacks
used before the API answers.

## What the CMS controls

| Screen | What it edits |
| --- | --- |
| Page sections | The whole page body, in order |
| Programs | Courses, their curriculum sections, covers, prices |
| Video lessons | Lectures: upload or link, assign to a section, mark free |
| Media library | Images and video, with previews |
| Questions | The FAQ |
| Track options | The chips in the track builder, grouped |
| Colours & type | The palette, fonts and corner radii — repaints live |
| Site details | Hero, week strip, contacts, announcement bar |
| 1:1 availability | Weekly hours, timezone, rate, days off |
| 1:1 sessions | Bookings, confirm or cancel |
| Requests | Enrolment enquiries |

## Booking 1:1 hours

Availability is written the way you would say it — "Tuesdays, 18:00 to 21:00, my
time" — and `server/src/lib/slots.js` turns that into real instants with `Intl`,
so a student in another country sees the same slot in their own timezone.

The posted time is never trusted: the server regenerates its open slots and
rejects anything not currently on offer, and a partial unique index on `start`
catches two people submitting the same slot at once.

## Building the page from the CMS

Everything between the hero and the enrolment form is an ordered list of **sections**. Add one,
pick a layout, drag it into position:

| Layout | Use it for |
| --- | --- |
| `rich` | A heading and paragraphs |
| `cards` | Side-by-side panels (the “ways to join” block) |
| `steps` | A numbered row (the “watching the videos” block) |
| `week` | The Sun–Sat strip plus supporting columns |
| `split` | A facts panel beside a body of text (the instructor block) |
| `video` | An uploaded file or a YouTube/Vimeo embed |
| `gallery` | A grid of images |
| `quote`, `callout`, `cta` | A pull quote, a highlighted note, a heading with a button |
| `programs`, `faq`, `builder` | Drop the managed programs list, the FAQ, or the track builder at this position |

The hero, header, footer and enrolment form come from **Site details**.

## Videos

A lesson either points at a link (YouTube, Vimeo, any direct url) or plays a file uploaded through
the media library. Tick **free preview** and it becomes that program's public lesson at
`/watch/:program/:lesson` — no account needed. Everything else returns metadata only; the video
url is stripped server-side rather than hidden in the UI.

Uploads land in `server/uploads/<folder>/` and are served from `/uploads`. The limit is 512MB per
file. For production, put them behind a CDN or swap `server/src/middleware/upload.js` for S3 or
similar — only that file and `Media.url` know where bytes live.

## API

```
GET    /api/health
GET    /api/public/site                              the whole landing page in one response
GET    /api/public/programs/:slug
GET    /api/public/lessons/:programSlug/:lessonSlug   free lessons only
POST   /api/leads                                     rate limited, validated

POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/password

GET    PATCH  /api/admin/settings
GET    PATCH  /api/admin/theme        POST /api/admin/theme/reset
GET    POST   /api/admin/media/upload   PATCH DELETE /api/admin/media/:id
CRUD          /api/admin/{sections,programs,lessons,faqs,technologies}
PATCH         /api/admin/<resource>/bulk/reorder     { ids: [...] } in the new order
GET    PATCH DELETE /api/admin/leads

GET    /api/public/slots                              open 1:1 slots, as UTC instants
POST   /api/public/bookings                           rate limited, slot re-checked server-side
GET    PATCH  /api/admin/availability
GET    PATCH DELETE /api/admin/bookings
```

Everything under `/api/admin` needs `Authorization: Bearer <token>`.

## Production

```bash
npm run build          # builds client/dist and cms/dist
npm start              # runs the API
```

Serve the two `dist` folders as static sites. Set on the server: `MONGO_URI`, `JWT_SECRET`,
`PUBLIC_URL` (where uploads are reachable) and `CORS_ORIGINS` (both frontend origins). Set
`VITE_API_URL` for each frontend at build time, and `VITE_SITE_URL` for the CMS's “view site” link.

## Notes

- The original single-file page is kept at `legacy/index.html` for reference.
- `server/uploads/` is not in git: uploaded media is runtime data. A fresh clone
  starts with an empty library, so re-upload the logo and set it under
  Site details → Brand.
- The server is plain JavaScript; both frontends are TypeScript.
- If MongoDB is unreachable the API still starts, retries every 5s, and returns 503 on data routes
  rather than hanging.


## The bootcamp

A **track** is what a trainee enrols in — the seeded MERN one runs **twelve
weeks**, and the workspace groups its 23 steps by week so it reads as a schedule
rather than a list. The **steps** inside it are what they actually do, and they
repeat one loop:

**Watch** an idea → **build** a piece → **fix a bug** someone left in code like
the piece you just built → **ship it**, and submit the commit.

The bug steps are the point. Almost nobody at work starts from a blank file, and
almost everybody starts from someone else's mistake — so each one hands over
broken code, the symptom a user reported, and hints the trainee opens one at a
time. The root cause is stored with the step but never sent to the browser.

Author all of it under **Bootcamp tracks** in the CMS. It is marketed on the
home page by a `bootcamp` section, which you can move, retitle or hide like any
other band.

### What a trainee waits for

Deterministic checks run **in front of them** — the response comes back in
milliseconds, so nobody waits to be told they forgot `express.json()`.

The written review runs *after* the response has gone out. The workspace shows
"reading your answer" and the verdict arrives on their socket, usually within
seconds. `REVIEW_WAIT_MS` (default 60s) is the ceiling: past it, the wait stops
and a person takes over. A provider that dies mid-review, or a server restarted
mid-review, both end the same way — the submission is kept and routed to the
queue, never lost and never left spinning.

### How work gets reviewed without you reading all of it

Submissions climb a ladder, and each rung filters. You only see what is left.

| Rung | What it is | Cost |
| --- | --- | --- |
| 0 | Steps authored so nothing subjective is left to judge | free, and permanent |
| 1 | Deterministic checks — must contain / must not contain / regex | instant, free |
| 2 | An AI reviewer that writes real feedback and reports its own confidence | seconds |
| 3 | Routing: only five things reach a person | — |
| 4 | Peer review by trainees, then graduates as mentors | not your time |

**Rung 0 is the one that matters most, and it is a curriculum decision rather
than a setting.** "Fix this so the acceptance criteria hold" is objectively
gradeable forever; "build something nice" needs a human every single time. Author
toward the first and the queue stays small.

Exactly five things put a submission in front of a person — each one a case
where a human genuinely adds what a model does not:

- the reviewer's confidence fell below `REVIEW_CONFIDENCE_FLOOR`
- the trainee has failed the same step `REVIEW_REPEAT_FAILURES` times — they are
  stuck, and the feedback clearly is not landing
- the step is marked a **milestone**. This is the dial on your workload: gate one
  step in six, not six in six
- the trainee ticked "I would like a person to look at this", which is on every
  submission and always honoured
- a random `REVIEW_AUDIT_RATE` share of passes, spot-checked so a drifting
  reviewer shows up here rather than in a graduate's first job. An audit never
  blocks the trainee — they have already passed

Everything else settles on its own. What is left arrives in **Review queue**,
blocked trainees first, with the reason it was escalated attached.

### Peer review

A trainee who has passed a step can review other people's attempts at it. Two
reviews that agree settle a submission; if they disagree, it comes to you.

It lives in the workspace as a second tab beside their own work — no separate
page to remember, and the count of what is waiting is on the tab.

This is not only a way to spend less of your time. Reading broken code that is
not yours is one of the most valuable things a junior can practise, and it is
the thing nobody practises.

### Turning the reviewer on

Set `AI_PROVIDER` in `server/.env`. All three paths use the same prompt, the same
JSON contract and the same ladder — the provider is the swappable part.

```bash
# Free, local, nothing leaves your machine
brew install ollama && ollama serve
ollama pull qwen2.5-coder:7b
AI_PROVIDER=ollama

# Best quality
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-…

# Anything speaking /chat/completions — Groq and OpenRouter have free tiers
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://api.groq.com/openai/v1
AI_API_KEY=…
AI_MODEL=…
```

With `AI_PROVIDER=off`, checks still run and any step with a rubric goes to the
queue. **Review queue → Test it** tells you whether the provider actually
answers, so a broken key surfaces there rather than mid-cohort.

The reviewer is never the authority. Your verdict in the queue overrides it, and
a provider that is down routes work to a person instead of losing it.


### Keeping exercises off a chatbot

Each track has three switches, under **Bootcamp tracks → the track**:

- refuse selection and copying of the brief and the broken code
- refuse pasting into the answer fields
- blur the exercise when the tab loses focus, and refuse printing

**Be clear-eyed about what these are.** They are deterrents. Anyone can open
developer tools, disable JavaScript, read the network response, or point a phone
at the screen — no web page can prevent that, and a page that claims to is
lying. What they do reliably is make the lazy path inconvenient, which is most
of the actual traffic.

The half that survives a determined trainee is the **counting**. A blocked paste
is still an observed paste, and every submission carries what the browser saw:
paste attempts and their size, copies, times the tab was left, characters
actually typed, and how long the step took. When that crosses
`REVIEW_PASTE_ATTEMPTS` or `REVIEW_PASTED_CHARACTERS`, the submission is flagged
**Looks pasted** and goes to a person — it is never marked wrong on that alone,
because it is circumstantial and a trainee pasting their own code from their
editor looks identical.

Blocking paste has a real cost: a trainee who wrote their answer in VS Code has
to retype it. That is the trade, and it is why it is a per-track switch rather
than a global rule.

If you want something that actually holds up, it is not in the browser: ask the
trainee to explain their fix in their own words (the bug steps already require
this, and the rubrics mark down a correct fix with a wrong explanation), and use
the milestone steps for a short live conversation. Someone who cannot explain
the fix did not write it, and that is a far better signal than any keystroke.
