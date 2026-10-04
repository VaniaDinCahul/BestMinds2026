async function getConfig() {
  const api = typeof browser !== "undefined" ? browser : chrome;
  const res = await fetch(api.runtime.getURL("env.json"));
  return await res.json();
}

const tools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search trusted news sites for independent coverage of a claim.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Short search query" } },
        required: ["query"],
      },
    },
  },
];

const hostOf = url => new URL(url).hostname.replace(/^www\./, "");

function onWhitelist(url, whitelist) {
  try {
    const h = hostOf(url);
    return whitelist.some(d => h === d || h.endsWith("." + d));
  } catch {
    return false;
  }
}

async function fetchWithRetry(url, options, tries = 3, timeoutMs = 40000) {
  for (let i = 0; i < tries; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: ctrl.signal });
      if (res.status !== 503 && res.status !== 429) return res;
    } catch (e) {
      if (i === tries - 1) throw e;
    } finally {
      clearTimeout(timer);
    }
    await new Promise(r => setTimeout(r, 1500 * (i + 1)));
  }
  throw new Error("Service unavailable after retries");
}

// Your code runs the search; results never include the article's own site
function decodeXml(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .trim();
}

async function runSearch(query, config, pageHost) {
  const whitelist = config.WHITELIST || [];
  const domains = whitelist.filter(d => d !== pageHost);
  if (domains.length === 0) return [];

  const res = await fetchWithRetry("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      topic: "news",
      include_domains: domains,
      max_results: 5,
    }),
  }, 2, 15000);

  console.log("Search status:", res.status);
  if (!res.ok) throw new Error(`Search HTTP ${res.status}`);

  const data = await res.json();
  return (data.results || [])
    .filter(r => onWhitelist(r.url, whitelist) && hostOf(r.url) !== pageHost)
    .map(r => ({
      name: hostOf(r.url),
      url: r.url,
      title: r.title,
      snippet: (r.content || "").slice(0, 400),
    }));
}
    
function buildPrompt(excerpt, whitelist, pageHost) {
  const today = new Date().toISOString().slice(0, 10);
  return `You are a fact-checking assistant. Today's date is ${today}.
Your training data ends earlier, so a date after your cutoff does NOT make an article fictional.

Steps:
1. Pick the 2-3 key claims of the TEXT.
2. Call the web_search tool with a short query to look for independent coverage. It only searches trusted sites (${whitelist.join(", ")}) and never the article's own site (${pageHost}).
3. Judge the claims only against the search results.
4. If the results are missing or unrelated, set truth_percentage to null. Use 0 only when a trusted source clearly contradicts the claims.
5. Do not make up information. Reasoning must be in Romanian only.

When you are done, output ONLY this JSON object, no other text, no markdown:
{
  "truth_percentage": <integer 0-100, or null>,
  "reasoning": "<1-5 short sentences>",
  "date_used": "<date found in text, or null>"
}

TEXT:
${excerpt}`;
}

function parseModelJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in reply: " + text.slice(0, 300));
  return JSON.parse(text.slice(start, end + 1));
}

export async function factCheck(pageText, pageUrl = "") {
  try {
    const config = await getConfig();
    const whitelist = config.WHITELIST || [];
    const pageHost = pageUrl ? hostOf(pageUrl) : "";
    const excerpt = pageText.slice(0, config.maxChars);
    const model = config.MODEL || "deepseek-v4-flash";

    const messages = [
      { role: "system", content: "You are a fact-checker. Use web_search, then answer with JSON only." },
      { role: "user", content: buildPrompt(excerpt, whitelist, pageHost) },
    ];

    const found = new Map();
    const MAX_ROUNDS = 4;
    let finalText = "";

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const body = { model, messages };
      if (round < MAX_ROUNDS - 1) body.tools = tools;   // last round: no tools, force the answer

      const res = await fetchWithRetry("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

      const data = await res.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) throw new Error("Empty model reply");
      messages.push(msg);

      if (msg.tool_calls?.length) {
        for (const call of msg.tool_calls) {
          let result;
          try {
            const args = JSON.parse(call.function.arguments);
            console.log("Searching:", args.query);
            const results = await runSearch(args.query, config, pageHost);
            results.forEach(r => found.set(r.url, r));
            result = JSON.stringify(results);
          } catch (e) {
            result = JSON.stringify({ error: String(e) });
          }
          messages.push({ role: "tool", tool_call_id: call.id, content: result });
        }
        continue;   // let the model read the results
      }

      finalText = msg.content ?? "";
      break;
    }

    const verdict = parseModelJson(finalText);
    const sources = [...found.values()].map(s => ({ name: s.name, url: s.url }));

    if (sources.length === 0 && verdict.truth_percentage !== null) {
      verdict.truth_percentage = null;
      verdict.reasoning = "Nu s-au găsit surse independente pentru a confirma sau infirma. " + (verdict.reasoning || "");
    }

    return { ...verdict, sources };
  } catch (err) {
    console.error("Fact-check failed:", err);
    return null;
  }
}