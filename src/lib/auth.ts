import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.AUTH_SECRET ?? "dev-secret-change-me";
const SALT_ROUNDS = 10;

type AuthRequest = {
  headers?: Headers | Record<string, string | string[] | undefined>;
  cookies?: {
    get?: (name: string) => { value: string } | undefined;
  };
  [key: string]: any;
};

type VisitorContext = {
  visitorId?: string;
  guestSessionId?: string;
};

type CollegeTokenPayload = {
  type: "college";
  collegeId: string;
};

type VisitorTokenPayload = {
  type: "visitor";
  visitorId: string;
};

type StoredCollegeAccount = {
  collegeId: string;
  adminEmail: string;
  passwordHash: string;
};

type StoredVisitorAccount = {
  visitorId: string;
  email: string;
  passwordHash: string;
};

const collegeAccounts = new Map<string, StoredCollegeAccount>();
const visitorAccounts = new Map<string, StoredVisitorAccount>();
const guestSelections = new Map<string, Set<string>>();
const visitorHistory = new Map<string, Set<string>>();

function normalizeHeaders(headers?: AuthRequest["headers"]): Headers {
  if (!headers) {
    return new Headers();
  }

  if (headers instanceof Headers) {
    return headers;
  }

  const mapped = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    if (typeof value === "string") {
      mapped.set(key, value);
    } else if (Array.isArray(value)) {
      mapped.set(key, value.join(","));
    }
  });

  return mapped;
}

function getHeaderValue(req: AuthRequest, name: string): string | null {
  const headers = normalizeHeaders(req.headers);
  return headers.get(name);
}

function getCookieValue(req: AuthRequest, name: string): string | undefined {
  const cookieHeader = getHeaderValue(req, "cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
    if (match) {
      return match[1];
    }
  }

  if (req.cookies?.get) {
    const cookie = req.cookies.get(name);
    if (cookie?.value) {
      return cookie.value;
    }
  }

  return undefined;
}

function extractBearerToken(req: AuthRequest): string | null {
  const header = getHeaderValue(req, "authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length);
}

function extractGuestSessionId(req: AuthRequest): string | undefined {
  return getHeaderValue(req, "x-guest-session-id") ?? getCookieValue(req, "guestSessionId");
}

export function createGuestSessionId(): string {
  return randomUUID();
}

export function createCollegeToken(payload: { collegeId: string }): string {
  return jwt.sign({ type: "college", collegeId: payload.collegeId } satisfies CollegeTokenPayload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function createVisitorToken(payload: { visitorId: string }): string {
  return jwt.sign({ type: "visitor", visitorId: payload.visitorId } satisfies VisitorTokenPayload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): CollegeTokenPayload | VisitorTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as CollegeTokenPayload | VisitorTokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function registerCollegeAccount(input: { collegeId: string; adminEmail: string; password: string }) {
  const passwordHash = await hashPassword(input.password);
  const payload = {
    collegeId: input.collegeId,
    adminEmail: input.adminEmail,
    passwordHash,
  } satisfies StoredCollegeAccount;

  collegeAccounts.set(input.collegeId, payload);
  return payload;
}

export async function registerVisitorAccount(input: { visitorId?: string; email: string; password: string }) {
  const passwordHash = await hashPassword(input.password);
  const payload = {
    visitorId: input.visitorId ?? `visitor-${randomUUID()}`,
    email: input.email,
    passwordHash,
  } satisfies StoredVisitorAccount;

  visitorAccounts.set(payload.visitorId, payload);
  return payload;
}

export async function findCollegeByEmail(email: string): Promise<StoredCollegeAccount | null> {
  for (const account of collegeAccounts.values()) {
    if (account.adminEmail === email) {
      return account;
    }
  }

  return null;
}

export async function findVisitorByEmail(email: string): Promise<StoredVisitorAccount | null> {
  for (const account of visitorAccounts.values()) {
    if (account.email === email) {
      return account;
    }
  }

  return null;
}

export function requireCollegeAuth(req: AuthRequest): AuthRequest & { collegeId: string } {
  const token = extractBearerToken(req);
  if (!token) {
    throw new Error("Unauthorized");
  }

  const payload = verifyToken(token);
  if (!payload || payload.type !== "college") {
    throw new Error("Unauthorized");
  }

  return Object.assign(req, { collegeId: payload.collegeId });
}

export function getVisitorContext(req: AuthRequest): VisitorContext {
  const token = extractBearerToken(req);
  const tokenPayload = token ? verifyToken(token) : null;

  if (tokenPayload && tokenPayload.type === "visitor") {
    return { visitorId: tokenPayload.visitorId };
  }

  const guestSessionId = extractGuestSessionId(req);
  return guestSessionId ? { guestSessionId } : {};
}

export function getVisitorSelections(context: VisitorContext): string[] {
  const key = context.visitorId ?? context.guestSessionId;
  if (!key) {
    return [];
  }

  return Array.from(guestSelections.get(key) ?? []);
}

export function addVisitorSelection(context: VisitorContext, eventName: string): string[] {
  const key = context.visitorId ?? context.guestSessionId;
  if (!key) {
    return [];
  }

  const current = guestSelections.get(key) ?? new Set<string>();
  current.add(eventName);
  guestSelections.set(key, current);
  return Array.from(current);
}

export function getVisitorHistory(context: VisitorContext): string[] {
  const key = context.visitorId ?? context.guestSessionId;
  if (!key) {
    return [];
  }

  return Array.from(visitorHistory.get(key) ?? []);
}

export function recordVisitorHistory(context: VisitorContext, eventName: string): string[] {
  const key = context.visitorId ?? context.guestSessionId;
  if (!key) {
    return [];
  }

  const current = visitorHistory.get(key) ?? new Set<string>();
  current.add(eventName);
  visitorHistory.set(key, current);
  return Array.from(current);
}

export async function migrateGuestSelections(guestSessionId: string, visitorId: string) {
  const selections = guestSelections.get(guestSessionId);
  if (!selections?.size) {
    return [];
  }

  const target = guestSelections.get(visitorId) ?? new Set<string>();
  selections.forEach((eventName) => target.add(eventName));
  guestSelections.set(visitorId, target);
  guestSelections.delete(guestSessionId);

  const history = visitorHistory.get(guestSessionId);
  if (history?.size) {
    const targetHistory = visitorHistory.get(visitorId) ?? new Set<string>();
    history.forEach((eventName) => targetHistory.add(eventName));
    visitorHistory.set(visitorId, targetHistory);
    visitorHistory.delete(guestSessionId);
  }

  return Array.from(target);
}
