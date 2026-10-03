// npm start — web page + POST /api/generate. docs/PLAN.md §1, §6.
// Env: ANTHROPIC_API_KEY, APP_PASSWORD (basic auth, min 16 chars), PORT (default 3000).
// Nothing is written to disk: the .pptx goes back in the JSON response.

import { createHash, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyError } from "fastify";
import { loadAgencija } from "./config.js";
import { type Converted, ConvertError, checkFormat, convertBuffer } from "./convert/index.js";
import { extract } from "./extract/index.js";
import { render } from "./render/index.js";
import type { Ponuda } from "./schema/ponuda.js";

const MAX_MB = 20;
const TIMEOUT_MS = 120_000;
const INDEX_HTML = fileURLToPath(new URL("../public/index.html", import.meta.url));

if (existsSync(".env")) process.loadEnvFile(".env");
const password = process.env.APP_PASSWORD ?? "";
if (password.length < 16) throw new Error("APP_PASSWORD mora imati barem 16 znakova.");
if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY nije postavljen.");

const agencija = loadAgencija();
const indexHtml = readFileSync(INDEX_HTML);
const logo = readFileSync(agencija.logo);

const sha = (s: string) => createHash("sha256").update(s).digest();
const passwordHash = sha(password);

/** Any user name; only the password counts. */
function authorized(header: string | undefined): boolean {
  if (!header?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  return timingSafeEqual(sha(decoded.slice(decoded.indexOf(":") + 1)), passwordHash);
}

/** "<naslov> – <narucitelj>.pptx" (PLAN §6), without characters Windows does not allow in file names. */
function imeDatoteke(p: Ponuda): string {
  const ime = [p.naslov, p.narucitelj]
    .map((s) => s.replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" – ");
  return (ime || "prezentacija") + ".pptx";
}

/** Retries once on a dropped connection (seen twice in M2). Timeouts and aborts are not retried. */
async function extractWithRetry(doc: Converted, name: string, signal: AbortSignal): Promise<Ponuda> {
  try {
    return await extract(doc, name, signal);
  } catch (e) {
    if (!(e instanceof Anthropic.APIConnectionError) || e instanceof Anthropic.APIConnectionTimeoutError || signal.aborted) throw e;
    return extract(doc, name, signal);
  }
}

class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

const app = Fastify({ logger: true, trustProxy: true });
await app.register(rateLimit, { global: false });
await app.register(multipart, { limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 } });

app.addHook("onRequest", async (req, reply) => {
  if (authorized(req.headers.authorization)) return;
  reply.code(401).header("WWW-Authenticate", 'Basic realm="Ponuda", charset="UTF-8"').type("text/plain; charset=utf-8");
  return reply.send("Potrebna je lozinka.");
});

app.setErrorHandler((err: FastifyError, req, reply) => {
  if (err instanceof HttpError || err instanceof ConvertError) {
    return reply.code(err instanceof HttpError ? err.statusCode : 400).send({ greska: err.message });
  }
  if (err.code === "FST_REQ_FILE_TOO_LARGE") {
    return reply.code(413).send({ greska: `Datoteka je veća od ${MAX_MB} MB.` });
  }
  if (err.code === "FST_INVALID_MULTIPART_CONTENT_TYPE") {
    return reply.code(400).send({ greska: "Datoteka nije poslana." });
  }
  if (err.statusCode === 429) {
    return reply.code(429).send({ greska: "Previše zahtjeva. Pokušajte ponovno za sat vremena." });
  }
  req.log.error(err);
  return reply.code(500).send({ greska: "Greška na serveru. Pokušajte ponovno." });
});

app.get("/", (_req, reply) => reply.type("text/html; charset=utf-8").send(indexHtml));
app.get("/logo.png", (_req, reply) => reply.type("image/png").header("Cache-Control", "max-age=86400").send(logo));

app.post("/api/generate", { config: { rateLimit: { max: 20, timeWindow: "1 hour" } } }, async (req) => {
  const file = await req.file();
  if (!file) throw new HttpError(400, "Datoteka nije poslana.");
  checkFormat(file.filename);
  const doc = await convertBuffer(await file.toBuffer(), file.filename);

  const signal = AbortSignal.timeout(TIMEOUT_MS);
  let ponuda: Ponuda;
  try {
    ponuda = await extractWithRetry(doc, file.filename, signal);
  } catch (e) {
    req.log.error(e);
    if (signal.aborted) throw new HttpError(504, "Obrada je trajala dulje od 2 minute. Pokušajte ponovno.");
    if (e instanceof Anthropic.APIError) throw new HttpError(502, "Servis za čitanje ponude trenutno ne radi. Pokušajte ponovno za nekoliko minuta.");
    throw new HttpError(502, `Čitanje ponude nije uspjelo: ${(e as Error).message}`);
  }

  const pptx = await render(ponuda, agencija);
  return { upozorenja: ponuda.meta.upozorenjaEkstrakcije, pptx: pptx.toString("base64"), imeDatoteke: imeDatoteke(ponuda) };
});

await app.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 3000) });
