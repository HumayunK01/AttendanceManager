import { pgTable, serial, varchar, integer, boolean, date, time, timestamp } from 'drizzle-orm/pg-core'

export const institutions = pgTable('institutions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow()
})

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  institutionId: integer('institution_id').references(() => institutions.id),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: varchar('role', { length: 50 }),
  isFirstLogin: boolean('is_first_login').default(true),
  resetToken: varchar('reset_token', { length: 255 }),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  createdAt: timestamp('created_at').defaultNow()
})

export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  institutionId: integer('institution_id').references(() => institutions.id),
  name: varchar('name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow()
})

export const subjects = pgTable('subjects', {
  id: serial('id').primaryKey(),
  institutionId: integer('institution_id').references(() => institutions.id),
  name: varchar('name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow()
})

export const facultySubjectMap = pgTable('faculty_subject_map', {
  id: serial('id').primaryKey(),
  facultyId: integer('faculty_id').references(() => users.id),
  subjectId: integer('subject_id').references(() => subjects.id),
  classId: integer('class_id').references(() => classes.id),
})

export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  classId: integer('class_id').references(() => classes.id),
  rollNo: varchar('roll_no', { length: 50 }),
  isActive: boolean('is_active').default(true)
})

export const timetableSlots = pgTable('timetable_slots', {
  id: serial('id').primaryKey(),
  facultySubjectMapId: integer('faculty_subject_map_id').references(() => facultySubjectMap.id),
  dayOfWeek: integer('day_of_week'),
  startTime: time('start_time'),
  endTime: time('end_time'),
})

export const attendanceSessions = pgTable('attendance_sessions', {
  id: serial('id').primaryKey(),
  timetableSlotId: integer('timetable_slot_id').references(() => timetableSlots.id),
  sessionDate: date('session_date'),
  locked: boolean('locked').default(false),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at').defaultNow()
})

export const attendanceRecords = pgTable('attendance_records', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => attendanceSessions.id),
  studentId: integer('student_id').references(() => students.id),
  status: varchar('status', { length: 1 }),
  editCount: integer('edit_count').default(0),
  markedAt: timestamp('marked_at').defaultNow()
})

export const attendanceAuditLogs = pgTable('attendance_audit_logs', {
  id: serial('id').primaryKey(),
  recordId: integer('record_id').references(() => attendanceRecords.id),
  oldStatus: varchar('old_status', { length: 1 }),
  newStatus: varchar('new_status', { length: 1 }),
  editedBy: integer('edited_by').references(() => users.id),
  reason: varchar('reason', { length: 255 }),
  editedAt: timestamp('edited_at').defaultNow()
})
