const fs = require('fs');
const file = '/root/Projects/app-karangtaruna/src/pages/admin/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace import lucide icons
content = content.replace(
  /import { Settings, Check, X, Package, Trash2, Edit } from "lucide-react";/,
  'import { Settings, Check, X, Package, Trash2, Edit, Printer } from "lucide-react";'
);

// Replace header section
content = content.replace(
  /<div className="page-header">\n\s*<h1>Kelola Sistem<\/h1>\n\s*<p className="page-header-sub">Halaman admin Karang Taruna<\/p>\n\s*<\/div>/,
  `<div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
      </div>`
);

// Add ExportLaporan to the bottom
content = content.replace(
  /<TambahBarangModal open={showTambahBarang} onClose={\(\) => setShowTambahBarang\(false\)} \/>/,
  `<TambahBarangModal open={showTambahBarang} onClose={() => setShowTambahBarang(false)} />\n      <ExportLaporan open={showExport} onClose={() => setShowExport(false)} />`
);

fs.writeFileSync(file, content);
