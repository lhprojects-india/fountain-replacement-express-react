CREATE TABLE "verification_checklists" (
  "id" SERIAL PRIMARY KEY,
  "requirement_code" TEXT NOT NULL,
  "check_item" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "verification_checklists" ("requirement_code", "check_item", "sort_order") VALUES
  ('selfie', 'Face clearly visible', 1),
  ('selfie', 'Photo is recent', 2),
  ('selfie', 'No sunglasses/hat', 3),
  ('driving_license', 'License is valid/not expired', 1),
  ('driving_license', 'Name matches application', 2),
  ('driving_license', 'Correct license class', 3),
  ('vehicle_photo', 'Full vehicle visible', 1),
  ('vehicle_photo', 'License plate readable', 2),
  ('vehicle_photo', 'Vehicle matches declared type', 3),
  ('id_document', 'Document is valid', 1),
  ('id_document', 'Name matches application', 2),
  ('id_document', 'Not expired', 3),
  ('vehicle_video', 'Full vehicle walkthrough', 1),
  ('vehicle_video', 'Interior visible', 2),
  ('vehicle_video', 'Vehicle clean and appropriate', 3);
