import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { clubsTable } from "./clubs";

export const eventsTable = pgTable("events", {
  id: integer("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  venue: text("venue").notNull(),
  entryFee: integer("entry_fee").notNull().default(0),
  dutyLeave: boolean("duty_leave").notNull().default(false),
  spotsLeft: integer("spots_left").notNull().default(0),
  registrationRequired: boolean("registration_required").notNull().default(true),
  registrationCriteria: text("registration_criteria").notNull(),
  description: text("description").notNull(),
  organizerEmail: text("organizer_email").notNull(),
  accent: text("accent").notNull().default("violet"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ createdAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;