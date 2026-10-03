import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Converted } from "../convert/index.js";
import { Ponuda, VrstaPrijevoza } from "../schema/ponuda.js";
import { SYSTEM_PROMPT } from "./prompt.js";

// Converted offer → Ponuda via Claude structured output. docs/PLAN.md §2, §3.
// The only place in the project that calls an LLM.

const CONFIG_FILE = fileURLToPath(new URL("../../config/extract.json", import.meta.url));
const ExtractConfig = z.object({ model: z.string() });

// What the model returns. Every field is required and nothing is nullable: optional fields and
// unions blow up the structured-output grammar ("Schema is too complex"). "" and 0 mean "not in
// the offer"; toPonuda() turns them back into missing fields. brojDana, valuta and meta are set in code.
const tekst = z.string();
const broj = z.number();
const lista = z.array(z.string());

export const Ekstrakcija = z.object({
  narucitelj: tekst,
  kontaktOsoba: tekst,
  brojPonude: tekst,
  datumPonude: tekst,
  naslov: tekst,
  termin: tekst,
  grupa: z.object({ ucenici: broj, nastavnici: broj, ukupno: broj, opis: tekst }),
  polazak: tekst,
  prijevoz: z.object({ vrste: z.array(VrstaPrijevoza), opis: tekst }),
  dani: z.array(z.object({ redni: broj, oznaka: tekst, datum: tekst, tekst, lokacije: lista })),
  cijena: z.object({
    iznos: broj,
    tekst,
    baza: tekst,
    varijante: z.array(z.object({ opis: tekst, tekst })),
    doplate: z.array(z.object({ opis: tekst, tekst })),
  }),
  ukljucuje: lista,
  neUkljucuje: lista,
  fakultativno: lista,
  placanje: lista,
  pogodnosti: lista,
  napomene: lista,
  potpis: z.object({ ime: tekst, tel: tekst, email: tekst, datum: tekst }),
  upozorenjaEkstrakcije: lista,
});
type Ekstrakcija = z.infer<typeof Ekstrakcija>;

const s = (v: string) => v.trim() || undefined;
const n = (v: number) => (v > 0 ? v : undefined);
/** Drops an object whose fields are all missing. */
const obj = <T extends object>(o: T) => (Object.values(o).some((v) => v !== undefined) ? o : undefined);

function toPonuda(e: Ekstrakcija, meta: Ponuda["meta"]): Ponuda {
  return Ponuda.parse({
    narucitelj: e.narucitelj.trim(),
    kontaktOsoba: s(e.kontaktOsoba),
    brojPonude: s(e.brojPonude),
    datumPonude: s(e.datumPonude),
    naslov: e.naslov.trim(),
    termin: s(e.termin),
    brojDana: n(e.dani.length),
    grupa: obj({ ucenici: n(e.grupa.ucenici), nastavnici: n(e.grupa.nastavnici), ukupno: n(e.grupa.ukupno), opis: s(e.grupa.opis) }),
    polazak: s(e.polazak),
    prijevoz: e.prijevoz.vrste.length ? { vrste: e.prijevoz.vrste, opis: s(e.prijevoz.opis) } : undefined,
    dani: e.dani.map((d) => ({ redni: d.redni, oznaka: d.oznaka, datum: s(d.datum), tekst: d.tekst, lokacije: d.lokacije })),
    cijena: s(e.cijena.tekst) && {
      iznos: n(e.cijena.iznos) ?? null,
      valuta: "EUR",
      tekst: e.cijena.tekst.trim(),
      baza: s(e.cijena.baza),
      varijante: e.cijena.varijante,
      doplate: e.cijena.doplate.map((d) => ({ opis: d.opis, tekst: s(d.tekst) })),
    },
    ukljucuje: e.ukljucuje,
    neUkljucuje: e.neUkljucuje,
    fakultativno: e.fakultativno,
    placanje: e.placanje,
    pogodnosti: e.pogodnosti,
    napomene: e.napomene,
    potpis: obj({ ime: s(e.potpis.ime), tel: s(e.potpis.tel), email: s(e.potpis.email), datum: s(e.potpis.datum) }),
    meta,
  });
}

export async function extract(doc: Converted, izvorniNazivDatoteke: string): Promise<Ponuda> {
  const { model } = ExtractConfig.parse(JSON.parse(readFileSync(CONFIG_FILE, "utf8")));
  const content: Anthropic.ContentBlockParam[] =
    doc.kind === "pdf"
      ? [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: doc.data.toString("base64") } },
          { type: "text", text: "Ponuda je u priloženom PDF-u." },
        ]
      : [{ type: "text", text: `<ponuda>\n${doc.text}\n</ponuda>` }];

  // No temperature: current Sonnet models reject non-default values (PLAN §3a).
  const res = await new Anthropic().messages.parse({
    model,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
    output_config: { effort: "medium", format: zodOutputFormat(Ekstrakcija) },
  });

  if (res.stop_reason === "refusal") throw new Error(`Model je odbio obraditi ponudu (${res.stop_details?.category ?? "bez kategorije"}).`);
  if (res.stop_reason === "max_tokens") throw new Error("Odgovor modela je prekinut (max_tokens). Ponuda je preduga.");
  if (!res.parsed_output) throw new Error("Model nije vratio JSON.");

  const e = res.parsed_output;
  return toPonuda(e, { izvorniNazivDatoteke, ekstrakcijaModel: res.model, upozorenjaEkstrakcije: e.upozorenjaEkstrakcije });
}
