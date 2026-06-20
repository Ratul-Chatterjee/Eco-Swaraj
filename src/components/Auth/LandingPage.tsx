import React, { useEffect, useState } from "react";
import { AuthPortal } from "./AuthPortal";
import { Leaf, Wind, Globe, TrendingDown, ArrowRight, ShieldAlert, Award } from "lucide-react";
import { SiteFooter } from "../Common/SiteFooter";
import { IndiaCarbonMap } from "../Common/IndiaCarbonMap";

export const LandingPage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const closeAuthModal = () => setShowAuthModal(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAuthModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      position: "relative"
    }}>
      <div style={{
        position: "absolute",
        top: "10%",
        left: "5%",
        width: "300px",
        height: "300px",
        background: "radial-gradient(circle, var(--color-primary-glow) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0
      }} />
      <div style={{
        position: "absolute",
        bottom: "15%",
        right: "10%",
        width: "400px",
        height: "400px",
        background: "radial-gradient(circle, var(--color-secondary-glow) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0
      }} />

      <header className="glass-card" style={{
        margin: "20px",
        padding: "16px 32px",
        borderRadius: "var(--radius-sm)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/logo.png" alt="Eco-Swaraj Logo" style={{ width: "42px", height: "42px", objectFit: "contain" }} />
          <h1 style={{ fontSize: "1.6rem", fontWeight: "700" }} className="text-gradient">Eco-Swaraj</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAuthModal(true)}>
          Access Dashboard
        </button>
      </header>

      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        zIndex: 5,
        maxWidth: "1200px",
        margin: "0 auto",
        width: "100%"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: "40px",
          alignItems: "center",
          width: "100%"
        }} className="hero-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--color-primary-glow)",
              border: "1px solid hsla(158, 82%, 48%, 0.2)",
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              width: "fit-content",
              color: "var(--color-primary)",
              fontSize: "0.85rem",
              fontWeight: "600"
            }}>
              <Award size={14} />
              <span>PromptWars Challenge 3 Submission</span>
            </div>

            <h2 style={{ fontSize: "3.5rem", lineHeight: "1.1", fontWeight: "800" }}>
              Track Carbon. <br />
              <span className="text-gradient">Build Your Eco-City.</span>
            </h2>

            <p style={{ color: "var(--text-secondary)", fontSize: "1.15rem", lineHeight: "1.6" }}>
              Join Eco-Swaraj, India's gamified carbon awareness platform.
              Measure your footprint, log daily green activities like taking the metro or compost recycling,
              earn Carbon Coins, and construct a thriving, 2D isometric digital eco-village in real-time.
            </p>

            <div style={{ display: "flex", gap: "16px" }}>
              <button className="btn btn-primary" style={{ padding: "14px 28px", fontSize: "1.05rem" }} onClick={() => setShowAuthModal(true)}>
                Get Started <ArrowRight size={18} />
              </button>
              <a href="#about" className="btn btn-secondary" style={{ padding: "14px 28px", fontSize: "1.05rem" }}>
                Learn More
              </a>
            </div>
          </div>

          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h3 style={{ fontSize: "1.3rem" }}>Did You Know? (India Baselines)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ color: "var(--color-warning)" }}><Globe size={24} /></div>
                <div>
                  <div style={{ fontWeight: "600" }}>1.8 tonnes CO₂e</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Average annual carbon footprint per capita in India.</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ color: "var(--color-danger)" }}><ShieldAlert size={24} /></div>
                <div>
                  <div style={{ fontWeight: "600" }}>Scope 2 Grid Intensity</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Coal-heavy states (e.g. Gujarat) emit ~0.82 kg CO₂/kWh, while hydro-rich states (e.g. Kerala) emit only ~0.40 kg.</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ color: "var(--color-primary)" }}><TrendingDown size={24} /></div>
                <div>
                  <div style={{ fontWeight: "600" }}>Our Goal: Under 1.0 Tonne</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Through micro-actions logged in Eco-Swaraj, drop your emission rate to level up your solar village.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section id="about" style={{ width: "100%", marginTop: "80px", paddingTop: "40px", borderTop: "1px solid var(--glass-border)", display: "flex", flexDirection: "column", gap: "40px" }}>
          <div style={{ textAlign: "center" }}>
            <h3 style={{ fontSize: "2rem", marginBottom: "8px" }}>How Eco-Swaraj Works</h3>
            <p style={{ color: "var(--text-secondary)" }}>Three simple steps to transition towards a sustainable lifestyle.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }} className="feature-grid">
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ color: "var(--color-primary)", display: "flex", gap: "10px", alignItems: "center" }}>
                <Wind size={28} />
                <h4 style={{ fontSize: "1.2rem" }}>1. Localized Calculations</h4>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>
                Enter your location and utility bills. Our calculator maps the exact power-grid carbon emission rates for your state and city in India, giving you accurate data.
              </p>
            </div>

            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ color: "var(--color-secondary)", display: "flex", gap: "10px", alignItems: "center" }}>
                <TrendingDown size={28} />
                <h4 style={{ fontSize: "1.2rem" }}>2. Daily Eco Logs</h4>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>
                Log daily actions like air-dry laundry, taking public metro transport, or eating vegetarian meals. Actions reduce your active emission score and earn you Carbon Coins.
              </p>
            </div>

            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ color: "var(--color-accent)", display: "flex", gap: "10px", alignItems: "center" }}>
                <Leaf size={28} />
                <h4 style={{ fontSize: "1.2rem" }}>3. Digital City Builder</h4>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>
                Spend your Carbon Coins in our shop to place procedural solar panels, wind turbines, EV charging ports, or forest trees onto an interactive, custom 2D isometric grid!
              </p>
            </div>
          </div>
        </section>

        <div style={{ width: "100%", marginTop: "70px" }}>
          <IndiaCarbonMap />
        </div>
      </main>

      {showAuthModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(9, 13, 24, 0.75)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: "20px",
          cursor: "default"
        }}
        onClick={closeAuthModal}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            closeAuthModal();
          }
        }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true">
          <div onClick={(e) => e.stopPropagation()} style={{ width: "fit-content", maxWidth: "100%", display: "flex", justifyContent: "center" }}>
            <AuthPortal />
          </div>
        </div>
      )}

      <SiteFooter />

      <style>{`
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .hero-grid div {
            align-items: center !important;
          }
          .feature-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
