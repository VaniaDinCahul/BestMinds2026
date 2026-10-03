import { factCheck } from "./fact_checker.js";
import { extractMainText } from "./scraper.js";

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
                factCheck(text)
                    .then(result => {
                        if (result) {
                            console.log("Fact-check result:", result);
                        } else {
                            console.log("Fact-check failed or returned null.");
                        }
                    })
                    .catch(err => {
                        console.error("Error during fact-checking:", err);
                    });
            } else {
                console.log("Extracted text is empty.");
            }
        }
    }
});