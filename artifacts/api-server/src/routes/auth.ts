import { Router } from "express";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { eq, and, or } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is required. Please add it in Replit Secrets.");
}

const JWT_SECRET: string = jwtSecret;

function canonicalRole(role: string): "agent" | "supervisor" | "superadmin" {
  const normalized = role.trim().toLowerCase();
  if (normalized === "admin" || normalized === "superadmin") {
    return "superadmin";
  }
  if (normalized === "supervisor") {
    return "supervisor";
  }
  return "agent";
}

function isActiveStatus(status: string): boolean {
  return status.trim().toLowerCase() === "active";
}

function sanitizeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: canonicalRole(user.role),
    routeCode: user.routeCode,
    agentCode: user.agentCode,
    status: user.status,
  };
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const { identifier: submittedIdentifier, userCode, password } = req.body ?? {};
  const identifier =
    typeof submittedIdentifier === "string" ? submittedIdentifier.trim() : userCode?.trim();

  if (!identifier || typeof password !== "string") {
    res.status(400).json({ error: "User code or email address and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      and(
        or(
          eq(usersTable.agentCode, identifier),
          eq(usersTable.email, identifier.toLowerCase()),
        ),
      ),
    )
    .limit(1);

  if (!user || !isActiveStatus(user.status) || !user.passwordHash) {
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

router.post("/auth/recover-initial-admin", async (req, res): Promise<void> => {
  const recoveryToken = process.env.ADMIN_RECOVERY_TOKEN;
  const resetPassword = process.env.ADMIN_RESET_PASSWORD;
  const submittedToken = req.body?.recoveryToken;

  if (!recoveryToken || !resetPassword) {
    res.status(503).json({ error: "Administrator recovery is not enabled." });
    return;
  }

  if (
    typeof submittedToken !== "string" ||
    submittedToken.length !== recoveryToken.length ||
    !timingSafeEqual(
      Buffer.from(submittedToken),
      Buffer.from(recoveryToken),
    )
  ) {
    res.status(401).json({ error: "Invalid recovery token." });
    return;
  }

  const [initialAdmin] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.agentCode, "ADM-001"))
    .limit(1);

  if (!initialAdmin) {
    res.status(404).json({ error: "Initial administrator account was not found." });
    return;
  }

  await db
    .update(usersTable)
    .set({
      role: "superadmin",
      status: "active",
      passwordHash: await bcrypt.hash(resetPassword, 10),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(usersTable.id, initialAdmin.id));

  res.json({
    message: "Administrator password reset. You can now sign in with ADM-001.",
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

  if (!user || !isActiveStatus(user.status)) {
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

  if (!user || !isActiveStatus(user.status)) {
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
