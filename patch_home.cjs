const fs = require('fs');
const file = '/root/Projects/app-karangtaruna/src/pages/Home.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /background: "linear-gradient\(135deg, #E85D2A 0%, #F5A623 100%\)",/,
  `background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",`
);

content = content.replace(
  /color: "#E85D2A"/g,
  `color: "var(--primary)"`
);

content = content.replace(
  /color: "#8B5CF6"/g,
  `color: "var(--accent)"`
);

content = content.replace(
  /color: "#F5A623"/g,
  `color: "var(--secondary)"`
);

content = content.replace(
  /bg: "#FFF0EB"/g,
  `bg: "rgba(255, 59, 48, 0.1)"`
);

content = content.replace(
  /bg: "#F3EEFF"/g,
  `bg: "rgba(175, 82, 222, 0.1)"`
);

content = content.replace(
  /bg: "#FFF8EB"/g,
  `bg: "rgba(255, 159, 10, 0.1)"`
);

content = content.replace(
  /bg: "#FEF2F2"/g,
  `bg: "rgba(255, 59, 48, 0.1)"`
);

fs.writeFileSync(file, content);
