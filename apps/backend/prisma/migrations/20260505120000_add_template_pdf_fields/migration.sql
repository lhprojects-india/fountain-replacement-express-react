-- Add local template PDF key and field definitions to contract_templates
ALTER TABLE "contract_templates"
  ADD COLUMN IF NOT EXISTS "template_pdf_key" TEXT,
  ADD COLUMN IF NOT EXISTS "template_fields" JSONB;
