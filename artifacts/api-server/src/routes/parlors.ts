import { Router, type IRouter } from "express";
import { eq, like, or } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  parlorsTable,
  insertParlorSchema,
  updateParlorSchema,
} from "@workspace/db/schema";

const router: IRouter = Router();

// GET /api/parlors — list all parlors with optional search
router.get("/parlors", async (req, res) => {
  const search = (req.query.search as string | undefined) ?? "";

  let rows;
  if (search.trim()) {
    const q = `%${search}%`;
    rows = await db
      .select()
      .from(parlorsTable)
      .where(
        or(
          like(parlorsTable.parlorCode, q),
          like(parlorsTable.parlorName, q),
          like(parlorsTable.parlorType, q)
        )
      );
  } else {
    rows = await db.select().from(parlorsTable);
  }

  res.json({ parlors: rows });
});

// POST /api/parlors — create a new parlor
router.post("/parlors", async (req, res) => {
  const body = req.body;
  const parsed = insertParlorSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const data = parsed.data;

  const existing = await db
    .select()
    .from(parlorsTable)
    .where(eq(parlorsTable.parlorCode, data.parlorCode));

  if (existing.length > 0) {
    res.status(409).json({ error: "Parlor code already exists" });
    return;
  }

  const inserted = await db
    .insert(parlorsTable)
    .values(data)
    .returning();

  res.status(201).json(inserted[0]);
});

// PUT /api/parlors/:id — update existing parlor
router.put("/parlors/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = req.body;
  const parsed = updateParlorSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const rows = await db
    .select()
    .from(parlorsTable)
    .where(eq(parlorsTable.id, id));

  if (rows.length === 0) {
    res.status(404).json({ error: "Parlor not found" });
    return;
  }

  const updated = await db
    .update(parlorsTable)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(parlorsTable.id, id))
    .returning();

  res.json(updated[0]);
});

// DELETE /api/parlors/:id — delete a parlor
router.delete("/parlors/:id", async (req, res) => {
  if (req.get("X-Parlor-Delete-Confirmed") !== "true") {
    res.status(428).json({
      error: "Parlor deletion requires explicit confirmation.",
    });
    return;
  }

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const rows = await db
    .select()
    .from(parlorsTable)
    .where(eq(parlorsTable.id, id));

  if (rows.length === 0) {
    res.status(404).json({ error: "Parlor not found" });
    return;
  }

  await db.delete(parlorsTable).where(eq(parlorsTable.id, id));

  res.json({ success: true });
});

export default router;
