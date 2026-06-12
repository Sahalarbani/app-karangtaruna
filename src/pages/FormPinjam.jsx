import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCollection, useFirestoreActions } from "../hooks/useFirestore";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/Toast";
import { ArrowLeft, Send, CheckSquare, Square } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export default function FormPinjam() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialBarang = searchParams.get("barang") || "";

  const { data: barangList } = useCollection("barang");
  const { addItem } = useFirestoreActions("peminjaman");
  const { user } = useAuth();
  const showToast = useToast();

  const [form, setForm] = useState({
    namaPeminjam: user?.displayName || "",
    kontak: "",
    tanggalPinjam: "",
    tanggalKembali: "",
    keperluan: "",
  });

  // Format: { [idBarang]: { id, nama, jumlah, max } }
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      getDoc(doc(db, "users", user.uid))
        .then((snap) => {
          if (snap.exists() && snap.data().kontak) {
            setForm((prev) => ({ ...prev, kontak: snap.data().kontak }));
          }
        })
        .catch(() => {
          showToast("Kontak profil gagal dimuat. Anda tetap bisa mengisi manual.", "info");
        });
    }
  }, [user, showToast]);

  // Auto-select item if redirected from Katalog
  useEffect(() => {
    if (initialBarang && barangList.length > 0) {
      const b = barangList.find(b => b.nama === initialBarang);
      if (b && b.tersedia > 0) {
        setSelectedItems({ [b.id]: { id: b.id, nama: b.nama, jumlah: 1, max: b.tersedia } });
      }
    }
  }, [initialBarang, barangList]);

  const handleCheck = (b) => {
    if (selectedItems[b.id]) {
      const next = { ...selectedItems };
      delete next[b.id];
      setSelectedItems(next);
    } else {
      setSelectedItems({ ...selectedItems, [b.id]: { id: b.id, nama: b.nama, jumlah: 1, max: b.tersedia } });
    }
  };

  const handleQtyChange = (id, val) => {
    const num = parseInt(val) || "";
    setSelectedItems(prev => ({
      ...prev,
      [id]: { ...prev[id], jumlah: num }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const itemsArray = Object.values(selectedItems);

    if (!form.namaPeminjam || !form.kontak || !form.tanggalPinjam || !form.tanggalKembali || !form.keperluan) {
      showToast("Harap isi data acara dan peminjam", "error");
      return;
    }
    if (form.tanggalKembali < form.tanggalPinjam) {
      showToast("Tanggal kembali tidak boleh sebelum tanggal ambil", "error");
      return;
    }
    if (itemsArray.length === 0) {
      showToast("Pilih minimal 1 barang untuk dipinjam", "error");
      return;
    }

    // Validasi jumlah
    for (let item of itemsArray) {
      if (!item.jumlah || item.jumlah < 1) {
        showToast(`Jumlah ${item.nama} tidak valid`, "error");
        return;
      }
      if (item.jumlah > item.max) {
        showToast(`Stok ${item.nama} tidak cukup (Tersedia: ${item.max})`, "error");
        return;
      }
    }

    try {
      setLoading(true);
      await addItem({
        ...form,
        items: itemsArray.map(i => ({ idBarang: i.id, namaBarang: i.nama, jumlah: i.jumlah })),
        status: "pending",
        userId: user?.uid,
        userEmail: user?.email
      });
      showToast("Berhasil mengajukan peminjaman", "success");
      navigate("/riwayat");
    } catch (error) {
      showToast(error.message?.includes("permission") ? "Akses ditolak: Anda harus login." : "Gagal menyimpan data. Pastikan koneksi internet lancar.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content" style={{ paddingBottom: "calc(var(--nav-height) + 16px)" }}>
      <div className="page-header" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ padding: 4 }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ flex: 1 }}>Formulir Pinjam</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: "16px" }}>
        
        {/* Step 1: Checklist Barang */}
        <div className="card fade-in" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>1. Pilih Barang (Bisa Lebih Dari Satu)</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto", paddingRight: 4 }}>
            {barangList.map(b => {
              const isChecked = !!selectedItems[b.id];
              const disabled = b.tersedia === 0;

              return (
                <div key={b.id} style={{ 
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", 
                  border: `1.5px solid ${isChecked ? 'var(--primary)' : 'var(--border)'}`, 
                  borderRadius: 8, background: isChecked ? '#FFF0EB' : 'var(--bg-card)',
                  opacity: disabled ? 0.5 : 1
                }}>
                  <div onClick={() => !disabled && handleCheck(b)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, cursor: disabled ? "not-allowed" : "pointer" }}>
                    {isChecked ? <CheckSquare size={20} color="var(--primary)" /> : <Square size={20} color="var(--text-muted)" />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{b.nama}</div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Tersedia: {b.tersedia} unit</div>
                    </div>
                  </div>
                  
                  {isChecked && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input 
                        type="number" 
                        min="1" 
                        max={b.tersedia}
                        value={selectedItems[b.id].jumlah}
                        onChange={(e) => handleQtyChange(b.id, e.target.value)}
                        style={{ width: 50, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", textAlign: "center", fontSize: 13 }}
                      />
                      <span style={{ fontSize: 11, fontWeight: 500 }}>Unit</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Data Pemesan & Acara */}
        <div className="card fade-in" style={{ animationDelay: "0.1s", marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>2. Detail Acara & Peminjam</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Tgl Ambil</label>
              <input type="date" className="form-input" value={form.tanggalPinjam} onChange={(e) => setForm({ ...form, tanggalPinjam: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Tgl Kembali</label>
              <input type="date" className="form-input" value={form.tanggalKembali} onChange={(e) => setForm({ ...form, tanggalKembali: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Keperluan / Nama Acara</label>
            <input type="text" className="form-input" placeholder="Contoh: Rapat RT 01" value={form.keperluan} onChange={(e) => setForm({ ...form, keperluan: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Nama Peminjam / Penanggung Jawab</label>
            <input type="text" className="form-input" placeholder="Contoh: Budi" value={form.namaPeminjam} onChange={(e) => setForm({ ...form, namaPeminjam: e.target.value })} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nomor WhatsApp Aktif</label>
            <input type="tel" className="form-input" placeholder="0812..." value={form.kontak} onChange={(e) => setForm({ ...form, kontak: e.target.value })} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary btn-block fade-in" style={{ animationDelay: "0.2s", padding: "14px 20px" }}>
          {loading ? "Memproses..." : <><Send size={18} /> Ajukan Peminjaman ({Object.keys(selectedItems).length} Barang)</>}
        </button>
      </form>
    </div>
  );
}
