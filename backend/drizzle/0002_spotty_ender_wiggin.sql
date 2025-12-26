ALTER TABLE "attendance_sessions" ADD COLUMN "is_archived" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "is_active" boolean DEFAULT true;