import { env } from "cloudflare:workers";

export function getBarDb(): D1Database {
  if (!env.DB) throw new Error("Configure o binding D1 DB antes de usar o sistema.");
  return env.DB;
}
