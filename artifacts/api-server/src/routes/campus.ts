import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  GetClubResponse,
  GetDashboardResponse,
  GetEventResponse,
  GetClubParams,
  GetEventParams,
  ListClubsQueryParams,
  ListEventsQueryParams,
  RegisterForEventBody,
  RegisterForEventParams,
} from "@workspace/api-zod";
import {
  clubRolesTable,
  clubsTable,
  db,
  eventsTable,
  registrationsTable,
  savedClubsTable,
} from "@workspace/db";

const router: IRouter = Router();
const currentStudent = "current-student";

function bool(value: string) {
  return value === "true";
}

async function savedIds() {
  const rows = await db
    .select({ clubId: savedClubsTable.clubId })
    .from(savedClubsTable)
    .where(eq(savedClubsTable.studentKey, currentStudent));
  return new Set(rows.map((row) => row.clubId));
}

function mapClub(row: typeof clubsTable.$inferSelect, saved: Set<number>) {
  return {
    id: row.id,
    name: row.name,
    shortName: row.shortName,
    category: row.category,
    tagline: row.tagline,
    officeLocation: row.officeLocation,
    memberCount: row.memberCount,
    accent: row.accent,
    isVerified: bool(row.isVerified),
    isSaved: saved.has(row.id),
  };
}

async function listClubRows(search?: string, category?: string, sort = "popular") {
  const filters = [];
  if (search) {
    filters.push(or(ilike(clubsTable.name, `%${search}%`), ilike(clubsTable.tagline, `%${search}%`)));
  }
  if (category && category !== "All") filters.push(eq(clubsTable.category, category));
  const orderBy = sort === "alphabetical" ? asc(clubsTable.name) : sort === "active" ? desc(clubsTable.joinedCount) : desc(clubsTable.memberCount);
  return db.select().from(clubsTable).where(filters.length ? and(...filters) : undefined).orderBy(orderBy);
}

router.get("/dashboard", async (_req, res) => {
  const [clubTotal, eventTotal, savedTotal, upcoming, featured, categoryRows] = await Promise.all([
    db.select({ value: count() }).from(clubsTable),
    db.select({ value: count() }).from(eventsTable).where(sql`${eventsTable.startsAt} >= NOW()`),
    db.select({ value: count() }).from(savedClubsTable).where(eq(savedClubsTable.studentKey, currentStudent)),
    db.select().from(eventsTable).where(sql`${eventsTable.startsAt} >= NOW()`).orderBy(asc(eventsTable.startsAt)).limit(1),
    db.select().from(clubsTable).orderBy(desc(clubsTable.memberCount)).limit(4),
    db.select({ category: clubsTable.category, count: count() }).from(clubsTable).groupBy(clubsTable.category).orderBy(desc(count())),
  ]);
  const thisWeek = await db.select({ value: count() }).from(eventsTable).where(and(sql`${eventsTable.startsAt} >= NOW()`, sql`${eventsTable.startsAt} < NOW() + INTERVAL '7 days'`));
  const saved = await savedIds();
  const payload = {
    clubCount: Number(clubTotal[0]?.value ?? 0),
    eventCount: Number(eventTotal[0]?.value ?? 0),
    savedCount: Number(savedTotal[0]?.value ?? 0),
    thisWeekEvents: Number(thisWeek[0]?.value ?? 0),
    categories: categoryRows.map((row) => ({ category: row.category, count: Number(row.count) })),
    featuredClubs: featured.map((row) => mapClub(row, saved)),
    nextEvent: upcoming[0] ? await eventView(upcoming[0]) : null,
  };
  return res.json(GetDashboardResponse.parse(payload));
});

router.get("/clubs", async (req, res) => {
  const params = ListClubsQueryParams.parse(req.query);
  const rows = await listClubRows(params.search, params.category, params.sort);
  const saved = await savedIds();
  res.json(rows.map((row) => mapClub(row, saved)));
});

router.get("/clubs/:id", async (req, res) => {
  const { id } = GetClubParams.parse({ id: Number(req.params.id) });
  const rows = await db.select().from(clubsTable).where(eq(clubsTable.id, id)).limit(1);
  if (!rows[0]) return res.status(404).json({ error: "Club not found" });
  const [roles, saved] = await Promise.all([
    db.select().from(clubRolesTable).where(eq(clubRolesTable.clubId, id)).orderBy(asc(clubRolesTable.id)),
    savedIds(),
  ]);
  const payload = {
    ...mapClub(rows[0], saved),
    description: rows[0].description,
    eligibility: rows[0].eligibility,
    roles,
    meetingSchedule: rows[0].meetingSchedule,
    socials: rows[0].socials,
    joinedCount: rows[0].joinedCount,
  };
  return res.json(GetClubResponse.parse(payload));
});

async function eventView(row: typeof eventsTable.$inferSelect) {
  const [club, registrations] = await Promise.all([
    db.select({ name: clubsTable.name }).from(clubsTable).where(eq(clubsTable.id, row.clubId)).limit(1),
    db.select({ value: count() }).from(registrationsTable).where(eq(registrationsTable.eventId, row.id)),
  ]);
  return {
    id: row.id,
    title: row.title,
    clubId: row.clubId,
    clubName: club[0]?.name ?? "Campus club",
    category: row.category,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    venue: row.venue,
    entryFee: row.entryFee,
    dutyLeave: row.dutyLeave,
    spotsLeft: row.spotsLeft,
    registrationRequired: row.registrationRequired,
    accent: row.accent,
    description: row.description,
    registrationCriteria: row.registrationCriteria,
    organizerEmail: row.organizerEmail,
    registeredCount: Number(registrations[0]?.value ?? 0),
  };
}

router.get("/events", async (req, res) => {
  const params = ListEventsQueryParams.parse(req.query);
  const filters = [sql`${eventsTable.startsAt} >= NOW()`];
  if (params.search) filters.push(or(ilike(eventsTable.title, `%${params.search}%`), ilike(eventsTable.category, `%${params.search}%`))!);
  if (params.category && params.category !== "All") filters.push(eq(eventsTable.category, params.category));
  if (params.timeframe === "week") filters.push(sql`${eventsTable.startsAt} < NOW() + INTERVAL '7 days'`);
  if (params.timeframe === "month") filters.push(sql`${eventsTable.startsAt} < NOW() + INTERVAL '30 days'`);
  const rows = await db.select().from(eventsTable).where(and(...filters)).orderBy(asc(eventsTable.startsAt));
  return res.json(await Promise.all(rows.map(eventView)));
});

router.get("/events/:id", async (req, res) => {
  const { id } = GetEventParams.parse({ id: Number(req.params.id) });
  const rows = await db.select().from(eventsTable).where(eq(eventsTable.id, id)).limit(1);
  if (!rows[0]) return res.status(404).json({ error: "Event not found" });
  const payload = await eventView(rows[0]);
  return res.json(GetEventResponse.parse(payload));
});

router.post("/events/:id/register", async (req, res) => {
  const { id } = RegisterForEventParams.parse({ id: Number(req.params.id) });
  const body = RegisterForEventBody.parse(req.body);
  const existing = await db.select({ id: registrationsTable.id }).from(registrationsTable).where(and(eq(registrationsTable.eventId, id), eq(registrationsTable.studentEmail, body.studentEmail))).limit(1);
  if (existing[0]) return res.status(409).json({ error: "This email is already registered for the event." });
  const inserted = await db.insert(registrationsTable).values({ eventId: id, ...body }).returning();
  const registration = inserted[0];
  return res.status(201).json({
    id: registration.id,
    eventId: registration.eventId,
    studentName: registration.studentName,
    studentEmail: registration.studentEmail,
    status: registration.status,
    createdAt: registration.createdAt.toISOString(),
  });
});

router.get("/saved-clubs", async (_req, res) => {
  const rows = await db.select({ club: clubsTable }).from(savedClubsTable).innerJoin(clubsTable, eq(savedClubsTable.clubId, clubsTable.id)).where(eq(savedClubsTable.studentKey, currentStudent)).orderBy(desc(savedClubsTable.createdAt));
  const saved = await savedIds();
  return res.json(rows.map((row) => mapClub(row.club, saved)));
});

router.post("/clubs/:id/save", async (req, res) => {
  const id = Number(req.params.id);
  const club = await db.select().from(clubsTable).where(eq(clubsTable.id, id)).limit(1);
  if (!club[0]) return res.status(404).json({ error: "Club not found" });
  const existing = await db.select({ id: savedClubsTable.id }).from(savedClubsTable).where(and(eq(savedClubsTable.clubId, id), eq(savedClubsTable.studentKey, currentStudent))).limit(1);
  if (!existing[0]) await db.insert(savedClubsTable).values({ clubId: id, studentKey: currentStudent });
  const saved = await savedIds();
  return res.status(201).json(mapClub(club[0], saved));
});

router.delete("/clubs/:id/save", async (req, res) => {
  await db.delete(savedClubsTable).where(and(eq(savedClubsTable.clubId, Number(req.params.id)), eq(savedClubsTable.studentKey, currentStudent)));
  return res.status(204).send();
});

export default router;