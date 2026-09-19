/**
 * Loads the original landing page content into MongoDB and creates the first
 * CMS account. Safe to re-run: it wipes the content collections (never leads
 * or media) and writes them again.
 *
 *   npm run seed
 */
import mongoose from "mongoose";
import slugify from "slugify";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { Program } from "../models/Program.js";
import { Lesson } from "../models/Lesson.js";
import { Section } from "../models/Section.js";
import { Faq } from "../models/Faq.js";
import { Technology } from "../models/Technology.js";
import { SiteSettings } from "../models/SiteSettings.js";
import { Theme } from "../models/Theme.js";
import { Track } from "../models/Track.js";
import { Step } from "../models/Step.js";
import { tracks as bootcampTracks } from "./bootcamp.js";

const programs = [
  {
    title: "React, NodeJS, Express & MongoDB - The MERN Fullstack Guide",
    slug: "mern-full-stack",
    // The title already names the four; this line carries what it does not.
    stack: "Mongoose · JWT · REST APIs · Cloud deployment",
    summary: "Build and deploy a complete JavaScript application, front to back.",
    level: "Beginner to job-ready",
    length: "12 weeks",
    prerequisite: "Basic HTML and CSS",
    finishWith: "A deployed full-stack app",
    outcomes: [
      "JavaScript and ES6+ for people who will read other people's code",
      "React: components, state, hooks, routing, forms, data fetching",
      "Node.js and Express: REST APIs, middleware, error handling, validation",
      "MongoDB and Mongoose: schema design, relations, indexes, aggregation",
      "Authentication with JWT, roles and permissions",
      "File uploads, pagination, search, and caching basics",
      "Git workflow, environment config, and deployment to the cloud",
      "Final project: a full application, front to back, live on a URL",
    ],
    modules: [
      {
        title: "JavaScript that holds up",
        duration: "2 weeks",
        summary: "Before React, the language it is written in.",
        topics: [
          "Modern syntax: destructuring, modules, classes, optional chaining",
          "Async JavaScript: promises, async/await, and where errors actually go",
          "Reading code you did not write, without panicking",
        ],
      },
      {
        title: "React",
        duration: "3 weeks",
        summary: "Components, state, and the data flowing through them.",
        topics: [
          "Components, props, and composition that survives a redesign",
          "State and hooks: useState, useEffect, useMemo, and your own",
          "Routing, forms, and validation",
          "Fetching data, and designing the loading and error states",
        ],
      },
      {
        title: "Node and Express",
        duration: "3 weeks",
        summary: "The API behind the app.",
        topics: [
          "REST that other developers can guess: resources, verbs, status codes",
          "Middleware, request validation, and one place errors are handled",
          "File uploads, pagination, and search",
        ],
      },
      {
        title: "MongoDB",
        duration: "2 weeks",
        summary: "Data that survives its second year.",
        topics: [
          "Schema design, and when to embed rather than reference",
          "Mongoose models, relations, and population",
          "Indexes, and the aggregation pipeline",
        ],
      },
      {
        title: "Auth and hardening",
        duration: "1 week",
        summary: "Who is allowed to do what.",
        topics: [
          "Authentication with JWT, and refreshing it properly",
          "Roles, permissions, and protecting routes on both sides",
          "Caching basics and rate limiting",
        ],
      },
      {
        title: "Ship it",
        duration: "1 week",
        summary: "A URL other people can open.",
        topics: [
          "Git workflow for a team",
          "Environment config and secrets",
          "Deploying to the cloud, and the final project",
        ],
      },
    ],
  },
  {
    title: "Angular, .NET Core & SQL Server",
    slug: "angular-dotnet-sql-server",
    stack: "Angular · ASP.NET Core · SQL Server",
    summary: "The enterprise stack, taught the way it is actually structured on the job.",
    level: "Beginner to job-ready",
    length: "14 weeks",
    prerequisite: "Any programming basics",
    finishWith: "An enterprise-style app",
    outcomes: [
      "TypeScript fundamentals and Angular architecture",
      "Components, services, dependency injection, RxJS, reactive forms",
      "C# and ASP.NET Core Web API: controllers, DI, configuration",
      "Clean architecture and domain-driven design, applied to a real project",
      "Entity Framework Core, migrations, and SQL Server data modelling",
      "Writing and tuning SQL: joins, indexes, stored procedures",
      "Identity, JWT, and securing an enterprise API",
      "Final project: an internal business application with reporting",
    ],
    modules: [
      {
        title: "TypeScript and Angular",
        duration: "3 weeks",
        summary: "The language first, then the framework.",
        topics: [
          "TypeScript: types, generics, interfaces, and strictness that pays",
          "Angular architecture: modules, components, templates",
          "Services and dependency injection",
        ],
      },
      {
        title: "Angular in anger",
        duration: "3 weeks",
        summary: "The parts that decide whether an app scales.",
        topics: [
          "RxJS: observables, operators, and when to unsubscribe",
          "Reactive forms and validation",
          "Routing, guards, and lazy loading",
        ],
      },
      {
        title: "C# and ASP.NET Core",
        duration: "3 weeks",
        summary: "The enterprise back end, structured the way it is on the job.",
        topics: [
          "C# for people arriving from JavaScript",
          "Web API: controllers, dependency injection, configuration",
          "Clean architecture and domain-driven design, applied to a real project",
        ],
      },
      {
        title: "SQL Server and EF Core",
        duration: "3 weeks",
        summary: "Modelling the data, then making it fast.",
        topics: [
          "Data modelling and normalisation",
          "Entity Framework Core, migrations, and change tracking",
          "Writing and tuning SQL: joins, indexes, stored procedures",
        ],
      },
      {
        title: "Enterprise concerns",
        duration: "2 weeks",
        summary: "What separates a demo from an internal system.",
        topics: [
          "Identity and JWT",
          "Securing an API for real users and real auditors",
          "Final project: an internal business application with reporting",
        ],
      },
    ],
  },
  {
    title: "DevOps & cloud",
    slug: "devops-cloud",
    stack: "Azure · AWS · Docker · CI/CD",
    summary: "Take a commit all the way to production, automatically.",
    level: "Developers with some experience",
    length: "10 weeks",
    prerequisite: "You can build a small app",
    finishWith: "A working CI/CD pipeline",
    outcomes: [
      "Linux, shell, and networking basics you actually need day to day",
      "Git branching strategies for teams",
      "Docker: images, layers, volumes, multi-stage builds, Compose",
      "CI/CD pipelines with GitHub Actions and Azure DevOps",
      "Deploying on Azure and AWS: compute, storage, managed databases",
      "Secrets management, environment separation, and zero-downtime releases",
      "Monitoring, logging, and reading production incidents",
      "Final project: a pipeline that takes a commit to production automatically",
    ],
    modules: [
      {
        title: "The ground floor",
        duration: "2 weeks",
        summary: "The parts everything else assumes you know.",
        topics: [
          "Linux and the shell you actually need day to day",
          "Networking basics: DNS, TLS, ports, proxies",
          "Git branching strategies for teams",
        ],
      },
      {
        title: "Docker",
        duration: "2 weeks",
        summary: "Making the machine irrelevant.",
        topics: [
          "Images, layers, and the build cache",
          "Volumes, networks, and Compose",
          "Multi-stage builds, and images that are not a gigabyte",
        ],
      },
      {
        title: "Pipelines",
        duration: "2 weeks",
        summary: "From a commit to an artefact, without you.",
        topics: [
          "GitHub Actions from first principles",
          "Azure DevOps pipelines",
          "Testing, gating, and publishing artefacts",
        ],
      },
      {
        title: "Cloud",
        duration: "2 weeks",
        summary: "Two providers, so you can tell what is essential.",
        topics: [
          "Azure: compute, storage, managed databases",
          "AWS: the equivalent services, and where they differ",
          "Secrets management and environment separation",
        ],
      },
      {
        title: "Running it",
        duration: "2 weeks",
        summary: "The half of the job that starts after deploy.",
        topics: [
          "Zero-downtime releases, and rolling back calmly",
          "Monitoring, logging, and alerts worth waking up for",
          "Reading a production incident, and the final pipeline",
        ],
      },
    ],
  },
  {
    title: "Mobile app development",
    slug: "mobile-app-development",
    stack: "React Native · Node.js · Express · MongoDB",
    summary: "Ship an app to a real device and submit it to a store.",
    level: "Beginner to job-ready",
    length: "12 weeks",
    prerequisite: "JavaScript basics",
    finishWith: "A published mobile app",
    outcomes: [
      "React and React Native: components, navigation, native styling",
      "State management, offline storage, and handling flaky connections",
      "Building the API behind the app with Node.js, Express, and MongoDB",
      "Authentication, push notifications, camera, maps, and permissions",
      "Performance: lists, images, re-renders, and app size",
      "Builds and signing for iOS and Android",
      "Publishing to the App Store and Google Play, and shipping updates",
      "Final project: an app running on a real device, submitted to a store",
    ],
    modules: [
      {
        title: "React, then React Native",
        duration: "3 weeks",
        summary: "The same ideas, a different renderer.",
        topics: [
          "React fundamentals: components, state, hooks",
          "Native components and styling",
          "Navigation and screen structure",
        ],
      },
      {
        title: "State and data",
        duration: "2 weeks",
        summary: "An app that works on a train.",
        topics: [
          "State management that does not collapse at scale",
          "Offline storage and sync",
          "Flaky connections, retries, and optimistic updates",
        ],
      },
      {
        title: "The API behind it",
        duration: "2 weeks",
        summary: "Mobile clients ask different things of a server.",
        topics: [
          "Node, Express and MongoDB for a mobile client",
          "Authentication and token refresh on a device",
          "Push notifications",
        ],
      },
      {
        title: "Device features",
        duration: "2 weeks",
        summary: "The reasons it is an app and not a website.",
        topics: [
          "Camera, maps, and permissions",
          "Performance: lists, images, and re-renders",
          "App size and startup time",
        ],
      },
      {
        title: "Shipping",
        duration: "3 weeks",
        summary: "Getting past review, twice.",
        topics: [
          "Builds and signing for iOS and Android",
          "App Store and Google Play submission",
          "Updates, crash reporting, and the final project",
        ],
      },
    ],
  },
  {
    title: "Web fundamentals",
    slug: "web-fundamentals",
    stack: "HTML · CSS · JavaScript",
    summary: "Start from zero and put your first real site online.",
    level: "Complete beginners",
    length: "8 weeks",
    prerequisite: "None",
    finishWith: "Your first deployed site",
    outcomes: [
      "HTML that is structured, accessible, and readable",
      "CSS layout with flexbox and grid, and responsive design that holds up",
      "JavaScript from variables to functions, arrays, objects, and the DOM",
      "Events, forms, validation, and talking to an API with fetch",
      "Async JavaScript: promises, async/await, error handling",
      "Debugging in the browser and reading errors without panicking",
      "Git, GitHub, and putting your work online",
      "Final project: a responsive site you built and deployed yourself",
    ],
    modules: [
      {
        title: "HTML",
        duration: "1 week",
        summary: "Structure first, because everything else sits on it.",
        topics: [
          "Semantic structure, and why it is not decoration",
          "Accessibility from the start, not bolted on",
          "Forms and inputs",
        ],
      },
      {
        title: "CSS",
        duration: "2 weeks",
        summary: "Layout you can reason about.",
        topics: [
          "The box model and the cascade",
          "Flexbox and grid",
          "Responsive design that holds up on a real phone",
        ],
      },
      {
        title: "JavaScript",
        duration: "3 weeks",
        summary: "From nothing to talking to an API.",
        topics: [
          "Variables, functions, arrays, objects",
          "The DOM, events, and forms",
          "Async: promises, async/await, and fetch",
        ],
      },
      {
        title: "Working like a developer",
        duration: "2 weeks",
        summary: "The habits, not just the syntax.",
        topics: [
          "Debugging in the browser and reading errors without panicking",
          "Git and GitHub",
          "Putting your site online, and the final project",
        ],
      },
    ],
  },
  {
    title: "Complete RAG Tutorial 2026: Build AI Apps",
    slug: "ai-engineering-rag",
    stack: "Python · LangChain · Vector databases · LLM APIs",
    summary:
      "Build a retrieval-augmented application end to end: ingest a corpus, chunk it well, search it properly, and rerank what the model actually sees.",
    level: "Developers with some experience",
    length: "9 weeks",
    prerequisite: "Comfortable with Python",
    finishWith: "A deployed RAG application",
    outcomes: [
      "What retrieval-augmented generation is, and when it beats fine-tuning",
      "Vector embeddings, similarity search, and how the pieces of a RAG pipeline fit together",
      "Ingesting documents with Python: loaders, cleaning, and metadata that survives retrieval",
      "Chunking properly: fixed, recursive, semantic, and agent-based splitting compared",
      "Retrieval with LangChain: multi-query, hybrid search, and reciprocal rank fusion",
      "Reranking so the model sees the right context instead of the nearest context",
      "Multi-modal RAG across images and documents",
      "Conversational RAG that keeps chat history straight",
      "Final project: an application answering questions over a corpus you chose, deployed",
    ],
    modules: [
      {
        title: "Introduction",
        duration: "1 week",
        summary: "The idea, before any tooling.",
        topics: [
          "Retrieval augmented generation, and when it beats fine-tuning",
          "Vector embeddings, and what similarity really measures",
          "The shape of a pipeline: ingest, chunk, retrieve, rerank, answer",
        ],
      },
      {
        title: "Your first pipeline",
        duration: "2 weeks",
        summary: "Ingest, retrieve and answer end to end, before optimising anything.",
        topics: [
          "Loaders, cleaning, and metadata that survives retrieval",
          "Document retrieval with LangChain",
          "Cosine similarity, and reading a score honestly",
          "A working application, then chat history on top of it",
        ],
      },
      {
        title: "Chunking",
        duration: "2 weeks",
        summary: "The single biggest lever on answer quality.",
        topics: [
          "Fixed and recursive splitting, and where each breaks",
          "Semantic chunking",
          "Agent-based chunking, and how to compare strategies honestly",
        ],
      },
      {
        title: "Retrieval",
        duration: "2 weeks",
        summary: "Finding the right context, not merely the nearest one.",
        topics: [
          "Multi-modal retrieval across images and documents",
          "Advanced document retrieval techniques",
          "Multi-query retrieval",
        ],
      },
      {
        title: "Ranking, and next steps",
        duration: "2 weeks",
        summary: "Making it good enough to put in front of people.",
        topics: [
          "Reciprocal rank fusion",
          "Hybrid search: vector plus keyword",
          "Reranking what the model finally sees, and the final project",
        ],
      },
    ],
    lessons: [
      { title: "RAG Tutorial 2026 #1: Complete Introduction to Retrieval Augmented Generation", slug: "intro-to-rag", module: 0, duration: "2:45", isFree: true },
      { title: "RAG Tutorial 2026 #2: Vector Embeddings and RAG Architecture Explained", slug: "vector-embeddings-and-architecture", module: 0, duration: "19:33" },
      { title: "RAG Tutorial 2026 #3: Build Data Ingestion Pipeline with Python", slug: "data-ingestion-pipeline", module: 1, duration: "17:38", isFree: true },
      { title: "RAG Tutorial 2026 #4: Document Retrieval Implementation with LangChain", slug: "document-retrieval-langchain", module: 1, duration: "10:23" },
      { title: "RAG Tutorial 2026 #5: Cosine Similarity for Vector Search Explained", slug: "cosine-similarity", module: 1, duration: "7:30" },
      { title: "RAG Tutorial 2026 #6: Build Your First RAG Application from Scratch", slug: "first-rag-application", module: 1, duration: "2:10" },
      { title: "RAG Tutorial 2026 #7: Conversational RAG with Chat History", slug: "conversational-rag", module: 1, duration: "7:41" },
      { title: "RAG Tutorial 2026 #8: Text Chunking Strategies for Better RAG Performance", slug: "chunking-strategies", module: 2, duration: "5:04", isFree: true },
      { title: "RAG Tutorial 2026 #9: Advanced Text Splitting with LangChain Python", slug: "advanced-text-splitting", module: 2, duration: "13:32" },
      { title: "RAG Tutorial 2026 #10: Semantic Chunking for Improved RAG Results", slug: "semantic-chunking", module: 2, duration: "12:41" },
      { title: "RAG Tutorial 2026 #11: AI Agent-Based Document Chunking", slug: "agent-based-chunking", module: 2, duration: "5:32" },
      { title: "RAG Tutorial 2026 #12: Multi-Modal RAG with Images and Documents", slug: "multi-modal-rag", module: 3, duration: "57:11" },
      { title: "RAG Tutorial 2026 #13: Advanced Document Retrieval Techniques", slug: "advanced-retrieval", module: 3, duration: "9:20", isFree: true },
      { title: "RAG Tutorial 2026 #14: Multi-Query RAG for Better Search Results", slug: "multi-query-rag", module: 3, duration: "5:57" },
      { title: "RAG Tutorial 2026 #15: Reciprocal Rank Fusion for Enhanced RAG Performance", slug: "reciprocal-rank-fusion", module: 4, duration: "12:59", isFree: true },
      { title: "RAG Tutorial 2026 #16: Hybrid Search combining Vector and Keyword Search", slug: "hybrid-search", module: 4, duration: "27:43" },
      { title: "RAG Tutorial 2026 #17: RAG Reranking and Next Steps!", slug: "rag-reranking", module: 4, duration: "28:53" },
    ],
  },
]


const technologies = [
  { name: "HTML & CSS", group: "front", weight: 3 },
  { name: "JavaScript", group: "front", weight: 3 },
  { name: "React", group: "front", weight: 4 },
  { name: "Angular", group: "front", weight: 4 },
  { name: "Node.js", group: "back", weight: 4 },
  { name: "Express", group: "back", weight: 2 },
  { name: ".NET Core", group: "back", weight: 5 },
  { name: "MongoDB", group: "data", weight: 2 },
  { name: "SQL Server", group: "data", weight: 2 },
  { name: "React Native", group: "mobile", weight: 4 },
  { name: "Python", group: "ai", weight: 3 },
  { name: "LangChain", group: "ai", weight: 3 },
  { name: "RAG", group: "ai", weight: 4 },
  { name: "Vector databases", group: "ai", weight: 2 },
  { name: "LLM APIs", group: "ai", weight: 2 },
  { name: "Azure", group: "ops", weight: 3 },
  { name: "AWS", group: "ops", weight: 3 },
  { name: "Docker", group: "ops", weight: 2 },
  { name: "CI/CD", group: "ops", weight: 2 },
  { name: "Git", group: "ops", weight: 1 },
];

const sections = [
  {
    slug: "how",
    type: "week",
    theme: "ink",
    navLabel: "How it works",
    title: "Three ways of learning, in the same week",
    lede: "You are never waiting for the next class to make progress, and never stuck alone on a bug for three days.",
    items: [
      {
        meta: "Recorded",
        title: "Video lessons on demand",
        text: "Every topic is recorded and stays available. Watch at your pace, rewind the parts that matter, and come to the live session with real questions instead of notes.",
      },
      {
        meta: "Every Monday",
        title: "Live group session",
        text: "One hour and a half with the group: I code live, review what you built during the week, answer questions, and set the next task. Recorded too, if you miss it.",
      },
      {
        meta: "On request",
        title: "1:1 hours",
        text: "Private sessions for debugging your own project, preparing for interviews, a code review, or moving faster than the group. Book them one at a time or as a package.",
      },
    ],
  },
  {
    slug: "programs",
    type: "programs",
    theme: "paper",
    navLabel: "Programs",
    title: "Programs",
    lede: "Each one ends with a project you can show an employer, deployed and running, not a folder of exercises.",
    body: "Want React with .NET, or React Native with SQL Server, or only the DevOps half? Any combination works. Use the builder at the top and tell me what you need.",
  },
  {
    slug: "bootcamp",
    type: "bootcamp",
    theme: "paper",
    navLabel: "Bootcamp",
    eyebrow: "Twelve weeks",
    title: "Or learn it the way the job actually happens",
    lede:
      "A course you watch teaches you the ideas. The bootcamp puts you in the situations: build the piece, then fix the bug someone left in it, then ship it — with your code read every week, not just at the end.",
    ctaLabel: "See how it works",
  },
  {
    slug: "access",
    type: "steps",
    theme: "paper",
    navLabel: "Videos",
    title: "Watching the videos",
    lede: "Every lesson is a recording you stream in your browser. Nothing to install, and nothing to download — the videos stay tied to your account.",
    body: "Each Monday session is added to your program within a day, so the library keeps growing while you are enrolled. Your access stays open for 12 months after the program ends, including anything added after you finish.",
    items: [
      {
        meta: "Step 1",
        title: "Enroll and pay",
        text: "Pick your program and format, and pay by card, bank transfer, or Whish. You get a receipt straight away.",
      },
      {
        meta: "Step 2",
        title: "Get your login",
        text: "Within a few hours I send you an email with a link to set your password on the course portal. One account, yours only.",
      },
      {
        meta: "Step 3",
        title: "Open your program",
        text: "Sign in and your program is there, split into sections and lessons, with the exercise files for each one attached.",
      },
      {
        meta: "Step 4",
        title: "Watch on anything",
        text: "Phone, laptop, or tablet. It remembers where you stopped, plays from 0.75× to 2×, and has subtitles.",
      },
    ],
  },
  {
    slug: "free-lesson",
    type: "callout",
    theme: "secondary",
    title: "One lesson from every program is free to watch",
    body: "Open any program above and hit the play button. No account, no card, no email. Watch how a topic is explained before you decide whether to pay for the rest.",
  },
  {
    slug: "formats",
    type: "cards",
    theme: "paper",
    navLabel: "Formats",
    title: "Ways to join",
    lede: "Same material, different amounts of attention.",
    body: "Ask about pricing and the next start date — payment plans are available.",
    items: [
      {
        title: "Group program",
        text: "The full experience, with a cohort.",
        meta: "All recorded lessons for your program\nLive session every Monday\nWeekly tasks with feedback\nPrivate group chat for questions\nCertificate on completion",
        ctaLabel: "Ask about the group",
        href: "#enroll",
      },
      {
        title: "1:1",
        text: "Private sessions, scheduled around you.",
        meta: "Everything in the group program\nSessions at your pace and level\nCode review on your own project\nInterview and portfolio preparation\nSingle hours or a package",
        badge: "Most attention",
        featured: true,
        ctaLabel: "Ask about 1:1",
        href: "#enroll",
      },
    ],
  },
  {
    slug: "about",
    type: "split",
    theme: "paper",
    navLabel: "Instructor",
    title: "Taught by someone who ships",
    lede: "I run the technical side of a software agency. The code I teach is the code I write for clients: applications in production, mobile apps in the stores, APIs that have to stay up.",
    body: "That changes what gets taught. You learn how to structure a project so it survives its second year, how to read an error instead of pasting it somewhere, how to review your own work before someone else does. The tutorials that stop at \"it runs on my machine\" are the reason so many juniors struggle in their first job.\n\nI have taught full-stack, backend, and web fundamentals to students, interns, and working developers. Groups stay small so I can actually look at your code.",
    items: [
      { meta: "Instructor", title: "Elie" },
      { meta: "Experience", title: "More than 10 years building software" },
      { meta: "Based in", title: "Beirut, teaching online across MENA and the Gulf" },
      {
        meta: "Works with",
        title: "React, React Native, Node.js, .NET, MongoDB, SQL Server, Azure, AWS, GCP",
      },
    ],
  },
  {
    slug: "faq",
    type: "faq",
    theme: "paper",
    navLabel: "Questions",
    title: "Questions",
  },
];

const faqs = [
  {
    question: "I have never written code. Can I start?",
    answer:
      "Yes. Start with web fundamentals, then move into MERN, mobile, or the .NET track. The other programs assume you can already build a small page and read basic JavaScript.",
  },
  {
    question: "What if I miss the Monday session?",
    answer:
      "Every live session is recorded and posted the same day. You can send your questions before the session and I will answer them on the call.",
  },
  {
    question: "Can I watch something before I pay?",
    answer:
      "Yes. Each program has one full lesson open to everyone, linked inside the program above. No account and no card needed.",
  },
  {
    question: "How long do I keep the videos?",
    answer:
      "Twelve months after your program ends, including any recording added in that time. The Monday sessions are recorded and appear in your program within a day.",
  },
  {
    question: "Can I download the lessons?",
    answer:
      "The videos stream rather than download, so they stay tied to your account. If your connection is unreliable, drop the quality to 480p, or tell me and I will find a way that works for you.",
  },
  {
    question: "What language are the sessions in?",
    answer: "English or Arabic, whichever suits the group. Course material and code are in English.",
  },
  {
    question: "How much time do I need per week?",
    answer:
      "Around six to eight hours: the recorded lessons, the live session, and the weekly task. Less than that and progress gets slow.",
  },
  {
    question: "Do I get a certificate?",
    answer:
      "Yes, on completing the program and its final project. The project itself will do more for you in an interview.",
  },
];

const settings = {
  key: "site",
  brandName: "Bug Bakery",
  brandTagline: "Software training",
  metaTitle: "Bug Bakery — Software Training | MERN, .NET, DevOps, Mobile",
  metaDescription:
    "Practical software training: recorded lessons you watch on your own time, a live session every Monday, and 1:1 hours. MERN, Angular + .NET Core, DevOps, React Native, and web fundamentals.",
  heroTitle: "Learn to build software the way it's built",
  heroHighlight: "at work",
  heroLede:
    "Recorded lessons you watch whenever you want, a live session with me every Monday, and 1:1 hours when you need to get unstuck. Five programs, or any mix of the technologies in them.",
  heroPrimaryCta: { label: "Book an intro call", href: "#enroll" },
  heroSecondaryCta: { label: "See the programs", href: "#programs" },
  heroStats: [
    { value: "6", label: "programs" },
    { value: "Mon", label: "live session, every week" },
    { value: "1:1", label: "hours on request" },
  ],
  week: [
    { day: "Sun", label: "watch", highlight: false },
    { day: "Mon", label: "live session", highlight: true },
    { day: "Tue", label: "build", highlight: false },
    { day: "Wed", label: "build", highlight: false },
    { day: "Thu", label: "review", highlight: false },
    { day: "Fri", label: "build", highlight: false },
    { day: "Sat", label: "catch up", highlight: false },
  ],
  builderTitle: "Build your own track",
  builderNote: "Pick the technologies you want. I'll put together a plan around them.",
  enrollTitle: "Tell me what you want to learn",
  enrollLede:
    "Send this and I will reply with the curriculum, the schedule, and pricing for the format you picked. No obligation.",
  email: "contact@bug-bakery.com",
  whatsapp: "96171375587",
  linkedin: "https://www.linkedin.com/in/elias-el-saide-941173116/",
  location: "Beirut, Lebanon",
  footerNote: "Software training by Bug Bakery — Beirut, Lebanon",
  announcement: { text: "", href: "", active: false },
};

/**
 * A section's contents are its lectures. Programs that have not had their
 * videos recorded yet get one lecture per topic, so the curriculum is
 * video-shaped from the start and the recordings drop straight into place.
 */
function lessonsFromModules(modules = []) {
  const used = new Set();
  const lessons = [];

  modules.forEach((module, moduleIndex) => {
    (module.topics ?? []).forEach((topic, topicIndex) => {
      // Long topic sentences make unusable urls, so trim on a word boundary.
      const words = slugify(topic, { lower: true, strict: true }).split("-");
      let slug = words.reduce(
        (acc, word) => (acc.length + word.length + 1 > 56 ? acc : acc ? `${acc}-${word}` : word),
        ""
      );
      if (!slug) slug = `lesson-${moduleIndex + 1}-${topicIndex + 1}`;

      let unique = slug;
      let n = 2;
      while (used.has(unique)) unique = `${slug}-${n++}`;
      used.add(unique);

      lessons.push({
        title: topic,
        slug: unique,
        module: moduleIndex,
        // One open preview per section.
        isFree: topicIndex === 0,
      });
    });
  });

  return lessons;
}

async function run() {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
  console.log("[seed] connected");

  // Media uploaded through the CMS outlives a reseed, so keep the references
  // to it rather than resetting the brand back to nothing.
  const previous = await SiteSettings.findOne({ key: "site" }).lean();

  await Promise.all([
    Program.deleteMany({}),
    Lesson.deleteMany({}),
    Section.deleteMany({}),
    Faq.deleteMany({}),
    Technology.deleteMany({}),
    SiteSettings.deleteMany({}),
    Theme.deleteMany({}),
    Track.deleteMany({}),
    Step.deleteMany({}),
  ]);

  await SiteSettings.create({
    ...settings,
    logo: previous?.logo ?? null,
    ogImage: previous?.ogImage ?? null,
    heroMedia: previous?.heroMedia ?? null,
  });
  await Theme.create({ key: "theme" });

  await Technology.insertMany(technologies.map((t, order) => ({ ...t, order })));
  await Faq.insertMany(faqs.map((f, order) => ({ ...f, order })));
  await Section.insertMany(sections.map((s, order) => ({ ...s, order })));

  for (const [order, { lessons, ...program }] of programs.entries()) {
    program.instructor = program.instructor ?? "Elie";
    const list = lessons ?? lessonsFromModules(program.modules);

    // Once a section has lectures, they are its contents — the topic list that
    // seeded them would only be the same text twice.
    const filled = new Set(list.map((lesson) => lesson.module));
    const modules = (program.modules ?? []).map((module, index) =>
      filled.has(index) ? { ...module, topics: [] } : module
    );

    const created = await Program.create({ ...program, modules, order });
    await Lesson.insertMany(
      list.map((lesson, index) => ({
        program: created._id,
        title: lesson.title,
        slug: lesson.slug,
        duration: lesson.duration,
        module: lesson.module ?? null,
        description: lesson.isFree
          ? `A full lesson from ${created.title}, open to everyone.`
          : undefined,
        source: "url",
        videoUrl: "",
        isFree: Boolean(lesson.isFree),
        order: index,
      }))
    );
  }

  // Bootcamp tracks and their steps. Enrolments and submissions are trainee
  // data, so they survive a reseed the same way leads and media do.
  for (const [order, { steps = [], ...track }] of bootcampTracks.entries()) {
    const created = await Track.create({ ...track, order });
    // Authored roughly by topic; a trainee walks them by week, so the stored
    // order follows the schedule rather than the order they were written in.
    const scheduled = [...steps].sort((a, b) => (a.week ?? 1) - (b.week ?? 1));
    await Step.insertMany(
      scheduled.map((step, index) => ({
        ...step,
        track: created._id,
        slug: slugify(step.title, { lower: true, strict: true }),
        order: index,
      }))
    );
  }

  const existingAdmin = await User.findOne({ email: env.admin.email.toLowerCase() });
  if (existingAdmin) {
    console.log(`[seed] admin already exists: ${existingAdmin.email}`);
  } else {
    await User.create({
      name: env.admin.name,
      email: env.admin.email,
      password: env.admin.password,
      role: "admin",
    });
    console.log(`[seed] admin created: ${env.admin.email} / ${env.admin.password}`);
  }

  const stepTotal = bootcampTracks.reduce((n, t) => n + (t.steps?.length ?? 0), 0);
  console.log(
    `[seed] ${programs.length} programs, ${sections.length} sections, ${faqs.length} faqs, ${technologies.length} technologies`
  );
  console.log(`[seed] ${bootcampTracks.length} bootcamp track(s), ${stepTotal} steps`);
  await mongoose.disconnect();
  console.log("[seed] done");
}

run().catch((err) => {
  console.error("[seed] failed:", err.message);
  process.exit(1);
});
