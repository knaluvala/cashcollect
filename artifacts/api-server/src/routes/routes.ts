import { Router, type IRouter } from "express";
import { and, eq, like, or } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  routesTable,
  routeParlorsTable,
  insertRouteSchema,
  updateRouteSchema,
} from "@workspace/db/schema";
import { authenticate, requireRole } from "../middlewares/authenticate";

const router: IRouter = Router();

function parseIdParam(value: string | string[] | undefined): number {
  return typeof value === "string" ? parseInt(value, 10) : NaN;
}

// GET /api/routes — list routes with optional search, scoped to the
// caller's country/brand unless they're a superadmin
router.get("/routes", authenticate, async (req, res) => {
  const search = (req.query.search as string | undefined) ?? "";
  const user = req.user!;
  const isSuperadmin = user.role.trim().toLowerCase() === "superadmin";

  const conditions = [];
  if (search.trim()) {
    const q = `%${search}%`;
    conditions.push(
      or(
        like(routesTable.routeCode, q),
        like(routesTable.description, q),
        like(routesTable.assignedAgent, q),
      ),
    );
  }
  if (!isSuperadmin) {
    conditions.push(
      and(
        eq(routesTable.countryId, user.countryId ?? -1),
        eq(routesTable.brandId, user.brandId ?? -1),
      ),
    );
  }

  const routeRows = await db
    .select()
    .from(routesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Fetch parlors for each route
  const parlors = await db.select().from(routeParlorsTable);

  const routesWithParlors = routeRows.map((r) => ({
    ...r,
    parlors: parlors
      .filter((p) => p.routeId === r.id)
      .map((p) => ({ code: p.parlorCode })),
  }));

  res.json({ routes: routesWithParlors });
});

// POST /api/routes — create a new route
router.post("/routes", authenticate, requireRole("superadmin"), async (req, res) => {
  const body = req.body;
  const parsed = insertRouteSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const data = parsed.data;

  const existing = await db
    .select()
    .from(routesTable)
    .where(
      and(
        eq(routesTable.routeCode, data.routeCode),
        eq(routesTable.countryId, data.countryId),
      ),
    );

  if (existing.length > 0) {
    res
      .status(409)
      .json({ error: "Route code already exists in this country" });
    return;
  }

  const inserted = await db
    .insert(routesTable)
    .values(data)
    .returning();

  res.status(201).json(inserted[0]);
});

// PUT /api/routes/:id — update existing route
router.put("/routes/:id", authenticate, requireRole("superadmin"), async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = req.body;
  const parsed = updateRouteSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const rows = await db
    .select()
    .from(routesTable)
    .where(eq(routesTable.id, id));

  if (rows.length === 0) {
    res.status(404).json({ error: "Route not found" });
    return;
  }

  const updated = await db
    .update(routesTable)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(routesTable.id, id))
    .returning();

  res.json(updated[0]);
});

// DELETE /api/routes/:id — delete a route and its parlor assignments
router.delete("/routes/:id", authenticate, requireRole("superadmin"), async (req, res) => {
  if (req.get("X-Route-Delete-Confirmed") !== "true") {
    res.status(428).json({
      error: "Route deletion requires explicit confirmation.",
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
    .from(routesTable)
    .where(eq(routesTable.id, id));

  if (rows.length === 0) {
    res.status(404).json({ error: "Route not found" });
    return;
  }

  // Delete route_parlors first, then route
  await db.delete(routeParlorsTable).where(eq(routeParlorsTable.routeId, id));
  await db.delete(routesTable).where(eq(routesTable.id, id));

  res.json({ success: true });
});

// POST /api/routes/:routeId/parlors — add a parlor to a route
router.post("/routes/:routeId/parlors", authenticate, requireRole("superadmin"), async (req, res) => {
  const routeId = parseIdParam(req.params.routeId);
  if (Number.isNaN(routeId)) {
    res.status(400).json({ error: "Invalid routeId" });
    return;
  }

  const { parlorCode } = req.body;
  if (!parlorCode || typeof parlorCode !== "string") {
    res.status(400).json({ error: "parlorCode is required" });
    return;
  }

  const route = await db
    .select()
    .from(routesTable)
    .where(eq(routesTable.id, routeId));
  if (route.length === 0) {
    res.status(404).json({ error: "Route not found" });
    return;
  }

  const existing = await db
    .select()
    .from(routeParlorsTable)
    .where(
      eq(routeParlorsTable.routeId, routeId)
    );
  if (existing.some((p) => p.parlorCode === parlorCode)) {
    res.status(409).json({ error: "Parlor already assigned to this route" });
    return;
  }

  const inserted = await db
    .insert(routeParlorsTable)
    .values({ routeId, parlorCode })
    .returning();

  res.status(201).json(inserted[0]);
});

// DELETE /api/routes/:routeId/parlors/:parlorCode — remove a parlor from a route
router.delete("/routes/:routeId/parlors/:parlorCode", authenticate, requireRole("superadmin"), async (req, res) => {
  const routeId = parseIdParam(req.params.routeId);
  const parlorCode =
    typeof req.params.parlorCode === "string" ? req.params.parlorCode : "";
  if (Number.isNaN(routeId)) {
    res.status(400).json({ error: "Invalid routeId" });
    return;
  }

  await db
    .delete(routeParlorsTable)
    .where(
      and(
        eq(routeParlorsTable.routeId, routeId),
        eq(routeParlorsTable.parlorCode, parlorCode)
      )
    );

  res.json({ success: true });
});

export default router;
