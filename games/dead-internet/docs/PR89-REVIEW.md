# PR #89 — gjennomgang før merge

Kontrollert 25. november 2026: PR #89 ved `50d5643703a9f7e136809e788eefb64059971383`, mot `main` ved `20d2f49`. Rettelser og dokumentasjon leveres i [PR #90](https://github.com/zirkhel/BusAdventures/pull/90), som har `casebook-step-5` som base. Ingen av PR-ene er merget eller mergegodkjent.

## Resultat av gjennomgangen

Samlet diff er gjennomgått: navneoppslag og regel P, rapportgrunnlag, migrering, UI, hjelp/tips, innhold, scenarioer, validator og tester. To konkrete mangler er rettet i #90:

1. **Store/små bokstaver:** `Pat` ble ignorert riktig, men `pat` og `PAT` ble tolket som kontoen. Parseren klassifiserer nå kontoens visningsnavn, ikke skrivemåten i teksten. Pat/Mike/Lindsay/Tom testes i tre varianter. Synlig avsender og @brukernavn beholder konto-ID og opphav; konto blir ikke person.
2. **Tidslinjebevis i rapporten:** Øyeblikksbildet lagret hendelsens tellinger, men manglet bevisreferansene. Nye rapporter fryser og viser referanse, for/mot og spillerens beviskommentar. De overlever endring, sletting og lasting. Eldre rapporter får ikke rekonstruert referanser. Feltet er valgfritt; formatet er fortsatt v12.

Ingen ny kanon, poengregel, avslutning eller tillitsregel er innført. Danas fem relevante replikker inneholder allerede «with the supporting connections you've made» i `50d5643`; Groks siste endring var pushet.

## Kontroller på rettet kode

- Navnetester: **10/10**, rapporttester: **13/13**.
- Hele Node-pakken kjørt én gang med `--test-concurrency=1`: **287/287**, ingen feil, hoppet over eller todo. Inkluderer blokkerende Dana-prober og tvillingverden.
- Full validator: **456 artefakter, 8 karakterer, 85 bilder; 0 feil, 0 advarsler**.
- Simulator: **12/12 scenarioer**; begge utforskere når Lights out med 362/463 bevis. Ingen ny separat kjøring av basegrenen; dette er ikke en ny målt paritetsrapport mot main.
- Mobil ved **390×844**: **Casebook 7/7 og tips/hjelp 1/1 bestått**, inkludert tvilling-DOM med 982 beviskort og de nye tidslinjereferansene. Casebook og tips kjøres etter hverandre og gjenbruker én Edge/Chromium-prosess, uten parallelle workers.

Fullpakken ble ikke gjentatt for dokumentasjonsendringer. Første nettleserstart i sandkassen feilet med tilgangsfeil før testene startet; den avsluttede prosessen ble ikke etterlatt. Mobilkjøringen bruker en isolert testprofil utenfor sandkassen.

## Avklarte kontrollpunkter og begrensninger

- Både Danas tekst og Daily Record-kuttet bruker `apparentSupportOf`: bare for-listen, synlige navn/opphav og rettede Supports, ett ledd. Kildekort og Same origin påvirker bare spillerens egen opptelling.
- «Synlig kandidat» betyr i eksisterende kode et undersøkt emne (`known`) eller fullt navn i lagret bevis. Skjult `mentions` eller bare registrert møte er ikke nok. Forfatterdefinerte kortformer har en eier med mindre en annen synlig kandidat passer. Dokumentasjonen beskriver denne oppførselen; ingen ny oppdagelsesregel er innført.
- Kapitalisering for løse kontofornavn er rettet. Aksenter og andre alfabet er ikke lagt til; eventuell utvidelse er en separat oppgave.
- «Show intro tips again» nullstiller sett-listen. Når tips er av, beholdes av og en tekst forklarer at bryteren må slås på. Nytt spill slår tips på; lasting og vanlig omstart beholder innstillingen. Dette er eksisterende avtalt oppførsel.
- Danas tillitsfarm og persondialog med `showSupports` gjenstår. PR #89 gjør ikke hele personsystemet lekkasjefritt. F-1/F-2 og øvrige utvidelser ligger i [BACKLOG](BACKLOG.md).

## Før merge

- [x] Mobilkontroll fullført; rapport og støttehjelp også kontrollert visuelt. 75 lokale Markdown-lenker kontrollert uten mangler.
- [ ] PR-metadata: GitHub-koblingen svarte 403, og nettleseren kunne ikke aktivere redigeringen. Beskrivelsen på GitHub er derfor utdatert; gjeldende omfang og resultater står her.
- [ ] Anders gjennomgår og gir eksplisitt mergegodkjenning.

Etter godkjenning er rekkefølgen #90 inn i `casebook-step-5`, deretter #89 inn i `main`. Ikke merge #89 alene før rettelsene er med.

## Dokumentasjonsopprydding

#90 samler gjeldende funksjon, restoppgaver og forslag. Redundante historiske fullkopier er erstattet med lenker til `50d5643`. Kanon og forfattergrunnlag er bevart. Dokumentasjonen gjør ikke tidligere assistentforslag til designgodkjenninger. #90 inneholder nå også de to kontrollrettelsene ovenfor og er derfor ikke lenger en ren dokumentasjons-PR.
