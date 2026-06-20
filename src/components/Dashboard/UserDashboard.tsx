import React, { useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { useGame } from "../../contexts/GameContext";
import { CityCanvas } from "../IsometricCity/CityCanvas";
import { DailyLog } from "../Tracker/DailyLog";
import { CarbonStats } from "./CarbonStats";
import { AirQualityCard } from "./AirQualityCard";
import { DailyStreak } from "./DailyStreak";
import { Map, LogOut, MapPin, Award, Flame, Pencil, Leaf, LayoutDashboard } from "lucide-react";
import { ProfileSettings } from "./ProfileSettings";
import { EcoActivityPanel } from "./EcoActivityPanel";
import { MyCarbonFootprintCalculator } from "./MyCarbonFootprintCalculator";
import { SiteFooter } from "../Common/SiteFooter";

export const UserDashboard: React.FC = () => {
  const { userProfile, logoutUser } = useUser();
  const { ecoPoints, streakCount } = useGame();
  const [activeView, setActiveView] = useState<"activity" | "dashboard">("activity");
  const [activeTab, setActiveTab] = useState<"map" | "streak" | "tasks" | "stats" | "profile">("map");

  if (!userProfile) return null;

  const expPoints = userProfile.points;
  const userLevel = Math.floor(expPoints / 50);

  return (
    <div className="app-container">
      <header className="glass-card animate-fade-in" style={{
        margin: "20px 20px 0 20px",
        padding: "16px 24px",
        borderRadius: "var(--radius-sm)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px",
        minWidth: 0
      }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", minWidth: 0 }}>
          <button
            onClick={() => {
              setActiveView("dashboard");
              setActiveTab("profile");
            }}
            style={{
              position: "relative",
              border: "none",
              background: "none",
              padding: 0,
              cursor: "pointer",
              borderRadius: "50%",
              outline: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.2s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            title="Edit Profile"
          >
            {userProfile.photoUrl ? (
              <img
                src={userProfile.photoUrl}
                alt="Profile"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: activeTab === "profile" ? "2px solid var(--color-secondary)" : "2px solid var(--color-primary)",
                  transition: "border-color 0.2s"
                }}
              />
            ) : (
              <div style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                color: "#111827",
                fontWeight: "700",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
                border: activeTab === "profile" ? "2px solid var(--color-secondary)" : "none",
                transition: "border-color 0.2s"
              }}>
                {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : "U"}
              </div>
            )}

            <div style={{
              position: "absolute",
              bottom: "-2px",
              right: "-2px",
              background: "var(--color-primary)",
              color: "#111827",
              borderRadius: "50%",
              width: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1.5px solid #111827",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
            }}>
              <Pencil size={10} strokeWidth={2.5} />
            </div>
          </button>

          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "700" }}>
              Welcome, {userProfile.displayName || "Eco Citizen"}!
            </h2>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={12} color="var(--color-primary)" /> {userProfile.city}, {userProfile.state}
              </span>
              <span>•</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Award size={12} color="var(--color-secondary)" /> Level {userLevel}
              </span>
              {streakCount > 0 && (
                <>
                  <span>•</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#f97316" }}>
                    <Flame size={12} fill="#f97316" /> {streakCount} Day Streak
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginLeft: "auto", minWidth: 0 }}>
          <button
            className={`btn ${activeView === "activity" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveView("activity")}
            style={{ display: "flex", gap: "6px", fontSize: "0.85rem", padding: "8px 14px" }}
          >
            <Leaf size={14} /> Eco Activity
          </button>

          <button
            className={`btn ${activeView === "dashboard" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveView("dashboard")}
            style={{ display: "flex", gap: "6px", fontSize: "0.85rem", padding: "8px 14px" }}
          >
            <LayoutDashboard size={14} /> My Dashboard
          </button>

          <div style={{
            background: "hsla(222, 47%, 7%, 0.4)",
            border: "1px solid var(--glass-border)",
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.9rem",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span style={{ color: "var(--color-primary)" }}>●</span>
            <span>{ecoPoints} EP</span>
          </div>

          <button className="btn btn-secondary" onClick={logoutUser} style={{ display: "flex", gap: "6px", fontSize: "0.85rem", padding: "8px 14px" }}>
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </header>

      {activeView === "dashboard" && (
        <div style={{
          display: "flex",
          margin: "20px 20px 0 20px",
          gap: "10px",
          flexWrap: "wrap",
          minWidth: 0
        }}>
          <button
            className={`btn ${activeTab === "map" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("map")}
            style={{ padding: "10px 18px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Map size={16} /> Eco-City Map
          </button>

          <button
            className={`btn ${activeTab === "streak" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("streak")}
            style={{ padding: "10px 18px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Flame size={16} /> Daily Streak
          </button>

          <button
            className={`btn ${activeTab === "tasks" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("tasks")}
            style={{ padding: "10px 18px", fontSize: "0.9rem" }}
          >
            ✅ Daily Checklist
          </button>

          <button
            className={`btn ${activeTab === "stats" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("stats")}
            style={{ padding: "10px 18px", fontSize: "0.9rem" }}
          >
            My Analytics
          </button>
        </div>
      )}

      <main style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }} className="animate-fade-in">
        {activeView === "activity" && <EcoActivityPanel />}

        {activeView === "dashboard" && activeTab === "map" && <CityCanvas />}

        {activeView === "dashboard" && activeTab === "streak" && (
          <div className="animate-fade-in" style={{ display: "flex", justifyContent: "center" }}>
            <DailyStreak />
          </div>
        )}

        {activeView === "dashboard" && activeTab === "tasks" && <DailyLog />}

        {activeView === "dashboard" && activeTab === "profile" && <ProfileSettings />}

        {activeView === "dashboard" && activeTab === "stats" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">
            <CarbonStats />
            <MyCarbonFootprintCalculator />
            <AirQualityCard />
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
};
