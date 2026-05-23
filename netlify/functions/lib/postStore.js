/**
 * postStore.js — Shared blog storage helpers
 *
 * All blog posts live in Netlify Blobs under:
 *   store : "blogs"
 *   key   : "posts.json"
 *
 * This module is imported by:
 *   - blogs.js              (GET + POST handler)
 *   - sync-linkedin-blogs.js (scheduled LinkedIn import)
 *
 * Keeping the read / merge / write logic in one place means both
 * code paths follow identical deduplification rules, so a post
 * created by the agent and later imported from LinkedIn will always
 * collapse into the same record.
 */

import { getStore } from "@netlify/blobs";

// Netlify Blobs store name and key used by every function in this project
const STORE_NAME = "blogs";
const POSTS_KEY  = "posts.json";

// ─── Storage helpers ──────────────────────────────────────────────────────────

/**
 * Reads all posts from Blobs and returns them as an array.
 * Returns [] if nothing has been saved yet.
 *
 * Uses consistency: "strong" so every read reflects the latest write,
 * even on multi-region Netlify deploys.
 */
export async function readPosts() {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  const posts  = await store.get(POSTS_KEY, { type: "json" });
  return Array.isArray(posts) ? posts : [];
}

/**
 * Writes the given array of posts to Blobs, replacing the previous value.
 * The caller is responsible for sorting before calling this function.
 */
export async function writePosts(posts) {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  await store.setJSON(POSTS_KEY, posts);
}

// ─── Merge & deduplicate ──────────────────────────────────────────────────────

/**
 * Merges ONE incoming post into an existing array, then returns the
 * array sorted newest-first.
 *
 * Dedupe rules (checked in order):
 *   1. id matches an existing post
 *   2. linkedinUrl matches (both non-null)
 *   3. source === "linkedin" and sourceId matches (both non-null)
 *
 * On match  → merge the two records, preferring the richer values.
 * No match  → append as a new post.
 */
export function mergePosts(existingPosts, incomingPost) {
  const posts      = [...existingPosts];
  const matchIndex = findMatchIndex(posts, incomingPost);

  if (matchIndex !== -1) {
    posts[matchIndex] = mergePost(posts[matchIndex], incomingPost);
  } else {
    posts.push(incomingPost);
  }

  return posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

/**
 * Merges an array of incoming posts (e.g. a LinkedIn sync batch) into an
 * existing array, applying mergePosts for each one in turn.
 */
export function mergeAllPosts(existingPosts, incomingPosts) {
  let result = [...existingPosts];
  for (const post of incomingPosts) {
    result = mergePosts(result, post);
  }
  return result;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Returns the array index of the first post that matches `incoming`,
 * or -1 if there is no match.
 */
function findMatchIndex(posts, incoming) {
  return posts.findIndex(function (existing) {
    // Rule 1: same id
    if (existing.id === incoming.id) {
      return true;
    }

    // Rule 2: same LinkedIn URL (both must be non-null)
    if (
      incoming.linkedinUrl &&
      existing.linkedinUrl &&
      existing.linkedinUrl === incoming.linkedinUrl
    ) {
      return true;
    }

    // Rule 3: LinkedIn sourceId match (both posts must be from LinkedIn)
    if (
      incoming.source === "linkedin" &&
      existing.source === "linkedin" &&
      incoming.sourceId &&
      existing.sourceId &&
      existing.sourceId === incoming.sourceId
    ) {
      return true;
    }

    return false;
  });
}

/**
 * Merges `incoming` into `existing`, returning a single combined record.
 *
 * The general rule is: a website-agent post has richer/canonical data,
 * so if `incoming` is from the agent and `existing` was from LinkedIn,
 * the agent's values win for most fields.
 *
 * We never replace a non-empty field with an empty/null value —
 * whichever side has data keeps it.
 */
function mergePost(existing, incoming) {
  // "agent wins" is true when the new post arrives from the AI agent,
  // overriding a previously-imported LinkedIn version of the same content.
  var agentWins = incoming.source === "website-agent";

  return {
    // The stable id belongs to whichever record was stored first
    id:          existing.id,

    // Upgrade source to "website-agent" when the agent publishes
    source:      agentWins ? "website-agent" : existing.source,

    // Keep both LinkedIn identifiers for future deduplication
    sourceId:    incoming.sourceId    ?? existing.sourceId    ?? null,
    linkedinUrl: incoming.linkedinUrl ?? existing.linkedinUrl ?? null,

    // Text fields: prefer the agent's richer version; never erase with empty
    title:       pickRicher(incoming.title,     existing.title,     agentWins),
    excerpt:     pickRicher(incoming.excerpt,   existing.excerpt,   agentWins),
    body:        pickRicherArray(incoming.body, existing.body,      agentWins),
    image:       pickRicher(incoming.image,     existing.image,     agentWins),
    tags:        pickRicherArray(incoming.tags, existing.tags,      agentWins),
    author:      pickRicherAuthor(incoming.author, existing.author, agentWins),

    // Timestamps and metadata — the incoming version is always the authority
    publishedAt: incoming.publishedAt ?? existing.publishedAt,
    readMinutes: incoming.readMinutes ?? existing.readMinutes ?? 1,
    category:    pickRicher(incoming.category,  existing.category,  agentWins),
    pullQuote:   pickRicher(incoming.pullQuote, existing.pullQuote, agentWins),
  };
}

/**
 * Returns the richer of two scalar values.
 * Empty / null / undefined values are never preferred over real content.
 *
 * @param {*}       incoming
 * @param {*}       existing
 * @param {boolean} incomingWins  - when both have content, which one wins?
 */
function pickRicher(incoming, existing, incomingWins) {
  if (!incoming) return existing;  // incoming is empty — keep what we have
  if (!existing) return incoming;  // nothing stored yet — use incoming
  return incomingWins ? incoming : existing;
}

/**
 * Returns the richer of two arrays.
 * A longer array is considered richer (more content).
 */
function pickRicherArray(incoming, existing, incomingWins) {
  var hasIncoming = Array.isArray(incoming) && incoming.length > 0;
  var hasExisting = Array.isArray(existing) && existing.length > 0;
  if (!hasIncoming) return hasExisting ? existing : [];
  if (!hasExisting) return incoming;
  return incomingWins ? incoming : existing;
}

/**
 * Returns the richer of two author objects.
 * An author with a name is considered richer than an empty/missing one.
 */
function pickRicherAuthor(incoming, existing, incomingWins) {
  var incomingHasData = incoming && incoming.name;
  if (!incomingHasData) {
    return existing ?? { name: "Prismix Studios", role: "", initials: "PS" };
  }
  if (!existing) return incoming;
  return incomingWins ? incoming : existing;
}
