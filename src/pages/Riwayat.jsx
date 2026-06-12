import { useState } from "react";
import Sheet from "../components/Sheet";
import { useFirestoreActions } from "../hooks/useFirestore";
import { useToast } from "../components/Toast";
import { useCollection } from "../hooks/useFirestore";
import { useAuth } from "../hooks/useAuth";
import { Calendar, Package, Clock, CheckCircle2, XCircle, ClipboardList, Info, AlertTriangle } from "lucide-react";

export default function Riwayat() {
  const { data: peminjaman, loading } = useCollection("peminjaman");
  const { user, isAdmin } = useAuth();
  const [filter, setFilter] = useState("Semua");

  const STATUS_FILTERS = ["Semua", "pending", "dipinjam", "menunggu_kembali", "dikembalikan", "ditolak"];
  const { updateItem } = useFirestoreActions("peminjaman");
  const showToast = useToast();
  const [returnForm, setReturnForm] = useState(null);
  const [returnStatus, setReturnStatus] = useState({});
  
  const openUserReturnForm = (loan) => {
    const initStatus = {};
    loan.items.forEach(item => {
      initStatus[item.idBarang] = { normal: item.jumlah, rusak: 0, hilang: 0 };
    });
    setReturnStatus(initStatus);
    setReturnForm(loan);
  };

  const submitUserReturn = async () => {
    const invalidItem = (returnForm.items || []).find((item) => {
      const st = returnStatus[item.idBarang] || {};
      const total = (parseInt(st.normal) || 0) + (parseInt(st.rusak) || 0) + (parseInt(st.hilang) || 0);
      return total !== item.jumlah;
    });

    if (invalidItem) {
      showToast(`Total kondisi ${invalidItem.namaBarang} harus sama dengan jumlah dipinjam`, "error");
      return;
    }

    try {
      await updateItem(returnForm.id, {
        status: "menunggu_kembali",
        userReturnReport: returnStatus
      });
      showToast("Laporan pengembalian terkirim! Harap serahkan barang ke pengurus.", "success");
      setReturnForm(null);
    } catch (e) {
      showToast(e.message?.includes("permission") ? "Akses ditolak: Anda tidak memiliki izin." : "Gagal mengirim laporan. Periksa koneksi Anda.", "error");
    }
  };

  const filtered = peminjaman.filter((p) => {
    const isOwner = isAdmin || p.userId === user?.uid;
    const matchStatus = filter === "Semua" || p.status === filter;
    return isOwner && matchStatus;
  }).sort((a, b) => {
    return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return <Clock size={16} color="var(--warning)" />;
      case "dipinjam": return <Package size={16} color="var(--info)" />;
      case "menunggu_kembali": return <Clock size={16} color="var(--accent)" />;
      case "dikembalikan": return <CheckCircle2 size={16} color="var(--success)" />;
      case "ditolak": return <XCircle size={16} color="var(--danger)" />;
      default: return null;
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Riwayat Peminjaman</h1>
        <p className="page-header-sub">
          {isAdmin ? "Seluruh riwayat peminjaman warga" : "Daftar pengajuan peminjaman Anda"}
        </p>
      </div>

      <div className="chip-row" style={{ paddingTop: 12 }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            className={`chip${filter === f ? " active" : ""}`}
            style={{ textTransform: "capitalize" }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 16px 24px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: "var(--radius)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={48} />
            <p>Tidak ada riwayat peminjaman</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((item, i) => (
              <div key={item.id} className="card fade-in" style={{ padding: "16px", animationDelay: `${i * 0.05}s` }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span className={`badge badge-${
                    item.status === "dipinjam" ? "info" : item.status === "pending" || item.status === "menunggu_kembali" ? "warning" : item.status === "dikembalikan" ? "success" : "danger"
                  }`} style={{ display: "flex", gap: 4 }}>
                    {getStatusIcon(item.status)}
                    <span style={{ textTransform: "capitalize" }}>{item.status.replace("_", " ")}</span>
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={12} />
                    {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString("id-ID") : "-"}
                  </span>
                </div>

                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                  Acara: {item.keperluan || "Acara Karang Taruna"}
                </div>
                
                {/* Daftar Items */}
                <div style={{ background: "var(--bg)", borderRadius: 8, padding: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4, fontWeight: 600 }}>Daftar Barang ({item.items?.length || 0}):</div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--text-primary)" }}>
                    {item.items && item.items.map((it, idx) => (
                      <li key={idx}><strong>{it.jumlah}x</strong> {it.namaBarang}</li>
                    ))}
                    {!item.items && <li>{item.namaBarang} ({item.jumlah} unit)</li>}
                  </ul>
                </div>

                {item.status === "dipinjam" && item.userId === user?.uid && (
                  <button className="btn btn-sm btn-block" style={{ background: "var(--bg)", color: "var(--primary)", border: "1.5px solid var(--primary)", marginBottom: 12 }} onClick={() => openUserReturnForm(item)}>
                    Laporkan Pengembalian Barang
                  </button>
                )}

                {item.status === "dikembalikan" && item.returnDetail && (
                  <div style={{ fontSize: 11, color: "var(--danger)", marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 4 }}>
                    <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>Catatan Pengembalian Tersimpan. Cek detail di Admin jika ada barang rusak/hilang.</span>
                  </div>
                )}
                
                {isAdmin && (
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
                    Peminjam: <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{item.namaPeminjam}</span>
                  </div>
                )}

                <div style={{ 
                  background: "var(--bg)", borderRadius: "var(--radius-sm)", 
                  padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
                  marginTop: isAdmin ? 0 : 8
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Tgl Pinjam</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{item.tanggalPinjam}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Tgl Kembali</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{item.tanggalKembali}</div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!returnForm} onClose={() => setReturnForm(null)} title="Laporan Cek Fisik Pengembalian">
        {returnForm && (
          <div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
              Bantu pengurus dengan mengecek kondisi barang sebelum Anda serahkan kembali. Isi dengan jujur jika ada yang rusak/hilang.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24, maxHeight: "50vh", overflowY: "auto" }}>
              {(returnForm.items || []).map(item => (
                <div key={item.idBarang} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{item.namaBarang} (Total dibawa: {item.jumlah})</div>
                  
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, color: "var(--success)", fontWeight: 700 }}><CheckCircle2 size={12} style={{marginRight:4, verticalAlign:"middle"}}/> Utuh/Normal</label>
                      <input type="number" min="0" max={item.jumlah} className="form-input" style={{ padding: "6px 8px" }} value={returnStatus[item.idBarang]?.normal} onChange={(e) => setReturnStatus(p => ({ ...p, [item.idBarang]: { ...p[item.idBarang], normal: e.target.value } }))} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, color: "var(--warning)", fontWeight: 700 }}><AlertTriangle size={12} style={{marginRight:4, verticalAlign:"middle"}}/> Rusak</label>
                      <input type="number" min="0" max={item.jumlah} className="form-input" style={{ padding: "6px 8px" }} value={returnStatus[item.idBarang]?.rusak} onChange={(e) => setReturnStatus(p => ({ ...p, [item.idBarang]: { ...p[item.idBarang], rusak: e.target.value } }))} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, color: "var(--danger)", fontWeight: 700 }}><XCircle size={12} style={{marginRight:4, verticalAlign:"middle"}}/> Hilang</label>
                      <input type="number" min="0" max={item.jumlah} className="form-input" style={{ padding: "6px 8px" }} value={returnStatus[item.idBarang]?.hilang} onChange={(e) => setReturnStatus(p => ({ ...p, [item.idBarang]: { ...p[item.idBarang], hilang: e.target.value } }))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-primary btn-block" onClick={submitUserReturn} style={{ padding: "14px 20px" }}>
              Kirim Laporan & Serahkan Barang
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
