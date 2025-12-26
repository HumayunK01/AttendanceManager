CREATE TABLE "attendance_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" integer,
	"old_status" varchar(1),
	"new_status" varchar(1),
	"edited_by" integer,
	"reason" varchar(255),
	"edited_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer,
	"student_id" integer,
	"status" varchar(1),
	"marked_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"timetable_slot_id" integer,
	"session_date" date,
	"locked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"institution_id" integer,
	"name" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "faculty_subject_map" (
	"id" serial PRIMARY KEY NOT NULL,
	"faculty_id" integer,
	"subject_id" integer,
	"class_id" integer
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"class_id" integer,
	"roll_no" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"institution_id" integer,
	"name" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "timetable_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"faculty_subject_map_id" integer,
	"day_of_week" integer,
	"start_time" time,
	"end_time" time
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"institution_id" integer,
	"name" varchar(255),
	"email" varchar(255),
	"password_hash" varchar(255),
	"role" varchar(50),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "attendance_audit_logs" ADD CONSTRAINT "attendance_audit_logs_record_id_attendance_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."attendance_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_audit_logs" ADD CONSTRAINT "attendance_audit_logs_edited_by_users_id_fk" FOREIGN KEY ("edited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_attendance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."attendance_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_timetable_slot_id_timetable_slots_id_fk" FOREIGN KEY ("timetable_slot_id") REFERENCES "public"."timetable_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_subject_map" ADD CONSTRAINT "faculty_subject_map_faculty_id_users_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_subject_map" ADD CONSTRAINT "faculty_subject_map_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_subject_map" ADD CONSTRAINT "faculty_subject_map_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_faculty_subject_map_id_faculty_subject_map_id_fk" FOREIGN KEY ("faculty_subject_map_id") REFERENCES "public"."faculty_subject_map"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;