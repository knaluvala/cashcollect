import { pgTable, varchar, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { parlorsTable } from "./parlors";

export const routesTable = pgTable("routes", {
  id: serial("id").primaryKey(),
  routeCode: varchar("route_code", { length: 50 }).notNull().unique(),
  description: varchar("description", { length: 500 }).notNull().default(""),
  assignedAgent: varchar("assigned_agent", { length: 200 }).notNull().default(""),
  agentCode: varchar("agent_code", { length: 50 }).notNull().default(""),
  supervisorName: varchar("supervisor_name", { length: 200 }).notNull().default(""),
  supervisorCode: varchar("supervisor_code", { length: 50 }).notNull().default(""),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const routeParlorsTable = pgTable("route_parlors", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").notNull(),
  parlorCode: varchar("parlor_code", { length: 50 }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
});

export const insertRouteSchema = createInsertSchema(routesTable, {
  routeCode: z.string().min(1).max(50),
  description: z.string().max(500).default(""),
  assignedAgent: z.string().max(200).default(""),
  agentCode: z.string().max(50).default(""),
  supervisorName: z.string().max(200).default(""),
  supervisorCode: z.string().max(50).default(""),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateRouteSchema = insertRouteSchema.partial();

export const insertRouteParlorSchema = z.object({
  routeId: z.number(),
  parlorCode: z.string().min(1).max(50),
});

export type Route = typeof routesTable.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type UpdateRoute = z.infer<typeof updateRouteSchema>;
export type RouteParlor = typeof routeParlorsTable.$inferSelect;
export type InsertRouteParlor = z.infer<typeof insertRouteParlorSchema>;
