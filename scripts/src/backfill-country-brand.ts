import { eq, and, isNull } from "drizzle-orm";
import {
  db,
  pool,
  countriesTable,
  brandsTable,
  parlorsTable,
  routesTable,
  usersTable,
  collectionsTable,
} from "@workspace/db";

const UAE_BRANDS = ["Baskin Robbins", "Halla Shawarma", "Jimmy Johns"];
const KSA_BRANDS = ["Baskin Robbins"];
const BACKFILL_BRAND_NAME = "Baskin Robbins";

async function ensureCountry(name: string) {
  const existing = await db
    .select()
    .from(countriesTable)
    .where(eq(countriesTable.name, name));
  if (existing.length > 0) return existing[0];

  const inserted = await db
    .insert(countriesTable)
    .values({ name })
    .returning();
  console.log(`Created country: ${name}`);
  return inserted[0];
}

async function ensureBrand(countryId: number, name: string) {
  const existing = await db
    .select()
    .from(brandsTable)
    .where(
      and(eq(brandsTable.countryId, countryId), eq(brandsTable.name, name)),
    );
  if (existing.length > 0) return existing[0];

  const inserted = await db
    .insert(brandsTable)
    .values({ countryId, name })
    .returning();
  console.log(`Created brand: ${name} (country ${countryId})`);
  return inserted[0];
}

async function main() {
  const uae = await ensureCountry("UAE");
  const ksa = await ensureCountry("KSA");

  const uaeBrands = new Map<string, number>();
  for (const name of UAE_BRANDS) {
    const brand = await ensureBrand(uae.id, name);
    uaeBrands.set(name, brand.id);
  }
  for (const name of KSA_BRANDS) {
    await ensureBrand(ksa.id, name);
  }

  const backfillBrandId = uaeBrands.get(BACKFILL_BRAND_NAME);
  if (!backfillBrandId) {
    throw new Error(`Expected brand "${BACKFILL_BRAND_NAME}" under UAE`);
  }

  const parlorsUpdated = await db
    .update(parlorsTable)
    .set({ countryId: uae.id, brandId: backfillBrandId })
    .where(isNull(parlorsTable.countryId))
    .returning({ id: parlorsTable.id });
  console.log(`Backfilled ${parlorsUpdated.length} parlors -> UAE / ${BACKFILL_BRAND_NAME}`);

  const routesUpdated = await db
    .update(routesTable)
    .set({ countryId: uae.id, brandId: backfillBrandId })
    .where(isNull(routesTable.countryId))
    .returning({ id: routesTable.id });
  console.log(`Backfilled ${routesUpdated.length} routes -> UAE / ${BACKFILL_BRAND_NAME}`);

  const usersUpdated = await db
    .update(usersTable)
    .set({ countryId: uae.id, brandId: backfillBrandId })
    .where(isNull(usersTable.countryId))
    .returning({ id: usersTable.id });
  console.log(`Backfilled ${usersUpdated.length} users -> UAE / ${BACKFILL_BRAND_NAME}`);

  // Collections are derived from their referenced parlor rather than
  // blanket-assigned, since that's the authoritative source of truth.
  const collectionsToBackfill = await db
    .select({ id: collectionsTable.id, parlorCode: collectionsTable.parlorCode })
    .from(collectionsTable)
    .where(isNull(collectionsTable.countryId));

  const allParlors = await db
    .select({
      parlorCode: parlorsTable.parlorCode,
      countryId: parlorsTable.countryId,
      brandId: parlorsTable.brandId,
    })
    .from(parlorsTable);
  const parlorByCode = new Map(allParlors.map((p) => [p.parlorCode, p]));

  let collectionsUpdated = 0;
  let collectionsSkipped = 0;
  for (const collection of collectionsToBackfill) {
    const parlor = parlorByCode.get(collection.parlorCode);
    if (!parlor) {
      collectionsSkipped++;
      continue;
    }
    await db
      .update(collectionsTable)
      .set({ countryId: parlor.countryId, brandId: parlor.brandId })
      .where(eq(collectionsTable.id, collection.id));
    collectionsUpdated++;
  }
  console.log(
    `Backfilled ${collectionsUpdated} collections from their parlor` +
      (collectionsSkipped > 0
        ? ` (${collectionsSkipped} skipped — parlor code not found)`
        : ""),
  );

  console.log("Backfill complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
