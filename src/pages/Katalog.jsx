import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCollection } from "../hooks/useFirestore";
import { Search, Package, Box, PlusCircle } from "lucide-react";

const KATEGORI = ["Semua", "Tenda", "Kursi", "Meja", "Elektronik", "Panggung", "Dekorasi", "Peralatan"];

export default function Katalog() {
  const navigate = useNavigate();
  const { data: barang, loading } = useCollection("barang");
  const [search, setSearch] = useState("");
  const [kategori, setKategori] = useState("Semua");

  const filtered = useMemo(() => {
    return barang.filter((b) => {
      const matchSearch = b.nama.toLowerCase().includes(search.toLowerCase());
      const matchKat = kategori === "Semua" || b.kategori === kategori;
      return matchSearch && matchKat;
    });
  }, [barang, search, kategori]);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Katalog Barang</h1>
        <p className="page-header-sub">{barang.length} jenis barang tersedia</p>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ paddingTop: 12 }}>
        <Search size={18} />
        <input
          type="text"
          placeholder="Cari barang..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter chips */}
      <div className="chip-row">
        {KATEGORI.map((k) => (
          <button
            key={k}
            className={`chip${kategori === k ? " active" : ""}`}
            onClick={() => setKategori(k)}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div style={{ padding: "0 16px 24px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: "var(--radius)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <p>Tidak ada barang ditemukan</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((item, i) => {
              const pct = item.stok > 0 ? Math.round((item.tersedia / item.stok) * 100) : 0;
              const barColor = pct > 50 ? "var(--success)" : pct > 20 ? "var(--warning)" : "var(--danger)";

              return (
                <div
                  key={item.id}
                  className="card fade-in"
                  style={{
                    display: "flex", gap: 12, alignItems: "center",
                    animationDelay: `${i * 0.03}s`,
                  }}
                  onClick={() => navigate(`/pinjam?barang=${encodeURIComponent(item.nama)}`)}
                >
                  {/* Photo or Icon */}
                  {item.gambar ? (
                    <img 
                      src={item.gambar} 
                      alt={item.nama}
                      style={{
                        width: 52, height: 52, borderRadius: 12,
                        objectFit: "cover", flexShrink: 0
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 52, height: 52, borderRadius: 12,
                      background: "var(--bg)", display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Box size={24} color="var(--primary)" strokeWidth={1.5} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{item.nama}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
                      {item.kategori} &middot; Stok: {item.stok}
                    </div>
                    {/* Availability bar */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <div style={{
                        flex: 1, height: 4, borderRadius: 2, background: "var(--border-light)",
                      }}>
                        <div style={{
                          width: `${pct}%`, height: "100%", borderRadius: 2, background: barColor,
                          transition: "width 0.3s ease",
                        }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: barColor }}>
                        {item.tersedia}/{item.stok}
                      </span>
                    </div>
                  </div>

                  <PlusCircle size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
