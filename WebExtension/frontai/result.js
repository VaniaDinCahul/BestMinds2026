window.showFactCheckResult = function (status, verdictText, sources) {
  const theme = {
    red: {
      color: '#ef4444',
      hover: '#dc2626',
      title: '🔴 FAKE / INFORMAȚIE FALSĂ',
    },
    yellow: {
      color: '#f59e0b',
      hover: '#d97706',
      title: '🟡 SUSPECT / NESIGUR',
    },
    green: {
      color: '#10b981',
      hover: '#059669',
      title: '🟢 VERIDIC / VERIFICAT',
    },
  }[status] || {
    color: '#6b7280',
    hover: '#4b5563',
    title: '⚪ VERIFICARE',
  };

  const style = document.createElement('style');
  style.innerHTML = `
        #fc-badge-dot {
            position: fixed;
            top: 180px;
            right: 20px;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: ${theme.color};
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
            z-index: 9999999;
            opacity: 0;
            transform: scale(0.3);
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        #fc-badge-dot.visible {
            opacity: 1;
            transform: scale(1);
        }
        #fc-badge-dot:hover {
            transform: scale(1.18);
            background: ${theme.hover};
        }

        #fc-result-card {
            position: fixed;
            top: 220px;
            right: -420px;
            width: 360px;
            background: #18181b;
            color: #ffffff;
            border-radius: 14px;
            border: 1px solid #27272a;
            padding: 20px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
            z-index: 9999999;
            font-family: 'Segoe UI', Arial, sans-serif;
            transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        #fc-result-card.active { right: 20px; }
        .fc-res-title {
            font-size: 15px;
            font-weight: 700;
            color: ${theme.color};
            margin-bottom: 10px;
        }
        .fc-res-text {
            font-size: 13px;
            color: #d4d4d8;
            line-height: 1.5;
            margin-bottom: 16px;
        }
        .fc-res-sources-head {
            font-size: 12px;
            font-weight: 600;
            color: #a1a1aa;
            margin-bottom: 8px;
        }
        .fc-source-item {
            display: block;
            color: #60a5fa;
            text-decoration: none;
            font-size: 13px;
            margin-bottom: 6px;
            word-break: break-all;
        }
        .fc-source-item:hover { text-decoration: underline; }
        .fc-close-btn {
            width: 100%;
            margin-top: 14px;
            background: #27272a;
            color: #ffffff;
            border: none;
            padding: 8px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            transition: background 0.2s;
        }
        .fc-close-btn:hover { background: #3f3f46; }
    `;
  document.head.appendChild(style);

  const badge = document.createElement('div');
  badge.id = 'fc-badge-dot';
  document.body.appendChild(badge);
  setTimeout(() => badge.classList.add('visible'), 200);

  let sourcesHTML = '';
  if (sources && Object.keys(sources).length > 0) {
    sourcesHTML = `<div class="fc-res-sources-head">Surse verificate (Whitelist):</div>`;
    for (const [name, url] of Object.entries(sources)) {
      sourcesHTML += `<a class="fc-source-link fc-source-item" href="${url}" target="_blank">🔗 ${name}</a>`;
    }
  }

  const card = document.createElement('div');
  card.id = 'fc-result-card';
  card.innerHTML = `
        <div class="fc-res-title">${theme.title}</div>
        <div class="fc-res-text">${verdictText}</div>
        ${sourcesHTML}
        <button class="fc-close-btn" id="fc-close-card-btn">Închide [ X ]</button>
    `;
  document.body.appendChild(card);

  badge.onclick = () => card.classList.toggle('active');
  document.getElementById('fc-close-card-btn').onclick = () =>
    card.classList.remove('active');
};