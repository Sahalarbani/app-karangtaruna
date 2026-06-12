const fs = require('fs');

// 1. UPDATE RIWAYAT (Biar Warga bisa klik "Kembalikan Barang")
const riwayatFile = '/root/Projects/app-karangtaruna/src/pages/Riwayat.jsx';
let riwayatContent = fs.readFileSync(riwayatFile, 'utf8');

if (!riwayatContent.includes("Menunggu Verif Kembali")) {
  riwayatContent = riwayatContent.replace(
    /import { useState } from "react";/g,
    `import { useState } from "react";\nimport { doc } from "firebase/firestore";\nimport { db } from "../config/firebase";\nimport Sheet from "../components/Sheet";\nimport { useFirestoreActions } from "../hooks/useFirestore";\nimport { useToast } from "../components/Toast";`
  );

  riwayatContent = riwayatContent.replace(
    /const STATUS_FILTERS = \["Semua", "pending", "dipinjam", "dikembalikan", "ditolak"\];/,
    `const STATUS_FILTERS = ["Semua", "pending", "dipinjam", "menunggu_kembali", "dikembalikan", "ditolak"];
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
      try {
        await updateItem(returnForm.id, {
          status: "menunggu_kembali",
          userReturnReport: returnStatus
        });
        showToast("Laporan pengembalian terkirim! Harap serahkan barang ke pengurus.", "success");
        setReturnForm(null);
      } catch (e) {
        showToast("Gagal mengirim laporan", "error");
      }
    };`
  );

  riwayatContent = riwayatContent.replace(
    /case "dipinjam": return <Package size={16} color="var\(--info\)" \/>;/,
    `case "dipinjam": return <Package size={16} color="var(--info)" />;\n      case "menunggu_kembali": return <Clock size={16} color="var(--accent)" />;`
  );

  riwayatContent = riwayatContent.replace(
    /\{item\.status === "dikembalikan" && item\.returnDetail && \(/,
    `{item.status === "dipinjam" && item.userId === user?.uid && (
                  <button className="btn btn-sm btn-block" style={{ background: "var(--bg)", color: "var(--primary)", border: "1.5px solid var(--primary)", marginBottom: 12 }} onClick={() => openUserReturnForm(item)}>
                    Laporkan Pengembalian Barang
                  </button>
                )}
                {item.status === "dikembalikan" && item.returnDetail && (`
  );

  riwayatContent = riwayatContent.replace(
    /<\/div>\s*<\/div>\s*\);/,
    `</div>
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
                      <label style={{ fontSize: 10, color: "var(--success)", fontWeight: 700 }}>✅ Utuh/Normal</label>
                      <input type="number" min="0" max={item.jumlah} className="form-input" style={{ padding: "6px 8px" }} value={returnStatus[item.idBarang]?.normal} onChange={(e) => setReturnStatus(p => ({ ...p, [item.idBarang]: { ...p[item.idBarang], normal: e.target.value } }))} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, color: "var(--warning)", fontWeight: 700 }}>⚠️ Rusak</label>
                      <input type="number" min="0" max={item.jumlah} className="form-input" style={{ padding: "6px 8px" }} value={returnStatus[item.idBarang]?.rusak} onChange={(e) => setReturnStatus(p => ({ ...p, [item.idBarang]: { ...p[item.idBarang], rusak: e.target.value } }))} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, color: "var(--danger)", fontWeight: 700 }}>❌ Hilang</label>
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
  );`
  );

  fs.writeFileSync(riwayatFile, riwayatContent);
}

// 2. UPDATE ADMIN DASHBOARD (Admin verifikasi userReport atau cek sendiri)
const adminFile = '/root/Projects/app-karangtaruna/src/pages/admin/AdminDashboard.jsx';
let adminContent = fs.readFileSync(adminFile, 'utf8');

if (!adminContent.includes("menunggu_kembali")) {
  adminContent = adminContent.replace(
    /const activeLoans = peminjaman\.filter\(p => p\.status === "dipinjam"\);/,
    `const activeLoans = peminjaman.filter(p => p.status === "dipinjam" || p.status === "menunggu_kembali");`
  );

  adminContent = adminContent.replace(
    /const initStatus = \{\};/,
    `const initStatus = loan.userReturnReport ? JSON.parse(JSON.stringify(loan.userReturnReport)) : {};`
  );

  adminContent = adminContent.replace(
    /initStatus\[item\.idBarang\] = \{ normal: item\.jumlah, rusak: 0, hilang: 0 \};/g,
    `if (!initStatus[item.idBarang]) initStatus[item.idBarang] = { normal: item.jumlah, rusak: 0, hilang: 0 };`
  );

  adminContent = adminContent.replace(
    /\{activeLoans\.length === 0 \? <div className="empty-state"><p>Tidak ada barang yang sedang dipinjam<\/p><\/div> :/g,
    `{activeLoans.length === 0 ? <div className="empty-state"><p>Tidak ada barang yang sedang dipinjam</p></div> : 
              activeLoans.sort((a,b) => a.status === "menunggu_kembali" ? -1 : 1).map(p => (`
  );

  adminContent = adminContent.replace(
    /<div style={{ fontSize: 13, color: "var\(--text-secondary\)", marginBottom: 12 }}>\s*Membawa \{p\.items \? p\.items\.length : 1\} jenis barang <br\/>\s*Tenggat: <span style={{ fontWeight: 600, color: "var\(--danger\)" }}>\{p\.tanggalKembali\}<\/span>\s*<\/div>\s*<button className="btn btn-sm btn-block" style={{ background: "var\(--primary\)", color: "#fff" }} onClick={\(\) => openReturnForm\(p\)}>/g,
    `<div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
                    Membawa {p.items ? p.items.length : 1} jenis barang <br/>
                    Tenggat: <span style={{ fontWeight: 600, color: "var(--danger)" }}>{p.tanggalKembali}</span>
                  </div>
                  {p.status === "menunggu_kembali" && (
                    <div style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 12, padding: "6px 10px", borderRadius: 6, marginBottom: 12, fontWeight: 600 }}>
                      Warga telah melaporkan kondisi pengembalian. Harap verifikasi fisik.
                    </div>
                  )}
                  <button className="btn btn-sm btn-block" style={{ background: p.status === "menunggu_kembali" ? "var(--success)" : "var(--primary)", color: "#fff" }} onClick={() => openReturnForm(p)}>`
  );

  adminContent = adminContent.replace(
    /Cek kondisi barang yang dikembalikan\. Barang normal akan menambah stok gudang\. Barang rusak\/hilang tidak akan ditambahkan kembali ke stok\./g,
    `Admin: Verifikasi kecocokan laporan fisik dari warga. Barang normal akan kembali ke stok, barang rusak/hilang akan mengurangi stok total secara permanen.`
  );

  fs.writeFileSync(adminFile, adminContent);
}

