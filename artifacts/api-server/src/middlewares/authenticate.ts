import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is required. Please add it in Replit Secrets.");
}

const JWT_SECRET: string = jwtSecret;

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  agentCode: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  const user = value as AuthUser;

  return (
    typeof user?.id === "number" &&
    typeof user?.name === "string" &&
    typeof user?.email === "string" &&
    typeof user?.role === "string" &&
    typeof user?.agentCode === "string"
  );
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!isAuthUser(decoded)) {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const normalizedRole =
      req.user.role.trim().toLowerCase() === "admin"
        ? "superadmin"
        : req.user.role.trim().toLowerCase();

    if (!roles.includes(normalizedRole)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    next();
  };
}
