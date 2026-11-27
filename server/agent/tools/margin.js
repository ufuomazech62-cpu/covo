// Margin Admin tools for Covo. The token is read from the environment so it never lives in the chat UI.
// API base: {MARGIN_API_BASE}/api/v1/admin, Bearer MARGIN_API_TOKEN (scoped sk_ token from Admin → Settings → API tokens).
const obj = (properties, required = []) => ({ type: 'object', properties, required });
const str = (description, extra = {}) => ({ type: 'string', description, ...extra });

const BASE = process.env.MARGIN_API_BASE || 'https://margin-api.fashiony.site';
const TOKEN = process.env.MARGIN_API_TOKEN || '';
const ALLOWED = /^\/(products|collections|orders|customers|discounts|gift-cards|pages|analytics|shop|languages|custom-fields)(?:[/?]|$)/;

export function marginTools() {
  if (!TOKEN) return [];
  return [{
    name: 'margin_admin',
    description: `Run a Margin Admin API request for the shop. Use GET to read and POST/PATCH/PUT/DELETE to change catalog, orders, customers, discounts, pages, languages and analytics. Path is relative to /api/v1/admin, e.g. /products?limit=20 or /products/{id}. Writes need approval.`,
    input_schema: obj({
      method: str('HTTP method', { enum: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] }),
      path: str('Path relative to /api/v1/admin, e.g. /products or /orders/{id}'),
      query: obj({}, []), // optional query object
      body: obj({}, []),  // optional JSON body
    }, ['method', 'path']),
    category: (i) => (!i.method || i.method.toUpperCase() === 'GET' ? 'network' : 'mcp'),
    summarize: (i) => ({ title: `Margin admin ${(i.method || 'GET').toUpperCase()}`, detail: i.path }),
    run: async ({ method = 'GET', path, query, body }) => {
      if (!ALLOWED.test(path)) return { error: 'Path not allowed. Use products, collections, orders, customers, discounts, gift-cards, pages, analytics, shop, languages or custom-fields.' };
      if (path.includes('..') || path.includes('//')) return { error: 'Invalid path' };
      let url = `${BASE.replace(/\/$/, '')}/api/v1/admin${path}`;
      if (query && Object.keys(query).length) url += (url.includes('?') ? '&' : '?') + new URLSearchParams(query);
      const m = String(method).toUpperCase();
      const res = await fetch(url, {
        method: m,
        headers: { authorization: `Bearer ${TOKEN}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
        body: ['GET', 'HEAD'].includes(m) || body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });
      const text = await res.text();
      let parsed = text;
      try { parsed = JSON.parse(text); } catch {}
      return { status: res.status, ok: res.ok, result: parsed };
    },
  }];
}
