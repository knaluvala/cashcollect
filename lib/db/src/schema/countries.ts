import { pgTable, varchar, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const countriesTable = pgTable("countries", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const insertCountrySchema = createInsertSchema(countriesTable, {
  name: z.string().min(1, "Country name is required").max(100),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateCountrySchema = insertCountrySchema.partial();

export type Country = typeof countriesTable.$inferSelect;
export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type UpdateCountry = z.infer<typeof updateCountrySchema>;
