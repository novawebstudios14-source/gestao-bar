import { env } from "cloudflare:workers";

export async function requireBarAuth(request: Request): Promise<Response | null> {
  const settings = env as typeof env & { BAR_USER?: string; BAR_PASSWORD?: string };
  const username = settings.BAR_USER || "bar";
  const password = settings.BAR_PASSWORD;
  if (!password) return new Response("Acesso ainda não configurado.", { status: 503, headers: { "Cache-Control": "no-store" } });
  const header = request.headers.get("authorization") || "";
  let credentials = "";
  try {
    if (header.startsWith("Basic ")) credentials = atob(header.slice(6));
  } catch { /* Credenciais inválidas. */ }
  const encoder = new TextEncoder();
  const [actual, expected] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(credentials)),
    crypto.subtle.digest("SHA-256", encoder.encode(`${username}:${password}`)),
  ]);
  const left = new Uint8Array(actual), right = new Uint8Array(expected);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  if (difference === 0) return null;
  return new Response("Informe as credenciais do Controle do Bar.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Controle do Bar", charset="UTF-8"', "Cache-Control": "no-store" },
  });
}
