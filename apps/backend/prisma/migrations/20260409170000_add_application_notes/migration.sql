CREATE TABLE "application_notes" (
  "id" SERIAL PRIMARY KEY,
  "application_id" INTEGER NOT NULL,
  "author_email" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "application_notes_application_id_fkey"
    FOREIGN KEY ("application_id") REFERENCES "applications"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "application_notes_application_id_created_at_idx"
  ON "application_notes"("application_id", "created_at");
