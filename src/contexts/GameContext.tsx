import React, { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "./UserContext";
import type { UserProfile } from "./UserContext";
import { db, isFirebaseConfigured } from "../services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface Building {
  id: string;
  type: "hq" | "solar" | "wind" | "forest" | "ev";
  x: number; // grid coordinates (0 to 7)
  y: number; // grid coordinates (0 to 7)
  level: number;
}

export interface EcoTask {
  id: string;
  title: string;
  category: "energy" | "transport" | "waste" | "food";
  co2Reduction: number; // kg CO2 saved
  pointsReward: number; // renamed from coinReward
  completed: boolean;
  proofImage?: string;  // user attached image path or object URL
}

interface GameContextType {
  buildings: Building[];
  ecoPoints: number; // renamed from coins
  dailyTasks: EcoTask[];
  streakCount: number; // daily check-in streak
  lastCheckIn: string | null; // last check-in date string (e.g. "Thu Jun 18 2026")
  loading: boolean;
  placeBuilding: (type: Building["type"], x: number, y: number) => Promise<void>;
  upgradeBuilding: (buildingId: string) => Promise<void>;
  logEcoAction: (taskId: string, proofImage: string) => Promise<void>;
  resetDailyTasks: () => Promise<void>;
  checkInStreak: () => Promise<void>;
  syncGameData: (newBuildings: Building[], newPoints: number, newStreak?: number, newLastCheckIn?: string | null) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
};

// Initial list of daily sustainable actions
const INITIAL_TASKS: EcoTask[] = [
  { id: "e1", title: "Turn off AC and use ceiling fan for 4 hours", category: "energy", co2Reduction: 2.1, pointsReward: 15, completed: false },
  { id: "e2", title: "Unplug standby home electronics overnight", category: "energy", co2Reduction: 0.8, pointsReward: 10, completed: false },
  { id: "t1", title: "Use public transport (bus/metro) for daily commute", category: "transport", co2Reduction: 4.5, pointsReward: 30, completed: false },
  { id: "t2", title: "Walk or cycle for trips under 2 km", category: "transport", co2Reduction: 1.2, pointsReward: 20, completed: false },
  { id: "w1", title: "Compost household kitchen organic waste", category: "waste", co2Reduction: 0.9, pointsReward: 12, completed: false },
  { id: "w2", title: "Avoid single-use plastics & bring reusable bags", category: "waste", co2Reduction: 0.5, pointsReward: 8, completed: false },
  { id: "f1", title: "Eat a fully vegetarian / plant-based meal today", category: "food", co2Reduction: 1.8, pointsReward: 15, completed: false }
];

type StoredGameState = {
  buildings?: Array<{
    id?: string;
    type?: string;
    x?: number;
    y?: number;
    level?: number;
  }>;
  ecoPoints?: number;
  streakCount?: number;
  lastCheckIn?: string | null;
  dailyTasks?: EcoTask[];
  lastUpdated?: string;
};

const isBuildingType = (value: string): value is Building["type"] => {
  return ["hq", "solar", "wind", "forest", "ev"].includes(value);
};

const normalizeBuildings = (buildings: StoredGameState["buildings"]): Building[] => {
  const fallback: Building[] = [{ id: "hq_default", type: "hq", x: 3, y: 3, level: 1 }];

  if (!buildings?.length) {
    return fallback;
  }

  const parsed = buildings
    .map((building) => {
      if (!building?.id || !building?.type || !isBuildingType(building.type)) {
        return null;
      }

      return {
        id: building.id,
        type: building.type,
        x: Number(building.x),
        y: Number(building.y),
        level: Number(building.level) || 1
      };
    })
    .filter((building): building is Building => Boolean(building));

  return parsed.length ? parsed : fallback;
};

const normalizeTasks = (tasks: EcoTask[] | undefined): EcoTask[] => {
  if (!tasks?.length) {
    return INITIAL_TASKS;
  }

  return INITIAL_TASKS.map((task) => {
    const saved = tasks.find((entry) => entry.id === task.id);
    return saved
      ? {
          ...task,
          completed: Boolean(saved.completed),
          proofImage: saved.proofImage
        }
      : task;
  });
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useUser();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [ecoPoints, setEcoPoints] = useState<number>(0);
  const [dailyTasks, setDailyTasks] = useState<EcoTask[]>(INITIAL_TASKS);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const gameDocRef = user && db ? doc(db, "users", user.uid, "game", "state") : null;

  // Sync game data to backend (Firestore only)
  const syncGameData = async (
    newBuildings: Building[],
    newPoints: number,
    newStreak: number = streakCount,
    newLastCheckIn: string | null = lastCheckIn
  ) => {
    if (!user || !db) return;

    try {
      await setDoc(
        doc(db, "users", user.uid, "game", "state"),
        {
          buildings: newBuildings,
          ecoPoints: newPoints,
          streakCount: newStreak,
          lastCheckIn: newLastCheckIn,
          dailyTasks,
          lastUpdated: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Error saving game data to Firestore:", err);
    }
  };

  // Load game data upon login
  useEffect(() => {
    const loadGameData = async () => {
      if (!user) {
        setBuildings([]);
        setEcoPoints(0);
        setStreakCount(0);
        setLastCheckIn(null);
        setDailyTasks(INITIAL_TASKS);
        setLoading(false);
        return;
      }

      setLoading(true);
      if (!isFirebaseConfigured || !gameDocRef) {
        setBuildings([{ id: "hq_default", type: "hq", x: 3, y: 3, level: 1 }]);
        setEcoPoints(0);
        setStreakCount(0);
        setLastCheckIn(null);
        setDailyTasks(INITIAL_TASKS);
        setLoading(false);
        return;
      }

      try {
        const gameSnap = await getDoc(gameDocRef);
        const data = (gameSnap.exists() ? (gameSnap.data() as StoredGameState) : {}) as StoredGameState;

        const loadedBuildings = normalizeBuildings(data.buildings);
        const loadedPoints = Number(data.ecoPoints);
        const loadedStreak = Number(data.streakCount) || 0;
        const loadedLastCheckIn = data.lastCheckIn ?? null;
        const loadedTasks = normalizeTasks(data.dailyTasks);

        setBuildings(loadedBuildings);
        setEcoPoints(Number.isNaN(loadedPoints) ? 0 : loadedPoints);
        setStreakCount(loadedStreak);
        setLastCheckIn(loadedLastCheckIn);
        setDailyTasks(loadedTasks);

        if (!gameSnap.exists()) {
          await setDoc(gameDocRef, {
            buildings: loadedBuildings,
            ecoPoints: Number.isNaN(loadedPoints) ? 0 : loadedPoints,
            streakCount: loadedStreak,
            lastCheckIn: loadedLastCheckIn,
            dailyTasks: loadedTasks,
            lastUpdated: new Date().toISOString()
          }, { merge: true });
        }
      } catch (err) {
        console.error("Error fetching game data from Firestore:", err);
        setBuildings([{ id: "hq_default", type: "hq", x: 3, y: 3, level: 1 }]);
        setEcoPoints(0);
        setStreakCount(0);
        setLastCheckIn(null);
        setDailyTasks(INITIAL_TASKS);
      } finally {
        setLoading(false);
      }
    };

    loadGameData();
  }, [gameDocRef, user]);

  // Place a new eco-structure
  const placeBuilding = async (type: Building["type"], x: number, y: number) => {
    // Determine building cost
    let cost = 100;
    if (type === "solar") cost = 80;
    if (type === "wind") cost = 150;
    if (type === "forest") cost = 40;
    if (type === "ev") cost = 120;

    if (ecoPoints < cost) {
      throw new Error(`Insufficient Eco-Points! You need ${cost} EP.`);
    }

    // Check if tile is occupied
    const occupied = buildings.some(b => b.x === x && b.y === y);
    if (occupied) {
      throw new Error("This grid coordinate is already occupied!");
    }

    const newBuilding: Building = {
      id: `${type}_${Date.now()}`,
      type,
      x,
      y,
      level: 1
    };

    const updatedBuildings = [...buildings, newBuilding];
    const updatedPoints = ecoPoints - cost;

    setBuildings(updatedBuildings);
    setEcoPoints(updatedPoints);
    await syncGameData(updatedBuildings, updatedPoints);
  };

  // Upgrade building
  const upgradeBuilding = async (buildingId: string) => {
    const targetBuilding = buildings.find(b => b.id === buildingId);
    if (!targetBuilding) return;

    // Upgrading cost doubles per level
    const cost = targetBuilding.level * 100;
    if (ecoPoints < cost) {
      throw new Error(`Insufficient Eco-Points! Upgrading needs ${cost} EP.`);
    }

    const updatedBuildings = buildings.map(b => {
      if (b.id === buildingId) {
        return { ...b, level: b.level + 1 };
      }
      return b;
    });
    const updatedPoints = ecoPoints - cost;

    setBuildings(updatedBuildings);
    setEcoPoints(updatedPoints);
    await syncGameData(updatedBuildings, updatedPoints);
  };

  // Log sustainable action with proof
  const logEcoAction = async (taskId: string, proofImage: string) => {
    const taskIndex = dailyTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1 || dailyTasks[taskIndex].completed) return;

    const task = dailyTasks[taskIndex];
    const updatedTasks = dailyTasks.map(t => {
      if (t.id === taskId) return { ...t, completed: true, proofImage };
      return t;
    });

    const updatedPoints = ecoPoints + task.pointsReward;

    setDailyTasks(updatedTasks);
    setEcoPoints(updatedPoints);

    // Sync with User Profile Context to offset carbon emissions score
    const userId = user?.uid;
    if (userProfile && userId) {
      // Offset carbon footprint score (kg to tonnes conversion)
      const co2InTonnes = task.co2Reduction / 1000;
      const newScore = Math.max(0.1, parseFloat((userProfile.carbonScore - co2InTonnes).toFixed(4)));
      const newExp = userProfile.points + task.pointsReward;
      
      const updatedProfile: UserProfile = {
        ...userProfile,
        carbonScore: newScore,
        points: newExp
      };
      
      if (db) {
        try {
          await setDoc(doc(db, "users", userId), updatedProfile, { merge: true });
        } catch (err) {
          console.error("Error updating points in Firestore:", err);
        }
      }
      
      // We trigger local UI refresh by saving
      window.dispatchEvent(new Event("profile-updated"));
    }

    await syncGameData(buildings, updatedPoints);
    if (gameDocRef) {
      await setDoc(
        gameDocRef,
        {
          dailyTasks: updatedTasks,
          ecoPoints: updatedPoints,
          lastUpdated: new Date().toISOString()
        },
        { merge: true }
      );
    }
  };

  // Streak daily check-in
  const checkInStreak = async () => {
    if (!user) return;
    
    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastCheckIn === todayStr) {
      throw new Error("You have already checked in today! Come back tomorrow.");
    }

    let newStreak = 1;
    if (lastCheckIn === yesterdayStr) {
      newStreak = streakCount + 1;
    }

    const updatedPoints = ecoPoints + 10;
    
    setStreakCount(newStreak);
    setLastCheckIn(todayStr);
    setEcoPoints(updatedPoints);

    // Reward points in userProfile total points (XP)
    const userId = user.uid;
    if (userProfile && userId) {
      const newExp = userProfile.points + 10;
      const updatedProfile: UserProfile = {
        ...userProfile,
        points: newExp
      };
      
      if (db) {
        try {
          await setDoc(doc(db, "users", userId), updatedProfile, { merge: true });
        } catch (err) {
          console.error("Error updating points in Firestore:", err);
        }
      }
      window.dispatchEvent(new Event("profile-updated"));
    }

    await syncGameData(buildings, updatedPoints, newStreak, todayStr);
  };

  // Helper to calculate total cost of a building
  const getBuildingTotalCost = (building: Building): number => {
    let baseCost = 0;
    if (building.type === "solar") baseCost = 80;
    else if (building.type === "wind") baseCost = 150;
    else if (building.type === "forest") baseCost = 40;
    else if (building.type === "ev") baseCost = 120;
    
    let upgradeCost = 0;
    for (let l = 1; l < building.level; l++) {
      upgradeCost += l * 100;
    }
    return baseCost + upgradeCost;
  };

  // Reset daily tasks, deducting earned points and reclaiming buildings if needed
  const resetDailyTasks = async () => {
    // 1. Calculate how many points were earned today from completed tasks
    const pointsToDeduct = dailyTasks
      .filter(t => t.completed)
      .reduce((sum, t) => sum + t.pointsReward, 0);

    if (pointsToDeduct === 0) {
      // Nothing completed today, just clear state
      setDailyTasks(INITIAL_TASKS.map(t => ({ ...t, completed: false, proofImage: undefined })));
      return;
    }

    // 2. Compute deducted balance
    let tempPoints = ecoPoints - pointsToDeduct;
    const tempBuildings = [...buildings];

    // 3. Reclaim buildings from newest to oldest if there is a points deficit
    while (tempPoints < 0 && tempBuildings.length > 0) {
      const lastBuildingIndex = tempBuildings.length - 1;
      const lastBuilding = tempBuildings[lastBuildingIndex];
      
      if (lastBuilding.id === "hq_default") {
        // Can never reclaim the Eco-HQ
        break;
      }
      
      const costToReclaim = getBuildingTotalCost(lastBuilding);
      tempPoints += costToReclaim;
      tempBuildings.pop(); // Remove building
    }

    const finalPoints = Math.max(0, tempPoints);

    // 4. Update state variables
    setBuildings(tempBuildings);
    setEcoPoints(finalPoints);
    setDailyTasks(INITIAL_TASKS.map(t => ({ ...t, completed: false, proofImage: undefined })));

    // 5. Update userProfile experience points (total points) and restore offset
    const userId = user?.uid;
    if (userProfile && userId) {
      const newExp = Math.max(0, userProfile.points - pointsToDeduct);
      
      // Restore carbon offset
      const co2ToRestore = dailyTasks
        .filter(t => t.completed)
        .reduce((sum, t) => sum + t.co2Reduction, 0);
      const newScore = parseFloat((userProfile.carbonScore + co2ToRestore / 1000).toFixed(4));

      const updatedProfile: UserProfile = {
        ...userProfile,
        points: newExp,
        carbonScore: newScore
      };
      
      if (db) {
        try {
          await setDoc(doc(db, "users", userId), updatedProfile, { merge: true });
        } catch (err) {
          console.error("Error resetting points in Firestore:", err);
        }
      }
      window.dispatchEvent(new Event("profile-updated"));
    }

    // 6. Sync everything to database
    await syncGameData(tempBuildings, finalPoints);
  };

  return (
    <GameContext.Provider value={{
      buildings,
      ecoPoints,
      dailyTasks,
      streakCount,
      lastCheckIn,
      loading,
      placeBuilding,
      upgradeBuilding,
      logEcoAction,
      resetDailyTasks,
      checkInStreak,
      syncGameData
    }}>
      {children}
    </GameContext.Provider>
  );
};
