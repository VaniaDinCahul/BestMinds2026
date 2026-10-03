(function () {
  const style = document.createElement('style');
  style.innerHTML = `
        #fc-prompt-box {
            position: fixed;
            top: 20px;
            right: -360px;
            width: 320px;
            background: #18181b;
            color: #f4f4f5;
            border: 1px solid #27272a;
            border-radius: 12px;
            padding: 18px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            z-index: 9999999;
            font-family: 'Segoe UI', Arial, sans-serif;
            transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        #fc-prompt-box.active {
            right: 20px;
        }
        .fc-prompt-title {
            font-weight: 600;
            font-size: 15px;
            margin-bottom: 8px;
            color: #ffffff;
        }
        .fc-prompt-desc {
            font-size: 13px;
            color: #a1a1aa;
            margin-bottom: 16px;
            line-height: 1.4;
        }
        .fc-prompt-btns {
            display: flex;
            gap: 10px;
        }
        .fc-btn-yes {
            flex: 1;
            background: #2563eb;
            color: #ffffff;
            border: none;
            padding: 9px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            transition: background 0.2s;
        }
        .fc-btn-yes:hover { background: #1d4ed8; }
        .fc-btn-no {
            background: #27272a;
            color: #a1a1aa;
            border: none;
            padding: 9px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            transition: background 0.2s, color 0.2s;
        }
        .fc-btn-no:hover { background: #3f3f46; color: #ffffff; }
    `;
  document.head.appendChild(style);

  const box = document.createElement('div');
  box.id = 'fc-prompt-box';
  box.innerHTML = `
        <div class="fc-prompt-title">Doriți să verificați știrea?</div>
        <div class="fc-prompt-desc">Verificați veridicitatea informațiilor de pe această pagină cu ajutorul surselor oficiale.</div>
        <div class="fc-prompt-btns">
            <button class="fc-btn-yes" id="fc-start-btn">Da, verifică</button>
            <button class="fc-btn-no" id="fc-cancel-btn">Nu</button>
        </div>
    `;
  document.body.appendChild(box);

  setTimeout(() => box.classList.add('active'), 1000);

  document.getElementById('fc-cancel-btn').onclick = () => {
    box.classList.remove('active');
    setTimeout(() => box.remove(), 400);
  };

  document.getElementById('fc-start-btn').onclick = () => {
    box.classList.remove('active');
    setTimeout(() => {
      box.remove();
      console.log('FactChecker: Analiza a fost lansată de backend...');
    }, 400);
  };
})();