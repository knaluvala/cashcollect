import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  collectionsTable,
  insertCollectionSchema,
  updateCollectionSchema,
} from "@workspace/db/schema";
import { z } from "zod/v4";

const router: IRouter = Router();

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
        eq(collectionsTable.parlorCode, parlorCode)
      )
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
        eq(collectionsTable.parlorCode, data.parlorCode)
      )
    );

  if (existing.length > 0) {
    res.status(409).json({ error: "Collection already exists for this date and parlor" });
    return;
  }

  const inserted = await db
    .insert(collectionsTable)
    .values(data)
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
    res.status(409).json({ error: "Cannot edit a submitted or acknowledged collection" });
    return;
  }

  const updated = await db
    .update(collectionsTable)
    .set({ ...data, updatedAt: new Date().toISOString() })
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

  const rows = await db
    .select()
    .from(collectionsTable)
    .where(and(...conditions));

  res.json({ collections: rows });
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

export default router;
