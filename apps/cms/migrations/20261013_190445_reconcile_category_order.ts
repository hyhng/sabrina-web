// A data migration; no schema change. Brings the per-category orders in line
// with the projects' categories as they are now.
//
// On 13 October the lists were filled from the homepage order, and then projects
// were moved from Art to Fashion. The Art list kept them, the Fashion list never
// got them, and since a list may only hold its own category, every save of the
// homepage order — and so every publish — was refused. The admin now keeps the
// lists right itself (collections/homepage-order.ts); this repairs what was
// already stored. Safe to run on lists that are already right.
import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DELETE FROM "homepage_rels" r
   USING "projects" p
   WHERE p."id" = r."projects_id"
     AND r."path" IN ('commercialOrder', 'artOrder', 'fashionOrder')
     AND r."path" <> p."category"::text || 'Order';

   INSERT INTO "homepage_rels" ("order", "parent_id", "path", "projects_id")
   SELECT
     COALESCE((
       SELECT max(x."order") FROM "homepage_rels" x
       WHERE x."parent_id" = r."parent_id" AND x."path" = p."category"::text || 'Order'
     ), 0) + row_number() OVER (PARTITION BY r."parent_id", p."category" ORDER BY r."order", r."id"),
     r."parent_id",
     p."category"::text || 'Order',
     r."projects_id"
   FROM "homepage_rels" r
   JOIN "projects" p ON p."id" = r."projects_id"
   WHERE r."path" = 'projects'
     AND p."category" IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM "homepage_rels" x
       WHERE x."parent_id" = r."parent_id"
         AND x."path" = p."category"::text || 'Order'
         AND x."projects_id" = r."projects_id"
     );`)
}

export async function down(): Promise<void> {
  // Nothing to undo: the previous state was the broken one.
}
