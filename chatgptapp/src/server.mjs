import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/index.js";
import * as z from "zod/v4";
import { SNAP_STATES } from "../../shared/states.mjs";
import { SNAP_CATEGORIES } from "../../shared/categories.mjs";

const APP_NAME = "SnapScan";
const APP_VERSION = "1.0.0";
const WEBSITE_URL = process.env.WEBSITE_URL || "https://snapscan.app";
const SUPPORTED_LANGS = ["en", "es", "ht"];

const PORT = Number(process.env.PORT || 9393);
const HOST = process.env.HOST || "0.0.0.0";
const SNAPSCAN_API_BASE = (process.env.SNAPSCAN_API_BASE || "http://localhost:8787").replace(/\/+$/, "");
const SNAPSCAN_API_KEY = process.env.SNAPSCAN_API_KEY || "demo_chatgpt_app";
const MCP_RATE_LIMIT_PER_MINUTE = Math.max(1, Number(process.env.MCP_RATE_LIMIT_PER_MINUTE || 60));
const UPSTREAM_TIMEOUT_MS = Math.max(1000, Number(process.env.UPSTREAM_TIMEOUT_MS || 10_000));
const SNAP_WAIVER_SOURCE_URL = "https://www.fns.usda.gov/snap/waivers/foodrestriction";

const STATE_BY_CODE = new Map(SNAP_STATES.map((state) => [state.code, state]));
const requestTimestamps = [];

const ALT_BY_CATEGORY = {
  soda: [
    { name: "Unsweetened sparkling water", reason: "Not classified as soda." },
    { name: "100% fruit juice", reason: "Not a restricted soft drink category." },
    { name: "Plain milk", reason: "Basic grocery staple and generally SNAP-eligible." }
  ],
  energy: [
    { name: "Unsweetened iced tea", reason: "Not marketed as an energy drink." },
    { name: "Black coffee", reason: "Coffee is exempt from energy drink restrictions." },
    { name: "Electrolyte water (no sugar)", reason: "Not in the energy drink category." }
  ],
  candy: [
    { name: "Mixed nuts", reason: "Whole-food snack alternative." },
    { name: "Fresh fruit", reason: "Basic produce category." },
    { name: "Plain yogurt", reason: "Not a confectionery product." }
  ],
  dessert: [
    { name: "Whole grain bread", reason: "Staple food item." },
    { name: "Oatmeal", reason: "Basic pantry staple." },
    { name: "Fresh fruit", reason: "Not a prepared packaged dessert." }
  ],
  sweet_bev: [
    { name: "Water", reason: "No added sugar." },
    { name: "Unsweetened tea", reason: "Not a sugar-sweetened beverage." },
    { name: "100% juice", reason: "Outside sweetened beverage restrictions in many states." }
  ],
  juice_drink: [
    { name: "100% orange juice", reason: "Meets full-juice threshold." },
    { name: "100% apple juice", reason: "Meets full-juice threshold." },
    { name: "Water", reason: "No juice drink restriction match." }
  ],
  processed_food: [
    { name: "Eggs", reason: "Minimally processed grocery staple." },
    { name: "Dry beans", reason: "Whole pantry staple." },
    { name: "Brown rice", reason: "Basic minimally processed grain." }
  ],
  taxable: [
    { name: "Fresh produce", reason: "Often treated as staple groceries." },
    { name: "Raw meat", reason: "Generally non-taxable grocery class." },
    { name: "Dried beans", reason: "Basic staple category." }
  ]
};

const I18N = {
  en: {
    eligible: "{product} appears SNAP-eligible in {state}.",
    ineligible: "{product} is not SNAP-eligible in {state}.",
    unknown: "I could not confirm SNAP eligibility for {product} in {state}.",
    listSummary: "{eligible} eligible, {ineligible} not eligible, {unknown} unknown in {state}.",
    stateDiff: "Compared with {from}, {to} has {added} added and {removed} removed restrictions."
  },
  es: {
    eligible: "{product} parece elegible para SNAP en {state}.",
    ineligible: "{product} no es elegible para SNAP en {state}.",
    unknown: "No pude confirmar la elegibilidad SNAP de {product} en {state}.",
    listSummary: "{eligible} elegibles, {ineligible} no elegibles, {unknown} desconocidos en {state}.",
    stateDiff: "Comparado con {from}, {to} tiene {added} restricciones agregadas y {removed} eliminadas."
  },
  ht: {
    eligible: "{product} sanble kalifye pou SNAP nan {state}.",
    ineligible: "{product} pa kalifye pou SNAP nan {state}.",
    unknown: "Mwen pa t ka konfime kalifikasyon SNAP pou {product} nan {state}.",
    listSummary: "{eligible} kalifye, {ineligible} pa kalifye, {unknown} enkoni nan {state}.",
    stateDiff: "Konpare ak {from}, {to} gen {added} restriksyon ajoute ak {removed} retire."
  }
};

function normalizeLang(value) {
  const short = String(value || "").trim().toLowerCase().slice(0, 2);
  return SUPPORTED_LANGS.includes(short) ? short : "en";
}

function translate(lang, key, vars = {}) {
  const catalog = I18N[lang] || I18N.en;
  let text = catalog[key] || I18N.en[key] || key;
  for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

function normalizeStateCode(value) {
  return String(value || "").trim().toUpperCase();
}

function getState(code) {
  return STATE_BY_CODE.get(normalizeStateCode(code)) || null;
}

function cleanUpc(value) {
  return String(value || "").replace(/\D/g, "");
}

function isLikelyUpc(value) {
  const cleaned = cleanUpc(value);
  return cleaned.length >= 8 && cleaned.length <= 14;
}

function categoryDescriptor(id) {
  const category = SNAP_CATEGORIES[id];
  if (!category) {
    return {
      category: id,
      label: id,
      explanation: "Restricted under the state SNAP waiver."
    };
  }
  return {
    category: id,
    label: category.label,
    explanation: category.blurb
  };
}

function mapReasons(rawReasons = []) {
  if (!Array.isArray(rawReasons)) return [];
  return rawReasons.map((reason) => {
    const id = reason?.id || reason?.category || "unknown";
    const base = categoryDescriptor(id);
    return {
      category: id,
      label: reason?.label || base.label,
      explanation: reason?.blurb || reason?.explanation || base.explanation
    };
  });
}

function mapAlternativesFromReasons(reasons = []) {
  const picked = [];
  const seen = new Set();
  for (const reason of reasons) {
    const pool = ALT_BY_CATEGORY[reason.category] || [];
    for (const item of pool) {
      if (seen.has(item.name)) continue;
      seen.add(item.name);
      picked.push(item);
      if (picked.length >= 3) return picked;
    }
  }
  return picked.slice(0, 3);
}

function summarizeVerdict(verdict, lang) {
  const stateName = verdict.state?.name || verdict.state?.code || "this state";
  const productName = verdict.product?.name || verdict.product?.upc || "this product";
  if (verdict.eligible === true) return translate(lang, "eligible", { product: productName, state: stateName });
  if (verdict.eligible === false) return translate(lang, "ineligible", { product: productName, state: stateName });
  return translate(lang, "unknown", { product: productName, state: stateName });
}

function buildVerdict({
  product,
  state,
  eligible,
  confidence,
  reasons,
  alternatives,
  message,
  sourceUrl = SNAP_WAIVER_SOURCE_URL
}) {
  const checkedAt = new Date().toISOString();
  return {
    product: {
      name: product?.name || null,
      brand: product?.brand || null,
      upc: product?.upc || null,
      image_url: product?.image_url || null,
      nova_group: product?.nova_group ?? null
    },
    state: { code: state.code, name: state.name },
    eligible,
    confidence,
    reasons: reasons || [],
    effective_date: state.effective || null,
    source_url: sourceUrl,
    alternatives: alternatives || [],
    checked_at: checkedAt,
    message: message || null,
    _meta: {
      ui_hint: "verdict_card",
      i18n_available: SUPPORTED_LANGS
    }
  };
}

function buildToolSuccess(summary, structuredContent) {
  return {
    content: [{ type: "text", text: `${summary}\n\n${JSON.stringify(structuredContent, null, 2)}` }],
    structuredContent
  };
}

function buildToolError(message, extra = {}) {
  const structuredContent = {
    error: message,
    checked_at: new Date().toISOString(),
    ...extra
  };
  return {
    isError: true,
    content: [{ type: "text", text: `${message}\n\n${JSON.stringify(structuredContent, null, 2)}` }],
    structuredContent
  };
}

function consumeRateLimit() {
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;
  while (requestTimestamps.length && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= MCP_RATE_LIMIT_PER_MINUTE) {
    throw new Error(`Rate limit exceeded: max ${MCP_RATE_LIMIT_PER_MINUTE} requests/minute.`);
  }
  requestTimestamps.push(now);
}

function signalWithTimeout(parentSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("upstream_timeout")), UPSTREAM_TIMEOUT_MS);

  const onAbort = () => controller.abort(parentSignal?.reason || new Error("request_aborted"));
  if (parentSignal) {
    if (parentSignal.aborted) onAbort();
    else parentSignal.addEventListener("abort", onAbort, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(timer);
      if (parentSignal) parentSignal.removeEventListener("abort", onAbort);
    }
  };
}

function getApiKeyFromRequest(extra) {
  const authHeader = String(extra?.requestInfo?.headers?.authorization || "");
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const key = authHeader.slice(7).trim();
    if (key) return key;
  }
  return SNAPSCAN_API_KEY;
}

async function apiGet(path, params, apiKey, signal) {
  const url = new URL(`${SNAPSCAN_API_BASE}${path}`);
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === "") continue;
    url.searchParams.set(k, String(v));
  }

  const timeout = signalWithTimeout(signal);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      signal: timeout.signal
    });

    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : {};
    if (!response.ok) {
      const message = data?.message || data?.error || `Upstream API failed (${response.status})`;
      const err = new Error(message);
      err.status = response.status;
      err.payload = data;
      throw err;
    }
    return data;
  } finally {
    timeout.cleanup();
  }
}

async function lookupByUpc(upc, state, apiKey, signal) {
  const data = await apiGet("/api/eligibility", { upc, state: state.code }, apiKey, signal);
  if (!data.found) {
    return buildVerdict({
      product: { upc, name: null, brand: null },
      state,
      eligible: null,
      confidence: "low",
      reasons: [],
      alternatives: [],
      message: data.message || null
    });
  }

  const reasons = mapReasons(data.reasons);
  return buildVerdict({
    product: {
      upc,
      name: data.product?.name || null,
      brand: data.product?.brand || null,
      image_url: data.product?.image || null,
      nova_group: data.product?.nova_group ?? null
    },
    state,
    eligible: data.eligible,
    confidence: "high",
    reasons,
    alternatives: data.eligible === false ? mapAlternativesFromReasons(reasons) : [],
    message: null
  });
}

async function lookupByQuery(query, state, apiKey, signal) {
  const data = await apiGet("/api/search", { q: query, state: state.code }, apiKey, signal);
  const first = Array.isArray(data.results) ? data.results[0] : null;
  if (!first) {
    return buildVerdict({
      product: { name: query, brand: null, upc: null },
      state,
      eligible: null,
      confidence: "low",
      reasons: [],
      alternatives: [],
      message: "No product match found."
    });
  }

  const reasons = mapReasons(first.reasons);
  const alternatives = [];
  if (first.eligible === false) {
    for (const candidate of data.results || []) {
      if (candidate?.eligible !== true) continue;
      alternatives.push({
        name: candidate.name || candidate.upc || "Alternative item",
        reason: "Matched as eligible in this state."
      });
      if (alternatives.length >= 3) break;
    }
    if (!alternatives.length) alternatives.push(...mapAlternativesFromReasons(reasons));
  }

  return buildVerdict({
    product: {
      name: first.name || query,
      brand: first.brand || null,
      upc: first.upc || null,
      image_url: first.image || null,
      nova_group: first.nova_group ?? null
    },
    state,
    eligible: typeof first.eligible === "boolean" ? first.eligible : null,
    confidence: first.upc ? "medium" : "low",
    reasons,
    alternatives: alternatives.slice(0, 3),
    message: null
  });
}

async function resolveEligibility({ upc, query, stateCode, apiKey, signal }) {
  const state = getState(stateCode);
  if (!state) return { error: buildToolError(`State '${stateCode}' is not covered.`, { state: stateCode }) };

  const cleanedUpc = cleanUpc(upc);
  const searchQuery = String(query || "").trim();
  if (!cleanedUpc && !searchQuery) {
    return { error: buildToolError("Provide either `upc` or `query`.") };
  }

  if (cleanedUpc) {
    const verdict = await lookupByUpc(cleanedUpc, state, apiKey, signal);
    return { verdict };
  }

  const verdict = await lookupByQuery(searchQuery, state, apiKey, signal);
  return { verdict };
}

function buildStateRules(state) {
  return {
    state: {
      code: state.code,
      name: state.name,
      effective_date: state.effective || null,
      summary: state.note || null
    },
    restricted_categories: (state.categories || []).map((id) => categoryDescriptor(id)),
    source_url: SNAP_WAIVER_SOURCE_URL,
    checked_at: new Date().toISOString(),
    _meta: {
      ui_hint: "state_rules",
      i18n_available: SUPPORTED_LANGS
    }
  };
}

function buildCompareStates(fromState, toState) {
  const fromCategories = new Set(fromState.categories || []);
  const toCategories = new Set(toState.categories || []);
  const added = [...toCategories].filter((id) => !fromCategories.has(id)).map((id) => categoryDescriptor(id));
  const removed = [...fromCategories].filter((id) => !toCategories.has(id)).map((id) => categoryDescriptor(id));
  const unchanged = [...toCategories].filter((id) => fromCategories.has(id)).map((id) => categoryDescriptor(id));

  return {
    from: {
      code: fromState.code,
      name: fromState.name,
      effective_date: fromState.effective || null,
      categories: (fromState.categories || []).map((id) => categoryDescriptor(id))
    },
    to: {
      code: toState.code,
      name: toState.name,
      effective_date: toState.effective || null,
      categories: (toState.categories || []).map((id) => categoryDescriptor(id))
    },
    added_restrictions: added,
    removed_restrictions: removed,
    unchanged_restrictions: unchanged,
    checked_at: new Date().toISOString(),
    _meta: {
      ui_hint: "state_comparison",
      i18n_available: SUPPORTED_LANGS
    }
  };
}

function buildListStates() {
  const states = [...SNAP_STATES].map((state) => ({
    code: state.code,
    name: state.name,
    effective_date: state.effective || null,
    summary: state.note || null
  }));
  return {
    states,
    count: states.length,
    checked_at: new Date().toISOString(),
    _meta: {
      ui_hint: "state_list",
      i18n_available: SUPPORTED_LANGS
    }
  };
}

function createToolServer() {
  const server = new McpServer({
    name: "snapscan-chatgptapp",
    version: APP_VERSION,
    websiteUrl: WEBSITE_URL
  });

  server.registerTool("check_eligibility", {
    title: "Check SNAP Eligibility",
    description: "Check if a product is SNAP-eligible in a specific state.",
    annotations: { readOnlyHint: true, openWorldHint: true },
    inputSchema: {
      query: z.string().optional().describe("Product name or brand query, e.g. 'Pepsi'."),
      upc: z.string().optional().describe("Barcode/UPC digits."),
      state: z.string().describe("Two-letter state code, e.g. FL."),
      lang: z.enum(["en", "es", "ht"]).optional().describe("Response language.")
    }
  }, async ({ query, upc, state, lang }, extra) => {
    try {
      consumeRateLimit();
      const language = normalizeLang(lang);
      const apiKey = getApiKeyFromRequest(extra);
      const resolved = await resolveEligibility({
        upc,
        query,
        stateCode: state,
        apiKey,
        signal: extra.signal
      });
      if (resolved.error) return resolved.error;

      const verdict = resolved.verdict;
      const summary = summarizeVerdict(verdict, language);
      return buildToolSuccess(summary, verdict);
    } catch (error) {
      return buildToolError(error.message || "Eligibility lookup failed.");
    }
  });

  server.registerTool("check_list", {
    title: "Check Shopping List",
    description: "Check a shopping list of items against one state's SNAP restrictions.",
    annotations: { readOnlyHint: true, openWorldHint: true },
    inputSchema: {
      items: z.array(z.string()).min(1).max(25).describe("List entries as product names or UPCs."),
      state: z.string().describe("Two-letter state code, e.g. FL."),
      lang: z.enum(["en", "es", "ht"]).optional().describe("Response language.")
    }
  }, async ({ items, state, lang }, extra) => {
    try {
      consumeRateLimit();
      const language = normalizeLang(lang);
      const stateObj = getState(state);
      if (!stateObj) return buildToolError(`State '${state}' is not covered.`, { state });

      const apiKey = getApiKeyFromRequest(extra);
      const verdicts = [];
      for (const item of items) {
        const normalizedItem = String(item || "").trim();
        if (!normalizedItem) continue;
        const resolved = await resolveEligibility({
          upc: isLikelyUpc(normalizedItem) ? normalizedItem : undefined,
          query: isLikelyUpc(normalizedItem) ? undefined : normalizedItem,
          stateCode: stateObj.code,
          apiKey,
          signal: extra.signal
        });
        if (resolved.error) {
          verdicts.push({
            input: normalizedItem,
            verdict: null,
            error: resolved.error.structuredContent?.error || "lookup_failed"
          });
        } else {
          verdicts.push({
            input: normalizedItem,
            verdict: resolved.verdict,
            error: null
          });
        }
      }

      const eligible = verdicts.filter((x) => x.verdict?.eligible === true);
      const ineligible = verdicts.filter((x) => x.verdict?.eligible === false);
      const unknown = verdicts.filter((x) => x.verdict?.eligible !== true && x.verdict?.eligible !== false);

      const structuredContent = {
        state: { code: stateObj.code, name: stateObj.name },
        totals: {
          total: verdicts.length,
          eligible: eligible.length,
          ineligible: ineligible.length,
          unknown: unknown.length
        },
        results: verdicts,
        checked_at: new Date().toISOString(),
        _meta: {
          ui_hint: "list_verdict",
          i18n_available: SUPPORTED_LANGS
        }
      };

      const summary = translate(language, "listSummary", {
        eligible: eligible.length,
        ineligible: ineligible.length,
        unknown: unknown.length,
        state: stateObj.name
      });
      return buildToolSuccess(summary, structuredContent);
    } catch (error) {
      return buildToolError(error.message || "List check failed.");
    }
  });

  server.registerTool("get_state_rules", {
    title: "Get State SNAP Rules",
    description: "Return active SNAP restriction categories for one state.",
    annotations: { readOnlyHint: true, openWorldHint: false },
    inputSchema: {
      state: z.string().describe("Two-letter state code, e.g. FL.")
    }
  }, async ({ state }) => {
    try {
      consumeRateLimit();
      const stateObj = getState(state);
      if (!stateObj) return buildToolError(`State '${state}' is not covered.`, { state });
      const structured = buildStateRules(stateObj);
      return buildToolSuccess(`${stateObj.name} SNAP rules retrieved.`, structured);
    } catch (error) {
      return buildToolError(error.message || "State rules lookup failed.");
    }
  });

  server.registerTool("compare_states", {
    title: "Compare State Rules",
    description: "Diff SNAP restriction categories between two states.",
    annotations: { readOnlyHint: true, openWorldHint: false },
    inputSchema: {
      from: z.string().describe("From-state code, e.g. FL."),
      to: z.string().describe("To-state code, e.g. TX."),
      lang: z.enum(["en", "es", "ht"]).optional().describe("Response language.")
    }
  }, async ({ from, to, lang }) => {
    try {
      consumeRateLimit();
      const language = normalizeLang(lang);
      const fromState = getState(from);
      const toState = getState(to);
      if (!fromState) return buildToolError(`State '${from}' is not covered.`, { state: from });
      if (!toState) return buildToolError(`State '${to}' is not covered.`, { state: to });

      const structured = buildCompareStates(fromState, toState);
      const summary = translate(language, "stateDiff", {
        from: fromState.name,
        to: toState.name,
        added: structured.added_restrictions.length,
        removed: structured.removed_restrictions.length
      });
      return buildToolSuccess(summary, structured);
    } catch (error) {
      return buildToolError(error.message || "State comparison failed.");
    }
  });

  server.registerTool("list_states", {
    title: "List Covered States",
    description: "List all states currently covered by SnapScan.",
    annotations: { readOnlyHint: true, openWorldHint: false }
  }, async () => {
    try {
      consumeRateLimit();
      const structured = buildListStates();
      return buildToolSuccess(`Returned ${structured.count} covered states.`, structured);
    } catch (error) {
      return buildToolError(error.message || "State list lookup failed.");
    }
  });

  return server;
}

const app = createMcpExpressApp({ host: HOST });

app.get("/", (req, res) => {
  res.json({
    name: APP_NAME,
    app: "chatgptapp",
    version: APP_VERSION,
    mcp_endpoint: "/mcp",
    api_base: SNAPSCAN_API_BASE
  });
});

app.get("/healthz", (req, res) => {
  res.json({
    ok: true,
    name: APP_NAME,
    version: APP_VERSION,
    time: new Date().toISOString()
  });
});

app.post("/mcp", async (req, res) => {
  const server = createToolServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    transport.close().catch(() => {});
    server.close().catch(() => {});
  };

  res.on("finish", cleanup);
  res.on("close", cleanup);

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: error?.message || "Internal server error" },
        id: null
      });
    }
    cleanup();
  }
});

app.get("/mcp", (req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed. Use POST /mcp." },
    id: null
  });
});

app.delete("/mcp", (req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed in stateless mode." },
    id: null
  });
});

app.listen(PORT, HOST, (error) => {
  if (error) {
    console.error("Failed to start chatgptapp server:", error);
    process.exit(1);
  }
  console.log(`SnapScan chatgptapp MCP server listening on http://${HOST}:${PORT}/mcp`);
});
