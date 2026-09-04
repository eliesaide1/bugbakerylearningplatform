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
