/**
 * githubPostStore.js — GitHub Contents API storage helper
 *
 * ACTIVE during the GitHub-backed posts.json trial (started 2026-05-25).
 * This module replaces Netlify Blobs as the write path for blog posts.
 *
 * How it works:
 *   - Reads  data/posts.json from the repo via GET  /repos/{owner}/{repo}/contents/{path}
 *   - Writes data/posts.json back via              PUT  /repos/{owner}/{repo}/contents/{path}
 *   - Every write commits with "[skip netlify]" so Netlify does not rebuild the site.
 *   - The frontend reads the file directly from raw.githubusercontent.com (no Function call).
 *
 * Required Netlify env vars:
 *   GITHUB_TOKEN        — personal access token with `contents: write` permission on the repo
 *   GITHUB_OWNER        — GitHub user or org that owns the repository
 *   GITHUB_REPO         — repository name
 *
 * Optional env vars (safe defaults provided):
 *   GITHUB_BRANCH       — branch to read/write (default: "main")
 *   GITHUB_POSTS_PATH   — path inside the repo (default: "data/posts.json")
 */

var GITHUB_API = "https://api.github.com";

// ─── Internal config loader ───────────────────────────────────────────────────

/**
 * Reads and validates required GitHub config from environment variables.
 * Throws a clear error if any required variable is missing so the calling
 * function can return a 500 rather than making a useless API call.
 */
function getConfig() {
  var token  = process.env.GITHUB_TOKEN;
  var owner  = process.env.GITHUB_OWNER;
  var repo   = process.env.GITHUB_REPO;
  var branch = process.env.GITHUB_BRANCH      ?? "main";
  var path   = process.env.GITHUB_POSTS_PATH  ?? "data/posts.json";

  if (!token || !owner || !repo) {
    throw new Error(
      "Missing required GitHub env vars: GITHUB_TOKEN, GITHUB_OWNER, and/or GITHUB_REPO"
    );
  }

  return { token, owner, repo, branch, path };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches the current posts array from GitHub and returns it together with
 * the file's SHA.  The SHA is required by GitHub's Contents API when you
 * want to update (overwrite) an existing file.
 *
 * Returns { posts: [], sha: null } when the file does not exist yet so the
 * first writePostsToGitHub() call can create it without needing a SHA.
 *
 * Throws on any unexpected GitHub API error (non-200, non-404).
 */
export async function readPostsFromGitHub() {
  var { token, owner, repo, branch, path } = getConfig();

  var url = GITHUB_API + "/repos/" + owner + "/" + repo
          + "/contents/" + path + "?ref=" + branch;

  var res = await fetch(url, {
    headers: {
      "Authorization":        "Bearer " + token,
      "Accept":               "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  // File not found — return empty state so the caller can create it
  if (res.status === 404) {
    return { posts: [], sha: null };
  }

  if (!res.ok) {
    var errBody = await res.text();
    throw new Error("GitHub read failed (" + res.status + "): " + errBody);
  }

  var data = await res.json();

  // GitHub returns file content as base64 — decode and parse it
  var rawJson = Buffer.from(data.content, "base64").toString("utf8");
  var posts;
  try {
    posts = JSON.parse(rawJson);
  } catch {
    // File exists but is not valid JSON — treat as empty
    posts = [];
  }

  return {
    posts: Array.isArray(posts) ? posts : [],
    sha:   data.sha,
  };
}

/**
 * Writes the given posts array to GitHub, overwriting the previous file.
 *
 * sha    — the SHA returned by the most recent readPostsFromGitHub() call.
 *          Pass null when creating the file for the first time.
 *
 * The commit message always includes [skip netlify] so a blog content update
 * does not trigger a Netlify site rebuild.
 *
 * Throws if the GitHub API returns a non-2xx status (e.g. 409 Conflict when
 * two writes race with the same SHA — the caller should surface this as a 500).
 */
export async function writePostsToGitHub(posts, sha) {
  var { token, owner, repo, branch, path } = getConfig();

  // GitHub Contents API requires file content as base64-encoded UTF-8
  var json    = JSON.stringify(posts, null, 2);
  var content = Buffer.from(json, "utf8").toString("base64");

  var putBody = {
    message: "chore: update blog posts [skip netlify]",
    content: content,
    branch:  branch,
  };

  // sha is mandatory when updating; omit it only when creating for the first time
  if (sha) {
    putBody.sha = sha;
  }

  var url = GITHUB_API + "/repos/" + owner + "/" + repo + "/contents/" + path;

  var res = await fetch(url, {
    method:  "PUT",
    headers: {
      "Authorization":        "Bearer " + token,
      "Accept":               "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type":         "application/json",
    },
    body: JSON.stringify(putBody),
  });

  if (!res.ok) {
    var errBody = await res.text();
    throw new Error("GitHub write failed (" + res.status + "): " + errBody);
  }

  return await res.json();
}
