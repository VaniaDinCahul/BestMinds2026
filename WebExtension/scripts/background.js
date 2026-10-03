function extractText() {
    if (!document.body) return "";

    const clone = document.body.cloneNode(true);
    const elementsToRemove = clone.querySelectorAll(
        'script, style, noscript, iframe, header, footer, nav, aside'
    );
    elementsToRemove.forEach(el => el.remove());

    return clone.innerText || clone.textContent || "";
}

async function scrapeTab(tabId, tab) {
    if (!tab.url || 
        tab.url.startsWith("chrome://") || 
        tab.url.startsWith("chrome-extension://") || 
        tab.url.startsWith("moz-extension://") || 
        tab.url.startsWith("about:")) {
        return null;
    }

    try {
        const api = typeof browser !== "undefined" ? browser : chrome;
        const results = await api.scripting.executeScript({
            target: { tabId: tabId },
            func: extractText,
        });

        if (results && results[0] && results[0].result !== undefined) {
            console.log("success", tabId);
            return results[0].result;
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}

const extensionApi = typeof browser !== "undefined" ? browser : chrome;
lastPageID = null;
count = 0;

extensionApi.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab && tab.url) {
        console.log(tabId, tab.url);
        lastPageID = tabId;

        if (tabId != lastPageID) {
            lastPageID = tabId;
            count = 0;
        }

        if (count < 2) {
            count++;
            const text = await scrapeTab(tabId, tab);
        
        if (text) {
            console.log("len:", text.length);
            console.log(text.substring(0, 150));
        } else {
            console.log("0 text");
        }
        }
    }
});