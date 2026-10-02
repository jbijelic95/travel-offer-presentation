const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const path = require("path");
const fa = require("react-icons/fa");

const IN = path.join(__dirname, "..", "assets");

// ---------- DATA (ovo bi se kasnije punilo iz ponude) ----------
const D = {
  skola: "Gimnazija Vinkovci",
  ponudaBr: "08/2018",
  termin: "20.08. – 01.09.2019.",
  naslov: "KLASIČNA GRČKA I ZAKYNTHOS",
  podnaslov: "Maturalno putovanje · 9 dana",
  baza: "55 učenika + 4 nastavnika",
  cijena: "___,__ €",
  cijenaNapomena: "po učeniku, na bazi 55 učenika + 4 nastavnika",
  ruta: ["Vinkovci", "Venecija / Ancona", "Patras", "Zakynthos", "Atena", "Delfi", "Ohrid", "Vinkovci"],
  facts: [
    { icon: "FaCalendarAlt", big: "9", small: "dana putovanja" },
    { icon: "FaBed", big: "7", small: "noćenja (1 brod + 6 hotel***)" },
    { icon: "FaUsers", big: "55+4", small: "učenika i nastavnika" },
    { icon: "FaShip", big: "2", small: "plovidbe – Jadran i Zakynthos" },
  ],
  dani: [
    ["Polazak", "Polazak autobusom ispred škole u kasnim večernjim satima."],
    ["1. dan", "Vožnja autobusom kroz Hrvatsku, Sloveniju i Italiju do luke VENECIJA/ANCONA, uz mogućnost razgleda VENECIJE (ovisno o redu plovidbe): Trg i crkva sv. Marka, Duždeva palača, most Rialto, Kanal Grande, zvonik, toranj sa satom. Odlazak do putničke luke i ukrcaj na brod. Smještaj u četverokrevetnim unutarnjim kabinama. Plovidba Jadranom prema Grčkoj uz sve pogodnosti broda: restorani, caffe barovi, bazen, disko. Noćenje."],
    ["2. dan", "Doručak. Plovidba Jadranskim morem, slobodno vrijeme za osobne programe. Uplovljavanje u luku PATRAS i nastavak autobusom do hotela u Patrasu. Smještaj u hotel. Večera. Večernji izlazak u dogovoru s grupom. Noćenje."],
    ["3. dan", "Doručak. Vožnja Peloponezom do luke Kyllini i ukrcaj na trajekt. Dvosatna vožnja do ZAKYNTHOSA, rajskog otoka koji će vas odmah osvojiti. Vožnja do mjesta LAGANAS – najvećeg i najživahnijeg ljetovališta na otoku s dugom pješčanom plažom. Smještaj u hotel, slobodno vrijeme do večere. Večernja zabava, noćenje."],
    ["4. dan", "Doručak. Panoramska vožnja otokom do glavnog grada Zakynthosa: razgled PLATEIE, stare gradske jezgre, tržnice i katedrale sv. Dionizija – zaštitnika otoka. Slobodno vrijeme, povratak u Laganas, večera u hotelu. Navečer odlazak u jedan od mnogobrojnih noćnih klubova Laganasa! Noćenje."],
    ["5. dan", "Nakon doručka izlet po otoku. Fakultativno predlažemo odlazak do luke VROMI uz zaustavljanje u VOLIMESU, ukrcaj na brodice i plovidbu do plaže NAVAGIO – slobodno vrijeme za kupanje. Povratak u Laganas, večera u hotelu. Zabava. Noćenje."],
    ["6. dan", "Nakon doručka napuštanje Zakynthosa i vožnja brodom do luke KYLLINI. Nastavak prema ATENI uz razgled Peloponeza: KORINTSKI KANAL, EPIDAUR – svetište Asklepija, muzej i glasoviti TEATAR, najakustičnija građevina te vrste na svijetu. Dolazak u GLYFADU, predgrađe Atene bogato plažama, barovima i klubovima. Smještaj u hotel. Večera. Navečer izlet Atenskom rivijerom (Apolonova obala) do rta SOUNION i razgled POSEJDONOVA HRAMA. Noćenje."],
    ["7. dan", "Doručak. Razgled ATENE s lokalnim vodičem: AKROPOLA, Zeusov hram, Hadrijanov slavoluk, Olimpijski stadion, trgovi Sintagma i Omonia, Parlament, posjet NACIONALNOM ARHEOLOŠKOM MUZEJU. Slobodno poslijepodne. Večera. Navečer odlazak s pratiteljem u četvrt PLAKA – moguća fakultativna grčka večera s folklornim programom. Noćenje."],
    ["8. dan", "Doručak, odjava iz hotela. Odlazak do jednog od najpoznatijih arheoloških lokaliteta Grčke, proročišta DELFI: riznica Atenjana, Apolonov hram, kazalište, stadion. Nastavak prema Makedoniji uz posjet KALAMBACI, vožnja preko Bitole do OHRIDA. Dolazak u večernjim satima, smještaj u hotel, večera, odlazak u disco. Noćenje."],
    ["9. dan", "Doručak, odjava iz hotela. Razgled OHRIDA s lokalnim vodičem. Odlazak do manastira SV. NAUM, slobodno vrijeme. Nastavak kroz nacionalni park Mavrovo, preko Skoplja i Kumanova do Bajakova uz usputno zaustavljanje za odmor. Dolazak u Vinkovce u kasnim večernjim satima."],
  ],
  ukljucuje: [
    "prijevoz udobnim turističkim autobusom prema programu",
    "stručnog pratitelja na cijelom putovanju",
    "prijevoz brodom Venecija/Ancona – Patras, smještaj u 4-krevetnim kabinama (tuš, WC)",
    "hotel*** Ohrid – 1 polupansion",
    "hotel*** Laganas – 3 polupansiona",
    "hotel*** Glyfada – 2 polupansiona",
    "sve ulaznice za muzeje i arheološke lokalitete u Grčkoj (Delfi, Akropola, Arheološki muzej Atena)",
    "ulaznicu u Sv. Naum i ulaznicu za disco u Ohridu",
    "lokalne vodiče u Ohridu i Ateni",
    "4 mjesta za vođe puta škole s pripadajućim troškovima",
    "2 gratis mjesta za učenike",
    "međunarodno zdravstveno osiguranje + osiguranje od nezgode",
    "troškove organizacije i rezervacije, osiguranje putnika i prtljage, osiguranje odgovornosti i jamčevinu (Croatia osiguranje d.d.)",
  ],
  fakultativno: [
    "izlet brodom na plažu Navagio",
    "doručak na brodu",
    "ručak / večera na brodu",
  ],
  placanje: [
    ["Gotovinom, općom uplatnicom, internet bankarstvom ili uplatom na žiro račun organizatora", "u više mjesečnih obroka do polaska"],
    ["Karticama obročno do 6 rata", "ZABA Maestro / Mastercard, American, PBZ Maestro / Visa"],
  ],
  pogodnosti: [
    ["FaGift", "2 gratis mjesta za učenike", "prema odabiru škole"],
    ["FaUserShield", "4 mjesta za vođe puta", "s pripadajućim troškovima"],
    ["FaUndo", "Povrat uplaćenog novca", "u slučaju opravdanog razloga: bolest uz liječničku dokumentaciju, elementarna nepogoda, nesretan slučaj u obitelji"],
  ],
  napomene: [
    "Program i termin realizacije ovise o redu plovidbe brodara.",
    "Izračun je rađen na osnovi 55 učenika s mogućnošću odstupanja za tri učenika.",
    "PA Polet zadržava pravo izmjene redoslijeda obilazaka (ovisno o vremenskim uvjetima i radnom vremenu destinacija) i cijene u slučaju izmjene broja putnika.",
    "Hrvatskim državljanima je za ovo putovanje potrebna važeća osobna iskaznica ili putovnica.",
    "Važeći su Opći uvjeti i upute za učenička putovanja – www.polet.hr",
  ],
  kontakt: { ime: "Marija Bijelić", tel: "032 308 938", mail: "agencija@polet.hr", web: "www.polet.hr", adresa: "Trg kralja Tomislava 1, Vinkovci" },
};

// ---------- STIL ----------
const C = { red: "C8102E", dark: "1C1C1E", ink: "2B2B2E", mute: "6E6E73", light: "F4F4F6", line: "E3E3E7", white: "FFFFFF", redSoft: "FBE9EC" };
const F = "Calibri";
const W = 13.333, H = 7.5, M = 0.6;

async function icon(name, color, px = 256) {
  const el = React.createElement(fa[name], { color: "#" + color, size: px });
  const svg = ReactDOMServer.renderToStaticMarkup(el);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.lang = "hr-HR";

  const footer = (s, dark = false) => {
    s.addImage({ path: path.join(IN, "logo/polet-vinkovci.png"), x: M, y: H - 0.62, w: 1.36, h: 0.3 });
    s.addText(D.kontakt.web + "  ·  " + D.kontakt.tel, { x: W - M - 4, y: H - 0.65, w: 4, h: 0.35, align: "right", fontFace: F, fontSize: 10, color: dark ? "BBBBBB" : C.mute, isTextBox: true, margin: 0 });
  };
  const title = (s, t, sub) => {
    s.addText(t, { x: M, y: 0.45, w: W - 2 * M, h: 0.7, fontFace: F, fontSize: 30, bold: true, color: C.dark, isTextBox: true, margin: 0 });
    if (sub) s.addText(sub, { x: M, y: 1.1, w: W - 2 * M, h: 0.35, fontFace: F, fontSize: 13, color: C.mute, isTextBox: true, margin: 0 });
  };
  const pill = (s, x, y, n) => {
    s.addShape(pres.ShapeType.ellipse, { x, y, w: 0.42, h: 0.42, fill: { color: C.red }, line: { color: C.red } });
    s.addText(n, { x, y, w: 0.42, h: 0.42, align: "center", valign: "middle", fontFace: F, fontSize: 12, bold: true, color: C.white, isTextBox: true, margin: 0 });
  };

  // ===== 1. NASLOVNA =====
  {
    const s = pres.addSlide();
    s.background = { color: C.dark };
    s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 0.28, h: H, fill: { color: C.red }, line: { color: C.red } });
    s.addText("PONUDA / PROGRAM br. " + D.ponudaBr, { x: 1, y: 1.1, w: 8, h: 0.4, fontFace: F, fontSize: 13, color: "BBBBBB", charSpacing: 2, isTextBox: true, margin: 0 });
    s.addText(D.naslov, { x: 1, y: 1.6, w: 11.5, h: 1.6, fontFace: F, fontSize: 48, bold: true, color: C.white, isTextBox: true, margin: 0, valign: "top" });
    s.addText(D.podnaslov, { x: 1, y: 3.15, w: 10, h: 0.5, fontFace: F, fontSize: 22, color: "E8E8EA", isTextBox: true, margin: 0 });
    s.addShape(pres.ShapeType.rect, { x: 1, y: 4.25, w: 5.6, h: 1.55, fill: { color: "2A2A2E" }, line: { color: "2A2A2E" } });
    s.addText([
      { text: "NARUČITELJ", options: { fontSize: 10, color: "9A9AA0", charSpacing: 2, breakLine: true } },
      { text: D.skola, options: { fontSize: 20, bold: true, color: C.white, breakLine: true } },
      { text: " ", options: { fontSize: 6, breakLine: true } },
      { text: "TERMIN", options: { fontSize: 10, color: "9A9AA0", charSpacing: 2, breakLine: true } },
      { text: D.termin, options: { fontSize: 18, color: C.white } },
    ], { x: 1.3, y: 4.35, w: 5.2, h: 1.4, fontFace: F, valign: "middle", isTextBox: true, margin: 0 });
    s.addImage({ path: path.join(IN, "logo/polet-vinkovci.png"), x: 1, y: H - 1.05, w: 2.5, h: 0.55 });
    s.addText("PUTNIČKA AGENCIJA  ·  " + D.kontakt.web, { x: 3.7, y: H - 0.95, w: 6, h: 0.35, fontFace: F, fontSize: 11, color: "BBBBBB", isTextBox: true, margin: 0, valign: "middle" });
  }

  // ===== 2. PUTOVANJE UKRATKO =====
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    title(s, "Putovanje ukratko", D.naslov + "  ·  " + D.termin);
    const tw = (W - 2 * M - 3 * 0.3) / 4;
    for (let i = 0; i < D.facts.length; i++) {
      const f = D.facts[i], x = M + i * (tw + 0.3), y = 1.75;
      s.addShape(pres.ShapeType.roundRect, { x, y, w: tw, h: 1.9, fill: { color: C.light }, line: { color: C.light }, rectRadius: 0.12 });
      s.addImage({ data: await icon(f.icon, C.red), x: x + 0.3, y: y + 0.3, w: 0.45, h: 0.45 });
      s.addText(f.big, { x: x + 0.3, y: y + 0.8, w: tw - 0.6, h: 0.6, fontFace: F, fontSize: 34, bold: true, color: C.dark, isTextBox: true, margin: 0 });
      s.addText(f.small, { x: x + 0.3, y: y + 1.4, w: tw - 0.6, h: 0.35, fontFace: F, fontSize: 12, color: C.mute, isTextBox: true, margin: 0 });
    }
    // ruta
    s.addText("RUTA PUTOVANJA", { x: M, y: 4.1, w: 6, h: 0.35, fontFace: F, fontSize: 11, bold: true, color: C.red, charSpacing: 2, isTextBox: true, margin: 0 });
    const n = D.ruta.length, rx0 = M + 0.2, rx1 = W - M - 0.2, ry = 5.0;
    s.addShape(pres.ShapeType.line, { x: rx0, y: ry, w: rx1 - rx0, h: 0, line: { color: C.line, width: 2 } });
    for (let i = 0; i < n; i++) {
      const x = rx0 + (i * (rx1 - rx0)) / (n - 1);
      s.addShape(pres.ShapeType.ellipse, { x: x - 0.09, y: ry - 0.09, w: 0.18, h: 0.18, fill: { color: i === 0 || i === n - 1 ? C.dark : C.red }, line: { color: C.white, width: 1.5 } });
      s.addText(D.ruta[i], { x: x - 0.9, y: ry + 0.2, w: 1.8, h: 0.5, align: "center", fontFace: F, fontSize: 12, bold: true, color: C.ink, isTextBox: true, margin: 0 });
    }
    s.addText("Prijevoz: turistički autobus + brod Venecija/Ancona – Patras + trajekt Kyllini – Zakynthos", { x: M, y: 5.95, w: W - 2 * M, h: 0.35, fontFace: F, fontSize: 12, color: C.mute, isTextBox: true, margin: 0 });
    footer(s);
  }

  // ===== 3. O AGENCIJI =====
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    title(s, "Zašto Polet Vinkovci?", "Putnička agencija s dugogodišnjim iskustvom u organizaciji učeničkih putovanja");
    const items = [
      ["FaBus", "Vlastiti vozni park", "Moderni turistički autobusi s klimom i besplatnim internetom"],
      ["FaIdBadge", "Profesionalni vozači", "Iskusni vozači i stručni pratitelji na cijelom putovanju"],
      ["FaShieldAlt", "Sigurnost putnika", "Osiguranje putnika i prtljage, osiguranje odgovornosti i jamčevina"],
      ["FaCertificate", "Certificirani specijalist", "UHPA certifikat za školska putovanja, Travelife i ISO 9001"],
    ];
    for (let i = 0; i < items.length; i++) {
      const [ic, h, p] = items[i];
      const col = i % 2, row = Math.floor(i / 2);
      const x = M + col * 6.1, y = 1.8 + row * 1.6;
      s.addShape(pres.ShapeType.ellipse, { x, y, w: 0.75, h: 0.75, fill: { color: C.redSoft }, line: { color: C.redSoft } });
      s.addImage({ data: await icon(ic, C.red), x: x + 0.19, y: y + 0.19, w: 0.37, h: 0.37 });
      s.addText(h, { x: x + 1, y: y - 0.02, w: 4.8, h: 0.4, fontFace: F, fontSize: 17, bold: true, color: C.dark, isTextBox: true, margin: 0 });
      s.addText(p, { x: x + 1, y: y + 0.38, w: 4.8, h: 0.6, fontFace: F, fontSize: 12.5, color: C.mute, isTextBox: true, margin: 0, valign: "top" });
    }
    s.addShape(pres.ShapeType.rect, { x: M, y: 5.15, w: W - 2 * M, h: 1.3, fill: { color: C.light }, line: { color: C.light } });
    s.addImage({ path: path.join(IN, "cert/uhpa.png"), x: 1.4, y: 5.4, w: 2.6, h: 0.8 });
    s.addImage({ path: path.join(IN, "cert/travelife.png"), x: 5.4, y: 5.45, w: 3.1, h: 0.7 });
    s.addImage({ path: path.join(IN, "cert/iso9001.png"), x: 9.6, y: 5.3, w: 1.8, h: 1.0 });
    footer(s);
  }

  // ===== 4-8. PROGRAM PO DANIMA (2 po slajdu) =====
  {
    const days = D.dani;
    const perSlide = 2;
    const total = Math.ceil(days.length / perSlide);
    for (let p = 0; p < total; p++) {
      const s = pres.addSlide();
      s.background = { color: C.white };
      title(s, "Program putovanja", `${p + 1} / ${total}  ·  ${D.naslov}`);
      const chunk = days.slice(p * perSlide, p * perSlide + perSlide);
      const cw = (W - 2 * M - 0.4) / 2;
      chunk.forEach(([d, txt], i) => {
        const x = M + i * (cw + 0.4), y = 1.75, h = 4.9;
        s.addShape(pres.ShapeType.roundRect, { x, y, w: cw, h, fill: { color: C.light }, line: { color: C.light }, rectRadius: 0.12 });
        s.addShape(pres.ShapeType.roundRect, { x: x + 0.3, y: y + 0.3, w: 1.15, h: 0.4, fill: { color: C.red }, line: { color: C.red }, rectRadius: 0.2 });
        s.addText(d.toUpperCase(), { x: x + 0.3, y: y + 0.3, w: 1.15, h: 0.4, align: "center", valign: "middle", fontFace: F, fontSize: 11, bold: true, color: C.white, charSpacing: 1, isTextBox: true, margin: 0 });
        const ph = 1.6;
        s.addText(txt, { x: x + 0.3, y: y + 0.9, w: cw - 0.6, h: h - 1.2 - ph - 0.2, fontFace: F, fontSize: 13, color: C.ink, valign: "top", isTextBox: true, margin: 0, lineSpacingMultiple: 1.15 });
        // mjesto za fotografiju
        s.addShape(pres.ShapeType.roundRect, { x: x + 0.3, y: y + h - ph - 0.3, w: cw - 0.6, h: ph, fill: { color: "E9E9EC" }, line: { color: "D0D0D5", width: 1, dashType: "dash" }, rectRadius: 0.1 });
        s.addText("FOTOGRAFIJA", { x: x + 0.3, y: y + h - ph - 0.3, w: cw - 0.6, h: ph, align: "center", valign: "middle", fontFace: F, fontSize: 11, color: "A0A0A8", charSpacing: 3, isTextBox: true, margin: 0 });
      });
      footer(s);
    }
  }

  // ===== 9. CIJENA =====
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    title(s, "Cijena putovanja");
    // lijevo: cijena
    s.addShape(pres.ShapeType.roundRect, { x: M, y: 1.75, w: 4.2, h: 4.9, fill: { color: C.dark }, line: { color: C.dark }, rectRadius: 0.12 });
    s.addText("CIJENA PO UČENIKU", { x: M + 0.35, y: 2.1, w: 3.5, h: 0.35, fontFace: F, fontSize: 11, color: "9A9AA0", charSpacing: 2, isTextBox: true, margin: 0 });
    s.addText(D.cijena, { x: M + 0.35, y: 2.5, w: 3.6, h: 1.1, fontFace: F, fontSize: 44, bold: true, color: C.white, isTextBox: true, margin: 0 });
    s.addText(D.cijenaNapomena, { x: M + 0.35, y: 3.6, w: 3.5, h: 0.6, fontFace: F, fontSize: 12, color: "CFCFD3", isTextBox: true, margin: 0 });
    s.addText("DOPLATE PREMA ŽELJI GRUPE", { x: M + 0.35, y: 4.5, w: 3.5, h: 0.35, fontFace: F, fontSize: 11, color: "9A9AA0", charSpacing: 2, isTextBox: true, margin: 0 });
    s.addText(D.fakultativno.map((t, i) => ({ text: t, options: { bullet: { indent: 12 }, breakLine: i < D.fakultativno.length - 1 } })), { x: M + 0.35, y: 4.9, w: 3.5, h: 1.5, fontFace: F, fontSize: 12.5, color: C.white, valign: "top", isTextBox: true, margin: 0, paraSpaceAfter: 4 });
    // desno: uključuje
    const rx = M + 4.6, rw = W - M - rx;
    s.addText("CIJENA UKLJUČUJE", { x: rx, y: 1.75, w: rw, h: 0.35, fontFace: F, fontSize: 11, bold: true, color: C.red, charSpacing: 2, isTextBox: true, margin: 0 });
    const half = Math.ceil(D.ukljucuje.length / 2);
    const cols = [D.ukljucuje.slice(0, half), D.ukljucuje.slice(half)];
    const chk = await icon("FaCheck", C.red);
    cols.forEach((col, ci) => {
      const cx = rx + ci * (rw / 2 + 0.1), cwid = rw / 2 - 0.2;
      let y = 2.2;
      col.forEach((t) => {
        const lines = Math.ceil(t.length / 44);
        const hh = 0.24 * lines + 0.08;
        s.addImage({ data: chk, x: cx, y: y + 0.05, w: 0.16, h: 0.16 });
        s.addText(t, { x: cx + 0.28, y, w: cwid - 0.28, h: hh, fontFace: F, fontSize: 11.5, color: C.ink, valign: "top", isTextBox: true, margin: 0 });
        y += hh + 0.1;
      });
    });
    footer(s);
  }

  // ===== 10. PLAĆANJE I POGODNOSTI =====
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    title(s, "Način plaćanja i pogodnosti");
    // lijevo: plaćanje
    s.addText("MOGUĆNOSTI PLAĆANJA", { x: M, y: 1.75, w: 5.8, h: 0.35, fontFace: F, fontSize: 11, bold: true, color: C.red, charSpacing: 2, isTextBox: true, margin: 0 });
    const payIcons = ["FaMoneyBillWave", "FaCreditCard"];
    for (let i = 0; i < D.placanje.length; i++) {
      const [h, p] = D.placanje[i], y = 2.25 + i * 1.7;
      s.addShape(pres.ShapeType.roundRect, { x: M, y, w: 5.8, h: 1.45, fill: { color: C.light }, line: { color: C.light }, rectRadius: 0.12 });
      s.addImage({ data: await icon(payIcons[i], C.red), x: M + 0.3, y: y + 0.3, w: 0.45, h: 0.45 });
      s.addText(h, { x: M + 1, y: y + 0.2, w: 4.6, h: 0.6, fontFace: F, fontSize: 14, bold: true, color: C.dark, valign: "top", isTextBox: true, margin: 0 });
      s.addText(p, { x: M + 1, y: y + 0.82, w: 4.6, h: 0.55, fontFace: F, fontSize: 12, color: C.mute, valign: "top", isTextBox: true, margin: 0 });
    }
    // desno: pogodnosti
    const rx = M + 6.4, rw = W - M - rx;
    s.addText("AGENCIJA ODOBRAVA", { x: rx, y: 1.75, w: rw, h: 0.35, fontFace: F, fontSize: 11, bold: true, color: C.red, charSpacing: 2, isTextBox: true, margin: 0 });
    for (let i = 0; i < D.pogodnosti.length; i++) {
      const [ic, h, p] = D.pogodnosti[i], y = 2.25 + i * 1.45;
      s.addShape(pres.ShapeType.ellipse, { x: rx, y: y + 0.05, w: 0.7, h: 0.7, fill: { color: C.redSoft }, line: { color: C.redSoft } });
      s.addImage({ data: await icon(ic, C.red), x: rx + 0.18, y: y + 0.23, w: 0.34, h: 0.34 });
      s.addText(h, { x: rx + 0.95, y, w: rw - 0.95, h: 0.4, fontFace: F, fontSize: 15, bold: true, color: C.dark, isTextBox: true, margin: 0 });
      s.addText(p, { x: rx + 0.95, y: y + 0.4, w: rw - 0.95, h: 0.85, fontFace: F, fontSize: 12, color: C.mute, valign: "top", isTextBox: true, margin: 0 });
    }
    footer(s);
  }

  // ===== 11. NAPOMENE =====
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    title(s, "Napomene");
    D.napomene.forEach((t, i) => {
      const y = 1.8 + i * 0.85;
      pill(s, M, y, String(i + 1));
      s.addText(t, { x: M + 0.65, y: y - 0.02, w: W - 2 * M - 0.65, h: 0.7, fontFace: F, fontSize: 14, color: C.ink, valign: "top", isTextBox: true, margin: 0 });
    });
    footer(s);
  }

  // ===== 12. HVALA =====
  {
    const s = pres.addSlide();
    s.background = { color: C.dark };
    s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 0.28, h: H, fill: { color: C.red }, line: { color: C.red } });
    s.addText("Hvala na pažnji!", { x: 1, y: 1.6, w: 11, h: 1.1, fontFace: F, fontSize: 44, bold: true, color: C.white, isTextBox: true, margin: 0 });
    s.addText("Veselimo se zajedničkom putovanju.", { x: 1, y: 2.65, w: 11, h: 0.5, fontFace: F, fontSize: 20, color: "E8E8EA", isTextBox: true, margin: 0 });
    const k = D.kontakt;
    const rows = [["FaUser", k.ime], ["FaPhone", k.tel], ["FaEnvelope", k.mail], ["FaGlobe", k.web], ["FaMapMarkerAlt", k.adresa]];
    for (let i = 0; i < rows.length; i++) {
      const [ic, t] = rows[i], y = 3.7 + i * 0.5;
      s.addImage({ data: await icon(ic, C.red), x: 1, y: y + 0.08, w: 0.26, h: 0.26 });
      s.addText(t, { x: 1.45, y, w: 8, h: 0.42, fontFace: F, fontSize: 15, color: C.white, valign: "middle", isTextBox: true, margin: 0 });
    }
    s.addImage({ path: path.join(IN, "logo/polet-vinkovci.png"), x: W - 1 - 3, y: H - 1.15, w: 3, h: 0.66 });
  }

  const out = path.join(__dirname, "Polet_template_Grcka.pptx");
  await pres.writeFile({ fileName: out });
  console.log("wrote", out);
})();
