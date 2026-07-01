import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, and } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is required. Please add it in Replit Secrets.");
}

const JWT_SECRET: string = jwtSecret;

function sanitizeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    routeCode: user.routeCode,
    agentCode: user.agentCode,
    status: user.status,
  };
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const { userCode, password } = req.body ?? {};

  if (typeof userCode !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "User code and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      and(eq(usersTable.agentCode, userCode), eq(usersTable.status, "active")),
    )
    .limit(1);

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);

  if (!passwordOk) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const sanitizedUser = sanitizeUser(user);

  const token = jwt.sign(sanitizedUser, JWT_SECRET, { expiresIn: "8h" });

  res.json({
    token,
    user: sanitizedUser,
  });
});

router.post("/auth/refresh", authenticate, async (req, res): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id))
    .limit(1);

  if (!user || user.status !== "active") {
    res.status(401).json({ error: "User not found or inactive" });
    return;
  }

  const sanitizedUser = sanitizeUser(user);
  const token = jwt.sign(sanitizedUser, JWT_SECRET, { expiresIn: "8h" });

  res.json({
    token,
    user: sanitizedUser,
  });
});

router.get("/auth/me", authenticate, async (req, res): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id))
    .limit(1);

  if (!user || user.status !== "active") {
    res.status(401).json({ error: "User not found or inactive" });
    return;
  }

  res.json({ user: sanitizeUser(user) });
});

router.post(
  "/auth/change-password",
  authenticate,
  async (req, res): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { currentPassword, newPassword } = req.body ?? {};

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      res
        .status(400)
        .json({ error: "Current password and new password are required" });
      return;
    }

    if (newPassword.length < 8) {
      res
        .status(400)
        .json({ error: "New password must be at least 8 characters" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .limit(1);

    if (!user || !user.passwordHash) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const currentPasswordOk = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!currentPasswordOk) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await db
      .update(usersTable)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(usersTable.id, user.id));

    res.json({ success: true });
  },
);

router.post("/auth/logout", (_req, res): void => {
  res.json({ success: true });
});

export default router;
