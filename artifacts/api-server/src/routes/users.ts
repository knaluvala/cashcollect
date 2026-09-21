import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, like, or } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  usersTable,
  insertUserSchema,
  updateUserSchema,
} from "@workspace/db/schema";
import bcrypt from "bcryptjs";
import { z } from "zod/v4";
import { authenticate, requireRole } from "../middlewares/authenticate";

const router: IRouter = Router();

const createUserSchema = insertUserSchema
  .omit({ passwordHash: true })
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters"),
  });

const updateUserInputSchema = updateUserSchema.omit({ passwordHash: true });

function sanitizeUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function parseIdParam(value: string | string[] | undefined): number {
  return typeof value === "string" ? parseInt(value, 10) : NaN;
}

// Allows creating the very first user (the initial superadmin) without
// authentication, since no token can exist yet on a fresh install. Once at
// least one user exists, this endpoint requires an authenticated superadmin.
async function requireSuperadminUnlessBootstrap(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const existing = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
  if (existing.length === 0) {
    next();
    return;
  }
  authenticate(req, res, () => requireRole("superadmin")(req, res, next));
}

// GET /api/users — list all users with optional search
router.get("/users", authenticate, async (req, res) => {
  const search = (req.query.search as string | undefined) ?? "";

  let rows;
  if (search.trim()) {
    const q = `%${search}%`;
    rows = await db
      .select()
      .from(usersTable)
      .where(
        or(
          like(usersTable.name, q),
          like(usersTable.email, q),
          like(usersTable.agentCode, q),
          like(usersTable.routeCode, q),
        ),
      );
  } else {
    rows = await db.select().from(usersTable);
  }

  // res.json({ users: rows });
  res.json({ users: rows.map(sanitizeUser) });
});

// GET /api/users/me — get the authenticated user's own record
router.get("/users/me", authenticate, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id));

  if (rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Update lastLogin on fetch
  await db
    .update(usersTable)
    .set({ lastLogin: new Date().toISOString() })
    .where(eq(usersTable.id, rows[0].id));

  // res.json({ user: rows[0] });
  res.json({ user: sanitizeUser(rows[0]) });
});

// POST /api/users — create a new user
router.post("/users", requireSuperadminUnlessBootstrap, async (req, res) => {
  const body = req.body;
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const { password, ...data } = parsed.data;

  // Check for duplicate email
  const existingEmail = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, data.email));
  if (existingEmail.length > 0) {
    res.status(409).json({ error: "Email already exists" });
    return;
  }

  // Check for duplicate agentCode
  const existingCode = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.agentCode, data.agentCode));
  if (existingCode.length > 0) {
    res.status(409).json({ error: "User code already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const inserted = await db
    .insert(usersTable)
    .values({ ...data, passwordHash })
    .returning();

  // res.status(201).json(inserted[0]);
  res.status(201).json(sanitizeUser(inserted[0]));
});

// PUT /api/users/:id — update existing user
router.put("/users/:id", authenticate, requireRole("superadmin"), async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = req.body;
  const parsed = updateUserInputSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const rows = await db.select().from(usersTable).where(eq(usersTable.id, id));

  if (rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (parsed.data.email) {
    const existingEmail = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, parsed.data.email));
    if (existingEmail.length > 0 && existingEmail[0].id !== id) {
      res.status(409).json({ error: "Email already exists" });
      return;
    }
  }

  if (parsed.data.agentCode) {
    const existingCode = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.agentCode, parsed.data.agentCode));
    if (existingCode.length > 0 && existingCode[0].id !== id) {
      res.status(409).json({ error: "User code already exists" });
      return;
    }
  }

  const updated = await db
    .update(usersTable)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(usersTable.id, id))
    .returning();

  // res.json(updated[0]);
  res.json(sanitizeUser(updated[0]));
});

// POST /api/users/:id/reset-password — super admin resets user password
router.post("/users/:id/reset-password", authenticate, requireRole("superadmin"), async (req, res) => {
  const id = parseIdParam(req.params.id);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { newPassword } = req.body ?? {};

  if (typeof newPassword !== "string") {
    res.status(400).json({ error: "New password is required" });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" });
    return;
  }

  const rows = await db.select().from(usersTable).where(eq(usersTable.id, id));

  if (rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  const updated = await db
    .update(usersTable)
    .set({
      passwordHash: newPasswordHash,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(usersTable.id, id))
    .returning();

  res.json({
    success: true,
    user: sanitizeUser(updated[0]),
  });
});

// DELETE /api/users/:id — delete a user
router.delete("/users/:id", authenticate, requireRole("superadmin"), async (req, res) => {
  if (req.get("X-User-Delete-Confirmed") !== "true") {
    res.status(428).json({
      error: "User deletion requires explicit confirmation.",
    });
    return;
  }

  const id = parseIdParam(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const rows = await db.select().from(usersTable).where(eq(usersTable.id, id));

  if (rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, id));

  res.json({ success: true });
});

export default router;
