import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  auth, 
  db, 
  isFirebaseConfigured, 
  googleProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification
} from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  state: string;
  city: string;
  photoUrl?: string; // optional profile picture URL
  carbonScore: number;       // Annual footprint in tonnes CO2
  baselineScore: number;     // Starting calculator score
  points: number;            // Current experience points / coin balance
  completedTasks: number;    // Lifetime checklist tasks completed
  isCalculated: boolean;     // Has completed onboarding calculator
  calculatorData: {
    transport: {
      type: string;
      mileage: number; // km per week
      fuelType: string;
    };
    energy: {
      bill: number;    // INR per month
      lpgUsed: boolean;
    };
    food: {
      diet: string;
    };
  } | null;
}

interface UserContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  firebaseError: boolean; // Flag to show config is missing
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;
  updateCalculatorData: (stateName: string, cityName: string, data: any, carbonScore: number) => Promise<void>;
  refreshAuthStatus: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [firebaseError] = useState<boolean>(!isFirebaseConfigured);

  const createDefaultProfile = (firebaseUser: FirebaseUser, displayName?: string | null): UserProfile => ({
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: displayName ?? firebaseUser.displayName ?? firebaseUser.email?.split("@")[0] ?? "Eco User",
    state: "",
    city: "",
    photoUrl: firebaseUser.photoURL || "",
    carbonScore: 0,
    baselineScore: 0,
    points: 0,
    completedTasks: 0,
    isCalculated: false,
    calculatorData: null
  });

  const normalizeProfile = (profile: UserProfile): UserProfile => ({
    ...profile,
    points: Number(profile.points) || 0,
    completedTasks: Number(profile.completedTasks) || 0,
    carbonScore: Number(profile.carbonScore) || 0,
    baselineScore: Number(profile.baselineScore) || 0,
    photoUrl: profile.photoUrl || ""
  });

  const saveProfile = async (profile: UserProfile) => {
    if (!db) {
      throw new Error("Firestore is not initialized.");
    }

    const normalized = normalizeProfile(profile);
    setUserProfile(normalized);
    await setDoc(doc(db, "users", normalized.uid), normalized, { merge: true });
  };

  const fetchOrCreateUserProfile = async (firebaseUser: FirebaseUser) => {
    if (!db) {
      throw new Error("Firestore is not initialized.");
    }

    const userDocRef = doc(db, "users", firebaseUser.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const existingProfile = normalizeProfile(docSnap.data() as UserProfile);
      setUserProfile(existingProfile);
      return existingProfile;
    }

    const defaultProfile = createDefaultProfile(firebaseUser);
    await setDoc(userDocRef, defaultProfile, { merge: true });
    setUserProfile(defaultProfile);
    return defaultProfile;
  };

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.emailVerified) {
          try {
            await fetchOrCreateUserProfile(currentUser);
          } catch (err) {
            console.error("Error loading user profile:", err);
            setError("Failed to load your profile from Firestore.");
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to real-time changes on the logged-in user's profile document
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !user) {
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const profileData = normalizeProfile(snapshot.data() as UserProfile);
          setUserProfile(profileData);
          // Dispatch window event for other non-context listeners (e.g. CarbonStats)
          window.dispatchEvent(new Event("profile-updated"));
        }
      },
      (err) => {
        console.error("Error listening to user profile changes in UserProvider:", err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);

    try {
      if (!auth) throw new Error("Firebase Auth is not initialized.");
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const curUser = userCredential.user;
      
      if (!curUser.emailVerified) {
        throw new Error("unverified-email");
      }
      
      await fetchOrCreateUserProfile(curUser);
    } catch (err: any) {
      console.error(err);
      if (err.message === "unverified-email") {
        throw new Error("Your email address is not verified. Please check your inbox for the verification link.");
      }
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        throw new Error("Invalid email or password. Please try again.");
      }
      throw new Error(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setError(null);
    setLoading(true);

    try {
      if (!auth) throw new Error("Firebase Auth is not initialized.");
      if (!db) throw new Error("Firestore is not initialized.");
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const curUser = userCredential.user;
      
      // Send verification link
      await sendEmailVerification(curUser);
      
      // Initialize profile
      const newProfile = createDefaultProfile(curUser, name);
      await setDoc(doc(db, "users", curUser.uid), newProfile, { merge: true });
      
      // Inform client to show verification screen
      throw new Error("verification-sent");
    } catch (err: any) {
      console.error(err);
      if (err.message === "verification-sent") {
        throw new Error("A verification link has been sent to your email. Please check your inbox and verify your email to log in.");
      }
      if (err.code === "auth/email-already-in-use") {
        throw new Error("An account already exists with this email address.");
      }
      throw new Error(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);

    try {
      if (!auth) throw new Error("Firebase Auth is not initialized.");
      const userCredential = await signInWithPopup(auth, googleProvider);
      const curUser = userCredential.user;
      
      // Google Auth accounts are auto-verified
      await fetchOrCreateUserProfile(curUser);
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || "Google Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    setLoading(true);

    try {
      if (!auth) throw new Error("Firebase Auth is not initialized.");
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile fields (name, city, state, photo)
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updatedProfile: UserProfile = { ...userProfile, ...updates };
    await saveProfile(updatedProfile);
    // Trigger UI refresh
    window.dispatchEvent(new Event("profile-updated"));
  };

  const updateCalculatorData = async (stateName: string, cityName: string, data: any, carbonScore: number) => {
    if (!userProfile) return;
    
    const updatedProfile: UserProfile = {
      ...userProfile,
      state: stateName,
      city: cityName,
      calculatorData: data,
      carbonScore: carbonScore,
      baselineScore: carbonScore,
      isCalculated: true
    };
    
    await saveProfile(updatedProfile);
  };

  const refreshAuthStatus = async () => {
    if (!auth?.currentUser) return;
    
    setLoading(true);
    try {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      setUser(updatedUser);
      
      if (updatedUser.emailVerified) {
        await fetchOrCreateUserProfile(updatedUser);
      }
    } catch (err) {
      console.error("Error refreshing auth status:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      userProfile,
      loading,
      error,
      firebaseError,
      loginWithEmail,
      signUpWithEmail,
      loginWithGoogle,
      logoutUser,
      updateCalculatorData,
      refreshAuthStatus,
      updateProfile
    }}>
      {children}
    </UserContext.Provider>
  );
};
