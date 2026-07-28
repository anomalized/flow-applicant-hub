const TEMPLATES = [
  {
    name: "Application received",
    subject: "We received your application",
    body: "Hi {{candidate_name}},\n\nThanks for applying to {{job_title}} at {{workspace_name}}. Our team will review your application and get back to you shortly.",
  },
  {
    name: "Interview invitation",
    subject: "Interview for {{job_title}}",
    body: "Hi {{candidate_name}},\n\nWe'd love to move forward with an interview for the {{job_title}} role. Please pick a time that works for you.",
  },
  {
    name: "Offer letter",
    subject: "Your offer from {{workspace_name}}",
    body: "Hi {{candidate_name}},\n\nWe're excited to extend an offer for the {{job_title}} role at {{workspace_name}}. Details are attached.",
  },
  {
    name: "Rejection",
    subject: "Update on your application",
    body: "Hi {{candidate_name}},\n\nThanks for your interest in {{job_title}}. After careful review, we won't be moving forward at this time.",
  },
];

export default function EmailTemplates() {
  return (
    <div style={{ color: "var(--color-text)", maxWidth: 820 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Email Templates</h1>
      <p style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 24 }}>
        Reference templates used across the hiring flow. Variables in double braces are auto-filled.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {TEMPLATES.map((t) => (
          <div
            key={t.name}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
            <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 4, marginBottom: 12 }}>
              Subject: {t.subject}
            </div>
            <pre
              style={{
                fontSize: 12.5,
                color: "var(--color-text)",
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: 12,
                margin: 0,
                whiteSpace: "pre-wrap",
                fontFamily: "var(--font-base)",
              }}
            >
              {t.body}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
