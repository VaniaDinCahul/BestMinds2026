const btn = document.getElementById('check-btn');

btn.addEventListener('click', async () => {
console.log("Check button clicked");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['scripts/fact_checker.js'],
    });
  }
});