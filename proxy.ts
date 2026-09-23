import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const password = process.env.BAR_PASSWORD;
  if (!password) return new NextResponse("Acesso ainda não configurado.", { status: 503 });
  const authorization = request.headers.get("authorization") ?? "";
  let credentials = "";
  try {
    if (authorization.startsWith("Basic ")) credentials = Buffer.from(authorization.slice(6), "base64").toString("utf8");
  } catch { /* Credenciais inválidas. */ }
  const expected = `${process.env.BAR_USER || "bar"}:${password}`;
  const actualHash = createHash("sha256").update(credentials).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  if (!timingSafeEqual(actualHash, expectedHash)) {
    return new NextResponse("Informe as credenciais do Controle do Bar.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Controle do Bar", charset="UTF-8"', "Cache-Control": "no-store" },
    });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/api/:path*"] };
