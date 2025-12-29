-- Migration: Add batch_id to timetable_slots
-- This enables Theory/Practical lecture distinction

-- Add batch_id column (nullable - NULL means Theory lecture)
ALTER TABLE "timetable_slots" ADD COLUMN "batch_id" integer;

-- Add foreign key constraint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_batch_id_batches_id_fk" 
  FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") 
  ON DELETE SET NULL 
  ON UPDATE NO ACTION;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'timetable_slots';
