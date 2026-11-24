# Dead Internet — grafikkoversikt

_Generert fra `graphics/catalog.json` av `tools/graphics-report.mjs`. Rediger katalogen, ikke denne fila._

Production list for Dead Internet graphics. Ids are stable and used by the world (content/universe/images.json). Replace a file by saving it under the same name; no code changes. Order matters: generate originals before the copies derived from them.

## Stil
- **photo:** Realistic smartphone photo, natural light, slight noise, no text overlays, no real brands.
- **profile:** Square avatar, realistic, as a person would choose for themselves. Synthetic personas: subtly too smooth, with one visible AI tell.
- **ui:** Fictional interface, original design, no resemblance to real products.

## Faste karakterer
- **mara:** Woman, 34, warm round face, freckles, short dark curly hair, small silver hoop earrings, green parka. Use one fixed face reference for every image of Mara.
- **theo:** Man, 29, Mara's brother: same freckles and dark curly hair, cut short. Tired eyes, grey hoodie. Use one face reference.
- **dana:** Woman, 41, reporter: reading glasses pushed up, ink on one finger, cardigan. Use one face reference.
- **owen:** Man, 63, former mill worker: weathered face, flat cap, thick glasses. Only seen in his own photos (low quality).
- **iris:** Woman, 26, writer: never shows her whole face. Coffee cups, window light, hands.

## Slik byttes et bilde
1. Lag bildet etter beskrivelsen og lagre det med nøyaktig filnavn og størrelse fra tabellen.
2. Bilder som er avledet av et original (beskåret, speilvendt) lages ved å bearbeide originalen, ikke ved å generere på nytt. Ellers finner ikke bildesøket i spillet sammenhengen.
3. Sett `status` til `final` i katalogen og kjør `node games/dead-internet/tools/validate.mjs`.
4. Inntil fila finnes, bruker spillet `assets/placeholders/<ID>.svg` (lages av `tools/make-placeholders.mjs`).

## Status
- Påkrevd: 50 bilder. Valgfritt: 11. Ferdige filer: 0.
- «face: X» betyr at bildet viser en fast person. Lag først én ansiktsreferanse per person (se Faste karakterer) og bruk den i alle bildene av vedkommende.
- «needs X» betyr at bildet lages fra X (for eksempel et profilbilde laget av en logo).

## Produksjonsrekkefølge
IMG02 → IMG01 → IMG03 → IMG04S → IMG04 → IMG05O → IMG05 → IMG06S → IMG06 → IMG07 → IMG08 → IMG09 → IMG10 → IMG11 → IMG12 → IMG13 → IMG14 → IMG15 → IMG16 → IMG17 → IMG18 → IMG19 → IMG20 → IMG21 → IMG22 → IMG23 → LOGO_SEEKER → LOGO_CONNECT → LOGO_THREADLINE → LOGO_DAILYRECORD → LOGO_BRIGHTLINE → LOGO_NORTHGATE → LOGO_CITY → LOGO_SPILLCHECK → LOGO_FACELESS → LOGO_DOCSHARE → NIMG0001 → NIMG0002 → NIMG0003 → NIMG0004 → NIMG0005 → LOGO_UNFILTERED → LOGO_KESTREL → LOGO_CALDERPEDIA → LOGO_EASTFIELDNOTES → LOGO_UNFILTERED_ICON → LOGO_DAILYRECORD_ICON → IMG24 → AVA_NORTHGATE → AVA_BRIGHTLINE → DRP01 → DRP02 → DRP03 → DRP04 → DRP05 → DRP06 → DRP07 → UFP01 → UFP02 → UFP03 → UFP04

## Alle bilder
| ID | Fil | Størrelse | Type | Prioritet | Status | Brukt i | Avhengighet | Beskrivelse |
|---|---|---|---|---|---|---|---|---|
| IMG02 | `assets/images/img02-mill-sign-original.webp` | 1080×1350 | photo | required | placeholder | A33 | original for IMG01 | Sunrise, old brick textile mill roof with a large painted metal sign 'CALDER MILL — EST. 1887'. Wide shot with the harbour on the left and a lamp post on the right. |
| IMG01 | `assets/images/img01-mill-sign-crop.webp` | 1080×1080 | photo | required | placeholder | A05 | from IMG02: crop: square, centred on the sign; lamp post cut off | Not generated: crop of IMG02. Keep pixels identical so image search can match. |
| IMG03 | `assets/images/img03-sign-removal.webp` | 1600×1067 | photo | required | placeholder | A13 |  | Overcast press photo: a crane lifts the CALDER MILL — EST. 1887 sign off the roof. Small crowd behind a barrier. Same sign design as IMG02. |
| IMG04S | `assets/images/img04s-stock-51007.webp` | 1024×1024 | portrait | required | placeholder | A31B | original for IMG04 | Synthetic stock portrait: friendly woman, 30s, outdoors, soft bokeh. AI tell: left earring is a hoop, right earring is a stud; hair melts into the background above the ear. |
| IMG04 | `assets/images/img04-juno-profile.webp` | 512×512 | profile | required | placeholder | A07 | from IMG04S: crop: head and shoulders, resized | Not generated: crop of IMG04S. |
| IMG05O | `assets/images/img05o-garden-original.webp` | 1080×1350 | photo | required | placeholder | A36 | original for IMG05 | Community garden raised beds in June, tomato plants, a crooked hand-painted wooden sign reading 'PLOT 12'. A woman's hand (Mara: silver ring, green parka sleeve) at the edge of the frame. |
| IMG05 | `assets/images/img05-garden-mirrored.webp` | 1080×1080 | photo | required | placeholder | A37 | from IMG05O: mirror horizontally, then square crop that removes the hand | Not generated: mirrored crop of IMG05O. The sign must read backwards ('21 TOLP'). |
| IMG06S | `assets/images/img06s-stock-44812.webp` | 1024×1024 | portrait | required | placeholder | A31 | original for IMG06 | Synthetic stock portrait: corporate man, 40s, warm smile, grey studio background. AI tells: two different earrings, collar asymmetry, overly smooth skin. |
| IMG06 | `assets/images/img06-calvin-profile.webp` | 512×512 | profile | required | placeholder | A09, acc_calvinmarsh | from IMG06S: crop: head and shoulders | Not generated: crop of IMG06S. |
| IMG07 | `assets/images/img07-kestrel-van.webp` | 1080×810 | photo | required | placeholder | A16 |  | Grainy phone photo of a white delivery van with a fictional falcon logo and 'KESTREL'. A red hand-drawn circle around the logo. |
| IMG08 | `assets/images/img08-brightline-team.webp` | 1600×900 | composite | required | placeholder | A20 |  | Eleven people smiling on a lawn, corporate offsite. Deliberate composite: the same woman appears twice (left and far right). Calvin (face of IMG06S) and a woman in the centre cast no shadows, everyone else's shadow falls left. Errors must be visible when zoomed on a phone. |
| IMG09 | `assets/images/img09-garden-dashboard.webp` | 1080×1440 | screenshot | required | placeholder | A23 |  | Phone photo of a laptop screen (moiré) showing a dashboard titled 'THE GARDEN — Port Calder': 41 active personas, dormant inventory 11,402, client NGD, list with MARA_Q and JUNO_P. Build as HTML, then photograph or render. |
| IMG10 | `assets/images/img10-invoice.webp` | 1240×1754 | scan | required | placeholder | A25 |  | Scanned invoice: BRIGHTLINE MEDIA LLC, INVOICE CSP-EF-Q1, bill to Northgate Development attn. P. Navarro, $21,000, payable to Meridian Holdings Ltd. Slightly skewed scan. |
| IMG11 | `assets/images/img11-mara-harbour.webp` | 1080×1350 | photo | required | placeholder | A06 | face: mara | Mara (fixed reference) laughing at the harbour in summer 2023, slightly blurry, taken by her brother. |
| IMG12 | `assets/images/img12-waterfront-render.webp` | 1600×900 | render | required | placeholder | A40 |  | Glossy architectural rendering: four glass towers on a harbour, happy people, the old mill sign mounted in a glass lobby. |
| IMG13 | `assets/images/img13-mara-profile.webp` | 512×512 | profile | required | placeholder | A02, acc_maraquinn | face: mara | Mara (fixed reference), 2021, library shelves behind her, real and slightly imperfect. |
| IMG14 | `assets/images/img14-theo-profile.webp` | 512×512 | profile | required | placeholder | A06 | face: theo | Man, 29, Mara's brother (same freckles), tired eyes, hoodie, dim room. |
| IMG15 | `assets/images/img15-dana-profile.webp` | 512×512 | profile | required | placeholder | A51 | face: dana | Woman, 41, reporter, reading glasses on her head, newsroom background. |
| IMG16 | `assets/images/img16-truthseeker.webp` | 512×512 | profile | required | placeholder | acc_truthseeker |  | Low-res photo of a rusty mill gear, heavy JPEG compression. |
| IMG17 | `assets/images/img17-iris-profile.webp` | 512×512 | profile | required | placeholder | A08 | face: iris | Woman, 26, half her face hidden behind a coffee cup, window light. |
| IMG18 | `assets/images/img18-paul-profile.webp` | 512×512 | profile | required | placeholder | A52 |  | Man, 47, corporate headshot, navy jacket, real (not synthetic: small skin flaws). |
| IMG19 | `assets/images/img19-renee-avatar.webp` | 512×512 | profile | required | placeholder | A10 |  | Brightline logo on a gradient. No face. |
| IMG20 | `assets/images/img20-mike-profile.webp` | 512×512 | profile | required | placeholder | A54 |  | Synthetic dad, 40s, at a grill. Slightly too perfect. |
| IMG21 | `assets/images/img21-pat-profile.webp` | 512×512 | profile | required | placeholder | A55 |  | Back of a person walking a dog on a foggy harbour path. Face not visible. |
| IMG22 | `assets/images/img22-lindsay-profile.webp` | 512×512 | profile | required | placeholder | A56 |  | Real woman, 2019 photo, cat on her shoulder, slightly dated phone quality. |
| IMG23 | `assets/images/img23-priya-profile.webp` | 512×512 | profile | required | placeholder | A57 |  | Woman, 30s, children's librarian, colourful cardigan, picture books. |
| LOGO_SEEKER | `assets/images/logo-seeker.svg` | 256×256 | logo | required | placeholder |  |  | Search engine: magnifier forming a stylised eye. |
| LOGO_CONNECT | `assets/images/logo-connect.svg` | 256×256 | logo | required | placeholder |  |  | Social network: two interlocking rounded speech shapes. |
| LOGO_THREADLINE | `assets/images/logo-threadline.svg` | 256×256 | logo | required | placeholder |  |  | Forum: a single thread line looping into a T. |
| LOGO_DAILYRECORD | `assets/images/logo-dailyrecord.svg` | 512×128 | logo | required | placeholder |  |  | Newspaper masthead 'The Daily Record', serif. |
| LOGO_BRIGHTLINE | `assets/images/logo-brightline.svg` | 256×256 | logo | required | placeholder |  |  | Agency: a bright horizontal line rising into a sunrise. |
| LOGO_NORTHGATE | `assets/images/logo-northgate.svg` | 256×256 | logo | required | placeholder |  |  | Developer: an arch with a north arrow. |
| LOGO_CITY | `assets/images/logo-city.svg` | 256×256 | logo | required | placeholder |  |  | Port Calder city seal: lighthouse and gear. |
| LOGO_SPILLCHECK | `assets/images/logo-spillcheck.svg` | 256×256 | logo | required | placeholder |  |  | A dripping padlock. |
| LOGO_FACELESS | `assets/images/logo-faceless.svg` | 256×256 | logo | required | placeholder |  |  | An empty oval face outline. |
| LOGO_DOCSHARE | `assets/images/logo-docshare.svg` | 256×256 | logo | required | placeholder |  |  | A folded document with a link chain. |
| NIMG0001 | `assets/images/nimg0001-festival-crowd.webp` | 1600×1067 | photo | required | placeholder | DR-2025-0322 | original for NIMG0002 | Press photo, rainy afternoon: a dense crowd with umbrellas on a harbor pier, fish-and-chips stall on the right edge, a lone blue umbrella in an empty bottom-left corner by the stall. |
| NIMG0002 | `assets/images/nimg0002-festival-crop.webp` | 1080×1080 | photo | required | placeholder | UF-2025-0052 | from NIMG0001: crop: square, bottom-left corner by the fish stall, only the blue umbrella and a few people | Not generated: crop of NIMG0001. Keep pixels identical so image search can match. |
| NIMG0003 | `assets/images/nimg0003-north-dock.webp` | 1600×1067 | photo | required | placeholder | DR-2025-0101, UF-2025-0007 |  | Overcast morning, small wooden ferry dock on concrete pylons, one pylon visibly darker at the waterline, a ferry waiting offshore. |
| NIMG0004 | `assets/images/nimg0004-blackout-street.webp` | 1600×1067 | photo | required | placeholder | DR-2026-0058 |  | Night, a dark town street with dead traffic lights, car headlights and one bus with interior flashlights. |
| NIMG0005 | `assets/images/nimg0005-warehouse-smoke.webp` | 1080×1350 | photo | required | placeholder | DR-2026-0031, UF-2026-0004 |  | Pre-dawn phone photo: grey smoke from the loading bay of a long brick warehouse, one fire engine, wet tarmac. |
| LOGO_UNFILTERED | `assets/images/logo-unfiltered.svg` | 512×128 | logo | required | placeholder | app:unfiltered, platform:unfiltered |  | Masthead 'UNFILTERED' in heavy condensed capitals, acid-yellow on black, one letter slightly misaligned as if stamped. |
| LOGO_KESTREL | `assets/images/logo-kestrel.svg` | 256×256 | logo | required | placeholder | platform:kestrel_site, A38 |  | Delivery company: a stylised kestrel in flight over a road line, orange and charcoal. |
| LOGO_CALDERPEDIA | `assets/images/logo-calderpedia.svg` | 256×256 | logo | required | placeholder | platform:calderpedia |  | Local wiki: a puzzle-globe made of harbour tiles, grey and blue. Must not resemble any real wiki logo. |
| LOGO_EASTFIELDNOTES | `assets/images/logo-eastfieldnotes.svg` | 512×128 | logo | required | placeholder | platform:eastfieldnotes, acc_eastfieldnotes |  | Hand-drawn blog header 'Eastfield Notes' with a tiny drawing of the mill sign. Warm, amateur, made by Mara. |
| LOGO_UNFILTERED_ICON | `assets/images/logo-unfiltered-icon.svg` | 512×512 | logo | required | placeholder | app:unfiltered |  | App icon: 'UF' in acid yellow on black, same type as the masthead. |
| LOGO_DAILYRECORD_ICON | `assets/images/logo-dailyrecord-icon.svg` | 512×512 | logo | required | placeholder | app:dailyrecord |  | App icon: serif 'DR' on warm paper, thin black rule under it. |
| IMG24 | `assets/images/img24-owen-connect.webp` | 512×512 | profile | required | placeholder | A58, acc_owenpike | face: owen | Owen (fixed description), selfie from below in a car, flat cap, flash on, low quality. Real, unflattering, sincere. |
| AVA_NORTHGATE | `assets/images/ava-northgate.webp` | 512×512 | profile | required | placeholder | A65, acc_northgate | needs LOGO_NORTHGATE | Northgate's Connect avatar: the Northgate logo on white, crisp. Made from LOGO_NORTHGATE. |
| AVA_BRIGHTLINE | `assets/images/ava-brightline.webp` | 512×512 | profile | required | placeholder | A64, acc_brightline, A10 | needs LOGO_BRIGHTLINE | Brightline's Connect avatar: the Brightline sunrise line on a soft gradient. Made from LOGO_BRIGHTLINE. Renee Okafor's avatar (IMG19) is the same file. |
| DRP01 | `assets/images/drp01-staff.webp` | 512×512 | profile | optional | placeholder | acc_dr_tadeyemi |  | Daily Record staff photo, same grey studio backdrop and light for all seven. Man, 38, city hall reporter, rolled sleeves, notebook in shirt pocket. |
| DRP02 | `assets/images/drp02-staff.webp` | 512×512 | profile | optional | placeholder | acc_dr_lhart |  | Daily Record staff photo, same grey studio backdrop and light for all seven. Woman, 45, business editor, short grey bob, blazer. |
| DRP03 | `assets/images/drp03-staff.webp` | 512×512 | profile | optional | placeholder | acc_dr_bwhitlow |  | Daily Record staff photo, same grey studio backdrop and light for all seven. Man, 31, technology reporter, beard, headphones round his neck. |
| DRP04 | `assets/images/drp04-staff.webp` | 512×512 | profile | optional | placeholder | acc_dr_rcalloway |  | Daily Record staff photo, same grey studio backdrop and light for all seven. Woman, 60, culture writer, bright scarf, laughing. |
| DRP05 | `assets/images/drp05-staff.webp` | 512×512 | profile | optional | placeholder | acc_dr_mvane |  | Daily Record staff photo, same grey studio backdrop and light for all seven. Man, 55, columnist, tie loosened, sceptical eyebrow. |
| DRP06 | `assets/images/drp06-staff.webp` | 512×512 | profile | optional | placeholder | acc_dr_jsoto |  | Daily Record staff photo, same grey studio backdrop and light for all seven. Woman, 34, public safety reporter, rain jacket, outdoors. |
| DRP07 | `assets/images/drp07-staff.webp` | 512×512 | profile | optional | placeholder | acc_dr_efitch |  | Daily Record staff photo, same grey studio backdrop and light for all seven. Woman, 67, obituaries writer, cardigan, kind face, library behind her. |
| UFP01 | `assets/images/ufp01-unfiltered.webp` | 512×512 | profile | optional | placeholder | acc_uf_redactor |  | Unfiltered writer avatar. A black bar over a printed line of text. No face. |
| UFP02 | `assets/images/ufp02-unfiltered.webp` | 512×512 | profile | optional | placeholder | acc_uf_nightdesk |  | Unfiltered writer avatar. A desk lamp in a dark room, one green bulb. No face. |
| UFP03 | `assets/images/ufp03-unfiltered.webp` | 512×512 | profile | optional | placeholder | acc_uf_corawick |  | Unfiltered writer avatar. Woman, 40s, in profile against a window, face in shadow. |
| UFP04 | `assets/images/ufp04-unfiltered.webp` | 512×512 | profile | optional | placeholder | acc_uf_static |  | Unfiltered writer avatar. TV static with a faint shape in it. No face. |
