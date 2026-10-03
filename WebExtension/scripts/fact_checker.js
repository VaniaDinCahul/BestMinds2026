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