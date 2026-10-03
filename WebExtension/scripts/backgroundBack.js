// import fact checker
import {factCheck} from "./fact_checker.js";
import { extractMainText } from "./scraper.js";

// daca nu este gol atunci continua și copie pagina și scoate tot ce este nenecesar
function extractText() {
    if (!document.body) return "";

    const clone = document.body.cloneNode(true);
    const elementsToRemove = clone.querySelectorAll(
        'script, style, noscript, iframe, header, footer, nav, aside'
    );
    elementsToRemove.forEach(el => el.remove());

    return clone.innerText || clone.textContent || "";
}

//  verifică dacă pagina este validă și dacă nu este o pagină de extensie sau de browser, apoi extrage textul și îl trimite la fact checker
async function scrapeTab(tabId, tab) {
    if (!tab.url || 
        urlString.startsWith("chrome://") || 
        urlString.startsWith("chrome-extension://") || 
        urlString.startsWith("moz-extension://") || 
        urlString.startsWith("edge://") || 
        urlString.startsWith("about:")
    ) {
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

// ppentru a functiona si pe chrome și pe firefox, folosim api-ul corespunzator
const extensionApi = typeof browser !== "undefined" ? browser : chrome;
let lasturl = null;
let count = 0;

// la fiecare schimbare de url verifică dacă a fost analziat și dacă nu a fost, atunci analizează-l
extensionApi.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab && tab.url) {
        console.log(tabId, tab.url);

        if (tab.url != lasturl) {
            lasturl = tab.url;
            count = 0;
            console.log("New page detected, resetting count.");
        }

        if (count < 2) {
            count++;
            const text = await scrapeTab(tabId, tab);
        
        if (text) {
            console.log("len:", text.length);
            factCheck(text).then(result => {
                if (result) {
                    console.log("Fact-check result:", result);
                } else {
                    console.log("Fact-check failed or returned null.");
                }
            }).catch(err => {
                console.error("Error during fact-checking:", err);
            });

        } else {
            console.log("0 text");
        }
        }
    }
});


// extensionApi.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
//     if (changeInfo.status === 'complete' && tab && tab.url) {
//         extractMainText()
//     }
// });
