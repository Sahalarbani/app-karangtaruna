const fs = require('fs');

// PATCH RIWAYAT
const fRiwayat = '/root/Projects/app-karangtaruna/src/pages/Riwayat.jsx';
let cRiwayat = fs.readFileSync(fRiwayat, 'utf8');

cRiwayat = cRiwayat.replace(
  /import \{ Calendar, Package, Clock, CheckCircle2, XCircle, ClipboardList, Info \} from "lucide-react";/,
  `import { Calendar, Package, Clock, CheckCircle2, XCircle, ClipboardList, Info, AlertTriangle } from "lucide-react";`
);

cRiwayat = cRiwayat.replace(
  /✅ Utuh\/Normal/g,
  `<CheckCircle2 size={12} style={{marginRight:4, verticalAlign:"middle"}}/> Utuh/Normal`
);

cRiwayat = cRiwayat.replace(
  /⚠️ Rusak/g,
  `<AlertTriangle size={12} style={{marginRight:4, verticalAlign:"middle"}}/> Rusak`
);

cRiwayat = cRiwayat.replace(
  /❌ Hilang/g,
  `<XCircle size={12} style={{marginRight:4, verticalAlign:"middle"}}/> Hilang`
);

cRiwayat = cRiwayat.replace(
  /showToast\("Gagal mengirim laporan", "error"\);/g,
  `showToast(e.message?.includes("permission") ? "Akses ditolak: Anda tidak memiliki izin." : "Gagal mengirim laporan. Periksa koneksi Anda.", "error");`
);

fs.writeFileSync(fRiwayat, cRiwayat);


// PATCH ADMIN DASHBOARD
const fAdmin = '/root/Projects/app-karangtaruna/src/pages/admin/AdminDashboard.jsx';
let cAdmin = fs.readFileSync(fAdmin, 'utf8');

cAdmin = cAdmin.replace(
  /import \{ Check, X, Package, Trash2, Edit, Printer, ArrowRightCircle \} from "lucide-react";/,
  `import { Check, X, Package, Trash2, Edit, Printer, ArrowRightCircle, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";`
);

cAdmin = cAdmin.replace(
  /✅ Normal/g,
  `<CheckCircle2 size={12} style={{marginRight:4, verticalAlign:"middle"}}/> Normal`
);

cAdmin = cAdmin.replace(
  /⚠️ Rusak/g,
  `<AlertTriangle size={12} style={{marginRight:4, verticalAlign:"middle"}}/> Rusak`
);

cAdmin = cAdmin.replace(
  /❌ Hilang/g,
  `<XCircle size={12} style={{marginRight:4, verticalAlign:"middle"}}/> Hilang`
);

cAdmin = cAdmin.replace(
  /showToast\("Gagal memproses pengembalian", "error"\);/g,
  `showToast(e.message?.includes("permission") ? "Gagal: Anda tidak memiliki akses admin." : "Gagal memproses pengembalian.", "error");`
);

fs.writeFileSync(fAdmin, cAdmin);

// PATCH TAMBAH BARANG MODAL
const fModal = '/root/Projects/app-karangtaruna/src/pages/admin/TambahBarangModal.jsx';
let cModal = fs.readFileSync(fModal, 'utf8');

cModal = cModal.replace(
  /showToast\("Gagal menyimpan barang: " \+ error\.message, "error"\);/g,
  `showToast(error.message?.includes("permission") ? "Akses ditolak: Anda bukan admin." : "Gagal menyimpan barang: Periksa koneksi Anda.", "error");`
);

fs.writeFileSync(fModal, cModal);

// PATCH USEAUTH
const fAuth = '/root/Projects/app-karangtaruna/src/hooks/useAuth.jsx';
let cAuth = fs.readFileSync(fAuth, 'utf8');
cAuth = cAuth.replace(
  /console.error\("Error signing in with Google", error\);\n\s*throw error;/g,
  `console.error("Error signing in with Google", error);\n      if (error.code === 'auth/popup-closed-by-user') throw new Error("Login dibatalkan oleh pengguna.");\n      if (error.code === 'auth/network-request-failed') throw new Error("Gagal login: Periksa koneksi internet Anda.");\n      throw new Error("Terjadi kesalahan saat login.");`
);
fs.writeFileSync(fAuth, cAuth);

// PATCH PROFILE
const fProfile = '/root/Projects/app-karangtaruna/src/pages/Profile.jsx';
let cProfile = fs.readFileSync(fProfile, 'utf8');
cProfile = cProfile.replace(
  /showToast\("Gagal login dengan Google", "error"\);/g,
  `showToast(error.message || "Gagal login dengan Google", "error");`
);
cProfile = cProfile.replace(
  /showToast\("Gagal memperbarui profil", "error"\);/g,
  `showToast(error.message?.includes("permission") ? "Akses ditolak." : "Gagal memperbarui profil, periksa koneksi Anda.", "error");`
);
fs.writeFileSync(fProfile, cProfile);


// PATCH FORM PINJAM
const fPinjam = '/root/Projects/app-karangtaruna/src/pages/FormPinjam.jsx';
let cPinjam = fs.readFileSync(fPinjam, 'utf8');
cPinjam = cPinjam.replace(
  /showToast\("Gagal menyimpan data", "error"\);/g,
  `showToast(error.message?.includes("permission") ? "Akses ditolak: Anda harus login." : "Gagal menyimpan data. Pastikan koneksi internet lancar.", "error");`
);
fs.writeFileSync(fPinjam, cPinjam);

