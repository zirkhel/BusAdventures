# Dana — synlig vurderingsregel P

Implementert i PR #89 ved `50d5643`, ikke merget. Oppdatert 25. november 2026. Dette er gjeldende implementasjonsbeskrivelse, ikke en ny designgodkjenning. Tidligere L/P-forslag, prototypemålinger og beslutningsreferater er [arkivert](https://github.com/zirkhel/BusAdventures/blob/50d5643703a9f7e136809e788eefb64059971383/games/dead-internet/docs/PUNKT9-SYNLIG-VURDERINGSREGEL.md).

## Grunnlag og grenser

`core/casebook.js:apparentSupportOf` brukes både av Danas vurdering og Daily Record-kuttet. Den leser påstandens subjekt/objekt, for-listens bevis, synlige navn og opphav samt spillerens rettede Supports-koblinger. Den leser ikke skjulte `supports`, `mentions`, sannhet, faktisk opphav eller listen over kanonpåstander. Kildekort, Same origin og bevis mot endrer ikke dette antallet.

Synlige navn kommer fra `core/provenance.js`: tekst, URL, tittel, kommentarer/bildetekster og eksplisitt avsender, forfatter, byline eller kommentator. Konto er ikke person. Et løst fornavn som bare er et kontovisningsnavn, tolkes ikke som kontoen; et innlegg fra @harborwalkerpat beholder likevel kontoen som avsender og opphav.

Fulle navn, brukernavn og entydige kortformer gjenkjennes. Initial + etternavn kan gjenkjennes når formen er entydig blant synlige kandidater. Skjulte personer skal ikke avgjøre tvetydighet. Kallenavn som NGD krever at et lagret bevis introduserer sammenhengen, for eksempel «Northgate Development (NGD)». Kortet viser introduksjonskilden. Legg bort beholder grunnlaget, sletting kan fjerne det. About viser bare bevisets egne navn, ikke lånte navn. Avgrensning av «synlig kandidat» og parserens bokstavregler står som [kontrollpunkter](PR89-REVIEW.md), ikke som ferdig avklarte utvidelser.

## Regel P

For hvert bevis X i påstandens for-liste:

1. X teller dersom det selv nevner alle partene.
2. Ellers teller X når spilleren har «X supports Y», Y også er i for-listen, og X og Ys egne navn til sammen dekker alle partene.

Bare X låner navn fra Y. Ingen lånte navn føres videre langs en kjede. Y teller bare på eget grunnlag eller gjennom en egen utgående støttekobling. Andre koblingstyper teller ikke. Begrunnelsen tolkes ikke, og ingen skjult kontroll avgjør om spillerens kobling gir mening.

Antallet er ulike synlige opphav blant bevisene som teller. Et bevis bidrar med sitt eget opphav. Samme opphav telles én gang; gjensidige koblinger kan gi to når dokumentene har to ulike opphav. Dette bekrefter ikke uavhengighet eller sannhet.

| Antall | Dana | Daily Record |
|---|---|---|
| 0 | Samlet dekning mangler | Kuttes |
| 1 | Ett kvalifiserende synlig opphav | Kuttes |
| 2 eller flere | Nok til å ta til desken, ikke bekreftet | Går videre |

Tillit må også oppfylle kanalens krav. Tekstvalget følger egen avis, deretter predikat, stor påstand og generell tekst; aldri kanonpåstandens identitet. Egen avis gir opplysning om interessekonflikt, ikke et generelt forbud. Tall 0–12 skrives med ord; større tall faller tilbake til sifre i dagens kode.

Verdens vurdering etter publisering bruker fortsatt kanon og reell støtte. En usann påstand kan gå gjennom samme synlige regel som en sann og få andre konsekvenser etterpå.

## Innhold og gjennomspillinger

Tre presiseringer er implementert: A17 «Stop using Mara's death for clicks.», A32 «I have mara's death certificate», Dana «I wrote Mara's death notice in July.». De foreslåtte endringene i A11 og A28 er ikke gjort. Ikke legg dem til uten avklaring.

Scenarioene lager eksplisitte Supports-koblinger, blant annet A32 → A22. Spilleren må selv trekke slutningen fra bl-ops.net. Simulatorutfall og kontrollgrunnlag står i [PR89-REVIEW](PR89-REVIEW.md).

## Danas replikker

De 15 gjeldende replikkene eies av [content/strings/en.json](../content/strings/en.json), `review.dana.v`. Dokumentasjonen dupliserer dem ikke. De beskriver samlet dekning, bruker «with the supporting connections you've made», og skiller mellom redaksjonell behandling og sannhet. Tekst ved egen avis opplyser om interessekonflikt. Ingen replikk skal omtale navnetreff som bevis for betaling eller årsak, eller ulike synlige opphav som bekreftet uavhengige.

## Lekkasjetesting og gjenstående arbeid

Blokkerende tester varierer truth, supports i verden og lagrede meldinger, shuffled supports, mentions, påstandslisten, skjult proveniens og skjulte personer. De sammenligner vurdering, avslag og kutt. F2/S2-paritet kontrollerer samme regel for sann og usann påstand. Kildekort, rapportgrunnlag og visninger har egne tvillingtester.

Dette løser ikke `showSupports` i persondialogen eller Danas gjentatte tillitsøkning. Se [BACKLOG](BACKLOG.md). Hjelp og tips beskrives i [Casebook](CASEBOOK-DEDUCTION.md); de faktiske engelske tekstene ligger i `content/strings/en.json`.
