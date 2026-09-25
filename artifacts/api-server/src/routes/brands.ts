import { Router, type IRouter } from "express";
import { eq, and, like } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  brandsTable,
  countriesTable,
  insertBrandSchema,
  updateBrandSchema,
} from "@workspace/db/schema";
import { authenticate, requireRole } from "../middlewares/authenticate";

const router: IRouter = Router();

function parseIdParam(value: string | string[] | undefined): number {
  return typeof value === "string" ? parseInt(value, 10) : NaN;
}

// GET /api/brands — list brands, optionally filtered by countryId and/or search
router.get("/brands", async (req, res) => {
  const search = (req.query.search as string | undefined) ?? "";
  const countryId = req.query.countryId
    ? parseInt(req.query.countryId as string, 10)
    : undefined;

  const conditions = [];
  if (countryId !== undefined && !Number.isNaN(countryId)) {
    conditions.push(eq(brandsTable.countryId, countryId));
  }
  if (search.trim()) {
    conditions.push(like(brandsTable.name, `%${search}%`));
  }

  const rows = await db
    .select()
    .from(brandsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json({ brands: rows });
});

// POST /api/brands — create a new brand under a country
router.post(
  "/brands",
  authenticate,
  requireRole("superadmin"),
  async (req, res) => {
    const parsed = insertBrandSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues });
      return;
    }

    const country = await db
      .select()
      .from(countriesTable)
      .where(eq(countriesTable.id, parsed.data.countryId));

    if (country.length === 0) {
      res.status(400).json({ error: "Country not found" });
      return;
    }

    const existing = await db
      .select()
      .from(brandsTable)
      .where(
        and(
          eq(brandsTable.countryId, parsed.data.countryId),
          eq(brandsTable.name, parsed.data.name),
        ),
      );

    if (existing.length > 0) {
      res
        .status(409)
        .json({ error: "Brand already exists in this country" });
      return;
    }

    const inserted = await db
      .insert(brandsTable)
      .values(parsed.data)
      .returning();

    res.status(201).json(inserted[0]);
  },
);

// PUT /api/brands/:id — update existing brand
router.put(
  "/brands/:id",
  authenticate,
  requireRole("superadmin"),
  async (req, res) => {
    const id = parseIdParam(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const parsed = updateBrandSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues });
      return;
    }

    const rows = await db
      .select()
      .from(brandsTable)
      .where(eq(brandsTable.id, id));

    if (rows.length === 0) {
      res.status(404).json({ error: "Brand not found" });
      return;
    }

    const updated = await db
      .update(brandsTable)
      .set({ ...parsed.data, updatedAt: new Date().toISOString() })
      .where(eq(brandsTable.id, id))
      .returning();

    res.json(updated[0]);
  },
);

// DELETE /api/brands/:id — delete a brand
router.delete(
  "/brands/:id",
  authenticate,
  requireRole("superadmin"),
  async (req, res) => {
    const id = parseIdParam(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const rows = await db
      .select()
      .from(brandsTable)
      .where(eq(brandsTable.id, id));

    if (rows.length === 0) {
      res.status(404).json({ error: "Brand not found" });
      return;
    }

    await db.delete(brandsTable).where(eq(brandsTable.id, id));

    res.json({ success: true });
  },
);

export default router;
