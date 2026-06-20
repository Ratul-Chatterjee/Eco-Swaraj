import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import type { CarbonAnalyticsDocument as CarbonAnalyticsDoc } from "../../services/carbonAnalyticsContract";
import { Leaf, Award, Compass, BarChart3 } from "lucide-react";
import { getFallbackStateValue, subscribeToCarbonAnalytics } from "../../services/carbonAnalytics";

export const CarbonStats: React.FC = () => {
  const { userProfile } = useUser();
  const [trigger, setTrigger] = useState(0);
  const [analytics, setAnalytics] = useState<CarbonAnalyticsDoc | null>(null);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setTrigger((prev) => prev + 1);
    };
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, []);

  useEffect(() => subscribeToCarbonAnalytics(setAnalytics), []);

  if (!userProfile) return null;

  const currentScore = userProfile.carbonScore;
  const baselineScore = userProfile.baselineScore;

  const reduction = baselineScore > 0
    ? Math.max(0, Math.round(((baselineScore - currentScore) / baselineScore) * 100))
    : 0;

  const stateAvg = useMemo(
    () => analytics?.stateValues?.[userProfile.state] ?? getFallbackStateValue(userProfile.state),
    [analytics, userProfile.state]
  );
  const liveNationalAverage = analytics?.nationalAverage ?? 1.8;

  const expPoints = userProfile.points;
  const userLevel = Math.floor(expPoints / 50);
  const currentLevelProgress = expPoints % 50;

  return (
    <div data-refresh={trigger} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }} className="stats-layout">
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Leaf color="var(--color-primary)" size={22} />
          <h3 style={{ fontSize: "1.3rem" }}>Carbon Footprint Summary</h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }} className="stats-grid">
          <div style={{ background: "hsla(222, 47%, 7%, 0.4)", padding: "16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Current Footprint</div>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--color-primary)", marginTop: "4px" }}>
              {currentScore} <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "var(--text-muted)" }}>t/yr</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>Tonnes CO2 equivalent</div>
          </div>

          <div style={{ background: "hsla(222, 47%, 7%, 0.4)", padding: "16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Initial Baseline</div>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#fff", marginTop: "4px" }}>
              {baselineScore} <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "var(--text-muted)" }}>t/yr</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>Calculated on onboarding</div>
          </div>

          <div style={{ background: "hsla(222, 47%, 7%, 0.4)", padding: "16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Total Reduction</div>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--color-secondary)", marginTop: "4px" }}>
              {reduction}%
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>Saved via checked logs</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--glass-border)", paddingTop: "16px" }}>
          <h4 style={{ fontSize: "1rem", display: "flex", gap: "8px", alignItems: "center" }}>
            <BarChart3 size={16} color="var(--color-secondary)" /> Benchmark Comparison
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Your Current Footprint</span>
              <strong style={{ color: currentScore <= stateAvg ? "var(--color-primary)" : "var(--color-danger)" }}>
                {currentScore} tCO2e
              </strong>
            </div>
            <div style={{ width: "100%", height: "8px", background: "var(--glass-border)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{
                width: `${Math.min(100, (currentScore / 4) * 100)}%`,
                height: "100%",
                background: currentScore <= stateAvg ? "var(--color-primary)" : "var(--color-danger)",
                borderRadius: "4px"
              }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>{userProfile.state} Avg Baseline</span>
              <strong>{stateAvg} tCO2e</strong>
            </div>
            <div style={{ width: "100%", height: "8px", background: "var(--glass-border)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{
                width: `${(stateAvg / 4) * 100}%`,
                height: "100%",
                background: "var(--text-muted)",
                borderRadius: "4px"
              }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>India National Average</span>
              <strong>{liveNationalAverage} tCO2e</strong>
            </div>
            <div style={{ width: "100%", height: "8px", background: "var(--glass-border)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{
                width: `${(liveNationalAverage / 4) * 100}%`,
                height: "100%",
                background: "var(--text-muted)",
                borderRadius: "4px"
              }} />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Award color="var(--color-primary)" size={22} />
          <h3 style={{ fontSize: "1.3rem" }}>Eco Rank & Levels</h3>
        </div>

        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px 0 var(--color-primary-glow)",
            border: "3px solid #fff"
          }}>
            <span style={{ fontSize: "2rem", fontWeight: "800", color: "#111827" }}>{userLevel}</span>
          </div>

          <h4 style={{ fontSize: "1.2rem", fontWeight: "700", marginTop: "4px" }}>
            {userLevel < 3 ? "Green Novice" : userLevel < 6 ? "Sustainability Scout" : "Eco-Warrior"}
          </h4>

          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", padding: "0 10px" }}>
            Log daily eco habits to gain experience points. Every 50 XP upgrades your level and unlocks new green buildings!
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px solid var(--glass-border)", paddingTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            <span>Level {userLevel} XP</span>
            <strong>{currentLevelProgress} / 50 XP</strong>
          </div>
          <div style={{ width: "100%", height: "6px", background: "var(--glass-border)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{
              width: `${(currentLevelProgress / 50) * 100}%`,
              height: "100%",
              background: "var(--color-primary)",
              borderRadius: "3px"
            }} />
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "4px", alignItems: "center", justifyContent: "center", marginTop: "4px" }}>
            <Compass size={12} /> Total Points Accrued: {expPoints} XP
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .stats-layout {
            grid-template-columns: 1fr !important;
          }
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};


