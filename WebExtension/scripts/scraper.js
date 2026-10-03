export function extractMainText() {
  // Elements to ignore completely
  const ignoreTags = ['NAV', 'HEADER', 'FOOTER', 'ASIDE', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'FORM'];
  
  // Clean clone of body to avoid modifying the active DOM
  const clone = document.body.cloneNode(true);

  // Remove non-content elements
  ignoreTags.forEach(tag => {
    clone.querySelectorAll(tag).forEach(el => el.remove());
  });

  // Remove visually hidden elements
  clone.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || el.offsetWidth === 0) {
      el.remove();
    }
  });

  // Score candidate containers
  const candidates = Array.from(clone.querySelectorAll('article, main, section, div'));
  let bestCandidate = null;
  let maxScore = -1;

  candidates.forEach(el => {
    const text = el.innerText || '';
    const textLength = text.trim().length;
    
    // Skip containers with too little text
    if (textLength < 100) return;

    // Calculate link density (high link density usually means navigation/footer menus)
    const linkTextLength = Array.from(el.querySelectorAll('a'))
      .reduce((acc, a) => acc + (a.innerText || '').length, 0);
    const linkRatio = linkTextLength / textLength;
    
    if (linkRatio > 0.5) return; // Skip link-heavy blocks

    // Score based on paragraph density and raw text length
    const paragraphCount = el.querySelectorAll('p').length;
    const score = (textLength * (1 - linkRatio)) + (paragraphCount * 50);

    if (score > maxScore) {
      maxScore = score;
      bestCandidate = el;
    }
  });

  // Fallback to body text if no clear candidate was found
  const targetElement = bestCandidate || clone;

  // Extract cleaned paragraph text
  const paragraphs = Array.from(targetElement.querySelectorAll('h1, h2, h3, h4, p, li'))
    .map(el => el.innerText.trim())
    .filter(text => text.length > 20); // Filter out short noise

  // Deduplicate and join text
  return [...new Set(paragraphs)].join('\n\n');
}

// Run the extractor
console.log(extractMainText());