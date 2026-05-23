/**
 * sync-linkedin-blogs.js — Scheduled Netlify Function
 *
 * Runs every hour. Fetches the latest posts from the Prismix LinkedIn page,
 * normalizes them, and MERGES them into the existing posts already in Blobs.
 *
 * Key behaviour:
 *   - Posts created by the AI agent (source: "website-agent") are NEVER deleted
 *     or overwritten — the merge step in postStore.js handles this.
 *   - If the same post exists as both a LinkedIn import and an agent post
 *     (matched by linkedinUrl), they are collapsed into one record and the
 *     agent's richer content is preferred.
 *   - If the LinkedIn API call fails, posts.json is left untouched and the
 *     error is written to sync-state.json so it can be inspected later.
 *
 * Required environment variables (set in the Netlify dashboard):
 *   LINKEDIN_ORG_URN        — e.g. urn:li:organization:12345678
 *   LINKEDIN_ACCESS_TOKEN   — OAuth 2.0 token; expires periodically, must be rotated
 *
 * Optional:
 *   LINKEDIN_API_VERSION    — defaults to "202401"
 *
 * NOTE: LinkedIn access tokens typically expire after 60 days.
 * You must rotate LINKEDIN_ACCESS_TOKEN in the Netlify dashboard before it expires,
 * or the sync will stop working and log an error in sync-state.json.
 */

import { getStore } from "@netlify/blobs";
import { readPosts, writePosts, mergeAllPosts } from "./lib/postStore.js";

// ─── Configuration ────────────────────────────────────────────────────────────

var LINKEDIN_API_BASE = "https://api.linkedin.com/rest";
var LINKEDIN_VERSION  = process.env.LINKEDIN_API_VERSION ?? "202401";
var PAGE_SIZE         = 50; // LinkedIn's hard cap for this endpoint

// ─── LinkedIn API fetch ───────────────────────────────────────────────────────

/**
 * Calls the LinkedIn Posts API for the organization and returns the raw
 * array of post objects.
 *
 * Throws on missing env vars or a non-200 response from LinkedIn.
 * The caller catches this and leaves posts.json untouched.
 */
async function fetchLinkedInPosts() {
  var orgUrn      = process.env.LINKEDIN_ORG_URN;
  var accessToken = process.env.LINKEDIN_ACCESS_TOKEN;

  if (!orgUrn || !accessToken) {
    throw new Error("Missing env vars: LINKEDIN_ORG_URN and/or LINKEDIN_ACCESS_TOKEN");
  }

  var url = new URL(LINKEDIN_API_BASE + "/posts");
  url.searchParams.set("author", orgUrn);
  url.searchParams.set("q",      "author");
  url.searchParams.set("count",  String(PAGE_SIZE));
  url.searchParams.set("sortBy", "CREATED");

  var res = await fetch(url.toString(), {
    headers: {
      "Authorization":             "Bearer " + accessToken,
      "LinkedIn-Version":          LINKEDIN_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });

  if (!res.ok) {
    var errorBody = await res.text();
    throw new Error("LinkedIn API returned " + res.status + ": " + errorBody);
  }

  var json = await res.json();
  return json.elements ?? [];
}

// ─── Normalization ────────────────────────────────────────────────────────────

/**
 * Extracts the best available image URL from a LinkedIn post's content block.
 * Returns null if no image can be found.
 */
function extractImage(content) {
  if (!content) return null;

  // Prefer an embedded media thumbnail
  var media = content.media;
  if (media) {
    if (Array.isArray(media.thumbnails) && media.thumbnails[0] && media.thumbnails[0].url) {
      return media.thumbnails[0].url;
    }
    if (media.originalUrl) return media.originalUrl;
  }

  // Fall back to an article thumbnail
  var article = content.article;
  if (article) {
    if (article.thumbnail)    return article.thumbnail;
    if (article.thumbnailUrl) return article.thumbnailUrl;
  }

  return null;
}

/**
 * Converts a raw LinkedIn API post object into the standard blog post shape
 * that Blogs.jsx and postStore.js expect.
 *
 * Every field has a safe default so the frontend never crashes on a
 * missing or malformed value.
 *
 * @param {object} raw  - a single element from LinkedIn's posts API
 * @returns {object}    - normalized post ready for storage / merging
 */
function normalizeLinkedInPost(raw) {
  // The LinkedIn post id is used as both the stable id and sourceId so
  // the dedup logic in postStore.js can match it reliably in future syncs.
  var linkedInId = raw.id ?? String(raw.created && raw.created.time ? raw.created.time : Date.now());
  var text       = raw.commentary ?? "";

  // Title: the first non-empty line, capped at 140 characters
  var lines = text.split("\n").filter(Boolean);
  var title = (lines[0] ?? "Prismix Update").slice(0, 140);

  // Excerpt: up to 280 characters of the full post text
  var excerpt;
  if (text.length > 280) {
    excerpt = text.slice(0, 277).trimEnd() + "…";
  } else {
    excerpt = text || "Read this post on LinkedIn.";
  }

  // Body: all lines after the title; fall back to the excerpt as one paragraph
  var bodyLines = lines.slice(1).filter(function (l) { return l.trim().length > 0; });
  var body      = bodyLines.length > 0 ? bodyLines : [excerpt];

  // readMinutes: word-count estimate at 200 wpm, minimum 1 minute
  var wordCount   = text.split(/\s+/).filter(Boolean).length;
  var readMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Tags: hashtags found in the post text, stripped of the # prefix
  var tags = Array.from(text.matchAll(/#(\w+)/g)).map(function (m) { return m[1]; });

  // pullQuote: first full sentence, or the excerpt if the sentence is too short
  var firstSentence = (text.split(/[.!?]/)[0] ?? "").trim();
  var pullQuote = firstSentence.length > 20
    ? firstSentence.slice(0, 200)
    : excerpt.slice(0, 200);

  var publishedAt = raw.publishedAt
    ? new Date(raw.publishedAt).toISOString()
    : new Date(raw.created && raw.created.time ? raw.created.time : Date.now()).toISOString();

  return {
    id:          linkedInId,
    title:       title,
    excerpt:     excerpt,
    body:        body,
    publishedAt: publishedAt,
    image:       extractImage(raw.content ?? null),
    source:      "linkedin",
    sourceId:    linkedInId,
    linkedinUrl: "https://www.linkedin.com/feed/update/" + linkedInId + "/",
    author: {
      name:     "Prismix Studios",
      role:     "LinkedIn",
      initials: "PS",
    },
    readMinutes: readMinutes,
    category:    "LinkedIn",
    pullQuote:   pullQuote,
    tags:        tags,
  };
}

// ─── Scheduled handler ────────────────────────────────────────────────────────

/**
 * Netlify scheduled function entry point — runs every hour.
 *
 * On success:
 *   - Fetches LinkedIn posts and normalizes them.
 *   - Reads existing posts.json from Blobs.
 *   - Merges LinkedIn posts into existing posts (agent posts are preserved).
 *   - Writes the merged result back to posts.json.
 *   - Writes a success record to sync-state.json.
 *
 * On failure (LinkedIn API error, network issue, etc.):
 *   - posts.json is NOT modified — the frontend keeps serving the last good data.
 *   - sync-state.json is updated with the error message so it can be diagnosed.
 */
export default async function handler() {
  // We use getStore directly here only for sync-state.json.
  // All posts.json access goes through postStore helpers.
  var store = getStore("blogs");

  try {
    console.log("[sync] Starting LinkedIn post fetch…");

    // 1. Fetch from LinkedIn
    var rawPosts      = await fetchLinkedInPosts();
    var linkedInPosts = rawPosts.map(normalizeLinkedInPost);

    console.log("[sync] Fetched " + linkedInPosts.length + " posts from LinkedIn.");

    // 2. Read what the website already has stored
    var existingPosts = await readPosts();

    // 3. Merge — LinkedIn posts are added/updated; agent posts are preserved
    var mergedPosts = mergeAllPosts(existingPosts, linkedInPosts);

    // 4. Save the merged result (mergeAllPosts already sorts newest-first)
    await writePosts(mergedPosts);

    // 5. Record a successful sync
    await store.setJSON("sync-state.json", {
      lastSync:   new Date().toISOString(),
      postCount:  mergedPosts.length,
      newFromLI:  linkedInPosts.length,
      status:     "ok",
    });

    console.log("[sync] Saved " + mergedPosts.length + " posts to Blobs (" + linkedInPosts.length + " from LinkedIn).");

  } catch (err) {
    console.error("[sync] Failed:", err.message);

    // Write the error to sync-state.json but leave posts.json untouched
    try {
      await store.setJSON("sync-state.json", {
        lastSync: new Date().toISOString(),
        status:   "error",
        error:    err.message,
      });
    } catch (writeErr) {
      console.error("[sync] Could not write sync-state.json either:", writeErr.message);
    }
  }
}

// Tell Netlify to run this function on a schedule
export var config = {
  schedule: "@hourly",
};
