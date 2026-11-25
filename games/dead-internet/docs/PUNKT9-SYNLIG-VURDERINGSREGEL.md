# Dana — synlig vurderingsregel P

Implementert i PR #89 ved `50d5643`, ikke merget. Oppdatert 25. november 2026. Dette er gjeldende implementasjonsbeskrivelse, ikke en ny designgodkjenning. Tidligere L/P-forslag, prototypemålinger og beslutningsreferater er [arkivert](history/2026-11-25/docs/PUNKT9-SYNLIG-VURDERINGSREGEL.md).

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

Ordrett fra `content/strings/en.json`, `review.dana.v`, ved `50d5643`. Ved senere tekstendring oppdateres både innhold og denne oversikten. `{claim}`, `{object}` og `{n}` fylles ved visning.

- **`none`:** "{claim}": what you've marked as supporting doesn't, taken together, cover who this is about. As it stands, it doesn't go forward.

- **`one`:** "{claim}": taken together, what you've marked as supporting covers who this is about, but only from one visible origin. That's a lead, not enough to take forward. I need a second visible origin, and material that shows this, not just names them.

- **`several`:** "{claim}": taken together, the material you've marked as supporting, with the supporting connections you've made, covers who this is about, across {n} different visible origins. That's enough for me to take it to the desk, not to say it's true. Being named isn't being shown: check that each one shows this, and that they don't trace back to the same place.

- **`bold.none`:** "{claim}": that's a big claim, and what you've marked as supporting doesn't, taken together, cover who it's about. It doesn't go forward.

- **`bold.one`:** "{claim}": that's a big claim. Taken together, your material covers who it's about, but only from one visible origin. That's not enough to take forward.

- **`bold.several`:** "{claim}": a big claim. Taken together, the material you've marked as supporting, with the supporting connections you've made, covers who it's about, across {n} different visible origins, so I'll take it to the desk. That doesn't make it true. Being named isn't being shown: what else could explain what you've found?

- **`predicate.paid.none`:** "{claim}": what you've marked as supporting doesn't, taken together, cover both parties, let alone show a payment. It doesn't go forward.

- **`predicate.paid.one`:** "{claim}": taken together, your material covers both parties, but only from one visible origin. That doesn't establish a payment, and one visible origin isn't enough to take forward.

- **`predicate.paid.several`:** "{claim}": taken together, the material you've marked as supporting, with the supporting connections you've made, covers both parties, across {n} different visible origins. That's enough to take to the desk, but it doesn't establish a payment. For money I want the paper trail: an invoice, a contract, a transfer.

- **`predicate.caused.none`:** "{claim}": you want me to print that someone caused {object}? What you've marked as supporting doesn't, taken together, even cover both. It doesn't go forward.

- **`predicate.caused.one`:** "{claim}": taken together, your material covers both, but only from one visible origin. Covering both says nothing about what anyone did, and one visible origin isn't enough to take forward. Show me documents, and tell me what else could explain it.

- **`predicate.caused.several`:** "{claim}": taken together, the material you've marked as supporting, with the supporting connections you've made, covers both, across {n} different visible origins, so I'll take it to the desk. That shows they turn up in the same story, not that one caused the other. I'd need documents that show what was done and by whom, and a reason the other explanations don't fit.

- **`ownOutlet.none`:** "{claim}": first, that's my own paper, so I have a stake in this. What you've marked as supporting doesn't, taken together, cover both, so it stays out.

- **`ownOutlet.one`:** "{claim}": that's my own paper, so you should know I have a stake in this. Taken together, your material covers both, but only from one visible origin, and that isn't enough to take forward, for my paper or anyone's. Bring a second, and documents if you have them: a contract, an invoice, a payment.

- **`ownOutlet.several`:** "{claim}": that's my own paper, so you should know I have a stake in this. I'm holding it to the same rule as anyone: taken together, the material you've marked as supporting, with the supporting connections you've made, covers both, across {n} different visible origins, so it goes to the desk. That shows a connection, not what it is. Bring documents, and tell me what else it could be.

## Lekkasjetesting og gjenstående arbeid

Blokkerende tester varierer truth, supports i verden og lagrede meldinger, shuffled supports, mentions, påstandslisten, skjult proveniens og skjulte personer. De sammenligner vurdering, avslag og kutt. F2/S2-paritet kontrollerer samme regel for sann og usann påstand. Kildekort, rapportgrunnlag og visninger har egne tvillingtester.

Dette løser ikke `showSupports` i persondialogen eller Danas gjentatte tillitsøkning. Se [BACKLOG](BACKLOG.md). Hjelp og tips beskrives i [Casebook](CASEBOOK-DEDUCTION.md); de faktiske engelske tekstene ligger i `content/strings/en.json`.
