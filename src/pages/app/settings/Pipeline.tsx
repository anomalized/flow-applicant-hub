const STAGES = [
  { key: "applied", label: "Applied", desc: "New candidates who have submitted an application." },
  { key: "screening", label: "Screening", desc: "Reviewing resumes and initial fit." },
  { key: "interview", label: "Interview", desc: "Active interview loop." },
  { key: "offer", label: "Offer", desc: "Offer extended, awaiting response." },
  { key: "rejected", label: "Rejected", desc: "No longer moving forward." },
];

export default function Pipeline() {
  return (
    <div style={{ color: "var(--color-text)", maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Pipeline Stages</h1>
      <p style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 24 }}>
        The stages candidates move through in every job pipeline.
      </p>
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {STAGES.map((s, i) => (
          <div
            key={s.key}
            style={{
              padding: "16px 20px",
              borderTop: i === 0 ? "none" : "1px solid var(--color-border)",
              display: "flex",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "color-mix(in oklab, var(--color-primary) 15%, transparent)",
                color: "var(--color-primary)",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {i + 1}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
