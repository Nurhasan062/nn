import {
  clubRolesTable,
  clubsTable,
  db,
  eventsTable,
  registrationsTable,
  savedClubsTable,
} from "@workspace/db";

const categories = ["Technology", "Arts & Culture", "Social Impact", "Sports", "Business", "Academic"];
const palette = ["violet", "teal", "coral", "blue", "amber", "indigo"];

const featuredClubs: Array<[string, string, string, string, string, string, string, string, number, string]> = [
  ["CodeCraft Society", "CCS", "Technology", "Build the things you wish existed.", "Innovation Block · Room 204", "A builder community for students who like shipping useful software, hardware, and experiments.", "Open to all students. No prior coding experience required.", "Tuesdays · 6:00 PM", 284, "violet"],
  ["Theatre Atelier", "TA", "Arts & Culture", "Make a little more room for wonder.", "Arts Quadrangle · Studio 2", "A collaborative theatre collective spanning acting, direction, writing, design, and production.", "Open auditions each semester. Production crew roles are open year-round.", "Wednesdays · 5:30 PM", 196, "coral"],
  ["Green Campus Collective", "GCC", "Social Impact", "Small actions, measurable change.", "Student Centre · Office 1.12", "Students working across campus to make daily life more sustainable and equitable.", "Open to every student who wants to contribute. New members start with an orientation.", "Mondays · 4:00 PM", 312, "teal"],
  ["Venture Forge", "VF", "Business", "Turn the rough idea into a real one.", "Founders Hall · Floor 3", "A peer-led founder community for validating ideas, finding collaborators, and learning by doing.", "All years and disciplines welcome. Bring curiosity, not a pitch deck.", "Thursdays · 7:00 PM", 241, "indigo"],
  ["Raga & Rhythm", "R&R", "Arts & Culture", "Find your people in the sound.", "Cultural Centre · Rehearsal 4", "A home for Indian classical, folk, fusion, and contemporary music makers.", "Auditions are held for performance teams; jam sessions are open to everyone.", "Fridays · 6:30 PM", 158, "amber"],
  ["Run Club", "RUN", "Sports", "A better week starts with one lap.", "East Field · Pavilion", "A friendly, pace-inclusive running community with weekly routes and race training.", "Open to all fitness levels. No registration needed for weekly runs.", "Saturdays · 7:00 AM", 225, "blue"],
  ["Women in Computing", "WIC", "Technology", "More voices in the room.", "Innovation Block · Room 110", "Mentorship, workshops, and community for women and allies in computing.", "Open to students of all backgrounds and experience levels.", "Tuesdays · 4:30 PM", 203, "coral"],
  ["Debate Union", "DU", "Academic", "Think clearly. Speak bravely.", "Humanities Block · Seminar 6", "A competitive and welcoming union for parliamentary debate, public speaking, and argument.", "Open to all; novice training begins at the start of each term.", "Thursdays · 5:00 PM", 174, "violet"],
];

const roleTemplates = [
  ["Community Lead", ["Plan member circles and keep the club welcoming", "Coordinate with the student office", "Host monthly feedback sessions"], ["Communication", "Facilitation"], 1],
  ["Events Producer", ["Own event timelines and run-of-show", "Coordinate venue and vendor details", "Close the loop after each event"], ["Planning", "Operations"], 2],
  ["Content & Design Lead", ["Shape the club's visual language", "Create announcements and social content", "Maintain a lightweight content calendar"], ["Storytelling", "Design"], 1],
];

function futureDate(daysFromNow: number, hour: number) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

export async function seedDatabase() {
  const existing = await db.select({ id: clubsTable.id }).from(clubsTable).limit(1);
  if (existing.length > 0) return;

  const clubs = Array.from({ length: 500 }, (_, index) => {
    const id = index + 1;
    const featured = featuredClubs[index];
    if (featured) {
      return {
        id,
        name: featured[0],
        shortName: featured[1],
        category: featured[2],
        tagline: featured[3],
        officeLocation: featured[4],
        description: featured[5],
        eligibility: featured[6],
        meetingSchedule: featured[7],
        socials: ["instagram", "website"],
        memberCount: featured[8],
        joinedCount: Math.floor(Number(featured[8]) * 0.62),
        accent: featured[9],
        isVerified: "true",
      };
    }
    const category = categories[(index - featuredClubs.length) % categories.length];
    return {
      id,
      name: `${category} Circle ${String(index - featuredClubs.length + 1).padStart(3, "0")}`,
      shortName: `${category.slice(0, 2).toUpperCase()}${String(id).padStart(3, "0")}`,
      category,
      tagline: `Find your people. Make something that matters.`,
      officeLocation: `Student Activities Centre · Desk ${100 + (id % 40)}`,
      description: `A student-led ${category.toLowerCase()} community with regular meetups, project teams, and campus collaborations.`,
      eligibility: "Open to all currently enrolled students. No prior experience required.",
      meetingSchedule: "Schedule shared after joining",
      socials: ["website"],
      memberCount: 35 + (id % 180),
      joinedCount: 18 + (id % 90),
      accent: palette[index % palette.length],
      isVerified: "true",
    };
  });
  await db.insert(clubsTable).values(clubs);

  const roles = featuredClubs.flatMap((_, index) =>
    roleTemplates.map((template, roleIndex) => ({
      id: index * 10 + roleIndex + 1,
      clubId: index + 1,
      title: template[0] as string,
      responsibilities: template[1] as string[],
      skills: template[2] as string[],
      openings: template[3] as number,
    })),
  );
  await db.insert(clubRolesTable).values(roles);

  await db.insert(eventsTable).values([
    {
      id: 1, clubId: 1, title: "Build Night: Ship your first API", category: "Workshop",
      startsAt: futureDate(1, 18), endsAt: futureDate(1, 20), venue: "Innovation Block · Lab 3",
      entryFee: 0, dutyLeave: true, spotsLeft: 42, registrationRequired: true,
      registrationCriteria: "Open to all students. Bring a laptop; teams of 2–4 are encouraged.",
      description: "A practical evening of building, pairing, and getting one small idea live on the web.",
      organizerEmail: "hello@codecraft.example", accent: "violet",
    },
    {
      id: 2, clubId: 3, title: "Campus Waste Audit Walk", category: "Field Activity",
      startsAt: futureDate(2, 16), endsAt: futureDate(2, 18), venue: "Meet outside the Student Centre",
      entryFee: 0, dutyLeave: true, spotsLeft: 18, registrationRequired: true,
      registrationCriteria: "Open to every student. Comfortable walking shoes recommended.",
      description: "Map waste patterns across campus and turn observations into practical changes.",
      organizerEmail: "green@campus.example", accent: "teal",
    },
    {
      id: 3, clubId: 2, title: "Open Stage: One Night, Many Voices", category: "Performance",
      startsAt: futureDate(3, 19), endsAt: futureDate(3, 21), venue: "Black Box Theatre",
      entryFee: 150, dutyLeave: false, spotsLeft: 120, registrationRequired: true,
      registrationCriteria: "Everyone is welcome. Performers should register separately with the theatre team.",
      description: "A night of monologues, movement, music, and stories from across campus.",
      organizerEmail: "atelier@campus.example", accent: "coral",
    },
    {
      id: 4, clubId: 4, title: "Idea Clinic: From Problem to Prototype", category: "Talk",
      startsAt: futureDate(5, 17), endsAt: futureDate(5, 19), venue: "Founders Hall · Auditorium",
      entryFee: 0, dutyLeave: true, spotsLeft: 64, registrationRequired: true,
      registrationCriteria: "Open to all years and disciplines. You can attend without an idea.",
      description: "Bring a problem you care about and leave with a sharper first experiment.",
      organizerEmail: "forge@campus.example", accent: "indigo",
    },
    {
      id: 5, clubId: 6, title: "Sunrise 5K · East Loop", category: "Sports",
      startsAt: futureDate(6, 7), endsAt: futureDate(6, 9), venue: "East Field · Pavilion",
      entryFee: 80, dutyLeave: false, spotsLeft: 95, registrationRequired: true,
      registrationCriteria: "Open to all students. Choose your pace at check-in.",
      description: "A low-pressure campus run with a 2K walk option and breakfast after the finish.",
      organizerEmail: "runclub@campus.example", accent: "blue",
    },
    {
      id: 6, clubId: 7, title: "Women in Tech: Career Stories", category: "Panel",
      startsAt: futureDate(7, 18), endsAt: futureDate(7, 20), venue: "Innovation Block · Room 110",
      entryFee: 0, dutyLeave: true, spotsLeft: 76, registrationRequired: true,
      registrationCriteria: "Open to students of every year and gender identity.",
      description: "A candid panel about first roles, confidence, mentorship, and building a career in tech.",
      organizerEmail: "wic@campus.example", accent: "coral",
    },
    {
      id: 7, clubId: 8, title: "Novice Debate Bootcamp", category: "Competition",
      startsAt: futureDate(8, 10), endsAt: futureDate(8, 16), venue: "Humanities Block · Seminar Wing",
      entryFee: 250, dutyLeave: true, spotsLeft: 32, registrationRequired: true,
      registrationCriteria: "Open to students new to debate. Teams are formed at the venue.",
      description: "A full-day introduction to motions, cases, rebuttals, and confident public speaking.",
      organizerEmail: "debate@campus.example", accent: "violet",
    },
    {
      id: 8, clubId: 5, title: "Raga & Rhythm Jam Session", category: "Music",
      startsAt: futureDate(10, 18), endsAt: futureDate(10, 21), venue: "Cultural Centre · Rehearsal 4",
      entryFee: 0, dutyLeave: false, spotsLeft: 40, registrationRequired: false,
      registrationCriteria: "Walk in with an instrument, a voice, or just an open ear.",
      description: "An open room for collaboration across classical, folk, fusion, and contemporary styles.",
      organizerEmail: "raga@campus.example", accent: "amber",
    },
  ]);
  await db.insert(registrationsTable).values([
    { eventId: 1, studentName: "Aarav Sharma", studentEmail: "aarav@example.edu", year: "3rd year", department: "Computer Science" },
    { eventId: 1, studentName: "Maya Iyer", studentEmail: "maya@example.edu", year: "2nd year", department: "Design" },
  ]);
}