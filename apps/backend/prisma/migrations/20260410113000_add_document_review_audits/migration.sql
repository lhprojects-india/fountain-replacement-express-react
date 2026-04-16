CREATE TABLE "document_review_audits" (
  "id" SERIAL PRIMARY KEY,
  "document_submission_id" INTEGER NOT NULL,
  "application_id" INTEGER NOT NULL,
  "reviewer_email" TEXT,
  "status" TEXT NOT NULL,
  "notes" TEXT,
  "checklist_results" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_review_audits_document_submission_id_fkey"
    FOREIGN KEY ("document_submission_id") REFERENCES "document_submissions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "document_review_audits_application_id_fkey"
    FOREIGN KEY ("application_id") REFERENCES "applications"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "document_review_audits_document_submission_id_created_at_idx"
  ON "document_review_audits"("document_submission_id", "created_at");

CREATE INDEX "document_review_audits_application_id_created_at_idx"
  ON "document_review_audits"("application_id", "created_at");
