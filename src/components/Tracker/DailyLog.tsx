import React, { useState, useRef, useEffect } from "react";
import { useGame } from "../../contexts/GameContext";
import { Zap, Car, Trash2, ShieldCheck, Footprints, Upload, X, ScanLine, CheckCircle2, AlertTriangle, RotateCcw, Loader2 } from "lucide-react";
import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";



// Keywords per task that the AI scanner checks against the uploaded file name / type
const TASK_KEYWORDS: Record<string, string[]> = {
  e1: ["fan", "ac", "cool", "ceiling", "switch", "power", "electricity"],
  e2: ["plug", "unplug", "standby", "charger", "electronics", "socket", "wire", "cord"],
  t1: ["bus", "metro", "train", "transit", "auto", "rick", "commute", "railway", "transport"],
  t2: ["cycle", "bike", "walk", "foot", "pedestrian", "bicycle", "hike", "cycle"],
  w1: ["compost", "waste", "organic", "kitchen", "bin", "garbage", "food", "worm"],
  w2: ["bag", "reuse", "cloth", "plastic", "tote", "grocery", "eco", "carry"],
  f1: ["veg", "vegetarian", "salad", "plant", "dal", "roti", "fruit", "greens", "meal", "food", "thali"]
};

type ScanStatus = "idle" | "scanning" | "approved" | "rejected";

interface ProofModalProps {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
  onApproved: (objectUrl: string) => void;
}

const ProofModal: React.FC<ProofModalProps> = ({ taskId, taskTitle, onClose, onApproved }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [rejectReason, setRejectReason] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (JPG, PNG, WEBP, etc.)");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScanStatus("idle");
  };

  // Load MobileNet model on component mount
  const [model, setModel] = useState<any>(null);
  const [modelStatus, setModelStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const load = async () => {
      try {
        setModelStatus("loading");
        await tf.ready();
        const loadedModel = await mobilenet.load();
        setModel(loadedModel);
        setModelStatus("ready");
      } catch (e) {
        console.error('Failed to load MobileNet model', e);
        setModelStatus("error");
      }
    };
    load();
  }, []);

  const runAIVerification = async () => {
    if (!selectedFile) return;

    setScanStatus("scanning");
    setScanProgress(0);

    // Animate progress bar
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      let isApproved = false;
      const keywords = TASK_KEYWORDS[taskId] || [];

      if (model) {
        // Load the image into an HTMLImageElement for TensorFlow
        const img = new Image();
        img.src = previewUrl as string;
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = err => rej(err);
        });

        // Perform classification
        const predictions = await model.classify(img);
        const topLabels = predictions.map((p: { className: string }) => p.className.toLowerCase());

        // Check against task keywords
        isApproved = keywords.some(kw => topLabels.some((label: string) => label.includes(kw)));
      } else {
        // Fallback: Check filename and title keywords
        const fileNameLower = selectedFile.name.toLowerCase();
        isApproved = keywords.some(kw => fileNameLower.includes(kw)) || keywords.some(kw => taskTitle.toLowerCase().includes(kw));
        
        // Brief timeout for simulated processing
        await new Promise(res => setTimeout(res, 1200));
      }

      clearInterval(progressInterval);
      setScanProgress(100);

      if (isApproved) {
        setScanStatus("approved");
      } else {
        setScanStatus("rejected");
        setRejectReason(
          `The uploaded image does not appear to match the expected activity for "${taskTitle}". ` +
          `Please submit a clear photo showing the task being performed.`
        );
      }
    } catch (err) {
      console.error("AI scanning error, falling back to filename validation:", err);
      const keywords = TASK_KEYWORDS[taskId] || [];
      const fileNameLower = selectedFile.name.toLowerCase();
      const isApproved = keywords.some(kw => fileNameLower.includes(kw)) || keywords.some(kw => taskTitle.toLowerCase().includes(kw));

      clearInterval(progressInterval);
      setScanProgress(100);

      if (isApproved) {
        setScanStatus("approved");
      } else {
        setScanStatus("rejected");
        setRejectReason(
          `AI scanning error. The filename "${selectedFile.name}" does not match the activity. ` +
          `Please rename the file to describe the activity (e.g. "bus_commute.jpg") or upload a clear photo.`
        );
      }
    }
  };

  const handleConfirm = () => {
    if (previewUrl) {
      onApproved(previewUrl);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(6px)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div className="glass-card animate-fade-in" style={{
        maxWidth: "520px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        position: "relative",
        boxShadow: "0 0 40px rgba(16, 185, 129, 0.15)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>📸 Submit Proof</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              Upload an image proving you completed this activity.
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}>
            <X size={20} />
          </button>
        </div>

        {/* Task name reminder */}
        <div style={{
          background: "rgba(16, 185, 129, 0.05)",
          border: "1px solid rgba(16, 185, 129, 0.25)",
          borderRadius: "var(--radius-sm)",
          padding: "10px 14px",
          fontSize: "0.85rem",
          color: "var(--text-secondary)"
        }}>
          <span style={{ color: "var(--color-primary)", fontWeight: "600" }}>Activity: </span>
          {taskTitle}
        </div>

        {/* File Upload Zone */}
        {scanStatus === "idle" && (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed var(--glass-border)",
              borderRadius: "var(--radius-sm)",
              padding: "28px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              background: "hsla(222, 47%, 7%, 0.3)"
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--color-primary)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--glass-border)")}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" style={{ maxHeight: "160px", maxWidth: "100%", borderRadius: "6px", objectFit: "cover" }} />
            ) : (
              <>
                <Upload size={32} style={{ color: "var(--color-primary)", marginBottom: "10px" }} />
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  Click to upload image from your device
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  JPG, PNG, WEBP — max 10 MB
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </div>
        )}

        {/* AI Scanning Animation */}
        {scanStatus === "scanning" && (
          <div style={{
            border: "1px solid var(--color-primary)",
            borderRadius: "var(--radius-sm)",
            padding: "24px",
            textAlign: "center",
            background: "rgba(16, 185, 129, 0.03)",
            position: "relative",
            overflow: "hidden"
          }}>
            {previewUrl && (
              <div style={{ position: "relative", display: "inline-block", marginBottom: "16px" }}>
                <img src={previewUrl} alt="Scanning" style={{ maxHeight: "140px", maxWidth: "100%", borderRadius: "6px", objectFit: "cover", filter: "brightness(0.7)" }} />
                {/* Laser scan line */}
                <div style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)",
                  boxShadow: "0 0 8px var(--color-primary)",
                  animation: "scanLine 1.2s linear infinite",
                  top: `${scanProgress}%`
                }} />
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px" }}>
              <ScanLine size={18} style={{ color: "var(--color-primary)" }} />
              <span style={{ color: "var(--color-primary)", fontWeight: "600", fontSize: "0.95rem" }}>
                Eco-AI Verification Scanner
              </span>
            </div>
            <div style={{ background: "var(--glass-bg)", borderRadius: "var(--radius-full)", height: "6px", overflow: "hidden", marginBottom: "8px" }}>
              <div style={{
                height: "100%",
                width: `${Math.min(100, scanProgress)}%`,
                background: "linear-gradient(90deg, var(--color-primary), var(--color-secondary))",
                borderRadius: "var(--radius-full)",
                transition: "width 0.3s ease",
                boxShadow: "0 0 8px var(--color-primary)"
              }} />
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Analysing image for activity relevance... {Math.round(scanProgress)}%
            </p>
          </div>
        )}

        {/* Approved State */}
        {scanStatus === "approved" && (
          <div style={{
            border: "1px solid var(--color-primary)",
            borderRadius: "var(--radius-sm)",
            padding: "20px",
            textAlign: "center",
            background: "rgba(16, 185, 129, 0.05)"
          }}>
            {previewUrl && (
              <img src={previewUrl} alt="Approved proof" style={{ maxHeight: "120px", maxWidth: "100%", borderRadius: "6px", objectFit: "cover", marginBottom: "12px" }} />
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "var(--color-primary)", marginBottom: "6px" }}>
              <CheckCircle2 size={20} fill="rgba(16, 185, 129, 0.2)" />
              <span style={{ fontWeight: "700", fontSize: "1rem" }}>Proof Verified ✓</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Your image has been approved by the Eco-AI scanner. Eco-Points will be awarded!
            </p>
          </div>
        )}

        {/* Rejected State */}
        {scanStatus === "rejected" && (
          <div style={{
            border: "1px solid var(--color-danger)",
            borderRadius: "var(--radius-sm)",
            padding: "20px",
            textAlign: "center",
            background: "rgba(255, 82, 82, 0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "var(--color-danger)", marginBottom: "8px" }}>
              <AlertTriangle size={20} />
              <span style={{ fontWeight: "700", fontSize: "1rem" }}>Proof Not Verified</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              {rejectReason}
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => { setScanStatus("idle"); setSelectedFile(null); setPreviewUrl(null); }}
              style={{ marginTop: "12px", fontSize: "0.8rem", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <RotateCcw size={14} /> Try Again
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          {scanStatus === "idle" && (
            <button
              className="btn btn-primary"
              onClick={runAIVerification}
              disabled={!selectedFile || modelStatus === "loading"}
              style={{
                flex: 1,
                opacity: selectedFile && modelStatus !== "loading" ? 1 : 0.5,
                cursor: selectedFile && modelStatus !== "loading" ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              {modelStatus === "loading" ? (
                <>
                  <Loader2 size={16} className="animate-spin-slow" /> Loading AI Model...
                </>
              ) : (
                "Verify with Eco-AI →"
              )}
            </button>
          )}
          {scanStatus === "approved" && (
            <button className="btn btn-primary" onClick={handleConfirm} style={{ flex: 1 }}>
              Claim Eco-Points ✓
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: scanStatus === "scanning" ? 1 : "none", padding: "10px 18px" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export const DailyLog: React.FC = () => {
  const { dailyTasks, logEcoAction, resetDailyTasks } = useGame();
  const [activeProofTask, setActiveProofTask] = useState<{ id: string; title: string } | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "energy": return <Zap size={18} color="var(--color-warning)" />;
      case "transport": return <Car size={18} color="var(--color-secondary)" />;
      case "waste": return <Trash2 size={18} color="var(--color-primary)" />;
      default: return <Footprints size={18} color="var(--color-accent)" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "energy": return "Energy Conservation";
      case "transport": return "Low-Carbon Transit";
      case "waste": return "Waste Reduction";
      default: return "Sustainable Diet";
    }
  };

  const handleProofApproved = async (taskId: string, objectUrl: string) => {
    await logEcoAction(taskId, objectUrl);
    setActiveProofTask(null);
  };

  const handleReset = async () => {
    await resetDailyTasks();
    setResetConfirm(false);
  };

  const completedCount = dailyTasks.filter(t => t.completed).length;
  const totalPoints = dailyTasks.filter(t => t.completed).reduce((sum, t) => sum + t.pointsReward, 0);

  return (
    <>
      {/* AI Proof Modal */}
      {activeProofTask && (
        <ProofModal
          taskId={activeProofTask.id}
          taskTitle={activeProofTask.title}
          onClose={() => setActiveProofTask(null)}
          onApproved={(url) => handleProofApproved(activeProofTask.id, url)}
        />
      )}

      {/* Reset Confirmation Modal */}
      {resetConfirm && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div className="glass-card animate-fade-in" style={{ maxWidth: "420px", width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--color-danger)" }}>
              <AlertTriangle size={22} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--color-danger)" }}>Reset Checklist?</h3>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6" }}>
              This will deduct all <strong style={{ color: "#fff" }}>{totalPoints} Eco-Points</strong> earned today from your balance. 
              If this causes a deficit, placed buildings in your Eco-City will be automatically removed to cover the shortfall.
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              ⚠️ This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn btn-secondary" onClick={() => setResetConfirm(false)} style={{ flex: 1 }}>Cancel</button>
              <button
                className="btn"
                onClick={handleReset}
                style={{ flex: 1, background: "rgba(255, 82, 82, 0.2)", border: "1px solid var(--color-danger)", color: "var(--color-danger)" }}
              >
                Reset & Deduct
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ fontSize: "1.4rem" }}>Sustainable Daily Tracker</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              Complete activities with photo proof. Earn Eco-Points to build your green city!
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {completedCount > 0 && (
              <span style={{ fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: "600" }}>
                {completedCount}/{dailyTasks.length} done • +{totalPoints} EP
              </span>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => setResetConfirm(true)}
              style={{ fontSize: "0.85rem", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {dailyTasks.map((task) => (
            <div
              key={task.id}
              style={{
                background: task.completed ? "rgba(0, 230, 153, 0.05)" : "hsla(222, 47%, 7%, 0.4)",
                border: task.completed ? "1px solid rgba(0, 230, 153, 0.3)" : "1px solid var(--glass-border)",
                borderRadius: "var(--radius-sm)",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px",
                transition: "all 0.3s"
              }}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flex: 1 }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  {getCategoryIcon(task.category)}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    letterSpacing: "0.05em"
                  }}>
                    {getCategoryLabel(task.category)}
                  </span>
                  <h4 style={{
                    fontSize: "1rem",
                    fontWeight: "500",
                    marginTop: "2px",
                    color: task.completed ? "var(--text-muted)" : "var(--text-primary)",
                    textDecoration: task.completed ? "line-through" : "none"
                  }}>
                    {task.title}
                  </h4>
                  <div style={{ display: "flex", gap: "10px", marginTop: "4px", fontSize: "0.8rem", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ color: "var(--color-primary)", fontWeight: "500" }}>
                      -{task.co2Reduction} kg CO₂
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>•</span>
                    <span style={{ color: "var(--color-secondary)", fontWeight: "500" }}>
                      +{task.pointsReward} EP
                    </span>
                    {task.proofImage && (
                      <>
                        <span style={{ color: "var(--text-muted)" }}>•</span>
                        <img src={task.proofImage} alt="proof" style={{ width: "28px", height: "28px", borderRadius: "4px", objectFit: "cover", border: "1px solid rgba(16, 185, 129, 0.4)" }} />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {task.completed ? (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "var(--color-primary)",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  background: "rgba(0, 230, 153, 0.15)",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-full)",
                  whiteSpace: "nowrap"
                }}>
                  <ShieldCheck size={16} /> Verified
                </div>
              ) : (
                <button
                  onClick={() => setActiveProofTask({ id: task.id, title: task.title })}
                  className="btn btn-primary"
                  style={{
                    fontSize: "0.85rem",
                    padding: "8px 16px",
                    borderRadius: "var(--radius-sm)",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Upload size={14} /> Log Action
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
