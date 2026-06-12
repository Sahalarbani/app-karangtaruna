import { useState, useMemo } from "react";
import { useCollection } from "../hooks/useFirestore";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Package, Info } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export default function Jadwal() {
  const { data: peminjaman, loading } = useCollection("peminjaman");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Hanya ambil data peminjaman yang disetujui atau sedang dipinjam
  const activeLoans = useMemo(() => {
    return peminjaman.filter(p => p.status === "dipinjam" || p.status === "pending");
  }, [peminjaman]);

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Ambil acara/peminjaman di hari yang dipilih
  const dailyEvents = useMemo(() => {
    return activeLoans.filter(loan => {
      try {
        const start = parseISO(loan.tanggalPinjam);
        const end = parseISO(loan.tanggalKembali);
        return isWithinInterval(selectedDate, { start, end });
      } catch {
        return false;
      }
    });
  }, [selectedDate, activeLoans]);

  // Cek apakah ada acara di suatu hari tertentu (untuk dot marker kalender)
  const hasEvent = (day) => {
    return activeLoans.some(loan => {
      try {
        const start = parseISO(loan.tanggalPinjam);
        const end = parseISO(loan.tanggalKembali);
        return isWithinInterval(day, { start, end });
      } catch {
        return false;
      }
    });
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Jadwal Peminjaman</h1>
        <p className="page-header-sub">Cek ketersediaan tanggal barang</p>
      </div>

      <div style={{ padding: 16 }}>
        {/* Kalender Card */}
        <div className="card fade-in" style={{ padding: 16, marginBottom: 24 }}>
          {/* Header Kalender */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button onClick={prevMonth} style={{ padding: 4 }}>
              <ChevronLeft size={20} />
            </button>
            <div style={{ fontWeight: 700, fontSize: 15, textTransform: "capitalize" }}>
              {format(currentMonth, "MMMM yyyy", { locale: id })}
            </div>
            <button onClick={nextMonth} style={{ padding: 4 }}>
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Grid Hari (Sen-Min) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8, textAlign: "center" }}>
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day, i) => (
              <div key={day} style={{ fontSize: 11, fontWeight: 600, color: i === 0 ? "var(--danger)" : "var(--text-secondary)" }}>
                {day}
              </div>
            ))}
          </div>

          {/* Grid Tanggal */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {/* Ruang kosong untuk hari sebelum tanggal 1 */}
            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            
            {/* Angka Tanggal */}
            {daysInMonth.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const marked = hasEvent(day);

              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  style={{
                    height: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    borderRadius: 8, fontSize: 13, fontWeight: isSelected || isToday ? 700 : 500,
                    background: isSelected ? "var(--primary)" : "transparent",
                    color: isSelected ? "#fff" : isToday ? "var(--primary)" : "var(--text-primary)",
                    border: isToday && !isSelected ? "1px solid var(--primary)" : "1px solid transparent",
                    position: "relative"
                  }}
                >
                  {format(day, "d")}
                  {marked && (
                    <div style={{ 
                      width: 4, height: 4, borderRadius: 2, 
                      background: isSelected ? "#fff" : "var(--primary)", 
                      position: "absolute", bottom: 4 
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Daftar Acara di Tanggal Terpilih */}
        <div className="fade-in" style={{ animationDelay: "0.1s" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarIcon size={16} color="var(--primary)" />
            Acara pada {format(selectedDate, "d MMMM yyyy", { locale: id })}
          </h3>

          {loading ? (
             <div className="skeleton" style={{ height: 60, borderRadius: 8 }} />
          ) : dailyEvents.length === 0 ? (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
              <Info size={24} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
              <p style={{ fontSize: 13 }}>Tidak ada barang yang dibooking pada tanggal ini.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dailyEvents.map((loan) => (
                <div key={loan.id} className="card" style={{ padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Package size={18} color="var(--primary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                      {(loan.items || []).map((item) => `${item.namaBarang} (${item.jumlah})`).join(", ") || `${loan.namaBarang} (${loan.jumlah})`}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Oleh: {loan.namaPeminjam}</div>
                  </div>
                  <div style={{ fontSize: 11, textAlign: "right" }}>
                    <div style={{ color: "var(--text-secondary)", marginBottom: 2 }}>Status</div>
                    <span className={`badge badge-${loan.status === 'dipinjam' ? 'info' : 'warning'}`}>
                      {loan.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
