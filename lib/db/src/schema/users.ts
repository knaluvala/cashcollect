import { pgTable, text, timestamp, serial, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  role: varchar("role", { length: 50 }).notNull().default("agent"),
  routeCode: varchar("route_code", { length: 50 }).notNull().default(""),
  agentCode: varchar("agent_code", { length: 50 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  mobile: varchar("mobile", { length: 50 }).notNull().default(""),
  department: varchar("department", { length: 100 }).notNull().default(""),
  profilePhoto: varchar("profile_photo", { length: 500 }).notNull().default(""),
  lastLogin: timestamp("last_login", { mode: "string" }).defaultNow(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable, {
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email").max(200),
  role: z.enum(["agent", "supervisor", "superadmin"]).default("agent"),
  routeCode: z.string().max(50).default(""),
  agentCode: z.string().min(1, "User code is required").max(50),
  status: z.enum(["active", "inactive"]).default("active"),
  mobile: z.string().max(50).default(""),
  department: z.string().max(100).default(""),
  profilePhoto: z.string().max(500).default(""),
}).omit({ id: true, createdAt: true, updatedAt: true, lastLogin: true });

export const updateUserSchema = insertUserSchema.partial().omit({
  email: true,
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
