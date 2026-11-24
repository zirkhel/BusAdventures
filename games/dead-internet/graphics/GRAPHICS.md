# Dead Internet — grafikkoversikt

_Generert fra `graphics/catalog.json` av `tools/graphics-report.mjs`. Rediger katalogen, ikke denne fila._

Production list for Dead Internet graphics. Ids are stable and used by the world (content/universe/images.json). Replace a file by saving it under the same name; no code changes. Order matters: generate originals before the copies derived from them.

## Stil
- **photo:** Realistic smartphone photo, natural light, slight noise, no text overlays, no real brands.
- **profile:** Square avatar, realistic, as a person would choose for themselves. Synthetic personas: subtly too smooth, with one visible AI tell.
- **ui:** Fictional interface, original design, no resemblance to real products.

## Faste karakterer
- **mara:** Woman, 34, warm round face, freckles, short dark curly hair, small silver hoop earrings, green parka. Use one fixed face reference for every image of Mara.

## Slik byttes et bilde
1. Lag bildet etter beskrivelsen og lagre det med nøyaktig filnavn og størrelse fra tabellen.
2. Bilder som er avledet av et original (beskåret, speilvendt) lages ved å bearbeide originalen, ikke ved å generere på nytt. Ellers finner ikke bildesøket i spillet sammenhengen.
3. Sett `status` til `final` i katalogen og kjør `node games/dead-internet/tools/validate.mjs`.
4. Inntil fila finnes, bruker spillet `assets/placeholders/<ID>.svg` (lages av `tools/make-placeholders.mjs`).

## Produksjonsrekkefølge
IMG02 → IMG01 → IMG03 → IMG04S → IMG04 → IMG05O → IMG05 → IMG06S → IMG06 → IMG07 → IMG08 → IMG09 → IMG10 → IMG11 → IMG12 → IMG13 → IMG14 → IMG15 → IMG16 → IMG17 → IMG18 → IMG19 → IMG20 → IMG21 → IMG22 → IMG23 → LOGO_SEEKER → LOGO_CONNECT → LOGO_THREADLINE → LOGO_DAILYRECORD → LOGO_BRIGHTLINE → LOGO_NORTHGATE → LOGO_CITY → LOGO_SPILLCHECK → LOGO_FACELESS → LOGO_DOCSHARE

## Alle bilder
| ID | Fil | Størrelse | Type | Status | Brukt i | Avhengighet | Beskrivelse |
|---|---|---|---|---|---|---|---|
| IMG02 | `assets/images/img02-mill-sign-original.webp` | 1080×1350 | photo | placeholder | A33 | original for IMG01 | Sunrise, old brick textile mill roof with a large painted metal sign 'CALDER MILL — EST. 1887'. Wide shot with the harbour on the left and a lamp post on the right. |
| IMG01 | `assets/images/img01-mill-sign-crop.webp` | 1080×1080 | photo | placeholder | A05 | from IMG02: crop: square, centred on the sign; lamp post cut off | Not generated: crop of IMG02. Keep pixels identical so image search can match. |
| IMG03 | `assets/images/img03-sign-removal.webp` | 1600×1067 | photo | placeholder | A13 |  | Overcast press photo: a crane lifts the CALDER MILL — EST. 1887 sign off the roof. Small crowd behind a barrier. Same sign design as IMG02. |
| IMG04S | `assets/images/img04s-stock-51007.webp` | 1024×1024 | portrait | placeholder | A31B | original for IMG04 | Synthetic stock portrait: friendly woman, 30s, outdoors, soft bokeh. AI tell: left earring is a hoop, right earring is a stud; hair melts into the background above the ear. |
| IMG04 | `assets/images/img04-juno-profile.webp` | 512×512 | profile | placeholder | A07 | from IMG04S: crop: head and shoulders, resized | Not generated: crop of IMG04S. |
| IMG05O | `assets/images/img05o-garden-original.webp` | 1080×1350 | photo | placeholder | A36 | original for IMG05 | Community garden raised beds in June, tomato plants, a crooked hand-painted wooden sign reading 'PLOT 12'. A woman's hand (Mara: silver ring, green parka sleeve) at the edge of the frame. |
| IMG05 | `assets/images/img05-garden-mirrored.webp` | 1080×1080 | photo | placeholder | A37 | from IMG05O: mirror horizontally, then square crop that removes the hand | Not generated: mirrored crop of IMG05O. The sign must read backwards ('21 TOLP'). |
| IMG06S | `assets/images/img06s-stock-44812.webp` | 1024×1024 | portrait | placeholder | A31 | original for IMG06 | Synthetic stock portrait: corporate man, 40s, warm smile, grey studio background. AI tells: two different earrings, collar asymmetry, overly smooth skin. |
| IMG06 | `assets/images/img06-calvin-profile.webp` | 512×512 | profile | placeholder | A09, acc_calvinmarsh | from IMG06S: crop: head and shoulders | Not generated: crop of IMG06S. |
| IMG07 | `assets/images/img07-kestrel-van.webp` | 1080×810 | photo | placeholder | A16 |  | Grainy phone photo of a white delivery van with a fictional falcon logo and 'KESTREL'. A red hand-drawn circle around the logo. |
| IMG08 | `assets/images/img08-brightline-team.webp` | 1600×900 | composite | placeholder | A20 |  | Eleven people smiling on a lawn, corporate offsite. Deliberate composite: the same woman appears twice (left and far right). Calvin (face of IMG06S) and a woman in the centre cast no shadows, everyone else's shadow falls left. Errors must be visible when zoomed on a phone. |
| IMG09 | `assets/images/img09-garden-dashboard.webp` | 1080×1440 | screenshot | placeholder | A23 |  | Phone photo of a laptop screen (moiré) showing a dashboard titled 'THE GARDEN — Port Calder': 41 active personas, dormant inventory 11,402, client NGD, list with MARA_Q and JUNO_P. Build as HTML, then photograph or render. |
| IMG10 | `assets/images/img10-invoice.webp` | 1240×1754 | scan | placeholder | A25 |  | Scanned invoice: BRIGHTLINE MEDIA LLC, INVOICE CSP-EF-Q1, bill to Northgate Development attn. P. Navarro, $21,000, payable to Meridian Holdings Ltd. Slightly skewed scan. |
| IMG11 | `assets/images/img11-mara-harbour.webp` | 1080×1350 | photo | placeholder | A06 |  | Mara (fixed reference) laughing at the harbour in summer 2023, slightly blurry, taken by her brother. |
| IMG12 | `assets/images/img12-waterfront-render.webp` | 1600×900 | render | placeholder | A40 |  | Glossy architectural rendering: four glass towers on a harbour, happy people, the old mill sign mounted in a glass lobby. |
| IMG13 | `assets/images/img13-mara-profile.webp` | 512×512 | profile | placeholder | A02, acc_maraquinn |  | Mara (fixed reference), 2021, library shelves behind her, real and slightly imperfect. |
| IMG14 | `assets/images/img14-theo-profile.webp` | 512×512 | profile | placeholder | A06 |  | Man, 29, Mara's brother (same freckles), tired eyes, hoodie, dim room. |
| IMG15 | `assets/images/img15-dana-profile.webp` | 512×512 | profile | placeholder | A51 |  | Woman, 41, reporter, reading glasses on her head, newsroom background. |
| IMG16 | `assets/images/img16-truthseeker.webp` | 512×512 | profile | placeholder | acc_truthseeker |  | Low-res photo of a rusty mill gear, heavy JPEG compression. |
| IMG17 | `assets/images/img17-iris-profile.webp` | 512×512 | profile | placeholder | A08 |  | Woman, 26, half her face hidden behind a coffee cup, window light. |
| IMG18 | `assets/images/img18-paul-profile.webp` | 512×512 | profile | placeholder | A52 |  | Man, 47, corporate headshot, navy jacket, real (not synthetic: small skin flaws). |
| IMG19 | `assets/images/img19-renee-avatar.webp` | 512×512 | profile | placeholder | A10 |  | Brightline logo on a gradient. No face. |
| IMG20 | `assets/images/img20-mike-profile.webp` | 512×512 | profile | placeholder | A54 |  | Synthetic dad, 40s, at a grill. Slightly too perfect. |
| IMG21 | `assets/images/img21-pat-profile.webp` | 512×512 | profile | placeholder | A55 |  | Back of a person walking a dog on a foggy harbour path. Face not visible. |
| IMG22 | `assets/images/img22-lindsay-profile.webp` | 512×512 | profile | placeholder | A56 |  | Real woman, 2019 photo, cat on her shoulder, slightly dated phone quality. |
| IMG23 | `assets/images/img23-priya-profile.webp` | 512×512 | profile | placeholder | A57 |  | Woman, 30s, children's librarian, colourful cardigan, picture books. |
| LOGO_SEEKER | `assets/images/logo-seeker.svg` | 256×256 | logo | placeholder |  |  | Search engine: magnifier forming a stylised eye. |
| LOGO_CONNECT | `assets/images/logo-connect.svg` | 256×256 | logo | placeholder |  |  | Social network: two interlocking rounded speech shapes. |
| LOGO_THREADLINE | `assets/images/logo-threadline.svg` | 256×256 | logo | placeholder |  |  | Forum: a single thread line looping into a T. |
| LOGO_DAILYRECORD | `assets/images/logo-dailyrecord.svg` | 512×128 | logo | placeholder |  |  | Newspaper masthead 'The Daily Record', serif. |
| LOGO_BRIGHTLINE | `assets/images/logo-brightline.svg` | 256×256 | logo | placeholder |  |  | Agency: a bright horizontal line rising into a sunrise. |
| LOGO_NORTHGATE | `assets/images/logo-northgate.svg` | 256×256 | logo | placeholder |  |  | Developer: an arch with a north arrow. |
| LOGO_CITY | `assets/images/logo-city.svg` | 256×256 | logo | placeholder |  |  | Port Calder city seal: lighthouse and gear. |
| LOGO_SPILLCHECK | `assets/images/logo-spillcheck.svg` | 256×256 | logo | placeholder |  |  | A dripping padlock. |
| LOGO_FACELESS | `assets/images/logo-faceless.svg` | 256×256 | logo | placeholder |  |  | An empty oval face outline. |
| LOGO_DOCSHARE | `assets/images/logo-docshare.svg` | 256×256 | logo | placeholder |  |  | A folded document with a link chain. |
