import test from "node:test";
import assert from "node:assert/strict";
import {
  createCollege,
  createEvent,
  createPreRegisteredEntry,
  createRegistration,
  createVenue,
  getVisitorSchedule,
  resetBackendStore,
  updateEvent,
  verifyRegistration,
} from "./backend";

test.beforeEach(() => {
  resetBackendStore();
});

test("verifyRegistration claims preregistered entries and returns matched event names", () => {
  const college = createCollege({
    id: "college-1",
    name: "Tech Fest",
    contactName: "Dr. Iyer",
    contactNumber: "+91-99999",
    festStartDate: new Date("2026-10-01T00:00:00.000Z"),
    festEndDate: new Date("2026-10-02T00:00:00.000Z"),
  });

  const event = createEvent({
    collegeId: college.id,
    venueId: "venue-1",
    name: "Robotics Workshop",
    startTime: new Date("2026-10-01T10:00:00.000Z"),
    endTime: new Date("2026-10-01T11:00:00.000Z"),
  });

  createVenue({
    collegeId: college.id,
    id: "venue-1",
    name: "Lab 2",
    xPercent: 10,
    yPercent: 20,
  });

  createPreRegisteredEntry({
    collegeId: college.id,
    eventId: event.id,
    email: " Visitor@example.com ",
    phone: "+91 123-456",
  });

  const result = verifyRegistration({
    visitorOrGuestId: "guest-123",
    collegeId: college.id,
    email: "visitor@example.com",
    phone: "123456",
  });

  assert.deepEqual(result.matchedEventNames, ["Robotics Workshop"]);
  assert.equal(result.createdCount, 1);

  const schedule = getVisitorSchedule("guest-123", new Date("2026-10-01T09:00:00.000Z"));
  assert.equal(schedule.events[0]?.name, "Robotics Workshop");
});

test("schedule flags cancelled events and venue changes", () => {
  const college = createCollege({
    id: "college-2",
    name: "Design Fest",
    contactName: "Prof. Rao",
    contactNumber: "+91-88888",
    festStartDate: new Date("2026-10-01T00:00:00.000Z"),
    festEndDate: new Date("2026-10-02T00:00:00.000Z"),
  });

  const venueA = createVenue({ collegeId: college.id, id: "venue-a", name: "Hall A" });
  const venueB = createVenue({ collegeId: college.id, id: "venue-b", name: "Hall B" });

  const firstEvent = createEvent({
    collegeId: college.id,
    venueId: venueA.id,
    name: "Opening",
    startTime: new Date("2026-10-01T10:00:00.000Z"),
    endTime: new Date("2026-10-01T11:00:00.000Z"),
  });

  const secondEvent = createEvent({
    collegeId: college.id,
    venueId: venueB.id,
    name: "Panel",
    startTime: new Date("2026-10-01T10:30:00.000Z"),
    endTime: new Date("2026-10-01T12:00:00.000Z"),
  });

  const cancelledEvent = createEvent({
    collegeId: college.id,
    venueId: venueB.id,
    name: "Workshop",
    startTime: new Date("2026-10-01T12:30:00.000Z"),
    endTime: new Date("2026-10-01T13:30:00.000Z"),
  });

  createRegistration({ visitorOrGuestId: "visitor-1", eventId: firstEvent.id, collegeId: college.id });
  createRegistration({ visitorOrGuestId: "visitor-1", eventId: secondEvent.id, collegeId: college.id });
  createRegistration({ visitorOrGuestId: "visitor-1", eventId: cancelledEvent.id, collegeId: college.id });

  updateEvent({
    eventId: firstEvent.id,
    collegeId: college.id,
    updates: { venueId: venueB.id },
    now: new Date("2026-10-01T10:05:00.000Z"),
  });

  const result = updateEvent({
    eventId: cancelledEvent.id,
    collegeId: college.id,
    updates: { status: "cancelled" },
  });

  assert.equal(result.event?.status, "cancelled");

  const schedule = getVisitorSchedule("visitor-1", new Date("2026-10-01T10:00:00.000Z"));
  const cancelledEntry = schedule.events.find((event) => event.name === "Workshop");
  const openingEntry = schedule.events.find((event) => event.name === "Opening");

  assert.equal(cancelledEntry?.status, "cancelled");
  assert.equal(openingEntry?.venueJustChanged, true);
});
