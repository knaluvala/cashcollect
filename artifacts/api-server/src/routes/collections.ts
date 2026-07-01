import { Router, type IRouter } from "express";
import { eq, and, gte, lte, or } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  collectionsTable,
  routesTable,
  insertCollectionSchema,
  updateCollectionSchema,
} from "@workspace/db/schema";
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

// GET /api/external/parlor-summary/:parlorCode/:date
// Simulates fetching from an external ERP/POS system
type ExternalSummary = {
  cashAmount: number;
  couponAmount: number;
  ccAmount: number;
  source: string;
  fetchedAt: string;
};

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function deterministicAmount(
  parlorCode: string,
  date: string,
  seed: number,
): number {
  const base = hashCode(parlorCode + date + String(seed));
  // Generate realistic amounts between 500 and 25000
  return Math.round((base % 24500) + 500);
}

router.get("/external/parlor-summary/:parlorCode/:date", async (req, res) => {
  const parlorCode = req.params.parlorCode as string;
  const date = req.params.date as string;

  if (!parlorCode || !date) {
    res.status(400).json({ error: "parlorCode and date are required" });
    return;
  }

  // Simulate external API latency
  await new Promise((r) => setTimeout(r, 120));

  const summary: ExternalSummary = {
    cashAmount: deterministicAmount(parlorCode, date, 1),
    couponAmount: deterministicAmount(parlorCode, date, 2),
    ccAmount: deterministicAmount(parlorCode, date, 3),
    source: "External ERP System (POS/CRM)",
    fetchedAt: new Date().toISOString(),
  };

  res.json(summary);
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
