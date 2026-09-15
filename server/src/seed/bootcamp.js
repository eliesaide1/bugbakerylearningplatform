/**
 * The seeded MERN bootcamp. The shape matters more than the content: watch
 * something, build something, then fix a planted bug and push it — repeating
 * until the trainee has met the situations the job actually contains.
 *
 * Most steps are machine-checkable on purpose. A bug step with concrete
 * acceptance criteria is objectively gradeable forever; an open-ended "build
 * something nice" needs a person every single time. Authoring toward the first
 * kind is what keeps the review queue small.
 */
export const tracks = [
  {
    title: "MERN Stack Bootcamp",
    slug: "mern-stack",
    stack: "MongoDB · Express · React · Node.js",
    summary:
      "Build a real full-stack application the way it happens at work: watch the idea, build the piece, then fix the bug someone left you and ship it.",
    level: "Beginner to job-ready",
    weeks: 12,
    gate: "sequential",
    technologies: ["React", "Node.js", "Express", "MongoDB"],
    outcomes: [
      "Read an unfamiliar codebase and find the line that is wrong",
      "Build and deploy a complete JavaScript application, front to back",
      "Write an API other developers can guess their way around",
      "Review someone else's code and say something useful about it",
    ],
    steps: [
      {
        kind: "read",
        title: "How this bootcamp works",
        week: 1,
        estimateMinutes: 8,
        points: 5,
        requiresSubmission: false,
        summary: "The loop you will repeat for twelve weeks.",
        brief: `Every unit of this track is the same four beats.

Watch — a short lesson introducing one idea. No exercise, just context.

Build — a task with a concrete deliverable. You write the code.

Fix — we hand you a broken version of something like what you just built, with the symptom a user reported. You find the cause and fix it. This is the part that most resembles the job: almost nobody starts from a blank file, and almost everybody starts from someone else's mistake.

Ship — push it, and submit the commit. Work that is not pushed does not count, here or anywhere else.

Your submissions are checked automatically first, then read. If the automatic reviewer is unsure, or you have been round the same step more than twice, a person picks it up. You can also ask for a person at any point — there is a box for it on every submission.`,
      },
      {
        kind: "watch",
        title: "JavaScript that holds up",
        week: 1,
        estimateMinutes: 22,
        points: 5,
        requiresSubmission: false,
        summary: "Modern syntax, and where async errors actually go.",
        brief:
          "Watch this before the first build step. The exercises assume async/await, destructuring and modules.",
      },
      {
        kind: "task",
        title: "Build your first Express route",
        week: 2,
        estimateMinutes: 45,
        points: 20,
        summary: "A GET endpoint returning JSON, with a real status code.",
        brief: `Create an Express server with a single route.

GET /api/recipes returns a JSON array of recipe objects. Each recipe has an id, a title and a minutes field. Three hard-coded recipes is fine — the data is not the point.

The route must set an explicit 200 status and must be registered with express.json() middleware in place, because the next step posts to it.`,
        deliverables: [
          "An index.js (or server.js) with an Express app listening on a port from process.env.PORT",
          "A GET /api/recipes route returning an array of recipes as JSON",
          "express.json() registered before the routes",
        ],
        checks: [
          { kind: "contains", value: "express", field: "code", message: "Your code should require or import express." },
          { kind: "contains", value: "/api/recipes", field: "code", message: "The route path should be /api/recipes." },
          { kind: "contains", value: "express.json", field: "code", message: "Register express.json() so the next step can post to this server." },
        ],
        rubric: `Pass if the route exists, returns an array as JSON, and express.json() is registered.
Do not require error handling, a database, or tests — none were asked for. Do not mark down for file naming or for using CommonJS instead of ESM.`,
      },
      {
        kind: "bug",
        title: "The list is always empty",
        week: 2,
        estimateMinutes: 40,
        points: 30,
        summary: "A route that returns nothing, and no error anywhere.",
        brief: `A teammate pushed this route yesterday. QA reports that the recipes page is blank, but the server logs are clean and the endpoint returns 200.

Find the cause, fix it, and paste the corrected handler. Explain in the notes what was actually wrong — the explanation matters as much as the fix.`,
        bug: {
          language: "javascript",
          filename: "routes/recipes.js",
          symptom:
            "GET /api/recipes returns 200 with an empty array. There are definitely recipes in the database — you can see them in Compass.",
          code: `import { Router } from "express";
import { Recipe } from "../models/Recipe.js";

const router = Router();

router.get("/api/recipes", async (req, res) => {
  const recipes = [];

  Recipe.find({ published: true }).then((docs) => {
    docs.forEach((doc) => recipes.push(doc));
  });

  res.status(200).json(recipes);
});

export default router;`,
          hints: [
            "Add a console.log inside the .then() and another just before res.json(). Which one prints first?",
            "The handler is declared async, but nothing in it is awaited. Ask what that changes.",
            "res.json() runs to completion before the database has answered. What does `recipes` hold at that moment?",
          ],
          rootCause:
            "The database query is fired but never awaited. res.status(200).json(recipes) runs synchronously on the same tick, long before the .then() callback pushes anything into the array, so an empty array is serialised and sent. The fix is to await the query and respond with its result: `const recipes = await Recipe.find({ published: true }); res.json(recipes);`. Marking the handler async without awaiting anything is the tell.",
          acceptance: [
            "The database query is awaited (or its promise chain returns the response) before responding",
            "The response is built from the query result rather than a pre-declared empty array",
            "The trainee's notes identify the cause as responding before the async query resolved — not as a database, permissions or filter problem",
          ],
        },
        checks: [
          { kind: "contains", value: "await", field: "code", message: "Your fixed handler should await the query." },
          { kind: "not-contains", value: "const recipes = []", field: "code", message: "The empty array the response was built from should be gone." },
        ],
        rubric: `Pass only if the query is genuinely awaited AND the notes name the real cause: the response was sent before the query resolved.

A fix that works but is explained wrongly ("the filter was wrong", "the database was slow") is a revise, not a pass — this step is about the reasoning, and the trainee will hit this bug again in a different shape.

Accept either await or a returned promise chain. Do not require error handling; it was not asked for.`,
      },
      {
        kind: "push",
        title: "Ship the fix",
        week: 2,
        estimateMinutes: 15,
        points: 10,
        summary: "Branch, commit with a message that explains why, push.",
        brief: `Push your fix to a repository and submit the links.

Your commit message should say why the change was made, not what changed — the diff already shows what changed. "Await recipe query so the response is not sent empty" tells the next reader something; "fix bug" does not.`,
        push: { branch: "fix/empty-recipes", commitMessage: "imperative mood, explains why", requireRepoUrl: true, requireCommitUrl: true },
        checks: [
          { kind: "regex", value: "https?://", field: "repoUrl", message: "Paste the full repository url, starting with https://" },
          { kind: "regex", value: "https?://", field: "commitUrl", message: "Paste a link to the specific commit." },
        ],
        rubric:
          "Pass if both urls are present and plausible, and the described commit message explains the reason for the change rather than restating the diff.",
        milestone: true,
      },
      {
        kind: "watch",
        title: "React: state and the render you did not get",
        week: 3,
        estimateMinutes: 26,
        points: 5,
        requiresSubmission: false,
        summary: "Why the screen did not change even though the data did.",
      },
      {
        kind: "bug",
        title: "The new recipe never appears",
        week: 3,
        estimateMinutes: 40,
        points: 30,
        summary: "State updates, nothing re-renders.",
        brief: `Adding a recipe works — refresh the page and it is there. But the list does not update until you refresh.

Find the cause, fix the component, and say in your notes what rule was broken.`,
        bug: {
          language: "jsx",
          filename: "components/RecipeList.jsx",
          symptom:
            "Submitting the form calls the API successfully (200 in the network tab, and the row is in the database), but the list on screen does not change until a full page reload.",
          code: `export function RecipeList({ initial }) {
  const [recipes, setRecipes] = useState(initial);

  async function addRecipe(recipe) {
    const saved = await api.post("/api/recipes", recipe);

    recipes.push(saved);
    setRecipes(recipes);
  }

  return (
    <ul>
      {recipes.map((r) => (
        <li key={r.id}>{r.title}</li>
      ))}
    </ul>
  );
}`,
          hints: [
            "Log `recipes` right after setRecipes. The data is correct — so why is React not repainting?",
            "React decides whether to re-render by comparing the old state value with the new one. What is it comparing here?",
            "recipes.push mutates the array in place. The variable still points at the same array.",
          ],
          rootCause:
            "The state array is mutated in place with .push and then handed back to setRecipes. React compares the previous state to the next by identity, and it is the same array reference, so it bails out and never re-renders. The fix is to set a new array: setRecipes((current) => [...current, saved]). The functional form is preferred because it is also correct under batching.",
          acceptance: [
            "A new array is created rather than the existing one being mutated",
            "setRecipes receives that new array (the functional updater form is ideal but not required)",
            "The notes identify the cause as mutating state in place, so the reference did not change and React skipped the render",
          ],
        },
        checks: [
          { kind: "not-contains", value: "recipes.push", field: "code", message: "The in-place push should be gone." },
          { kind: "contains", value: "setRecipes", field: "code", message: "Your fix should still call setRecipes." },
        ],
        rubric: `Pass if state is replaced with a new array and the notes name mutation-plus-same-reference as the cause.

"I added a key prop" or "I moved it into useEffect" is a revise — those are guesses that sometimes mask the symptom.`,
      },
      {
        kind: "task",
        title: "Wire the list to the API",
        week: 4,
        estimateMinutes: 60,
        points: 25,
        summary: "Fetch on mount, and design the loading and error states.",
        brief: `Replace the hard-coded recipes with a real fetch.

The part that matters here is not the happy path. Decide what the user sees while the request is in flight, and what they see when it fails. A spinner that spins forever on a 500 is worse than an error message.`,
        deliverables: [
          "The component fetches /api/recipes when it mounts",
          "A visible loading state while the request is in flight",
          "A visible error state, with a way to retry",
        ],
        checks: [
          { kind: "contains", value: "useEffect", field: "code", message: "Fetch when the component mounts." },
        ],
        rubric: `Pass if all three states are handled and are actually reachable from the code.

Be strict about the error state specifically — it is the deliverable people skip. An empty catch block is a revise.`,
      },
      {
        kind: "bug",
        title: "Some recipes belong to nobody",
        week: 5,
        estimateMinutes: 45,
        points: 35,
        summary: "A Mongoose query that silently matches nothing.",
        brief: `The "my recipes" page is empty for every user, though everyone has recipes.

This one is subtle and it will cost you an afternoon at some point in your career if you have not seen it before.`,
        bug: {
          language: "javascript",
          filename: "routes/mine.js",
          symptom:
            "GET /api/recipes/mine returns [] for every signed-in user. The same recipes have the correct owner field in the database, and the user id in the JWT is right.",
          stackTrace: "",
          code: `router.get("/api/recipes/mine", requireAuth, async (req, res) => {
  const recipes = await Recipe.find({
    owner: { $eq: req.user.id.toString() },
    published: true,
  });

  res.json(recipes);
});`,
          hints: [
            "Log the query and one document side by side. What type is `owner` in each?",
            "Mongoose casts values to the schema type — but only where it can tell what the schema type is.",
            "An ObjectId and its 24-character string are not equal to each other.",
          ],
          rootCause:
            "owner is an ObjectId in the schema, but the query passes a string inside an explicit $eq operator. Mongoose casts plain equality values to the schema type, but does not reliably cast inside operator objects, so an ObjectId field is compared against a string and never matches. The fix is to drop the .toString() and the $eq wrapper — `owner: req.user.id` — or cast explicitly with new mongoose.Types.ObjectId(req.user.id).",
          acceptance: [
            "The owner comparison is made against an ObjectId, not a string",
            "The query still filters by both owner and published",
            "The notes identify the cause as a type mismatch between the string and the ObjectId, not as a missing index, a wrong field name or an auth problem",
          ],
        },
        checks: [
          { kind: "not-contains", value: ".toString()", field: "code", message: "The string conversion is the problem — it should not survive your fix." },
          { kind: "contains", value: "published", field: "code", message: "Keep filtering on published." },
        ],
        rubric: `Pass if the comparison is against an ObjectId and the notes name the type mismatch.

Accept either dropping the cast so Mongoose handles it, or an explicit ObjectId construction. Both are correct and the second is more explicit.`,
        milestone: true,
      },
      {
        kind: "watch",
        title: "Authentication without hand-waving",
        week: 6,
        estimateMinutes: 28,
        points: 5,
        requiresSubmission: false,
        summary: "What a token is, what it is not, and where it goes.",
      },
      {
        kind: "task",
        title: "Sign someone in",
        week: 6,
        estimateMinutes: 75,
        points: 30,
        summary: "Register, sign in, and protect one route.",
        brief: `Add accounts to the app.

POST /api/auth/register takes a name, email and password and creates a user. POST /api/auth/login returns a token. One route — /api/recipes/mine — requires that token and returns only that user's recipes.

Hash the password. Storing it as plain text is the single most common way a small app ends up in the news.`,
        deliverables: [
          "Passwords hashed before they are stored, never in plain text",
          "A login route returning a signed token",
          "Middleware that rejects a request with no valid token",
          "One route that only returns the signed-in user's own data",
        ],
        checks: [
          { kind: "regex", value: "bcrypt|argon2|scrypt", field: "code", message: "Hash the password with bcrypt, argon2 or scrypt." },
          { kind: "not-contains", value: "password === ", field: "code", message: "Never compare a password with ===. Compare the hash." },
        ],
        rubric: `Pass if passwords are hashed, the token is signed and verified, and the protected route filters by the signed-in user.

Be strict about the hashing and about the protected route reading the user id from the verified token rather than from the request body or a query string — those two are security, not style.`,
      },
      {
        kind: "bug",
        title: "Everyone can see everyone's drafts",
        week: 7,
        estimateMinutes: 50,
        points: 40,
        summary: "The auth middleware is there. It is not doing anything.",
        brief: `A tester signed in as one user and opened another user's draft recipe. The middleware exists and looks right.

This is the kind of bug that does not throw, does not log, and does not show up until someone goes looking. Find it, fix it, and say what made it invisible.`,
        bug: {
          language: "javascript",
          filename: "app.js",
          symptom:
            "Any signed-in user can read any other user's drafts. Signing in works, the token is valid, and requireAuth does reject a request with no token at all — you tested that.",
          code: `import express from "express";
import recipeRoutes from "./routes/recipes.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
app.use(express.json());

app.use("/api/recipes", recipeRoutes);
app.use("/api/recipes", requireAuth);

export default app;`,
          hints: [
            "Middleware runs in the order it is registered. Read those two app.use lines in order.",
            "By the time requireAuth runs, has the route already answered?",
            "requireAuth works when you test it in isolation. Ask what is different about it here.",
          ],
          rootCause:
            "requireAuth is registered after the routes it is meant to protect. Express runs middleware in registration order, so recipeRoutes handles the request and sends a response before requireAuth is ever reached. It never rejects anything, and because the route still works nothing looks broken. The fix is to register requireAuth before the routes: app.use('/api/recipes', requireAuth, recipeRoutes).",
          acceptance: [
            "requireAuth runs before the route handlers, not after",
            "The fix is ordering — the middleware itself does not need changing",
            "The notes identify registration order as the cause, and explain why nothing errored",
          ],
        },
        checks: [
          { kind: "regex", value: "requireAuth[\\s\\S]{0,80}recipeRoutes", field: "code", message: "requireAuth should come before the routes it protects." },
        ],
        rubric: `Pass if requireAuth is ordered before the routes and the notes name middleware ordering as the cause.

Rewriting requireAuth itself is a revise — the middleware was never the problem, and a trainee who "fixed" it has not understood what happened.`,
        milestone: true,
      },
      {
        kind: "push",
        title: "Ship authentication",
        week: 7,
        estimateMinutes: 20,
        points: 10,
        summary: "Push it, and say what you would still not trust in production.",
        brief: `Push your work and submit the links.

In your notes, name one thing about this authentication you would not ship to real users yet. Knowing where your own work is thin is a large part of being trusted with more of it.`,
        push: { branch: "feat/auth", requireRepoUrl: true, requireCommitUrl: true },
        checks: [
          { kind: "regex", value: "https?://", field: "repoUrl", message: "Paste the full repository url." },
          { kind: "regex", value: "https?://", field: "commitUrl", message: "Paste a link to the commit." },
        ],
        rubric: "Pass if both urls are present and the notes name a real, specific limitation rather than a generic one.",
      },
      {
        kind: "watch",
        title: "Data that survives its second year",
        week: 8,
        estimateMinutes: 24,
        points: 5,
        requiresSubmission: false,
        summary: "Schema design, indexes, and when to embed rather than reference.",
      },
      {
        kind: "task",
        title: "Search, filter and paginate",
        week: 8,
        estimateMinutes: 90,
        points: 30,
        summary: "A list endpoint that survives ten thousand rows.",
        brief: `Extend GET /api/recipes so it takes a search term, a filter, and a page.

Decide what happens when the page is past the end, when the search matches nothing, and when someone passes page=-1. Half of building an API is deciding what the wrong input does.`,
        deliverables: [
          "A search parameter matching on the title",
          "Pagination with page and limit, both bounded",
          "A total count returned alongside the page, so the client can show how many there are",
          "Sensible behaviour for out-of-range and malformed parameters",
        ],
        checks: [
          { kind: "regex", value: "limit|perPage", field: "code", message: "Bound the page size — an unbounded limit is a way to take the server down." },
        ],
        rubric: `Pass if search, pagination and a total are all present and the page size is bounded.

The bounded limit is the one to be strict about: an endpoint that honours limit=1000000 is a denial-of-service waiting to happen.`,
      },
      {
        kind: "bug",
        title: "Page two is missing a recipe",
        week: 9,
        estimateMinutes: 45,
        points: 40,
        summary: "Every page looks right. One row is never shown.",
        brief: `A user reports that a recipe they saved is nowhere in the list, though searching for it directly finds it.

Off-by-one bugs in pagination are quiet: nothing errors, every page renders, and one row simply never appears.`,
        bug: {
          language: "javascript",
          filename: "routes/recipes.js",
          symptom:
            "With 25 recipes and a page size of 10, pages 1, 2 and 3 each render. But the 11th recipe by date never appears on any of them.",
          code: `router.get("/api/recipes", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 10;

  const recipes = await Recipe.find()
    .sort({ createdAt: -1 })
    .skip(page * limit)
    .limit(limit);

  res.json(recipes);
});`,
          hints: [
            "Work out by hand which rows page 1 asks for. Then page 2.",
            "The page numbers the client sends start at 1. What does skip expect?",
            "Write out skip for page=1: 1 × 10 = 10. Which row is index 0..9?",
          ],
          rootCause:
            "skip is computed as page * limit rather than (page - 1) * limit. With one-based page numbers, page 1 skips the first ten rows entirely, so rows 0-9 are never returned and every page is shifted by one window. The fix is .skip((page - 1) * limit). The reason only one row was noticed missing is that the user happened to look for one in the first window.",
          acceptance: [
            "skip is computed from (page - 1) * limit, or the page parameter is made zero-based explicitly",
            "The first page returns the first rows rather than skipping them",
            "The notes identify the one-based/zero-based mismatch rather than blaming the sort",
          ],
        },
        checks: [
          { kind: "regex", value: "page\\s*-\\s*1", field: "code", message: "With one-based pages, skip should use (page - 1) * limit." },
        ],
        rubric: `Pass if skip is corrected and the notes name the one-based versus zero-based mismatch.

"I changed the sort order" or "I added a secondary sort key" is a revise — those change which row goes missing, not whether one does.`,
      },
      {
        kind: "quiz",
        title: "What would you check first?",
        week: 9,
        estimateMinutes: 20,
        points: 15,
        summary: "Debugging is a method, not a talent.",
        brief:
          "Short answers. There is no code to write — this is about the order you look at things in, which is the part that makes debugging fast.",
        quiz: [
          {
            prompt:
              "An endpoint returns 200 with an empty array, and the data is definitely in the database. What are the first two things you check, and in what order?",
            expected:
              "Whether the query is awaited / the response is sent before the data arrives, and whether the filter matches — including value types. Checking the database contents again is the wrong first move because that has already been confirmed.",
          },
          {
            prompt:
              "A React component shows stale data after a successful save. Name two causes, and how you would tell them apart.",
            expected:
              "State mutated in place so the reference did not change, or the fetch result never written to state. Log the state value and its identity after the update: correct data means it is a render problem, stale data means it is an update problem.",
          },
          {
            prompt: "Why is a bug that does not throw usually more expensive than one that does?",
            expected:
              "Nothing points at it. It passes tests, ships, and is found by a user later, often after data has been written wrongly for a while.",
          },
        ],
        rubric: `Pass if the answers show a method: forming a hypothesis and describing what would distinguish it from the alternative.

Do not require the exact wording of the answer key. Reward an answer that names a different but sound first check.`,
      },
      {
        kind: "watch",
        title: "Deploying without a bad Friday",
        week: 10,
        estimateMinutes: 26,
        points: 5,
        requiresSubmission: false,
        summary: "Environment config, secrets, and the difference between your machine and a server.",
      },
      {
        kind: "task",
        title: "Deploy it",
        week: 10,
        estimateMinutes: 120,
        points: 40,
        summary: "A live url anyone can open.",
        brief: `Get the application onto the internet.

Anywhere is fine. What matters is that no secret is in the repository, the database url comes from the environment, and someone who is not you can open the link and use it.

Submit the live url.`,
        deliverables: [
          "A live url that loads and works",
          "No secrets committed — the repository has an example env file, not a real one",
          "The database connection string read from the environment",
        ],
        checks: [
          { kind: "regex", value: "https?://", field: "repoUrl", message: "Paste your repository url." },
          { kind: "regex", value: "https?://", field: "commitUrl", message: "Paste the live url in the second field." },
        ],
        rubric: `Pass if the live url works and the notes show secrets are kept out of the repository.

Check the repository url for a committed .env before passing this one.`,
        milestone: true,
      },
      {
        kind: "bug",
        title: "Two recipes, one click",
        week: 11,
        estimateMinutes: 55,
        points: 45,
        summary: "A race you cannot reproduce on your own machine.",
        brief: `Support says some users have duplicate recipes. Nobody can reproduce it, and it never happens locally.

Read the handler and work out what is different about a slow connection.`,
        bug: {
          language: "javascript",
          filename: "routes/recipes.js",
          symptom:
            "A handful of users have the same recipe saved twice, seconds apart. It has never once happened in local testing. Both copies are identical apart from their ids.",
          code: `router.post("/api/recipes", requireAuth, async (req, res) => {
  const existing = await Recipe.findOne({
    owner: req.user.id,
    title: req.body.title,
  });

  if (existing) {
    return res.status(409).json({ error: "You already have a recipe with that title." });
  }

  const recipe = await Recipe.create({ ...req.body, owner: req.user.id });
  res.status(201).json(recipe);
});`,
          hints: [
            "It only happens to users on slow connections, who click Save twice. Trace both requests through this handler.",
            "There is a gap between the findOne finishing and the create starting. What can happen inside it?",
            "Two requests can both pass the existence check before either one has written anything.",
          ],
          rootCause:
            "Check-then-write is not atomic. Two concurrent requests both run findOne, both see nothing, and both then create — so the guard never fires. It cannot reproduce locally because the window between the two queries is too small to hit by hand. Application-level checks cannot fix this; the constraint has to live where the write happens. The fix is a unique compound index on { owner, title } and handling the resulting duplicate-key error, or an atomic upsert such as findOneAndUpdate with upsert: true.",
          acceptance: [
            "The uniqueness is enforced by the database, with a unique index or an atomic upsert — not by a second application-level check",
            "The duplicate-key error is handled and turned into a sensible response rather than a 500",
            "The notes explain that the check and the write are not atomic, and why local testing never hits it",
          ],
        },
        checks: [
          { kind: "regex", value: "unique|upsert|findOneAndUpdate", field: "code", message: "The guard has to be enforced by the database, not by another read." },
        ],
        rubric: `Pass only if the fix moves the guarantee into the database — a unique index or an atomic upsert — and the notes explain the non-atomic gap.

Adding a second findOne, a delay, a mutex in process memory, or disabling the button on the client is a revise. The client fix is worth doing as well, but on its own it leaves the bug in place for anyone using the API directly, and this step is about understanding why.`,
        milestone: true,
      },
      {
        kind: "task",
        title: "Final project: build it end to end",
        week: 12,
        estimateMinutes: 480,
        points: 100,
        summary: "Your own application, front to back, live on a url.",
        brief: `Build something of your own using everything from the last eleven weeks.

It needs accounts, a database, a React front end, at least one list with search and pagination, and it has to be deployed. The subject is yours — pick something you would actually use, because you will be looking at it for a while and you will be showing it to people.

Submit the repository, the live url, and a short README in the repository explaining what it does and how to run it.`,
        deliverables: [
          "A repository with a README that a stranger could follow to run it",
          "A live url",
          "Accounts, with passwords hashed and routes protected",
          "At least one list with search and pagination",
          "Loading and error states everywhere data is fetched",
        ],
        checks: [
          { kind: "regex", value: "https?://", field: "repoUrl", message: "Paste your repository url." },
          { kind: "regex", value: "https?://", field: "commitUrl", message: "Paste the live url in the second field." },
        ],
        rubric: `This is the capstone — read it properly rather than scoring it against a list.

Pass if it runs, the deliverables are all present, and the code is something the trainee could explain line by line. Say clearly what is strongest and what one thing you would change before they show it to an employer.`,
        milestone: true,
        peerReviewable: false,
      },
      {
        kind: "task",
        title: "Review two final projects",
        week: 12,
        estimateMinutes: 60,
        points: 30,
        summary: "The last thing you do here is read someone else's work.",
        brief: `Review two other trainees' final projects from the panel beside your steps.

Say one thing that is genuinely good and one thing you would change, and be specific enough that they could act on it tomorrow. You have been on the receiving end of this for twelve weeks; you know the difference between a review that helps and one that does not.`,
        deliverables: ["Two reviews left, each naming something specific to keep and something to change"],
        rubric: "Pass if the trainee describes two reviews they left and what they said. Be generous — this step is about taking part.",
        peerReviewable: false,
      },
      {
        kind: "task",
        title: "Review someone else's fix",
        week: 5,
        estimateMinutes: 30,
        points: 20,
        summary: "Open the peer queue and review two submissions.",
        brief: `Reading broken code that is not yours is a skill, and it is the one nobody practises.

Open the peer review queue and review two submissions for steps you have already passed. For each one, say what is wrong or confirm what is right — and say why. "Looks good" is not a review.

You are reviewing the work, not the person: submissions come to you without a name attached.`,
        deliverables: [
          "Two peer reviews submitted, each with a specific, actionable note",
        ],
        rubric:
          "Pass if the trainee describes two reviews they left and what they said. This step is about participation; be generous.",
        peerReviewable: false,
      },
    ],
  },
];
