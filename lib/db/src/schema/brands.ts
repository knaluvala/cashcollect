import { pgTable, varchar, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const brandsTable = pgTable(
  "brands",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    countryId: integer("country_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [unique().on(table.countryId, table.name)],
);

export const insertBrandSchema = createInsertSchema(brandsTable, {
  name: z.string().min(1, "Brand name is required").max(100),
  countryId: z.number().int().positive("Country is required"),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateBrandSchema = insertBrandSchema.partial();

export type Brand = typeof brandsTable.$inferSelect;
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type UpdateBrand = z.infer<typeof updateBrandSchema>;
