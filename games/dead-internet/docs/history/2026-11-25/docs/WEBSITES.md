> HISTORIKK: kopi fra PR #89, commit `50d5643`. Ikke gjeldende status eller arbeidsordre.
> Se [gjeldende DEVPLAN](../../../../DEVPLAN.md). Gamle godkjenningspåstander er historiske referater, ikke ny godkjenning.

# Dead Internet: Et mer autentisk internett i Browser

> **Status: Godkjent designretning (Anders, 24. november 2026).** Avklaringene er samlet i §0 og innarbeidet i dokumentet. Der et avsnitt nedenfor fortsatt sier «forslag», gjelder beslutningene i §0. **W0–W7 og nettsidegrafikk er merget** (25. november 2026, PR #73–#81, `main` `9190200`). Casebook steg 3 er merget (PR #86 `5d64cbc`); W8 (Archive i Browser) er merget som PR #87 `50f65fb` med Anders' sju avgjørelser 25.11.2026, og **W0–W8 er dermed ferdige**. Inventar: [WEBSITE-INVENTORY.md](../../../WEBSITE-INVENTORY.md). Katalog: [../graphics/GRAPHICS.md](../../../../graphics/GRAPHICS.md).

## 0. Beslutninger (Anders, 24. november 2026)

**Godkjent arkitektur:** Artefakten er fortsatt grunnenheten. Nettsteder får egen konfigurasjon, og sideversjonene får innholdsblokker. Det blir elleve gjenbrukbare maler med egne varianter og temaer, og design og navigasjon versjoneres. Oversikter genereres automatisk fra synlig innhold. Eksisterende ID-er, URL-er, tekster og bevis beholdes så langt som mulig. Ingen nye frontend-rammeverk, mobil først, og offentlige visningsdata hvitelistes. Browser eier nettleserfunksjonaliteten, og nettstedene eier sin egen presentasjon.

**Avklaringer:**

| Tema | Beslutning |
|---|---|
| SpillCheck | Forblir en tjeneste for å sjekke kjente datalekkasjer. Funksjonen i kanon endres ikke. En anonym lekkasjeportal kan komme senere ved behov. |
| Eastfield Notes | Etablert 2019. Mara brukte et gammelt bloggtema fra ca. 2012. Brightline endret designet samtidig med innholdet i oktober 2025, slik at spilleren kan sammenligne gammel og ny versjon. |
| Foretaksregister | `corp-registries.example` erstattes med et troverdig, fiktivt domene. Søk, referanser og lagrede spill skal fortsatt virke, og endringen får egen test. **W6:** omdøpt til `openfilings.org`; gammelt vertsnavn ligger i `domains` og treffer fortsatt. |
| Biblioteket | En cachet personalside fra 2024 lister Mara og Priya. Ingen nye personopplysninger om Mara. Siden er en alternativ vei inn i saken, ikke et obligatorisk spor. |
| Faceless Stock | Calvins stockfoto kan dukke opp på flere uavhengige nettsteder, og bildesøk gir flere treff. Ikke alle treff skal ha med Brightline å gjøre. Det skal fortsatt finnes en praktisk og logisk vei til den opprinnelige stockfotokilden. |
| Maras møllebilde | Brukes ikke på Calderpedia nå. Ingen flere endringer i bildesøket enn nødvendig i denne fasen. |
| Brightlines kundecaser | Forblir anonymiserte. Verken GlowNest eller andre navngitte virksomheter blir Brightline-kunder ennå. |
| Delte maler | Uavhengige nettsteder kan bruke samme kommersielle tema. Likhet kan være et spor, men også ren tilfeldighet. Malvalg skal aldri være en sikker indikator på skjult opphav. |
| Bakgrunnsinternett | 140–170 sider er et mål for innholdsproduksjonen, ikke et krav til første leveranse. Innholdet bygges i etapper, med disse nettstedene først: Northgate, Brightline, City of Port Calder, Eastfield Notes, Kestrel, Calderpedia, Threadline, Faceless Stock, SpillCheck og Docshare. Deretter kommer bibliotek, kollektivtransport, strøm, bank, restauranter, gamle hjemmesider osv. Ingen hundrevis av generiske, nesten like fyllsider. Alle nye fakta registreres og sjekkes mot kanon, og det skilles tydelig mellom hva som er sant i kanon og hva en side eller karakter bare påstår. |
| Browser | Godkjent: tilbake og frem, vanlige bokmerker adskilt fra bevis, 404-sider per nettsted, interne lenker og navigasjon, innlogging i nettstedets eget design, cache og Archive, historiske designversjoner, tekststørrelse, samt tilstandene parkert, vedlikehold og nedlagt. Vurderes også: kopiere en URL i én app og åpne den naturlig i Browser (§8). |
| Grafikk | WEB0001–WEB0024 er utgangspunktet. De tolv viktigste bildene lages først, resten ved behov. Produksjonen starter i nettsidefasen. Bakgrunnssider skal ha like gode bilder som sider med spor. Gjenbruk kan endre bildesøket og skal vurderes deretter. |
| Testing | Se §12.4. |
| Fase | Veikart punkt 5 (W0–W8), deretter punkt 6 (bakgrunnsinnhold og grafikk) og punkt 7 (ny spilltest med det utvidede internettet). |

_Opprinnelig forslag til diskusjon, 24. november 2026. Ingenting er implementert. Gjennomgangen er gjort mot `main` i zirkhel/BusAdventures (etter PR #67). Svarer på punkt 1–11 i bestillingen, med de tolv vurderingspunktene i punkt 11 som egne kapitler._

## Kort fortalt

- **I dag er nettstedene enkeltartefakter med én tekstblokk.** 43 sider fordelt på 16 nettsteder. Alle rendres av samme funksjon (`renderArtifact` i `app/render.js`) med en felles header og litt farge per plattform. Ingen nettsted har navigasjon, flere sidetyper eller eget oppsett. De fleste sidene er 150–450 tegn, og nesten alle er relevante for The Quiet Account. Northgate har to sider, Kestrel én.
- **Forslaget beholder artefakten som enhet** (søk, cache, versjoner, oppdagelse og bevis virker som før) og legger til to ting: et **nettsted** (`site`) med versjonert design og navigasjon, og **innholdsblokker** i sideversjonene. Elleve maler (Corporate, Government, Blog, Wiki, Forum, News, Anonymous, Legacy, Personal, Landing, Document) leser konfigurasjonen. Ingen nye rammeverk, ingen byggesteg.
- **Designet versjoneres etter dato.** En cachet side fra 2023 vises automatisk med designet som gjaldt i 2023. Bevis peker allerede på en bestemt versjon, så det vises likt senere.
- **Bakgrunnsinnhold:** ca. 140–170 nye sider i første runde, bygd på fakta som allerede finnes i kanon og i de 108 avisartiklene (bibliotekkutt, Kestrel-brann, rute 14, blackout, Harbor Festival osv.). Jeg har laget en liste over hva hvert nettsted kan inneholde, og hvilke nye fakta som må føres inn i kanon.
- **Fire funn som bør avklares før vi begynner** (§13): SpillCheck er i kanon en sjekketjeneste for datalekkasjer, ikke en lekkasjeportal. Eastfield Notes startet i 2019, ikke tidlig på 2010-tallet. Et bevis åpner i dag den *levende* siden hvis versjonen ikke er cachet, så en endret side kan endre et lagret bevis. Og visningsobjektet som går til UI inneholder kanonfelt (`supports`, `source`, `mentions`) som malene aldri må få se.
- **Rekkefølge:** ni små PR-er (W0–W8). Etter Anders' veikart 24.11 er dette punkt 4. Det kommer etter Casebook steg 0–5, den eksterne spilltesten og justeringene, og ingenting implementeres før forslaget er godkjent. Lekkasjevernet (W0) og regelen om at bevis åpner den lagrede versjonen er allerede tatt i Casebook steg 0 (PR #68) og steg 1.
- **Omfang:** ca. 2 000–2 800 linjer JS/CSS, 25–30 000 ord innhold og 24 nye bilder (12 av dem prioritert). Størst risiko er at mye nytt innhold lekker eller forstyrrer søket i The Quiet Account. Det fanges med tester (§12).

---

## 1. Hvordan nettsidene rendres i dag

| Ledd | Fil | Hva skjer |
|---|---|---|
| Adresse og søk | `app/phone.js` `browse()` | Adressen normaliseres og slås opp i et kart `url → artefakt`. Treffer den ikke, blir adressen et Seeker-søk. Det finnes ikke 404-sider per nettsted. |
| Visning | `core/artifacts.js` `viewArtifact()` | Gir et visningsobjekt for levende eller cachet versjon, eller feil (`gone`, `deleted`, `not_available`) eller innlogging. |
| Rendering | `app/render.js` `renderArtifact()` | Én funksjon for alle. Velger header ut fra plattformens `kind` (`site`, `blog`, `registry`, `forum`, `news`, `social`). Brødteksten er ren tekst som deles i avsnitt. `[Photo …]` i teksten plasserer bilder. Fotlinje med URL og dato. |
| Utseende | `app/style.css` | `.k-<kind>` og `.pf-<plattform>`. Brightline har mørk header, Docshare og bykommunen monospace, bloggen kremfarget bakgrunn. Resten er like. |
| Browser | `app/apps/browser.js` | Adressefelt, tilbake, cache-banner, historikk (Visited/Searches). Knappen med bokmerkeikon lagrer siden *som bevis*. Det finnes ingen frem-knapp og ingen vanlige bokmerker. |
| Lenker | `app/context.js` | URL-er i tekst åpnes via kontekstmenyen. Sider lenker ikke til hverandre på annen måte. |

Nyhetsappene (The Daily Record og Unfiltered) har allerede en mal (`"template": "news"`) og et tema i `platforms.json`. Det er det nærmeste vi har en malarkitektur, og forslaget bygger videre på det mønsteret.

## 2. Oversikt over dagens nettsteder og sidetyper

| Nettsted | Domene | Sider | Sidetyper i dag | Relevant for The Quiet Account |
|---|---|---|---|---|
| Brightline Media | brightlinemedia.co (+ portal.bl-ops.net) | 5 | tjenester, team, stilling, uttalelse, kundeportal (innlogging) | alle 5 |
| Northgate Development | northgatedev.com | 2 | prosjektside, uttalelse | 2 |
| Kestrel Logistics | kestrel-logistics.com | 1 | kundeliste | 1 |
| Port Calder City Portal | portcalder.gov | 6 | rådsmedlem, møtekalender, saksframlegg, foretaksregister, lobbyregister, ulykkesrapport | 5 av 6 |
| Eastfield Notes | eastfieldnotes.blog | 5 | forside (2 versjoner), 4 innlegg | alle 5 |
| Calderpedia | calderpedia.org | 2 | 2 artikler | 1 |
| SpillCheck | spillcheck.io | 1 + oppslag | oppslagsresultat | 1 |
| Faceless Stock | facelessstock.com | 2 | 2 portrettsider | 2 |
| Docshare | docshare.link | 5 | delte dokumenter | 2 (+3 Unfiltered-lekkasjer) |
| Threadline | threadline.net | 8 | tråder | 3 |
| Diverse «Web» | harbordesk.co, saltys-portcalder.com, eastfieldgarden.org, aiwriterpro.app, static.channel, corp-registries.example | 6 | én side hver | 2–3 |
| The Daily Record / Unfiltered | egne apper, også i Browser | 108 | nyhetsmal | mange er bakgrunn |
| Connect | egen app | 36 | profiler, innlegg | (egen app, utenfor dette forslaget) |

**Konklusjon:** Utenom avisene er omtrent 85 % av sidene i Browser relevante for saken. En spiller som har surfet i ti minutter, forstår at alt er spor.

## 3. Hvilke nettsteder har en tydelig identitet i dag

| Nettsted | Identitet i dag | Vurdering |
|---|---|---|
| The Daily Record, Unfiltered | Sterk (egen mal, logo, seksjoner, bylines, kommentarer) | Behold. Gjør malen tilgjengelig som «News» for andre aviser. |
| Connect | Sterk (egen app) | Utenfor dette forslaget. |
| Threadline | Middels (brødsmulesti, svar, OP-merke) | Trenger forumoversikt, underforum, profiler og sidetall. |
| Eastfield Notes | Svak (serif-tittel, kremfarge) | Redesign. |
| Brightline | Svak (mørk header, gul tittel) | Redesign. |
| Port Calder City Portal | Svak, og feil på ett punkt (hele nettstedet i monospace, også rådsmedlemmets side) | Redesign. Monospace bare for registeroppslag. |
| Docshare | Svak (blå tittel, monospace) | Redesign som dokumentvisning. |
| Faceless Stock | Nesten ingen (lilla tittel) | Redesign. |
| Northgate, Kestrel, Calderpedia, SpillCheck, alle «Web»-sider | Ingen | Redesign. |

**Alle unntatt de to avisene og Connect bør redesignes.** Seeker er nettleserens egen søkemotor og har allerede en rimelig identitet.

## 4. Hvilke nettsteder bør redesignes, og hvordan

Tabellen viser mal, epoke og sidestruktur. Kursiv betyr at siden finnes i dag. Bakgrunnsinnholdet står i §7.3.

| Nettsted | Mal og variant | Epoke | Sider (forslag) |
|---|---|---|---|
| **Northgate Development** | Corporate · `glossy` (helbilder, tynn serif-overskrift, mye luft, navy og stein) | Moderne, redesign 2024 | Home, Projects (oversikt + 4 prosjekter, blant dem *Eastfield Waterfront*), About, Leadership, Sustainability, Investors (malen Document), Newsroom (*Community partners*-uttalelsen + 6 pressemeldinger), Contact, Privacy |
| **Brightline Media** | Corporate · `agency` (enorme overskrifter, gult på navy, store tall, «scroll-fortelling») | Moderne, 2023 | Home, Services (*finnes*), Work (6 kundecaser), Team (*finnes*), Careers (*Community Writer* + 3 andre), Insights (blogg, 5 innlegg), Contact, *Statement*, Client login (*portal.bl-ops.net*) |
| **City of Port Calder** | Government · `municipal` (tett toppmeny, blå stripe, segl, brødsmulesti, «Mest besøkt»-lenker) | Redesign 2017, lappet siden | Home, Residents (avfall, parkering, bibliotek, CalderFix), Council (medlemmer, *Ana Ruiz*, *kalender*, agendaer, *ordinanser*), Notices, Records (*foretaksregister*, *lobbyregister*, *ulykkesrapport*), Contact. Registeroppslag beholder monospace. |
| **Eastfield Notes** | Blog · `classic` (gratis bloggtema fra ca. 2012: smal kolonne, sidepanel med arkiv per år og måned, kategorier, blogroll, kommentarer) | Startet 2019, Mara byttet aldri tema | Forside, innlegg, arkiv per måned, kategori, About, kommentarfelt. Se §13.2 om designendringen i oktober 2025. |
| **Calderpedia** | Wiki (innholdsfortegnelse, faktaboks, referanser med nummer, interne lenker, «View history», «Talk») | Wiki-motor, uendret siden 2014 | Ca. 25 artikler, historikk for 5 av dem, 3 diskusjonssider, Random article, Main page |
| **Kestrel Logistics** | Corporate · `industrial` (hardt rutenett, kondenserte versaler, navy og gult, ingen runde hjørner) | Redesign 2019, cachet 2014-versjon | Home, Services, Fleet, Coverage (kart), Careers (stillinger), About (historie siden 1998), News, *Who we deliver for*, Contact, Track a parcel (innlogging) |
| **SpillCheck** | Anonymous · `terminal` (svart, monospace, minimalt) | Moderne | Søk, Breaches (liste over kjente lekkasjer), How we verify, FAQ, Privacy, oppslagsresultat (*finnes*) |
| **Faceless Stock** | Landing · `saas` (lys, lilla aksent, rutenett) | Moderne | Home, Pricing, License, How it works, portrettsider (*finnes*). Galleriet krever innlogging (se §10). |
| **Docshare** | Document (filvisning: filnavn, «shared via link», visninger, «view only», utløpte lenker) | Moderne | Forside (markedsføring), dokumentsider, «This link has expired» |
| **Threadline** | Forum (forumoversikt, underforum, trådliste, profiler, sidetall) | Forumprogramvare fra 2010-tallet | Forsiden, r/port-calder, r/tech + 3 til, profiler, 10–15 nye tråder |
| **HarborDesk** | Landing · `smallbiz` | 2021 | Forside, Pricing, Locations (18 Harbor Street, Dock Road) |
| **Salty's Fish Bar** | Legacy · `2008` (tabelloppsett, rød/hvit, «Best viewed in…») | Laget 2008, ny banner mars 2026 | Forside, Menu, Hours, Our story |
| **Eastfield Community Garden** | Personal · `club` | 2016 | Forside, Plots and waitlist, Work days |
| **AIWriterPro** | Landing · `saas` | 2025 | Én side + Pricing |
| **static.channel** | Ingen mal (rå tekst) | | Uendret. Det skal se ut som ingenting. |
| **Open Filings** (`openfilings.org`, alias `corp-registries.example`) | Government · `registry` | | Omdøpt i W6 (§13.4). Offentlig hjem + A63. Meridian er ikke i nav. |

### Nye bakgrunnsnettsteder (forslag, første runde)

Disse har ingen rolle i The Quiet Account. De gjør internettet større og viser forskjellige epoker.

| Nettsted | Mal | Epoke | Hvorfor |
|---|---|---|---|
| Port Calder Public Library (pclibrary.org) | Government · `library` | 2015 | Bibliotekkuttet (aug. 2025), e-lesere, skattehjelp. Mara og Priya jobbet der (se §13.5). |
| Calder Transit (caldertransit.gov) | Government · `transit` | 2012, appen er nyere | Rute 14, spøkelsesbusser, ruteendringer |
| Calder Power (calderpower.com) | Corporate · `utility` | 2015 | Strømbrudd 18. feb og 14. mars, smartmålere |
| Calder Credit Union (caldercu.com) | Corporate · `classic-2015` | Redesign 2015 | «Since 1952», ny filial på 4th Street |
| Harbor Dental (harbordental.com) | Landing · samme kommersielle tema som Brightline | 2024 | Viser at samme mal ikke betyr samme eier (§9.3) |
| «Walt's Harbor Festival Page» (på en gratis vertstjeneste) | Personal · `geocities` | Sist oppdatert 2009 | Walter Brennan (nekrolog 3. nov 2025) var frivillig siden 1979. Besøksteller, gjestebok, ødelagte bilder. |
| portcalderjazz.com | Landing · `parked` | Domenet byttet eier 2022 | Var nettstedet til jazzkveldene på the Anchor. Nå parkert («This domain may be for sale»). Cachet 2019-versjon. |
| Harbor Public Affairs (harborpa.com) | Corporate · `consultancy` | 2020 | Står i lobbyregisteret. Én enkel side. |

## 5. Gjenbrukbare nettsidemaler

### 5.1 Prinsipp

En **mal** er en JS-modul som tegner sidetyper av blokker. En **variant** er et sett CSS-regler under malen. Et **tema** er CSS-variabler (farger, skrift, radius, tetthet) satt på sidens rotelement. To nettsteder med samme mal og variant kan derfor se forskjellige ut, og to nettsteder med ulike maler kan dele blokker.

| Mal | Bruk | Varianter (start) | Sidetyper |
|---|---|---|---|
| Corporate | Bedrifter, organisasjoner | `glossy`, `agency`, `industrial`, `utility`, `classic-2015`, `consultancy` | home, about, team, services, projects, project, news, article, careers, job, contact, legal |
| Government | Kommune, etater, bibliotek, registre | `municipal`, `library`, `transit`, `registry` | home, service, department, person, calendar, document-list, record, notice |
| Blog | Blogger | `classic`, `minimal`, `magazine` | front, post, archive, category, about |
| Wiki | Leksikon | `standard` | article, history, talk, main, random |
| Forum | Diskusjonsfora | `classic`, `modern` | index, board, thread, profile |
| News | Nettaviser (finnes) | `record`, `unfiltered` | front, section, article, author |
| Anonymous | Lekkasje- og sjekketjenester | `terminal`, `onion` | home, list, item, info |
| Legacy | Gamle, delvis forlatte sider | `2002`, `2008` | home, page |
| Personal | Personlige hjemmesider, klubber | `geocities`, `club` | home, page, guestbook |
| Landing | Kampanjer, produkter, parkerte domener | `saas`, `smallbiz`, `parked` | home, pricing, page |
| Document | Dokumentportaler og arkiver | `viewer`, `archive` | home, document, list, expired |

### 5.2 Blokker

Felles for alle maler, med utseende fra malen og temaet:

`hero` · `text` · `cards` (prosjekter, tjenester, kundecaser) · `people` (team, råd) · `stats` · `list` · `table` · `docs` (dokumentliste) · `infobox` · `toc` · `refs` · `notice` (banner, vedlikehold, stengt) · `jobs` · `calendar` · `map` (statisk SVG) · `gallery` · `form` (kontaktskjema som ikke sender noe) · `archive` (blogg) · `timeline` (bedriftshistorie) · `comments` (finnes i dag) · `quirk` (besøksteller, «under construction», cookie-banner, webring).

All tekst i blokkene går gjennom `phone.ctx.text()` som i dag. Navn, adresser, datoer og tall får kontekstmeny, men ser ut som vanlig tekst. Ingen blokk har en «viktig»-stil.

### 5.3 Forskjellige maler per sidetype

Et nettsted har én standardmal, men kan bytte per sidetype:

```json
"layouts": { "investors": "document/list", "newsroom": "corporate/news" }
```

Northgate kan dermed ha en glanset forside og en tørr investorside som ser ut som en dokumentportal, slik ekte selskaper ofte har.

### 5.4 Mobil

- Browser eier verktøylinjen. Nettstedet eier alt under den.
- Moderne maler bruker hamburgermeny. Government og Legacy viser hele lenkelisten øverst, slik slike sider faktisk gjør.
- Legacy- og Personal-sider får med vilje liten tekst, smale kolonner og tettstilte lenker. De forblir lesbare fordi **Browser får en tekststørrelse-knapp (A−/A+)**, som en ekte nettleser. Usynlig utfylling sørger for at små lenker fortsatt har trykkflater på 44 px.
- Ingen horisontal sideskroll. Brede tabeller skrolles inni sin egen boks.

## 6. Datamodell og konfigurasjon

### 6.1 Hovedvalg: siden forblir en artefakt

Hver side er fortsatt en artefakt med `id`, `url`, `versions`, `hidden`, `index`, `access`, `supports` og så videre. Da virker søk, cache, regler, oppdagelsestilstander, kontekstmenyer og bevis uten endring. Det nye er:

1. En ny fil per nettsted: `content/universe/sites/<site>.json` (bakgrunn) eller `content/mysteries/<m>/sites/<site>.json` (hvis nettstedet bare finnes i et mysterium).
2. Tre nye valgfrie felt på artefakten: `site`, `page` (sidetype) og `blocks` i versjonen.

### 6.2 Nettsted

```json
{
  "id": "kestrel",
  "platform": "kestrel_site",
  "domain": "kestrel-logistics.com",
  "org": "kestrel",
  "designs": [
    { "id": "d2014", "from": "2014-03-01", "template": "corporate", "variant": "classic-2015",
      "theme": { "logo": "text:KESTREL LOGISTICS", "palette": { "bg": "#ffffff", "ink": "#222", "accent": "#1d3a6b" }, "font": "verdana" },
      "nav": [ { "label": "Home", "href": "/" }, { "label": "Services", "href": "/services" }, { "label": "Contact", "href": "/contact" } ],
      "footer": { "text": "© 2014 Kestrel Logistics · Webmaster" } },
    { "id": "d2019", "from": "2019-06-01", "template": "corporate", "variant": "industrial",
      "theme": { "logo": "LOGO_KESTREL", "palette": { "bg": "#f4f4f1", "ink": "#14213d", "accent": "#f2a900" }, "font": "condensed", "radius": 0 },
      "header": { "tagline": "We know the way." },
      "nav": [
        { "label": "Services", "href": "/services" }, { "label": "Fleet", "href": "/fleet" },
        { "label": "Coverage", "href": "/coverage" }, { "label": "Careers", "href": "/careers" },
        { "label": "About", "href": "/about" }, { "label": "Track a parcel", "href": "/track", "state": "login" }
      ],
      "footer": { "columns": [ ["Dock Road, Port Calder", "Mon–Sat 6–20"], ["Privacy", "Terms"] ] },
      "quirks": [] }
  ],
  "notFound": { "title": "Wrong turn", "text": "We couldn't find that page. Even our drivers get lost sometimes." },
  "status": [ ]
}
```

- **`designs`** er datert. Hver versjon av en side vises med designet som gjaldt på versjonens dato. En versjon kan låse designet med `"design": "d2014"`.
- **`nav`** er relative lenker. Hver lenke må peke på en side, eller ha en bevisst tilstand: `login`, `maintenance`, `dead` (gir nettstedets 404) eller `external`. Validatoren nekter lenker som ikke er en av disse, så en død lenke er alltid et valg og aldri en glemt side.
- **`status`** beskriver nettstedets liv: `[{ "from": "2022-05-01", "state": "parked", "design": "parked" }]`, `"gone"` (Browser viser «This site can't be reached», med cache), `"maintenance"`.
- **`theme.logo`** er en asset-ID fra katalogen eller `text:` for tekstlogo.

### 6.3 Side

```json
{ "id": "KL-0004", "site": "kestrel", "page": "careers", "type": "page", "url": "kestrel-logistics.com/careers",
  "filler": true,
  "versions": [ { "id": "v1", "date": "2025-08-01", "cached": true,
    "title": "Careers at Kestrel",
    "blocks": [
      { "t": "hero", "title": "Drive with us", "text": "60 new roles at Dock Road this autumn.", "image": "WEB0007" },
      { "t": "jobs", "items": [
        { "title": "Delivery Driver (full-time)", "where": "Dock Road", "text": "Clean licence, early starts, real overtime." },
        { "title": "Warehouse Associate (nights)", "where": "Dock Road" } ] } ] } ] }
```

- Sider med `body` i stedet for `blocks` rendres som én `text`-blokk. **Alt eksisterende innhold virker uendret.** Vi kan flytte gamle sider over til blokker én og én.
- `id`-mønster for nye sider: `W-<site>-<nnnn>` (f.eks. `W-kestrel-0004`), i tråd med `DR-`/`UF-`-mønsteret. Eksisterende id-er (`A38`) beholdes.

### 6.4 Lister som bygger seg selv

Nyhetsoversikter, prosjektlister, bloggarkiv og «Siste innlegg» lages av motoren ut fra sidene med samme `site` og `page`, sortert på dato. De følger samme regler som søket:

- bare sider som er synlige i spilltilstanden (A41 «Community partners» dukker først opp i Northgates Newsroom når en regel viser den),
- i en cachet versjon: bare sider med dato før cache-datoen,
- `"listed": false` holder en side utenfor lister.

### 6.5 Hva malene får se

Malene får et **offentlig visningsobjekt** som lages av en hviteliste: tittel, dato, blokker/brødtekst, bilder, forfatter, URL, versjons-ID og cache-flagg. `supports`, `mentions`, `source`, `filler`, `hidden`, `covers` og `pool` sendes aldri videre. Casebook steg 0 (PR #68) fjerner allerede `source`, `supports` og `mentions` fra visningen. Nettstedsmalene bygger på det. Se §13.3.

## 7. Gjenbruk av eksisterende innhold og grafikk

### 7.1 Innhold

Alle 43 eksisterende sider beholder id, URL, tekst og versjoner. Hver får et `site` og en `page`. Noen deles naturlig opp:

| Side i dag | Ny plass |
|---|---|
| A19 Brightline Services | Services. Adressen og portallenken flyttes til footer og Contact (ordlyden beholdes, så søk på `bl-ops.net` treffer fortsatt). |
| A20 Team (+IMG08) | Team, med `people`-blokk for Calvin og Renee og gruppebildet under |
| A40 Northgate Waterfront (+IMG12) | Projects → Eastfield Waterfront, IMG12 som hero |
| A38 Kestrel clients | «Who we deliver for» under About |
| A14 Eastfield Notes forside | Bloggforsiden. Listen «Latest» blir en automatisk liste. |
| B16, A53, A26, A27, A28 og saksframlegget til ordinanse 26-031 | Bykommunens Council- og Records-seksjoner |
| A66, B17 Calderpedia | Wiki-artikler med faktaboks |

**Viktig:** De eksisterende tekstene er bevis. Jeg foreslår å ikke skrive dem om, bare flytte dem inn i blokker der ordlyden er identisk. Tester sjekker at teksten spilleren kan lese er lik før og etter.

### 7.2 Grafikk som kan gjenbrukes

| Asset | Hvor |
|---|---|
| LOGO_NORTHGATE, LOGO_BRIGHTLINE, LOGO_KESTREL, LOGO_CITY, LOGO_SPILLCHECK, LOGO_FACELESS, LOGO_DOCSHARE, LOGO_CALDERPEDIA, LOGO_EASTFIELDNOTES, LOGO_THREADLINE, LOGO_SEEKER | Header for hvert nettsted |
| IMG12 (Waterfront-render) | Northgate forside og prosjektside |
| IMG08 (Brightline-teamet) | Brightline Team og Careers |
| IMG10 (fakturaen) | Brukes ikke på nettstedet. Den er et internt dokument. |
| IMG02 (mølla ved soloppgang) | Eastfield Notes (finnes). Mulig Calderpedia, se §9.2. |
| IMG03 (skiltet fjernes) | Calderpedia Calder Mill (som pressefoto med kreditering) |
| NIMG0001 (festivalen) | Calderpedia Harbor Festival |
| NIMG0003 (Northpoint-kaia) | Calderpedia Northpoint, Calder Transit / ferje |
| NIMG0004 (blackout-gate) | Calder Power «Outage updates» |
| NIMG0005 (røyk fra lageret) | Ikke på Kestrels side. Et selskap legger ikke ut bilde av sin egen brann. |
| IMG05O (hagen) | Eastfield Community Garden |
| AVA_NORTHGATE, AVA_BRIGHTLINE | Favicon og deling |
| IMG18 (Paul) | Northgate Newsroom, «Media contact» |

### 7.3 Bakgrunnsinnhold per nettsted

Alt bygger på kanon som allerede står i universet eller i avisartiklene. Nye fakta er merket **(ny kanon)** og føres inn i en fil med bakgrunnsfakta (§12.3) før de skrives.

**Northgate (ca. 16 sider)**
- Prosjekter: Eastfield Waterfront (planlagt), pluss tre ferdige: *Foundry Lofts* (Old Town, 2017), *Heights Commons* (the Heights, 2020), *Northpoint Landing* (2023) **(ny kanon: navn, år, distrikt)**.
- Om oss, ledelse (Gerald Whitcombe, CEO; Paul Navarro, VP Communications; to-tre andre uten bilde) **(ny kanon: navn)**.
- Bærekraft: «net-zero ready», regnvannsbed og en pollinatorhage som ennå ikke er plantet.
- Investorer: årsrapport som PDF-lenke med innlogging, «Investor relations: by appointment».
- Pressemeldinger: prisutdeling for Northpoint Landing, sponsing av Harbor Festival, «Building Eastfield's next hundred years» (samme tekst som den sponsede DR-artikkelen fra 21.10.2025, noe som er helt normalt for en pressemelding), A41.
- Ingen nevnelse av Brightline eller Meridian.

**Brightline (ca. 18 sider)**
- 6 anonymiserte kundecaser, slik byråer ofte gjør: «A regional credit union», «A dental group», «A craft brewery», «A municipal transit campaign (pitch)», «A wellness brand», «A real estate client» (uten navn). Hver har store tall: «+38 % share of voice», «2.1M impressions».
- Tjenester (finnes), Insights-blogg (5 innlegg om «authentic community»), Team, Careers (Community Writer + Account Manager, Paid Social Specialist, Data Analyst (Sentiment)).
- Tall på forsiden: «2.4M conversations started. 98 % client retention. 24/7 community care.» Litt for perfekt.
- **Ingen kunder som navngis.** Navngitte kunder ville bli ny kanon om hvem som kjøper personas, og det binder fremtidige mysterier (f.eks. GlowNest, se §9.2).

**City of Port Calder (ca. 30 sider)**
- Avfall: «Recycling pickup moves to Tuesday on the east side» (DR 8.3.2026), hentekalender, storavfall.
- Parkering: soner, «Harbor Street restrictions for the spring market», betalingsapp.
- Bibliotek: lenke til bibliotekets eget nettsted.
- CalderFix: rapporter hull i veien (DR 17.11.2025).
- Rådet: ordfører Denise Harlan og 11 medlemmer (DR: 7–4) **(ny kanon: 9 navn)**, møtekalender (finnes), agendaer og referater som dokumentlister, ordinanser.
- Kunngjøringer: vannledningsbruddet i Harbor Street 10.–16. mars, høring om fortauer, sommerjobber for ungdom.
- Registre (finnes): foretak, lobbyisme, offentlige dokumenter.
- Kontakt: rådhusets adresse og åpningstider **(ny kanon)**.

**Eastfield Notes (ca. 35–45 innlegg)**
- Innlegg fra 2019 til 14. mai 2025. Det siste innlegget skal fortsatt være fra 14. mai 2025 (kanon: «siste innlegg mai 2025»).
- Temaer: bibliotekets lesesirkel, tåke, andeløpet under Harbor Festival, hagen, skoleferie og bokbusser, gamle bilder av mølla, et innlegg om «Why I started this blog» (2019), sur kommentar om veiarbeid.
- Kommentarfelt med 0–6 kommentarer fra naboer, Priya og et par spam-kommentarer.
- **Ingen innlegg om Maras familie eller oppvekst** utover det kanon sier. Theo kan nevnes som «my brother».
- Brightline endret bare de fire innleggene kanon nevner. De nye innleggene er like i cache og live.

**Calderpedia (ca. 25 artikler)**
Port Calder, Eastfield, Northpoint, Old Town, the Heights, Calder Mill, Port Calder lighthouse (automatisert 1998, siste fyrvokter Samuel Okoro), Eastfield–Northpoint-ferjen, Harbor Festival (frivillige siden minst 1979), Calder Creek, rute 14 (stubb, «citation needed»), The Daily Record (siden 1911), Salty's Fish Bar (siden 1971), Calder Credit Union (siden 1952), Denise Harlan, Kestrel Logistics (stubb), chowderkonkurranser, Dead internet theory. Redigeringshistorikk på 5 artikler og diskusjonssider på 3 («Is the chowder claim sourced?»).

**Kestrel (ca. 12 sider)**
- Siden 1998, 140 varebiler, flyttet til den gamle hermetikkfabrikken i Dock Road i 2023, 60 nye jobber høsten 2025, same-day-levering fra 10.09.2025, slagord «We know the way» (alt i kanon).
- Fleet: varebiler, to lastebiler, el-pilot **(ny kanon: tall)**. Coverage: kart over Port Calder og nabobyene.
- Careers: sjåfør, lager, natt.
- News: «Our driver's rescue of Biscuit» (DR 22.12.2025, sjåføren er fortsatt anonym), servicevarsel 26.01.2026: «Some Eastfield deliveries may arrive a day or two late this week.» Ingenting om årsaken til brannen.
- **Lou Adair nevnes ikke noe sted.**

**SpillCheck (ca. 8 sider)**
Liste over 20–30 kjente lekkasjer, blant dem Eastfield Neighbors (feb. 2023, finnes), og bakgrunnslekkasjer fra treningssentre, en pizzakjede og en skoleportal **(ny kanon: navn og datoer)**. How we verify, FAQ, Privacy.

**Threadline (10–15 nye tråder)**
Kollektivtrafikk, fiskeplasser, «Is the 6:10 ferry captain real?», lekkasjer og tips, tech-hjelp, et underforum om gaming. Profilsider for de vanligste brukerne.

**Docshare (6–8 dokumenter)**
Vaktliste for Harbor Festival 2025, kakesalg i foreldreforeningen, bordkart til et bryllup («draft 3»), menyen til en matvogn, tre utløpte lenker.

## 8. Navigasjon, cache og versjonering

| Funksjon | Endring |
|---|---|
| **URL-er** | `phone.urls` utvides med relative lenker. En ukjent sti på et kjent domene viser nettstedets 404-side, ikke et Seeker-søk. Et ukjent domene går til søk som i dag. `domene.com` åpner forsiden. |
| **Lenker på siden** | Navigasjon, kort og lister er vanlige lenker. Trykk åpner, langt trykk gir kontekstmenyen (åpne, kopier adresse, lagre). |
| **Tilbake og frem** | Browser får frem-knapp (stakken finnes allerede i `phone.js`). |
| **Historikk** | Uendret. Hver side er en artefakt og havner i Visited. |
| **Bokmerker** | Nytt: ekte bokmerker (stjerne) i Browser, lagres i spillfilen. Knappen som i dag har bokmerkeikon og lagrer bevis, får Casebook-ikonet, slik at «husk siden» og «dette er bevis» ikke blandes. |
| **URL-er fra andre apper** | Til vurdering (Anders 24.11): «Copy link» i kontekstmenyen i alle apper (Messages, Mail, Connect, avisene) legger adressen på et felles utklippstavle i spillet. Når adressefeltet i Browser får fokus, tilbyr det «Paste and go», slik ekte nettlesere gjør. Lenker i tekst kan fortsatt åpnes direkte fra kontekstmenyen. |
| **Seeker** | Indekserer titler og blokktekst. `index: weak/none/exact` virker som før. Sider med `index: "none"` kan bare finnes ved å navigere, noe som gir «oppdagelse ved vanlig navigasjon» direkte. |
| **Cache** | En cachet versjon vises med designet fra sin dato og cache-banneret som i dag. Automatiske lister i en cachet versjon viser bare sider fra før cache-datoen. |
| **Archive** | **Levert i W8.** En skjerm i Browser per adresse med alle kopier spilleren kan åpne («Archive copy» fra Seeker, «Live page», og spillerens egne «Your saved copy» som egne, synlig adskilte rader), eldst først. Herfra sammenlignes tekst og detaljer (§9.1). En lagret kopi kan alltid åpnes, også når originalen er låst eller slettet. «View cached versions» per domene er uendret. |
| **Nettstedets liv** | `parked`, `gone` og `maintenance` vises av Browser eller nettstedet etter hvem som eier meldingen i virkeligheten: «This site can't be reached» er nettleseren, «We'll be back soon» er nettstedet. |
| **Innlogging** | Uendret (`access`, `loginSite`). Innloggingssiden tegnes i nettstedets eget design i stedet for det felles kortet. |
| **Lagring** | Bokmerker og frem-stakk krever et nytt felt i lagringen og migrering fra dagens versjon. |

## 9. Samspill med Casebook og deduksjon

### 9.1 Kravene i punkt 8

| Spilleren skal kunne | I dag | Etter forslaget |
|---|---|---|
| Lagre en hel nettside | Ja | Uendret |
| Lagre et tekstutdrag | Ja, via markering → «Save» (blir notat med kilde) | Uendret. Casebook steg 1 avgjør om det skal være notat eller bevis. |
| Lagre et bilde | Ja | Uendret |
| Lagre et dokument | Ja (Docshare, e-post) | Uendret |
| Lagre en bestemt versjon | Ja, beviset lagrer `version` | Designet følger versjonen, så det vises likt. |
| Sammenligne gammel og ny versjon | Ja: Archive i Browser (W8) → Casebook-sammenligningen (steg 3) | «Compare text and details» (to avkrysset) og «Compare with live» i Archive, og «Compare with live page» i banneret på en arkivkopi eller lagret kopi, kaller `phone.compare()`. «Compare with live» finnes bare fra en eldre kopi, og bare når den levende siden kan leses; ellers er knappen deaktivert med en nøytral grunn. Bilder sammenlignes separat i Casebook. |
| Kommentere visuelle likheter | Nei | Bevisnotat i Casebook steg 1 (beviskortet). |
| Knytte informasjon fra forskjellige nettsteder | Ja, koblinger mellom to bevis med seks typer, retning for «Supports» og «Possibly manipulated» (Casebook steg 3) | Uendret |
| Åpne originalkilden | Ja | Uendret, men se under. |
| Bevis endres ikke etterpå | **Nei, ikke alltid** | Ny regel: beviset åpner alltid spillerens lagrede kopi. Se §13.3. |

**Ingen ny Casebook-funksjonalitet i dette forslaget.** Det eneste jeg ber Casebook-tråden om, er at «åpne bevis» viser den lagrede versjonen selv om den ikke er cachet, og at sammenligningen i steg 3 kan ta to versjoner av samme side. Begge passer inn i deres steg 1 og 3.

**Hva W8 trenger fra Casebook steg 3 (merget PR #86 `5d64cbc`, 25. nov 2026):**
- *Inngangen:* `phone.compare(refs)` åpner Casebooks sammenligning øverst i Casebook (med «tilbake» til Browser). For Archive: `[{ artifact, version: gammel }, { artifact, version: ny }]`, eller `{ artifact }` uten `version` for gjeldende side. Rekkefølgen bestemmer A og B; eldst først gir «Changes from A to B» i lesbar retning.
- *Tilgang:* `compareView` slipper bare gjennom gjeldende versjon og versjoner i `cachedVersions` (samme regel som `viewArtifact`), og siden må være sett (`s.seen`). Browser trenger altså ingen egen sjekk, men knappen bør bare vises når minst to versjoner er tilgjengelige. Å åpne en versjon fra Archive markerer siden som sett.
- *Lagring:* sammenligningen virker uten at noe er lagret. Før spilleren kan koble kopiene, står det «Save to Casebook to connect them», som lagrer akkurat de versjonene som vises.
- *Lekkasjevern:* Browser skal ikke sende noe annet enn referanser. Alt som vises, kommer fra `compareView`, som tvillingtesten dekker.
- *Test:* `tools/test-casebook-ui.mjs` har en W8-test («PASS W8 hook») som kaller `phone.compare()` med to versjoner av Kestrels «About»-side. W8 la til `tools/test-browser-archive-ui.mjs` for selve Archive-skjermen.

**Levert i W8 (25. nov 2026, merget PR #87 `50f65fb`):** Archive-skjermen i Browser, `core/archive.js` (`archiveView`, `archivePair`), inngangene (stripe, banner, «All copies in Archive», «Other versions»), tester og tvillingdekning. Ingen ny kanon, ingen nye arkivkopier og ingen nye bilder: de eksisterende sidene med cache gir 12 sider med to kopier å sammenligne (Kestrel forside og «About» 2014, Brightline Team 2024, Eastfield Notes forside og «waterfront»-innlegget, bibliotekets ansattside og seks oppdaterte Daily Record-saker). Se DESIGN.md, «Archive i Browser (W8)».

**Anders' avgjørelser for W8 (25.11.2026, etter gjennomgang av PR #87):**
1. Archive per adresse i Browser: godkjent som det er.
2. Hele lagrede sider står i Archive, tydelig skilt fra nettarkivets kopi: «Your saved copy» er alltid en egen rad med eget ikon, blå tone og kantstripe; arkivkopien heter «Archive copy» (Kept by Seeker). Utdrag og enkeltbilder hører hjemme i Casebook, ikke i Archive.
3. Archive avslører aldri sider eller versjoner spilleren ikke har tilgang til, men en kopi spilleren allerede har lagret, kan alltid åpnes, også når originalen senere er låst eller slettet. Låsing stopper nytt innhold, ikke spillerens dokumentasjon. En låst side uten lagret kopi viser ingenting.
4. Eldst først og høyst to avkrysset: godkjent. Hver rad viser dato og kopitype («Archive copy», «Live page», «Your saved copy»).
5. «Compare with live» med ett trykk, men bare fra en bestemt eldre kopi og bare når den levende siden kan leses. Er originalen borte, slettet eller låst, er knappen skjult i radene og deaktivert i banneret med en kort, nøytral grunn. En annen arkivkopi settes aldri stille inn som «current».
6. Ingen nye kopier nå. De 12 sidene holder for å levere mekanikken. **Flere historiske versjoner kommer gjennom et eget, godkjent innholdsarbeid**, ikke som del av W8.
7. Bare felt og tekst sammenlignes i W8: knappen og skjermen heter «Compare text and details», og sammenligningen peker til den eksisterende bildesammenligningen i Casebook.

### 9.2 Nettsidedesign som spor (punkt 7)

Jeg foreslår at mekanikkene bygges som **innhold**, ikke kode. Motoren vet ikke at noe er et spor, og ingen blokk eller mal har en stil for det. Eksempler som er konsistente med kanon:

| Mekanikk | Konkret i universet | Påvirker The Quiet Account? |
|---|---|---|
| Samme profilbilde flere steder | Faceless #44812 er «purchased 37 times». Calvins ansikt (IMG06S) kan dukke opp i en kundeuttalelse hos HarborDesk og hos et forsikringsselskap. **Godkjent.** Bildesøk på Calvin gir flere treff, og ikke alle har med Brightline å gjøre. Veien til den opprinnelige Faceless-siden skal fortsatt være praktisk og logisk. Gjennomspillingstesten skal bekrefte at den finnes. |
| Samme adresse | 18 Harbor Street er HarborDesks virtuelle kontor. Brightline og fire uskyldige firmaer bruker den. Samtidig sier Unfiltered at Harbor Street-kjøperne bruker et virtuelt kontor i Dock Road (fremtidig mysterium). | Litt. Det lærer spilleren at samme adresse ikke er samme eier. |
| Hevder lang historie uten arkiv | Calvin «has spent fifteen years helping brands», men Brightline ble registrert i 2023 og har ingen cache før det. Kestrel sier «since 1998» og *har* en cachet 2014-versjon. | Nei, det er allerede kanon. Kontrasten gjør sporet ærligere. |
| Design endres samtidig med innhold | Eastfield Notes fikk nytt tema i oktober 2025 da Brightline tok over (se §13.2). | **Godkjent.** |
| Ansatte forsvinner | Brightlines Team-side i cache fra 2024 viser tre «community leads» som er borte i dag. | Litt. Ny kanon om Brightline. |
| Samme formuleringer | Brightlines Insights og to Garden-personaer bruker samme uttrykk («keep listening», «change can be scary»). Eastfield Notes v2 bruker det også (finnes). | Ja, styrker S5. Lav risiko. |
| Samme skrivefeil | Kan brukes i senere mysterier. Ikke foreslått nå. | Nei |
| Like nettstedsstrukturer | Harbor Dental og Brightline bruker samme kommersielle tema («Lumen by Pixelfold» i footer). Ingen forbindelse. | Nei. Det er en bevisst blindvei. |
| Bilde kreditert til Mara | Calderpedia bruker Maras mølle-bilde (IMG02) med «Photo: M. Quinn, CC BY-SA». | **Utsatt.** Bildesøket på IMG01/IMG02 holdes uendret i denne fasen. |

### 9.3 Samme mal er ikke samme opphav

Spillerne kan bare lære dette hvis det er sant i universet. Derfor:

- Kommersielle temaer har navn og kreditering i footer («Theme: Lumen by Pixelfold», «Powered by Harborpress»), og flere uavhengige nettsteder bruker dem.
- En test sjekker at ingen mal eller variant bare brukes av nettsteder som hører til samme skjulte aktør. Ellers blir malvalget en lekkasje.
- På samme måte: ingen nettsted får bilder bare på sidene som er spor. En validator-advarsel sammenligner andelen sider med bilder blant spor og blant bakgrunn per nettsted.

## 10. Behov for ny grafikk

Mest kan løses uten nye bilder: tekstlogoer for gamle design, SVG-kart og diagrammer, ikoner, «image not found»-ikoner på gamle sider og innloggingsvegg på Faceless-galleriet. 24 nye bilder gjør resten troverdig, med 12 prioriterte. ID-mønster `WEB<nnnn>`, samme produksjon som før (lokal ComfyUI, kontroll mot spesifikasjon og alle tidligere bilder). **Avklart 24.11:** de tolv prioriterte først, resten ved behov, og produksjonen starter i nettsidefasen. Bakgrunnssider skal ha bilder av samme kvalitet som sider med spor.

| ID | Pri | Nettsted | Motiv |
|---|---|---|---|
| WEB0001 | 1 | Northgate | Foundry Lofts, Old Town: ombygd teglbygg med glasstak, overskyet, arkitektfoto |
| WEB0002 | 1 | Northgate | Heights Commons: lave boligblokker med tregalleri, lekeplass, sol |
| WEB0003 | 1 | Northgate | Northpoint Landing: leiligheter ved kaia, ferjeterminalen i bakgrunnen (samme som NIMG0003, ny vinkel) |
| WEB0004 | 2 | Northgate | Northgates hovedkontor, lobby med logoen på veggen (LOGO_NORTHGATE) |
| WEB0005 | 1 | Brightline | Kontorlandskap, tomme pulter, ringlys, gult lys. Ingen ansikter. |
| WEB0006 | 2 | Brightline | Kundecase-mockup: telefon med sosiale innlegg (generisk, uten Connect-logo) |
| WEB0007 | 1 | Kestrel | Rader med hvite varebiler med falkelogoen i Dock Road, morgen (samme bygning som NIMG0005, intakt) |
| WEB0008 | 2 | Kestrel | Lagerhall innvendig, gule hyller, truck |
| WEB0009 | 3 | Kestrel 2014 | Lavoppløst foto fra 2014: én varebil foran det gamle depotet, gammel tekstlogo |
| WEB0010 | 1 | By | Rådhuset i Port Calder, teglstein og klokketårn, flagg |
| WEB0011 | 1 | By/bibliotek | Eastfield-filialen av biblioteket, inngang, plakat om nye åpningstider |
| WEB0012 | 2 | By | Søppelbil som tømmer gjenvinningsbeholder i Eastfield |
| WEB0013 | 1 | Calderpedia | Fyret i Port Calder, lavvann, tåke |
| WEB0014 | 2 | Calderpedia | Old Town, gate med brostein og butikker |
| WEB0015 | 3 | Calderpedia | Calder Creek under Route 9-brua (før fiskedøden) |
| WEB0016 | 1 | Eastfield Notes | Mobilbilde 2019: bibliotekets lesesirkel-hylle med håndskrevne lapper |
| WEB0017 | 1 | Eastfield Notes | Mobilbilde 2021: tåke over havna fra Pier 2, ingen personer |
| WEB0018 | 2 | Eastfield Notes | Mobilbilde 2022: gummiender i Harbor Festival-løpet |
| WEB0019 | 3 | Eastfield Notes | Mobilbilde 2023: bokbuss utenfor skole |
| WEB0020 | 2 | Salty's | Butikkfront fra 2008, rød markise, lav oppløsning |
| WEB0021 | 2 | Calder CU | Ny filial på 4th Street, to skranker |
| WEB0022 | 3 | Calder Power | Smartmåler på husvegg |
| WEB0023 | 3 | Walt's page | Skannet papirbilde fra Harbor Festival 1987, falmet |
| WEB0024 | 3 | Faceless | 12 syntetiske portretter til galleriet (ett ark, kuttes med verktøy). Kan erstattes av innloggingsveggen. |

**Produsert 25.11 (PR #83, merget `b2a7f76`):** alle 20 gjenstående bilder i tabellen er laget, med bildegeneratoren i stedet for lokal ComfyUI, med felles stilprompt og eksisterende fotografier som referanse. Se implementeringsloggen («Fotografier»).

Logoer: Kestrel 2014 og Northgate før 2024 kan være tekstlogoer. Nye nettsteder (bibliotek, transit, Calder Power, Calder CU, Harbor Dental, HarborDesk, Salty's) trenger enkle SVG-logoer som jeg kan lage, slik som de eksisterende.

## 11. Implementeringsrekkefølge og PR-er

| PR | Innhold | Filer | Avhenger av |
|---|---|---|---|
| **W0** Lekkasjevern | **Ferdig.** PR #68: `media()` fjerner `source`, `supports` og `mentions`; `tests/twin.test.mjs` er permanent. 25. nov: `publicView` i `core/site-view.js` hvitelister visningsfelt (tittel, dato, body/blocks, bilder, forfatter, URL, versjon, cache-flagg og øvrige visningsfelt). `filler`, `covers`, `pool`, `hidden` og andre forfatterfelt sendes aldri til malene. `renderArtifact` / `renderLogin` / `renderGone` kjører visningen gjennom hvitelisten. DOM-tvillingtesten forblir i Casebook-arbeidet. | `core/site-view.js`, `app/render.js`, `tests/sites.test.mjs` | Casebook steg 0 |
| **W1** Nettstedsmodell | **Ferdig** (25. nov). `content/universe/sites/*.json` for alle refererte nettsteder, `site`/`page` på eksisterende sider, `core/sites.js` (design etter dato, lenkeoppslag, status, 404-data, `listedPages`). Validatoren avslår nav-lenker som ikke løses, og `site-ref` avslår domenereferanser uten nettsted (e-postdomener unntatt). Inventar: [WEBSITE-INVENTORY.md](../../../WEBSITE-INVENTORY.md). Ingen synlige endringer. | `core/sites.js`, `core/content.js`, `core/world.js`, `tools/lib/validate-world.mjs`, `content/universe/sites/`, tester | W0 |
| **W2** Malverk + 3 maler | **Ferdig** (25. nov, `websites-w2` `4f0200b`). `app/sites/` med blokker og malene Corporate, Government og Blog. Northgate, Port Calder City Portal og Eastfield Notes viser dagens tekst i de nye malene (Eastfield Notes bytter til `minimal` på den levende siden etter 22. okt 2025; cachete versjoner beholder `classic`). Motoren brukes også av andre nettsteder som allerede hadde disse malnavnene (Brightline, Kestrel, Calder Transit, Harbor Authority, `corp-registries.example`). CSS ligger i `app/sites/*.css`. | `app/sites/`, `app/render.js`, `index.html` | W1 |
| **Grafikk** Logoer, favicon, heltebilder | **Ferdig** (25. nov, grein `websites-w2-graphics`). Alle 25 konfigurerte nettsteder har SVG-logo. Adressefeltet viser favicon. Heltebilder på malte sider (nye WEB-fotografier og SVG-illustrasjoner, registrert i `graphics/catalog.json`). Tynn chrome for landing/legacy/personal/wiki/document slik at merke og bilde synes; dette er ikke W5. Bevisbilder er ikke gjenbrukt som pynt. Gjenstående WEB0001–WEB0024 uten eksisterende side er ikke produsert. | `assets/images/`, `graphics/catalog.json`, `app/apps/browser.js`, `app/sites/simple.js` | W2 |
| **W3** Browser | **Ferdig** (25. nov, grein `websites-w3`). Frem-knapp, bokmerker (stjerne, atskilt fra Casebook-lagring), tekststørrelse A−/A+, nettstedets 404 og vedlikehold i nettstedets chrome, parkert «This domain may be for sale», Browser-eid «This site can't be reached», lagring versjon 8 så gamle spill lastes. Seeker viser offisielt nettsted først når spørringen er merkenavn, alias eller domene (W1-modellen), også for `gone`/`parked`. `portcalderjazz.com` er lagt inn som parkert fra 2022 (allerede i §4); ingen cachet 2019-side. | `core/browser.js`, `core/search.js`, `core/sites.js`, `app/apps/browser.js`, `app/phone.js`, `core/save.js`, `app/sites/status.js` | W1 |
| **W4** Bakgrunn, runde 1 | **Ferdig og merget** (25. nov, PR #78 · `24a20c3`). 122 nye sider på Northgate (18), City of Port Calder (32), Eastfield Notes (37), Kestrel (16) og Brightline (19, i mysteriepakken), pluss `universe/background-facts.json` (24 oppføringer, `canon`/`claim`, sjekket av validatoren). Sidene beholdes. Godkjent kanon: ordfører Denise Harlan og 11 rådsmedlemmer (Ana Ruiz + 10 nye navn); rådhuset 40 Civic Center, skranke 8:30–16:30. Eksisterende sider er urørt. | `content/universe/artifacts/sites-w4-*.json`, `brightline-background.json`, `background-facts.json`, `validate-world.mjs`, `tests/websites-w4.test.mjs` | W2 |
| **W5** Fire maler til | **Ferdig og merget** (25. nov, PR #79 · `9b6ce40`). Wiki, Forum, Document, Anonymous, og saas-varianten av Landing (for Faceless; Harbor Dental og AIWriterPro deler chrome). Calderpedia (31 nye sider; 24 artikler inkl. B17/A66), Threadline (27), Docshare (8), SpillCheck (5), Faceless Stock (5). Eksisterende ordlyd/ID/URL urørt. Godkjent kanon: fyret automatisert 1998, siste fyrmester Samuel Okoro; Harbor Festival-frivillige siden minst 1979; bruddene HarborFit (mars 2021), Slice of Calder (november 2022) og CalderLearn (august 2024). «Dennis» er bare en forum-påstand. | `app/sites/wiki.js` m.fl., `sites-w5-*.json`, `tests/websites-w5.test.mjs` | W2 |
| **W6** Historie | **Ferdig** (25. nov, PR #80 · `4e5bff8`). Legacy, Personal, Landing `smallbiz` (parkert live forblir Browser-eid). 50 nye sider: Salty's, HarborDesk, hagen, AIWriterPro, Harbor Dental, Calder Transit, biblioteket, Calder Power, Calder CU, Walt's side, Harbor PA, cachet jazz 2019, pluss Open Filings-hjem og Kestrel 2014-cache. `corp-registries.example` omdøpt til `openfilings.org` med alias og egen test. | `app/sites/legacy.js`, `personal.js`, `sites-w6-*.json`, `tests/websites-w6.test.mjs` | W5 |
| **W7** Spor i design | **Ferdig og merget** (25. nov, PR #81 · `9190200`). 12 nye sider, cachet Team 2024, stockansikt på uavhengige sider, 18 Harbor Street, felles formuleringer, Lumen-blindvei, gjennomspilling `design_as_clue` (fortsatt `lights_out`). Godkjent kanon: HarborDesk-leietakerne, Haven Mutuals kontor, community leads 2024. | innhold, `tools/lib/scenarios.mjs`, `tests/websites-w7.test.mjs` | W6, ja 25.11.2026 |
| **W8** Casebook-kobling | **Merget PR #87 · `50f65fb`** (25. nov, med Anders' sju avgjørelser 25.11.2026). Archive i Browser med «Compare with…» som kaller `phone.compare()` (se §9.1). (At bevis åpner lagret versjon, tas i Casebook steg 1.) | `core/archive.js`, `core/game.js`, `app/apps/browser.js`, `app/phone.js`, `app/render.js` (+ «All copies in Archive» i `connect.js`, `messages.js`, `news.js`), `app/style.css`, `app/apps/casebook.js` (ulagret side heter «Page»; tittel «Compare text and details» og bildemerknad fra Archive), `core/compare.js` (kopiord), `tests/archive.test.mjs`, `tests/compare.test.mjs`, `tests/twin.test.mjs`, `tools/test-browser-archive-ui.mjs`, `tools/test-casebook-ui.mjs` (nytt ord) | Casebook steg 3 |

Grafikk produseres parallelt fra W2, i den vanlige grafikktråden.

## Implementeringslogg (25. november 2026)

W0–W7 og grafikk er merget til `main` som PR #73–#81 (`9190200`).

| Steg | Grein | Commit / PR |
|---|---|---|
| W0 Lekkasjevern | `websites-w0` | merget PR #73 · `a3b3a63` |
| W1 Nettstedsmodell og inventar | `websites-w1` | merget PR #74 · `7193fa7` |
| W2 Corporate, Government, Blog | `websites-w2` | merget PR #75 · `05493e9` |
| Logoer, favicon og heltebilder | `websites-w2-graphics` | merget PR #76 · `dec0458` |
| W3 Browser-verktøy og nettstedstilstander | `websites-w3` | merget PR #77 · `2c6aa9f` |
| W4 Bakgrunnssider runde 1 | `websites-w4` | merget PR #78 · `24a20c3` |
| W5 Wiki, Forum, Document, Anonymous | `websites-w5` | merget PR #79 · `9b6ce40` |
| W6 Legacy, Personal, øvrig Landing, bakgrunnsnettsteder | `websites-w6` | merget PR #80 · `4e5bff8` |
| W7 Spor i design | `websites-w7` | merget PR #81 · `9190200` |

Avvik fra §11: W2-motoren gjelder alle nettsteder med de tre malnavnene, ikke bare Northgate, bykommunen og Eastfield Notes. Grafikksteget innførte en tynn chrome for fem andre malnavn slik at logo og helt synes; fulle maler for Wiki/Forum/Document/Anonymous er fortsatt W5. To domener er tildelt fordi kanon ikke navngir dem: `harbor.portcalder.gov`, `eastfieldneighbors.net`. `corp-registries.example` er omdøpt i W6 til `openfilings.org` (gammelt vertsnavn i `domains`, egen test). `portcalderjazz.com` er lagt til i W3 som parkert fra 2022; W6 skriver den cachete 2019-versjonen (natt på the Anchor, Lou Benn allerede i kanon). Ingen forfattet nettside står i `maintenance` på startdatoen; tilstanden er dekket av tester. Frem-stakken er økt-only og overlever ikke reload til låseskjermen. Lagring versjon 8 tar vare på bokmerker og tekststørrelse. Seeker rangerer offisielt nettsted først ved tydelig merkenavn/domene; app-søk og skjulte sider er uendret, og blandede spørringer behandles ikke som merkenavn. W4 leverte 122 nye sider, noe over «ca. 110» i §11; sidene beholdes (når de først er skrevet, tar vi dem ikke bort). Rådet har ordfører Denise Harlan og 11 medlemmer (Ana Ruiz og 10 nye navn, godkjent; §7.3 skrev «9 navn»). Rådhuset 40 Civic Center, Port Calder, skranke hverdager 8:30–16:30, er godkjent ny kanon. City-nav er nav til hub-sider; de eksisterende dype evidens-URL-ene ligger i hub-teksten, ikke lenger i toppmenyen. Brightlines Statement er tatt ut av offentlig nav (A42 er fortsatt skjult på sin URL). WEB0001–WEB0004 er fortsatt ikke produsert; hjemmesidene gjenbruker IMG12, WEB0010, WEB0005 og WEB0007. W5 tok saas-Landing tidligere enn tabellen i §11, fordi Faceless hører til der; W6 tar `smallbiz`. Parkert live forblir Browser-eid («This domain may be for sale»), ikke nettsteds-chrome. Faceless-biblioteket er en innloggingsvegg uten `meta.logins`. Godkjent W5-kanon: fyret automatisert i 1998, siste fyrmester Samuel Okoro; Harbor Festival har hatt frivillige siden minst 1979; bruddene HarborFit (mars 2021), Slice of Calder (november 2022) og CalderLearn (august 2024) er universfakta. 6:10-fergekapteinen «Dennis» er bare en forum-påstand.

**W6.** Legacy-malen (`2002`, `2008`) og Personal (`geocities`, `club`) er nye. Landing fikk `smallbiz`; parkert live er fortsatt Browser-eid. 50 nye sider: Salty's 3, HarborDesk 2, Eastfield Community Garden 3, AIWriterPro 2, Harbor Dental 5, Calder Transit 6, Open Filings 1, Port Calder Public Library 8, Calder Power 6, Calder Credit Union 5, Walt's Harbor Festival Page 5, Harbor Public Affairs 1, portcalderjazz.com cache 3. Nye nettsteder fra §4: `pclibrary.org`, `calderpower.com`, `caldercu.com`, `harborpa.com`, og Walts side på tildelt gratisvert `waltbrennan.calderweb.net`. Kestrel har cachet 2014-hjem og About (levende ordlyd uendret). Salty's har ny tagline fra 1. mars 2026. Bibliotekets personalside er den avklarte alternative veien inn (cache 2024 med Mara og Priya, levende 2026 uten Mara og uten nye personfakta). NIMG0004 er ikke brukt. IMG05O er på hagens plottside. Grafikk: SVG-logoer og WEB0031–WEB0035. Verden har 444 artefakter. Nye oppdiktede navn, åpningstider og priser fra W6 ble godkjent 25. november 2026 og er kanon (bibliotekets åpningstider og øvrige ansatte, Harbor Dental-teamet, HarborDesk-priser og Dock Road, Open Filings). W7-spor var ikke lagt inn i W6.

**W7.** 12 nye sider og en cachet 2024-versjon av Brightlines Team-side. IMG06A/IMG06B er kjøpte kopier av IMG06S (Faceless #44812) på HarborDesk og Haven Mutual; bildesøk gir flere treff, inkludert A31, og ikke alle er Brightline. Fire uskyldige firmaer bruker 18 Harbor Street (to med egne sider). «keep listening» / «change can be scary» står i en ny Insights-artikkel og to Garden-innlegg, i tillegg til Eastfield Notes v2. Lumen by Pixelfold står i footer på Harbor Dental, Brightline, AIWriterPro, Haven Mutual og North Lamp. `corporate/agency` deles med Haven Mutual. Ny gjennomspilling `design_as_clue` når fortsatt `lights_out`. Validatoren advarer hvis et nettsted bare har bilder på sporsider. IMG01/IMG02 og Maras møllebilde er uendret. De tre W7-påstandsgruppene (HarborDesk-leietakerne, Haven Mutuals kontor, community leads 2024) er godkjent og fremmet til kanon.

**Fotografier (PR #83, `websites-photos`).** Northgate: WEB0001 Foundry Lofts (prosjektside + «Five years»), WEB0002 Heights Commons (prosjekt + «welcomes its first residents»), WEB0003 Northpoint Landing (prosjekt + designomtale), WEB0004 lobby (About). Brightline: WEB0006 telefon-mockup (Work). Kestrel: WEB0008 lagerhall (Warehouse-jobb, «Sixty jobs»), WEB0009 bare på de cachete 2014-versjonene av hjem og About. Bibliotek: WEB0011 Eastfield-filialen (Eastfield branch, Hours), WEB0031 lesesal (hjem). By: WEB0012 gjenvinningsbil (Waste and recycling). Calderpedia: WEB0013 fyret, WEB0014 Old Town, WEB0015 Calder Creek. Eastfield Notes: WEB0016 lesesirkel 2019, WEB0037 tåke 2019, WEB0017 tåke fra Pier 2 2021, WEB0018 gummiender 2022, WEB0019 bokbuss («Book bus, back to school», 2022). Calder CU: WEB0033 fasade (hjem), WEB0021 to skranker (4th Street, erstatter WEB0033 der). Calder Power: WEB0032 master (hjem), WEB0022 smartmåler (Smart meters). Walt: WEB0023 skannet 1987-bilde (hjem, erstatter WEB0034 der), WEB0034 2008-bilde fra digitalkamera (Festival 2008). Faceless: WEB0024 ark med 12 portretter (How it works). HarborDesk WEB0028, hagen WEB0029, Harbor PA WEB0035, Haven Mutual WEB0038 (samme sider som før). Bildene er laget med bildegeneratoren (GenerateImage), ikke ComfyUI, med én felles stilprompt (`graphics/sources/web-photos/STYLE.md`) og eksisterende fotografier som stil- og kontinuitetsreferanse (WEB0010, WEB0025–WEB0027, NIMG0003 for samme fergeterminal i WEB0003, WEB0005 for Brightline-kontoret, WEB0007/NIMG0005 for Kestrel-lageret). Etterbehandling i `graphics/sources/web-photos/process.py`: skalering til katalogstørrelse, lett korn, webp. Hvert bilde er kontrollert mot briefen og de gamle bildene; disse ble generert på nytt: Foundry Lofts (vann i bildet, men Old Town ligger i innlandet), lesesirkel-hylla to ganger (lesbar tekst og merkevare), lobbyen (mørk, skyskrapere), Kestrel 2014 (feil logo), gjenvinningsbilen (rar arm), Calder Creek (døde fisk før fiskedøden), Walt 1987 (for lik NIMG0001), Walt 2008 (Salty's-front og lesbar tekst), Harbor PA (skyskrapere). Manuelle rettinger: LOGO_NORTHGATE er montert i messing i lobbyen fra `logo-northgate.svg` (ikke generert), oppslaget i bibliotekdøra er sløret, et fruktlignende merke på laptopen hos HarborDesk er fjernet, og et teal ringmerke på veggen hos Calder CU er malt bort så det ikke ligner Harbor Dentals bølge. Telefonbildene for Eastfield Notes er mykere med mer støy; Kestrel 2014, Walt 2008 og Walt 1987 er bevisst lavoppløste (1024×768, JPEG-artefakter, blitz eller falmet papirkopi). Ingen ansikter utenom Faceless-arket; der er tolv tydelig ulike personer, og ingen ligner Calvin (IMG06S / #44812) eller #51007. Arket er ikke avledet av noe bilde; 12 utsnitt på 512×512 ligger i `graphics/sources/web0024-tiles/` for et senere galleri, men biblioteket er fortsatt en innloggingsvegg. Alle nye bilder er egne originaler (ingen `derivedFrom`), så bildesøk på IMG01, IMG02, IMG06S, IMG04S, IMG05O, NIMG0003 og NIMG0005 gir ingen nye treff (test `tests/websites-photos.test.mjs`). WEB0030 (AIWriterPro-dashbord) og WEB0036 (Faceless, abstrakt) forblir SVG fordi et foto ikke passer; de øvrige SVG-filene WEB0028, WEB0029, WEB0031–WEB0035, WEB0037 og WEB0038 er fjernet og erstattet med webp under samme ID. Northgates hjemmeside og A40 beholder IMG12 (vannfront-visualiseringen). A19/A20 er uendret (WEB0005, IMG08). Ingen ID-er, URL-er eller ordlyd er endret; bare `images`-felt. Skjulte sider er fortsatt skjulte, og Casebook-filene er ikke rørt. Avvik fra §10: WEB0019 henger på bokbuss-innlegget fra september 2022 (det finnes ikke noe 2023-innlegg om bokbussen). Ny kanon: ingen. Dette retter loggen over: WEB0001–WEB0004 er nå produsert og henger på prosjekt-, nyhets- og About-sidene; hjemmesidene som gjenbrukte IMG12, WEB0010, WEB0005 og WEB0007 er uendret.

**Bildeinfo (PR #83).** WEB0001–WEB0038 følger nå EXIF-konvensjonen fra DESIGN.md §Image: Northgate (Orrin D7), Kestrel 2014 (Orrin S20), Calderpedia og Salty's (Lumen 6), Maras innlegg (Lumen 5, datert ved innleggene), Walts skann 2007 og digitalkamera 2008 (Orrin S5), Faceless-arket som stockprodukt; resten er fjernet (`meta: null`), også Brightline. Validatorregel og `tests/image-meta.test.mjs`: alle bilder har et `meta`-valg, og `taken` er aldri senere enn første versjon som viser bildet. Detaljer og ny kanon til godkjenning i DEVPLAN («Fotografier — bildeinfo»).

**Rettelser etter fotografiene (PR #84, merget `48191f7`).**
- Threadline-profiler viser navn og «Threads started» igjen. Feilen var at `accountByHandle()` gir en id.
- Walt-sitatet i DR-2026-0051 etter hans død er et tilsiktet spor, med test.
- Enhetsnavnene Orrin D7/S5/S20, Halden PhotoScan 2400 og Lumen 6 er kanon i `background-facts.json`. Maras Lumen 5 står bare i bildeinfo og i dokumentasjonen.
- Harbor Festival-revisjonen fant ingen måned som kolliderte innenfor samme år. Anders bestemte at festivalen alltid er i oktober. Derfor er Eastfield Notes-innleggene fra 2021 og 2022, kommentarene deres og bildene WEB0018/WEB0034 flyttet til andre lørdag i oktober. Ingen tekst forteller om en flytting.
- De to innleggene har nye oktober-URL-er (`/2021/10/harbor-festival-dog-run`, `/2022/10/festival-weekend`) og samme id-er.
- De gamle juli-adressene videresender via det nye artefaktfeltet `urlAliases`, i samme ånd som `domains` for openfilings. Bokmerker på en gammel adresse flyttes når et lagret spill lastes.
- Test: `tests/url-aliases.test.mjs`.
- Vinneranden i 2025 er nr. 3,117 i begge Daily Record-sakene (B06 er rettet fra #212).
- Walts skann fra 1987 med skannedato 2007 er i orden.

Slik testes: `node --test --test-concurrency=1 games/dead-internet/tests/*.test.mjs`, `node games/dead-internet/tools/validate.mjs`, `node games/dead-internet/tools/simulate.mjs`, og Playwright-røyktest `tools/test-casebook-ui.mjs` (390×844). Nettstedstester: `tests/sites.test.mjs`. W3-tester: `tests/browser.test.mjs`. W4-tester: `tests/websites-w4.test.mjs`. W5-tester: `tests/websites-w5.test.mjs`. W6-tester: `tests/websites-w6.test.mjs`. W7-tester: `tests/websites-w7.test.mjs`. W8-tester: `tests/archive.test.mjs` og Playwright `tools/test-browser-archive-ui.mjs` (390×844, kjøres for seg). Skjermbilder: `/workspace/dead-internet-shots/w3-*.png`, `w4-*.png`, `w5-*.png`, `w6-*.png`, `w7-*.png` og `w8-*.png`.

**PR #72 lukket.** PR #72 (`codex/casebook-step-1`) ble lukket uten merge 25. nov 2026 som en rest etter PR #71. Greina er beholdt.

**Casebook steg 3 (25. nov 2026, merget PR #86 `5d64cbc`).** Sammenligning og koblinger er bygget, og inngangen W8 trenger (`phone.compare()` med versjonsreferanser) er klar og testet. Etter Anders’ gjennomgang 25.11.2026 er en kobling alltid mellom nøyaktig to bevis. For W8 betyr det bare at to versjoner fra Archive kan kobles direkte etter at de er lagret, for eksempel «A may be manipulated, compared with B». Se §9.1 og DESIGN.md, «Implementert steg 3».

**W8 (25. nov 2026, merget PR #87 `50f65fb`).** Archive i Browser er bygget etter §8 og §9.1. Anders avgjorde designvalgene 25.11.2026 (se §9.1 og DEVPLAN under «W8»), og rettelsene ble lagt på samme PR før merge. W0–W8 er ferdige.

Neste steg: Casebook steg 2 og 3 er merget (PR #85 `d6dbb8c`, PR #86 `5d64cbc`). W8 er merget (PR #87 `50f65fb`), så W0–W8 er ferdige. Casebook steg 4 (kildevurdering) er merget som PR #88 `20d2f49`; steg 5 (rapportering) er implementert 25.11.2026 på greina `casebook-step-5` (PR #89) og justert etter Anders' gjennomgang; punkt 9 (Dana og skjulte `supports`) venter på hans avgjørelse før merge. Steg 5 endrer ingen nettsider. `supports` på nettsider og dokumenter er fortsatt skjult kanon og vises aldri; punkt 9 gjelder hvordan Dana leser dem, ikke sidene. Deretter F-1/F-2 i saksavslutningen (etter diskusjon med Anders) og ekstern spilltest. Et nettsted er én synlig kilde (`site:domene`) og får ett kildekort; et dokument eller en forumtråd er sin egen kilde (`page:adresse`), som før (`apparentSource`). Steg 4 endrer ingen nettsider. Ekstern spilltest etter steg 5. De planlagte WEB-fotografiene er levert (PR #83). Nye PR-er merges bare etter Anders' ja.



### 11.1 Forhold til Casebook-planen

Veikartet (Anders, 24.11, oppdatert): 1) Casebook steg 0–5, 2) avklare og eventuelt fullføre mekanikken for saksavslutning og konsekvenser, 3) ekstern spilltest av The Quiet Account, 4) justeringer, **5) nettsidearkitekturen W0–W8**, **6) bakgrunnsinnhold og grafikk**, **7) ny spilltest med det utvidede internettet**, 8) verktøyapper, 9) TokTok, 10) nye mysterier. **Nettstedsarbeidet starter i punkt 5.** Så lenge Casebook-stegene pågår, rører dette arbeidet ikke `core/artifacts.js`, `core/casebook.js`, `core/provenance.js`, `app/apps/casebook.js` eller `tests/twin.test.mjs`.

Den første spilltesten (punkt 3) går med dagens internett. Den er likevel nyttig her: noter om testspillerne oppfatter alt innhold som spor. Det gir et utgangspunkt å måle bakgrunnsinnholdet mot.

## 12. Omfang og teknisk risiko

### 12.1 Omfang (grovt)

| Del | Størrelse |
|---|---|
| W0–W1 motor og validator | 500–700 linjer JS + 25–35 tester |
| W2, W5, W6 maler og blokker | 150–250 linjer JS + 80–150 linjer CSS per mal, ca. 1 500–2 000 totalt |
| W3 Browser | 200–300 linjer |
| Innhold (W4–W7) | 140–170 nye sider, 25 000–30 000 ord, pluss redigeringshistorikk og kommentarer |
| Grafikk | 12 prioriterte bilder + 12 valgfrie, 7–10 nye SVG-logoer |

### 12.2 Risiko

| Risiko | Sannsynlighet | Tiltak |
|---|---|---|
| Kanonfelt lekker gjennom malene | Middels | W0: hviteliste og DOM-test i tvillingverdenen |
| Bakgrunnsinnhold motsier kanon | Middels | Fil med bakgrunnsfakta (`universe/background-facts.json`) som validatoren sjekker navn, datoer og tall mot. Ingen nye fakta om personene i The Quiet Account. |
| Søkene i The Quiet Account blir vanskeligere | Høy | Gjennomspillingstesten (`tests/playtest.test.mjs`) og simuleringen kjøres etter hver innholds-PR. Søkene spilleren *må* gjøre, skal fortsatt gi målet på første side. |
| Bildesøk endrer seg (gjenbrukte ansikter) | Middels | Bare med ditt ja (§9.2), og med egen test |
| Spor kan kjennes igjen på design (bilder, maler) | Middels | Validator-advarsler (§9.3) |
| Lister i cachede versjoner viser feil tidspunkt | Lav | Regelen i §6.4 + tester |
| CSS blir stor og treg på mobil | Lav | Én CSS-fil per mal, lastes ved behov. Ingen webfonter (offline PWA), bare systemfonter. |
| Lagringsformat | Lav | Migrering og test som for v2 og v3 |
| Arbeidsmengde for innhold | Høy | Innhold i runder. Verktøy som viser alle nettsteder, sider og design på én side (`tools/site-gallery.html`). Det blir også grunnlaget for en senere redigeringsmodul. Repoet har allerede en editor som bruker GitHub-API-et, og den kan gjenbrukes. |

### 12.3 Bakgrunnsfakta

Alle nye navn, datoer, adresser og tall i bakgrunnsinnholdet føres i én fil og sjekkes mot kanon. Hver oppføring har `introducedBy` (nettsted), `binds` (`none` | `universe`) og `status`: `canon` (sant i universet) eller `claim` (noe en side eller karakter påstår, f.eks. Calvins «fifteen years» eller Brightlines «98 % client retention»). Validatoren behandler bare `canon` som fakta. Når et fremtidig mysterium trenger et faktum, ser vi der først. Slik unngår vi at Foundry Lofts får to forskjellige byggeår.

### 12.4 Testing (godkjent 24.11)

Testene skal beskytte både teknikken og spillopplevelsen:

- Tvillingverden-testen er permanent og utvides når nettstedene kommer: alle sider rendres i begge verdener.
- DOM-tester for informasjonslekkasje i malene.
- Lagrede bevis endres ikke når originalen endres.
- Sammenligning av gamle og nye versjoner av en side.
- Cache viser aldri fremtidig innhold, heller ikke i automatiske lister.
- Skjulte sider dukker ikke opp i automatiske lister.
- Hver navigasjonslenke virker eller har en bevisst definert feiltilstand.
- Gjennomspilling av The Quiet Account etter større innholdsendringer.
- Forskjellige rapporter og saksutfall, feilaktige teorier med konsekvenser, og delvise avsløringer.
- Bakgrunnsinnhold gjør ikke nødvendige spor urimelig vanskelige å finne. Søkene og bildesøkene spilleren må gjøre, sjekkes.
- Det nye foretaksregisterdomenet: gamle søk, referanser og lagrede spill virker.
- Mobil røyktest ved UI-endringer.

## 13. Funn og avklaringer

1. **SpillCheck er ikke en lekkasjeportal i kanon.** Det er en tjeneste der man sjekker om en e-postadresse er med i kjente datalekkasjer, og det er slik spilleren bruker den. Forslaget gir den et mørkt, minimalistisk design og en liste over kjente lekkasjer, men beholder rollen. **Avklart:** SpillCheck beholder rollen. En lekkasjeportal kan komme senere.
2. **Eastfield Notes startet i 2019** ifølge kanon. Jeg foreslår at Mara brukte et gratis bloggtema fra ca. 2012 og aldri byttet. Det gir 2010-tallsutseendet uten å endre kanon. Da Brightline tok over i oktober 2025, kan de ha byttet til et nytt, glatt tema («growing together»). Det gjør at designendringen og innholdsendringen skjer samtidig, men spilleren ser det bare ved å åpne cachen. **Avklart: godkjent.**
3. **Bevis kan endre seg etter at de er lagret.** Casebook åpner den levende siden når den lagrede versjonen ikke er merket `cached`. Får siden en ny versjon, ser spilleren noe annet enn det hen lagret. Dessuten sendes kanonfelt (`supports`, `source`, `mentions`) med visningsobjektet til UI. Ingen av delene er synlige i dag, men begge blir risiko når maler leser data. **Avklart:** Kanonfeltene fjernes i Casebook steg 0 (PR #68), og lagrede bevis åpner lagret versjon fra Casebook steg 1.
4. **`corp-registries.example`** ser ut som en plassholder. Jeg foreslår et troverdig domene (f.eks. `opencorporates`-aktig, med eget navn). URL-en er et søkeord i saken, så endringen må testes. **Avklart:** byttes, med egen test for søk, referanser og lagrede spill. **W6:** omdøpt til `openfilings.org`. A63 har ny kanonisk URL; det gamle vertsnavnet ligger i `domains` og som søkeord, og løses fortsatt.
5. **Biblioteket:** et bibliotek der Mara og Priya jobbet, vil naturlig ha en cachet personalside fra 2024 med Maras navn. Det er konsistent med kanon og bekrefter bare det spilleren vet fra før, men det er en ny vei inn. **Avklart: godkjent** som alternativ vei inn, ikke obligatorisk spor. Ingen nye personopplysninger om Mara.
6. **Spilltesten:** Avklart 24.11. Den går etter Casebook steg 5, og nettstedene kommer etterpå.
7. **Spor i design (§9.2):** **Avklart:** gjenbrukt ansikt fra Faceless og designendringen på Eastfield Notes er godkjent. Maras bilde på Calderpedia er utsatt.
8. **Navngitte Brightline-kunder:** **Avklart:** kundecasene forblir anonymiserte. Ingen navngitte kunder ennå.
