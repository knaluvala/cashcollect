import { pgTable, text, date, numeric, timestamp, serial, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const collectionsTable = pgTable("collections", {
  id: serial("id").primaryKey(),
  parlorCode: varchar("parlor_code", { length: 50 }).notNull(),
  parlorName: varchar("parlor_name", { length: 200 }).notNull(),
  parlorType: varchar("parlor_type", { length: 50 }).notNull(),
  routeCode: varchar("route_code", { length: 50 }).notNull(),
  agentCode: varchar("agent_code", { length: 50 }).notNull(),
  agentName: varchar("agent_name", { length: 200 }).notNull(),
  collectionDate: date("collection_date").notNull(),
  cashAmount: numeric("cash_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  couponAmount: numeric("coupon_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  ccAmount: numeric("cc_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes").default(""),
  status: varchar("status", { length: 50 }).notNull().default("entered"),
  submittedAt: timestamp("submitted_at", { mode: "string" }),
  acknowledgedAt: timestamp("acknowledged_at", { mode: "string" }),
  acknowledgedBy: varchar("acknowledged_by", { length: 200 }),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const insertCollectionSchema = createInsertSchema(collectionsTable, {
  cashAmount: z.coerce.number().min(0, "Must be >= 0"),
  couponAmount: z.coerce.number().min(0, "Must be >= 0"),
  ccAmount: z.coerce.number().min(0, "Must be >= 0"),
  notes: z.string().default(""),
  status: z.enum(["entered", "submitted", "acknowledged"]).default("entered"),
  submittedAt: z.string().optional(),
  acknowledgedAt: z.string().optional(),
  acknowledgedBy: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateCollectionSchema = insertCollectionSchema.partial().omit({
  parlorCode: true,
  parlorName: true,
  parlorType: true,
  routeCode: true,
  agentCode: true,
  agentName: true,
  collectionDate: true,
});

export type Collection = typeof collectionsTable.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type UpdateCollection = z.infer<typeof updateCollectionSchema>;
