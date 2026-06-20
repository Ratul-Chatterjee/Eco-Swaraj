import React, { useState, useEffect } from "react";
import { useGame } from "../../contexts/GameContext";
import { Flame, Calendar, CheckCircle2, Lock, Award, ShieldCheck, FlameKindling } from "lucide-react";

export const DailyStreak: React.FC = () => {
  const { streakCount, lastCheckIn, checkInStreak } = useGame();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>("");

  const todayStr = new Date().toDateString();
  const isAlreadyCheckedIn = lastCheckIn === todayStr;

  // Countdown timer to next check-in (midnight)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0); // Sets to 12:00 AM next day
      
      const diffMs = nextMidnight.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setCountdown("00:00:00");
        return;
      }
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      const pad = (num: number) => String(num).padStart(2, "0");
      setCountdown(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [lastCheckIn]);

  const handleCheckIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await checkInStreak();
      setSuccessMsg("Check-in successful! +10 Eco-Points awarded. 🔥");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to check in.");
    }
  };

  // Compute 7-day strip layout
  // Fill checked circles based on streakCount
  // e.g. if streakCount is 5, days 1-5 checked. If 9, days 1-2 checked (since 9 % 7 = 2) or we just show (streakCount % 7)
  const getDayStatus = (dayIndex: number) => {
    const currentCycleDay = streakCount === 0 ? 0 : (streakCount % 7 === 0 ? 7 : streakCount % 7);
    
    if (dayIndex <= currentCycleDay) {
      return "checked";
    } else if (dayIndex === currentCycleDay + 1 && !isAlreadyCheckedIn) {
      return "available";
    } else {
      return "locked";
    }
  };

  const DAYS_LABEL = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];

  return (
    <div className="glass-card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: isAlreadyCheckedIn ? "var(--color-primary-glow)" : "rgba(239, 68, 68, 0.1)",
          border: isAlreadyCheckedIn ? "2px solid var(--color-primary)" : "2px solid #ef4444",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isAlreadyCheckedIn ? "var(--color-primary)" : "#ef4444",
          boxShadow: isAlreadyCheckedIn ? "0 0 20px rgba(16, 185, 129, 0.3)" : "0 0 20px rgba(239, 68, 68, 0.2)",
          animation: isAlreadyCheckedIn ? "none" : "pulseGlow 2s infinite"
        }}>
          <Flame size={44} fill={isAlreadyCheckedIn ? "var(--color-primary)" : "#ef4444"} />
        </div>
        <div>
          <h3 style={{ fontSize: "1.6rem", fontWeight: "700" }}>
            {streakCount > 0 ? `${streakCount} Day${streakCount > 1 ? "s" : ""} Eco-Streak!` : "Start Your Eco-Streak"}
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
            {isAlreadyCheckedIn 
              ? "You've checked in today! Keep it up tomorrow to maintain your streak."
              : "Check in daily to build your green habit and earn bonus Eco-Points."}
          </p>
        </div>
      </div>

      {/* 7-Day Calendar Strip */}
      <div style={{
        background: "hsla(222, 47%, 7%, 0.4)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-sm)",
        padding: "20px 10px",
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "6px",
        textAlign: "center"
      }}>
        {DAYS_LABEL.map((label, index) => {
          const status = getDayStatus(index + 1);
          return (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500" }}>{label}</span>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: status === "checked" 
                  ? "var(--color-primary-glow)" 
                  : (status === "available" ? "rgba(16, 185, 129, 0.05)" : "var(--glass-bg)"),
                border: status === "checked" 
                  ? "1px solid var(--color-primary)" 
                  : (status === "available" ? "1px dashed var(--color-primary)" : "1px solid var(--glass-border)"),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: status === "checked" 
                  ? "var(--color-primary)" 
                  : (status === "available" ? "var(--color-primary)" : "var(--text-muted)")
              }}>
                {status === "checked" && <CheckCircle2 size={18} fill="rgba(16, 185, 129, 0.15)" />}
                {status === "available" && <FlameKindling size={16} className="animate-pulse" />}
                {status === "locked" && <Lock size={14} />}
              </div>
            </div>
          );
        })}
      </div>

      {errorMsg && (
        <div style={{
          background: "rgba(255, 82, 82, 0.1)",
          border: "1px solid var(--color-danger)",
          color: "var(--color-danger)",
          padding: "12px",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.85rem",
          textAlign: "center"
        }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{
          background: "rgba(16, 185, 129, 0.1)",
          border: "1px solid var(--color-primary)",
          color: "var(--color-primary)",
          padding: "12px",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.85rem",
          textAlign: "center"
        }}>
          {successMsg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
        {isAlreadyCheckedIn ? (
          <div style={{ textAlign: "center", width: "100%" }}>
            <button className="btn btn-secondary" disabled style={{ width: "100%", padding: "14px", fontSize: "1rem", cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <ShieldCheck size={18} /> Checked In Today
            </button>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "8px" }}>
              Next check-in opens in <strong style={{ color: "#fff", fontFamily: "monospace" }}>{countdown}</strong>
            </p>
          </div>
        ) : (
          <button 
            className="btn btn-primary animate-pulse" 
            onClick={handleCheckIn}
            style={{ width: "100%", padding: "14px", fontSize: "1.05rem", fontWeight: "600", boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)" }}
          >
            Check In Today (+10 EP) 🔥
          </button>
        )}
      </div>

      <div style={{
        borderTop: "1px solid var(--glass-border)",
        paddingTop: "16px",
        fontSize: "0.8rem",
        color: "var(--text-muted)",
        lineHeight: "1.5",
        display: "flex",
        flexDirection: "column",
        gap: "6px"
      }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <Award size={14} style={{ color: "var(--color-secondary)", flexShrink: 0, marginTop: "2px" }} />
          <span>Each daily check-in rewards you with **10 Eco-Points** to spend on structures in your Eco-City.</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <Calendar size={14} style={{ color: "var(--color-secondary)", flexShrink: 0, marginTop: "2px" }} />
          <span>If you miss checking in for a calendar day, your streak will reset to 1. Consistency creates change!</span>
        </div>
      </div>
    </div>
  );
};
