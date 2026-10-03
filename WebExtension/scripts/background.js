function extractText(){
    const clone = document.body.cloneNode(true);
    const elementsToRemove = clone.querySelectorAll('script, style, noscript, iframe, header, footer, nav, aside');
    elementsToRemove.forEach(el => el.remove());
    const textContent = clone.innerText;
    return textContent;
}

async function scrapeTab(){
    if (!url || startsWith(url, "chrome://") || startsWith(url, "chrome-extension://")) {
    return;
    }
    try {
        const[{result: pageText}] = await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            func: extractText,
        });
        console.log("scraping");
        console.log(pageText);
        return pageText;
    }
    catch (error) {
        console.error("error:", error);
    }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        scrapeTab(tabId, tab.url);
    }
});