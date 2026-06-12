import { createContext, useContext, useEffect, useState } from "react";
import { auth, db, googleProvider } from "../config/firebase";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut 
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' | 'user'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUserRole(userSnap.data().role || "user");
          } else {
            await setDoc(userRef, {
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: "user",
              createdAt: serverTimestamp(),
              kontak: "",
            });
            setUserRole("user");
          }
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error loading user profile", error);
        setUser(currentUser || null);
        setUserRole("user");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      if (error.code === "auth/popup-closed-by-user") {
        throw new Error("Login dibatalkan oleh pengguna.", { cause: error });
      }
      if (error.code === "auth/network-request-failed") {
        throw new Error("Gagal login: Periksa koneksi internet Anda.", { cause: error });
      }
      throw new Error("Terjadi kesalahan saat login.", { cause: error });
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, isAdmin: userRole === 'admin', loading, signInWithGoogle, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
