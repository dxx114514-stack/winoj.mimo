const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'frontend', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

const faviconTag = '  <link rel="icon" type="image/svg+xml" href="/favicon.svg">';

let updated = 0;
for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('favicon.svg')) {
    continue;
  }
  
  content = content.replace(
    /(<title>[^<]+<\/title>\n)/,
    `$1${faviconTag}\n`
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  updated++;
  console.log(`Added favicon: ${file}`);
}

console.log(`\nDone! Added favicon to ${updated} pages.`);
