import { pgTable, varchar, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const parlorsTable = pgTable("parlors", {
  id: serial("id").primaryKey(),
  parlorCode: varchar("parlor_code", { length: 50 }).notNull().unique(),
  parlorName: varchar("parlor_name", { length: 200 }).notNull(),
  parlorType: varchar("parlor_type", { length: 50 }).notNull(),
  countryId: integer("country_id"),
  brandId: integer("brand_id"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const insertParlorSchema = createInsertSchema(parlorsTable, {
  parlorCode: z.string().min(1).max(50),
  parlorName: z.string().min(1).max(200),
  parlorType: z.enum(["Mall", "Standalone", "Event", "Kiosk", "Cart"]),
  countryId: z.number().int().positive().nullable().optional(),
  brandId: z.number().int().positive().nullable().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateParlorSchema = insertParlorSchema.partial();

export type Parlor = typeof parlorsTable.$inferSelect;
export type InsertParlor = z.infer<typeof insertParlorSchema>;
export type UpdateParlor = z.infer<typeof updateParlorSchema>;
