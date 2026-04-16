# Week 1 — Day 1: Schema Redesign & Migration Foundation

## Context

We are building a full hiring lifecycle platform to replace Fountain (external ATS). This is the very first day. Nothing has been changed yet. The existing system uses Fountain webhooks to ingest applicant data, and drivers authenticate by looking up their email in the `fountain_applicants` table.

**Previous day**: N/A — this is day 1.

**What we're building today**: The complete new Prisma schema that will power the entire platform. This is the most critical day — every subsequent feature depends on this schema being right.

## Today's Focus

Design and apply the new database schema. We are NOT deleting any existing tables yet — we add new tables alongside existing ones. Existing tables will be deprecated gradually over later weeks.

## Detailed Changes

### 1. New Prisma Models to Add

Add these models to `apps/backend/prisma/schema.prisma`:

#### City (table `cities`; earlier plans called this “Region”)
```prisma
model City {
  id                  Int       @id @default(autoincrement())
  city                String    @unique // e.g. "London", "Dublin"
  cityCode            String    @unique @map("city_code") // e.g. "LON", "DUB"
  country             String    @default("Unknown")
  currency            String    // e.g. "GBP", "EUR"
  currencySymbol      String    @map("currency_symbol") // e.g. "£", "€"
  timezone            String    // e.g. "Europe/London"
  paymentFieldsSchema Json?     @map("payment_fields_schema")
  isActive            Boolean   @default(true) @map("is_active")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  contractTemplates    ContractTemplate[]
  jobs                 Job[]
  documentRequirements DocumentRequirement[]

  @@map("cities")
}
```

#### ContractTemplate
```prisma
model ContractTemplate {
  id                  Int       @id @default(autoincrement())
  cityId              Int       @map("city_id")
  name                String    // e.g. "Standard Driver Contract", "Van Driver Contract"
  type                String    // e.g. "full_time", "part_time", "contractor"
  dropboxSignTemplateId String? @map("dropbox_sign_template_id")
  content             String?   @db.Text // fallback/preview content if no Dropbox Sign
  isActive            Boolean   @default(true) @map("is_active")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  city City @relation(fields: [cityId], references: [id])
  jobs Job[]

  @@map("contract_templates")
}
```

#### Job
```prisma
model Job {
  id                  Int       @id @default(autoincrement())
  cityId              Int       @map("city_id")
  contractTemplateId  Int?      @map("contract_template_id")
  title               String
  description         String?   @db.Text
  requirements        String?   @db.Text
  isPublished         Boolean   @default(false) @map("is_published")
  publishedAt         DateTime? @map("published_at")
  closedAt            DateTime? @map("closed_at")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  city             City              @relation(fields: [cityId], references: [id])
  contractTemplate ContractTemplate? @relation(fields: [contractTemplateId], references: [id])
  publicLinks      JobPublicLink[]
  applications     Application[]

  @@map("jobs")
}
```

#### JobPublicLink
```prisma
model JobPublicLink {
  id        Int       @id @default(autoincrement())
  jobId     Int       @map("job_id")
  slug      String    @unique // URL-safe unique identifier
  isActive  Boolean   @default(true) @map("is_active")
  expiresAt DateTime? @map("expires_at")
  clickCount Int      @default(0) @map("click_count")
  createdAt DateTime  @default(now()) @map("created_at")

  job Job @relation(fields: [jobId], references: [id])

  @@map("job_public_links")
}
```

#### Application (the core entity)
```prisma
model Application {
  id                  Int       @id @default(autoincrement())
  jobId               Int       @map("job_id")
  driverId            Int?      @map("driver_id") // linked after screening starts

  // Candidate profile (captured at apply time)
  firstName           String    @map("first_name")
  lastName            String    @map("last_name")
  email               String
  phone               String
  vehicleType         String?   @map("vehicle_type") // car, van, etc.
  vehicleDetails      String?   @map("vehicle_details")
  addressLine1        String?   @map("address_line_1")
  addressLine2        String?   @map("address_line_2")
  city                String?
  postcode            String?
  country             String?

  // Stage management
  currentStage        String    @default("applied") @map("current_stage")
  currentStageEnteredAt DateTime @default(now()) @map("current_stage_entered_at")

  // Decision
  rejectionReason     String?   @map("rejection_reason")
  approvedAt          DateTime? @map("approved_at")
  rejectedAt          DateTime? @map("rejected_at")

  // Contract
  contractRequestId   String?   @map("contract_request_id") // Dropbox Sign signature request ID
  contractStatus      String?   @map("contract_status") // sent, signed, declined
  contractSignedAt    DateTime? @map("contract_signed_at")

  // MOQ / Questionnaire
  moqScore            Int?      @map("moq_score")
  moqPassedAt         DateTime? @map("moq_passed_at")

  // First block
  firstBlockDate      DateTime? @map("first_block_date")
  firstBlockResult    String?   @map("first_block_result") // passed, failed

  // Onboarding call
  onboardingCallScheduledAt DateTime? @map("onboarding_call_scheduled_at")
  onboardingCallCompletedAt DateTime? @map("onboarding_call_completed_at")
  onboardingCallNotes       String?   @map("onboarding_call_notes") @db.Text

  // Metadata
  source              String?   // e.g. "job_portal", "referral", "direct"
  adminNotes          String?   @map("admin_notes") @db.Text
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  job                 Job       @relation(fields: [jobId], references: [id])
  driver              Driver?   @relation(fields: [driverId], references: [id])
  stageHistory        ApplicationStageHistory[]
  tasks               ApplicationTask[]
  documents           DocumentSubmission[]
  paymentDetails      PaymentDetailSubmission?
  questionnaireResponses QuestionnaireResponse[]
  communicationLogs   CommunicationLog[]

  @@unique([jobId, email])
  @@index([currentStage])
  @@index([email])
  @@map("applications")
}
```

#### ApplicationStageHistory
```prisma
model ApplicationStageHistory {
  id              Int      @id @default(autoincrement())
  applicationId   Int      @map("application_id")
  fromStage       String?  @map("from_stage")
  toStage         String   @map("to_stage")
  reason          String?
  actorEmail      String?  @map("actor_email") // admin email or "system"
  actorType       String   @default("system") @map("actor_type") // "admin", "system", "driver"
  metadata        Json?
  occurredAt      DateTime @default(now()) @map("occurred_at")

  application Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@index([applicationId])
  @@map("application_stage_history")
}
```

#### ApplicationTask
```prisma
model ApplicationTask {
  id              Int       @id @default(autoincrement())
  applicationId   Int       @map("application_id")
  stage           String    // which stage this task belongs to
  title           String
  description     String?
  isCompleted     Boolean   @default(false) @map("is_completed")
  completedAt     DateTime? @map("completed_at")
  completedBy     String?   @map("completed_by")
  createdAt       DateTime  @default(now()) @map("created_at")

  application Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@map("application_tasks")
}
```

#### DocumentRequirement
```prisma
model DocumentRequirement {
  id          Int     @id @default(autoincrement())
  cityId      Int     @map("city_id")
  name        String  // e.g. "Driving License", "Selfie", "Vehicle Photo"
  code        String  // e.g. "driving_license", "selfie", "vehicle_photo", "vehicle_video"
  description String?
  fileTypes   String  @map("file_types") // e.g. "image/jpeg,image/png,application/pdf"
  isRequired  Boolean @default(true) @map("is_required")
  maxSizeMb   Int     @default(10) @map("max_size_mb")
  maxDurationSec Int? @map("max_duration_sec") // for video only
  sortOrder   Int     @default(0) @map("sort_order")

  city City @relation(fields: [cityId], references: [id])

  @@unique([cityId, code])
  @@map("document_requirements")
}
```

#### DocumentSubmission
```prisma
model DocumentSubmission {
  id              Int       @id @default(autoincrement())
  applicationId   Int       @map("application_id")
  requirementCode String    @map("requirement_code") // matches DocumentRequirement.code
  fileName        String    @map("file_name")
  fileUrl         String    @map("file_url")
  fileType        String    @map("file_type")
  fileSizeBytes   Int?      @map("file_size_bytes")
  durationSec     Int?      @map("duration_sec") // for video
  status          String    @default("pending") // pending, approved, rejected
  reviewerEmail   String?   @map("reviewer_email")
  reviewerNotes   String?   @map("reviewer_notes")
  reviewedAt      DateTime? @map("reviewed_at")
  uploadedAt      DateTime  @default(now()) @map("uploaded_at")

  application Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@map("document_submissions")
}
```

#### PaymentDetailSubmission
```prisma
model PaymentDetailSubmission {
  id              Int      @id @default(autoincrement())
  applicationId   Int      @unique @map("application_id")
  details         Json     // structured per city's paymentFieldsSchema
  submittedAt     DateTime @default(now()) @map("submitted_at")
  verifiedAt      DateTime? @map("verified_at")
  verifiedBy      String?  @map("verified_by")

  application Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@map("payment_detail_submissions")
}
```

#### Questionnaire system
```prisma
model Questionnaire {
  id          Int       @id @default(autoincrement())
  cityId      Int?      @map("city_id")
  title       String
  description String?
  passingScore Int      @default(70) @map("passing_score")
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  questions QuestionnaireQuestion[]
  responses QuestionnaireResponse[]

  @@map("questionnaires")
}

model QuestionnaireQuestion {
  id                Int      @id @default(autoincrement())
  questionnaireId   Int      @map("questionnaire_id")
  questionText      String   @map("question_text") @db.Text
  questionType      String   @default("multiple_choice") @map("question_type")
  options           Json     // array of { label, value, isCorrect }
  points            Int      @default(1)
  sortOrder         Int      @default(0) @map("sort_order")

  questionnaire Questionnaire @relation(fields: [questionnaireId], references: [id], onDelete: Cascade)

  @@map("questionnaire_questions")
}

model QuestionnaireResponse {
  id                Int       @id @default(autoincrement())
  applicationId     Int       @map("application_id")
  questionnaireId   Int       @map("questionnaire_id")
  answers           Json      // { questionId: selectedValue }
  score             Int?
  passed            Boolean?
  submittedAt       DateTime  @default(now()) @map("submitted_at")

  application   Application   @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  questionnaire Questionnaire @relation(fields: [questionnaireId], references: [id])

  @@map("questionnaire_responses")
}
```

#### Communication system
```prisma
model MessageTemplate {
  id          Int      @id @default(autoincrement())
  eventKey    String   @map("event_key") // e.g. "application.received", "stage.contract_sent"
  channel     String   // "email", "sms"
  locale      String   @default("en")
  subject     String?  // email only
  body        String   @db.Text
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@unique([eventKey, channel, locale])
  @@map("message_templates")
}

model CommunicationLog {
  id              Int       @id @default(autoincrement())
  applicationId   Int?      @map("application_id")
  channel         String    // "email", "sms"
  templateEventKey String?  @map("template_event_key")
  recipientEmail  String?   @map("recipient_email")
  recipientPhone  String?   @map("recipient_phone")
  subject         String?
  body            String?   @db.Text
  providerMessageId String? @map("provider_message_id")
  status          String    @default("queued") // queued, sent, delivered, failed, bounced
  errorMessage    String?   @map("error_message")
  sentAt          DateTime? @map("sent_at")
  createdAt       DateTime  @default(now()) @map("created_at")

  application Application? @relation(fields: [applicationId], references: [id])

  @@index([applicationId])
  @@map("communication_logs")
}
```

### 2. Modify Existing Models

#### Driver model — add Application relation
Add to the existing `Driver` model:
```prisma
  applications Application[]
```

### 3. Run Migration

After updating the schema:
```bash
npx prisma migrate dev --name add_hiring_lifecycle_tables
```

### 4. Create Module Directory Structure

Create the backend module folders:
```
apps/backend/src/modules/
  regions/
    city.controller.js
    city.service.js
    city.schemas.js
    city.routes.js
  contracts/
    contract.controller.js
    contract.service.js
    contract.schemas.js
  jobs/
    job.controller.js
    job.service.js
    job.schemas.js
  applications/
    application.controller.js
    application.service.js
    application.schemas.js
  workflow/
    stage-engine.js
    transition-matrix.js
    guards.js
    actions.js
  documents/
    document.controller.js
    document.service.js
  payments/
    payment.controller.js
    payment.service.js
  questionnaire/
    questionnaire.controller.js
    questionnaire.service.js
  communications/
    communication.controller.js
    communication.service.js
    templates/
  integrations/
    dropbox-sign/
      dropbox-sign.client.js
      dropbox-sign.webhook.js
```

Create placeholder files with basic exports for each. The actual implementations come in later days.

## Acceptance Criteria

- [ ] All new Prisma models added to `schema.prisma`
- [ ] `prisma migrate dev` runs without errors
- [ ] `prisma generate` produces working client
- [ ] All module directories created with placeholder files
- [ ] Existing system still works (all existing tables untouched)
- [ ] Backend starts without errors

## What's Next (Day 2)

Tomorrow we build the **stage transition engine** — the core workflow module that enforces valid transitions, logs history, and triggers side effects. This is the heart of the entire system.
