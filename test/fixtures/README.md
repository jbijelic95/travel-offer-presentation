# Fixtures — uzorci ponuda s Drivea

Ulaz za M2 (konverzija + ekstrakcija). Imena: `<godina>-<naručitelj>-<destinacija>[-što testira].<ext>`.
Nijedna nije mijenjana. Stvarni dokumenti agencije — ne dijeliti izvan projekta.

Podržani ulazi: .odt, .docx, .pdf.

| Datoteka | Što testira |
|---|---|
| `2019-gimnazija-grcka-bez-cijene.odt` | tipična maturalna, 9 dana, **cijena nije upisana** (validacija: greška) |
| `2019-ekonomska-budimpesta.pdf` | PDF ulaz, 2 dana, datumi uz dane, cijena u kn, doplata 1/1, fakultativne večere s cijenama |
| `2019-plitvice.docx` | DOCX ulaz, 3 dana, cijena u tablici s točkicama (`...320,00 kn`) |
| `2022-os-drenovci-primorje.odt` | 5 dana, osnovna škola, kn |
| `2023-ekonomska-novi-sad.odt` | 2 dana, EUR |
| `2023-tehnicka-bec.odt` | kratka ponuda (1,9k znakova), 2 dana, bez cijene |
| `2023-os-ilaca-zagreb.odt` | **jednodnevni izlet bez "N. dan" zaglavlja**, cijena "55 eura (414,40 kuna)", "informativna ponuda" |
| `2023-os-semeljci-oslo.odt` | **nije program po danima** — avion + hotel + autobus, tri odvojene cijene; rubni slučaj (ekstrakcija mora vratiti `dani: []`, ne izmišljati) |
| `2024-boso-grcka-prijedlog.odt` | ponuda samo za autobus (tvrtka, ne škola), dani bez narativa, cijena ukupna a ne po osobi |

## `unsupported/`

.doc (binarni Word) nije podržan ulaz. Datoteke ostaju kao uzorci teksta, ali alat ih ne čita. Za ekstrakciju ih treba ručno spremiti kao .odt ili .docx.

| Datoteka | Sadržaj |
|---|---|
| `2021-boso-medjugorje-dubrovnik-2hotela.doc` | dani kao "PRVI DAN / DRUGI DAN", **2 varijante hotela = 2 cijene**, doplate po hotelu, naručitelj nije škola |
| `2022-gimnazija-austrija.doc` | više dana, kn |
| `2023-rim.doc` | 7 dana, EUR |
| `2023-hep-petrcane-eur.doc` | **nije školsko putovanje** — edukacija za tvrtku, bez dana, EUR + kn; rubni slučaj |

`reference/` — stara prezentacija agencije (Budimpešta) i nacrt v1 (Grčka), samo za vizualnu usporedbu.
