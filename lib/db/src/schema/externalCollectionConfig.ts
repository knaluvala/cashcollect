import { boolean, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const externalCollectionConfigTable = pgTable("external_collection_config", {
  id: integer("id").primaryKey().default(1),
  enabled: boolean("enabled").notNull().default(false),
  endpoint: text("endpoint"),
  sourceLabel: varchar("source_label", { length: 120 }).notNull().default("External System"),
  parlorCodeParameter: varchar("parlor_code_parameter", { length: 80 }).notNull().default("parlorCode"),
  dateParameter: varchar("date_parameter", { length: 80 }).notNull().default("date"),
  cashAmountPath: varchar("cash_amount_path", { length: 160 }).notNull().default("cashAmount"),
  couponAmountPath: varchar("coupon_amount_path", { length: 160 }).notNull().default("couponAmount"),
  ccAmountPath: varchar("cc_amount_path", { length: 160 }).notNull().default("ccAmount"),
  updatedBy: varchar("updated_by", { length: 120 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const updateExternalCollectionConfigSchema = createInsertSchema(
  externalCollectionConfigTable,
  {
    endpoint: z
      .union([
        z
          .string()
          .trim()
          .url()
          .max(2000)
          .refine((value) => {
            try {
              return new URL(value).protocol === "https";
            } catch {
              return false;
            }
          }, {
            message: "Endpoint must use HTTPS",
          }),
        z.literal(""),
      ])
      .nullable()
      .optional(),
    sourceLabel: z.string().trim().min(1).max(120),
    parlorCodeParameter: z.string().trim().min(1).max(80),
    dateParameter: z.string().trim().min(1).max(80),
    cashAmountPath: z.string().trim().min(1).max(160),
    couponAmountPath: z.string().trim().min(1).max(160),
    ccAmountPath: z.string().trim().min(1).max(160),
  },
).pick({
  enabled: true,
  endpoint: true,
  sourceLabel: true,
  parlorCodeParameter: true,
  dateParameter: true,
  cashAmountPath: true,
  couponAmountPath: true,
  ccAmountPath: true,
});

export type ExternalCollectionConfig = typeof externalCollectionConfigTable.$inferSelect;
export type UpdateExternalCollectionConfig = z.infer<
  typeof updateExternalCollectionConfigSchema
>;