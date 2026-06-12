const fs = require('fs');
const file = '/root/Projects/app-karangtaruna/src/components/BottomNav.jsx';

const content = `import { NavLink } from "react-router-dom";
import { Home, Package, ClipboardList, Settings, PlusCircle, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function BottomNav() {
  const { isAdmin } = useAuth();

  const items = [
    { to: "/", icon: Home, label: "Beranda" },
    { to: "/katalog", icon: Package, label: "Katalog" },
  ];

  if (isAdmin) {
    items.push({ to: "/riwayat", icon: ClipboardList, label: "Riwayat" });
    items.push({ to: "/admin", icon: Settings, label: "Kelola" });
  } else {
    items.push({ to: "/pinjam", icon: PlusCircle, label: "Pinjam" });
    items.push({ to: "/riwayat", icon: ClipboardList, label: "Riwayat" });
  }

  items.push({ to: "/profil", icon: User, label: "Profil" });

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => \`nav-item\${isActive ? " active" : ""}\`}
          end={item.to === "/"}
        >
          <item.icon size={22} strokeWidth={2} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
`;

fs.writeFileSync(file, content);
