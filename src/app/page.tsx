"use client";

import { useState } from "react";

export default function Home() {
  const [mode, setMode] = useState<"visitor" | "college">("visitor");
  const [message, setMessage] = useState("Use guest mode to browse and save a draft schedule.");
  const [guestCode, setGuestCode] = useState("");
  const [eventName, setEventName] = useState("Campus Fest");
  const [historyMessage, setHistoryMessage] = useState("");

  async function createCollegeAccount() {
    const response = await fetch("/api/colleges/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collegeId: "college-demo",
        adminEmail: "admin@demo.edu",
        password: "Password123!",
      }),
    });

    const data = await response.json();
    setMessage(response.ok ? `College account ready. Token: ${data.token}` : data.error);
  }

  async function createVisitorAccount() {
    const response = await fetch("/api/visitors/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "visitor@example.com", password: "Password123!" }),
    });

    const data = await response.json();
    setMessage(response.ok ? `Visitor account ready. Token: ${data.token}` : data.error);
  }

  async function saveGuestSelection() {
    const response = await fetch("/api/visitors/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-guest-session-id": guestCode || "guest-demo",
      },
      body: JSON.stringify({ eventName }),
    });

    const data = await response.json();
    setMessage(response.ok ? `Saved selection: ${data.selections.join(", ")}` : data.error);
  }

  async function viewHistory() {
    const response = await fetch("/api/visitors/history", {
      method: "GET",
      headers: { "x-guest-session-id": guestCode || "guest-demo" },
    });

    const data = await response.json();
    setHistoryMessage(data.message ?? `History: ${data.history?.join(", ") ?? "none"}`);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-black/30">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-400">FUF auth demo</p>
          <h1 className="text-4xl font-semibold">College login stays required, visitor access stays flexible.</h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Guests can browse and build a schedule without signing up. Colleges always sign in, and visitors can optionally save their work later.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className={`rounded-full px-4 py-2 ${mode === "visitor" ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-200"}`}
            onClick={() => setMode("visitor")}
          >
            Visitor flow
          </button>
          <button
            className={`rounded-full px-4 py-2 ${mode === "college" ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-200"}`}
            onClick={() => setMode("college")}
          >
            College flow
          </button>
        </div>

        {mode === "visitor" ? (
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <h2 className="text-xl font-semibold">Guest mode</h2>
              <p className="mt-2 text-sm text-slate-400">Create a guest session, add events, and keep browsing without an account.</p>
              <input
                className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                placeholder="Guest session id"
                value={guestCode}
                onChange={(event) => setGuestCode(event.target.value)}
              />
              <input
                className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                placeholder="Event name"
                value={eventName}
                onChange={(event) => setEventName(event.target.value)}
              />
              <button className="mt-4 rounded-full bg-cyan-500 px-4 py-2 font-medium text-slate-950" onClick={saveGuestSelection}>
                Save selection
              </button>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <h2 className="text-xl font-semibold">Optional account</h2>
              <p className="mt-2 text-sm text-slate-400">Save your schedule across devices by creating a visitor account.</p>
              <button className="mt-4 rounded-full bg-slate-100 px-4 py-2 font-medium text-slate-950" onClick={createVisitorAccount}>
                Create visitor account
              </button>
              <button className="mt-3 rounded-full border border-slate-700 px-4 py-2 font-medium text-slate-200" onClick={viewHistory}>
                View history
              </button>
              <p className="mt-4 text-sm text-cyan-300">{historyMessage}</p>
            </section>
          </div>
        ) : (
          <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <h2 className="text-xl font-semibold">College access</h2>
            <p className="mt-2 text-sm text-slate-400">Colleges must register and log in before using protected routes.</p>
            <button className="mt-4 rounded-full bg-emerald-500 px-4 py-2 font-medium text-slate-950" onClick={createCollegeAccount}>
              Register college account
            </button>
          </section>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
          <p className="font-medium">Status</p>
          <p className="mt-1">{message}</p>
        </div>
      </div>
    </main>
  );
}
