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

## Dialogoppfølging 26. november

- Iris og Theo har korte påminnelser for tidligere besvarte emner, inkludert innrømmelsene om Mara og dødsattesten. Bruker eksisterende `repeatText`; ingen nye vedlegg, bevismerker eller tillitseffekter fra påminnelsene. Eksisterende vilkår gjelder fortsatt.
- Iris’ portalsvar beholder engangsoppførselen slik at øvrige svar om Garden og Meridian fortsatt kan nås. Bevisreaksjoner og ukjente emner er ikke endret i denne deloppgaven.
- Juno har urolige standardsvar etter første og andre bevisreaksjon; eksisterende bevisreaksjoner prioriteres fortsatt, og tausheten etter tredje stadium beholdes. Dana har korte påminnelser for åtte besvarte emner; avslutningsspesifikke svar har fortsatt prioritet. Ingen nye effekter eller endrede progresjonsvilkår.
- Paul har fire korte påminnelser og et eget svar om Mara/Brightline etter den fortrolige innrømmelsen. Han vedkjenner seg samtalen, men avviser videre diskusjon på denne kontoen. Eksisterende utløsere, dokumentlevering og konsekvenser beholdes.
- Maras konto har seks emnetilpassede avledninger ved gjentatte spørsmål; Calvin har én for klientspørsmål. Den kunstige tonen beholdes. Calvins spørsmål om egen identitet beholder originalsvaret og telleren som utløser en eksisterende hendelse etter tre forsøk. Ingen ny kunnskap eller nye hendelser er lagt til.
- Endringen er ikke testkjørt, etter instruksen om ingen tester uten uttrykkelig bestilling.

## Tydeligere åpning 26. november

- Godkjent etter spilltest: åpningen spør hvem som står bak Maras konto. «Read Mara's message» åpner samtalen direkte ved nytt spill, med eksisterende introduksjonstips. Fortsettelse av lagringer beholder dagens inngang.
- Casebook viser sakens undersøkelsesspørsmål og lenke tilbake til meldingen. Innholdet ligger i sakens `start`-data; ingen spor markeres og ingen oppgaveliste legges til.
- Ikke testkjørt, inkludert mobilvisning, etter instruks.

## Kontoer uten profilside

- «View profile» åpner et felles profilkort når en konto mangler en forfattet profilside. Kortet bruker navn, brukernavn, bilde og eventuell eksisterende bio; aldri skjult operatør eller identitet.
- Kortet tilbyr kontosøk, tilgjengelige offentlige innlegg og melding når kontoen finnes i kontaktlisten. Slettede kontoer får en utilgjengelig-melding. Eksisterende profilsider beholdes.
- Ikke testkjørt eller mobilkontrollert, etter instruks.

## Hjelp og journalistkontakt 27. november

- Generell hjelp forklarer redaksjonell vurdering uten å forutsette at spilleren kjenner Dana. Den forklarer veien fra artikkelens byline til profil og melding.
- Når Dana allerede kan kontaktes, viser hjelpen og rapportbyggeren navn, journalistrolle, avis, forbehold og en knapp til samtalen. Profilsider har direkte meldingsknapp for tilgjengelige kontakter. Kontaktvilkår beholdes.
- Ingen tester eller mobilkontroll kjørt, etter instruks.

- Hjelpen har en kort oversikt over internettjenestene, med kjente sammenligninger og skillet mellom Archive, bokmerker og Casebook. Nettleseren har en fast «Seeker home»-knapp på alle skjermene; den åpner søkehjemmet og beholder tilbakehistorikken. Ikke testkjørt.

## Full nullstilling ved Start over

- Start over sletter verdens lagring og alle separate nylig-besøkt-historikker for samme verden, også fra eldre gjennomspillinger. Tips nullstilles, og automatisk lagring stoppes under omstarten. Andre spill og eksporterte filer berøres ikke.
- Nytt spill bygger standardtilstand på nytt: ingen opptjent kunnskap, meldingshistorikk, Casebook, bokmerker eller søk. Forfatterdefinert startinnhold beholdes. Ingen tester kjørt.

- Navigasjon: Home nederst går til telefonens hjemskjerm. Home øverst til venstre går alltid til aktiv apps startside (Seeker i Browser) og nullstiller appens navigasjonsstakk. Tilbake er en egen knapp når historikk finnes. Den ekstra Seeker-raden er fjernet. Ikke testkjørt.
