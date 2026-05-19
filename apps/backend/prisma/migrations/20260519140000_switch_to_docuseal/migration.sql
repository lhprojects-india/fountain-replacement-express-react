-- Switch contract signing provider from Dropbox Sign / in-app PDF to Docuseal.

-- Contract templates: rename dropbox_sign_template_id and drop legacy in-app PDF fields.
ALTER TABLE "contract_templates"
  RENAME COLUMN "dropbox_sign_template_id" TO "docuseal_template_id";

ALTER TABLE "contract_templates"
  DROP COLUMN IF EXISTS "template_pdf_key",
  DROP COLUMN IF EXISTS "template_fields";

-- Applications: store the Docuseal submitter slug so we can build signing URLs.
ALTER TABLE "applications"
  ADD COLUMN IF NOT EXISTS "docuseal_submitter_slug" TEXT;
