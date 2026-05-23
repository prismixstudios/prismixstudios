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
 *     "pullQuote":   "optional"
 *   }
 *
 * See README.md for a full curl example.
 */

import { readPosts, writePosts, mergePosts } from "./lib/postStore.js";

// ─── GET handler ──────────────────────────────────────────────────────────────

/**
 * Returns all blog posts sorted newest-first.
 * Always returns HTTP 200 — an empty array if no posts exist yet.
 * CDN-cached for 5 minutes, stale-while-revalidate for 10 more.
 */
async function handleGet() {
  var posts = await readPosts();

  return new Response(JSON.stringify(posts), {
    status: 200,
    headers: {
      "Content-Type":                "application/json",
      "Cache-Control":               "public, s-maxage=300, stale-while-revalidate=600",
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
  // ── Step 1: Check the bearer token ──────────────────────────────
  var token = process.env.BLOG_INGEST_TOKEN;

  if (!token) {
    // The Netlify env var has not been configured — server-side mistake
    console.error("[blogs] BLOG_INGEST_TOKEN environment variable is not set.");
    return new Response("Server misconfiguration", { status: 500 });
  }

  var authHeader = req.headers.get("authorization") ?? "";

  if (authHeader !== "Bearer " + token) {
    return new Response("Unauthorized", { status: 401 });
  }

  // ── Step 2: Parse body ───────────────────────────────────────────
  var body;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return new Response("Request body must be a JSON object", { status: 400 });
  }

  // ── Step 3: Validate required fields ────────────────────────────
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return new Response('Missing required field: "title" (non-empty string)', { status: 400 });
  }

  if (!Array.isArray(body.body) || body.body.length === 0) {
    return new Response('Missing required field: "body" (non-empty array of strings)', { status: 400 });
  }

  // ── Step 4: Normalize into the standard post shape ───────────────
  var post = normalizeAgentPost(body);

  // ── Step 5: Merge into Blobs and save ────────────────────────────
  var existing = await readPosts();
  var merged   = mergePosts(existing, post);
  await writePosts(merged);

  console.log('[blogs] Ingested post "' + post.title + '" (id: ' + post.id + '). Total posts: ' + merged.length);

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

  var publishedAt = raw.publishedAt
    ? new Date(raw.publishedAt).toISOString()
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
