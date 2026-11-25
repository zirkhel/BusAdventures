# Dead Internet — status og videre arbeid

Oppdatert 25. november 2026. PR #90 og #89 er godkjent og merget til main (`6a98828`).

## Overlevering

- Fase 0–9, nettsteder W0–W8 og Casebook steg 0–4 er ferdige og merget.
- Casebook steg 0-5, Danas regel P, hjelp og tips er ferdige og merget.
- Lagringsformat: v12. Eldre lagringer migreres. Tipsinnstillinger lagres separat.
- Dokumentasjonsrydding og begge kontrollrettelser er med i main. Se [sluttrapporten](docs/PR89-REVIEW.md). Videre oppgaver finnes i [BACKLOG](docs/BACKLOG.md).
- Danas tillitsfarm er rettet og merget i PR #92. Neste avgrensede oppfølging er Owens godkjente svar på ukjente emner og gjentakelser, på `codex/owen-dialogue-memory`. Relevanslekkasjer, hendelsesstyrt dialogutvikling og F-1/F-2 gjenstår. Se BACKLOG.

## Leserekkefølge

1. [DESIGN.md](DESIGN.md): prinsipper, arkitektur og informasjonsgrenser.
2. [Casebook](docs/CASEBOOK-DEDUCTION.md) og [Danas regel P](docs/PUNKT9-SYNLIG-VURDERINGSREGEL.md): gjeldende funksjon inkludert PR #89.
3. [Nettsteder](docs/WEBSITES.md) og [inventar](docs/WEBSITE-INVENTORY.md).
4. [Restoppgaver og forslag](docs/BACKLOG.md), [sluttrapport før PR #89](docs/PR89-REVIEW.md).
5. Ved innholdsarbeid: [sakens forfattergrunnlag](docs/THE-QUIET-ACCOUNT.md), innholdsfilene og [saksavslutning](docs/CASE-ENDINGS-REVIEW.md).

Full filoversikt og dokumentenes roller: [docs/README.md](docs/README.md). Gamle faseplaner og beslutningsreferater er [historikk](https://github.com/zirkhel/BusAdventures/blob/50d5643703a9f7e136809e788eefb64059971383/games/dead-internet/DEVPLAN.md), ikke neste oppgave.

## Arbeidsregler

- Les relevant dokumentasjon og eksisterende implementasjon før endringer. Oppsummer omfang og plan først.
- Teknisk implementering, refaktorering og feilsøking kan gjøres innenfor avtalt omfang. Nye spilldesignvalg krever Anders' avklaring.
- Behold skillet mellom skjult kanon, synlig innhold og spillerens vurderinger. Ikke gjør ideer til funksjonskrav ved å omskrive dokumentasjon.
- Lever på egen branch og i en avgrenset PR. Ingen merge uten Anders' eksplisitte godkjenning.
- Oppdater disse dokumentene ved funksjonsendringer. Beskriv implementert oppførsel, åpne spørsmål og historikk hver for seg. Ikke tilskriv en assistentanbefaling brukerens godkjenning.

## Teststrategi og belastning

Oppdatert etter Anders sin instruks 26. november 2026: **Ingen tester skal kjøres uten at Anders uttrykkelig ber om det.** Dette erstatter tidligere automatiske testkrav under utvikling og før PR. Det gjelder også fullpakken, validator, simulator og mobiltester.

- Behold testene; ikke reduser dekningen ved å slette dem.
- Ved uttrykkelig bestilling: kjør bare avtalt omfang, sekvensielt. Maksimalt én Playwright-worker og én nettleser om gangen.
- Ikke start kontinuerlige bakgrunnstester eller nye kopier av en test som henger.
- Gjenbruk eksisterende resultater når de gjelder samme kode. Oppgi tydelig hva som ikke er testet.
- Ingen permanente endringer i globale systeminnstillinger.
