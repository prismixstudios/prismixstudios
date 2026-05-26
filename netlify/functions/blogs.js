/**
 * blogs.js — Netlify Function
 *
 * Handles all blog data requests for the Prismix website.
 * Mounted at /.netlify/functions/blogs, proxied as /api/blogs via netlify.toml.
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │  GET  /api/blogs   Public — returns all posts (JSON)     │
 * │  POST /api/blogs   Protected — agent ingests a new post  │
 * └──────────────────────────────────────────────────────────┘
 *
 * POST authentication:
 *   Header:  Authorization: Bearer <BLOG_INGEST_TOKEN>
 *   The token must be set as a Netlify environment variable.
 *   Returns 401 if the token is missing or wrong.
 *
 * POST body (all fields except title and body are optional):
 *   {
 *     "title":       "string",
 *     "body":        ["paragraph 1", "paragraph 2"],
 *     "excerpt":     "optional — auto-generated from body if absent",
 *     "image":       "optional URL or null",
 *     "publishedAt": "optional ISO date — defaults to now",
 *     "linkedinUrl": "optional — links this post to a LinkedIn update",
 *     "author":      { "name": "...", "role": "...", "initials": "..." },
 *     "category":    "optional — defaults to Prismix Journal",
 *     "tags":        ["optional"],
 *     "pullQuote":   "optional",
 *     "published":   "optional boolean — defaults to true. false = draft, hidden from frontend",
 *     "dryRun":      "optional boolean — defaults to false. true = saved to posts.json but hidden from frontend"
 *   }
 *
 * Draft / dry-run behaviour:
 *   A post is hidden from the frontend when published === false OR dryRun === true.
 *   The post is still written to data/posts.json in full so it can be inspected
 *   or promoted later by re-POSTing with published: true and dryRun: false.
 *
 * See README.md for a full curl example.
 */

// ─── Storage: GitHub-backed trial (active since 2026-05-25) ──────────────────
// The agent write path now reads/writes data/posts.json on GitHub.
// The frontend reads that file directly from raw.githubusercontent.com.
import { readPostsFromGitHub, writePostsToGitHub } from "./lib/githubPostStore.js";

// mergePosts is storage-agnostic; still imported from the legacy postStore module
import { mergePosts } from "./lib/postStore.js";

// LEGACY — Netlify Blobs storage (preserved for easy revert; not active during trial)
// import { readPosts, writePosts } from "./lib/postStore.js";

// ─── Input validation ─────────────────────────────────────────────────────────

/**
 * Returns a human-readable error string if `body` fails validation,
 * or null if everything is acceptable.
 *
 * Checked here (not in normalizeAgentPost) so we can reject bad payloads
 * before touching storage.
 */
function validatePostBody(body) {
  // title — required, string, max 200 chars
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return 'Missing required field: "title" (non-empty string)';
  }
  if (body.title.trim().length > 200) {
    return '"title" must be 200 characters or fewer';
  }

  // body — required, non-empty string array
  if (!Array.isArray(body.body) || body.body.length === 0) {
    return 'Missing required field: "body" (non-empty array of strings)';
  }
  if (body.body.length > 100) {
    return '"body" must contain 100 paragraphs or fewer';
  }
  for (var i = 0; i < body.body.length; i++) {
    if (typeof body.body[i] !== "string") {
      return '"body[' + i + ']" must be a string';
    }
    if (body.body[i].length > 10000) {
      return '"body" paragraphs must be 10,000 characters or fewer each';
    }
  }

  // excerpt — optional string, max 600 chars
  if (body.excerpt != null) {
    if (typeof body.excerpt !== "string") return '"excerpt" must be a string';
    if (body.excerpt.length > 600)        return '"excerpt" must be 600 characters or fewer';
  }

  // image — optional, must be an http/https URL
  if (body.image != null) {
    if (typeof body.image !== "string")      return '"image" must be a string URL or null';
    if (body.image.length > 2048)            return '"image" URL must be 2048 characters or fewer';
    if (!isHttpUrl(body.image))              return '"image" must be a valid http or https URL';
  }

  // linkedinUrl — optional, must be an http/https URL
  if (body.linkedinUrl != null) {
    if (typeof body.linkedinUrl !== "string") return '"linkedinUrl" must be a string URL or null';
    if (body.linkedinUrl.length > 2048)       return '"linkedinUrl" URL must be 2048 characters or fewer';
    if (!isHttpUrl(body.linkedinUrl))         return '"linkedinUrl" must be a valid http or https URL';
  }

  // publishedAt — optional; invalid values are silently ignored (normalizeAgentPost falls back to now)
  if (body.publishedAt != null && typeof body.publishedAt !== "string") {
    return '"publishedAt" must be a string';
  }

  // author — optional object
  if (body.author != null) {
    if (typeof body.author !== "object" || Array.isArray(body.author)) {
      return '"author" must be an object';
    }
    if (body.author.name != null) {
      if (typeof body.author.name !== "string") return '"author.name" must be a string';
      if (body.author.name.length > 200)        return '"author.name" must be 200 characters or fewer';
    }
    if (body.author.role != null) {
      if (typeof body.author.role !== "string") return '"author.role" must be a string';
      if (body.author.role.length > 100)        return '"author.role" must be 100 characters or fewer';
    }
    if (body.author.initials != null) {
      if (typeof body.author.initials !== "string") return '"author.initials" must be a string';
      if (body.author.initials.length > 10)         return '"author.initials" must be 10 characters or fewer';
    }
  }

  // category — optional string, max 100 chars
  if (body.category != null) {
    if (typeof body.category !== "string") return '"category" must be a string';
    if (body.category.length > 100)        return '"category" must be 100 characters or fewer';
  }

  // pullQuote — optional string, max 600 chars
  if (body.pullQuote != null) {
    if (typeof body.pullQuote !== "string") return '"pullQuote" must be a string';
    if (body.pullQuote.length > 600)        return '"pullQuote" must be 600 characters or fewer';
  }

  // tags — optional string array, max 20 items, each max 100 chars
  if (body.tags != null) {
    if (!Array.isArray(body.tags)) return '"tags" must be an array';
    if (body.tags.length > 20)     return '"tags" must contain 20 items or fewer';
    for (var j = 0; j < body.tags.length; j++) {
      if (typeof body.tags[j] !== "string") return '"tags[' + j + ']" must be a string';
      if (body.tags[j].length > 100)        return '"tags" items must be 100 characters or fewer each';
    }
  }

  // published — optional boolean (default true)
  // false means the post is saved to posts.json but filtered out by the frontend
  if (body.published != null) {
    if (typeof body.published !== "boolean") return '"published" must be a boolean';
  }

  // dryRun — optional boolean (default false)
  // true means the post is saved to posts.json but filtered out by the frontend
  if (body.dryRun != null) {
    if (typeof body.dryRun !== "boolean") return '"dryRun" must be a boolean';
  }

  return null;
}

/** Returns true only for absolute http / https URLs. */
function isHttpUrl(str) {
  try {
    var u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── GET handler ──────────────────────────────────────────────────────────────

/**
 * Debug / legacy endpoint — reads posts directly from GitHub and returns them.
 *
 * The production frontend no longer calls this route; it reads from the raw
 * GitHub URL (VITE_BLOGS_JSON_URL) instead.  This handler is kept so you can
 * inspect the live post store with a plain curl or browser request.
 *
 * Cache-Control is set to no-store so you always get the freshest data when
 * using this for debugging.
 *
 * LEGACY NOTE: During the Netlify Blobs era, this called readPosts() from
 * postStore.js.  Swap the storage call below if reverting to Blobs.
 */
async function handleGet() {
  // ACTIVE: read from GitHub
  var { posts } = await readPostsFromGitHub();

  // LEGACY (Netlify Blobs — revert by uncommenting):
  // var posts = await readPosts();

  return new Response(JSON.stringify(posts), {
    status: 200,
    headers: {
      "Content-Type":                "application/json",
      "Cache-Control":               "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// ─── POST handler ─────────────────────────────────────────────────────────────

/**
 * Accepts a blog post from the AI agent, normalizes it, merges it into
 * the existing posts in Netlify Blobs, and returns the saved post.
 *
 * Steps:
 *   1. Verify the Authorization header matches BLOG_INGEST_TOKEN
 *   2. Parse and validate the JSON body
 *   3. Normalize — fill in defaults for every optional field
 *   4. Merge into existing posts using dedup rules from postStore.js
 *   5. Write back to Blobs and return the saved post
 */
async function handlePost(req) {
  console.log("[blogs] POST /api/blogs received");

  // ── Step 1: Check the bearer token ──────────────────────────────
  var token = process.env.BLOG_INGEST_TOKEN;

  if (!token) {
    console.error("[blogs] BLOG_INGEST_TOKEN is not set — check Netlify env vars for this deploy context");
    return new Response("Server misconfiguration", { status: 500 });
  }

  var authHeader = req.headers.get("authorization") ?? "";

  if (authHeader !== "Bearer " + token) {
    console.error("[blogs] Auth failed — token mismatch. Received header:", authHeader ? "(present but wrong)" : "(missing)");
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("[blogs] Auth OK");

  // ── Step 2: Parse body ───────────────────────────────────────────
  var body;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[blogs] Failed to parse JSON body:", err.message);
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    console.error("[blogs] Body is not a JSON object:", typeof body);
    return new Response("Request body must be a JSON object", { status: 400 });
  }

  console.log("[blogs] Body parsed. Fields received:", Object.keys(body).join(", "));

  // ── Step 3: Validate all fields ─────────────────────────────────
  var validationError = validatePostBody(body);
  if (validationError) {
    console.error("[blogs] Validation failed:", validationError);
    return new Response(validationError, { status: 400 });
  }

  console.log("[blogs] Validation passed");

  // ── Step 4: Normalize into the standard post shape ───────────────
  var post = normalizeAgentPost(body);
  console.log("[blogs] Normalized post — id:", post.id, "| publishedAt:", post.publishedAt, "| published:", post.published, "| dryRun:", post.dryRun);

  // ── Step 5: Read existing posts from GitHub, merge, write back ───
  console.log("[blogs] Reading posts from GitHub...");
  var { posts: existing, sha } = await readPostsFromGitHub();
  console.log("[blogs] GitHub read OK — existing posts:", existing.length, "| sha:", sha ?? "(none — new file)");

  var merged = mergePosts(existing, post);
  console.log("[blogs] Merged — total posts:", merged.length);

  console.log("[blogs] Writing posts to GitHub...");
  await writePostsToGitHub(merged, sha);
  console.log("[blogs] GitHub write OK");

  // LEGACY (Netlify Blobs — revert by uncommenting and removing the lines above):
  // var existing = await readPosts();
  // var merged   = mergePosts(existing, post);
  // await writePosts(merged);

  console.log('[blogs] Done. Ingested post "' + post.title + '" (id: ' + post.id + ')');

  return new Response(JSON.stringify(post), {
    status: 200,
    headers: {
      "Content-Type":                "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// ─── Normalize agent input ────────────────────────────────────────────────────

/**
 * Converts the raw POST body into the canonical blog post shape that
 * Blogs.jsx and the rest of the system expect.
 *
 * Every optional field has a safe default so the frontend never encounters
 * undefined values.
 *
 * @param {object} raw  - the parsed POST body from the AI agent
 * @returns {object}    - a fully-populated post ready for storage
 */
function normalizeAgentPost(raw) {
  var title       = raw.title.trim();
  var bodyLines   = raw.body.filter(function (p) { return typeof p === "string" && p.trim(); });
  var fullText    = bodyLines.join(" ");

  var parsedDate  = raw.publishedAt ? new Date(raw.publishedAt) : null;
  var publishedAt = (parsedDate && !isNaN(parsedDate.getTime()))
    ? parsedDate.toISOString()
    : new Date().toISOString();

  // Generate a stable, human-readable id from the title and date.
  // Format: "my-post-title-2025-05-23"
  var dateSlug  = publishedAt.slice(0, 10);
  var titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  var id = titleSlug + "-" + dateSlug;

  // Excerpt: first 280 chars of the body text when not provided
  var excerpt;
  if (raw.excerpt && raw.excerpt.trim()) {
    excerpt = raw.excerpt.trim();
  } else if (fullText.length > 280) {
    excerpt = fullText.slice(0, 277).trimEnd() + "…";
  } else {
    excerpt = fullText;
  }

  // readMinutes: average reading speed of 200 words per minute, minimum 1
  var wordCount   = fullText.split(/\s+/).filter(Boolean).length;
  var readMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // pullQuote: provided value, or the first sentence of the body
  var pullQuote;
  if (raw.pullQuote && raw.pullQuote.trim()) {
    pullQuote = raw.pullQuote.trim();
  } else {
    var firstSentence = (fullText.split(/[.!?]/)[0] ?? "").trim();
    pullQuote = firstSentence.length > 20
      ? firstSentence.slice(0, 200)
      : excerpt.slice(0, 200);
  }

  // Author: use provided values or fall back to the default agent identity
  var author;
  if (raw.author && raw.author.name) {
    author = {
      name:     raw.author.name,
      role:     raw.author.role     ?? "",
      initials: raw.author.initials ?? raw.author.name.slice(0, 2).toUpperCase(),
    };
  } else {
    author = { name: "Prismix Studios", role: "AI Blog Agent", initials: "PS" };
  }

  return {
    id:          id,
    title:       title,
    excerpt:     excerpt,
    body:        bodyLines,
    publishedAt: publishedAt,
    image:       raw.image       ?? null,
    source:      "website-agent",
    sourceId:    null,
    linkedinUrl: raw.linkedinUrl ?? null,
    author:      author,
    readMinutes: readMinutes,
    category:    raw.category    ?? "Prismix Journal",
    pullQuote:   pullQuote,
    tags:        Array.isArray(raw.tags) ? raw.tags : [],
    // published: false hides the post from the frontend without deleting it
    published:   raw.published !== false,   // defaults to true unless explicitly false
    // dryRun: true also hides the post from the frontend (useful for agent testing)
    dryRun:      raw.dryRun === true,       // defaults to false unless explicitly true
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

/**
 * Netlify Function entry point.
 * Routes GET and POST to their respective handlers.
 * All other methods return 405 Method Not Allowed.
 */
export default async function handler(req) {
  try {
    if (req.method === "GET") {
      return await handleGet();
    }

    if (req.method === "POST") {
      return await handlePost(req);
    }

    return new Response("Method Not Allowed", { status: 405 });

  } catch (err) {
    console.error("[blogs] Unhandled error:", err.message);
    return new Response("Internal Server Error", { status: 500 });
  }
}
