import { factCheck } from "./fact_checker.js";

// Clean and extract visible text from the page DOM
function extractText() {
    if (!document.body) return "";

    const clone = document.body.cloneNode(true);
    const elementsToRemove = clone.querySelectorAll(
        'script, style, noscript, iframe, header, footer, nav, aside'
    );
    elementsToRemove.forEach(el => el.remove());

    return clone.innerText || clone.textContent || "";
}

// Check if URL is a browser internal page or search engine result page
function isIgnoredUrl(urlString) {
    if (!urlString) return true;

    // Filter browser protocols & internal extension pages
    if (
        urlString.startsWith("chrome://") || 
        urlString.startsWith("chrome-extension://") || 
        urlString.startsWith("moz-extension://") || 
        urlString.startsWith("edge://") || 
        urlString.startsWith("about:")
    ) {
        return true;
    }

    try {
        const parsedUrl = new URL(urlString);
        const host = parsedUrl.hostname.toLowerCase();
        const path = parsedUrl.pathname.toLowerCase();

        // Block Google Search results pages across all TLDs (google.com, google.co.uk, etc.)
        if (host.includes("google.") && path.startsWith("/search")) {
            return true;
        }

        // Optional: Block other common search engines
        if (
            (host.includes("bing.com") && path.startsWith("/search")) ||
            host.includes("duckduckgo.com")
        ) {
            return true;
        }
    } catch (e) {
        return true; // Invalid URL
    }

    return false;
}

// Execute script inside the active tab if valid
async function scrapeTab(tabId, tab) {
    if (isIgnoredUrl(tab.url)) {
        return null;
    }

    try {
        const api = typeof browser !== "undefined" ? browser : chrome;
        const results = await api.scripting.executeScript({
            target: { tabId: tabId },
            func: extractText,
        });

        if (results && results[0] && results[0].result !== undefined) {
            console.log("Success scraping tab:", tabId);
            return results[0].result;
        }
    } catch (error) {
        console.error("Scraping execution error:", error);
        return null;
    }
}

// Browser extension listener
const extensionApi = typeof browser !== "undefined" ? browser : chrome;
let lastUrl = null;
let count = 0;

extensionApi.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab && tab.url) {
        if (isIgnoredUrl(tab.url)) return;

        console.log(tabId, tab.url);

        if (tab.url !== lastUrl) {
            lastUrl = tab.url;
            count = 0;
            console.log("New page detected, resetting count.");
        }

        if (count < 2) {
            count++;
            const text = await scrapeTab(tabId, tab);

            if (text) {
                console.log("Extracted text length:", text.length);
                factCheck(text).then(result => {
                    console.log("Fact-check result:", result);
                    if (!result) return;

                    // truth_percentage -> color
                    const p = result.truth_percentage;
                    let status = "yellow";                 // null / unknown
                    if (typeof p === "number") {
                        if (p >= 75) status = "green";
                        else if (p <= 40) status = "red";
                    }

                    // sources: array -> { name: url }
                    const sources = {};
                    (result.sources || []).forEach((s, i) => {
                        if (typeof s === "string") {
                            try { sources[new URL(s).hostname] = s; } catch { sources[`Sursa ${i + 1}`] = s; }
                        } else if (s && s.url) {
                            sources[s.name || s.title || new URL(s.url).hostname] = s.url;
                        }
                    });

                    const pct = typeof p === "number" ? `${p}%` : "necunoscut";
                    const verdictText = `Procent de adevăr: ${pct}. ${result.reasoning || ""}`;

                    return extensionApi.tabs.sendMessage(tabId, {
                        action: "SHOW_FACT_CHECK_RESULT",
                        payload: { status, verdictText, sources }
                    });
                }).catch(err => {
                    console.error("Fact-check / sendMessage failed:", err);
                });
            }
        }
    }
});