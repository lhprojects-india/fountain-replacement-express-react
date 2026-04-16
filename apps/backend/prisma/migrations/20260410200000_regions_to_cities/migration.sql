-- Rename regions table to cities and update all schema references

-- Step 1: Add new columns to regions table before renaming
ALTER TABLE "regions" ADD COLUMN "city" TEXT;
ALTER TABLE "regions" ADD COLUMN "city_code" TEXT;
ALTER TABLE "regions" ADD COLUMN "country" TEXT NOT NULL DEFAULT 'Unknown';

-- Step 2: Copy existing data to new columns
UPDATE "regions" SET "city" = "name", "city_code" = "code";

-- Step 3: Add NOT NULL constraints and unique indexes on new columns
ALTER TABLE "regions" ALTER COLUMN "city" SET NOT NULL;
ALTER TABLE "regions" ALTER COLUMN "city_code" SET NOT NULL;

-- Step 4: Drop old unique constraints
DROP INDEX IF EXISTS "regions_name_key";
DROP INDEX IF EXISTS "regions_code_key";

-- Step 5: Add unique constraints on new columns
CREATE UNIQUE INDEX "cities_city_key" ON "regions"("city");
CREATE UNIQUE INDEX "cities_city_code_key" ON "regions"("city_code");

-- Step 6: Drop old columns
ALTER TABLE "regions" DROP COLUMN "name";
ALTER TABLE "regions" DROP COLUMN "code";

-- Step 7: Rename foreign key columns in referencing tables
-- contract_templates: region_id -> city_id
ALTER TABLE "contract_templates" RENAME COLUMN "region_id" TO "city_id";

-- jobs: region_id -> city_id
ALTER TABLE "jobs" RENAME COLUMN "region_id" TO "city_id";

-- document_requirements: region_id -> city_id  
ALTER TABLE "document_requirements" RENAME COLUMN "region_id" TO "city_id";

-- questionnaires: region_id -> city_id
ALTER TABLE "questionnaires" RENAME COLUMN "region_id" TO "city_id";

-- Step 8: Rename the table itself
ALTER TABLE "regions" RENAME TO "cities";

-- Step 9: Rename indexes on jobs table
DROP INDEX IF EXISTS "jobs_region_id_is_published_idx";
CREATE INDEX "jobs_city_id_is_published_idx" ON "jobs"("city_id", "is_published");

-- Step 10: Rename the unique constraint on document_requirements
ALTER TABLE "document_requirements" DROP CONSTRAINT IF EXISTS "document_requirements_region_id_code_key";
ALTER TABLE "document_requirements" ADD CONSTRAINT "document_requirements_city_id_code_key" UNIQUE ("city_id", "code");
