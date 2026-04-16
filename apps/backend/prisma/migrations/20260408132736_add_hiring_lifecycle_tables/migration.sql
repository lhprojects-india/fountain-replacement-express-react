-- CreateTable
CREATE TABLE "fountain_applicants" (
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT,
    "applicantId" TEXT,
    "funnelId" TEXT,
    "funnel_title" TEXT,
    "mot" TEXT,
    "address" TEXT,
    "stage" TEXT,
    "status" TEXT,
    "city" TEXT,
    "country" TEXT,
    "fountainData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "webhookReceivedAt" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fountain_applicants_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "onboarding_status" TEXT NOT NULL DEFAULT 'started',
    "status" TEXT DEFAULT 'pending',
    "smoking_status" TEXT,
    "has_physical_difficulties" BOOLEAN,
    "last_route" TEXT,
    "last_route_updated_at" TIMESTAMP(3),
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "status_updated_at" TIMESTAMP(3),

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "currency_symbol" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "payment_fields_schema" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_templates" (
    "id" SERIAL NOT NULL,
    "region_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dropbox_sign_template_id" TEXT,
    "content" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "region_id" INTEGER NOT NULL,
    "contract_template_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requirements" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_public_links" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_public_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "driver_id" INTEGER,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "vehicle_type" TEXT,
    "vehicle_details" TEXT,
    "address_line_1" TEXT,
    "address_line_2" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "country" TEXT,
    "current_stage" TEXT NOT NULL DEFAULT 'applied',
    "current_stage_entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rejection_reason" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "contract_request_id" TEXT,
    "contract_status" TEXT,
    "contract_signed_at" TIMESTAMP(3),
    "moq_score" INTEGER,
    "moq_passed_at" TIMESTAMP(3),
    "first_block_date" TIMESTAMP(3),
    "first_block_result" TEXT,
    "onboarding_call_scheduled_at" TIMESTAMP(3),
    "onboarding_call_completed_at" TIMESTAMP(3),
    "onboarding_call_notes" TEXT,
    "source" TEXT,
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_stage_history" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "from_stage" TEXT,
    "to_stage" TEXT NOT NULL,
    "reason" TEXT,
    "actor_email" TEXT,
    "actor_type" TEXT NOT NULL DEFAULT 'system',
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_tasks" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_requirements" (
    "id" SERIAL NOT NULL,
    "region_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "file_types" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "max_size_mb" INTEGER NOT NULL DEFAULT 10,
    "max_duration_sec" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_submissions" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "requirement_code" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER,
    "duration_sec" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewer_email" TEXT,
    "reviewer_notes" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_detail_submissions" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "details" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,

    CONSTRAINT "payment_detail_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaires" (
    "id" SERIAL NOT NULL,
    "region_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "passing_score" INTEGER NOT NULL DEFAULT 70,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_questions" (
    "id" SERIAL NOT NULL,
    "questionnaire_id" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_type" TEXT NOT NULL DEFAULT 'multiple_choice',
    "options" JSONB NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "questionnaire_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_responses" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "questionnaire_id" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "score" INTEGER,
    "passed" BOOLEAN,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questionnaire_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" SERIAL NOT NULL,
    "event_key" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_logs" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER,
    "channel" TEXT NOT NULL,
    "template_event_key" TEXT,
    "recipient_email" TEXT,
    "recipient_phone" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "provider_message_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_availabilities" (
    "id" SERIAL NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "day_of_week" TEXT NOT NULL,
    "shift_period" TEXT NOT NULL,

    CONSTRAINT "driver_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_facilities" (
    "driver_id" INTEGER NOT NULL,
    "facility_code" TEXT NOT NULL,

    CONSTRAINT "driver_facilities_pkey" PRIMARY KEY ("driver_id","facility_code")
);

-- CreateTable
CREATE TABLE "driver_onboarding_steps" (
    "id" SERIAL NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "step_name" TEXT NOT NULL,
    "is_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "driver_onboarding_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "email" TEXT NOT NULL,
    "vehicle" TEXT,
    "licensePlate" TEXT,
    "address" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "fee_structures" (
    "id" SERIAL NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "vehicle_type" VARCHAR(50) NOT NULL,
    "per_hour" VARCHAR(100),
    "per_task" VARCHAR(100),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_data" (
    "id" SERIAL NOT NULL,
    "fee_structure_id" INTEGER NOT NULL,
    "density" VARCHAR(50) NOT NULL,
    "minimum_fee" DECIMAL(10,2) NOT NULL,
    "shift_length" INTEGER NOT NULL,
    "included_tasks" INTEGER NOT NULL,
    "additional_task_fee" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "block_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facilities" (
    "facility_code" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("facility_code")
);

-- CreateTable
CREATE TABLE "authorized_emails" (
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authorized_emails_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "admins" (
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "name" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "driverEmail" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedDate" TEXT,
    "personalInfo" JSONB,
    "driverInfo" JSONB,
    "verificationDetails" JSONB,
    "availability" JSONB,
    "acknowledgements" JSONB,
    "healthAndSafety" JSONB,
    "facilityPreferences" JSONB,
    "onboardingStatus" TEXT,
    "onboardingStatusDetails" JSONB,
    "progress" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "drivers_email_key" ON "drivers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "regions_name_key" ON "regions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "regions_code_key" ON "regions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "job_public_links_slug_key" ON "job_public_links"("slug");

-- CreateIndex
CREATE INDEX "applications_current_stage_idx" ON "applications"("current_stage");

-- CreateIndex
CREATE INDEX "applications_email_idx" ON "applications"("email");

-- CreateIndex
CREATE UNIQUE INDEX "applications_job_id_email_key" ON "applications"("job_id", "email");

-- CreateIndex
CREATE INDEX "application_stage_history_application_id_idx" ON "application_stage_history"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_requirements_region_id_code_key" ON "document_requirements"("region_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "payment_detail_submissions_application_id_key" ON "payment_detail_submissions"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_event_key_channel_locale_key" ON "message_templates"("event_key", "channel", "locale");

-- CreateIndex
CREATE INDEX "communication_logs_application_id_idx" ON "communication_logs"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_availabilities_driver_id_day_of_week_shift_period_key" ON "driver_availabilities"("driver_id", "day_of_week", "shift_period");

-- CreateIndex
CREATE UNIQUE INDEX "driver_onboarding_steps_driver_id_step_name_key" ON "driver_onboarding_steps"("driver_id", "step_name");

-- CreateIndex
CREATE UNIQUE INDEX "fee_structures_city_vehicle_type_key" ON "fee_structures"("city", "vehicle_type");

-- CreateIndex
CREATE UNIQUE INDEX "reports_reportId_key" ON "reports"("reportId");

-- AddForeignKey
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_contract_template_id_fkey" FOREIGN KEY ("contract_template_id") REFERENCES "contract_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_public_links" ADD CONSTRAINT "job_public_links_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_stage_history" ADD CONSTRAINT "application_stage_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tasks" ADD CONSTRAINT "application_tasks_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requirements" ADD CONSTRAINT "document_requirements_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_detail_submissions" ADD CONSTRAINT "payment_detail_submissions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_questions" ADD CONSTRAINT "questionnaire_questions_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "questionnaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "questionnaires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_availabilities" ADD CONSTRAINT "driver_availabilities_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_facilities" ADD CONSTRAINT "driver_facilities_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_facilities" ADD CONSTRAINT "driver_facilities_facility_code_fkey" FOREIGN KEY ("facility_code") REFERENCES "facilities"("facility_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_onboarding_steps" ADD CONSTRAINT "driver_onboarding_steps_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "block_data" ADD CONSTRAINT "block_data_fee_structure_id_fkey" FOREIGN KEY ("fee_structure_id") REFERENCES "fee_structures"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
