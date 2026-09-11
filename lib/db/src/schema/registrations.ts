import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { eventsTable } from "./events";

export const registrationsTable = pgTable(
  "registrations",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    eventId: integer("event_id").notNull().references(() => eventsTable.id, { onDelete: "cascade" }),
    studentName: text("student_name").notNull(),
    studentEmail: text("student_email").notNull(),
    year: text("year").notNull(),
    department: text("department").notNull(),
    status: text("status").notNull().default("confirmed"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    eventStudentUnique: unique("registrations_event_student_unique").on(table.eventId, table.studentEmail),
  }),
);

export const insertRegistrationSchema = createInsertSchema(registrationsTable).omit({ createdAt: true });
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrationsTable.$inferSelect;