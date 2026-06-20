import React, { useRef, useEffect, useState } from "react";
import { useGame } from "../../contexts/GameContext";
import type { Building } from "../../contexts/GameContext";
import { Zap, Trees, RefreshCw, PlusCircle, ArrowUp } from "lucide-react";

export const CityCanvas: React.FC = () => {
  const { buildings, ecoPoints, placeBuilding, upgradeBuilding } = useGame();
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Placement State
  const [selectedBuildType, setSelectedBuildType] = useState<Building["type"] | null>(null);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Isometric Projection Parameters
  const tileWidth = 80;
  const tileHeight = 40;
  const gridSize = 8;
  
  // Pan Offset
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  const [animationFrameId, setAnimationFrameId] = useState<number>(0);
  const [turbineAngle, setTurbineAngle] = useState(0);

  // Shop item prices
  const shopItems = [
    { type: "solar" as const, name: "Solar Panel Array", cost: 80, desc: "Generates clean electricity", icon: <Zap size={16} /> },
    { type: "wind" as const, name: "Wind Turbine", cost: 150, desc: "Harnesses wind energy (animated)", icon: <RefreshCw size={16} /> },
    { type: "forest" as const, name: "Tree Grove", cost: 40, desc: "Offsets carbon emissions", icon: <Trees size={16} /> },
    { type: "ev" as const, name: "EV Charging Port", cost: 120, desc: "Encourages electric transit", icon: <PlusCircle size={16} /> }
  ];

  // Recenter/resize canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      setCanvasScale(dpr);
      canvas.width = Math.floor(container.clientWidth * dpr);
      canvas.height = Math.floor(450 * dpr);
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `450px`;

      // Center the isometric grid by the diamond footprint, not the raw tile origin
      const originX = (container.clientWidth / 2) - (tileWidth / 2);
      const originY = (450 / 2) - ((gridSize * tileHeight) / 2);
      setOffset({ x: originX, y: originY });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update Turbine blade spinning angles
  useEffect(() => {
    let angle = 0;
    const animate = () => {
      angle = (angle + 0.05) % (Math.PI * 2);
      setTurbineAngle(angle);
      setAnimationFrameId(requestAnimationFrame(animate));
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Isometric projections conversion helpers
  const gridToScreen = (gx: number, gy: number) => {
    const sx = (gx - gy) * (tileWidth / 2) + offset.x;
    const sy = (gx + gy) * (tileHeight / 2) + offset.y;
    return { x: sx, y: sy };
  };

  const screenToGrid = (sx: number, sy: number) => {
    // Relative coordinates to the grid origin
    const rx = sx - offset.x - (tileWidth / 2);
    const ry = sy - offset.y;
    
    // Reverse formulas
    // rx = (gx - gy) * (tw/2)
    // ry = (gx + gy) * (th/2)
    const gx = Math.round((rx / (tileWidth / 2) + ry / (tileHeight / 2)) / 2);
    const gy = Math.round((ry / (tileHeight / 2) - rx / (tileWidth / 2)) / 2);
    
    return { x: gx, y: gy };
  };

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(canvasScale, 0, 0, canvasScale, 0, 0);

    // Clear Screen
    ctx.clearRect(0, 0, canvas.width / canvasScale, canvas.height / canvasScale);

    // Draw Grid Base (grass tiles and surroundings)
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const coords = gridToScreen(x, y);
        
        // Check if hovered
        const isHovered = hoveredTile?.x === x && hoveredTile?.y === y;
        
        // Draw tile shape
        ctx.beginPath();
        ctx.moveTo(coords.x + tileWidth / 2, coords.y);
        ctx.lineTo(coords.x + tileWidth, coords.y + tileHeight / 2);
        ctx.lineTo(coords.x + tileWidth / 2, coords.y + tileHeight);
        ctx.lineTo(coords.x, coords.y + tileHeight / 2);
        ctx.closePath();

        // Color styling based on hover & selection
        if (isHovered) {
          if (selectedBuildType) {
            // Placement Check
            const occupied = buildings.some(b => b.x === x && b.y === y);
            ctx.fillStyle = occupied ? "rgba(255, 82, 82, 0.4)" : "rgba(0, 230, 153, 0.4)";
          } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
          }
        } else {
          // Standard green grass patterns
          const tileHash = (x * 7 + y * 13) % 4;
          if (tileHash === 0) ctx.fillStyle = "hsl(142, 60%, 26%)";
          else if (tileHash === 1) ctx.fillStyle = "hsl(142, 58%, 28%)";
          else ctx.fillStyle = "hsl(142, 55%, 24%)";
        }

        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Left wall of the tile block for 3D depth
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y + tileHeight / 2);
        ctx.lineTo(coords.x + tileWidth / 2, coords.y + tileHeight);
        ctx.lineTo(coords.x + tileWidth / 2, coords.y + tileHeight + 6);
        ctx.lineTo(coords.x, coords.y + tileHeight / 2 + 6);
        ctx.closePath();
        ctx.fillStyle = "hsl(142, 60%, 18%)";
        ctx.fill();

        // Right wall of the tile block
        ctx.beginPath();
        ctx.moveTo(coords.x + tileWidth / 2, coords.y + tileHeight);
        ctx.lineTo(coords.x + tileWidth, coords.y + tileHeight / 2);
        ctx.lineTo(coords.x + tileWidth, coords.y + tileHeight / 2 + 6);
        ctx.lineTo(coords.x + tileWidth / 2, coords.y + tileHeight + 6);
        ctx.closePath();
        ctx.fillStyle = "hsl(142, 60%, 14%)";
        ctx.fill();
      }
    }

    // Draw Buildings on Grid (sorted by y then x for proper depth sorting / painter's algorithm)
    const sortedBuildings = [...buildings].sort((a, b) => (a.y + a.x) - (b.y + b.x));
    
    sortedBuildings.forEach((b) => {
      const coords = gridToScreen(b.x, b.y);
      const cx = coords.x + tileWidth / 2;
      const cy = coords.y + tileHeight / 2;
      
      const isSelected = selectedBuilding?.id === b.id;

      // Draw selection ring
      if (isSelected) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, 30, 15, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "var(--color-primary)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.save();
      
      if (b.type === "hq") {
        // Draw Eco HQ dome
        // Base structure
        ctx.fillStyle = "hsl(222, 35%, 85%)";
        ctx.beginPath();
        ctx.arc(cx, cy - 8, 18, 0, Math.PI, true);
        ctx.fill();

        // Green Solar roof panels
        ctx.fillStyle = "hsl(158, 82%, 40%)";
        ctx.beginPath();
        ctx.arc(cx, cy - 8, 14, 0, Math.PI, true);
        ctx.fill();

        // Dome top window
        ctx.fillStyle = "hsl(190, 95%, 60%)";
        ctx.beginPath();
        ctx.arc(cx, cy - 8, 6, 0, Math.PI, true);
        ctx.fill();

        // Support pillar lines
        ctx.strokeStyle = "hsl(222, 20%, 30%)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 18, cy - 8);
        ctx.lineTo(cx - 18, cy + 8);
        ctx.moveTo(cx + 18, cy - 8);
        ctx.lineTo(cx + 18, cy + 8);
        ctx.stroke();

        // Door
        ctx.fillStyle = "hsl(222, 47%, 20%)";
        ctx.fillRect(cx - 5, cy, 10, 8);

        // Eco Banner/Flag
        ctx.fillStyle = "var(--color-primary)";
        ctx.fillRect(cx, cy - 36, 12, 8);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 20);
        ctx.lineTo(cx, cy - 36);
        ctx.stroke();

        // Level text indicator overlay
        ctx.fillStyle = "#fff";
        ctx.font = "bold 9px var(--font-display)";
        ctx.textAlign = "center";
        ctx.fillText(`Lvl ${b.level}`, cx, cy + 18);

      } else if (b.type === "solar") {
        // Draw Tilted Solar Panel Arrays
        ctx.fillStyle = "hsl(205, 85%, 35%)"; // Dark Solar Blue
        ctx.strokeStyle = "hsl(205, 50%, 65%)";
        ctx.lineWidth = 1.5;
        
        // Panel 1 (left)
        ctx.beginPath();
        ctx.moveTo(cx - 16, cy - 14);
        ctx.lineTo(cx - 4, cy - 8);
        ctx.lineTo(cx - 12, cy + 2);
        ctx.lineTo(cx - 24, cy - 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Panel 2 (right)
        ctx.beginPath();
        ctx.moveTo(cx + 4, cy - 10);
        ctx.lineTo(cx + 16, cy - 4);
        ctx.lineTo(cx + 8, cy + 8);
        ctx.lineTo(cx - 4, cy + 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Supporting rods
        ctx.strokeStyle = "#718096";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy - 3);
        ctx.lineTo(cx - 10, cy + 4);
        ctx.moveTo(cx + 10, cy + 2);
        ctx.lineTo(cx + 10, cy + 8);
        ctx.stroke();

        // Draw multiple grids based on level
        if (b.level > 1) {
          ctx.fillStyle = "var(--color-secondary)";
          ctx.beginPath();
          ctx.arc(cx, cy - 20, 3 + b.level, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (b.type === "wind") {
        // Draw Spinning Wind Turbine
        // Stand Tower
        ctx.strokeStyle = "hsl(210, 20%, 75%)";
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx, cy + 4);
        ctx.lineTo(cx, cy - 32);
        ctx.stroke();

        // Rotor head
        ctx.fillStyle = "hsl(210, 10%, 90%)";
        ctx.beginPath();
        ctx.arc(cx, cy - 32, 4, 0, Math.PI * 2);
        ctx.fill();

        // Spin blades dynamically
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const angle = turbineAngle + (i * Math.PI * 2) / 3;
          const bladeLength = 16 + (b.level * 2); // Longer blades at higher levels
          const bx = cx + Math.cos(angle) * bladeLength;
          const by = cy - 32 + Math.sin(angle) * (bladeLength * 0.5); // Squash Y for isometric look
          
          ctx.beginPath();
          ctx.moveTo(cx, cy - 32);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }

      } else if (b.type === "forest") {
        // Draw Forest / Trees
        const drawTree = (tx: number, ty: number, size: number) => {
          // Trunk
          ctx.fillStyle = "hsl(25, 40%, 30%)";
          ctx.fillRect(tx - 2, ty - 8, 4, 10);
          
          // Foliage
          ctx.fillStyle = "hsl(140, 75%, 35%)";
          ctx.beginPath();
          ctx.arc(tx, ty - 12, size, 0, Math.PI * 2);
          ctx.fill();

          // Highlight
          ctx.fillStyle = "hsl(140, 80%, 42%)";
          ctx.beginPath();
          ctx.arc(tx - 2, ty - 14, size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        };

        // Render multiple trees based on level
        drawTree(cx - 8, cy - 4, 10);
        if (b.level >= 2) drawTree(cx + 8, cy + 2, 8);
        if (b.level >= 3) drawTree(cx, cy - 12, 9);
        
      } else if (b.type === "ev") {
        // Draw EV Charging Station
        // Charger Body
        ctx.fillStyle = "hsl(215, 30%, 25%)";
        ctx.fillRect(cx - 8, cy - 18, 16, 22);
        
        ctx.strokeStyle = "hsl(215, 30%, 45%)";
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 8, cy - 18, 16, 22);

        // Screen/Light
        ctx.fillStyle = "var(--color-primary)";
        ctx.fillRect(cx - 5, cy - 15, 10, 4);

        // Electric cable wire
        ctx.strokeStyle = "var(--color-primary)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + 6, cy - 6);
        ctx.bezierCurveTo(cx + 12, cy - 4, cx + 12, cy + 4, cx + 5, cy + 6);
        ctx.stroke();

        // Level text indicator
        ctx.fillStyle = "hsl(215, 20%, 75%)";
        ctx.font = "8px var(--font-body)";
        ctx.textAlign = "center";
        ctx.fillText(`Lvl ${b.level}`, cx, cy + 10);
      }

      ctx.restore();
    });

  }, [buildings, hoveredTile, offset, selectedBuildType, selectedBuilding, turbineAngle]);

  // Handle canvas mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridPos = screenToGrid(x, y);

    // Bound limits
    if (gridPos.x >= 0 && gridPos.x < gridSize && gridPos.y >= 0 && gridPos.y < gridSize) {
      setHoveredTile(gridPos);
    } else {
      setHoveredTile(null);
    }
  };

  // Handle canvas click
  const handleCanvasClick = async (_e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hoveredTile) return;
    setErrorMessage(null);
    setInfoMessage(null);

    const { x, y } = hoveredTile;

    // Check if clicked tile is occupied
    const existing = buildings.find(b => b.x === x && b.y === y);

    if (selectedBuildType) {
      // PLACING MODE
      if (existing) {
        setErrorMessage("This grid cell is already occupied! Select a different spot.");
        return;
      }
      try {
        await placeBuilding(selectedBuildType, x, y);
        setSelectedBuildType(null);
        setInfoMessage(`Successfully built a new ${selectedBuildType.toUpperCase()}!`);
      } catch (err: any) {
        setErrorMessage(err.message || "Placement failed.");
      }
    } else {
      // SELECTION MODE
      if (existing) {
        setSelectedBuilding(existing);
      } else {
        setSelectedBuilding(null);
      }
    }
  };

  const handleUpgrade = async () => {
    if (!selectedBuilding) return;
    setErrorMessage(null);
    setInfoMessage(null);
    
    try {
      await upgradeBuilding(selectedBuilding.id);
      
      // Update selected reference to show new stats
      const updated = buildings.find(b => b.id === selectedBuilding.id);
      if (updated) {
        setSelectedBuilding({ ...updated, level: updated.level + 1 });
      }
      setInfoMessage("Upgrade complete!");
    } catch (err: any) {
      setErrorMessage(err.message || "Upgrade failed.");
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 320px)", gap: "20px", alignItems: "start" }} className="city-layout">
      {/* City view panel */}
      <div className="glass-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h3 style={{ fontSize: "1.4rem" }}>Interactive Eco-City Grid</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "720px", lineHeight: 1.55 }}>
              {selectedBuildType
                ? `Placement mode is active. Choose a clear tile on the grid to place your ${selectedBuildType.toUpperCase()} structure.`
                : "Build, inspect, and upgrade your eco structures. Click a structure to open its details, or pick a new one from the shop."}
            </p>
          </div>
          <div style={{
            background: "var(--color-primary-glow)",
            border: "1px solid var(--color-primary)",
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.9rem",
            fontWeight: "600"
          }}>
            Carbon Balance: {ecoPoints} EP
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px"
        }}>
          <div style={{ background: "hsla(222, 47%, 7%, 0.45)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>How to Play</div>
            <div style={{ fontSize: "0.85rem", marginTop: "4px", lineHeight: 1.5 }}>Select a shop item, place it on the grid, then inspect or upgrade it later.</div>
          </div>
          <div style={{ background: "hsla(222, 47%, 7%, 0.45)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Selected Tool</div>
            <div style={{ fontSize: "0.85rem", marginTop: "4px", lineHeight: 1.5 }}>{selectedBuildType ? selectedBuildType.toUpperCase() : "None selected"}</div>
          </div>
          <div style={{ background: "hsla(222, 47%, 7%, 0.45)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tip</div>
            <div style={{ fontSize: "0.85rem", marginTop: "4px", lineHeight: 1.5 }}>Try trees early. They are the cheapest and make the city feel alive fast.</div>
          </div>
        </div>

        {/* Message Panels */}
        {errorMessage && (
          <div style={{
            background: "rgba(255, 82, 82, 0.15)",
            border: "1px solid var(--color-danger)",
            color: "var(--color-danger)",
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.85rem"
          }}>
            {errorMessage}
          </div>
        )}
        {infoMessage && (
          <div style={{
            background: "rgba(0, 230, 153, 0.15)",
            border: "1px solid var(--color-primary)",
            color: "var(--color-primary)",
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.85rem"
          }}>
            {infoMessage}
          </div>
        )}

        <div ref={containerRef} style={{ width: "100%", height: "450px", display: "flex", justifyContent: "center", alignItems: "center", background: "radial-gradient(circle at 50% 30%, rgba(0,230,153,0.08), transparent 35%), rgba(9, 13, 24, 0.4)", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)", position: "relative", overflow: "hidden", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)" }}>
          <canvas 
            ref={canvasRef} 
            onMouseMove={handleMouseMove}
            onClick={handleCanvasClick}
            style={{ display: "block", cursor: selectedBuildType ? "crosshair" : "default", margin: "0 auto" }}
          />
        </div>
      </div>

      {/* Control panel & Shop */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: 0, alignSelf: "start" }}>
        
        {/* Inspector Panel */}
        {selectedBuilding ? (
          <div className="glass-card animate-fade-in" style={{ borderColor: "var(--color-primary)", background: "linear-gradient(180deg, rgba(12,18,36,0.96), rgba(10,15,28,0.92))" }}>
            <h4 style={{ fontSize: "1.1rem", textTransform: "capitalize", marginBottom: "8px", display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: "var(--color-primary)" }}></span>
              {selectedBuilding.type} (Level {selectedBuilding.level})
            </h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "16px", lineHeight: "1.55" }}>
              {selectedBuilding.type === "hq" && "Eco HQ - Controls your carbon offset index. Upgrades level up your entire eco-city."}
              {selectedBuilding.type === "solar" && "Solar arrays harvest clean electricity and reduce scope 2 home grid emissions."}
              {selectedBuilding.type === "wind" && "Wind turbines extract green kinetic energy, spinning continuously."}
              {selectedBuilding.type === "forest" && "Afforestation grove absorbing ambient CO2. Levels add trees."}
              {selectedBuilding.type === "ev" && "EV chargers drop emissions by replacing petrol transport trips."}
            </p>

            {selectedBuilding.type !== "hq" ? (
              <button 
                className="btn btn-primary" 
                onClick={handleUpgrade}
                style={{ width: "100%", display: "flex", gap: "8px", justifyContent: "center" }}
              >
                <ArrowUp size={16} /> Upgrade (Cost: {selectedBuilding.level * 100} EP)
              </button>
            ) : (
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>
                Main Eco-HQ levels up automatically based on your overall calculator reduction level.
              </p>
            )}
            
            <button 
              className="btn btn-secondary" 
              onClick={() => setSelectedBuilding(null)}
              style={{ width: "100%", marginTop: "8px" }}
            >
              Close Inspector
            </button>
          </div>
        ) : (
          <div className="glass-card">
            <h4 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Select Structure</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: "1.4" }}>
              Click any placed building on the 2D map to inspect stats and upgrade its capabilities.
            </p>
          </div>
        )}

        {/* Shop Panel */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--glass-border)", paddingBottom: "8px" }}>
            <h4 style={{ fontSize: "1.15rem" }}>Green Shop</h4>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Tap to preview placement</span>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, justifyContent: "space-between", minHeight: "320px" }}>
            {shopItems.map((item) => (
              <div 
                key={item.type} 
                onClick={() => {
                  if (ecoPoints >= item.cost) {
                    setSelectedBuildType(item.type);
                    setSelectedBuilding(null);
                    setErrorMessage(null);
                    setInfoMessage(`Placement mode: Click on the grid to position your ${item.name}.`);
                  } else {
                    setErrorMessage(`Cannot afford ${item.name}! Complete tasks to earn more Eco-Points.`);
                  }
                }}
                className={`interactive`}
                style={{
                  background: selectedBuildType === item.type ? "rgba(0, 230, 153, 0.12)" : "hsla(222, 47%, 7%, 0.4)",
                  border: selectedBuildType === item.type ? "1px solid var(--color-primary)" : "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "12px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: selectedBuildType === item.type ? "var(--color-primary)" : "var(--color-secondary)"
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.93rem", fontWeight: "700" }}>{item.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.35 }}>{item.desc}</div>
                  </div>
                </div>
                <div style={{
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  color: ecoPoints >= item.cost ? "var(--color-primary)" : "var(--color-danger)"
                }}>
                  {item.cost} EP
                </div>
              </div>
            ))}
          </div>

          {selectedBuildType && (
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setSelectedBuildType(null);
                setInfoMessage(null);
              }}
              style={{ width: "100%" }}
            >
              Cancel Placement
            </button>
          )}

        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .city-layout {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 900px) {
          .city-layout > div:last-child {
            align-self: stretch !important;
          }

          .city-layout > div:last-child > .glass-card:last-child > div:nth-child(2) {
            min-height: 0 !important;
            justify-content: flex-start !important;
          }
        }
      `}</style>
    </div>
  );
};
