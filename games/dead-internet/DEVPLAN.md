# Dead Internet — status og videre arbeid

Oppdatert 25. november 2026. PR #90 og #89 er godkjent og merget til main (`6a98828`).

## Overlevering

- Fase 0–9, nettsteder W0–W8 og Casebook steg 0–4 er ferdige og merget.
- Casebook steg 0-5, Danas regel P, hjelp og tips er ferdige og merget.
- Lagringsformat: v12. Eldre lagringer migreres. Tipsinnstillinger lagres separat.
- Dokumentasjonsrydding og begge kontrollrettelser er med i main. Se [sluttrapporten](docs/PR89-REVIEW.md). Videre oppgaver finnes i [BACKLOG](docs/BACKLOG.md).
- Danas tillitsfarm og andre personers relevanslekkasjer er **ikke rettet** i PR #89. F-1/F-2 og nye saksutfall er heller ikke rettet.

## Leserekkefølge

1. [DESIGN.md](DESIGN.md): prinsipper, arkitektur og informasjonsgrenser.
2. [Casebook](docs/CASEBOOK-DEDUCTION.md) og [Danas regel P](docs/PUNKT9-SYNLIG-VURDERINGSREGEL.md): gjeldende funksjon inkludert PR #89.
3. [Nettsteder](docs/WEBSITES.md) og [inventar](docs/WEBSITE-INVENTORY.md).
4. [Restoppgaver og forslag](docs/BACKLOG.md), [sluttrapport for PR #89](docs/PR89-REVIEW.md).
5. Ved innholdsarbeid: [sakens forfattergrunnlag](docs/THE-QUIET-ACCOUNT.md), innholdsfilene og [saksavslutning](docs/CASE-ENDINGS-REVIEW.md).

Full filoversikt og dokumentenes roller: [docs/README.md](docs/README.md). Gamle faseplaner og beslutningsreferater er [historikk](https://github.com/zirkhel/BusAdventures/blob/50d5643703a9f7e136809e788eefb64059971383/games/dead-internet/DEVPLAN.md), ikke neste oppgave.

## Arbeidsregler

- Les relevant dokumentasjon og eksisterende implementasjon før endringer. Oppsummer omfang og plan først.
- Teknisk implementering, refaktorering og feilsøking kan gjøres innenfor avtalt omfang. Nye spilldesignvalg krever Anders' avklaring.
- Behold skillet mellom skjult kanon, synlig innhold og spillerens vurderinger. Ikke gjør ideer til funksjonskrav ved å omskrive dokumentasjon.
- Lever på egen branch og i en avgrenset PR. Ingen merge uten Anders' eksplisitte godkjenning.
- Oppdater disse dokumentene ved funksjonsendringer. Beskriv implementert oppførsel, åpne spørsmål og historikk hver for seg. Ikke tilskriv en assistentanbefaling brukerens godkjenning.

## Teststrategi og belastning

Full testdekning beholdes; hyppighet og parallellitet begrenses. Ingen tester slettes som del av oppryddingen.

1. Under utvikling: kjør bare tester som berører endringen, sekvensielt. Ikke full pakke etter hver liten endring.
2. Etter deloppgaven: relevante regresjonstester; tvillingverden ved Casebook, proveniens eller informasjon som vises til spilleren; én mobil røyktest ved UI-endringer.
3. Før PR: hele testpakken én gang, validator og simulator, deretter nødvendig Playwright-røyktest. Registrer commit og resultat. Gjenbruk den kjøringen når bare dokumentasjon endres etterpå; kontroller da lenker, innhold mot kode og diff. Ny kodeendring eller feil utløser relevante nye kontroller. Rapporter det som ikke er kjørt.
4. Maksimalt én Playwright-worker og én nettleser om gangen. Ingen samtidige fullpakker, kontinuerlige bakgrunnstester eller unødvendige nettleseroppstarter.
5. Hvis en test henger, undersøk den eksisterende prosessen i stedet for å starte flere. Ingen permanente globale systemendringer.

Kommandoer fra repo-roten. Velg kontroll etter endringen; listen er ikke en rutine som skal kjøres hver gang. Kjør én om gangen:

```sh
node --test --test-concurrency=1 games/dead-internet/tests/names.test.mjs
node --test --test-concurrency=1 games/dead-internet/tests/*.test.mjs
node games/dead-internet/tools/validate.mjs
node games/dead-internet/tools/simulate.mjs
node games/dead-internet/tools/test-casebook-ui.mjs
node games/dead-internet/tools/test-browser-archive-ui.mjs
node games/dead-internet/tools/test-tips-ui.mjs
```

UI-skriptene bruker Chromium og 390×844. Playwright må være tilgjengelig; skriptene støtter `PLAYWRIGHT_MODULE`. `validate.mjs --fast` hopper over simulerte spillere og blokkeringstesting og erstatter ikke full validator før en kode-PR.
