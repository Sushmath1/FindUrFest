import test from "node:test";
import assert from "node:assert/strict";
import { createCollegeToken, createVisitorToken, getVisitorContext, requireCollegeAuth } from "./auth";

test("visitor token never passes college auth", () => {
  const visitorToken = createVisitorToken({ visitorId: "visitor-1" });
  const request = {
    headers: new Headers({ authorization: `Bearer ${visitorToken}` }),
  } as Request & { collegeId?: string };

  assert.throws(() => requireCollegeAuth(request), /Unauthorized/);
});

test("visitor context resolves a guest session when no visitor token is present", () => {
  const request = {
    headers: new Headers(),
    cookies: new Map([["guestSessionId", "guest-123"]]),
  } as unknown as Request & { visitorId?: string; guestSessionId?: string };

  const context = getVisitorContext(request);

  assert.equal(context.guestSessionId, "guest-123");
  assert.equal(context.visitorId, undefined);
});

test("college auth attaches college id from token", () => {
  const collegeToken = createCollegeToken({ collegeId: "college-1" });
  const request = {
    headers: new Headers({ authorization: `Bearer ${collegeToken}` }),
  } as Request & { collegeId?: string };

  const result = requireCollegeAuth(request);

  assert.equal(result.collegeId, "college-1");
});
