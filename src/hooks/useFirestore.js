import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Demo data for when Firebase is not configured
const DEMO_ITEMS = [
  { id: "1", nama: "Tenda Kerucut 3x3m", kategori: "Tenda", stok: 5, tersedia: 3, gambar: null, deskripsi: "Tenda kerucut untuk acara outdoor" },
  { id: "2", nama: "Kursi Lipat Plastik", kategori: "Kursi", stok: 100, tersedia: 78, gambar: null, deskripsi: "Kursi lipat plastik putih" },
  { id: "3", nama: "Meja Lipat Panjang", kategori: "Meja", stok: 20, tersedia: 15, gambar: null, deskripsi: "Meja lipat 180cm x 60cm" },
  { id: "4", nama: "Sound System 1000W", kategori: "Elektronik", stok: 2, tersedia: 1, gambar: null, deskripsi: "Sound system lengkap dengan mic wireless" },
  { id: "5", nama: "Toa / Megaphone", kategori: "Elektronik", stok: 3, tersedia: 3, gambar: null, deskripsi: "Megaphone portable dengan sirene" },
  { id: "6", nama: "Terpal 4x6m", kategori: "Tenda", stok: 10, tersedia: 8, gambar: null, deskripsi: "Terpal biru tebal anti air" },
  { id: "7", nama: "Panggung Portable", kategori: "Panggung", stok: 4, tersedia: 4, gambar: null, deskripsi: "Panel panggung 1x2m tinggi 60cm" },
  { id: "8", nama: "Lampu Sorot LED", kategori: "Elektronik", stok: 8, tersedia: 6, gambar: null, deskripsi: "Lampu sorot 100W putih terang" },
  { id: "9", nama: "Dispenser Air", kategori: "Peralatan", stok: 3, tersedia: 2, gambar: null, deskripsi: "Dispenser air panas & dingin" },
  { id: "10", nama: "Dekorasi Set HUT RI", kategori: "Dekorasi", stok: 2, tersedia: 2, gambar: null, deskripsi: "Set dekorasi lengkap tema HUT RI" },
  { id: "11", nama: "Piring Melamin (set 50)", kategori: "Peralatan", stok: 4, tersedia: 3, gambar: null, deskripsi: "Set piring melamin isi 50 pcs" },
  { id: "12", nama: "Gelas Plastik (set 100)", kategori: "Peralatan", stok: 5, tersedia: 5, gambar: null, deskripsi: "Gelas plastik reusable isi 100" },
];

const DEMO_PEMINJAMAN = [
  { id: "p1", namaPeminjam: "RT 05 - Pak Budi", namaBarang: "Tenda Kerucut 3x3m", jumlah: 2, tanggalPinjam: "2026-06-15", tanggalKembali: "2026-06-17", keperluan: "Acara 17 Agustus RT 05", status: "dipinjam", kontak: "081234567890", createdAt: new Date("2026-06-10") },
  { id: "p2", namaPeminjam: "Karang Taruna RW 03", namaBarang: "Sound System 1000W", jumlah: 1, tanggalPinjam: "2026-06-12", tanggalKembali: "2026-06-13", keperluan: "Lomba Karaoke Warga", status: "dipinjam", kontak: "081298765432", createdAt: new Date("2026-06-09") },
  { id: "p3", namaPeminjam: "Ibu PKK RT 02", namaBarang: "Kursi Lipat Plastik", jumlah: 20, tanggalPinjam: "2026-06-08", tanggalKembali: "2026-06-08", keperluan: "Arisan Bulanan", status: "dikembalikan", kontak: "081377889900", createdAt: new Date("2026-06-07") },
  { id: "p4", namaPeminjam: "RT 01 - Pak Ahmad", namaBarang: "Meja Lipat Panjang", jumlah: 5, tanggalPinjam: "2026-06-20", tanggalKembali: "2026-06-21", keperluan: "Bazar Ramadhan", status: "pending", kontak: "081255667788", createdAt: new Date("2026-06-11") },
];

const isDemo = () => {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  return !key || key === "demo-key";
};

const EMPTY_CONSTRAINTS = [];

function getDemoData(collectionName) {
  if (collectionName === "barang") return DEMO_ITEMS;
  if (collectionName === "peminjaman") return DEMO_PEMINJAMAN;
  return [];
}

function toAppError(error, fallback) {
  const message = error?.message || fallback;
  const appError = new Error(message, { cause: error });
  appError.code = error?.code;
  return appError;
}

export function useCollection(collectionName, queryConstraints = EMPTY_CONSTRAINTS) {
  const demoMode = isDemo();
  const [data, setData] = useState(() => (demoMode ? getDemoData(collectionName) : []));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);

    if (demoMode) {
      setData(getDemoData(collectionName));
      setLoading(false);
      return;
    }

    setLoading(true);
    const colRef = collection(db, collectionName);
    const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : colRef;

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Gagal memuat data.");
        setData([]);
        setLoading(false);
      }
    );
    return unsub;
  }, [collectionName, demoMode, queryConstraints]);

  return { data, loading, error };
}

export function useFirestoreActions(collectionName) {
  const addItem = useCallback(
    async (item) => {
      if (isDemo()) {
        return { id: "demo-" + Date.now(), ...item };
      }
      try {
        const ref = await addDoc(collection(db, collectionName), {
          ...item,
          createdAt: serverTimestamp(),
        });
        return { id: ref.id, ...item };
      } catch (error) {
        throw toAppError(error, "Gagal menyimpan data.");
      }
    },
    [collectionName]
  );

  const updateItem = useCallback(
    async (id, updates) => {
      if (isDemo()) return;
      try {
        await updateDoc(doc(db, collectionName, id), updates);
      } catch (error) {
        throw toAppError(error, "Gagal memperbarui data.");
      }
    },
    [collectionName]
  );

  const deleteItem = useCallback(
    async (id) => {
      if (isDemo()) return;
      try {
        await deleteDoc(doc(db, collectionName, id));
      } catch (error) {
        throw toAppError(error, "Gagal menghapus data.");
      }
    },
    [collectionName]
  );

  return { addItem, updateItem, deleteItem };
}
