// A data migration; `payload migrate:create` found no schema change. The order
// within a category lives in homepage_rels like the order under All, under its
// own path (`<category>Order`), so no table changes.
//
// Fills each category's list with its projects in the order they have under All,
// so the lists start as what the site already shows rather than empty. A list
// that already has entries is left alone, which also makes this safe to run twice.
import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   INSERT INTO "homepage_rels" ("order", "parent_id", "path", "projects_id")
   SELECT
     row_number() OVER (PARTITION BY r."parent_id", p."category" ORDER BY r."order", r."id"),
     r."parent_id",
     p."category"::text || 'Order',
     r."projects_id"
   FROM "homepage_rels" r
   JOIN "projects" p ON p."id" = r."projects_id"
   WHERE r."path" = 'projects'
     AND p."category" IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM "homepage_rels" x
       WHERE x."parent_id" = r."parent_id" AND x."path" = p."category"::text || 'Order'
     );`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DELETE FROM "homepage_rels"
   WHERE "path" IN ('commercialOrder', 'artOrder', 'fashionOrder');`)
}
