import React from "react";
import { AlertTriangle, Key, Terminal } from "lucide-react";

export const FirebaseConfigOverlay: React.FC = () => {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(9, 13, 24, 0.95)",
      backdropFilter: "blur(12px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div className="glass-card animate-fade-in" style={{
        maxWidth: "600px",
        width: "100%",
        border: "1px solid hsla(38, 92%, 50%, 0.3)",
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <AlertTriangle color="var(--color-warning)" size={32} />
          <h2 style={{ fontSize: "1.8rem" }}>Firebase Configuration Missing</h2>
        </div>
        
        <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
          Since this is a secure production-grade app, a live database and authentication setup is required. 
          To enable accounts, please configure your Firebase project variables.
        </p>

        <div style={{
          background: "hsla(222, 47%, 7%, 0.6)",
          padding: "16px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--glass-border)",
          fontFamily: "monospace",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)" }}>
            <Key size={16} />
            <span>Required Environment Variables:</span>
          </div>
          <div>VITE_FIREBASE_API_KEY=your_api_key</div>
          <div>VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com</div>
          <div>VITE_FIREBASE_PROJECT_ID=your_project_id</div>
          <div>VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com</div>
          <div>VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id</div>
          <div>VITE_FIREBASE_APP_ID=your_app_id</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <Terminal size={18} style={{ marginTop: "2px", flexShrink: 0 }} />
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
              <strong>For Local Development:</strong> Create a <code style={{color: "var(--color-secondary)"}}>.env.local</code> file in your project root folder and insert these variables. Vite will automatically load them and Git will ignore this file.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <Terminal size={18} style={{ marginTop: "2px", flexShrink: 0 }} />
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
              <strong>For Live Hosting (Vercel):</strong> Add these environment variables under Project Settings → Environment Variables in your Vercel Dashboard.
            </p>
          </div>
        </div>

        <div style={{ marginTop: "10px", fontSize: "0.85rem", color: "var(--color-warning)" }}>
          * Security Notice: The app has strict Firestore access rules enforced. No secrets are committed to GitHub.
        </div>
      </div>
    </div>
  );
};
