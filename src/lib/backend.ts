import { randomUUID } from "node:crypto";

export type EventStatus = "scheduled" | "changed" | "cancelled";

export type CollegeRecord = {
  id: string;
  name: string;
  logoUrl?: string | null;
  mapImageUrl?: string | null;
  contactNumber: string;
  contactName: string;
  festStartDate: Date;
  festEndDate: Date;
};

export type VenueRecord = {
  id: string;
  collegeId: string;
  name: string;
  xPercent?: number | null;
  yPercent?: number | null;
};

export type EventRecord = {
  id: string;
  collegeId: string;
  venueId: string;
  name: string;
  startTime: Date;
  endTime: Date;
  status: EventStatus;
  lastVenueChangeAt?: Date | null;
  previousVenueName?: string | null;
  contactName?: string | null;
  contactNumber?: string | null;
};

export type RegistrationRecord = {
  id: string;
  visitorId?: string | null;
  guestSessionId?: string | null;
  eventId: string;
  collegeId: string;
  registeredAt: Date;
};

export type PreRegisteredEntryRecord = {
  id: string;
  collegeId: string;
  eventId: string;
  email?: string | null;
  phone?: string | null;
  matched: boolean;
};

export type CreateCollegeInput = {
  id?: string;
  name: string;
  logoUrl?: string | null;
  mapImageUrl?: string | null;
  contactNumber?: string;
  contactName: string;
  festStartDate: Date;
  festEndDate: Date;
};

export type CreateVenueInput = {
  id?: string;
  collegeId: string;
  name: string;
  xPercent?: number | null;
  yPercent?: number | null;
};

export type CreateEventInput = {
  id?: string;
  collegeId: string;
  venueId: string;
  name: string;
  startTime: Date;
  endTime: Date;
  status?: EventStatus;
  contactName?: string | null;
  contactNumber?: string | null;
};

export type UpdateEventInput = {
  eventId: string;
  collegeId: string;
  updates: Partial<Pick<EventRecord, "venueId" | "startTime" | "endTime" | "contactName" | "contactNumber" | "status">>;
  now?: Date;
};

export type CreateRegistrationInput = {
  visitorOrGuestId: string;
  eventId: string;
  collegeId: string;
  visitorId?: string | null;
  guestSessionId?: string | null;
};

export type CreatePreRegisteredEntryInput = {
  collegeId: string;
  eventId: string;
  email?: string | null;
  phone?: string | null;
  matched?: boolean;
};

export type VerifyRegistrationInput = {
  visitorOrGuestId: string;
  collegeId: string;
  email?: string | null;
  phone?: string | null;
};

export type VerifyRegistrationResult = {
  matchedEventNames: string[];
  createdCount: number;
};

type BackendStore = {
  colleges: CollegeRecord[];
  venues: VenueRecord[];
  events: EventRecord[];
  registrations: RegistrationRecord[];
  preRegisteredEntries: PreRegisteredEntryRecord[];
};

const store: BackendStore = {
  colleges: [],
  venues: [],
  events: [],
  registrations: [],
  preRegisteredEntries: [],
};

function normalizeEmail(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.trim().toLowerCase();
}

function normalizePhone(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.replace(/\D/g, "");
}

function getCollege(collegeId: string): CollegeRecord | undefined {
  return store.colleges.find((college) => college.id === collegeId);
}

function getVenue(venueId: string): VenueRecord | undefined {
  return store.venues.find((venue) => venue.id === venueId);
}

export function getEvent(eventId: string): EventRecord | undefined {
  return store.events.find((event) => event.id === eventId);
}

export function resetBackendStore(): void {
  store.colleges = [];
  store.venues = [];
  store.events = [];
  store.registrations = [];
  store.preRegisteredEntries = [];
}

export function createCollege(input: CreateCollegeInput): CollegeRecord {
  const college: CollegeRecord = {
    id: input.id ?? `college-${randomUUID()}`,
    name: input.name,
    logoUrl: input.logoUrl ?? null,
    mapImageUrl: input.mapImageUrl ?? null,
    contactNumber: input.contactNumber ?? "",
    contactName: input.contactName,
    festStartDate: input.festStartDate,
    festEndDate: input.festEndDate,
  };

  store.colleges.push(college);
  return college;
}

export function createVenue(input: CreateVenueInput): VenueRecord {
  const venue: VenueRecord = {
    id: input.id ?? `venue-${randomUUID()}`,
    collegeId: input.collegeId,
    name: input.name,
    xPercent: input.xPercent ?? null,
    yPercent: input.yPercent ?? null,
  };

  store.venues.push(venue);
  return venue;
}

export function createEvent(input: CreateEventInput): EventRecord {
  const event: EventRecord = {
    id: input.id ?? `event-${randomUUID()}`,
    collegeId: input.collegeId,
    venueId: input.venueId,
    name: input.name,
    startTime: input.startTime,
    endTime: input.endTime,
    status: input.status ?? "scheduled",
    contactName: input.contactName ?? null,
    contactNumber: input.contactNumber ?? null,
  };

  store.events.push(event);
  return event;
}

export function updateEvent(input: UpdateEventInput): { event?: EventRecord; changed: boolean } {
  const event = getEvent(input.eventId);
  if (!event) {
    return { changed: false };
  }

  if (event.collegeId !== input.collegeId) {
    return { changed: false };
  }

  const now = input.now ?? new Date();
  let changed = false;

  if (input.updates.venueId && input.updates.venueId !== event.venueId) {
    const venue = getVenue(input.updates.venueId);
    if (!venue) {
      return { changed: false };
    }

    const previousVenueName = getVenue(event.venueId)?.name ?? null;
    event.venueId = input.updates.venueId;
    event.status = "changed";
    event.lastVenueChangeAt = now;
    event.previousVenueName = previousVenueName;
    changed = true;
  }

  if (input.updates.startTime) {
    event.startTime = input.updates.startTime;
    changed = true;
  }

  if (input.updates.endTime) {
    event.endTime = input.updates.endTime;
    changed = true;
  }

  if (input.updates.contactName !== undefined) {
    event.contactName = input.updates.contactName;
    changed = true;
  }

  if (input.updates.contactNumber !== undefined) {
    event.contactNumber = input.updates.contactNumber;
    changed = true;
  }

  if (input.updates.status) {
    event.status = input.updates.status;
    changed = true;
  }

  return { event, changed };
}

export function createRegistration(input: CreateRegistrationInput): RegistrationRecord {
  const registration: RegistrationRecord = {
    id: `registration-${randomUUID()}`,
    visitorId: input.visitorId ?? null,
    guestSessionId: input.guestSessionId ?? null,
    eventId: input.eventId,
    collegeId: input.collegeId,
    registeredAt: new Date(),
  };

  if (input.visitorOrGuestId) {
    if (input.visitorId) {
      registration.visitorId = input.visitorId;
    } else if (input.guestSessionId) {
      registration.guestSessionId = input.guestSessionId;
    } else {
      registration.guestSessionId = input.visitorOrGuestId;
    }
  }

  store.registrations.push(registration);
  return registration;
}

export function createPreRegisteredEntry(input: CreatePreRegisteredEntryInput): PreRegisteredEntryRecord {
  const entry: PreRegisteredEntryRecord = {
    id: `preregistered-${randomUUID()}`,
    collegeId: input.collegeId,
    eventId: input.eventId,
    email: normalizeEmail(input.email),
    phone: normalizePhone(input.phone),
    matched: input.matched ?? false,
  };

  store.preRegisteredEntries.push(entry);
  return entry;
}

export function verifyRegistration(input: VerifyRegistrationInput): VerifyRegistrationResult {
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedPhone = normalizePhone(input.phone);

  const matches = store.preRegisteredEntries.filter((entry) => {
    if (entry.collegeId !== input.collegeId) {
      return false;
    }

    if (entry.matched) {
      return false;
    }

    const emailMatches = normalizedEmail && entry.email && normalizedEmail === entry.email;
    const phoneMatches = normalizedPhone && entry.phone && normalizedPhone === entry.phone;
    return emailMatches || phoneMatches;
  });

  const matchedEventNames = [] as string[];
  for (const entry of matches) {
    const event = getEvent(entry.eventId);
    if (!event) {
      continue;
    }

    createRegistration({
      visitorOrGuestId: input.visitorOrGuestId,
      eventId: entry.eventId,
      collegeId: input.collegeId,
    });

    entry.matched = true;
    matchedEventNames.push(event.name);
  }

  return {
    matchedEventNames,
    createdCount: matchedEventNames.length,
  };
}

export function getVisitorSchedule(visitorOrGuestId: string, now = new Date()): { events: Array<{
  id: string;
  name: string;
  venue: string;
  startTime: string;
  endTime: string;
  status: EventStatus;
  contactName?: string | null;
  contactNumber?: string | null;
  walkMinutesToNext?: number | null;
  venueJustChanged?: boolean;
  conflictWithEventId?: string | null;
}>; lastSyncedAt: string } {
  const registrations = store.registrations.filter((entry) => {
    const matchesVisitor = entry.visitorId === visitorOrGuestId;
    const matchesGuest = entry.guestSessionId === visitorOrGuestId;
    return matchesVisitor || matchesGuest;
  });

  const events = registrations
    .map((registration) => getEvent(registration.eventId))
    .filter((event): event is EventRecord => Boolean(event))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const nonCancelledEvents = events.filter((event) => event.status !== "cancelled");

  const result = events.map((event) => {
    const venue = getVenue(event.venueId);
    const venueJustChanged = Boolean(event.lastVenueChangeAt && event.lastVenueChangeAt >= new Date(now.getTime() - 30 * 60 * 1000));
    const eventIndex = nonCancelledEvents.findIndex((candidate) => candidate.id === event.id);
    const nextEvent = event.status === "cancelled" ? null : nonCancelledEvents[eventIndex + 1] ?? null;
    const walkMinutesToNext = event.status === "cancelled" ? null : nextEvent ? 6 : null;
    const conflictWithEventId = event.status === "cancelled"
      ? null
      : nonCancelledEvents.find((candidate) => candidate.id !== event.id && candidate.startTime.getTime() < event.endTime.getTime() && candidate.endTime.getTime() > event.startTime.getTime())?.id ?? null;

    return {
      id: event.id,
      name: event.name,
      venue: venue?.name ?? "",
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      status: event.status,
      contactName: event.contactName ?? getCollege(event.collegeId)?.contactName ?? null,
      contactNumber: event.contactNumber ?? getCollege(event.collegeId)?.contactNumber ?? null,
      walkMinutesToNext,
      venueJustChanged,
      conflictWithEventId,
    };
  });

  return {
    events: result,
    lastSyncedAt: now.toISOString(),
  };
}

export function listColleges(search?: string): CollegeRecord[] {
  const query = search?.trim().toLowerCase() ?? "";

  if (!query) {
    return [...store.colleges];
  }

  return store.colleges.filter((college) => college.name.toLowerCase().includes(query));
}

export function listCollegeEvents(collegeId: string, date?: string): EventRecord[] {
  const college = getCollege(collegeId);
  if (!college) {
    return [];
  }

  const baseEvents = store.events.filter((event) => event.collegeId === collegeId);

  if (!date) {
    return [...baseEvents].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  return baseEvents
    .filter((event) => event.startTime >= startOfDay && event.startTime <= endOfDay)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

export function createRegistrationBatch(input: { visitorOrGuestId: string; eventIds: string[]; collegeId?: string }): RegistrationRecord[] {
  const registrations: RegistrationRecord[] = [];
  input.eventIds.forEach((eventId) => {
    const event = getEvent(eventId);
    if (!event) {
      return;
    }

    registrations.push(createRegistration({
      visitorOrGuestId: input.visitorOrGuestId,
      eventId,
      collegeId: input.collegeId ?? event.collegeId,
    }));
  });

  return registrations;
}

export function getVisitorHistory(visitorOrGuestId: string): string[] {
  const registrations = store.registrations.filter((entry) => entry.visitorId === visitorOrGuestId);
  const eventIds = new Set(registrations.map((entry) => entry.eventId));
  return Array.from(eventIds).map((eventId) => getEvent(eventId)?.name ?? "").filter(Boolean);
}

export function migrateGuestRegistrations(guestSessionId: string, visitorId: string): number {
  const registrations = store.registrations.filter((entry) => entry.guestSessionId === guestSessionId);
  registrations.forEach((registration) => {
    registration.guestSessionId = null;
    registration.visitorId = visitorId;
  });

  return registrations.length;
}
