// // supabase/functions/ai-search/index.ts

// // AI-powered tender search — Supabase Edge Function.
// // Faithful port of tender_ai_search.py (3 independent keyword passes).

// //   query
// //     |-- PASS 1  Gemini keywords (literal)   -> DB ilike OR query -> collect
// //     |-- PASS 2  Gemini keywords (synonyms)  -> DB ilike OR query -> collect
// //     |-- PASS 3  Gemini keywords (broader)   -> DB ilike OR query -> collect
// //     |     (each pass is an independent, stateless Gemini call)
// //     |     (rows accumulate in one Map, deduped on tender_id)
// //     `-- FINAL   Gemini reads the deduped candidates + query -> relevant ones

// // Secrets (set with: supabase secrets set NAME=value):
// //   GEMINI_API_KEY        required
// //   GEMINI_MODEL          optional (default below)
// // Auto-injected by Supabase (no need to set):
// //   SUPABASE_URL, SUPABASE_ANON_KEY

// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// const TABLE = "all_tenders";
// const SELECT_COLS =
//   "tender_id,portal,organisation_name,title,epublished_date,closing_date,detail_link";
// const PER_PASS_LIMIT = 500;
// const MAX_CANDIDATES = 500;

// const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.6-flash";
// const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

// const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// // CORS so the browser can call this function.
// const CORS = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers":
//     "authorization, x-client-info, apikey, content-type",
//   "Access-Control-Allow-Methods": "POST, OPTIONS",
// };

// // --------------------------------------------------------------------------- //
// // Prompts (identical text to the Python version)
// // --------------------------------------------------------------------------- //

// const KEYWORD_SYSTEM_PROMPT = `You generate search keywords for a database of Indian government and public-sector
// procurement tenders (CPPP / eprocure.gov.in and state NIC e-procurement portals).

// HOW THE DATA LOOKS
// Each tender has a Title, an Organisation Name, and an Organisation Chain. Titles are
// written by government departments: terse, heavily abbreviated, inconsistent spelling,
// Indian/British English, full of domain jargon.

// HOW MATCHING WORKS
// Your keywords are used for literal, case-insensitive substring matching
// (SQL ILIKE '%keyword%') against the title and organisation text. There is NO semantic
// understanding at this stage. A keyword finds a tender ONLY if that exact run of
// characters physically appears in the text. This is the single most important thing to
// internalise.

// YOUR TASK
// Given the user's query, output short keywords that are LIKELY TO LITERALLY APPEAR in the
// title or organisation name of a matching tender.

// RULES
// - Keep every keyword SHORT: one word, or at most two. Long phrases almost never match.
// - Give abbreviations AND their expansions: "ev" and "electric vehicle", "stp" and
//   "sewage treatment", "o&m" and "operation and maintenance", "pmc" and "project
//   management consultancy", "wtp" and "water treatment".
// - Use Indian/British spellings and variants: "tyre", "programme", "labour", "kilometre".
// - Include the synonyms a government drafter might actually type.
// - Prefer distinctive terms. Avoid words so generic they match almost everything —
//   "supply", "work", "services", "tender", "procurement", "notice" — unless that word IS
//   the subject of the query.
// - Beware dangerous short substrings: "bus" is inside "business", "ola" inside "solar".
// - Stay strictly inside the user's query. Do not drift to adjacent topics.

// OUTPUT
// Return ONLY a JSON array of lowercase strings. No prose, no explanation, no code fences.
// Example: ["electric bus", "e-bus", "battery bus", "ev bus"]`;

// const PASS_LENSES: Record<number, string> = {
//   1: "PASS 1 — Focus on the most direct, literal terms naming the core subject of the query.",
//   2: "PASS 2 — Focus on abbreviations, expansions, alternate spellings and synonyms: different WORDS for the same thing. Find the less-obvious phrasings a department might use.",
//   3: "PASS 3 — Focus on broader category terms and closely related items that would still genuinely answer the query: the umbrella terms and adjacent service/equipment names a tender like this might be filed under.",
// };

// const FILTER_SYSTEM_PROMPT = `You are a relevance filter for Indian government procurement tenders.

// SITUATION
// A user asked a question. A keyword search returned a set of CANDIDATE tenders. That search
// was loose substring matching, so the list contains BOTH genuinely relevant tenders AND
// false positives — e.g. the keyword "bus" also matched "business", "ola" matched "solar".
// Your job is to read the candidates and return only the ones that truly match the user's
// intent.

// RULES
// - Judge each candidate against the user's ACTUAL intent, not against whether some keyword
//   happened to appear in it.
// - You may ONLY select from the candidates provided. Never invent, guess, or add a tender
//   that is not in the list. Never alter any tender's details.
// - Drop coincidental substring matches that have nothing to do with the query.
// - If a tender is borderline but plausibly relevant, include it and flag the uncertainty.
// - If NONE of the candidates are relevant, return an empty array. Do not force matches.
// - Order results best-match-first.

// OUTPUT
// Return a JSON array, best match first, each item:
//   { "tender_id": "<exact id from the candidate>", "reason": "<one line on why it matches>" }
// If nothing matches, return: []`;

// // --------------------------------------------------------------------------- //
// // Gemini
// // --------------------------------------------------------------------------- //

// async function geminiJSON(
//   systemPrompt: string,
//   userText: string,
//   temperature: number,
// ): Promise<unknown> {
//   const url =
//     `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
//   const body = {
//     system_instruction: { parts: [{ text: systemPrompt }] },
//     contents: [{ parts: [{ text: userText }] }],
//     generationConfig: {
//       temperature,
//       responseMimeType: "application/json",
//     },
//   };
//   const resp = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "x-goog-api-key": GEMINI_API_KEY,
//     },
//     body: JSON.stringify(body),
//   });
//   const data = await resp.json();
//   const text: string =
//     data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
//   return extractJSON(text);
// }

// function extractJSON(text: string): unknown {
//   let t = (text ?? "").trim();
//   t = t.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
//   try {
//     const parsed = JSON.parse(t);
//     // unwrap {"keywords":[...]} / {"results":[...]} style objects
//     if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
//       for (const v of Object.values(parsed)) if (Array.isArray(v)) return v;
//     }
//     return parsed;
//   } catch {
//     const m = t.match(/\[[\s\S]*\]/);
//     if (m) {
//       try {
//         return JSON.parse(m[0]);
//       } catch { /* fall through */ }
//     }
//   }
//   return null;
// }

// function sanitizeKeyword(kw: string): string {
//   return kw
//     .trim()
//     .toLowerCase()
//     .replace(/[,()%*]/g, " ")
//     .replace(/\s+/g, " ")
//     .trim();
// }

// async function generateKeywords(
//   query: string,
//   passNo: number,
// ): Promise<string[]> {
//   const system = KEYWORD_SYSTEM_PROMPT + "\n\n" + PASS_LENSES[passNo];
//   const data = await geminiJSON(system, query, 0.7);
//   if (!Array.isArray(data)) return [];
//   const seen = new Set<string>();
//   const out: string[] = [];
//   for (const k of data) {
//     const kw = sanitizeKeyword(String(k));
//     if (kw && !seen.has(kw)) {
//       seen.add(kw);
//       out.push(kw);
//     }
//   }
//   return out;
// }

// // --------------------------------------------------------------------------- //
// // Supabase query (one OR of ilike conditions per pass)
// // --------------------------------------------------------------------------- //

// async function queryByKeywords(keywords: string[]): Promise<any[]> {
//   if (keywords.length === 0) return [];
//   const conditions: string[] = [];
//   for (const kw of keywords) {
//     conditions.push(`title.ilike.%${kw}%`);
//     conditions.push(`organisation_name.ilike.%${kw}%`);
//   }
//   const { data, error } = await supabase
//     .from(TABLE)
//     .select(SELECT_COLS)
//     .or(conditions.join(","))
//     .limit(PER_PASS_LIMIT);
//   if (error) {
//     console.error("Supabase query error:", error.message);
//     return [];
//   }
//   return data ?? [];
// }

// // --------------------------------------------------------------------------- //
// // Orchestration
// // --------------------------------------------------------------------------- //

// async function runSearch(query: string) {
//   const store = new Map<string, any>(); // tender_id -> row
//   const passInfo: { pass: number; keywords: string[]; rows: number }[] = [];

//   for (const passNo of [1, 2, 3]) {
//     const keywords = await generateKeywords(query, passNo);
//     const rows = await queryByKeywords(keywords);
//     for (const row of rows) {
//       const tid = row.tender_id;
//       if (tid && !store.has(tid)) store.set(tid, row);
//     }
//     passInfo.push({ pass: passNo, keywords, rows: rows.length });
//   }

//   let candidates = [...store.values()];
//   if (candidates.length === 0) {
//     return { results: [], passInfo, candidateCount: 0 };
//   }
//   if (candidates.length > MAX_CANDIDATES) {
//     candidates = candidates.slice(0, MAX_CANDIDATES);
//   }

//   const lines = candidates.map((c) =>
//     JSON.stringify({
//       tender_id: c.tender_id,
//       title: c.title ?? "",
//       organisation: c.organisation_name ?? "",
//       portal: c.portal ?? "",
//     })
//   );
//   const payload =
//     `USER QUERY:\n${query}\n\nCANDIDATE TENDERS (${candidates.length}):\n` +
//     lines.join("\n");

//   const selections = await geminiJSON(FILTER_SYSTEM_PROMPT, payload, 0.1);
//   const results: any[] = [];
//   if (Array.isArray(selections)) {
//     for (const sel of selections) {
//       const row = store.get(sel?.tender_id);
//       if (row) results.push({ ...row, reason: sel?.reason ?? "" });
//     }
//   }
//   return { results, passInfo, candidateCount: candidates.length };
// }

// // --------------------------------------------------------------------------- //
// // HTTP handler
// // --------------------------------------------------------------------------- //

// Deno.serve(async (req) => {
//   if (req.method === "OPTIONS") {
//     return new Response("ok", { headers: CORS });
//   }
//   try {
//     const { query } = await req.json();
//     if (!query || typeof query !== "string" || !query.trim()) {
//       return new Response(
//         JSON.stringify({ error: "Missing 'query' string in body." }),
//         { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
//       );
//     }
//     const out = await runSearch(query.trim());
//     return new Response(JSON.stringify(out), {
//       headers: { ...CORS, "Content-Type": "application/json" },
//     });
//   } catch (e) {
//     console.error(e);
//     return new Response(
//       JSON.stringify({ error: String(e?.message ?? e) }),
//       { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
//     );
//   }
// });




































































// // supabase/functions/ai-search/index.ts
// //
// // AI-powered tender search — Supabase Edge Function.
// // 3 independent keyword passes + a final relevance filter.
// // LLM: Gemini on Vertex AI (uses your GCP $300 credit). No guardrail.
// //
// //   query
// //     |-- PASS 1  keywords (literal)   -> DB ilike OR query -> collect
// //     |-- PASS 2  keywords (synonyms)  -> DB ilike OR query -> collect
// //     |-- PASS 3  keywords (broader)   -> DB ilike OR query -> collect
// //     |     (each pass is an independent, stateless LLM call)
// //     |     (rows accumulate in one Map, deduped on tender_id)
// //     `-- FINAL   LLM reads the deduped candidates + query -> relevant ones
// //
// // Secrets (set with: supabase secrets set NAME=value):
// //   GCP_SERVICE_ACCOUNT   required  (the FULL service-account JSON, as one string)
// //   GCP_PROJECT_ID        required  (e.g. project-7c5bb642-cdf8-461d-88f)
// //   GCP_REGION            optional  (default us-central1)
// //   VERTEX_MODEL          optional  (default gemini-2.5-flash)
// // Auto-injected by Supabase (no need to set):
// //   SUPABASE_URL, SUPABASE_ANON_KEY

// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// const TABLE = "all_tenders";
// const SELECT_COLS =
//   "tender_id,portal,organisation_name,title,epublished_date,closing_date,detail_link";
// const PER_PASS_LIMIT = 500;
// const MAX_CANDIDATES = 500;

// // ---- Vertex AI config ----
// const GCP_PROJECT_ID = Deno.env.get("GCP_PROJECT_ID") ?? "";
// const GCP_REGION = Deno.env.get("GCP_REGION") ?? "us-central1";
// const VERTEX_MODEL = Deno.env.get("VERTEX_MODEL") ?? "gemini-3.5-flash";
// const GCP_SERVICE_ACCOUNT = Deno.env.get("GCP_SERVICE_ACCOUNT") ?? "";

// const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// const CORS = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers":
//     "authorization, x-client-info, apikey, content-type",
//   "Access-Control-Allow-Methods": "POST, OPTIONS",
// };

// // --------------------------------------------------------------------------- //
// // Google OAuth: sign a JWT with the service-account key, exchange for a token.
// // Cached in-memory so we don't mint one on every call.
// // --------------------------------------------------------------------------- //

// let cachedToken: { token: string; exp: number } | null = null;

// function b64url(data: Uint8Array | string): string {
//   const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
//   let bin = "";
//   for (const b of bytes) bin += String.fromCharCode(b);
//   return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
// }

// function pemToArrayBuffer(pem: string): ArrayBuffer {
//   const body = pem
//     .replace(/-----BEGIN PRIVATE KEY-----/, "")
//     .replace(/-----END PRIVATE KEY-----/, "")
//     .replace(/\s+/g, "");
//   const bin = atob(body);
//   const buf = new Uint8Array(bin.length);
//   for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
//   return buf.buffer;
// }

// async function getAccessToken(): Promise<string> {
//   const now = Math.floor(Date.now() / 1000);
//   if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token;

//   const sa = JSON.parse(GCP_SERVICE_ACCOUNT);
//   const header = { alg: "RS256", typ: "JWT" };
//   const claims = {
//     iss: sa.client_email,
//     scope: "https://www.googleapis.com/auth/cloud-platform",
//     aud: "https://oauth2.googleapis.com/token",
//     iat: now,
//     exp: now + 3600,
//   };

//   const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;

//   const key = await crypto.subtle.importKey(
//     "pkcs8",
//     pemToArrayBuffer(sa.private_key),
//     { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
//     false,
//     ["sign"],
//   );
//   const sig = new Uint8Array(
//     await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)),
//   );
//   const jwt = `${unsigned}.${b64url(sig)}`;

//   const resp = await fetch("https://oauth2.googleapis.com/token", {
//     method: "POST",
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     body: new URLSearchParams({
//       grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
//       assertion: jwt,
//     }),
//   });
//   const data = await resp.json();
//   if (!resp.ok) {
//     console.error("Token exchange failed:", resp.status, JSON.stringify(data));
//     throw new Error("Failed to get Google access token");
//   }
//   cachedToken = { token: data.access_token, exp: now + (data.expires_in ?? 3600) };
//   return cachedToken.token;
// }

// // --------------------------------------------------------------------------- //
// // Prompts
// // --------------------------------------------------------------------------- //

// const KEYWORD_SYSTEM_PROMPT = `You generate search keywords for a database of Indian government and public-sector
// procurement tenders (CPPP / eprocure.gov.in and state NIC e-procurement portals).

// HOW THE DATA LOOKS
// Each tender has a Title, an Organisation Name, and an Organisation Chain. Titles are
// written by government departments: terse, heavily abbreviated, inconsistent spelling,
// Indian/British English, full of domain jargon.

// HOW MATCHING WORKS
// Your keywords are used for literal, case-insensitive substring matching
// (SQL ILIKE '%keyword%') against the title and organisation text. There is NO semantic
// understanding at this stage. A keyword finds a tender ONLY if that exact run of
// characters physically appears in the text. This is the single most important thing to
// internalise.

// YOUR TASK
// Given the user's query, output short keywords that are LIKELY TO LITERALLY APPEAR in the
// title or organisation name of a matching tender.

// RULES
// - Keep every keyword SHORT: one word, or at most two. Long phrases almost never match.
// - Give abbreviations AND their expansions: "ev" and "electric vehicle", "stp" and
//   "sewage treatment", "o&m" and "operation and maintenance", "pmc" and "project
//   management consultancy", "wtp" and "water treatment".
// - Use Indian/British spellings and variants: "tyre", "programme", "labour", "kilometre".
// - Include the synonyms a government drafter might actually type.
// - Prefer distinctive terms. Avoid words so generic they match almost everything —
//   "supply", "work", "services", "tender", "procurement", "notice" — unless that word IS
//   the subject of the query.
// - Beware dangerous short substrings: "bus" is inside "business", "ola" inside "solar".
// - Stay strictly inside the user's query. Do not drift to adjacent topics.

// OUTPUT
// Return ONLY a JSON array of lowercase strings. No prose, no explanation, no code fences.
// Example: ["electric bus", "e-bus", "battery bus", "ev bus"]`;

// const PASS_LENSES: Record<number, string> = {
//   1: "PASS 1 — Focus on the most direct, literal terms naming the core subject of the query.",
//   2: "PASS 2 — Focus on abbreviations, expansions, alternate spellings and synonyms: different WORDS for the same thing. Find the less-obvious phrasings a department might use.",
//   3: "PASS 3 — Focus on broader category terms and closely related items that would still genuinely answer the query: the umbrella terms and adjacent service/equipment names a tender like this might be filed under.",
// };

// const FILTER_SYSTEM_PROMPT = `You are a relevance filter for Indian government procurement tenders.

// SITUATION
// A user asked a question. A keyword search returned a set of CANDIDATE tenders. That search
// was loose substring matching, so the list contains BOTH genuinely relevant tenders AND
// false positives — e.g. the keyword "bus" also matched "business", "ola" matched "solar".
// Your job is to read the candidates and return only the ones that truly match the user's
// intent.

// RULES
// - Judge each candidate against the user's ACTUAL intent, not against whether some keyword
//   happened to appear in it.
// - You may ONLY select from the candidates provided. Never invent, guess, or add a tender
//   that is not in the list. Never alter any tender's details.
// - Drop coincidental substring matches that have nothing to do with the query.
// - If a tender is borderline but plausibly relevant, include it and flag the uncertainty.
// - If NONE of the candidates are relevant, return an empty array. Do not force matches.
// - Order results best-match-first.

// OUTPUT
// Return a JSON array, best match first, each item:
//   { "tender_id": "<exact id from the candidate>", "reason": "<one line on why it matches>" }
// If nothing matches, return: []`;

// // --------------------------------------------------------------------------- //
// // LLM (Gemini on Vertex AI)
// // --------------------------------------------------------------------------- //

// async function llmJSON(
//   systemPrompt: string,
//   userText: string,
//   temperature: number,
// ): Promise<unknown> {
//   const token = await getAccessToken();
//   const url =
//     `https://${GCP_REGION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}` +
//     `/locations/${GCP_REGION}/publishers/google/models/${VERTEX_MODEL}:generateContent`;

//   const body = {
//     system_instruction: { parts: [{ text: systemPrompt }] },
//     contents: [{ role: "user", parts: [{ text: userText }] }],
//     generationConfig: {
//       temperature,
//       responseMimeType: "application/json",
//     },
//   };

//   const resp = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Authorization": `Bearer ${token}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(body),
//   });

//   const data = await resp.json();
//   if (!resp.ok) {
//     console.error("Vertex error:", resp.status, JSON.stringify(data));
//     return null;
//   }
//   const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
//   return extractJSON(text);
// }

// function extractJSON(text: string): unknown {
//   let t = (text ?? "").trim();
//   t = t.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
//   try {
//     const parsed = JSON.parse(t);
//     if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
//       for (const v of Object.values(parsed)) if (Array.isArray(v)) return v;
//     }
//     return parsed;
//   } catch {
//     const m = t.match(/\[[\s\S]*\]/);
//     if (m) {
//       try {
//         return JSON.parse(m[0]);
//       } catch { /* fall through */ }
//     }
//   }
//   return null;
// }

// function sanitizeKeyword(kw: string): string {
//   return kw.trim().toLowerCase().replace(/[,()%*]/g, " ").replace(/\s+/g, " ").trim();
// }

// async function generateKeywords(query: string, passNo: number): Promise<string[]> {
//   const system = KEYWORD_SYSTEM_PROMPT + "\n\n" + PASS_LENSES[passNo];
//   const data = await llmJSON(system, query, 0.7);
//   if (!Array.isArray(data)) return [];
//   const seen = new Set<string>();
//   const out: string[] = [];
//   for (const k of data) {
//     const kw = sanitizeKeyword(String(k));
//     if (kw && !seen.has(kw)) {
//       seen.add(kw);
//       out.push(kw);
//     }
//   }
//   return out;
// }

// // --------------------------------------------------------------------------- //
// // Supabase query
// // --------------------------------------------------------------------------- //

// async function queryByKeywords(keywords: string[]): Promise<any[]> {
//   if (keywords.length === 0) return [];
//   const conditions: string[] = [];
//   for (const kw of keywords) {
//     conditions.push(`title.ilike.%${kw}%`);
//     conditions.push(`organisation_name.ilike.%${kw}%`);
//   }
//   const { data, error } = await supabase
//     .from(TABLE)
//     .select(SELECT_COLS)
//     .or(conditions.join(","))
//     .limit(PER_PASS_LIMIT);
//   if (error) {
//     console.error("Supabase query error:", error.message);
//     return [];
//   }
//   return data ?? [];
// }

// // --------------------------------------------------------------------------- //
// // Orchestration
// // --------------------------------------------------------------------------- //

// async function runSearch(query: string) {
//   const store = new Map<string, any>();
//   const passInfo: { pass: number; keywords: string[]; rows: number }[] = [];

//   for (const passNo of [1, 2, 3]) {
//     const keywords = await generateKeywords(query, passNo);
//     const rows = await queryByKeywords(keywords);
//     for (const row of rows) {
//       const tid = row.tender_id;
//       if (tid && !store.has(tid)) store.set(tid, row);
//     }
//     passInfo.push({ pass: passNo, keywords, rows: rows.length });
//   }

//   let candidates = [...store.values()];
//   if (candidates.length === 0) {
//     return { results: [], passInfo, candidateCount: 0 };
//   }
//   if (candidates.length > MAX_CANDIDATES) {
//     candidates = candidates.slice(0, MAX_CANDIDATES);
//   }

//   const lines = candidates.map((c) =>
//     JSON.stringify({
//       tender_id: c.tender_id,
//       title: c.title ?? "",
//       organisation: c.organisation_name ?? "",
//       portal: c.portal ?? "",
//     })
//   );
//   const payload =
//     `USER QUERY:\n${query}\n\nCANDIDATE TENDERS (${candidates.length}):\n` +
//     lines.join("\n");

//   const selections = await llmJSON(FILTER_SYSTEM_PROMPT, payload, 0.1);
//   const results: any[] = [];
//   if (Array.isArray(selections)) {
//     for (const sel of selections) {
//       const row = store.get(sel?.tender_id);
//       if (row) results.push({ ...row, reason: sel?.reason ?? "" });
//     }
//   }
//   return { results, passInfo, candidateCount: candidates.length };
// }

// // --------------------------------------------------------------------------- //
// // HTTP handler
// // --------------------------------------------------------------------------- //

// Deno.serve(async (req) => {
//   if (req.method === "OPTIONS") {
//     return new Response("ok", { headers: CORS });
//   }
//   try {
//     const { query } = await req.json();
//     if (!query || typeof query !== "string" || !query.trim()) {
//       return new Response(
//         JSON.stringify({ error: "Missing 'query' string in body." }),
//         { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
//       );
//     }
//     const out = await runSearch(query.trim());
//     return new Response(JSON.stringify(out), {
//       headers: { ...CORS, "Content-Type": "application/json" },
//     });
//   } catch (e) {
//     console.error(e);
//     return new Response(
//       JSON.stringify({ error: String(e?.message ?? e) }),
//       { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
//     );
//   }
// });












































// supabase/functions/ai-search/index.ts
//
// AI-powered tender search — Supabase Edge Function.
// 3 independent keyword passes + a final relevance filter.
// LLM: Gemini on Vertex AI (uses your GCP credit).
// Guardrails: query-length cap, Google-authenticated user required,
//             3 AI searches per user per day.
//
//   query
//     |-- PASS 1  keywords (literal)   -> DB ilike OR query -> collect
//     |-- PASS 2  keywords (synonyms)  -> DB ilike OR query -> collect
//     |-- PASS 3  keywords (broader)   -> DB ilike OR query -> collect
//     |     (each pass is an independent, stateless LLM call)
//     |     (rows accumulate in one Map, deduped on tender_id)
//     `-- FINAL   LLM reads the deduped candidates + query -> relevant ones
//
// Secrets (set with: supabase secrets set NAME=value):
//   GCP_SERVICE_ACCOUNT   required  (the FULL service-account JSON, as one string)
//   GCP_PROJECT_ID        required  (e.g. project-7c5bb642-cdf8-461d-88f)
//   GCP_REGION            optional  (default us-central1)
//   VERTEX_MODEL          optional  (default gemini-3.5-flash)
// Auto-injected by Supabase (no need to set):
//   SUPABASE_URL, SUPABASE_ANON_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TABLE = "all_tenders";
const SELECT_COLS =
  "tender_id,portal,organisation_name,title,epublished_date,closing_date,detail_link";
const PER_PASS_LIMIT = 500;
const MAX_CANDIDATES = 300;

// ---- Vertex AI config ----
const GCP_PROJECT_ID = Deno.env.get("GCP_PROJECT_ID") ?? "";
const GCP_REGION = Deno.env.get("GCP_REGION") ?? "us-central1";
const VERTEX_MODEL = Deno.env.get("VERTEX_MODEL") ?? "gemini-3.5-flash";
const GCP_SERVICE_ACCOUNT = Deno.env.get("GCP_SERVICE_ACCOUNT") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --------------------------------------------------------------------------- //
// Google OAuth: sign a JWT with the service-account key, exchange for a token.
// Cached in-memory so we don't mint one on every call.
// --------------------------------------------------------------------------- //

let cachedToken: { token: string; exp: number } | null = null;

function b64url(data: Uint8Array | string): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(body);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token;

  const sa = JSON.parse(GCP_SERVICE_ACCOUNT);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)),
  );
  const jwt = `${unsigned}.${b64url(sig)}`;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    console.error("Token exchange failed:", resp.status, JSON.stringify(data));
    throw new Error("Failed to get Google access token");
  }
  cachedToken = { token: data.access_token, exp: now + (data.expires_in ?? 3600) };
  return cachedToken.token;
}

// --------------------------------------------------------------------------- //
// Prompts
// --------------------------------------------------------------------------- //

const KEYWORD_SYSTEM_PROMPT = `You generate search keywords for a database of Indian government and public-sector
procurement tenders (CPPP / eprocure.gov.in and state NIC e-procurement portals).

HOW THE DATA LOOKS
Each tender has a Title, an Organisation Name, and an Organisation Chain. Titles are
written by government departments: terse, heavily abbreviated, inconsistent spelling,
Indian/British English, full of domain jargon.

HOW MATCHING WORKS
Your keywords are used for literal, case-insensitive substring matching
(SQL ILIKE '%keyword%') against the title and organisation text. There is NO semantic
understanding at this stage. A keyword finds a tender ONLY if that exact run of
characters physically appears in the text. This is the single most important thing to
internalise.

YOUR TASK
Given the user's query, output short keywords that are LIKELY TO LITERALLY APPEAR in the
title or organisation name of a matching tender.

RULES
- Keep every keyword SHORT: one word, or at most two. Long phrases almost never match.
- Give abbreviations AND their expansions: "ev" and "electric vehicle", "stp" and
  "sewage treatment", "o&m" and "operation and maintenance", "pmc" and "project
  management consultancy", "wtp" and "water treatment".
- Use Indian/British spellings and variants: "tyre", "programme", "labour", "kilometre".
- Include the synonyms a government drafter might actually type.
- Prefer distinctive terms. Avoid words so generic they match almost everything —
  "supply", "work", "services", "tender", "procurement", "notice" — unless that word IS
  the subject of the query.
- Beware dangerous short substrings: "bus" is inside "business", "ola" inside "solar".
- Stay strictly inside the user's query. Do not drift to adjacent topics.

OUTPUT
Return ONLY a JSON array of lowercase strings. No prose, no explanation, no code fences.
Example: ["electric bus", "e-bus", "battery bus", "ev bus"]`;

const PASS_LENSES: Record<number, string> = {
  1: "PASS 1 — Focus on the most direct, literal terms naming the core subject of the query.",
  2: "PASS 2 — Focus on abbreviations, expansions, alternate spellings and synonyms: different WORDS for the same thing. Find the less-obvious phrasings a department might use.",
  3: "PASS 3 — Focus on broader category terms and closely related items that would still genuinely answer the query: the umbrella terms and adjacent service/equipment names a tender like this might be filed under.",
};

const FILTER_SYSTEM_PROMPT = `You are a relevance filter for Indian government procurement tenders.

SITUATION
A user asked a question. A keyword search returned a set of CANDIDATE tenders. That search
was loose substring matching, so the list contains BOTH genuinely relevant tenders AND
false positives — e.g. the keyword "bus" also matched "business", "ola" matched "solar".
Your job is to read the candidates and return only the ones that truly match the user's
intent.

RULES
- Judge each candidate against the user's ACTUAL intent, not against whether some keyword
  happened to appear in it.
- You may ONLY select from the candidates provided. Never invent, guess, or add a tender
  that is not in the list. Never alter any tender's details.
- Drop coincidental substring matches that have nothing to do with the query.
- If a tender is borderline but plausibly relevant, include it and flag the uncertainty.
- If NONE of the candidates are relevant, return an empty array. Do not force matches.
- Order results best-match-first.

OUTPUT
Return a JSON array, best match first, each item:
  { "tender_id": "<exact id from the candidate>", "reason": "<one line on why it matches>" }
If nothing matches, return: []`;

// --------------------------------------------------------------------------- //
// LLM (Gemini on Vertex AI)
// --------------------------------------------------------------------------- //

async function llmJSON(
  systemPrompt: string,
  userText: string,
  temperature: number,
): Promise<unknown> {
  const token = await getAccessToken();
  const url =
    `https://${GCP_REGION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}` +
    `/locations/${GCP_REGION}/publishers/google/models/${VERTEX_MODEL}:generateContent`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: {
      temperature,
      responseMimeType: "application/json",
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json();
  if (!resp.ok) {
    console.error("Vertex error:", resp.status, JSON.stringify(data));
    return null;
  }
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return extractJSON(text);
}

function extractJSON(text: string): unknown {
  let t = (text ?? "").trim();
  t = t.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(t);
    if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
      for (const v of Object.values(parsed)) if (Array.isArray(v)) return v;
    }
    return parsed;
  } catch {
    const m = t.match(/\[[\s\S]*\]/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch { /* fall through */ }
    }
  }
  return null;
}

function sanitizeKeyword(kw: string): string {
  return kw.trim().toLowerCase().replace(/[,()%*]/g, " ").replace(/\s+/g, " ").trim();
}

async function generateKeywords(query: string, passNo: number): Promise<string[]> {
  const system = KEYWORD_SYSTEM_PROMPT + "\n\n" + PASS_LENSES[passNo];
  const data = await llmJSON(system, query, 0.7);
  if (!Array.isArray(data)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of data) {
    const kw = sanitizeKeyword(String(k));
    if (kw && !seen.has(kw)) {
      seen.add(kw);
      out.push(kw);
    }
  }
  return out;
}

// --------------------------------------------------------------------------- //
// Supabase query
// --------------------------------------------------------------------------- //

async function queryByKeywords(keywords: string[]): Promise<any[]> {
  if (keywords.length === 0) return [];
  const conditions: string[] = [];
  for (const kw of keywords) {
    conditions.push(`title.ilike.%${kw}%`);
    conditions.push(`organisation_name.ilike.%${kw}%`);
  }
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLS)
    .or(conditions.join(","))
    .limit(PER_PASS_LIMIT);
  if (error) {
    console.error("Supabase query error:", error.message);
    return [];
  }
  return data ?? [];
}

// --------------------------------------------------------------------------- //
// Orchestration
// --------------------------------------------------------------------------- //

async function runSearch(query: string) {
  const store = new Map<string, any>();
  const passInfo: { pass: number; keywords: string[]; rows: number }[] = [];

  // for (const passNo of [1, 2, 3]) {
  //   const keywords = await generateKeywords(query, passNo);
  //   const rows = await queryByKeywords(keywords);
  //   for (const row of rows) {
  //     const tid = row.tender_id;
  //     if (tid && !store.has(tid)) store.set(tid, row);
  //   }
  //   passInfo.push({ pass: passNo, keywords, rows: rows.length });
  // }

  const passResults = await Promise.all(
    [1, 2, 3].map(async (passNo) => {
      const keywords = await generateKeywords(query, passNo);
      const rows = await queryByKeywords(keywords);
      return { pass: passNo, keywords, rows };
    })
  );
  
  for (const { pass, keywords, rows } of passResults) {
    for (const row of rows) {
      const tid = row.tender_id;
      if (tid && !store.has(tid)) store.set(tid, row);
    }
    passInfo.push({ pass, keywords, rows: rows.length });
  }

  let candidates = [...store.values()];
  if (candidates.length === 0) {
    return { results: [], passInfo, candidateCount: 0 };
  }
  if (candidates.length > MAX_CANDIDATES) {
    candidates = candidates.slice(0, MAX_CANDIDATES);
  }

  const lines = candidates.map((c) =>
    JSON.stringify({
      tender_id: c.tender_id,
      title: c.title ?? "",
      organisation: c.organisation_name ?? "",
      portal: c.portal ?? "",
    })
  );
  const payload =
    `USER QUERY:\n${query}\n\nCANDIDATE TENDERS (${candidates.length}):\n` +
    lines.join("\n");

  const selections = await llmJSON(FILTER_SYSTEM_PROMPT, payload, 0.1);
  const results: any[] = [];
  if (Array.isArray(selections)) {
    for (const sel of selections) {
      const row = store.get(sel?.tender_id);
      if (row) results.push({ ...row, reason: sel?.reason ?? "" });
    }
  }
  return { results, passInfo, candidateCount: candidates.length };
}

// --------------------------------------------------------------------------- //
// HTTP handler
// --------------------------------------------------------------------------- //

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || !query.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing 'query' string in body." }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }
    if (query.length > 500) {
      return new Response(
        JSON.stringify({ error: "Query too long (max 500 chars)." }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    // --- require a signed-in user ---
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: "Please sign in to use AI search." }),
        { status: 401, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    // --- daily limit: 3 per user per day ---
    const { data: allowed, error: rlErr } = await supabase.rpc("check_daily_limit", {
      p_caller: user.id,
      p_max: 3,
    });
    if (rlErr) {
      console.error("daily-limit check failed:", rlErr.message);
      // fail-open: if the limiter itself errors, let the search through
    }
    if (allowed === false) {
      return new Response(
        JSON.stringify({
          error: "You've used your 3 AI searches for today. Please try again tomorrow.",
          code: "DAILY_LIMIT",
        }),
        { status: 429, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const out = await runSearch(query.trim());
    return new Response(JSON.stringify(out), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: String(e?.message ?? e) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
