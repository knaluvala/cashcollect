import { Router, type IRouter } from "express";
import { eq, like, or } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  usersTable,
  insertUserSchema,
  updateUserSchema,
} from "@workspace/db/schema";

const router: IRouter = Router();

// GET /api/users — list all users with optional search
router.get("/users", async (req, res) => {
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
          like(usersTable.routeCode, q)
        )
      );
  } else {
    rows = await db.select().from(usersTable);
  }

  res.json({ users: rows });
});

// POST /api/users — create a new user
router.post("/users", async (req, res) => {
  const body = req.body;
  const parsed = insertUserSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const data = parsed.data;

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

  const inserted = await db
    .insert(usersTable)
    .values(data)
    .returning();

  res.status(201).json(inserted[0]);
});

// PUT /api/users/:id — update existing user
router.put("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = req.body;
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }

  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id));

  if (rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const updated = await db
    .update(usersTable)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(usersTable.id, id))
    .returning();

  res.json(updated[0]);
});

// DELETE /api/users/:id — delete a user
router.delete("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id));

  if (rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, id));

  res.json({ success: true });
});

export default router;
