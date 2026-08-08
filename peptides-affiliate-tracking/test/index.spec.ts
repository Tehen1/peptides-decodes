// test/index.spec.ts — RC Peptides Affiliate Worker
import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";
import { describe, it, expect, vi, afterEach } from "vitest";
import worker from "../src/index";

const TEST_ENV = {
  ...env,
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
} satisfies typeof env;

const PRODUCT_URL = "https://rcpeptides.to/products/bpc157-10mg-vial?ref=PEPTIDESDECODED";
const BASE = "https://peptides-decodes.pages.dev";

function mockFetch(productUrl: string | null, insertOk = true) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = input.toString();
    if (url.includes("affiliate_products")) {
      return new Response(
        productUrl ? JSON.stringify([{ rc_product_url: productUrl }]) : JSON.stringify([]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    if (url.includes("affiliate_clicks")) {
      return new Response(null, { status: insertOk ? 201 : 500 });
    }
    return new Response("unexpected", { status: 500 });
  });
}

describe("Redirect — ref=PEPTIDESDECODED", () => {
  let spy: ReturnType<typeof vi.spyOn>;
  afterEach(() => spy?.mockRestore());

  it("302 avec Location contenant ref=PEPTIDESDECODED", async () => {
    spy = mockFetch(PRODUCT_URL);
    const req = new Request(`${BASE}/api/affiliate/click/bpc157-10mg-vial?nl=nl-001`);
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, TEST_ENV, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(302);
    const loc = res.headers.get("Location")!;
    expect(loc).toContain("ref=PEPTIDESDECODED");
    expect(new URL(loc).searchParams.get("ref")).toBe("PEPTIDESDECODED");
  });

  it("ref= apparaît exactement une fois", async () => {
    spy = mockFetch(PRODUCT_URL);
    const req = new Request(`${BASE}/api/affiliate/click/bpc157-10mg-vial`);
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, TEST_ENV, ctx);
    await waitOnExecutionContext(ctx);
    const loc = res.headers.get("Location")!;
    expect((loc.match(/ref=/g) ?? []).length).toBe(1);
  });

  it("redirige même si logClick échoue", async () => {
    spy = mockFetch(PRODUCT_URL, false);
    const req = new Request(`${BASE}/api/affiliate/click/bpc157-10mg-vial?nl=test`);
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, TEST_ENV, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("ref=PEPTIDESDECODED");
  });
});

describe("Sécurité — validation redirect", () => {
  let spy: ReturnType<typeof vi.spyOn>;
  afterEach(() => spy?.mockRestore());

  it("bloque redirect vers domaine non-rcpeptides.to", async () => {
    spy = mockFetch("https://evil.com/malware");
    const req = new Request(`${BASE}/api/affiliate/click/bpc157-10mg-vial`);
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, TEST_ENV, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(404);
  });

  it("bloque target HTTP (non-HTTPS)", async () => {
    spy = mockFetch("http://rcpeptides.to/products/bpc157-10mg-vial");
    const req = new Request(`${BASE}/api/affiliate/click/bpc157-10mg-vial`);
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, TEST_ENV, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(404);
  });
});

describe("Gestion d'erreurs", () => {
  let spy: ReturnType<typeof vi.spyOn>;
  afterEach(() => spy?.mockRestore());

  it("400 sur slug vide", async () => {
    const req = new Request(`${BASE}/api/affiliate/click/`);
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, TEST_ENV, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(400);
  });

  it("400 sur slug avec majuscules", async () => {
    const req = new Request(`${BASE}/api/affiliate/click/BPC-157`);
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, TEST_ENV, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(400);
  });

  it("400 sur tentative injection SQL", async () => {
    const req = new Request(`${BASE}/api/affiliate/click/bpc157'+OR+1=1`);
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, TEST_ENV, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(400);
  });

  it("404 sur produit inconnu", async () => {
    spy = mockFetch(null);
    const req = new Request(`${BASE}/api/affiliate/click/does-not-exist`);
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, TEST_ENV, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(404);
  });

  it("503 quand Supabase lève une exception", async () => {
    spy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    const req = new Request(`${BASE}/api/affiliate/click/bpc157-10mg-vial`);
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, TEST_ENV, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(503);
  });

  it("405 sur POST", async () => {
    const req = new Request(`${BASE}/api/affiliate/click/bpc157-10mg-vial`, { method: "POST" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, TEST_ENV, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(405);
  });

  it("204 sur OPTIONS preflight", async () => {
    const req = new Request(`${BASE}/api/affiliate/click/bpc157-10mg-vial`, { method: "OPTIONS" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, TEST_ENV, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(204);
  });
});

describe("Headers", () => {
  let spy: ReturnType<typeof vi.spyOn>;
  afterEach(() => spy?.mockRestore());

  it("X-Disclosure: affiliate-link", async () => {
    spy = mockFetch(PRODUCT_URL);
    const req = new Request(`${BASE}/api/affiliate/click/bpc157-10mg-vial`);
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, TEST_ENV, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.headers.get("X-Disclosure")).toBe("affiliate-link");
  });

  it("Cache-Control: no-store", async () => {
    spy = mockFetch(PRODUCT_URL);
    const req = new Request(`${BASE}/api/affiliate/click/bpc157-10mg-vial`);
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, TEST_ENV, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("Access-Control-Allow-Origin: *", async () => {
    spy = mockFetch(PRODUCT_URL);
    const req = new Request(`${BASE}/api/affiliate/click/bpc157-10mg-vial`);
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, TEST_ENV, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});
