import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { getBlogPosts } from "../services/blogService";

/* ── Helpers ──────────────────────────────────────────── */
function formatDate(iso) {
  const d = new Date(iso);
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${m[d.getMonth()]} ${String(d.getDate()).padStart(2,"0")}, ${d.getFullYear()}`;
}
function isoStamp(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
}

/* ── Rich body helpers ──────────────────────────────────── */
function renderInlineLinks(text) {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const result = [];
  let last = 0, match;
  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > last) result.push(text.slice(last, match.index));
    result.push(
      <a key={match.index} href={match[0]} target="_blank" rel="noopener noreferrer">
        {match[0]}
      </a>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) result.push(text.slice(last));
  return result.length ? result : [text];
}

function renderRichParagraph(text, key, isHashtag) {
  if (isHashtag) {
    return (
      <p key={key} style={{
        background: "linear-gradient(to right, #60a5fa, #a855f7, #ec4899)",
        WebkitBackgroundClip: "text", backgroundClip: "text",
        color: "transparent", WebkitTextFillColor: "transparent",
        fontWeight: 600, margin: 0,
      }}>
        {text}
      </p>
    );
  }
  if (text.includes("•")) {
    const parts = text.split(/\s*•\s*/);
    const pre = parts[0].trim();
    const bullets = parts.slice(1).filter(Boolean);
    return (
      <div key={key}>
        {pre && <p style={{ margin: "0 0 8px" }}>{renderInlineLinks(pre)}</p>}
        <ul>
          {bullets.map((b, i) => <li key={i}>{renderInlineLinks(b.trim())}</li>)}
        </ul>
      </div>
    );
  }
  return <p key={key}>{renderInlineLinks(text)}</p>;
}

/* ── TextCover – typographic panel for image-less posts ── */
function TextCover({ post, index, size }) {
  return (
    <div className={`bp-text-cover bp-tc-${size}`}>
      <div className="tc-top">
        <span className="tc-cat">{post.category}</span>
        <span className="tc-num">— {String((index ?? 0) + 1).padStart(2, "0")}</span>
      </div>
      <p className="tc-quote">
        <span className="open">"</span>
        {post.pullQuote || post.excerpt}
        <span className="close">"</span>
      </p>
      <div className="tc-foot">
        <span>{post.readMinutes} min read</span>
        <span>{isoStamp(post.publishedAt)}</span>
      </div>
    </div>
  );
}

/* ── Cover media (featured posts) ──────────────────────── */
function FeatCover({ post, index }) {
  if (post.image) {
    return (
      <>
        <img
          src={post.image}
          alt={post.title}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.55) 100%)", borderRadius: 4 }} />
        <div className="bp-pill" style={{ position: "absolute", left: 18, top: 18, zIndex: 2 }}>
          <span className="bp-pill-dot" />
          <span>{post.category}</span>
        </div>
      </>
    );
  }
  return <TextCover post={post} index={index} size="feat" />;
}

/* ── Author block ────────────────────────────────────── */
function Author({ post }) {
  const a = post.author ?? { name: "Prismix Studios", role: "", initials: "PS" };
  return (
    <div className="bp-author">
      <div className="bp-avatar" data-i={a.initials} />
      <div>
        <div className="bp-author-name">{a.name}</div>
        <small className="bp-author-role">{a.role}</small>
      </div>
    </div>
  );
}

/* ── Tags ────────────────────────────────────────────── */
function Tags({ tags, style }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, ...style }}>
      {(tags ?? []).map((t) => <span className="bp-tag" key={t}>{t}</span>)}
    </div>
  );
}

/* ── Featured post ───────────────────────────────────── */
function FeaturedPost({ post, index }) {
  const hasImage = !!post.image;
  const [floatSide] = useState(() => Math.random() < 0.5 ? "left" : "right");

  return (
    <motion.article
      className="bp-card bp-expanded bp-featured-open-card"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      {hasImage ? (
        <div className="bp-expanded-layout">
          <div
            className="bp-card-cover bp-float-cover"
            style={{
              float: floatSide,
              marginRight: floatSide === "left" ? 36 : 0,
              marginLeft: floatSide === "right" ? 36 : 0,
            }}
          >
            <img
              src={post.image}
              alt={post.title}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <div className="bp-pill" style={{ position: "absolute", left: 12, top: 12, zIndex: 2 }}>
              <span className="bp-pill-dot" />
              <span>{post.category}</span>
            </div>
          </div>
          <div className="bp-expanded-body">
            <div className="bp-card-meta">
              <span>{isoStamp(post.publishedAt)}</span>
              <span className="bp-dotsep" />
              <span>{post.readMinutes} min</span>
              <span className="bp-dotsep" />
              <span>Featured {String(index + 1).padStart(2, "0")}</span>
            </div>
            <h4>{post.title}</h4>
            <div className="bp-expanded-full-body" style={{ marginTop: 18 }}>
              {(post.body ?? []).map((p, i, arr) => renderRichParagraph(p, i, i === arr.length - 1))}
            </div>
            <div style={{ marginTop: 24 }}>
              <Tags tags={(post.tags ?? []).slice(0, 3)} style={{ gap: 6 }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="bp-text-expanded">
          <div className="bp-te-head">
            <span className="bp-te-cat">{post.category}</span>
            <span className="bp-te-num">{String(index + 1).padStart(2, "0")}</span>
            <span className="bp-te-meta bp-mono">
              {isoStamp(post.publishedAt)} &nbsp;·&nbsp; {post.readMinutes} MIN
            </span>
          </div>
          <h4 className="bp-te-title">{post.title}</h4>
          <div className="bp-te-body">
            {(post.body ?? []).map((p, i, arr) => renderRichParagraph(p, i, i === arr.length - 1))}
          </div>
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--bp-line)" }}>
            <Tags tags={post.tags} style={{ gap: 6 }} />
          </div>
        </div>
      )}
    </motion.article>
  );

  /* Text-only: solo centered layout */
  if (!post.image) {
    return (
      <motion.article
        className="bp-feat bp-solo"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="bp-solo-inner">
          <div className="bp-feat-num" style={{ textAlign: "center", marginBottom: 18 }}>
             {String(index + 1)} / 3 
          </div>
          <h3>{post.title}</h3>
          <div className="bp-feat-meta" style={{ justifyContent: "center" }}>
            <span>{formatDate(post.publishedAt)}</span>
            <span className="bp-dotsep" />
            <span>{post.readMinutes} min read</span>
            <span className="bp-dotsep" />
            <span>Prismix Journal</span>
          </div>
          <div className="bp-solo-body">
            {(post.body ?? []).map((p, i, arr) => renderRichParagraph(p, i, i === arr.length - 1))}
          </div>
          <Tags tags={post.tags} style={{ justifyContent: "center", marginTop: 28 }} />
        </div>
      </motion.article>
    );
  }

  /* Image post: asymmetric layout */
  return (
    <motion.article
      className={`bp-feat${reverse ? " bp-reverse" : ""}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="bp-feat-media">
        <FeatCover post={post} index={index} />
      </div>
      <div className="bp-feat-body">
        <div className="bp-feat-num">— {String(index + 1)} / 3</div>
        <h3>{post.title}</h3>
        <div className="bp-feat-meta">
          <span>{formatDate(post.publishedAt)}</span>
          <span className="bp-dotsep" />
          <span>{post.readMinutes} min read</span>
          <span className="bp-dotsep" />
          <span>Prismix Journal</span>
        </div>
        <div className="bp-body">
          {(post.body ?? []).map((p, i, arr) => renderRichParagraph(p, i, i === arr.length - 1))}
        </div>
        <Tags tags={post.tags} />
      </div>
    </motion.article>
  );
}

/* ── Archive card ─────────────────────────────────────── */
function ArchiveCard({ post, index, expanded, onToggle }) {
  const hasImage = !!post.image;
  const [floatSide] = useState(() => Math.random() < 0.5 ? "left" : "right");
  const cardRef = useRef(null);

  const prevExpanded = useRef(null);
  useEffect(() => {
    const prev = prevExpanded.current;
    prevExpanded.current = expanded;
    if (prev === null || !cardRef.current) return; // skip initial mount
    if (!prev && expanded) {
      const t = setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      return () => clearTimeout(t);
    }
    if (prev && !expanded) {
      const t = setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 480);
      return () => clearTimeout(t);
    }
  }, [expanded]);

  return (
    <motion.article
      ref={cardRef}
      className={`bp-card${expanded ? " bp-expanded" : ""}`}
      layout
      transition={{ layout: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }, y: { duration: 0.4, ease: [0.2, 0.7, 0.2, 1] } }}
      onClick={!expanded ? onToggle : undefined}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={!expanded ? { y: -4 } : undefined}
      style={{ cursor: expanded ? "default" : "pointer" }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {expanded ? (
          <motion.div
            key="expanded"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ position: "relative" }}
          >
            <button className="bp-close-btn" aria-label="Collapse" onClick={onToggle}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1 L13 13 M13 1 L1 13" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>

            {hasImage ? (
              <div className="bp-expanded-layout">
                <div
                  className="bp-card-cover bp-float-cover"
                  style={{
                    float: floatSide,
                    marginRight: floatSide === "left" ? 36 : 0,
                    marginLeft: floatSide === "right" ? 36 : 0,
                  }}
                >
                  <img
                    src={post.image}
                    alt={post.title}
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                  <div className="bp-pill" style={{ position: "absolute", left: 12, top: 12, zIndex: 2 }}>
                    <span className="bp-pill-dot" />
                    <span>{post.category}</span>
                  </div>
                </div>
                <div className="bp-expanded-body">
                  <div className="bp-card-meta">
                    <span>{isoStamp(post.publishedAt)}</span>
                    <span className="bp-dotsep" />
                    <span>{post.readMinutes} min</span>
                    <span className="bp-dotsep" />
                    <span>Prismix Journal</span>
                  </div>
                  <h4>{post.title}</h4>
                  <div className="bp-expanded-full-body" style={{ marginTop: 18 }}>
                    {(post.body ?? []).map((p, i, arr) => renderRichParagraph(p, i, i === arr.length - 1))}
                  </div>
                  <div style={{ marginTop: 24 }}>
                    <Tags tags={(post.tags ?? []).slice(0, 3)} style={{ gap: 6 }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bp-text-expanded">
                <div className="bp-te-head">
                  <span className="bp-te-cat">{post.category}</span>
                  <span className="bp-te-num">— {String(index + 1).padStart(2, "0")}</span>
                  <span className="bp-te-meta bp-mono">
                    {isoStamp(post.publishedAt)} &nbsp;·&nbsp; {post.readMinutes} MIN
                  </span>
                </div>
                <h4 className="bp-te-title">{post.title}</h4>
                <div className="bp-te-body">
                  {(post.body ?? []).map((p, i, arr) => renderRichParagraph(p, i, i === arr.length - 1))}
                </div>
                <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--bp-line)" }}>
                  <Tags tags={post.tags} style={{ gap: 6 }} />
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <div className="bp-card-cover">
              {hasImage ? (
                <>
                  <img
                    src={post.image}
                    alt={post.title}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div className="bp-pill" style={{ position: "absolute", left: 12, top: 12, zIndex: 2 }}>
                    <span className="bp-pill-dot" /><span>{post.category}</span>
                  </div>
                </>
              ) : (
                <TextCover post={post} index={index} size="card" />
              )}
            </div>
            <div style={{ padding: "22px 22px 24px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
              <div className="bp-card-meta">
                {/* <span>{isoStamp(post.publishedAt)}</span> */}
                {/* <span className="bp-dotsep" /> */}
                {/* <span>{post.readMinutes} min</span> */}
              </div>
              <h4>{post.title}</h4>
              <div className="bp-card-foot">
                <span className="bp-read-arrow">
                  Read piece
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
                    <path d="M1 5 H12 M8 1 L12 5 L8 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
                  </svg>
                </span>
                <span className="bp-mono" style={{ fontSize: 14, letterSpacing: "0.22em", color: "var(--bp-ink-3)" }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/* ── Page ─────────────────────────────────────────────── */
const Blogs = () => {
  const [posts, setPosts] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    getBlogPosts().then(setPosts);
  }, []);

  const featured = posts.slice(0, 3);
  const archive = posts.slice(3);
  const totalMinutes = posts.reduce((s, p) => s + (p.readMinutes ?? 0), 0);

  return (
    <div className="blogs-page">
      {/* Noise overlay */}
      <div
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, opacity: 0.05, mixBlendMode: "overlay",
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        }}
      />

      {/* Background glow */}
      <div style={{
        position: "fixed", inset: "-40px -10% 0 -10%", pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(closest-side,rgba(140,100,255,0.14),transparent 70%) 70% 30%/60% 60% no-repeat,
                     radial-gradient(closest-side,rgba(80,130,255,0.10),transparent 70%) 20% 70%/55% 55% no-repeat`,
        filter: "blur(40px)",
      }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* ── Hero ── */}
        <section className="bp-hero-section" style={{ padding: "120px 0 28px", position: "relative", minHeight: "100vh" }}>
          <div className="bp-hero-image" aria-hidden="true">
            <img src="/blogs-bg-1-compressed.png" alt="background image for blogs page" />
          </div>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 40px", minHeight: "calc(100vh - 280px)", display: "flex", flexDirection: "column" }}>
            <span className="bp-pill">
              <span className="bp-pill-dot" />
              <span>Prismix Journal · Latest</span>
            </span>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              style={{
                fontWeight: 400, fontSize: "clamp(56px,9vw,132px)", lineHeight: 0.95,
                letterSpacing: "0.04em", margin: "18px 0 0", fontFamily: "'Bebas Neue', sans-serif",
              }}
            >
              Notes from the<br />
              <em
                className="bp-grad-text"
                style={{ fontStyle: "normal", fontWeight: 400 }}
              >
              cutting room.
              </em>
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
              style={{ display: "flex", justifyContent: "space-between", gap: 60, marginTop: 48, alignItems: "flex-end", flexWrap: "wrap" }}
              className="bp-hero-bottom-copy"
            >
              <p style={{ maxWidth: 560, color: "var(--bp-ink-1)", fontSize: 22, lineHeight: 1.6, fontWeight: 300, margin: 0 }}>
                Essays, post-mortems, and production diaries from the team behind Prismix —
                on cinematic AI, storytelling, and the craft of making moving image with generative tools.
              </p>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, color: "var(--bp-ink-2)", fontSize: 16, letterSpacing: "0.22em", textTransform: "uppercase", fontFamily: "'JetBrains Mono',monospace" }}>
                <div><strong style={{ color: "var(--bp-ink-0)", fontWeight: 500 }}>{String(posts.length).padStart(2, "0")}</strong> &nbsp; published</div>
                <div>read time &nbsp; <strong style={{ color: "var(--bp-ink-0)", fontWeight: 500 }}>~{totalMinutes} min</strong></div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Featured ── */}
        {featured.length > 0 && (
          <section style={{ maxWidth: 1320, margin: "0 auto", padding: "0 40px" }}>
            <div className="bp-section-head">
              <div>
                <h2>Editor&rsquo;s selection.</h2>
              </div>
              <div className="bp-sh-right">three pieces</div>
            </div>
            <div>
              {featured.map((post, i) => (
                <FeaturedPost key={post.id} post={post} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* ── Archive ── */}
        {archive.length > 0 && (
          <section style={{ padding: "96px 0 140px", borderTop: "1px solid var(--bp-line)" }}>
            <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 40px" }}>
              <div className="bp-section-head" style={{ borderTop: "none", paddingTop: 0 }}>
                <div>
                  <div className="bp-eyebrow">02 — Archive</div>
                  <h2>More from the journal.</h2>
                </div>
                <div className="bp-sh-right">click any card to expand</div>
              </div>

              <LayoutGroup>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0,1fr))",
                  gap: 22,
                  marginTop: 40,
                }}
                  className="bp-archive-grid"
                >
                  {archive.map((post, i) => (
                    <ArchiveCard
                      key={post.id}
                      post={post}
                      index={i}
                      expanded={expandedId === post.id}
                      onToggle={() => setExpandedId(expandedId === post.id ? null : post.id)}
                    />
                  ))}
                </div>
              </LayoutGroup>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Blogs;
