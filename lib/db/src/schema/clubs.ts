import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const clubsTable = pgTable("clubs", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  category: text("category").notNull(),
  tagline: text("tagline").notNull(),
  officeLocation: text("office_location").notNull(),
  description: text("description").notNull(),
  eligibility: text("eligibility").notNull(),
  meetingSchedule: text("meeting_schedule").notNull(),
  socials: text("socials").array().notNull().default([]),
  memberCount: integer("member_count").notNull().default(0),
  joinedCount: integer("joined_count").notNull().default(0),
  accent: text("accent").notNull().default("violet"),
  isVerified: text("is_verified").notNull().default("true"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clubRolesTable = pgTable("club_roles", {
  id: integer("id").primaryKey(),
  clubId: integer("club_id").notNull().references(() => clubsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  responsibilities: text("responsibilities").array().notNull().default([]),
  skills: text("skills").array().notNull().default([]),
  openings: integer("openings").notNull().default(0),
});

export const savedClubsTable = pgTable("saved_clubs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  clubId: integer("club_id").notNull().references(() => clubsTable.id, { onDelete: "cascade" }),
  studentKey: text("student_key").notNull().default("current-student"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClubSchema = createInsertSchema(clubsTable).omit({ createdAt: true });
export type InsertClub = z.infer<typeof insertClubSchema>;
export type Club = typeof clubsTable.$inferSelect;
export type ClubRole = typeof clubRolesTable.$inferSelect;