function renderMarkdown(text) {
  if (!text) return '';
  try {
    let html = text
      .replace(/\$\$\n?([\s\S]*?)\n?\$\$/g, (_, m) => `<div class="katex-display my-4 text-center">\\[${m.trim()}\\]</div>`)
      .replace(/\$(.+?)\$/g, (_, m) => `\\(${m}\\)`)
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-3">$1</h1>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-indigo-600 hover:text-indigo-800 underline">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-2">')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/~~(.+?)~~/g, '<del>$1</del>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-red-600">$1</code>')
      .replace(/\n\n/g, '</p><p class="mt-3">')
      .replace(/\n/g, '<br>');
    return `<div class="prose prose-sm max-w-none text-left text-gray-700 leading-relaxed"><p>${html}</p></div>`;
  } catch (e) {
    return `<pre class="text-sm text-gray-700">${escapeHtml(text)}</pre>`;
  }
}

function renderMarkdownBlock(text) {
  if (!text) return '<p class="text-gray-400 italic">暂无内容</p>';
  return renderMarkdown(text);
}

function renderMathInElement(container) {
  if (typeof katex === 'undefined') return;
  try {
    const walk = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walk.nextNode()) nodes.push(walk.currentNode);
    for (const node of nodes) {
      const text = node.textContent;
      if (!text.includes('\\(') && !text.includes('\\[')) continue;
      const span = document.createElement('span');
      span.innerHTML = text.replace(/\\\((.+?)\\\)/g, (_, tex) => {
        try { return katex.renderToString(tex, { throwOnError: false }); } catch { return tex; }
      }).replace(/\\\[(.+?)\\\]/gs, (_, tex) => {
        try { return katex.renderToString(tex, { displayMode: true, throwOnError: false }); } catch { return tex; }
      });
      node.parentNode.replaceChild(span, node);
    }
  } catch {}
}
