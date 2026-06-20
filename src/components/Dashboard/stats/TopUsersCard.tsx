import React from "react";
import { Users } from "lucide-react";

export type TopUserEntry = {
  uid: string;
  displayName: string;
  state: string;
  city: string;
  carbonScore: number;
  points: number;
  streakCount: number;
  completedTasks: number;
};

type Props = {
  users: TopUserEntry[];
};

export const TopUsersCard: React.FC<Props> = ({ users }) => {
  return (
    <section className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Users color="var(--color-secondary)" size={20} />
        <h3 style={{ fontSize: "1.2rem" }}>Top Users</h3>
      </div>
      {users.length === 0 ? (
        <div style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
          No ranking entries yet. Once users complete tasks or their profiles sync from storage, they will appear here automatically.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {users.map((user, index) => (
            <div
              key={user.uid}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: "10px",
                alignItems: "center",
                padding: "12px 0",
                borderTop: "1px solid var(--glass-border)"
              }}
            >
              <strong>{index + 1}.</strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <strong style={{ fontSize: "0.95rem" }}>{user.displayName}</strong>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.4 }}>
                  {user.city || "Unknown city"}, {user.state || "Unknown state"} · {user.completedTasks} completed tasks · {user.streakCount} day streak
                </span>
              </div>
              <span style={{ fontWeight: "700", whiteSpace: "nowrap" }}>{user.carbonScore} tCO2e</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
