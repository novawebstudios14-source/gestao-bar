import { NextRequest, NextResponse } from "next/server";
import { requireBarAuth } from "./app/bar-auth";

export async function proxy(request: NextRequest) {
  const denied = await requireBarAuth(request);
  return denied ?? NextResponse.next();
}

export const config = { matcher: ["/", "/api/:path*"] };
