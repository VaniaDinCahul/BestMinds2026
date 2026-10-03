import { pyodide } from "./pyodide.js";

async function loadPyodideAndPackages() {
  let pyodide = await loadPyodide();

  await pyodide.runPyodide(`
    import`)

}