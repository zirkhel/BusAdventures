# Nettsteder og Archive — gjeldende funksjon

W0–W8 og nettsidefotografiene er merget før PR #89. Denne beskrivelsen erstatter den gamle implementeringsplanen. [Inventaret](WEBSITE-INVENTORY.md) beskriver nettstedene; [historikken](https://github.com/zirkhel/BusAdventures/blob/50d5643703a9f7e136809e788eefb64059971383/games/dead-internet/docs/WEBSITES.md) bevarer designbegrunnelser og tidligere beslutninger.

## Arkitektur og innhold

En nettside er fortsatt en artefakt med versjoner. `content/universe/sites/*.json` beskriver nettsted, domener, navigasjon, daterte design, status og 404. `core/sites.js` slår opp sider; `core/site-view.js` gir malene et hvitelistet `publicView`. Skjulte kanonfelt som `supports`, `mentions` og `source` skal ikke følge med til malene.

`app/sites/index.js` registrerer Corporate, Government, Blog, Wiki, Forum, Document, Anonymous, Landing, Legacy og Personal. Aviser bruker nyhetsvisningen og appkonfigurasjonen. Nettstedene eier innhold og utseende; Browser eier adressefelt, historikk, frem/tilbake, bokmerker, tekststørrelse og Archive.

Design velges etter sidens versjonsdato. Automatiske lister tar hensyn til synlighet og tidspunkt; cache skal ikke liste fremtidige eller skjulte sider. Manglende side, innlogging, vedlikehold, parkert domene og utilgjengelig nettsted har egne tilstander. En gammel URL kan videresende gjennom `urlAliases`; gamle registeradresser gjenkjennes også gjennom domenealias.

## Archive per adresse

- Archive er en skjerm i Browser, ikke en egen app. Den viser tilgjengelige kopier eldst først.
- «Archive copy» / «Kept by Seeker», «Live page» og «Your saved copy» har ulike roller. Spillerens lagrede helsidekopier står på egne blå rader også når arkivet har samme versjon. Utdrag, bilder og meldinger står ikke i denne listen.
- Bare tilgjengelig innhold vises. En lagret kopi kan åpnes selv etter at originalen blir låst eller slettet. En låst side avslører ikke antall utilgjengelige arkivkopier eller deres innhold. En utilgjengelig side kan tilby en kopi som allerede er tilgjengelig.
- Spilleren velger høyst to kopier og åpner «Compare text and details» i Casebook. «Compare with live» bruker den nåværende siden bare når den kan leses; en annen kopi erstatter den aldri i stillhet.
- Bilder sammenlignes separat i Casebook. Archive sammenligner tekst og synlige detaljer og forteller ikke hva forskjellene betyr.
- W8 la ikke til nye arkivversjoner. Nye kopier som endrer historien krever innholds- og kanonavklaring.

## Design som spor uten automatisk fasit

Sammenfallende design, tekst, bilder, adresse eller leverandør kan være noe spilleren undersøker. Samme mal er ikke samme opphav: uavhengige virksomheter kan kjøpe samme tema og samme stockfoto. Bakgrunnssider skal ha like gjennomført grafikk som sporsider.

Eksisterende spor omfatter Eastfield Notes' design/innholdsendring, Brightlines eldre teamside, gjenbrukte stockansikter og adresser. Lumen er ikke en automatisk avsløring. Brightlines kundecaser forblir anonyme; Maras møllebilde på Calderpedia er utsatt.

## Kanon og kontinuitet

Nye bakgrunnsfakta føres i `content/universe/background-facts.json` som `canon` eller `claim`, med opphav. En påstand på en nettside er ikke automatisk universets sannhet. Nye navn, datoer og sammenhenger trenger designavklaring.

Bevar etablerte rettelser: Harbor Festival i oktober, vinnerand nr. 3,117 i 2025, gamle juli-URL-er som videresendinger, `openfilings.org` med gammelt domenealias. Walter Brennan sitert etter sin død er et tilsiktet spor, ikke en skrivefeil. Bibliotekets eldre personalside er en alternativ vei inn, ikke et obligatorisk nytt spor. SpillCheck sjekker datalekkasjer og er ikke en lekkasjeportal.

## Videre arbeid og kontroller

Ingen nettstedsetappe venter på implementering under W0–W8. Videre innhold, navnebelastning, flere arkivkopier og eventuelle nye apper står i [BACKLOG](BACKLOG.md).

Relevante tester: `sites`, `browser`, `websites-w4` til `websites-w7`, `archive`, `url-aliases`, `threadline-profiles`, tvillingverden og mobiltestene for Casebook/Archive. Følg [teststrategien](../DEVPLAN.md#teststrategi-og-belastning); ikke kjør alle etter hver tekstendring.
