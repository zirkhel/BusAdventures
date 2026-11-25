# Medier — implementert grunnlag og senere TokTok

25. november 2026. Filnavnet beholdes for eksisterende lenker. U0/U1, mediekjernen M1 og nyhetsappene M2 er implementert og merget. TokTok-grensesnitt og videoproduksjon M3/M4 gjenstår; dette er ikke en pågående implementeringsoppgave.

## Det som finnes

- Ett vedvarende univers med mysteriepakker. Flere saker kan ha egne forutsetninger, frister, påstander og narrative lag. Bevis klassifiseres av spilleren og kan tilhøre én, flere eller ingen saker.
- The Daily Record og Unfiltered bruker `app/apps/news.js` med egne logoer, temaer, seksjoner, artikler, bylines og kommentarer. Artiklene er de samme artefaktene som i Browser.
- Mediemodellen støtter videoobjekter, transkripsjoner, nøkkelbilder, metadata og transformasjoner. Dette betyr ikke at TokTok-appen er ferdig.
- `core/feed.js` bruker synlige egenskaper og eksplisitt interaksjon, ikke etterforskningsrelevans eller Seeker-søkehistorikk. Scrolling flytter ikke tiden.
- Delte innholdsbassenger kan gjenbrukes. Et mysterium må eksplisitt registrere bakgrunnsinnhold som bevis hvis det skal støtte mysteriets påstander i verdens vurdering.

## Rammer for senere arbeid

TokTok skal gjenbruke kontoer, artefaktversjoner, bilder og søk. Ingen bevis skal bare kunne finnes gjennom scrolling. Tilfeldige bakgrunnskontoer avgjør ikke om det finnes ekte mennesker igjen på nettet. Ingen sannhetskvote per avis.

Planrammene er 3–5 valgfrie klipp med spor i The Quiet Account, som fortsatt må kunne løses uten TokTok. Første produksjonsrunde er 20–30 ekte klipp, med plassholdere ellers; arkitekturen skal tåle minst 150. Videre produksjon følger kvalitet og ytelse. Dette dokumentet godkjenner ikke nye manus, kanon eller en ny produksjonsmetode.

For You, Following, profil, kommentarer, deling, metadata, transkripsjon og søk via nøkkelbilder er den beskrevne senere retningen. UI, innholdsproduksjon og prioritering avklares før start. [BACKLOG](BACKLOG.md) er oppgavelisten.

## Historikk

Den [opprinnelige medieplanen](history/2026-11-25/docs/MEDIA-APPS-PROPOSAL.md) bevarer datamodellforslag, fortellingslag og godkjenningsreferater. Gamle faseplasseringer, størrelsesanslag og «ingenting implementert» gjelder ikke dagens kode. Ikke kopier gamle JSON-skisser som om de var et API; sjekk innholdsmodellen og validatoren først.
