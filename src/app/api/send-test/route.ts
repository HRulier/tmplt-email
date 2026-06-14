import { Resend } from "resend";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserSettingsModel } from "@/lib/models/user-settings.model";

const resend = new Resend(process.env.RESEND_API_KEY);

const DAILY_LIMIT = 20;
const MAX_HTML_BYTES = 500_000;

const Body = z.object({
  html: z.string().min(1).max(MAX_HTML_BYTES),
});

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const { html } = parsed.data;

  await connectDB();
  const todayStart = startOfUtcDay(new Date());

  // Atomically reset the counter if we crossed a UTC day boundary, then increment.
  // findOneAndUpdate with $cond style isn't available; do two steps in a single doc.
  const settings = await UserSettingsModel.findOneAndUpdate(
    { userId: session.user.id },
    { $setOnInsert: { userId: session.user.id } },
    { upsert: true, new: true },
  );

  if (!settings.testEmailsResetAt || settings.testEmailsResetAt < todayStart) {
    settings.testEmailsResetAt = todayStart;
    settings.testEmailsToday = 0;
  }
  if (settings.testEmailsToday >= DAILY_LIMIT) {
    return Response.json({ error: "Daily limit reached" }, { status: 429 });
  }
  settings.testEmailsToday += 1;
  await settings.save();

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@example.com",
    to: session.user.email,
    subject: "Test email",
    html,
  });

  if (error) {
    console.error("[send-test] Resend error:", error);
    return Response.json({ error: "Send failed" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
