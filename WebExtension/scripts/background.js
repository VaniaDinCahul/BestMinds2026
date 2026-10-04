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

// ---------- Browser extension listener ----------
const extensionApi = typeof browser !== "undefined" ? browser : chrome;
const DWELL_MS = 10000;               // how long the user must stay on the page
const handledUrls = new Map();        // tabId -> last URL handled

// Keeps the service worker alive while we wait (Chrome kills idle workers after ~30s)
async function withKeepAlive(fn) {
    const timer = setInterval(() => extensionApi.runtime.getPlatformInfo(), 20000);
    try {
        return await fn();
    } finally {
        clearInterval(timer);
    }
}

// Sends a message to the page; injects the content script if it isn't there yet
async function sendToTab(tabId, payload) {
    const msg = { action: "SHOW_FACT_CHECK_RESULT", payload };
    try {
        await extensionApi.tabs.sendMessage(tabId, msg);
    } catch {
        await extensionApi.scripting.insertCSS({ target: { tabId }, files: ["frontai/styles.css"] });
        await extensionApi.scripting.executeScript({ target: { tabId }, files: ["frontai/result.js"] });
        await extensionApi.tabs.sendMessage(tabId, msg);
    }
}

// Converts your factCheck() result into what result.js expects
function toPayload(result) {
    const p = result.truth_percentage;
    let status = "yellow";
    if (typeof p === "number") {
        if (p >= 75) status = "green";
        else if (p <= 40) status = "red";
    }

    const sources = {};
    (result.sources || []).forEach((s, i) => {
        if (typeof s === "string") {
            try { sources[new URL(s).hostname] = s; } catch { sources[`Sursa ${i + 1}`] = s; }
        } else if (s && s.url) {
            sources[s.name || s.title || new URL(s.url).hostname] = s.url;
        }
    });

    const pct = typeof p === "number" ? `${p}%` : "necunoscut";
    return { status, verdictText: `Procent de adevăr: ${pct}. ${result.reasoning || ""}`, sources };
}

extensionApi.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete" || !tab?.url) return;
    if (isIgnoredUrl(tab.url)) return;
    if (handledUrls.get(tabId) === tab.url) return;   // already handled this page
    handledUrls.set(tabId, tab.url);

    const startUrl = tab.url;
    console.log("Page detected:", tabId, startUrl);

    try {
        await withKeepAlive(async () => {
            // 1) instant gray dot so the user sees the extension is working
            await sendToTab(tabId, { status: "loading", verdictText: "Se verifică pagina...", sources: {} });

            // 2) dwell time
            await new Promise(r => setTimeout(r, DWELL_MS));

            // 3) user left the page during the wait? stop
            const current = await extensionApi.tabs.get(tabId);
            if (current.url !== startUrl) {
                console.log("User left the page, skipping.");
                return;
            }

            // 4) scrape + fact-check
            const text = await scrapeTab(tabId, current);
            if (!text) return;
            console.log("Extracted text length:", text.length);

            const result = await factCheck(text);
            console.log("Fact-check result:", result);

            if (!result) {
                await sendToTab(tabId, {
                    status: "yellow",
                    verdictText: "Verificarea a eșuat (serviciul AI este ocupat). Reîncarcă pagina pentru a reîncerca.",
                    sources: {}
                });
                return;
            }

            // 5) show the real result
            await sendToTab(tabId, toPayload(result));
        });
    } catch (err) {
        console.error("Fact-check flow failed:", err);
    }
});

extensionApi.tabs.onRemoved.addListener(tabId => handledUrls.delete(tabId));