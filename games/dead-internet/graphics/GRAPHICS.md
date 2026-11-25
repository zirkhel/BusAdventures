# Dead Internet — grafikkoversikt

_Generert fra `graphics/catalog.json` av `tools/graphics-report.mjs`. Rediger katalogen, ikke denne fila._

Production list for Dead Internet graphics. Ids are stable and used by the world (content/universe/images.json). Replace a file by saving it under the same name; no code changes. Order matters: generate originals before the copies derived from them.

## Stil
- **photo:** Realistic smartphone photo, natural light, slight noise, no text overlays, no real brands.
- **profile:** Square avatar, realistic, as a person would choose for themselves. Synthetic personas: subtly too smooth, with one visible AI tell.
- **ui:** Fictional interface, original design, no resemblance to real products.
- **web photo:** Website photos WEB0001–WEB0038 (image generator, not ComfyUI): documentary photo of Port Calder, overcast pewter-grey sky, soft flat diffuse light, wet surfaces after rain, muted slate-blue / grey / weathered red-brick palette with small warm accents, slight sensor noise, no HDR, no readable text or logos unless the brief names one. Phone photos (Eastfield Notes) are softer with phone noise; 2008/2014/1987 pictures are deliberately low-resolution, flash-lit or faded. Full prompt: graphics/sources/web-photos/STYLE.md.

## Faste karakterer
- **mara:** Woman, 34, warm round face, freckles, short dark curly hair, small silver hoop earrings, green parka. Face reference: graphics/references/mara.webp (the IMG13 original). Use it for every image of Mara.
- **theo:** Man, 29, Mara's brother: same freckles and dark curly hair, cut short. Tired eyes, grey hoodie. Face reference: graphics/references/theo.webp (the IMG14 original).
- **dana:** Woman, 41, reporter: reading glasses pushed up, ink on one finger, cardigan. Face reference: graphics/references/dana.webp (the IMG15 original).
- **owen:** Man, 63, former mill worker: weathered face, flat cap, thick glasses, grey beard. Only seen in his own photos. Face reference: graphics/references/owen.webp (the IMG24 original).
- **iris:** Woman, 26, writer: never shows her whole face. Coffee cups, window light, hands. Reference: graphics/references/iris.webp (the IMG17 original): keep the rings, the disc earring and the hair.

## Slik byttes et bilde
1. Lag bildet etter beskrivelsen og lagre det med nøyaktig filnavn og størrelse fra tabellen.
2. Bilder som er avledet av et original (beskåret, speilvendt) lages ved å bearbeide originalen, ikke ved å generere på nytt. Ellers finner ikke bildesøket i spillet sammenhengen.
3. Sett `status` til `final` i katalogen og kjør `node games/dead-internet/tools/validate.mjs`.
4. Inntil fila finnes, bruker spillet `assets/placeholders/<ID>.svg` (lages av `tools/make-placeholders.mjs`).

## Status
- Påkrevd: 87 bilder. Valgfritt: 36. Ferdige filer: 123.
- «face: X» betyr at bildet viser en fast person. Lag først én ansiktsreferanse per person (se Faste karakterer) og bruk den i alle bildene av vedkommende.
- «needs X» betyr at bildet lages fra X (for eksempel et profilbilde laget av en logo).

## Produksjonsrekkefølge
IMG02 → IMG01 → IMG03 → IMG04S → IMG04 → IMG05O → IMG05 → IMG06S → IMG06 → IMG07 → IMG08 → IMG09 → IMG10 → IMG11 → IMG12 → IMG13 → IMG14 → IMG15 → IMG16 → IMG17 → IMG18 → IMG19 → IMG20 → IMG21 → IMG22 → IMG23 → LOGO_SEEKER → LOGO_CONNECT → LOGO_THREADLINE → LOGO_DAILYRECORD → LOGO_BRIGHTLINE → LOGO_NORTHGATE → LOGO_CITY → LOGO_SPILLCHECK → LOGO_FACELESS → LOGO_DOCSHARE → NIMG0001 → NIMG0002 → NIMG0003 → NIMG0004 → NIMG0005 → LOGO_UNFILTERED → LOGO_KESTREL → LOGO_CALDERPEDIA → LOGO_EASTFIELDNOTES → LOGO_UNFILTERED_ICON → LOGO_DAILYRECORD_ICON → IMG24 → AVA_NORTHGATE → AVA_BRIGHTLINE → DRP01 → DRP02 → DRP03 → DRP04 → DRP05 → DRP06 → DRP07 → UFP01 → UFP02 → UFP03 → UFP04 → LOGO_CALDERTRANSIT → LOGO_HARBORAUTHORITY → LOGO_HARBORDENTAL → LOGO_HARBORDESK → LOGO_SALTYS → LOGO_EASTFIELDGARDEN → LOGO_AIWRITERPRO → LOGO_CORPREGISTRIES → LOGO_EASTFIELDNEIGHBORS → LOGO_STATIC → LOGO_EASTFIELDNOTES_MINIMAL → LOGO_EASTFIELDNOTES_ICON → WEB0005 → WEB0007 → WEB0010 → WEB0020 → WEB0025 → WEB0026 → WEB0027 → WEB0001 → WEB0002 → WEB0003 → WEB0004 → WEB0006 → WEB0008 → WEB0009 → WEB0011 → WEB0012 → WEB0013 → WEB0014 → WEB0015 → WEB0016 → WEB0017 → WEB0018 → WEB0019 → WEB0021 → WEB0022 → WEB0023 → WEB0024 → WEB0028 → WEB0029 → WEB0030 → LOGO_PCLIBRARY → LOGO_CALDERPOWER → LOGO_CALDERCU → LOGO_WALTS → LOGO_HARBORPA → LOGO_OPENFILINGS → LOGO_KESTREL_2014 → WEB0031 → WEB0032 → WEB0033 → WEB0034 → WEB0035 → IMG06A → IMG06B → LOGO_HAVENMUTUAL → LOGO_QUAYLEDGER → LOGO_NORTHLAMP → WEB0036 → WEB0037 → WEB0038

## Bildeinfo (fiktiv EXIF)
Metadata står i `content/universe/images.json` (`meta`), ikke i katalogen. «Image info» i bildeviseren viser Taken, Camera (`device`), Location (bare når feltet finnes; `null` vises som «—»), Software og Note. `meta: null` betyr fjernet og vises som «None. It was stripped from this copy.». Alle bilder unntatt videorammer (de har klippets «Video info») skal ha et `meta`-valg, og `taken` («YYYY-MM-DD HH:MM») kan ikke være senere enn første versjon av siden som viser bildet (validatoren og `tests/image-meta.test.mjs`). Enheter: Lumen-telefoner (privatpersoner), Caldwell C-kameraer, «Daily Record photo desk», Orrin-kameraer (Orrin D7 profesjonelt, Orrin S5/S20 kompakt), skanneprogram i `software`, stockgeneratoren i `software`.

| ID | Valg | Taken | Camera | Location | Software | Note |
|---|---|---|---|---|---|---|
| IMG02 | EXIF | 2025-05-14 06:52 | Lumen 7 | Harbor St, Eastfield |  |  |
| IMG01 | EXIF | 2025-05-14 06:52 | Lumen 7 | — |  |  |
| IMG03 | EXIF | 2025-09-12 10:31 | Daily Record photo desk | Calder Mill |  |  |
| IMG04S | EXIF |  |  |  | Faceless Stock generator v4 |  |
| IMG04 | stripped | | | | | |
| IMG05O | EXIF | 2024-06-08 09:14 | Lumen 7 | Eastfield Community Garden |  |  |
| IMG05 | stripped | | | | | |
| IMG06S | EXIF |  |  |  | Faceless Stock generator v4 |  |
| IMG06 | stripped | | | | | |
| IMG07 | EXIF | 2025-11-02 15:40 | Caldwell C3 |  |  |  |
| IMG08 | EXIF |  |  |  | Studio Compose 12 |  |
| IMG09 | EXIF | 2025-12-12 16:05 | Lumen 7 |  |  |  |
| IMG10 | EXIF |  |  |  | ScanEasy |  |
| IMG11 | EXIF | 2023-08-19 18:20 | Caldwell C3 |  |  |  |
| IMG12 | stripped | | | | | |
| IMG13 | EXIF | 2021-02-27 12:03 | Lumen 5 |  |  |  |
| IMG14 | stripped | | | | | |
| IMG15 | stripped | | | | | |
| IMG16 | stripped | | | | | |
| IMG17 | stripped | | | | | |
| IMG18 | stripped | | | | | |
| IMG19 | stripped | | | | | |
| IMG20 | stripped | | | | | |
| IMG21 | stripped | | | | | |
| IMG22 | EXIF | 2019-07-04 22:47 | Lumen 3 |  |  |  |
| IMG23 | stripped | | | | | |
| IMG24 | EXIF | 2024-11-03 13:12 | Caldwell C1 |  |  |  |
| AVA_NORTHGATE | stripped | | | | | |
| AVA_BRIGHTLINE | stripped | | | | | |
| DRP01 | stripped | | | | | |
| DRP02 | stripped | | | | | |
| DRP03 | stripped | | | | | |
| DRP04 | stripped | | | | | |
| DRP05 | stripped | | | | | |
| DRP06 | stripped | | | | | |
| DRP07 | stripped | | | | | |
| UFP01 | stripped | | | | | |
| UFP02 | stripped | | | | | |
| UFP03 | stripped | | | | | |
| UFP04 | stripped | | | | | |
| WEB0005 | stripped | | | | | |
| WEB0007 | stripped | | | | | |
| WEB0010 | stripped | | | | | |
| WEB0020 | EXIF | 2025-08-14 12:31 | Lumen 6 |  |  |  |
| WEB0025 | stripped | | | | | |
| WEB0026 | stripped | | | | | |
| WEB0027 | stripped | | | | | |
| WEB0028 | stripped | | | | | |
| WEB0029 | stripped | | | | | |
| WEB0030 | stripped | | | | | |
| WEB0031 | stripped | | | | | |
| WEB0032 | stripped | | | | | |
| WEB0033 | stripped | | | | | |
| WEB0034 | EXIF | 2008-07-19 15:32 | Orrin S5 |  |  |  |
| WEB0035 | stripped | | | | | |
| WEB0036 | stripped | | | | | |
| WEB0037 | EXIF | 2019-08-03 07:41 | Lumen 5 | Harbor St, Eastfield |  |  |
| WEB0038 | stripped | | | | | |
| WEB0001 | EXIF | 2017-08-24 10:14 | Orrin D7 |  |  |  |
| WEB0002 | EXIF | 2020-06-02 17:05 | Orrin D7 |  |  |  |
| WEB0003 | EXIF | 2023-10-12 10:40 | Orrin D7 |  |  |  |
| WEB0004 | EXIF | 2026-01-08 09:20 | Orrin D7 |  |  |  |
| WEB0006 | stripped | | | | | |
| WEB0008 | stripped | | | | | |
| WEB0009 | EXIF | 2014-05-27 10:12 | Orrin S20 |  |  |  |
| WEB0011 | stripped | | | | | |
| WEB0012 | stripped | | | | | |
| WEB0013 | EXIF | 2025-09-27 07:22 | Lumen 6 | Northpoint |  |  |
| WEB0014 | EXIF | 2025-06-29 15:48 | Lumen 6 | Old Town |  |  |
| WEB0015 | EXIF | 2025-04-19 11:03 | Lumen 6 | Eastfield |  |  |
| WEB0016 | EXIF | 2019-06-13 18:12 | Lumen 5 | Eastfield Library |  |  |
| WEB0017 | EXIF | 2021-05-09 07:56 | Lumen 5 | Pier 2, Port Calder |  |  |
| WEB0018 | EXIF | 2022-07-15 18:47 | Lumen 5 | Harbor St, Eastfield |  |  |
| WEB0019 | EXIF | 2022-08-31 10:24 | Lumen 5 | Eastfield |  |  |
| WEB0021 | stripped | | | | | |
| WEB0022 | stripped | | | | | |
| WEB0023 | EXIF | 2007-11-04 16:20 |  |  | Halden PhotoScan 2400 | Scanned from a print. |
| WEB0024 | EXIF |  |  |  | Faceless Stock generator v4 |  |
| IMG06A | EXIF |  |  |  | Faceless Stock generator v4 |  |
| IMG06B | EXIF |  |  |  | Faceless Stock generator v4 |  |
| NIMG0001 | EXIF | 2025-10-11 18:10 | Daily Record photo desk |  |  |  |
| NIMG0002 | EXIF |  |  |  |  | No metadata. |
| NIMG0003 | EXIF | 2025-01-12 09:05 | Lumen 8 |  |  |  |
| NIMG0004 | EXIF | 2026-02-17 19:48 | Daily Record photo desk |  |  |  |
| NIMG0005 | EXIF | 2026-01-26 05:40 | Lumen 9 |  |  |  |

## Alle bilder
| ID | Fil | Størrelse | Type | Prioritet | Status | Brukt i | Avhengighet | Beskrivelse |
|---|---|---|---|---|---|---|---|---|
| IMG02 | `assets/images/img02-mill-sign-original.webp` | 1080×1350 | photo | required | final file | A33 | original for IMG01 | Sunrise over the harbour: the long red-brick Calder Mill with a tall chimney and 'CALDER MILL — EST. 1887' in white letters on a long sign panel across the front wall. Harbour and quay on the left, a lamp post on the right edge. Also the reference for the mill in every other image. |
| IMG01 | `assets/images/img01-mill-sign-crop.webp` | 1080×1080 | photo | required | final file | A05 | from IMG02: crop: 720×720 square from IMG02 at x 300, y 200 (sign and chimney kept, lamp post cut off), resized to 1080×1080 | Not generated: crop of IMG02, made by tools (see transform). |
| IMG03 | `assets/images/img03-sign-removal.webp` | 1600×1067 | photo | required | final file | A13 | needs IMG02 | Overcast press photo: a yellow crane lifts the long rusty 'CALDER MILL — EST. 1887' sign panel off the top of the mill's front wall, workers in orange, faded ghost lettering left on the brick. Crowd with phones behind a barrier. Same building as IMG02. |
| IMG04S | `assets/images/img04s-stock-51007.webp` | 1024×1024 | portrait | required | final file | A31B | original for IMG04 | Synthetic stock portrait: friendly woman, 30s, straight black bob, beige trench coat over a light blue shirt, park bokeh. AI tell: one ear has a stud, the other a stud plus a hoop. |
| IMG04 | `assets/images/img04-juno-profile.webp` | 512×512 | profile | required | final file | A07 | from IMG04S: crop: 720×720 head and shoulders from the final IMG04S (1024 px) at x 170, y 130, both ears and earrings kept, resized to 512×512 | Not generated: crop of IMG04S, made by tools (see transform). |
| IMG05O | `assets/images/img05o-garden-original.webp` | 1440×1080 | photo | required | final file | A36 | original for IMG05 | Landscape. Community garden in June: raised beds, tomatoes on canes, a weathered wooden sign 'PLOT 12' on the right. Mara's hand (woven bracelet, green-grey sleeve) on the bed at the left edge. |
| IMG05 | `assets/images/img05-garden-mirrored.webp` | 1080×1080 | photo | required | final file | A37 | from IMG05O: mirror horizontally, then crop 740×740 at x 0, y 230 (sign kept, hand removed), resized to 1080×1080 | Not generated: mirrored crop of IMG05O, made by tools. The sign reads backwards ('21 TOLP'). |
| IMG06S | `assets/images/img06s-stock-44812.webp` | 1024×1024 | portrait | required | final file | A31 | original for IMG06, IMG06A, IMG06B | Synthetic stock portrait: corporate man, 40s, wavy greying hair, big white smile, navy jacket, open white shirt, grey studio background. AI tell: a hoop in one ear, a stud in the other (the same tell as IMG04S: one generator). |
| IMG06 | `assets/images/img06-calvin-profile.webp` | 512×512 | profile | required | final file | A09, acc_calvinmarsh | from IMG06S: crop: 680×680 head and shoulders from the final IMG06S (1024 px) at x 180, y 60, both earrings kept, resized to 512×512 | Not generated: crop of IMG06S, made by tools (see transform). |
| IMG07 | `assets/images/img07-kestrel-van.webp` | 1600×900 | photo | required | final file | A16 |  | Owen's phone photo through wet leaves: a white van with a navy falcon logo and 'KESTREL LOGISTICS', rainy dusk. Owen's own red marker circle around the logo (in-world: he posted it circled on Threadline). |
| IMG08 | `assets/images/img08-brightline-team.webp` | 1536×1024 | composite | required | final file | A20 |  | Eleven people on a lawn in front of an office building, Brightline offsite. Deliberate composite: the woman in the mustard sweater appears twice (front, second from left, and back row, second from right). Calvin sits in the centre with the face of IMG06S, hoop and stud earrings. Renee is the blonde woman in a black blazer beside him. |
| IMG09 | `assets/images/img09-garden-dashboard.webp` | 1080×1440 | screenshot | required | final file | A23 |  | Phone photo of a laptop screen (moiré, slight perspective, keyboard out of focus): the internal dashboard 'THE GARDEN — Port Calder', 41 active personas, dormant inventory 11,402, client NGD, program CSP-EF, top performers MARA_Q, JUNO_P, MIKE_E, LINDSAY_4, autopilot ON. Made from HTML: graphics/sources/. |
| IMG10 | `assets/images/img10-invoice.webp` | 1240×1754 | scan | required | final file | A25 |  | Slightly skewed scan of a Brightline Media LLC invoice CSP-EF-Q1, January 8, 2026: bill to Northgate Development, attn. P. Navarro; Community Sentiment Program — Eastfield, Q1 2026, $21,000; payable to Meridian Holdings Ltd. (settlement account). Made from HTML: graphics/sources/. |
| IMG11 | `assets/images/img11-mara-harbour.webp` | 1080×1350 | photo | required | final file | A06 | face: mara | Mara (reference), selfie at the harbour in summer 2023, green parka, the mill with its front-wall sign across the water. Theo posted it after her death. |
| IMG12 | `assets/images/img12-waterfront-render.webp` | 1600×900 | render | required | final file | A40 | needs IMG02 | Developer marketing render at dusk: four glass towers on the Eastfield harbour, a glass hall with the old CALDER MILL sign and brick wall preserved inside, EASTFIELD WATERFRONT on the stone wing, people on the promenade, a motor yacht at the quay. |
| IMG13 | `assets/images/img13-mara-profile.webp` | 512×512 | profile | required | final file | A02, acc_maraquinn | face: mara | Mara (fixed reference), 2021, library shelves behind her, real and slightly imperfect. |
| IMG14 | `assets/images/img14-theo-profile.webp` | 512×512 | profile | required | final file | A06 | face: theo | Man, 29, Mara's brother (same freckles), tired eyes, grey hoodie, overcast harbour with an old brick mill behind him. |
| IMG15 | `assets/images/img15-dana-profile.webp` | 512×512 | profile | required | final file | A51 | face: dana | Woman, 41, reporter, reading glasses on her head, ink on her hand, cardigan, newsroom background with a Daily Record poster (black serif masthead, red rule). |
| IMG16 | `assets/images/img16-truthseeker.webp` | 512×512 | profile | required | final file | acc_truthseeker |  | Low-res, upscaled photo of a rusty cast-iron gear inside the mill, visible pixels and JPEG compression: an avatar someone has re-saved many times. |
| IMG17 | `assets/images/img17-iris-profile.webp` | 512×512 | profile | required | final file | A08 | face: iris | Woman, 26, half her face hidden behind a speckled ceramic mug, messy bun, small gold disc earring, two silver rings, black knit sweater, café window light. |
| IMG18 | `assets/images/img18-paul-profile.webp` | 512×512 | profile | required | final file | A52 |  | Man, 47, at a press doorstep: dark swept-back hair, stubble, navy suit and dark tie, microphones in the foreground, the NORTHGATE DEVELOPMENT sign behind him. Real, not synthetic: pores, small skin flaws. |
| IMG19 | `assets/images/img19-renee-avatar.webp` | 512×512 | profile | required | final file | A10 |  | Same file as AVA_BRIGHTLINE: the Brightline sunrise mark in amber with BRIGHTLINE / MEDIA in white on a navy-to-amber gradient. No face. |
| IMG20 | `assets/images/img20-mike-profile.webp` | 512×512 | profile | required | final file | A54 |  | Synthetic dad, 40s, at a backyard grill at golden hour: ginger beard, glasses, red-and-navy flannel, dark apron, arms crossed. Slightly too perfect; the watch sits oddly on the crossed arms. Must not resemble Calvin (IMG06S). |
| IMG21 | `assets/images/img21-pat-profile.webp` | 512×512 | profile | required | final file | A55 |  | From behind: a grey-haired person in a cap and olive rain jacket walks a golden retriever along a wet, foggy harbour promenade at dusk, railings, benches, lit lamps, harbour cranes in the fog. Face not visible. |
| IMG22 | `assets/images/img22-lindsay-profile.webp` | 512×512 | profile | required | final file | A56 |  | Real woman in her 30s, 2019 evening selfie at home: messy bun, freckles, dark hoodie, a tabby cat with white paws on her shoulder, lamp light, dark window with city lights. Slightly dated phone quality. |
| IMG23 | `assets/images/img23-priya-profile.webp` | 512×512 | profile | required | final file | A57 |  | Woman, 30s, children's librarian: dark curly hair up, nose stud, striped knitted cardigan, lanyard, chin on hand, picture-book shelves and a fox poster behind her. Real, warm library light. |
| LOGO_SEEKER | `assets/images/logo-seeker.svg` | 256×256 | logo | required | final file |  |  | Search engine: an eye outline whose iris forms the lens of a magnifier, handle down-right. Blue. |
| LOGO_CONNECT | `assets/images/logo-connect.svg` | 256×256 | logo | required | final file |  |  | Social network: two overlapping rounded speech bubbles, blue and teal. |
| LOGO_THREADLINE | `assets/images/logo-threadline.svg` | 256×256 | logo | required | final file |  |  | Forum: a white thread line forming a T that loops at its foot, on an orange rounded square. |
| LOGO_DAILYRECORD | `assets/images/logo-dailyrecord.svg` | 512×128 | logo | required | final file |  |  | Newspaper masthead 'The Daily Record', black bold serif, thin red rule under it (as on the newsroom poster in IMG15). |
| LOGO_BRIGHTLINE | `assets/images/logo-brightline.svg` | 256×256 | logo | required | final file |  |  | Agency: an amber horizontal line rising into a half sun with three rays (#e8a317). Same mark as on the invoice (IMG10). |
| LOGO_NORTHGATE | `assets/images/logo-northgate.svg` | 256×256 | logo | required | final file |  |  | Developer: three rising slab towers (grey, tallest on the right) above a sweeping base line, NORTHGATE / DEVELOPMENT in grey capitals on navy. Matches the sign in IMG18. |
| LOGO_CITY | `assets/images/logo-city.svg` | 256×256 | logo | required | final file |  |  | Port Calder city seal: a gold lighthouse inside a gear on navy, harbour wave below. |
| LOGO_SPILLCHECK | `assets/images/logo-spillcheck.svg` | 256×256 | logo | required | final file |  |  | A red padlock dripping onto black. |
| LOGO_FACELESS | `assets/images/logo-faceless.svg` | 256×256 | logo | required | final file |  |  | An empty dashed oval face outline with shoulders, grey on off-white. |
| LOGO_DOCSHARE | `assets/images/logo-docshare.svg` | 256×256 | logo | required | final file |  |  | A folded document with a link chain, blue line art. |
| NIMG0001 | `assets/images/nimg0001-festival-crowd.webp` | 1600×1067 | photo | required | final file | DR-2025-0322 | original for NIMG0002 | Press photo, rainy dusk at Pier 2: a dense crowd with umbrellas, the stage with lights at the far end, 'Port Calder Harbor Festival' flags with the lighthouse mark, a Fish & Chips stall on the right edge, a lone man with a blue umbrella on the nearly empty wet pier in the bottom-left corner. |
| NIMG0002 | `assets/images/nimg0002-festival-crop.webp` | 1080×1080 | photo | required | final file | UF-2025-0052 | from NIMG0001: crop: 590×590 square from NIMG0001 (1536×1024 original) at x 0, y 434, the man with the blue umbrella and a few people on the empty wet pier, resized to 1080×1080 | Not generated: crop of NIMG0001. Keep pixels identical so image search can match. |
| NIMG0003 | `assets/images/nimg0003-north-dock.webp` | 1600×1067 | photo | required | final file | DR-2025-0101, UF-2025-0007 |  | Grey morning at the north ferry dock: concrete pylons under a steel deck, the near pylon (N-4) visibly rusted and discoloured with weed at the waterline, a small passenger ferry moored at the end, 'Port Calder Ferry Terminal' sign on the building. |
| NIMG0004 | `assets/images/nimg0004-blackout-street.webp` | 1600×1067 | photo | required | final file | DR-2026-0058 |  | Night, a dark town street with dead traffic lights, car headlights and one bus with interior flashlights. Final: hand-fixed from the generated frame: bus LED 42 -> 14 (DR-2026-0058), "Port Calders" -> "Port Calder" on banners and bus side, near street lamp darkened. |
| NIMG0005 | `assets/images/nimg0005-warehouse-smoke.webp` | 1080×1350 | photo | required | final file | DR-2026-0031, UF-2026-0004 |  | Pre-dawn phone photo: grey smoke pouring from the loading bay of a long brick warehouse on the dock, one fire engine with blue lights, two firefighters and hoses, pallets, a blue skip, wet tarmac, a harbour crane in the distance. |
| LOGO_UNFILTERED | `assets/images/logo-unfiltered.svg` | 512×128 | logo | required | final file | app:unfiltered, platform:unfiltered |  | Masthead 'UNFILTERED' in heavy condensed capitals, acid-yellow on black, the T slightly raised and tilted as if stamped. |
| LOGO_KESTREL | `assets/images/logo-kestrel.svg` | 256×256 | logo | required | final file | platform:kestrel_site, A38 |  | Delivery company: a navy stylised falcon with swept-up wings and head facing right, 'KESTREL' in heavy navy sans and 'LOGISTICS' letter-spaced below (as on the van in IMG07). |
| LOGO_CALDERPEDIA | `assets/images/logo-calderpedia.svg` | 256×256 | logo | required | final file | platform:calderpedia |  | Local wiki: a round globe made of grey and blue harbour tiles with a wave, 'Calderpedia' in serif below. Not like any real wiki logo. |
| LOGO_EASTFIELDNOTES | `assets/images/logo-eastfieldnotes.svg` | 512×128 | logo | required | final file | platform:eastfieldnotes, acc_eastfieldnotes |  | Hand-drawn blog header 'Eastfield Notes' in a handwriting font with a small line drawing of the mill and its CALDER MILL sign, rust-coloured underline on cream. Warm, amateur, made by Mara. |
| LOGO_UNFILTERED_ICON | `assets/images/logo-unfiltered-icon.svg` | 512×512 | logo | required | final file | app:unfiltered |  | App icon and home-screen tile: black 'UF' (F tilted like the masthead's T) and a watching eye on acid yellow, with a black redaction bar. Inverted from the masthead so it stands out on the dark home screen. |
| LOGO_DAILYRECORD_ICON | `assets/images/logo-dailyrecord-icon.svg` | 512×512 | logo | required | final file | app:dailyrecord |  | App icon: bold serif 'DR' on warm paper, black rule with a thin red rule under it. |
| IMG24 | `assets/images/img24-owen-connect.webp` | 512×512 | profile | required | final file | A58, acc_owenpike | face: owen | Owen, close selfie outdoors on an overcast day: tweed flat cap, thick black glasses, grey beard, worn jacket over a flannel shirt, the brick mill and the harbour behind him. Real, unflattering, sincere. |
| AVA_NORTHGATE | `assets/images/ava-northgate.webp` | 512×512 | profile | required | final file | A65, acc_northgate | needs LOGO_NORTHGATE | Northgate's Connect avatar: the Northgate logo (towers, NORTHGATE / DEVELOPMENT) on navy, as on the sign in IMG18. Rendered from LOGO_NORTHGATE by graphics/sources/shoot-avatar.cjs. |
| AVA_BRIGHTLINE | `assets/images/ava-brightline.webp` | 512×512 | profile | required | final file | A64, acc_brightline, A10 | needs LOGO_BRIGHTLINE | Brightline's Connect avatar: the amber sunrise mark with BRIGHTLINE / MEDIA in white on a navy-to-amber gradient. Rendered from graphics/sources/avatar-brightline.html. Renee Okafor's avatar (IMG19) is the same file. |
| DRP01 | `assets/images/drp01-staff.webp` | 512×512 | profile | optional | final file | acc_dr_tadeyemi |  | Daily Record staff photo, grey studio backdrop (the look for all seven). Man, 38, city hall reporter: short hair, beard, light-blue shirt, arms crossed, Daily Record lanyard, notebook and pen in his shirt pocket. |
| DRP02 | `assets/images/drp02-staff.webp` | 512×512 | profile | optional | final file | acc_dr_lhart |  | Daily Record staff photo, grey studio backdrop. Woman, 45, business editor: short grey bob, freckles, hoop earrings in both ears, dark blazer, cream blouse, coin pendant. |
| DRP03 | `assets/images/drp03-staff.webp` | 512×512 | profile | optional | final file | acc_dr_bwhitlow |  | Daily Record staff photo, grey studio backdrop. Man, 31, technology reporter: messy dark hair, beard, black headphones round his neck, navy flannel over a dark T-shirt. |
| DRP04 | `assets/images/drp04-staff.webp` | 512×512 | profile | optional | final file | acc_dr_rcalloway |  | Daily Record staff photo, grey studio backdrop. Woman, 60, culture editor: curly grey hair pinned up, tortoiseshell glasses, gold hoops, paisley scarf in red, navy and ochre over a black cardigan, laughing. |
| DRP05 | `assets/images/drp05-staff.webp` | 512×512 | profile | optional | final file | acc_dr_mvane |  | Daily Record staff photo, grey studio backdrop. Man, 55, columnist: tousled grey hair, grey beard, light-blue shirt, loosened red striped tie, dark tweed waistcoat, sceptical raised eyebrow. |
| DRP06 | `assets/images/drp06-staff.webp` | 512×512 | profile | optional | final file | acc_dr_jsoto |  | Daily Record staff photo, grey studio backdrop. Woman, 34, public safety reporter: auburn hair in a messy bun, freckles, ear piercings, olive field jacket over a black sweater, backpack, camera on a strap. |
| DRP07 | `assets/images/drp07-staff.webp` | 512×512 | profile | optional | final file | acc_dr_efitch |  | Daily Record staff photo by the same photographer as the other six (intended: same grey studio backdrop and light). Woman, 67, obituaries writer: short white pixie hair, thin metal oval glasses, pearl earrings and necklace, small-flower blouse, mauve cardigan, kind smile. Clearly different from Ruth Calloway (DRP04). |
| UFP01 | `assets/images/ufp01-unfiltered.webp` | 512×512 | profile | optional | final file | acc_uf_redactor |  | Unfiltered writer avatar: grainy close-up of newsprint ('The city council investigation into … remain unclear, sources said.') with a thick black marker bar over one line. No face. |
| UFP02 | `assets/images/ufp02-unfiltered.webp` | 512×512 | profile | optional | final file | acc_uf_nightdesk |  | Unfiltered writer avatar: a brass banker's lamp with a green glass shade glowing over papers in a dark room. No face. |
| UFP03 | `assets/images/ufp03-unfiltered.webp` | 512×512 | profile | optional | final file | acc_uf_corawick |  | Unfiltered writer avatar: woman, 40s, in dark silhouette profile against a rain-streaked window with blurred lights, messy bun, face in shadow and not identifiable. |
| UFP04 | `assets/images/ufp04-unfiltered.webp` | 512×512 | profile | optional | final file | acc_uf_static |  | Unfiltered writer avatar: horizontal TV static and glitch lines with a faint human shape in it. No face. |
| LOGO_CALDERTRANSIT | `assets/images/logo-caldertransit.svg` | 256×256 | logo | required | final file | site:caldertransit |  | Municipal transit mark: a cream bus on a navy disc with a gold ring and route line. |
| LOGO_HARBORAUTHORITY | `assets/images/logo-harborauthority.svg` | 256×256 | logo | required | final file | site:harbor_authority |  | Port Calder Harbor Authority seal: a gold anchor and a harbour wave on navy, gold ring. |
| LOGO_HARBORDENTAL | `assets/images/logo-harbordental.svg` | 256×256 | logo | required | final file | site:harbordental |  | Harbor Dental: two teal wave strokes forming a circular mark on pale aqua, no lettering. |
| LOGO_HARBORDESK | `assets/images/logo-harbordesk.svg` | 256×256 | logo | required | final file | site:harbordesk |  | HarborDesk: a navy window frame over a pale harbour, a small desk in the lower pane. |
| LOGO_SALTYS | `assets/images/logo-saltys.svg` | 256×256 | logo | required | final file | site:saltys |  | Salty's Fish Bar: a cream fish on a red rounded square, SALTY'S in heavy capitals. |
| LOGO_EASTFIELDGARDEN | `assets/images/logo-eastfieldgarden.svg` | 256×256 | logo | required | final file | site:eastfieldgarden |  | Eastfield Community Garden: two green leaves on a stem, sage disc. |
| LOGO_AIWRITERPRO | `assets/images/logo-aiwriterpro.svg` | 256×256 | logo | required | final file | site:aiwriterpro |  | AIWriterPro: a pale pen nib and a caret on an indigo rounded square. Original mark, no real product resemblance. |
| LOGO_CORPREGISTRIES | `assets/images/logo-corpregistries.svg` | 256×256 | logo | required | final file | site:corp_registries |  | Corporate Registries: a grey-blue official roundel with a simple column and pediment. |
| LOGO_EASTFIELDNEIGHBORS | `assets/images/logo-eastfieldneighbors.svg` | 256×256 | logo | required | final file | site:eastfield_neighbors |  | Eastfield Neighbors forum (2010): a cream house with two dark windows on an olive rounded square. |
| LOGO_STATIC | `assets/images/logo-static.svg` | 256×256 | logo | required | final file | site:static_channel |  | static.channel: a green phosphor scan line and a tick mark on black. |
| LOGO_EASTFIELDNOTES_MINIMAL | `assets/images/logo-eastfieldnotes-minimal.svg` | 512×128 | logo | required | final file | site:eastfieldnotes |  | Eastfield Notes after 22 Oct 2025: lowercase 'eastfield notes' in a plain sans, thin green rule. |
| LOGO_EASTFIELDNOTES_ICON | `assets/images/logo-eastfieldnotes-icon.svg` | 256×256 | logo | required | final file | site:eastfieldnotes |  | App and favicon mark for Eastfield Notes: the hand-drawn Calder Mill sketch from the classic header, cream tile. |
| WEB0005 | `assets/images/web0005-brightline-office.webp` | 1600×900 | photo | required | final file | A19 |  | Brightline office at dusk: empty desks, ring lights, warm yellow lamps, harbour cranes through tall windows. No faces, no readable branding. |
| WEB0007 | `assets/images/web0007-kestrel-vans.webp` | 1600×900 | photo | required | final file | A38 |  | Rows of white delivery vans with a navy bird decal in a Dock Road yard at morning, long intact brick warehouse, wet tarmac, a crane across the water. No fire, no smoke, no lettering. |
| WEB0010 | `assets/images/web0010-city-hall.webp` | 1600×900 | photo | required | final file | B16 |  | Port Calder city hall: a red-brick civic building with a clock tower, wet plaza, navy and gold flags without text, overcast day. |
| WEB0020 | `assets/images/web0020-saltys-front.webp` | 1440×1080 | photo | optional | final file | B19 |  | Salty's storefront around 2008: faded red awning, cream and red paint, a wooden fish sign, a chalkboard too soft to read, cheap digital-camera look. |
| WEB0025 | `assets/images/web0025-harbor-dental.webp` | 1600×900 | photo | required | final file | W-harbordental-0001 |  | Harbor Dental shopfront: white and teal facade, glass waiting room, a teal wave mark and no lettering, wet street in a brick terrace. |
| WEB0026 | `assets/images/web0026-calder-transit-bus.webp` | 1600×900 | photo | required | final file | W-caldertransit-0001 |  | A navy-and-cream municipal bus at a simple shelter on a wet harbour-town street, blank destination board, a crane in the distance. No operator name or advertisements. |
| WEB0027 | `assets/images/web0027-harbor-authority.webp` | 1600×900 | photo | required | final file | W-harbor-authority-0001 |  | A small brick and concrete harbour operations building on a wet quay, radio mast, coiled ropes and a bollard, a crane and ship in the distance. No readable signs. |
| WEB0001 | `assets/images/web0001-foundry-lofts.webp` | 1600×900 | photo | required | final file | W-northgate-0003, W-northgate-0014 |  | Foundry Lofts, Old Town: a converted 19th-century red-brick metalworks with tall arched windows and a glass roof storey, a small courtyard with a bike shelter, wet cobbles. Inland: no water in view. Overcast. No people, no lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0002 | `assets/images/web0002-heights-commons.webp` | 1600×900 | photo | required | final file | W-northgate-0004, W-northgate-0015 |  | Heights Commons: a four-storey pale-brick block with timber galleries on a slope above the harbour road, shared garden with a wooden playground, thin sun breaking through grey cloud, harbour and cranes below. No people, no lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0003 | `assets/images/web0003-northpoint-landing.webp` | 1600×900 | photo | required | final file | W-northgate-0005, W-northgate-0011 |  | Northpoint Landing: two dark-brick apartment buildings and a courtyard on the quay; further along, the same ferry terminal as NIMG0003 from a new angle (pier on round pillars, glazed hall, navy board with only a ferry pictogram) and the white-and-navy ferry. Dusk, wet promenade. Not derived from NIMG0003. No people, no readable lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0004 | `assets/images/web0004-northgate-lobby.webp` | 1600×900 | photo | required | final file | W-northgate-0006 |  | Northgate head-office lobby: oak reception desk in front of a navy panelled wall with LOGO_NORTHGATE mounted in brass (the logo was composited from logo-northgate.svg, not generated), scale models of brick housing in a glass case, wet terraced street through the window. No people. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0006 | `assets/images/web0006-brightline-case-phone.webp` | 1600×900 | photo | optional | final file | W-brightline-0002 |  | Brightline case-study mockup: a hand holds an unbranded phone showing a generic feed (grey placeholder lines, a harbour photo, a coffee cup), the WEB0005 office with ring lights behind at dusk. Only a hand, no face, no Connect logo, no readable text. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0008 | `assets/images/web0008-kestrel-warehouse.webp` | 1600×900 | photo | optional | final file | W-kestrel-0008, W-kestrel-0013 |  | Inside the Dock Road depot (the converted cannery): yellow pallet racking with boxes and shrink-wrap, an orange forklift, brick walls with arched windows, grey daylight. Intact, no smoke. No people, no lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0009 | `assets/images/web0009-kestrel-2014.webp` | 1024×768 | photo | optional | final file | W-kestrel-0001, W-kestrel-0005 |  | Kestrel in 2014 (cached 2014 versions only): low-resolution compact-camera photo of one white van with a navy band and the old gold KESTREL wordmark (as LOGO_KESTREL_2014, no bird) in front of a corrugated depot shed in a rented gravel yard. Downscaled and JPEG-compressed on purpose. No people. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0011 | `assets/images/web0011-eastfield-library.webp` | 1600×900 | photo | required | final file | W-pclibrary-0004, W-pclibrary-0002 |  | Eastfield branch library: a single-storey brick building, glass entrance with a ramp, a notice about the new opening hours taped inside the door (deliberately blurred, unreadable), warm light inside. No people. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0012 | `assets/images/web0012-recycling-truck.webp` | 1600×900 | photo | optional | final file | W-city-0003 |  | A plain white-and-green recycling truck tipping a green bin on an Eastfield terrace, a worker in hi-vis seen from behind, wet road, crane in the distance. No lettering, no face. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0013 | `assets/images/web0013-lighthouse-fog.webp` | 1600×900 | photo | required | final file | W-calderpedia-0006 |  | Port Calder lighthouse: white stone tower with a black lantern and the closed keeper's cottage on a granite breakwater, low tide, seaweed and mud, thick fog. No people, no lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0014 | `assets/images/web0014-old-town-street.webp` | 1600×900 | photo | optional | final file | W-calderpedia-0004 |  | Old Town: a narrow wet cobbled street of brick shopfronts with dark blank fascias, iron lamps, crates and a bicycle; two distant walkers from behind. No water in view, no lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0015 | `assets/images/web0015-calder-creek.webp` | 1600×900 | photo | optional | final file | W-calderpedia-0009 |  | Calder Creek under the plain concrete Route 9 bridge before the fish kill: healthy water, reeds, a gravel path, one duck, brick houses beyond. No dead fish, no people, no lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0016 | `assets/images/web0016-reading-circle-shelf.webp` | 1440×1080 | photo | required | final file | W-eastfieldnotes-0003 |  | Mara's phone photo, 2019: the reading-circle shelf in the library back room, identical green copies with sticky notes (scribbles unreadable), a mug, a tin and a desk fan by an open window. Soft 2019 phone camera. No people, no readable text. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0017 | `assets/images/web0017-fog-pier2.webp` | 1440×1080 | photo | required | final file | W-eastfieldnotes-0015 |  | Mara's phone photo, 2021: fog over the harbour from the end of Pier 2, wet planks, an iron railing and a bollard, a crane and a moored ship fading out. No people, no lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0018 | `assets/images/web0018-duck-race.webp` | 1440×1080 | photo | optional | final file | W-eastfieldnotes-0022 |  | Mara's phone photo, 2022: yellow rubber ducks in the Harbor Festival race channel, bunting finish line, spectators' legs and green wellies only, crane and ship behind. No faces, no lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0019 | `assets/images/web0019-book-bus.webp` | 1440×1080 | photo | optional | final file | W-eastfieldnotes-0023 |  | Mara's phone photo (book bus, back to school, 2022 post; the §10 plan said 2023): a cream-and-green single-deck book bus in an Eastfield school yard, door open, crates of picture books on a folding table, hopscotch on wet tarmac. No people, no lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0021 | `assets/images/web0021-caldercu-counters.webp` | 1600×900 | photo | optional | final file | W-caldercu-0003 |  | Calder Credit Union, 4th Street: inside, two oak counters with dark green fronts and glass screens, a bowl of mints, a small waiting area, the wet terraced street through the window. A ring-shaped wall mark from the generator was painted out so it cannot echo Harbor Dental's wave. No people, no lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0022 | `assets/images/web0022-smart-meter.webp` | 1600×900 | photo | optional | final file | W-calderpower-0004 |  | A new grey smart meter beside an old beige meter cabinet on a wet brick house wall, a drainpipe and conduit, an Eastfield terrace behind. Display has no readable digits. No lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0023 | `assets/images/web0023-festival-1987.webp` | 1024×768 | photo | optional | final file | W-walts-0001 |  | Walt's scanned print, Harbor Festival 1987: volunteers in anoraks (from behind, no clear faces) tip a net of rubber ducks into the creek, children on a footbridge, an old fishing boat and a striped tent. Badly faded orange-magenta cast, white border, crease and dust, scanned small. Deliberately unlike NIMG0001. No lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0024 | `assets/images/web0024-faceless-sheet.webp` | 1600×1200 | portrait | optional | final file | W-faceless-0004 |  | Faceless Stock contact sheet: 12 synthetic head-and-shoulders portraits (4×3) on light grey, slightly too smooth. Twelve clearly different people; none resembles #44812 / IMG06S (no dark-haired man in his 40s, no suit) or #51007. Not derived from IMG06S or IMG04S. Cut tiles (512×512) are in graphics/sources/web0024-tiles/ for later gallery use; the library itself stays a login wall. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0028 | `assets/images/web0028-harbordesk-window.webp` | 1600×900 | photo | optional | final file | B18 |  | HarborDesk: a rented upper-floor office on Harbor Street, a plain desk at a sash window over the wet harbour street, scanned mail and a desk phone, a crane across the water. No people, no lettering, no product logos. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0029 | `assets/images/web0029-garden-beds.webp` | 1600×900 | photo | optional | final file | B20, W-eastfieldgarden-0002 |  | Eastfield Community Garden on an overcast spring morning: long timber raised beds of lettuce and kale, gravel paths, wheelbarrow and watering can, terraced houses behind. Deliberately unlike IMG05O (no shed, no plot sign, no hand, no sun). No people, no lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0030 | `assets/images/web0030-aiwriterpro-hero.svg` | 1600×900 | ui | optional | final file | B23 |  | AIWriterPro hero illustration: an abstract pale dashboard on indigo, cards and rules, no readable words or real-product UI. |
| LOGO_PCLIBRARY | `assets/images/logo-pclibrary.svg` | 256×256 | logo | required | final file | site:pclibrary |  | Port Calder Public Library: a warm brown roundel with an open book and a small lamp. |
| LOGO_CALDERPOWER | `assets/images/logo-calderpower.svg` | 256×256 | logo | required | final file | site:calderpower |  | Calder Power: a pale bolt on a deep teal disc, no lettering. |
| LOGO_CALDERCU | `assets/images/logo-caldercu.svg` | 256×256 | logo | required | final file | site:caldercu |  | Calder Credit Union: a dark green shield with CU in a serif face. |
| LOGO_WALTS | `assets/images/logo-walts.svg` | 256×256 | logo | required | final file | site:walts |  | Walt's page: a crude pink star on yellow, WALT in a casual face. Intentionally handmade. |
| LOGO_HARBORPA | `assets/images/logo-harborpa.svg` | 256×256 | logo | required | final file | site:harborpa |  | Harbor Public Affairs: a dark grey square, HPA and HARBOR PA in a light serif. |
| LOGO_OPENFILINGS | `assets/images/logo-openfilings.svg` | 256×256 | logo | required | final file | site:corp_registries |  | Open Filings: a grey official roundel with a simple column and pediment. |
| LOGO_KESTREL_2014 | `assets/images/logo-kestrel-2014.svg` | 256×256 | logo | optional | final file | site:kestrel |  | Kestrel 2014 wordmark: KESTREL in condensed gold capitals on navy. Used only on the cached 2014 design. |
| WEB0031 | `assets/images/web0031-library-reading-room.webp` | 1600×900 | photo | optional | final file | W-pclibrary-0001 |  | Port Calder Public Library reading room: tall wooden shelves, oak tables with green lamps, arched windows with rain and grey harbour light, a returns trolley. No people, no readable spines. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0032 | `assets/images/web0032-calderpower-pylons.webp` | 1600×900 | photo | optional | final file | W-calderpower-0001 |  | Calder Power: three pylons across a grey coastal field, a green meter cabinet by a gravel track, cranes across the water. Ordinary daytime, not the blackout photograph (NIMG0004). No lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0033 | `assets/images/web0033-caldercu-front.webp` | 1600×900 | photo | optional | final file | W-caldercu-0001 |  | Calder Credit Union, 4th Street: a modest shopfront in a brick terrace, plain dark green fascia without lettering, two oak counters visible inside, a cash machine and a bicycle on the wet pavement. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0034 | `assets/images/web0034-walts-2008.webp` | 1024×768 | photo | optional | final file | W-walts-0004 |  | Walt's 2008 snapshot (cheap digital camera, flash, JPEG artefacts): a box of yellow rubber ducks, a bucket and a red cash tin on the quay, Walt's plaid sleeve and hand only, bunting and a crane behind. No faces, no lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0035 | `assets/images/web0035-harborpa-desk.webp` | 1600×900 | photo | optional | final file | W-harborpa-0001 |  | Harbor Public Affairs: a dark, anonymous consultancy room, an empty walnut desk with a closed folder and a glass of water, blinds half down over slate roofs and the harbour. No people, no lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| IMG06A | `assets/images/img06a-harbordesk.webp` | 1024×1024 | portrait | required | final file | W-harbordesk-0003 | from IMG06S: none: identical file, used as a purchased stock portrait on HarborDesk | Not generated: same file as IMG06S, a purchased copy of synthetic portrait #44812. |
| IMG06B | `assets/images/img06b-havenmutual.webp` | 1024×1024 | portrait | required | final file | W-havenmutual-0001 | from IMG06S: none: identical file, used as a purchased stock portrait on Haven Mutual | Not generated: same file as IMG06S, a purchased copy of synthetic portrait #44812. |
| LOGO_HAVENMUTUAL | `assets/images/logo-havenmutual.svg` | 256×256 | logo | required | final file | site:havenmutual |  | Haven Mutual: a pale shield on dark teal with a simple cross. |
| LOGO_QUAYLEDGER | `assets/images/logo-quayledger.svg` | 256×256 | logo | required | final file | site:quayledger |  | Quay Ledger: an open book outline on dark brown. |
| LOGO_NORTHLAMP | `assets/images/logo-northlamp.svg` | 256×256 | logo | required | final file | site:northlamp |  | North Lamp Studio: a yellow lamp on a dark ground. |
| WEB0036 | `assets/images/web0036-faceless-hero.svg` | 1600×900 | ui | optional | final file | W-faceless-0001 |  | Abstract violet circles on a pale ground, no faces and no lettering. |
| WEB0037 | `assets/images/web0037-notes-fog.webp` | 1600×900 | photo | optional | final file | W-eastfieldnotes-0004 |  | Mara's phone photo, August 2019: fog swallowing the harbour from the Eastfield wall, a lamp post, rocks and a faint sun burning through; the far cranes are gone. Phone-camera softness and noise. No people, no lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
| WEB0038 | `assets/images/web0038-market-row.webp` | 1600×900 | photo | optional | final file | W-havenmutual-0001 |  | Market Row, Old Town: blocky brick buildings, a stationer's window with an office above and a dark teal side door, a glimpse of grey water and a mast at the end of the street. No people, blank signs, no lettering. Made with the image generator (not ComfyUI), common style prompt in graphics/sources/web-photos/STYLE.md; checked against the existing photos. |
