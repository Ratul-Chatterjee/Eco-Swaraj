import React, { useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { auth } from "../../services/firebase";
import { Mail, Lock, User, ShieldCheck } from "lucide-react";

export const AuthPortal: React.FC = () => {
  const { 
    loginWithEmail, 
    signUpWithEmail, 
    loginWithGoogle, 
    user, 
    refreshAuthStatus,
    resendVerificationEmail,
    loading 
  } = useUser();

  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  
  const [authError, setAuthError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState<boolean>(false);
  const [verificationEmail, setVerificationEmail] = useState<string>("");
  const [showVerificationFlow, setShowVerificationFlow] = useState<boolean>(false);

  const isVerificationRelatedError = (err: any) => {
    const message = String(err?.message || "").toLowerCase();
    return (
      message.includes("not verified") ||
      message.includes("unverified") ||
      message.includes("verification") ||
      err?.code === "auth/email-not-verified"
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (isSignUp) {
      if (!name.trim()) {
        setAuthError("Name field is required.");
        return;
      }
      if (password.length < 6) {
        setAuthError("Password must be at least 6 characters long.");
        return;
      }

      try {
        await signUpWithEmail(email, password, name);
        setVerificationEmail(email.trim());
        setVerificationSent(true);
        setShowVerificationFlow(true);
      } catch (err: any) {
        setAuthError(err.message || "Registration failed.");
      }
    } else {
      try {
        await loginWithEmail(email, password);
      } catch (err: any) {
        if (isVerificationRelatedError(err)) {
          setVerificationEmail(email);
          setVerificationSent(true);
          setShowVerificationFlow(true);
        } else {
          setAuthError(err.message || "Login failed.");
        }
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setVerificationSent(false);
    setShowVerificationFlow(false);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setAuthError(err.message || "Google Authentication failed.");
    }
  };

  const checkVerification = async () => {
    setAuthError(null);
    await refreshAuthStatus();

    if (auth?.currentUser?.emailVerified) {
      setVerificationSent(false);
      setShowVerificationFlow(false);
    }
  };

  const handleResendVerification = async () => {
    setAuthError(null);
    try {
      await resendVerificationEmail();
      setVerificationSent(true);
      setVerificationEmail(user?.email || email);
    } catch (err: any) {
      setAuthError(err.message || "Failed to resend verification email.");
    }
  };

  // Show the verification screen only after a real signup/login verification trigger.
  if (showVerificationFlow && verificationSent) {
    const targetEmail = user?.email || verificationEmail;
    return (
      <div style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}>
        <div className="glass-card animate-fade-in" style={{
          maxWidth: "480px",
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          padding: "32px"
        }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{
              background: "var(--color-primary-glow)",
              border: "1px solid var(--color-primary)",
              borderRadius: "50%",
              width: "64px",
              height: "64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary)"
            }}>
              <ShieldCheck size={36} />
            </div>
            <h2 style={{ fontSize: "2rem" }}>Verify Your Email</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.5" }}>
              We've sent a verification link to <strong style={{ color: "#fff" }}>{targetEmail}</strong>. 
              Please check your inbox and spam folder, click the link, and then return here.
            </p>
          </div>

          {authError && (
            <div style={{
              background: "rgba(255, 82, 82, 0.15)",
              border: "1px solid var(--color-danger)",
              color: "var(--color-danger)",
              padding: "12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.9rem",
              lineHeight: "1.4"
            }}>
              {authError}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
            <button 
              onClick={checkVerification} 
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              {loading ? "Checking..." : "I have verified my email"}
            </button>

            <button
              onClick={handleResendVerification}
              disabled={loading}
              className="btn btn-secondary"
              style={{ width: "100%" }}
            >
              {loading ? "Sending..." : "Resend verification email"}
            </button>

            <button
              onClick={() => {
                setVerificationSent(false);
                setShowVerificationFlow(false);
                setAuthError(null);
                window.dispatchEvent(new Event("eco-swaraj:close-auth"));
              }}
              className="btn btn-secondary"
              style={{ width: "100%" }}
            >
              Back to Landing Page
            </button>
            
            <button 
              onClick={() => {
                setVerificationSent(false);
                setShowVerificationFlow(false);
                setAuthError(null);
                setEmail("");
                setPassword("");
              }} 
              className="btn btn-secondary"
              style={{ width: "100%" }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px"
    }}>
      <div className="glass-card animate-fade-in" style={{
        maxWidth: "480px",
        width: "100%",
        maxHeight: "85vh",
        overflowY: "auto",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        boxShadow: "var(--shadow-glass)"
      }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 5vw, 2.2rem)", marginBottom: "6px" }}>
            {isSignUp ? "Create Eco-Account" : "Welcome Back"}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            {isSignUp 
              ? "Start tracking your carbon footprint and build your green city!" 
              : "Sign in to access your Eco-City dashboard and tasks"}
          </p>
        </div>

        {authError && (
          <div style={{
            background: "rgba(255, 82, 82, 0.15)",
            border: "1px solid var(--color-danger)",
            color: "var(--color-danger)",
            padding: "12px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.9rem",
            lineHeight: "1.4"
          }}>
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {isSignUp && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: "relative" }}>
                <User size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  className="glass-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", paddingLeft: "42px" }}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="email"
                className="glass-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", paddingLeft: "42px" }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="password"
                className="glass-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", paddingLeft: "42px" }}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", height: "46px", fontSize: "1rem" }}
          >
            {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          margin: "8px 0"
        }}>
          <div style={{ flex: 1, height: "1px", background: "var(--glass-border)" }}></div>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "var(--glass-border)" }}></div>
        </div>

        <button 
          onClick={handleGoogleSignIn} 
          disabled={loading}
          className="btn btn-google"
          style={{ width: "100%", height: "46px", display: "flex", gap: "10px", fontWeight: "600" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.8 2-1.8 2.6v2.2h2.9c1.7-1.6 2.7-4 2.7-7.2z"/>
            <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.8-3.1.8-2.4 0-4.4-1.6-5.1-3.8H.9v2.3C2.4 15.9 5.5 18 9 18z"/>
            <path fill="#FBBC05" d="M3.9 10.6c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V4.3H.9C.3 5.4 0 6.7 0 8s.3 2.6.9 3.7l3-2.3z"/>
            <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.4 3.4 1.3l2.6-2.6C13.4 1 11.4.3 9 .3 5.5.3 2.4 2.4.9 5.4l3 2.3c.7-2.2 2.7-4.1 5.1-4.1z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          textAlign: "center",
          lineHeight: 1.5,
          padding: "10px 0 4px",
          borderTop: "1px solid var(--glass-border)"
        }}>
          This website does not store any personal data beyond what is required for core functionality. All data is private and is not shared with anyone.{' '}
          <a
            href="https://github.com/Ratul-Chatterjee/Eco-Swaraj/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-primary)", textDecoration: "underline", fontWeight: 500 }}
          >
            Know more about User Data Policy
          </a>
        </div>

        <div style={{ textAlign: "center", marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setAuthError(null);
              setVerificationSent(false);
              setShowVerificationFlow(false);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary)",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
              fontSize: "0.95rem",
              fontWeight: "500"
            }}
          >
            {isSignUp ? "Already have an account? Sign In" : "New to Eco-Swaraj? Create an account"}
          </button>
          <button
            onClick={() => {
              window.dispatchEvent(new Event("eco-swaraj:close-auth"));
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
              fontSize: "0.9rem"
            }}
          >
            ← Back to Landing Page
          </button>
        </div>
      </div>
      <style>{`
        @media (max-height: 600px) {
          .glass-card.animate-fade-in {
            padding: 20px !important;
            gap: 12px !important;
          }
          .glass-card.animate-fade-in h2 {
            font-size: 1.3rem !important;
          }
          .glass-card.animate-fade-in p {
            font-size: 0.82rem !important;
          }
          .glass-card.animate-fade-in .btn {
            height: 38px !important;
            font-size: 0.85rem !important;
          }
          .glass-card.animate-fade-in input {
            padding: 8px 12px !important;
            font-size: 0.85rem !important;
          }
        }
        @media (max-height: 480px) {
          .glass-card.animate-fade-in {
            padding: 14px !important;
            gap: 8px !important;
          }
          .glass-card.animate-fade-in h2 {
            font-size: 1.1rem !important;
          }
          .glass-card.animate-fade-in .btn {
            height: 34px !important;
            font-size: 0.8rem !important;
          }
        }
        @media (max-width: 480px) {
          .glass-card.animate-fade-in {
            padding: 24px !important;
          }
        }
        @media (max-height: 700px) and (orientation: landscape) {
          .glass-card.animate-fade-in {
            max-height: 80vh !important;
          }
        }
      `}</style>
    </div>
  );
};
