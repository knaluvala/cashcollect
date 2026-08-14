import { Router, type IRouter } from "express";
import { lookup } from "node:dns/promises";
import { eq, and, gte, lte, or } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  collectionsTable,
  externalCollectionConfigTable,
  routesTable,
  insertCollectionSchema,
  updateExternalCollectionConfigSchema,
  updateCollectionSchema,
} from "@workspace/db/schema";
import { authenticate, requireRole } from "../middlewares/authenticate";
//import { z } from "zod/v4";
import { z } from "zod";

const router: IRouter = Router();

function triggerExternalAcknowledgeAsync(collection: any) {
  const url = process.env.EXTERNAL_ACK_URL;

  if (!url) {
    console.log(
      "External acknowledge skipped: EXTERNAL_ACK_URL not configured",
    );
    return;
  }

  const payload = {
    collectionId: collection.id,
    parlorCode: collection.parlorCode,
    parlorName: collection.parlorName,
    routeCode: collection.routeCode,
    agentCode: collection.agentCode,
    agentName: collection.agentName,
    collectionDate: collection.collectionDate,
    cashAmount: Number(collection.cashAmount ?? 0),
    couponAmount: Number(collection.couponAmount ?? 0),
    ccAmount: Number(collection.ccAmount ?? 0),
    totalAmount:
      Number(collection.cashAmount ?? 0) +
      Number(collection.couponAmount ?? 0) +
      Number(collection.ccAmount ?? 0),
    status: collection.status,
    acknowledgedAt: collection.acknowledgedAt,
    acknowledgedBy: collection.acknowledgedBy,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.EXTERNAL_ACK_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXTERNAL_ACK_TOKEN}`;
  }

  fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })
    .then(async (response) => {
      const text = await response.text();
      console.log("External acknowledge trigger result:", {
        ok: response.ok,
        status: response.status,
        response: text,
      });
    })
    .catch((error) => {
      console.error("External acknowledge trigger failed:", error);
    });
}

// GET /api/collections?date=YYYY-MM-DD&parlorCode=XXX
router.get("/collections", async (req, res) => {
  const date = req.query.date as string;
  const parlorCode = req.query.parlorCode as string;

  if (!date || !parlorCode) {
    res.status(400).json({ error: "date and parlorCode are required" });
    return;
  }

  const rows = await db
    .select()
    .from(collectionsTable)
    .where(
      and(
        eq(collectionsTable.collectionDate, date),
        eq(collectionsTable.parlorCode, parlorCode),
      ),
    );

  res.json({ collection: rows[0] ?? null });
});

// POST /api/collections — create a new collection
router.post("/collections", async (req, res) => {
  const body = req.body;
  const parsed = insertCollectionSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  // Check if already exists
  const existing = await db
    .select()
    .from(collectionsTable)
    .where(
      and(
        eq(collectionsTable.collectionDate, data.collectionDate),
        eq(collectionsTable.parlorCode, data.parlorCode),
      ),
    );

  if (existing.length > 0) {
    res
      .status(409)
      .json({ error: "Collection already exists for this date and parlor" });
    return;
  }

  const inserted = await db
    .insert(collectionsTable)
    //.values(data)
    .values({
      ...data,
      cashAmount: String(data.cashAmount),
      couponAmount: String(data.couponAmount),
      ccAmount: String(data.ccAmount),
    })
    .returning();

  res.status(201).json(inserted[0]);
});

// PUT /api/collections/:id — update existing draft
router.put("/collections/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = req.body;
  const parsed = updateCollectionSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  // Prevent editing submitted/acknowledged
  const rows = await db
    .select()
    .from(collectionsTable)
    .where(eq(collectionsTable.id, id));

  if (rows.length === 0) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  if (rows[0].status === "submitted" || rows[0].status === "acknowledged") {
    res
      .status(409)
      .json({ error: "Cannot edit a submitted or acknowledged collection" });
    return;
  }

  const updated = await db
    .update(collectionsTable)
    //.set({ ...data, updatedAt: new Date().toISOString() })
    .set({
      ...data,
      cashAmount:
        data.cashAmount !== undefined ? String(data.cashAmount) : undefined,
      couponAmount:
        data.couponAmount !== undefined ? String(data.couponAmount) : undefined,
      ccAmount: data.ccAmount !== undefined ? String(data.ccAmount) : undefined,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(collectionsTable.id, id))
    .returning();

  res.json(updated[0]);
});

// GET /api/collections/list — all collections for a date (+ optional agent)
router.get("/collections/list", async (req, res) => {
  const date = req.query.date as string;
  const agentCode = req.query.agentCode as string | undefined;

  if (!date) {
    res.status(400).json({ error: "date is required" });
    return;
  }

  const conditions = [eq(collectionsTable.collectionDate, date)];
  if (agentCode) {
    conditions.push(eq(collectionsTable.agentCode, agentCode));
  }

  const rows = await db
    .select()
    .from(collectionsTable)
    .where(and(...conditions));

  res.json({ collections: rows });
});

// GET /api/collections/reports — collections within a date range
router.get("/collections/reports", async (req, res) => {
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;
  const agentCode = req.query.agentCode as string | undefined;
  const parlorCode = req.query.parlorCode as string | undefined;
  const status = req.query.status as string | undefined;
  const supervisorCode = req.query.supervisorCode as string | undefined;

  if (!dateFrom || !dateTo) {
    res.status(400).json({ error: "dateFrom and dateTo are required" });
    return;
  }

  const conditions = [
    gte(collectionsTable.collectionDate, dateFrom),
    lte(collectionsTable.collectionDate, dateTo),
  ];
  if (agentCode) {
    conditions.push(eq(collectionsTable.agentCode, agentCode));
  }
  if (parlorCode) {
    conditions.push(eq(collectionsTable.parlorCode, parlorCode));
  }
  if (status) {
    conditions.push(eq(collectionsTable.status, status));
  }
  if (supervisorCode) {
    conditions.push(eq(collectionsTable.status, "submitted"));
  }

  const rows = await db
    .select()
    .from(collectionsTable)
    .where(and(...conditions));

  res.json({ collections: rows });
});

async function triggerExternalAcknowledge(collection: any) {
  const url = process.env.EXTERNAL_ACK_URL;

  if (!url) {
    return {
      skipped: true,
      message: "EXTERNAL_ACK_URL not configured",
    };
  }

  const payload = {
    collectionId: collection.id,
    parlorCode: collection.parlorCode,
    parlorName: collection.parlorName,
    routeCode: collection.routeCode,
    agentCode: collection.agentCode,
    agentName: collection.agentName,
    collectionDate: collection.collectionDate,
    cashAmount: Number(collection.cashAmount ?? 0),
    couponAmount: Number(collection.couponAmount ?? 0),
    ccAmount: Number(collection.ccAmount ?? 0),
    totalAmount:
      Number(collection.cashAmount ?? 0) +
      Number(collection.couponAmount ?? 0) +
      Number(collection.ccAmount ?? 0),
    status: collection.status,
    acknowledgedAt: collection.acknowledgedAt,
    acknowledgedBy: collection.acknowledgedBy,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.EXTERNAL_ACK_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXTERNAL_ACK_TOKEN}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  return {
    skipped: false,
    ok: response.ok,
    status: response.status,
    response: responseText,
  };
}

// POST /api/collections/:id/acknowledge — supervisor acknowledges receipt
router.post("/collections/:id/acknowledge", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const acknowledgedBy =
    typeof req.body?.acknowledgedBy === "string"
      ? req.body.acknowledgedBy
      : "Supervisor";

  const rows = await db
    .select()
    .from(collectionsTable)
    .where(eq(collectionsTable.id, id));

  if (rows.length === 0) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  if (rows[0].status !== "submitted") {
    res
      .status(409)
      .json({ error: "Only submitted collections can be acknowledged" });
    return;
  }

  //res.json(updated[0]);
  const updated = await db
    .update(collectionsTable)
    .set({
      status: "acknowledged",
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(collectionsTable.id, id))
    .returning();

  triggerExternalAcknowledgeAsync(updated[0]);

  res.json(updated[0]);

  /* try {
    externalTrigger = await triggerExternalAcknowledge(updated[0]);
  } catch (error) {
    console.error("External acknowledge trigger failed:", error);
    externalTrigger = {
      skipped: false,
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  res.json({
    ...updated[0],
    externalTrigger,
  }); 
       */
});

type ExternalSummary = {
  cashAmount: number;
  couponAmount: number;
  ccAmount: number;
  source: string;
  fetchedAt: string;
};

function serializeExternalConfig(config: typeof externalCollectionConfigTable.$inferSelect) {
  return {
    ...config,
    endpoint: config.endpoint ?? "",
  };
}

function getValueAtPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (
      !segment ||
      segment === "__proto__" ||
      segment === "constructor" ||
      segment === "prototype" ||
      current === null ||
      typeof current !== "object"
    ) {
      return undefined;
    }
    return (current as Record<string, unknown>)[segment];
  }, value);
}

function toAmount(value: unknown): number | null {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.replace(/,/g, "").trim())
        : Number.NaN;
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function isPrivateNetworkAddress(address: string): boolean {
  const ipv4 = address.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [first, second] = ipv4.slice(1).map(Number);
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 100 && second >= 64 && second <= 127)
    );
  }

  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

async function isSafeExternalEndpoint(endpoint: URL): Promise<boolean> {
  const addresses = await lookup(endpoint.hostname, { all: true });
  return addresses.length > 0 && !addresses.some(({ address }) => isPrivateNetworkAddress(address));
}

router.get(
  "/external/collection-config",
  authenticate,
  requireRole("superadmin"),
  async (_req, res) => {
    const [config] = await db
      .select()
      .from(externalCollectionConfigTable)
      .where(eq(externalCollectionConfigTable.id, 1));

    res.json({
      config: config
        ? serializeExternalConfig(config)
        : {
            enabled: false,
            endpoint: "",
            sourceLabel: "External System",
            parlorCodeParameter: "parlorCode",
            dateParameter: "date",
            cashAmountPath: "cashAmount",
            couponAmountPath: "couponAmount",
            ccAmountPath: "ccAmount",
          },
      credentialConfigured: Boolean(process.env.EXTERNAL_COLLECTIONS_API_TOKEN),
    });
  },
);

router.put(
  "/external/collection-config",
  authenticate,
  requireRole("superadmin"),
  async (req, res) => {
    const parsed = updateExternalCollectionConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid external collection configuration" });
      return;
    }

    const data = {
      ...parsed.data,
      endpoint: parsed.data.endpoint || null,
      updatedBy: req.user?.email,
      updatedAt: new Date(),
    };
    const [config] = await db
      .insert(externalCollectionConfigTable)
      .values({ id: 1, ...data })
      .onConflictDoUpdate({
        target: externalCollectionConfigTable.id,
        set: data,
      })
      .returning();

    res.json({
      config: serializeExternalConfig(config),
      credentialConfigured: Boolean(process.env.EXTERNAL_COLLECTIONS_API_TOKEN),
    });
  },
);

router.get("/external/parlor-summary/:parlorCode/:date", async (req, res) => {
  const parlorCode = req.params.parlorCode as string;
  const date = req.params.date as string;

  if (!parlorCode || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: "A parlor code and valid date are required" });
    return;
  }

  const [config] = await db
    .select()
    .from(externalCollectionConfigTable)
    .where(eq(externalCollectionConfigTable.id, 1));

  if (!config?.enabled || !config.endpoint) {
    res.status(503).json({
      error: "External collection source is not configured.",
      code: "EXTERNAL_SOURCE_UNCONFIGURED",
    });
    return;
  }

  let endpoint: URL;
  try {
    endpoint = new URL(config.endpoint);
    if (endpoint.protocol !== "https:") throw new Error();
  } catch {
    res.status(503).json({
      error: "External collection source has an invalid endpoint.",
      code: "EXTERNAL_SOURCE_INVALID_CONFIG",
    });
    return;
  }

  try {
    if (!(await isSafeExternalEndpoint(endpoint))) {
      throw new Error("External endpoint resolves to a private network address");
    }
  } catch (error) {
    req.log.warn(
      { err: error, endpoint: endpoint.hostname },
      "Rejected unsafe external collection endpoint",
    );
    res.status(503).json({
      error: "External collection source has an unsafe endpoint.",
      code: "EXTERNAL_SOURCE_UNSAFE_ENDPOINT",
    });
    return;
  }

  const token = process.env.EXTERNAL_COLLECTIONS_API_TOKEN;
  const allowedTokenHosts = new Set(
    (process.env.EXTERNAL_COLLECTIONS_ALLOWED_HOSTS ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );
  if (token && !allowedTokenHosts.has(endpoint.hostname.toLowerCase())) {
    res.status(503).json({
      error: "External collection source is not approved to receive the configured credential.",
      code: "EXTERNAL_SOURCE_CREDENTIAL_HOST_NOT_ALLOWED",
    });
    return;
  }

  endpoint.searchParams.set(config.parlorCodeParameter, parlorCode);
  endpoint.searchParams.set(config.dateParameter, date);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      headers,
      signal: controller.signal,
      redirect: "error",
    });
    if (!response.ok) {
      req.log.warn(
        { statusCode: response.status, endpoint: endpoint.origin },
        "External collection source returned an error",
      );
      res.status(502).json({
        error: "External collection source is currently unavailable.",
        code: "EXTERNAL_SOURCE_ERROR",
      });
      return;
    }

    const payload: unknown = await response.json();
    const cashAmount = toAmount(getValueAtPath(payload, config.cashAmountPath));
    const couponAmount = toAmount(
      getValueAtPath(payload, config.couponAmountPath),
    );
    const ccAmount = toAmount(getValueAtPath(payload, config.ccAmountPath));

    if (cashAmount === null || couponAmount === null || ccAmount === null) {
      res.status(502).json({
        error: "External collection source returned invalid amount fields.",
        code: "EXTERNAL_SOURCE_INVALID_DATA",
      });
      return;
    }

    const summary: ExternalSummary = {
      cashAmount,
      couponAmount,
      ccAmount,
      source: config.sourceLabel,
      fetchedAt: new Date().toISOString(),
    };
    res.json(summary);
  } catch (error) {
    req.log.warn(
      { err: error, endpoint: endpoint.origin },
      "External collection source request failed",
    );
    res.status(502).json({
      error: "External collection source is currently unavailable.",
      code: "EXTERNAL_SOURCE_UNAVAILABLE",
    });
  } finally {
    clearTimeout(timeout);
  }
});

// POST /api/collections/:id/submit — submit to supervisor
router.post("/collections/:id/submit", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const rows = await db
    .select()
    .from(collectionsTable)
    .where(eq(collectionsTable.id, id));

  if (rows.length === 0) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  if (rows[0].status === "submitted" || rows[0].status === "acknowledged") {
    res.status(409).json({ error: "Already submitted or acknowledged" });
    return;
  }

  const updated = await db
    .update(collectionsTable)
    .set({
      status: "submitted",
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(collectionsTable.id, id))
    .returning();

  res.json(updated[0]);
});

// GET /api/collections/supervisor?date=YYYY-MM-DD&supervisorCode=SUP-012
router.get("/collections/supervisor", async (req, res) => {
  const date = req.query.date as string;
  const supervisorCode = req.query.supervisorCode as string;

  if (!date || !supervisorCode) {
    res.status(400).json({ error: "date and supervisorCode are required" });
    return;
  }

  const supervisorRoutes = await db
    .select()
    .from(routesTable)
    .where(eq(routesTable.supervisorCode, supervisorCode));

  const agentCodes = supervisorRoutes.map((r) => r.agentCode).filter(Boolean);

  if (agentCodes.length === 0) {
    res.json({ collections: [] });
    return;
  }

  const rows = await db
    .select()
    .from(collectionsTable)
    .where(
      and(
        eq(collectionsTable.collectionDate, date),
        or(...agentCodes.map((code) => eq(collectionsTable.agentCode, code))),
        or(
          eq(collectionsTable.status, "submitted"),
          eq(collectionsTable.status, "acknowledged"),
        ),
      ),
    );

  res.json({ collections: rows });
});

export default router;
