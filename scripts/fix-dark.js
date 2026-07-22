const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'frontend', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

// Common replacements: add dark variants to hardcoded classes
const rules = [
  // bg-white cards (not nav)
  [/(?<!dark:bg-gray-800 )class="([^"]*\s)?bg-white(\s[^"]*)?"(?!\s*dark:)/g, (m) => m.replace(/bg-white/g, 'bg-white dark:bg-gray-800')],
  // bg-gray-50 (body already handled, but other elements)
  [/class="([^"]*?)bg-gray-50([^"]*?)"/g, (m) => {
    if (m.includes('dark:bg-gray-900') || m.includes('dark:bg-gray-700')) return m;
    return m.replace(/bg-gray-50/g, 'bg-gray-50 dark:bg-gray-700');
  }],
  // text-gray-900 headings
  [/class="([^"]*?)text-gray-900([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-white')) return m;
    return m.replace(/text-gray-900/g, 'text-gray-900 dark:text-white');
  }],
  // text-gray-700
  [/class="([^"]*?)text-gray-700([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-gray-300')) return m;
    return m.replace(/text-gray-700/g, 'text-gray-700 dark:text-gray-300');
  }],
  // text-gray-600
  [/class="([^"]*?)text-gray-600([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-gray-400')) return m;
    return m.replace(/text-gray-600/g, 'text-gray-600 dark:text-gray-400');
  }],
  // text-gray-500
  [/class="([^"]*?)text-gray-500([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-gray-400')) return m;
    return m.replace(/text-gray-500/g, 'text-gray-500 dark:text-gray-400');
  }],
  // text-gray-400
  [/class="([^"]*?)text-gray-400([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-gray-500')) return m;
    return m.replace(/text-gray-400/g, 'text-gray-400 dark:text-gray-500');
  }],
  // border-gray-100
  [/class="([^"]*?)border-gray-100([^"]*?)"/g, (m) => {
    if (m.includes('dark:border-gray-700')) return m;
    return m.replace(/border-gray-100/g, 'border-gray-100 dark:border-gray-700');
  }],
  // border-gray-200
  [/class="([^"]*?)border-gray-200([^"]*?)"/g, (m) => {
    if (m.includes('dark:border-gray-700') || m.includes('dark:border-gray-600')) return m;
    return m.replace(/border-gray-200/g, 'border-gray-200 dark:border-gray-700');
  }],
  // border-gray-300 (inputs)
  [/class="([^"]*?)border-gray-300([^"]*?)"/g, (m) => {
    if (m.includes('dark:border-gray-600')) return m;
    return m.replace(/border-gray-300/g, 'border-gray-300 dark:border-gray-600');
  }],
  // divide-gray-100
  [/class="([^"]*?)divide-gray-100([^"]*?)"/g, (m) => {
    if (m.includes('dark:divide-gray-700')) return m;
    return m.replace(/divide-gray-100/g, 'divide-gray-100 dark:divide-gray-700');
  }],
  // shadow-sm
  [/class="([^"]*?)shadow-sm([^"]*?)"/g, (m) => {
    if (m.includes('dark:shadow-')) return m;
    return m.replace(/shadow-sm/g, 'shadow-sm dark:shadow-gray-900/30');
  }],
  // bg-green-50, bg-red-50, bg-blue-50, bg-yellow-50, bg-orange-50
  [/class="([^"]*?)bg-green-50([^"]*?)"/g, (m) => {
    if (m.includes('dark:bg-green-900')) return m;
    return m.replace(/bg-green-50/g, 'bg-green-50 dark:bg-green-900/30');
  }],
  [/class="([^"]*?)bg-red-50([^"]*?)"/g, (m) => {
    if (m.includes('dark:bg-red-900')) return m;
    return m.replace(/bg-red-50/g, 'bg-red-50 dark:bg-red-900/30');
  }],
  [/class="([^"]*?)bg-blue-50([^"]*?)"/g, (m) => {
    if (m.includes('dark:bg-blue-900')) return m;
    return m.replace(/bg-blue-50/g, 'bg-blue-50 dark:bg-blue-900/30');
  }],
  [/class="([^"]*?)bg-yellow-50([^"]*?)"/g, (m) => {
    if (m.includes('dark:bg-yellow-900')) return m;
    return m.replace(/bg-yellow-50/g, 'bg-yellow-50 dark:bg-yellow-900/30');
  }],
  [/class="([^"]*?)bg-orange-50([^"]*?)"/g, (m) => {
    if (m.includes('dark:bg-orange-900')) return m;
    return m.replace(/bg-orange-50/g, 'bg-orange-50 dark:bg-orange-900/30');
  }],
  [/class="([^"]*?)bg-purple-50([^"]*?)"/g, (m) => {
    if (m.includes('dark:bg-purple-900')) return m;
    return m.replace(/bg-purple-50/g, 'bg-purple-50 dark:bg-purple-900/30');
  }],
  // bg-indigo-100, bg-green-100, bg-purple-100, bg-blue-100, bg-red-100, bg-yellow-100, bg-orange-100
  [/class="([^"]*?)bg-indigo-100([^"]*?)"/g, (m) => {
    if (m.includes('dark:bg-indigo-900')) return m;
    return m.replace(/bg-indigo-100/g, 'bg-indigo-100 dark:bg-indigo-900/30');
  }],
  [/class="([^"]*?)bg-green-100([^"]*?)"/g, (m) => {
    if (m.includes('dark:bg-green-900')) return m;
    return m.replace(/bg-green-100/g, 'bg-green-100 dark:bg-green-900/30');
  }],
  [/class="([^"]*?)bg-purple-100([^"]*?)"/g, (m) => {
    if (m.includes('dark:bg-purple-900')) return m;
    return m.replace(/bg-purple-100/g, 'bg-purple-100 dark:bg-purple-900/30');
  }],
  [/class="([^"]*?)bg-blue-100([^"]*?)"/g, (m) => {
    if (m.includes('dark:bg-blue-900')) return m;
    return m.replace(/bg-blue-100/g, 'bg-blue-100 dark:bg-blue-900/30');
  }],
  [/class="([^"]*?)bg-red-100([^"]*?)"/g, (m) => {
    if (m.includes('dark:bg-red-900')) return m;
    return m.replace(/bg-red-100/g, 'bg-red-100 dark:bg-red-900/30');
  }],
  [/class="([^"]*?)bg-yellow-100([^"]*?)"/g, (m) => {
    if (m.includes('dark:bg-yellow-900')) return m;
    return m.replace(/bg-yellow-100/g, 'bg-yellow-100 dark:bg-yellow-900/30');
  }],
  [/class="([^"]*?)bg-orange-100([^"]*?)"/g, (m) => {
    if (m.includes('dark:bg-orange-900')) return m;
    return m.replace(/bg-orange-100/g, 'bg-orange-100 dark:bg-orange-900/30');
  }],
  // text-green-600, text-red-600, text-blue-600, text-purple-600, text-orange-600, text-yellow-600, text-indigo-600
  [/class="([^"]*?)text-green-600([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-green-400')) return m;
    return m.replace(/text-green-600/g, 'text-green-600 dark:text-green-400');
  }],
  [/class="([^"]*?)text-red-600([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-red-400')) return m;
    return m.replace(/text-red-600/g, 'text-red-600 dark:text-red-400');
  }],
  [/class="([^"]*?)text-blue-600([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-blue-400')) return m;
    return m.replace(/text-blue-600/g, 'text-blue-600 dark:text-blue-400');
  }],
  [/class="([^"]*?)text-purple-600([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-purple-400')) return m;
    return m.replace(/text-purple-600/g, 'text-purple-600 dark:text-purple-400');
  }],
  [/class="([^"]*?)text-orange-600([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-orange-400')) return m;
    return m.replace(/text-orange-600/g, 'text-orange-600 dark:text-orange-400');
  }],
  [/class="([^"]*?)text-yellow-600([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-yellow-400')) return m;
    return m.replace(/text-yellow-600/g, 'text-yellow-600 dark:text-yellow-400');
  }],
  [/class="([^"]*?)text-indigo-600([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-indigo-400')) return m;
    return m.replace(/text-indigo-600/g, 'text-indigo-600 dark:text-indigo-400');
  }],
  // text-green-700, text-red-700, text-blue-700, text-purple-700, text-yellow-700, text-indigo-700
  [/class="([^"]*?)text-green-700([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-green-300')) return m;
    return m.replace(/text-green-700/g, 'text-green-700 dark:text-green-300');
  }],
  [/class="([^"]*?)text-red-700([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-red-300')) return m;
    return m.replace(/text-red-700/g, 'text-red-700 dark:text-red-300');
  }],
  [/class="([^"]*?)text-blue-700([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-blue-300')) return m;
    return m.replace(/text-blue-700/g, 'text-blue-700 dark:text-blue-300');
  }],
  [/class="([^"]*?)text-purple-700([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-purple-300')) return m;
    return m.replace(/text-purple-700/g, 'text-purple-700 dark:text-purple-300');
  }],
  [/class="([^"]*?)text-yellow-700([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-yellow-300')) return m;
    return m.replace(/text-yellow-700/g, 'text-yellow-700 dark:text-yellow-300');
  }],
  [/class="([^"]*?)text-indigo-700([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-indigo-300')) return m;
    return m.replace(/text-indigo-700/g, 'text-indigo-700 dark:text-indigo-300');
  }],
  // text-orange-700
  [/class="([^"]*?)text-orange-700([^"]*?)"/g, (m) => {
    if (m.includes('dark:text-orange-300')) return m;
    return m.replace(/text-orange-700/g, 'text-orange-700 dark:text-orange-300');
  }],
  // hover:bg-gray-50
  [/class="([^"]*?)hover:bg-gray-50([^"]*?)"/g, (m) => {
    if (m.includes('dark:hover:bg-gray-700')) return m;
    return m.replace(/hover:bg-gray-50/g, 'hover:bg-gray-50 dark:hover:bg-gray-700');
  }],
  // hover:bg-indigo-50
  [/class="([^"]*?)hover:bg-indigo-50([^"]*?)"/g, (m) => {
    if (m.includes('dark:hover:bg-gray-700')) return m;
    return m.replace(/hover:bg-indigo-50/g, 'hover:bg-indigo-50 dark:hover:bg-gray-700');
  }],
  // hover:bg-gray-100
  [/class="([^"]*?)hover:bg-gray-100([^"]*?)"/g, (m) => {
    if (m.includes('dark:hover:bg-gray-700')) return m;
    return m.replace(/hover:bg-gray-100/g, 'hover:bg-gray-100 dark:hover:bg-gray-700');
  }],
  // hover:bg-red-100, hover:bg-green-100, etc
  [/class="([^"]*?)hover:bg-red-100([^"]*?)"/g, (m) => {
    if (m.includes('dark:hover:bg-red-900')) return m;
    return m.replace(/hover:bg-red-100/g, 'hover:bg-red-100 dark:hover:bg-red-900/30');
  }],
  [/class="([^"]*?)hover:bg-green-100([^"]*?)"/g, (m) => {
    if (m.includes('dark:hover:bg-green-900')) return m;
    return m.replace(/hover:bg-green-100/g, 'hover:bg-green-100 dark:hover:bg-green-900/30');
  }],
  [/class="([^"]*?)hover:bg-blue-100([^"]*?)"/g, (m) => {
    if (m.includes('dark:hover:bg-blue-900')) return m;
    return m.replace(/hover:bg-blue-100/g, 'hover:bg-blue-100 dark:hover:bg-blue-900/30');
  }],
  [/class="([^"]*?)hover:bg-indigo-100([^"]*?)"/g, (m) => {
    if (m.includes('dark:hover:bg-indigo-900')) return m;
    return m.replace(/hover:bg-indigo-100/g, 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30');
  }],
  [/class="([^"]*?)hover:bg-purple-200([^"]*?)"/g, (m) => {
    if (m.includes('dark:hover:bg-purple-900')) return m;
    return m.replace(/hover:bg-purple-200/g, 'hover:bg-purple-200 dark:hover:bg-purple-900/30');
  }],
  // pre/code blocks
  [/class="([^"]*?)bg-red-50 text-red-700([^"]*?)"/g, (m) => {
    if (m.includes('dark:bg-red-900')) return m;
    return m.replace(/bg-red-50/g, 'bg-red-50 dark:bg-red-900/30');
  }],
  // input bg handling for all inputs
  [/(class="[^"]*?)border border-gray-300 rounded/g, (m) => {
    if (m.includes('dark:border-gray-600')) return m;
    return m.replace(/border border-gray-300/g, 'border border-gray-300 dark:border-gray-600');
  }],
];

let totalUpdated = 0;
for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [pattern, replacer] of rules) {
    const newContent = content.replace(pattern, replacer);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalUpdated++;
    console.log(`Fixed: ${file}`);
  }
}

console.log(`\nDone! Fixed ${totalUpdated} pages.`);
