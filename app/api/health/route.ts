import { db } from "@/db/railway";

export const runtime = "nodejs";

export function GET() {
  if (!process.env.BAR_PASSWORD) return Response.json({ ok: false }, { status: 503 });
  try {
    db.prepare("SELECT 1 AS ok").first();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
