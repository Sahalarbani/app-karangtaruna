import { useState } from "react";
import { useFirestoreActions } from "../../hooks/useFirestore";
import { storage } from "../../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "../../components/Toast";
import Sheet from "../../components/Sheet";
import { UploadCloud } from "lucide-react";

export default function TambahBarangModal({ open, onClose }) {
  const { addItem } = useFirestoreActions("barang");
  const showToast = useToast();
  
  const [form, setForm] = useState({
    nama: "",
    kategori: "Peralatan",
    stok: "",
    deskripsi: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const KATEGORI = ["Tenda", "Kursi", "Meja", "Elektronik", "Panggung", "Dekorasi", "Peralatan"];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("File harus berupa gambar", "error");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showToast("Ukuran gambar maksimal 2 MB", "error");
        return;
      }
      setImageFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.stok) {
      showToast("Nama dan stok wajib diisi", "error");
      return;
    }
    const stok = Number.parseInt(form.stok, 10);
    if (!Number.isFinite(stok) || stok < 1) {
      showToast("Stok harus berupa angka minimal 1", "error");
      return;
    }

    try {
      setLoading(true);
      let imageUrl = null;

      // Upload image to Firebase Storage if selected
      if (imageFile) {
        const fileExtension = imageFile.name.split('.').pop();
        const fileName = `barang/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const storageRef = ref(storage, fileName);
        
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addItem({
        ...form,
        stok,
        tersedia: stok,
        gambar: imageUrl
      });

      showToast("Barang berhasil ditambahkan", "success");
      setForm({ nama: "", kategori: "Peralatan", stok: "", deskripsi: "" });
      setImageFile(null);
      onClose();
    } catch (error) {
      console.error(error);
      showToast(error.message?.includes("permission") ? "Akses ditolak: Anda bukan admin." : "Gagal menyimpan barang: Periksa koneksi Anda.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Tambah Barang Baru">
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <label style={{ 
            width: 100, height: 100, borderRadius: 16, border: "2px dashed var(--border)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "var(--bg)", cursor: "pointer", position: "relative", overflow: "hidden"
          }}>
            {imageFile ? (
              <img 
                src={URL.createObjectURL(imageFile)} 
                alt="Preview" 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
              />
            ) : (
              <>
                <UploadCloud size={28} color="var(--text-muted)" style={{ marginBottom: 4 }} />
                <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600 }}>Foto (Opsional)</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
          </label>
        </div>

        <div className="form-group">
          <label className="form-label">Nama Barang</label>
          <input
            type="text"
            className="form-input"
            placeholder="Contoh: Tenda Terop 4x6"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Kategori</label>
            <select
              className="form-input"
              value={form.kategori}
              onChange={(e) => setForm({ ...form, kategori: e.target.value })}
            >
              {KATEGORI.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Jumlah Stok</label>
            <input
              type="number"
              className="form-input"
              placeholder="0"
              min="1"
              value={form.stok}
              onChange={(e) => setForm({ ...form, stok: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 24 }}>
          <label className="form-label">Deskripsi</label>
          <textarea
            className="form-input"
            placeholder="Keterangan tambahan..."
            value={form.deskripsi}
            onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-block"
          style={{ padding: "14px 20px" }}
        >
          {loading ? "Menyimpan..." : "Simpan Barang"}
        </button>
      </form>
    </Sheet>
  );
}
