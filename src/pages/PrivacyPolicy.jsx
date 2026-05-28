const s = {
  page: {
    background: "#050507",
    color: "#f6f6f8",
    fontFamily: "Arial, sans-serif",
    minHeight: "100vh",
    WebkitFontSmoothing: "antialiased",
  },
  main: {
    maxWidth: "780px",
    margin: "0 auto",
    padding: "72px 40px 100px",
  },
  hero: {
    marginBottom: "64px",
    paddingBottom: "48px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  eyebrow: {
    display: "inline-block",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "13px",
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    color: "#9a9aa6",
    marginBottom: "12px",
  },
  h1: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "clamp(40px, 6vw, 72px)",
    fontWeight: 400,
    lineHeight: 1,
    letterSpacing: "0.06em",
    background: "linear-gradient(120deg, oklch(0.68 0.18 250), oklch(0.66 0.22 305) 55%, oklch(0.72 0.20 355))",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    marginBottom: "20px",
  },
  heroMeta: {
    display: "flex",
    gap: "0",
    fontSize: "0.82rem",
    color: "#9a9aa6",
    flexWrap: "wrap",
    letterSpacing: "0.04em",
  },
  toc: {
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderLeft: "2px solid transparent",
    borderImage: "linear-gradient(120deg, oklch(0.68 0.18 250), oklch(0.66 0.22 305) 55%, oklch(0.72 0.20 355)) 1",
    padding: "28px 32px",
    marginBottom: "56px",
  },
  tocTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "13px",
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    color: "#9a9aa6",
    marginBottom: "14px",
  },
  tocList: {
    paddingLeft: "18px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "4px 32px",
    fontSize: "0.88rem",
    color: "#9a9aa6",
  },
  section: {
    marginBottom: "52px",
  },
  h2: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "clamp(22px, 3vw, 32px)",
    fontWeight: 400,
    letterSpacing: "0.08em",
    color: "#f6f6f8",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "baseline",
    gap: "12px",
  },
  num: {
    fontFamily: "Arial, sans-serif",
    fontSize: "0.68rem",
    letterSpacing: "0.14em",
    color: "#61616d",
    fontWeight: 400,
  },
  p: {
    marginBottom: "14px",
    color: "#d6d6dc",
    fontSize: "15px",
    lineHeight: 1.75,
  },
  ul: {
    paddingLeft: "20px",
    marginBottom: "14px",
    color: "#d6d6dc",
    fontSize: "15px",
    lineHeight: 1.75,
  },
  callout: {
    border: "1px solid rgba(255,255,255,0.14)",
    borderLeft: "2px solid transparent",
    borderImage: "linear-gradient(120deg, oklch(0.68 0.18 250), oklch(0.66 0.22 305) 55%, oklch(0.72 0.20 355)) 1",
    padding: "18px 22px",
    margin: "24px 0",
    fontSize: "0.9rem",
    color: "#9a9aa6",
    background: "rgba(160,120,255,0.04)",
    lineHeight: 1.75,
  },
  contactCard: {
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "28px 32px",
    marginTop: "20px",
  },
};

const Dot = () => (
  <span style={{ margin: "0 8px", color: "#61616d" }}> · </span>
);

export default function PrivacyPolicy() {
  return (
    <div style={s.page}>
      <main style={s.main}>

        <div style={s.hero}>
          <span style={s.eyebrow}>Legal</span>
          <h1 style={s.h1}>Privacy Policy</h1>
          <div style={s.heroMeta}>
            <span>Effective Date: June 1, 2025</span>
            <Dot /><span>Last Updated: May 28, 2026</span>
            <Dot /><span>Prismix Studios</span>
          </div>
        </div>

        <nav style={s.toc}>
          <div style={s.tocTitle}>Contents</div>
          <ol style={s.tocList}>
            {[
              ["#overview",      "Overview"],
              ["#data-collected","Information We Collect"],
              ["#linkedin-data", "LinkedIn Data"],
              ["#how-we-use",    "How We Use Information"],
              ["#sharing",       "Sharing & Disclosure"],
              ["#retention",     "Data Retention"],
              ["#security",      "Security"],
              ["#rights",        "Your Rights"],
              ["#third-party",   "Third-Party Links"],
              ["#contact",       "Contact Us"],
            ].map(([href, label]) => (
              <li key={href} style={{ marginBottom: "4px" }}>
                <a href={href} style={{ color: "#9a9aa6", textDecoration: "none" }}
                   onMouseEnter={e => e.target.style.color = "#f6f6f8"}
                   onMouseLeave={e => e.target.style.color = "#9a9aa6"}>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <section id="overview" style={s.section}>
          <h2 style={s.h2}><span style={s.num}>01</span> Overview</h2>
          <p style={s.p}>Prismix Studios ("Prismix," "we," "us," or "our") operates as a B2B creative and generative AI media company, providing promotional and entertainment content services to businesses. This Privacy Policy explains how we collect, use, store, and protect information when you visit our website (<a href="https://prismixstudios.com" style={{ color: "#6aa0ff" }}>prismixstudios.com</a>), use our services, or interact with us through third-party platforms such as LinkedIn.</p>
          <p style={s.p}>By using our services or accessing our website, you agree to the terms described in this Privacy Policy. If you do not agree, please discontinue use of our services.</p>
          <div style={s.callout}>
            This policy applies to all services provided by Prismix Studios, including our website, social media integrations, client portals, and any APIs or tools we use to deliver creative media services.
          </div>
        </section>

        <section id="data-collected" style={s.section}>
          <h2 style={s.h2}><span style={s.num}>02</span> Information We Collect</h2>
          <p style={s.p}>We collect information in the following ways:</p>
          <p style={s.p}><strong style={{ color: "#f6f6f8", fontWeight: 600 }}>Information You Provide Directly</strong></p>
          <ul style={s.ul}>
            <li>Name, business name, and job title</li>
            <li>Email address and phone number</li>
            <li>Company details and project requirements shared in briefs or communications</li>
            <li>Payment and billing information (processed securely by third-party payment providers)</li>
            <li>Any content, assets, or materials you share with us to fulfill a creative brief</li>
          </ul>
          <p style={s.p}><strong style={{ color: "#f6f6f8", fontWeight: 600 }}>Information Collected Automatically</strong></p>
          <ul style={s.ul}>
            <li>IP address and approximate geographic location</li>
            <li>Browser type, device type, and operating system</li>
            <li>Pages visited, time spent on pages, and referring URLs</li>
            <li>Cookies and similar tracking technologies (see below)</li>
          </ul>
          <p style={s.p}><strong style={{ color: "#f6f6f8", fontWeight: 600 }}>Cookies &amp; Tracking</strong></p>
          <p style={s.p}>We use cookies to improve site performance and understand user behavior. You may disable cookies through your browser settings; some site features may not function without them.</p>
        </section>

        <section id="linkedin-data" style={s.section}>
          <h2 style={s.h2}><span style={s.num}>03</span> LinkedIn Data</h2>
          <p style={s.p}>Prismix Studios uses the LinkedIn API to support certain features, including sharing content, accessing public professional profiles, and facilitating B2B outreach in connection with our services. When you authorize our application through LinkedIn, we may collect:</p>
          <ul style={s.ul}>
            <li>Your LinkedIn profile information (name, headline, profile photo, and public profile URL)</li>
            <li>Your LinkedIn member ID</li>
            <li>Email address associated with your LinkedIn account (if permission is granted)</li>
            <li>Content you authorize us to post or interact with on your behalf</li>
          </ul>
          <p style={s.p}><strong style={{ color: "#f6f6f8", fontWeight: 600 }}>How We Use LinkedIn Data</strong></p>
          <ul style={s.ul}>
            <li>To enable authorized content publishing or scheduling on LinkedIn</li>
            <li>To identify and communicate with business contacts for service delivery</li>
            <li>To personalize proposals or creative deliverables relevant to your business</li>
          </ul>
          <p style={s.p}><strong style={{ color: "#f6f6f8", fontWeight: 600 }}>LinkedIn Data Restrictions</strong></p>
          <p style={s.p}>We do not sell, rent, or share LinkedIn member data with any third party except as required to deliver our services or as required by law. We use LinkedIn data strictly in accordance with <a href="https://www.linkedin.com/legal/l/api-terms-of-use" target="_blank" rel="noopener noreferrer" style={{ color: "#6aa0ff" }}>LinkedIn's API Terms of Use</a> and applicable data protection regulations.</p>
          <p style={{ ...s.p, marginBottom: 0 }}>You may revoke Prismix Studios' access to your LinkedIn data at any time by visiting your <a href="https://www.linkedin.com/psettings/permitted-services" target="_blank" rel="noopener noreferrer" style={{ color: "#6aa0ff" }}>LinkedIn Permitted Services settings</a>.</p>
        </section>

        <section id="how-we-use" style={s.section}>
          <h2 style={s.h2}><span style={s.num}>04</span> How We Use Information</h2>
          <p style={s.p}>We use the information we collect to:</p>
          <ul style={s.ul}>
            <li>Deliver and manage creative and generative AI media services contracted by clients</li>
            <li>Communicate with you about projects, proposals, and updates</li>
            <li>Process payments and manage billing</li>
            <li>Improve our website, tools, and service offerings</li>
            <li>Send relevant marketing communications (you may opt out at any time)</li>
            <li>Comply with legal obligations and enforce our agreements</li>
            <li>Prevent fraud and protect the security of our systems</li>
          </ul>
          <p style={{ ...s.p, marginBottom: 0 }}>We do not use personal data to train generative AI models without explicit written consent.</p>
        </section>

        <section id="sharing" style={s.section}>
          <h2 style={s.h2}><span style={s.num}>05</span> Sharing &amp; Disclosure</h2>
          <p style={s.p}>Prismix Studios does not sell personal information. We may share information with:</p>
          <ul style={s.ul}>
            <li><strong style={{ color: "#f6f6f8", fontWeight: 600 }}>Service Providers:</strong> Trusted vendors who help us operate our business (e.g., cloud hosting, payment processing, analytics) under strict confidentiality agreements.</li>
            <li><strong style={{ color: "#f6f6f8", fontWeight: 600 }}>Business Partners:</strong> Only with your consent, where required to deliver contracted services.</li>
            <li><strong style={{ color: "#f6f6f8", fontWeight: 600 }}>Legal Authorities:</strong> When required by applicable law, court order, or to protect the rights and safety of Prismix Studios or others.</li>
            <li><strong style={{ color: "#f6f6f8", fontWeight: 600 }}>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, subject to confidentiality obligations.</li>
          </ul>
        </section>

        <section id="retention" style={s.section}>
          <h2 style={s.h2}><span style={s.num}>06</span> Data Retention</h2>
          <p style={s.p}>We retain personal information for as long as necessary to fulfill the purposes described in this policy, comply with legal obligations, resolve disputes, and enforce our agreements. When data is no longer required, we securely delete or anonymize it.</p>
          <p style={{ ...s.p, marginBottom: 0 }}>Client project data is generally retained for a minimum of three (3) years after project completion for business and legal record-keeping purposes, unless a shorter period is required by law or requested by the client.</p>
        </section>

        <section id="security" style={s.section}>
          <h2 style={s.h2}><span style={s.num}>07</span> Security</h2>
          <p style={s.p}>We implement industry-standard technical and organizational measures to protect your information against unauthorized access, disclosure, alteration, or destruction. This includes encrypted data transmission (TLS/HTTPS), access controls, and regular security reviews.</p>
          <p style={{ ...s.p, marginBottom: 0 }}>No method of transmission or storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security. In the event of a data breach that affects your rights, we will notify you as required by applicable law.</p>
        </section>

        <section id="rights" style={s.section}>
          <h2 style={s.h2}><span style={s.num}>08</span> Your Rights</h2>
          <p style={s.p}>Depending on your location, you may have the following rights regarding your personal information:</p>
          <ul style={s.ul}>
            <li><strong style={{ color: "#f6f6f8", fontWeight: 600 }}>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong style={{ color: "#f6f6f8", fontWeight: 600 }}>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
            <li><strong style={{ color: "#f6f6f8", fontWeight: 600 }}>Deletion:</strong> Request deletion of your personal data, subject to legal retention obligations.</li>
            <li><strong style={{ color: "#f6f6f8", fontWeight: 600 }}>Objection:</strong> Object to certain uses of your data, including marketing communications.</li>
            <li><strong style={{ color: "#f6f6f8", fontWeight: 600 }}>Data Portability:</strong> Request your data in a machine-readable format where applicable.</li>
            <li><strong style={{ color: "#f6f6f8", fontWeight: 600 }}>Withdraw Consent:</strong> Where processing is based on consent, you may withdraw it at any time.</li>
          </ul>
          <p style={{ ...s.p, marginBottom: 0 }}>To exercise any of these rights, please contact us using the details in the <a href="#contact" style={{ color: "#6aa0ff" }}>Contact</a> section below. We will respond within 30 days.</p>
        </section>

        <section id="third-party" style={s.section}>
          <h2 style={s.h2}><span style={s.num}>09</span> Third-Party Links &amp; Services</h2>
          <p style={{ ...s.p, marginBottom: 0 }}>Our website and communications may contain links to third-party websites or integrate with third-party platforms (including LinkedIn, social media networks, and cloud tools). This Privacy Policy does not apply to those external services. We encourage you to review the privacy policies of any third-party platforms you interact with.</p>
        </section>

        <section id="contact" style={s.section}>
          <h2 style={s.h2}><span style={s.num}>10</span> Contact Us</h2>
          <p style={s.p}>If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your personal data, please reach out to us:</p>
          <div style={s.contactCard}>
            <p style={{ ...s.p, marginBottom: "8px" }}><strong style={{ color: "#f6f6f8", fontWeight: 600 }}>Prismix Studios</strong></p>
            <p style={{ ...s.p, marginBottom: "8px" }}>Website: <a href="https://prismixstudios.com" style={{ color: "#6aa0ff" }}>prismixstudios.com</a></p>
            <p style={{ ...s.p, marginBottom: "8px" }}>Email: <a href="mailto:Contact@prismixstudios.com" style={{ color: "#6aa0ff" }}>Contact@prismixstudios.com</a></p>
            <p style={{ ...s.p, marginBottom: 0 }}>For LinkedIn-specific data requests, please also revoke application access via your <a href="https://www.linkedin.com/psettings/permitted-services" target="_blank" rel="noopener noreferrer" style={{ color: "#6aa0ff" }}>LinkedIn account settings</a>.</p>
          </div>
          <p style={{ marginTop: "24px", fontSize: "0.85rem", color: "#61616d", lineHeight: 1.75 }}>We reserve the right to update this Privacy Policy at any time. Changes will be posted on this page with a revised "Last Updated" date. Continued use of our services after changes constitutes acceptance of the updated policy.</p>
        </section>

      </main>
    </div>
  );
}
