import React from "react";
import { Mail, MapPin, ExternalLink, ArrowRight } from "lucide-react";

const openAuthModal = () => {
  window.dispatchEvent(new CustomEvent("eco-swaraj:open-auth"));
};

export const SiteFooter: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <div className="site-footer__logoWrap">
            <img src="/logo.png" alt="Eco-Swaraj" className="site-footer__logo" />
          </div>
          <div>
            <h3 className="site-footer__title">Eco-Swaraj</h3>
            <p className="site-footer__subtitle">Build your city. Track your footprint. Lower your Carbon footprint impact.</p>
          </div>
        </div>

        <div className="site-footer__columns">
          <div className="site-footer__card">
            <h4>Contact</h4>
            <ul>
              <li><MapPin size={14} /> India</li>
              <li>
                <a
                  href="https://hack2skill.com/dashboard/user_public_profile/?userId=69e4ded1f8f1d2379b1f3f97"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <Mail size={14} /> Ratul Chatterjee Hack2Skill
                </a>
              </li>
            </ul>
          </div>

          <div className="site-footer__card">
            <h4>Explore</h4>
            <ul>
              <li>
                <button
                  type="button"
                  onClick={openAuthModal}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "inherit",
                    font: "inherit",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <ArrowRight size={14} /> Get Started
                </button>
              </li>
            </ul>
          </div>

          <div className="site-footer__card">
            <h4>Follow</h4>
            <ul>
              <li>
                <a href="https://github.com/Ratul-Chatterjee/Eco-Swaraj" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <ExternalLink size={14} /> GitHub
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/in/ratulchatterjee99" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <ExternalLink size={14} /> LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="site-footer__bottom">
        <span>© 2026 Eco-Swaraj (Made by Ratul Chatterjee)</span>
        <span>Carbon awareness and sustainable habit building platform</span>
      </div>
    </footer>
  );
};
