const fs = require('fs');

const appFile = '/root/Projects/app-karangtaruna/src/App.jsx';

const content = `import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import { ToastProvider, useToast } from "./components/Toast";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ThemeProvider } from "./hooks/useTheme";
import Home from "./pages/Home";
import Katalog from "./pages/Katalog";
import FormPinjam from "./pages/FormPinjam";
import Riwayat from "./pages/Riwayat";
import Jadwal from "./pages/Jadwal";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Profile from "./pages/Profile";

function AppShell({ children }) {
  return (
    <div className="app-shell">
      {children}
      <BottomNav />
    </div>
  );
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  const showToast = useToast();
  
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      showToast("Akses Khusus Admin: Silakan login sebagai pengurus.", "error");
    }
  }, [user, isAdmin, loading, showToast]);
  
  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/profil" replace />;
  return children;
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const showToast = useToast();
  
  useEffect(() => {
    if (!loading && !user) {
      showToast("Anda harus login dulu untuk mengakses menu ini.", "info");
    }
  }, [user, loading, showToast]);
  
  if (loading) return null;
  if (!user) return <Navigate to="/profil" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppShell>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/katalog" element={<Katalog />} />
                <Route path="/jadwal" element={<Jadwal />} />
                <Route path="/pinjam" element={
                  <PrivateRoute><FormPinjam /></PrivateRoute>
                } />
                <Route path="/riwayat" element={
                  <PrivateRoute><Riwayat /></PrivateRoute>
                } />
                <Route path="/profil" element={<Profile />} />
                <Route path="/admin" element={
                  <AdminRoute><AdminDashboard /></AdminRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
`;

fs.writeFileSync(appFile, content);
