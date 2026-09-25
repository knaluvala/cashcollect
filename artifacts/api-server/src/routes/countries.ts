import { Router, type IRouter } from "express";
import { eq, like } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  countriesTable,
  insertCountrySchema,
  updateCountrySchema,
} from "@workspace/db/schema";
import { authenticate, requireRole } from "../middlewares/authenticate";

const router: IRouter = Router();

function parseIdParam(value: string | string[] | undefined): number {
  return typeof value === "string" ? parseInt(value, 10) : NaN;
}

// GET /api/countries — list all countries with optional search
router.get("/countries", async (req, res) => {
  const search = (req.query.search as string | undefined) ?? "";

  let rows;
  if (search.trim()) {
    rows = await db
      .select()
      .from(countriesTable)
      .where(like(countriesTable.name, `%${search}%`));
  } else {
    rows = await db.select().from(countriesTable);
  }

  res.json({ countries: rows });
});

// POST /api/countries — create a new country
router.post(
  "/countries",
  authenticate,
  requireRole("superadmin"),
  async (req, res) => {
    const parsed = insertCountrySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues });
      return;
    }

    const existing = await db
      .select()
      .from(countriesTable)
      .where(eq(countriesTable.name, parsed.data.name));

    if (existing.length > 0) {
      res.status(409).json({ error: "Country already exists" });
      return;
    }

    const inserted = await db
      .insert(countriesTable)
      .values(parsed.data)
      .returning();

    res.status(201).json(inserted[0]);
  },
);

// PUT /api/countries/:id — update existing country
router.put(
  "/countries/:id",
  authenticate,
  requireRole("superadmin"),
  async (req, res) => {
    const id = parseIdParam(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const parsed = updateCountrySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues });
      return;
    }

    const rows = await db
      .select()
      .from(countriesTable)
      .where(eq(countriesTable.id, id));

    if (rows.length === 0) {
      res.status(404).json({ error: "Country not found" });
      return;
    }

    const updated = await db
      .update(countriesTable)
      .set({ ...parsed.data, updatedAt: new Date().toISOString() })
      .where(eq(countriesTable.id, id))
      .returning();

    res.json(updated[0]);
  },
);

// DELETE /api/countries/:id — delete a country
router.delete(
  "/countries/:id",
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
      .from(countriesTable)
      .where(eq(countriesTable.id, id));

    if (rows.length === 0) {
      res.status(404).json({ error: "Country not found" });
      return;
    }

    await db.delete(countriesTable).where(eq(countriesTable.id, id));

    res.json({ success: true });
  },
);

export default router;
