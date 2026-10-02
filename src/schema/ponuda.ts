import { z } from "zod";

// Contract between extraction (LLM) and render. See docs/PLAN.md §3.
// Only what is literally written in the offer, plus enums the LLM classifies.
// Missing data is a validation warning (M3), not a parse error.

const lista = z.array(z.string()).default([]);

export const VrstaPrijevoza = z.enum(["autobus", "brod", "trajekt", "avion", "vlak"]);

export const Dan = z.object({
  redni: z.number().int().positive(),
  oznaka: z.string(),
  datum: z.string().optional(),
  tekst: z.string(),
  lokacije: lista,
});

export const Cijena = z.object({
  iznos: z.number().nullish(),
  valuta: z.literal("EUR"),
  tekst: z.string(),
  baza: z.string().optional(),
  varijante: z.array(z.object({ opis: z.string(), tekst: z.string() })).default([]),
  doplate: z.array(z.object({ opis: z.string(), tekst: z.string().optional() })).default([]),
});

export const Ponuda = z.object({
  narucitelj: z.string(),
  kontaktOsoba: z.string().optional(),
  brojPonude: z.string().optional(),
  datumPonude: z.string().optional(),
  naslov: z.string(),
  termin: z.string().optional(),
  brojDana: z.number().int().positive().optional(),
  grupa: z
    .object({
      ucenici: z.number().int().nonnegative().optional(),
      nastavnici: z.number().int().nonnegative().optional(),
      ukupno: z.number().int().nonnegative().optional(),
      opis: z.string().optional(),
    })
    .optional(),
  polazak: z.string().optional(),
  prijevoz: z
    .object({
      vrste: z.array(VrstaPrijevoza),
      opis: z.string().optional(),
    })
    .optional(),
  dani: z.array(Dan).default([]),
  cijena: Cijena.optional(),
  ukljucuje: lista,
  neUkljucuje: lista,
  fakultativno: lista,
  placanje: lista,
  pogodnosti: lista,
  napomene: lista,
  potpis: z
    .object({
      ime: z.string().optional(),
      tel: z.string().optional(),
      email: z.string().optional(),
      datum: z.string().optional(),
    })
    .optional(),
  meta: z.object({
    izvorniNazivDatoteke: z.string(),
    ekstrakcijaModel: z.string(),
    upozorenjaEkstrakcije: lista,
  }),
});

export type VrstaPrijevoza = z.infer<typeof VrstaPrijevoza>;
export type Dan = z.infer<typeof Dan>;
export type Cijena = z.infer<typeof Cijena>;
/** Parsed offer: arrays are always present (default []). */
export type Ponuda = z.infer<typeof Ponuda>;
/** Offer as written in JSON: arrays may be omitted. */
export type PonudaInput = z.input<typeof Ponuda>;
