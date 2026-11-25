# Casebook — funksjon og informasjonsgrenser

Gjeldende for PR #89 ved `50d5643`, 25. november 2026. Steg 0–4 er merget; steg 5 nedenfor er implementert, men ikke merget. [Status og kontroller](PR89-REVIEW.md).

## Arbeidsflaten

Casebook er spillerens hukommelse og arbeidsflate, ikke en fasit. Evidence, Theories, Timeline og Notes har ulike oppgaver. Reports er publiserte rapporter og utviklingen i saken; sammenligning, koblinger og kildekort åpnes fra arbeidsflaten, ikke som nye faner.

| Del | Funksjon | Kjernemodul |
|---|---|---|
| Bevis | Lagrede sideversjoner, utdrag, bilder og meldinger; egne merker, notat og «Legg bort» | `casebook.js`, `workbench.js`, `provenance.js` |
| Teorier | Strukturert påstand eller egne ord; bevis for/mot, statuslogg, spørsmål og alternativer | `casebook.js`, `workbench.js` |
| Sammenligning | Synlige felt, tekst og bilder uten tolkning | `compare.js` |
| Koblinger | Spillerens uttrykkelige tolkning mellom to lagrede bevis | `workbench.js` |
| Kilder | Tillit, identitet, samme opphav, kommentar og egen opptelling | `sources.js` |
| Timeline | Spillerens dateringer, beskrivelser og bevis for/mot | `timeline.js` |
| Rapportering | Bygger, forbehold, frosset rapportgrunnlag | `reporting.js`, `casebook.js`, `game.js` |

## Bevis og teorier

Lagrede sider åpner den lagrede versjonen selv når originalen senere endres, låses eller slettes. Bokmerker i Browser er navigasjon og er adskilt fra bevis. Utdrag beholder kildehenvisningen; Notes er spillerens egne tanker.

Merker og «Legg bort» er spillerens organisering. Å legge bort er ikke sletting. About viser synlige navn i selve beviset, inkludert synlig avsender; den låner ikke navn gjennom støttekoblinger. Et kortnavn kan forklares med beviset som introduserte det.

Teorier kan ha egne ord uten en strukturert påstand, men kan da ikke publiseres. For/mot, forkastet/overbevist og spørsmål er spillerens vurderinger. De avslører ikke om teorien stemmer.

## Sammenligning og koblinger

- To eller flere elementer kan sammenlignes, også ulagrede sider. Bare lagrede bevis kan kobles.
- Forskjeller markeres nøytralt. To versjoner av samme side får avsnittsvis endringsvisning. Bilder sammenlignes ett om gangen med sammenhengende zoom på mobil.
- En kobling har nøyaktig to bevis. Supports og Possibly manipulated har retning. Contradicts, Related, Same origin og Unrelated er symmetriske. Begrunnelse er valgfri.
- «Sammenlign alle» fra en teori tar med bevis både for og mot.
- Supports kan påvirke Danas dekning og dermed publiseringskuttet gjennom [regel P](PUNKT9-SYNLIG-VURDERINGSREGEL.md). Andre koblingstyper gir ikke slik dekning.

## Kildekort og tre ulike opptellinger

Ett kort per stabil synlig kilde-ID, ikke per navn. Like navn slår ikke sammen to kilder. Spørsmålene er tillit og om kilden er den den utgir seg for: Ja, Usikker, Nei eller ubesvart. Usikker er et eget svar, ikke det samme som ubesvart. Svarene har nøytral visning.

Spillerens «Samme opphav som» og Same origin-koblinger mellom bevis grupperer kildene transitivt. Indirekte forbindelser vises med «via», og koblingene kan åpnes og endres. Avledede koblinger overskriver ikke kortets egne svar. Opptellingen beregnes på nytt når grunnlaget endres. Nei på tillit trekker ikke kilden ut av antallet.

Å legge bort et bevis skjuler ikke kildekortet. Når alle kildebevis slettes, skjules kortet, men vurderingene beholdes under kilde-ID-en.

Hold disse tingene atskilt:

1. Synlige opphav blant bevisene spilleren har koblet til teorien.
2. Spillerens egen opptelling etter grupperingen ovenfor.
3. Danas antall kvalifiserende synlige opphav etter regel P. Det kan avvike fra begge de andre.

Ingen av tallene bekrefter sannhet eller faktisk uavhengighet. Skjult opphav brukes bare i verdens vurdering, ikke på kortene.

## Rapportering i PR #89

Rapportbyggeren sier «marked as supporting by you», viser bevis mot og egne forbehold. Dana har to adskilte bokser: hennes synlige vurdering og det spilleren selv har markert. Bevis mot, forkastet teori, lavere egen opptelling og Nei på kildekortene er råd, ikke ekstra kuttregler. Lav tillit gir forklaring på hvorfor hun ikke gjennomgår materialet.

Ved publisering fryses `report.snapshot`: påstandsordlyd, egne ord, notater, bevis med begrunnelser og koblinger, tellinger, forbehold, hendelser og hva Dana kuttet. Publisert innhold og kutt vises hver for seg. Senere redigering eller sletting i Casebook omskriver ikke øyeblikksbildet. Gamle rapporter uten snapshot får ikke konstruert historiske data ved migrering.

Timeline viser spillerens egen opptelling med «in your count». Verdens poengberegning og avslutningsregler bruker fortsatt publisert innhold og kanon. Supports endrer hva som kan slippe gjennom redaksjonen; kildekort og personlige forbehold endrer ikke verdens poengregel.

## Hjelp, tips og lagring

Help i Casebook og lenken fra rapportbyggeren åpner forklaringene når som helst. Å lese hjelp påvirker ikke hvilke tips som er sett. Tips kommer ett om gangen, ved riktig funksjon. Ventende tips for en skjerm spilleren har forlatt, droppes usett.

Settings har av/på og «Show intro tips again». Sistnevnte nullstiller bare sett-listen; den slår ikke tips på hvis de er av. Nytt spill slår tips på og nullstiller introduksjonen. Lasting og omstart av appen beholder innstillingene på enheten (`ba_deadinternet_tips`). Spillagringen er v12 i PR #89, med migrering av eldre lagringer.

## Kontroller og videre arbeid

Tvillingverdener skal gi identisk synlig informasjon, Dana-vurdering, avslag og kutt når bare skjult kanon endres. Bare verdens konsekvenser etter publisering kan avvike. Se [PR-kontroller](PR89-REVIEW.md) og [restoppgaver](BACKLOG.md).

Den opprinnelige trinnplanen, gamle datamodellskisser og tidligere vurderinger ligger i [historikk](https://github.com/zirkhel/BusAdventures/blob/50d5643703a9f7e136809e788eefb64059971383/games/dead-internet/docs/CASEBOOK-DEDUCTION.md). De er ikke gjeldende API eller oppgaver.
