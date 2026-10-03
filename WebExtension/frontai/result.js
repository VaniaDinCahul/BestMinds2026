window.showFactCheckResult = function (status, verdictText, sources) {

  document.getElementById('factchecker-dot')?.remove();
  document.getElementById('factchecker-result-card')?.remove();

  const theme = {
    red: {
      color: '#ef4444',
      hover: '#dc2626',
      title: 'INFORMAȚIE FALSĂ',
    },
    yellow: {
      color: '#f59e0b',
      hover: '#d97706',
      title: 'NESIGUR',
    },
    green: {
      color: '#10b981',
      hover: '#059669',
      title: 'VERIDIC',
    },
  }[status] || {
    color: '#6b7280',
    hover: '#4b5563',
    title: 'VERIFICARE',
  };
  
  const badge = document.createElement('div');
  badge.id = 'factchecker-dot';
  badge.style.setProperty('--badge-color', theme.color);
  badge.style.setProperty('--badge-hover', theme.hover);
  document.body.appendChild(badge);

  setTimeout(() => badge.classList.add('visible'), 50);

  let sourcesHTML = '';
  if (sources && Object.keys(sources).length > 0) {
    sourcesHTML = `<div class="factchecker-result__sources-head">Surse verificate (Whitelist):</div>`;
    for (const [name, url] of Object.entries(sources)) {
      sourcesHTML += `<a class="factchecker__source-item" href="${url}" target="_blank">${name}</a>`;
    }
  }

  const card = document.createElement('div');
  card.id = 'factchecker-result-card';
  card.style.setProperty('--badge-color', theme.color);
  card.innerHTML = `
        <div class="factchecker-result__title">${theme.title}</div>
        <div class="factchecker-result__text">${verdictText}</div>
        ${sourcesHTML}
        <button class="factchecker__close-btn" id="factchecker-close-btn">Închide [ X ]</button>
    `;
  document.body.appendChild(card);

  badge.onclick = () => card.classList.toggle('active');
  const closeBtn = card.querySelector('#factchecker-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => card.classList.remove('active');
  }
};

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "SHOW_FACT_CHECK_RESULT") {
    const { status, verdictText, sources } = request.payload;
    window.showFactCheckResult(status, verdictText, sources);
  }
});