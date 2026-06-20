import React from "react";
import { Mail, MapPin, ExternalLink } from "lucide-react";

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
              <li><Mail size={14} /> [EMAIL_ADDRESS]</li>
            </ul>
          </div>

          <div className="site-footer__card">
            <h4>Explore</h4>
            <ul>
              <li>Eco Activity</li>
              <li>My Dashboard</li>
              <li>Daily Logs</li>
              <li>Carbon Calculator</li>
            </ul>
          </div>

          <div className="site-footer__card">
            <h4>Follow</h4>
            <ul>
              <li><ExternalLink size={14} /> GitHub</li>
              <li><ExternalLink size={14} /> Instagram</li>
              <li><ExternalLink size={14} /> LinkedIn</li>
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
