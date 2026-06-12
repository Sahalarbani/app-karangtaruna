import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useFirestoreActions } from "../hooks/useFirestore";
import { useToast } from "../components/Toast";
import { LogOut, User, Phone, Mail, Moon, Sun, Monitor } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export default function Profile() {
  const { user, signInWithGoogle, signOut, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const showToast = useToast();
  const { updateItem } = useFirestoreActions("users");

  const [kontak, setKontak] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      getDoc(doc(db, "users", user.uid))
        .then((snap) => {
          if (snap.exists() && snap.data().kontak) {
            setKontak(snap.data().kontak);
          }
        })
        .catch(() => {
          showToast("Profil gagal dimuat. Coba lagi nanti.", "info");
        });
    }
  }, [user, showToast]);

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      await updateItem(user.uid, { kontak });
      showToast("Profil berhasil diperbarui", "success");
    } catch (error) {
      showToast(error.message?.includes("permission") ? "Akses ditolak." : "Gagal memperbarui profil, periksa koneksi Anda.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      showToast("Berhasil login", "success");
    } catch (error) {
      showToast(error.message || "Gagal login dengan Google", "error");
    }
  };

  if (!user) {
    return (
      <div className="page-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
          <User size={40} color="var(--primary)" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: 0 }}>Masuk ke Akun</h2>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32 }}>
          Login menggunakan akun Google untuk melakukan peminjaman barang dan melihat riwayat Anda.
        </p>
        <button 
          className="btn btn-block" 
          onClick={handleLogin}
          style={{ padding: "16px 20px", display: "flex", gap: 12, background: "var(--text-primary)", color: "var(--bg)", borderRadius: "var(--radius-xl)" }}
        >
          <Mail size={20} />
          Lanjutkan dengan Google
        </button>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
        <h1>Profil Saya</h1>
      </div>

      <div style={{ padding: 16 }}>
        <div className="card fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 24, marginBottom: 16 }}>
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
            alt="Profil" 
            style={{ width: 88, height: 88, borderRadius: 44, marginBottom: 16, border: "2px solid var(--border-light)" }}
          />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{user.displayName}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>
            <Mail size={16} /> {user.email}
          </div>

          <span className={`badge badge-${isAdmin ? 'warning' : 'info'}`} style={{ padding: "6px 14px", fontSize: 12 }}>
            {isAdmin ? 'Administrator' : 'Warga / Peminjam'}
          </span>
        </div>

        {/* TEMA IOS STYLE SEGMENTED CONTROL */}
        <div className="card fade-in" style={{ animationDelay: "0.05s", marginBottom: 16, padding: "16px 20px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Tampilan</h3>
          <div style={{ display: "flex", background: "var(--bg)", padding: 4, borderRadius: 12 }}>
            {[
              { id: "light", icon: Sun, label: "Terang" },
              { id: "dark", icon: Moon, label: "Gelap" },
              { id: "system", icon: Monitor, label: "Sistem" }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  background: theme === t.id ? "var(--bg-card)" : "transparent",
                  color: theme === t.id ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: theme === t.id ? "var(--shadow-sm)" : "none",
                  fontWeight: theme === t.id ? 600 : 500, fontSize: 12
                }}
              >
                <t.icon size={18} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card fade-in" style={{ animationDelay: "0.1s", marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Kontak Peminjaman</h3>
          
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Phone size={14} /> Nomor WhatsApp
            </label>
            <input
              type="tel"
              className="form-input"
              placeholder="Contoh: 08123456789"
              value={kontak}
              onChange={(e) => setKontak(e.target.value)}
            />
          </div>
          
          <button 
            className="btn btn-secondary btn-block"
            onClick={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? "Menyimpan..." : "Simpan Kontak"}
          </button>
        </div>

        <button 
          className="btn btn-block fade-in" 
          onClick={async () => {
            if (window.confirm("Yakin ingin keluar?")) {
              try {
                await signOut();
              } catch (error) {
                showToast(error.message || "Gagal keluar dari akun.", "error");
              }
            }
          }}
          style={{ animationDelay: "0.2s", background: "rgba(255, 59, 48, 0.1)", color: "var(--danger)", borderRadius: "var(--radius-xl)" }}
        >
          <LogOut size={18} />
          Keluar dari Akun
        </button>
      </div>
    </div>
  );
}
