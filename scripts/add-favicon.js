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
    console.log(`Skip (already has): ${file}`);
    continue;
  }
  
  // Add after <head> tag
  content = content.replace(/<head>/, `<head>\n${faviconTag}`);
  
  fs.writeFileSync(filePath, content, 'utf8');
  updated++;
  console.log(`Added: ${file}`);
}

console.log(`\nDone! ${updated} pages updated.`);
