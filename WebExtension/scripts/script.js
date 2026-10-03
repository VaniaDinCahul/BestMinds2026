import { pyodide } from "./pyodide.js";

console.log("Starting the scraping process...");
async function scrapeArticle() {
    try {
        console.log("Loading Pyodide...");
        let pyodide = await loadPyodide();
        console.log("Pyodide loaded successfully!");

        let pageText = await pyodide.runPythonAsync(`
            import js
            body_text = js.document.body.innerText
            cleaned_text = "\\n".join([line.strip() for line in body_text.splitlines() if line.strip()])
        
            cleaned_text
        `);

        console.log("--- Scraped Page Content ---");
        console.log(pageText);

        return pageText;
    } catch (error) {
        console.error("Error occurred during Pyodide execution:", error);
    }
}

scrapeArticle();
