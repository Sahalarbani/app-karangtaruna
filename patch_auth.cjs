const fs = require('fs');
const file = '/root/Projects/app-karangtaruna/src/hooks/useAuth.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /await signInWithPopup\(auth, googleProvider\);/g,
  `googleProvider.setCustomParameters({ prompt: 'select_account' });\n      await signInWithPopup(auth, googleProvider);`
);

fs.writeFileSync(file, content);
