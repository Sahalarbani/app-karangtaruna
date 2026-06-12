import { useState } from "react";
import { useCollection } from "../../hooks/useFirestore";
import { useToast } from "../../components/Toast";
import Sheet from "../../components/Sheet";
import { FileText, FileSpreadsheet } from "lucide-react";

export default function ExportLaporan({ open, onClose }) {
  const { data: peminjaman } = useCollection("peminjaman");
  const showToast = useToast();
  const [filterBulan, setFilterBulan] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const downloadCSV = () => {
    try {
      // Filter data sesuai bulan
      const filtered = peminjaman.filter(p => {
        if (!p.tanggalPinjam) return false;
        return p.tanggalPinjam.startsWith(filterBulan);
      });

      if (filtered.length === 0) {
        showToast("Tidak ada data di bulan tersebut", "error");
        return;
      }

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "ID,Nama Peminjam,Kontak,Barang,Jumlah,Tgl Pinjam,Tgl Kembali,Status,Keperluan\n";

      filtered.forEach(row => {
        const cleanStr = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;
        const barangText = (row.items || [])
          .map((item) => `${item.namaBarang} (${item.jumlah})`)
          .join("; ") || row.namaBarang || "-";
        const totalJumlah = (row.items || []).reduce((sum, item) => sum + Number(item.jumlah || 0), 0) || row.jumlah || 0;
        
        const rowData = [
          cleanStr(row.id),
          cleanStr(row.namaPeminjam),
          cleanStr(row.kontak),
          cleanStr(barangText),
          totalJumlah,
          cleanStr(row.tanggalPinjam),
          cleanStr(row.tanggalKembali),
          cleanStr(row.status),
          cleanStr(row.keperluan)
        ];
        csvContent += rowData.join(",") + "\n";
      });

      // Proses Download
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Laporan_Peminjaman_${filterBulan}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Laporan berhasil diunduh (CSV)", "success");
      onClose();
    } catch (error) {
      showToast(error.message || "Gagal mengunduh laporan", "error");
    }
  };

  const downloadTxtRekap = () => {
     try {
      const filtered = peminjaman.filter(p => p.tanggalPinjam?.startsWith(filterBulan));
      if (filtered.length === 0) {
        showToast("Tidak ada data di bulan tersebut", "error");
        return;
      }

      let txt = `REKAPITULASI PEMINJAMAN KARANG TARUNA\nBulan: ${filterBulan}\n====================================\n\n`;
      
      let totalDipinjam = 0;
      let totalSelesai = 0;

      filtered.forEach((p, i) => {
        if(p.status === 'dipinjam') totalDipinjam++;
        if(p.status === 'dikembalikan') totalSelesai++;
        const barangText = (p.items || [])
          .map((item) => `${item.namaBarang} (${item.jumlah} unit)`)
          .join(", ") || `${p.namaBarang || "-"} (${p.jumlah || 0} unit)`;

        txt += `${i+1}. Peminjam : ${p.namaPeminjam} (${p.kontak})\n`;
        txt += `   Barang   : ${barangText}\n`;
        txt += `   Tanggal  : ${p.tanggalPinjam} s/d ${p.tanggalKembali}\n`;
        txt += `   Status   : ${p.status.toUpperCase()}\n`;
        txt += `   Keperluan: ${p.keperluan}\n`;
        txt += `------------------------------------\n`;
      });

      txt += `\nTotal Berjalan: ${totalDipinjam}\nTotal Selesai: ${totalSelesai}\n`;

      const blob = new Blob([txt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Rekap_${filterBulan}.txt`;
      link.click();
      URL.revokeObjectURL(url);

      showToast("Rekap TXT berhasil diunduh", "success");
      onClose();
    } catch (error) {
      showToast(error.message || "Gagal mengunduh", "error");
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Cetak Laporan">
      <div style={{ marginBottom: 20 }}>
        <label className="form-label">Pilih Bulan Laporan</label>
        <input 
          type="month" 
          className="form-input" 
          value={filterBulan}
          onChange={(e) => setFilterBulan(e.target.value)}
        />
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <button 
          className="btn btn-primary" 
          onClick={downloadCSV}
          style={{ padding: "14px", display: "flex", justifyContent: "flex-start" }}
        >
          <FileSpreadsheet size={20} />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 14 }}>Export ke Excel (CSV)</div>
            <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.8 }}>Format tabel untuk Microsoft Excel</div>
          </div>
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={downloadTxtRekap}
          style={{ padding: "14px", display: "flex", justifyContent: "flex-start" }}
        >
          <FileText size={20} />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 14 }}>Download Teks Rekap (TXT)</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)" }}>Format teks ringan untuk di-share ke WhatsApp</div>
          </div>
        </button>
      </div>
    </Sheet>
  );
}
