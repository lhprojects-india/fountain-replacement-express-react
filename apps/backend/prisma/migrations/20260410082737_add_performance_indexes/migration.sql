-- CreateIndex
CREATE INDEX "application_stage_history_occurred_at_idx" ON "application_stage_history"("occurred_at");

-- CreateIndex
CREATE INDEX "applications_job_id_idx" ON "applications"("job_id");

-- CreateIndex
CREATE INDEX "applications_created_at_idx" ON "applications"("created_at");

-- CreateIndex
CREATE INDEX "applications_current_stage_entered_at_idx" ON "applications"("current_stage_entered_at");

-- CreateIndex
CREATE INDEX "applications_current_stage_created_at_idx" ON "applications"("current_stage", "created_at");

-- CreateIndex
CREATE INDEX "communication_logs_created_at_idx" ON "communication_logs"("created_at");

-- CreateIndex
CREATE INDEX "document_submissions_application_id_status_idx" ON "document_submissions"("application_id", "status");

-- CreateIndex
CREATE INDEX "jobs_region_id_is_published_idx" ON "jobs"("region_id", "is_published");
