import { getBarDb } from "@/db/d1";
import { requireBarAuth } from "@/app/bar-auth";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireBarAuth(request);
  if (denied) return denied;
  try {
    await getBarDb().prepare("SELECT 1 AS ok").first();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
