import { blogs } from "../data/blogs.js";

const MOCK_POSTS = [...blogs].sort(
  (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
);

/**
 * Returns blog posts sorted newest-first.
 * In production, fetches /api/blogs (served by the Netlify function).
 * Falls back to local mock data if the API is unavailable or empty.
 */
export async function getBlogPosts() {
  if (import.meta.env.PROD) {
    try {
      const res = await fetch("/api/blogs");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        }
      }
    } catch (err) {
      console.warn("[blogService] /api/blogs unavailable, using mock data:", err.message);
    }
  }
  return MOCK_POSTS;
}
