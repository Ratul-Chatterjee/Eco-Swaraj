import React from "react";

type Props = {
  title: string;
  icon: React.ReactNode;
  items: Array<{
    label: string;
    value: string;
  }>;
  description?: string;
};

export const PollutionStatCard: React.FC<Props> = ({ title, icon, items, description }) => {
  return (
    <section className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {icon}
        <h3 style={{ fontSize: "1.2rem" }}>{title}</h3>
      </div>
      {description && (
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {items.map((item) => (
          <div
            key={`${title}-${item.label}`}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              justifyContent: "space-between",
              gap: "12px",
              alignItems: "center",
              padding: "12px 0",
              borderTop: "1px solid var(--glass-border)"
            }}
          >
            <strong style={{ fontSize: "0.95rem" }}>{item.label}</strong>
            <span style={{ fontWeight: "700", whiteSpace: "nowrap" }}>{item.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
