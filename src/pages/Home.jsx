import { useNavigate } from "react-router-dom";
import { useCollection } from "../hooks/useFirestore";
import {
  Package, ClipboardList, PlusCircle, Settings, Users, Calendar,
  Megaphone, FileText, ArrowRight, TrendingUp, Box, Clock
} from "lucide-react";

const menuItems = [
  { icon: Package, label: "Katalog Barang", color: "var(--primary)", bg: "rgba(255, 59, 48, 0.1)", to: "/katalog" },
  { icon: PlusCircle, label: "Pinjam Barang", color: "var(--accent)", bg: "rgba(175, 82, 222, 0.1)", to: "/pinjam" },
  { icon: ClipboardList, label: "Riwayat", color: "var(--secondary)", bg: "rgba(255, 159, 10, 0.1)", to: "/riwayat" },
  { icon: Settings, label: "Kelola", color: "#EF4444", bg: "rgba(255, 59, 48, 0.1)", to: "/admin" },
  { icon: Users, label: "Anggota", color: "#EC4899", bg: "#FDF2F8", to: "#" },
  { icon: Calendar, label: "Jadwal Acara", color: "#F97316", bg: "#FFF7ED", to: "/jadwal" },
  { icon: Megaphone, label: "Pengumuman", color: "#A855F7", bg: "#FAF5FF", to: "#" },
  { icon: FileText, label: "Laporan", color: "#D946EF", bg: "#FDF4FF", to: "#" },
];

export default function Home() {
  const navigate = useNavigate();
  const { data: barang } = useCollection("barang");
  const { data: peminjaman } = useCollection("peminjaman");

  const totalBarang = barang.length;
  const totalTersedia = barang.reduce((sum, b) => sum + (b.tersedia || 0), 0);
  const totalDipinjam = peminjaman.filter((p) => p.status === "dipinjam").length;
  const totalPending = peminjaman.filter((p) => p.status === "pending").length;

  return (
    <div className="page-content">
      {/* Hero */}
      <div style={{
        background: "linear-gradient(145deg, #1C1C1E 0%, var(--primary-dark) 54%, var(--accent) 100%)",
        padding: "24px 16px 32px",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "relative" }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500, marginBottom: 4 }}>
            Karang Taruna
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            Sistem Peminjaman Barang
          </h1>
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            Kelola inventaris & peminjaman dengan mudah
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
        }}>
          {[
            { val: totalBarang, label: "Jenis", icon: Box, color: "var(--primary)" },
            { val: totalTersedia, label: "Tersedia", icon: Package, color: "var(--accent)" },
            { val: totalDipinjam, label: "Dipinjam", icon: TrendingUp, color: "var(--secondary)" },
            { val: totalPending, label: "Pending", icon: Clock, color: "#EC4899" },
          ].map((s, i) => (
            <div key={i} className="card fade-in" style={{
              textAlign: "center", padding: "12px 8px",
              animationDelay: `${i * 0.05}s`,
            }}>
              <s.icon size={18} color={s.color} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div style={{ padding: "20px 16px 8px" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Menu Utama</h2>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12,
        }}>
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => item.to !== "#" && navigate(item.to)}
              className="fade-in"
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 6, padding: "12px 4px", background: "none", animationDelay: `${i * 0.04}s`,
                opacity: item.to === "#" ? 0.5 : 1,
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: item.bg, display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <item.icon size={22} color={item.color} strokeWidth={1.8} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 500, color: "var(--text-secondary)",
                lineHeight: 1.2, textAlign: "center",
              }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ padding: "12px 16px 24px" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 12,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Aktivitas Terbaru</h2>
          <button
            onClick={() => navigate("/riwayat")}
            style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
          >
            Lihat Semua <ArrowRight size={14} />
          </button>
        </div>

        {peminjaman.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
            <ClipboardList size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
            <p style={{ fontSize: 13 }}>Belum ada aktivitas peminjaman</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {peminjaman.slice(0, 4).map((p, i) => (
              <div key={p.id} className="card fade-in" style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", animationDelay: `${i * 0.05}s`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: p.status === "dipinjam" ? "#DBEAFE" : p.status === "pending" ? "#FEF3C7" : "#DCFCE7",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Package size={18} color={
                    p.status === "dipinjam" ? "#2563EB" : p.status === "pending" ? "#D97706" : "#16A34A"
                  } />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.keperluan || "Peminjaman Barang"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {p.namaPeminjam} &middot; {p.items?.length || 1} jenis barang
                  </div>
                </div>
                <span className={`badge badge-${
                  p.status === "dipinjam" ? "info" : p.status === "pending" ? "warning" : p.status === "dikembalikan" ? "success" : "danger"
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action */}
      <div style={{ padding: "0 16px 24px" }}>
        <button
          className="btn btn-primary btn-block"
          onClick={() => navigate("/pinjam")}
          style={{ padding: "14px 20px", borderRadius: 14, fontSize: 15 }}
        >
          <PlusCircle size={20} />
          Ajukan Peminjaman Baru
        </button>
      </div>
    </div>
  );
}
