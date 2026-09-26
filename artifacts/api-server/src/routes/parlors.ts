import { Router, type IRouter } from "express";
import { eq, like, or, and } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  parlorsTable,
  insertParlorSchema,
  updateParlorSchema,
} from "@workspace/db/schema";
import { authenticate, requireRole } from "../middlewares/authenticate";

const router: IRouter = Router();

function parseIdParam(value: string | string[] | undefined): number {
  return typeof value === "string" ? parseInt(value, 10) : NaN;
}

// GET /api/parlors — list parlors with optional search, scoped to the
// caller's country/brand unless they're a superadmin
router.get("/parlors", authenticate, async (req, res) => {
  const search = (req.query.search as string | undefined) ?? "";
  const user = req.user!;
  const isSuperadmin = user.role.trim().toLowerCase() === "superadmin";

  const conditions = [];
  if (search.trim()) {
    const q = `%${search}%`;
    conditions.push(
      or(
        like(parlorsTable.parlorCode, q),
        like(parlorsTable.parlorName, q),
        like(parlorsTable.parlorType, q),
      ),
    );
  }
  if (!isSuperadmin) {
    conditions.push(
      and(
        eq(parlorsTable.countryId, user.countryId ?? -1),
        eq(parlorsTable.brandId, user.brandId ?? -1),
      ),
    );
  }

  const rows = await db
    .select()
    .from(parlorsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json({ parlors: rows });
});

// POST /api/parlors — create a new parlor
router.post("/parlors", authenticate, requireRole("superadmin"), async (req, res) => {
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
    .where(
      and(
        eq(parlorsTable.parlorCode, data.parlorCode),
        eq(parlorsTable.countryId, data.countryId),
      ),
    );

  if (existing.length > 0) {
    res
      .status(409)
      .json({ error: "Parlor code already exists in this country" });
    return;
  }

  const inserted = await db
    .insert(parlorsTable)
    .values(data)
    .returning();

  res.status(201).json(inserted[0]);
});

// PUT /api/parlors/:id — update existing parlor
router.put("/parlors/:id", authenticate, requireRole("superadmin"), async (req, res) => {
  const id = parseIdParam(req.params.id);
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
router.delete("/parlors/:id", authenticate, requireRole("superadmin"), async (req, res) => {
  if (req.get("X-Parlor-Delete-Confirmed") !== "true") {
    res.status(428).json({
      error: "Parlor deletion requires explicit confirmation.",
    });
    return;
  }

  const id = parseIdParam(req.params.id);
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
