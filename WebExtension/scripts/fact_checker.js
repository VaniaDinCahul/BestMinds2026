const config = require('./env.json');

function buildPrompt(excerpt) {
  return `You are a fact-checking assistant. Analyze the TEXT below.

Steps:
1. Pick the 2-3 key claims and the main keywords.
2. If the text mentions a date for the events, search for articles from around that date using the keywords. If it 
contains no date, search by keywords only.
3. Use Google Search restricted to these trusted sites: ${config.trustedSites.join(", ")}.
   Consult at most ${config.maxSitesToCheck} of them, choosing the most relevant. Do not visit others.
4. Judge how well the trusted sources support the claims.

Reply with ONLY a JSON object, no other text, no markdown:
{
  "truth_percentage": <integer 0-100, how likely the claims are true>,
  "reasoning": "<1-2 short sentences>",
  "date_used": "<date found in text, or null>"
}
If you cannot find relevant coverage on the trusted sites, set truth_percentage to null and say so in the reasoning.

TEXT:
${excerpt}`;
}

function parseModelJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in reply");
  return JSON.parse(text.slice(start, end + 1));
}

export async function factCheck(pageText) {
  try {
    const excerpt = pageText.slice(0, config.maxChars);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": config.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(excerpt) }] }],
          tools: [{ google_search: {} }],
        }),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map(p => p.text).join("") ?? "";
    const verdict = parseModelJson(text);

    // Sources come from the search metadata, not from the model's text
    const sources = (candidate?.groundingMetadata?.groundingChunks ?? [])
      .map(c => ({ title: c.web?.title, url: c.web?.uri }))
      .filter(s => config.trustedSites.some(d => s.title?.includes(d) || s.url?.includes(d)));

    return { ...verdict, sources };
  } catch (err) {
    console.error("Fact-check failed:", err);
    return null;
  }
}