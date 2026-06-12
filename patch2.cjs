const fs = require('fs');
const file = '/root/Projects/app-karangtaruna/src/pages/Home.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>\s*{p.namaBarang}\s*<\/div>\s*<div style={{ fontSize: 12, color: "var\(--text-secondary\)" }}>\s*{p.namaPeminjam} &middot; {p.jumlah} unit\s*<\/div>/g,
  `<div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.keperluan || "Peminjaman Barang"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {p.namaPeminjam} &middot; {p.items?.length || 1} jenis barang
                  </div>`
);

fs.writeFileSync(file, content);
