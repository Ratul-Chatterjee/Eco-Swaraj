import React, { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { Camera } from "lucide-react";
import { INDIA_STATE_OPTIONS, getCitiesForState } from "../../data/locationOptions";

export const ProfileSettings: React.FC = () => {
  const { userProfile, updateProfile } = useUser();
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [preview, setPreview] = useState("");
  const cityOptions = useMemo(() => getCitiesForState(state), [state]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!userProfile) return;
    setDisplayName(userProfile.displayName || "");
    setState(userProfile.state || "");
    setCity(userProfile.city || "");
    setPhotoUrl(userProfile.photoUrl || "");
    setPreview(userProfile.photoUrl || "");
  }, [userProfile]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPhotoUrl(result);
      setPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    try {
      await updateProfile({ displayName, city, state, photoUrl });
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ maxWidth: "500px", margin: "40px auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: "700" }}>Edit Profile</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
          Update your public profile details and avatar picture.
        </p>
      </div>

      {successMessage && (
        <div style={{ background: "rgba(0, 230, 153, 0.15)", border: "1px solid var(--color-primary)", color: "var(--color-primary)", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", textAlign: "center" }}>
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div onClick={triggerFileInput} style={{ position: "relative", width: "100px", height: "100px", borderRadius: "50%", cursor: "pointer", overflow: "hidden", border: "3px solid var(--color-primary)", boxShadow: "0 4px 14px var(--color-primary-glow)", transition: "transform 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
            {preview ? <img src={preview} alt="Profile Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "2.2rem", fontWeight: "800", color: "#111827" }}>{displayName ? displayName.charAt(0).toUpperCase() : "U"}</span>}
            <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "35%", background: "rgba(17, 24, 39, 0.75)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.7rem", gap: "4px" }}>
              <Camera size={12} />
            </div>
          </div>
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
          <button type="button" className="btn btn-secondary" onClick={triggerFileInput} style={{ padding: "6px 14px", fontSize: "0.8rem", borderRadius: "var(--radius-sm)" }}>
            Choose Image
          </button>
        </div>

        <div className="form-group" style={{ width: "100%" }}>
          <label className="form-label">Display Name</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="glass-input" style={{ width: "100%" }} placeholder="Eco Citizen" required />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", width: "100%" }}>
          <div className="form-group" style={{ width: "100%" }}>
            <label className="form-label">State / Region</label>
            <select value={state} onChange={(e) => { setState(e.target.value); setCity(""); }} className="glass-input" style={{ width: "100%", background: "hsl(222, 47%, 7%)" }}>
              <option value="">Select your state</option>
              {INDIA_STATE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ width: "100%" }}>
            <label className="form-label">City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="glass-input" style={{ width: "100%", background: "hsl(222, 47%, 7%)" }} disabled={!state}>
              <option value="">{state ? "Select your city" : "Select a state first"}</option>
              {cityOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ width: "100%", marginTop: "8px" }}>
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};
