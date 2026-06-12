import { useState } from "react";
import { useCollection, useFirestoreActions } from "../../hooks/useFirestore";
import { useToast } from "../../components/Toast";
import Sheet from "../../components/Sheet";
import TambahBarangModal from "./TambahBarangModal";
import ExportLaporan from "./ExportLaporan";
import { Check, X, Package, Trash2, Printer, ArrowRightCircle, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "../../config/firebase";

const isDemoMode = () => {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  return !key || key === "demo-key";
};

export default function AdminDashboard() {
  const { data: peminjaman } = useCollection("peminjaman");
  const { data: barang } = useCollection("barang");
  const { updateItem: updatePeminjaman } = useFirestoreActions("peminjaman");
  const { deleteItem: hapusBarang } = useFirestoreActions("barang");
  const showToast = useToast();

  const [tab, setTab] = useState("pengajuan");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showTambahBarang, setShowTambahBarang] = useState(false);
  const [showExport, setShowExport] = useState(false);
  
  const [returnForm, setReturnForm] = useState(null); 
  const [returnStatus, setReturnStatus] = useState({}); 

  const pendingRequests = peminjaman.filter(p => p.status === "pending");
  const activeLoans = peminjaman.filter(p => p.status === "dipinjam" || p.status === "menunggu_kembali");

  const handleApprove = async (loan) => {
    try {
      const items = loan.items || [];
      if (items.length === 0) {
        showToast("Data barang peminjaman tidak lengkap", "error");
        return;
      }

      if (isDemoMode()) {
        await updatePeminjaman(loan.id, { status: "dipinjam" });
        showToast("Berhasil disetujui & stok dipotong", "success");
        setSelectedItem(null);
        return;
      }

      await runTransaction(db, async (transaction) => {
        const barangSnapshots = await Promise.all(
          items.map(async (item) => {
            const ref = doc(db, "barang", item.idBarang);
            const snap = await transaction.get(ref);
            if (!snap.exists()) {
              throw new Error(`${item.namaBarang} tidak ditemukan`);
            }
            const tersedia = Number(snap.data().tersedia || 0);
            if (tersedia < item.jumlah) {
              throw new Error(`Stok ${item.namaBarang} tidak cukup`);
            }
            return { ref, snap, item };
          })
        );

        barangSnapshots.forEach(({ ref, snap, item }) => {
          transaction.update(ref, {
            tersedia: Number(snap.data().tersedia || 0) - item.jumlah,
          });
        });

        transaction.update(doc(db, "peminjaman", loan.id), { status: "dipinjam" });
      });

      showToast("Berhasil disetujui & stok dipotong", "success");
      setSelectedItem(null);
    } catch (error) {
      showToast(error.message || "Gagal menyetujui", "error");
    }
  };

  const handleReject = async (loanId) => {
    try {
      await updatePeminjaman(loanId, { status: "ditolak" });
      showToast("Pengajuan ditolak", "success");
      setSelectedItem(null);
    } catch (error) {
      showToast(error.message || "Gagal menolak", "error");
    }
  };

  const openReturnForm = (loan) => {
    const initStatus = loan.userReturnReport ? JSON.parse(JSON.stringify(loan.userReturnReport)) : {};
    loan.items.forEach(item => {
      if (!initStatus[item.idBarang]) initStatus[item.idBarang] = { normal: item.jumlah, rusak: 0, hilang: 0 };
    });
    setReturnStatus(initStatus);
    setReturnForm(loan);
  };

  const processReturn = async () => {
    try {
      const invalidItem = (returnForm.items || []).find((item) => {
        const st = returnStatus[item.idBarang];
        const total = (parseInt(st?.normal) || 0) + (parseInt(st?.rusak) || 0) + (parseInt(st?.hilang) || 0);
        return total !== item.jumlah;
      });

      if (invalidItem) {
        showToast(`Total kondisi ${invalidItem.namaBarang} harus sama dengan jumlah dipinjam`, "error");
        return;
      }

      if (isDemoMode()) {
        await updatePeminjaman(returnForm.id, {
          status: "dikembalikan",
          returnDetail: returnStatus,
        });
        showToast("Barang berhasil dikembalikan!", "success");
        setReturnForm(null);
        return;
      }

      await runTransaction(db, async (transaction) => {
        const barangSnapshots = await Promise.all(
          returnForm.items.map(async (item) => {
            const ref = doc(db, "barang", item.idBarang);
            const snap = await transaction.get(ref);
            if (!snap.exists()) {
              throw new Error(`${item.namaBarang} tidak ditemukan`);
            }
            return { ref, snap, item };
          })
        );

        barangSnapshots.forEach(({ ref, snap, item }) => {
          const st = returnStatus[item.idBarang];
          const normalReturn = parseInt(st.normal) || 0;
          const rusak = parseInt(st.rusak) || 0;
          const hilang = parseInt(st.hilang) || 0;
          const bData = snap.data();

          transaction.update(ref, {
            tersedia: Number(bData.tersedia || 0) + normalReturn,
            stok: Math.max(0, Number(bData.stok || 0) - hilang - rusak),
          });
        });

        transaction.update(doc(db, "peminjaman", returnForm.id), {
          status: "dikembalikan",
          returnDetail: returnStatus,
        });
      });

      showToast("Barang berhasil dikembalikan!", "success");
      setReturnForm(null);
    } catch (error) {
      showToast(error.message?.includes("permission") ? "Gagal: Anda tidak memiliki akses admin." : error.message || "Gagal memproses pengembalian.", "error");
    }
  };

  const handleDeleteBarang = async (id) => {
    if (window.confirm("Hapus barang ini dari katalog?")) {
      try {
        await hapusBarang(id);
        showToast("Barang berhasil dihapus", "success");
      } catch (error) {
        showToast(error.message || "Gagal menghapus barang", "error");
      }
    }
  };

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Kelola Sistem</h1>
          <p className="page-header-sub">Halaman admin Karang Taruna</p>
        </div>
        <button 
          onClick={() => setShowExport(true)}
          style={{ width: 36, height: 36, borderRadius: 18, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}
        >
          <Printer size={18} />
        </button>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg-card)", position: "sticky", top: 65, zIndex: 40 }}>
        {["pengajuan", "aktif", "inventaris"].map((t) => (
          <button key={t} style={{ flex: 1, padding: "14px 0", fontSize: 13, fontWeight: 600, textTransform: "capitalize", color: tab === t ? "var(--primary)" : "var(--text-secondary)", borderBottom: tab === t ? "2px solid var(--primary)" : "2px solid transparent" }} onClick={() => setTab(t)}>
            {t}
            {t === "pengajuan" && pendingRequests.length > 0 && <span style={{ background: "var(--danger)", color: "#fff", padding: "2px 6px", borderRadius: 10, fontSize: 10, marginLeft: 6 }}>{pendingRequests.length}</span>}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px" }}>
        {tab === "pengajuan" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pendingRequests.length === 0 ? <div className="empty-state"><p>Tidak ada pengajuan baru</p></div> : 
              pendingRequests.map(p => (
                <div key={p.id} className="card fade-in" onClick={() => setSelectedItem(p)}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>{p.namaPeminjam}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{p.tanggalPinjam}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
                    Pinjam <strong>{p.items ? p.items.length : 1} jenis barang</strong>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-sm" style={{ flex: 1, background: "var(--primary)", color: "#fff" }} onClick={(e) => { e.stopPropagation(); handleApprove(p); }}><Check size={16} /> Setujui</button>
                    <button className="btn btn-sm" style={{ flex: 1, background: "#FEE2E2", color: "#DC2626" }} onClick={(e) => { e.stopPropagation(); handleReject(p.id); }}><X size={16} /> Tolak</button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === "aktif" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {activeLoans.length === 0 ? <div className="empty-state"><p>Tidak ada barang yang sedang dipinjam</p></div> : 
              activeLoans.sort((a, b) => Number(b.status === "menunggu_kembali") - Number(a.status === "menunggu_kembali")).map(p => (
                <div key={p.id} className="card fade-in">
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.namaPeminjam}</div>
                  
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
                    Membawa {p.items ? p.items.length : 1} jenis barang <br/>
                    Tenggat: <span style={{ fontWeight: 600, color: "var(--danger)" }}>{p.tanggalKembali}</span>
                  </div>
                  
                  {p.status === "menunggu_kembali" && (
                    <div style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 12, padding: "6px 10px", borderRadius: 6, marginBottom: 12, fontWeight: 600 }}>
                      Warga telah melaporkan kondisi pengembalian. Harap verifikasi fisik.
                    </div>
                  )}

                  <button className="btn btn-sm btn-block" style={{ background: p.status === "menunggu_kembali" ? "var(--accent)" : "var(--primary)", color: "#fff" }} onClick={() => openReturnForm(p)}>
                    <ArrowRightCircle size={16} /> Proses Pengembalian
                  </button>
                </div>
              ))
            }
          </div>
        )}

        {tab === "inventaris" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button className="btn btn-primary btn-block" style={{ marginBottom: 8 }} onClick={() => setShowTambahBarang(true)}>
              + Tambah Barang Baru
            </button>
            {barang.map(b => (
              <div key={b.id} className="card fade-in" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {b.gambar ? <img src={b.gambar} alt={b.nama} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} /> : <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={20} color="var(--primary)" /></div>}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{b.nama}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Stok Total: {b.stok} | Gudang: {b.tersedia}</div>
                </div>
                <button style={{ padding: 8, color: "var(--danger)" }} onClick={() => handleDeleteBarang(b.id)}><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!selectedItem} onClose={() => setSelectedItem(null)} title="Detail Pengajuan">
        {selectedItem && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>Peminjam</div>
              <div style={{ fontWeight: 600 }}>{selectedItem.namaPeminjam}</div>
              <div style={{ fontSize: 13 }}>{selectedItem.kontak}</div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>Daftar Barang ({selectedItem.items?.length || 0} Jenis)</div>
              <ul style={{ paddingLeft: 16, fontSize: 13, margin: 0 }}>
                {(selectedItem.items || []).map((it, i) => (
                  <li key={i} style={{ marginBottom: 4 }}><strong>{it.jumlah}x</strong> {it.namaBarang}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>Keperluan ({selectedItem.tanggalPinjam} s/d {selectedItem.tanggalKembali})</div>
              <div style={{ background: "var(--bg)", padding: 12, borderRadius: 8, fontSize: 13 }}>{selectedItem.keperluan}</div>
            </div>

            {selectedItem.status === "pending" && (
              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button className="btn btn-block" style={{ flex: 1, background: "var(--primary)", color: "#fff" }} onClick={() => handleApprove(selectedItem)}>Setujui & Potong Stok</button>
              </div>
            )}
          </div>
        )}
      </Sheet>

      <Sheet open={!!returnForm} onClose={() => setReturnForm(null)} title="Checklist Pengembalian">
        {returnForm && (
          <div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
              Admin: Verifikasi kecocokan laporan fisik dari warga. Barang normal akan kembali ke stok, barang rusak/hilang akan mengurangi stok total secara permanen.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24, maxHeight: "50vh", overflowY: "auto" }}>
              {(returnForm.items || []).map(item => (
                <div key={item.idBarang} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{item.namaBarang} (Total: {item.jumlah} dibawa)</div>
                  
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, color: "var(--success)", fontWeight: 700 }}><CheckCircle2 size={12} style={{marginRight:4, verticalAlign:"middle"}}/> Normal</label>
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

            <button className="btn btn-primary btn-block" onClick={processReturn} style={{ padding: "14px 20px" }}>
              Simpan & Selesaikan Peminjaman
            </button>
          </div>
        )}
      </Sheet>

      <TambahBarangModal open={showTambahBarang} onClose={() => setShowTambahBarang(false)} />
      <ExportLaporan open={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}
