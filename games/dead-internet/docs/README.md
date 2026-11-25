# Dokumentoversikt

Oppdatert 25. november 2026 etter godkjent merge av PR #89 og #90 til main (`6a98828`). Nye designvalg og senere merger krever fortsatt godkjenning fra Anders.

## Aktive dokumenter

| Dokument | Rolle |
|---|---|
| [DEVPLAN](../DEVPLAN.md) | Kort overlevering, arbeidsregler og én felles teststrategi |
| [DESIGN](../DESIGN.md) | Tekniske prinsipper, modell og informasjonsgrenser |
| [Casebook](CASEBOOK-DEDUCTION.md) | Bevis, teorier, koblinger, kilder, rapportering, hjelp og tips |
| [Regel P](PUNKT9-SYNLIG-VURDERINGSREGEL.md) | Implementert Dana-regel og lenke til replikkene |
| [Nettsteder](WEBSITES.md) | Nettstedsarkitektur, Archive og kanonhensyn |
| [Nettstedsinventar](WEBSITE-INVENTORY.md) | Konkrete nettsteder, domener og kontinuitet; beholdt som referanse |
| [Medier](MEDIA-APPS-PROPOSAL.md) | Implementerte medier vs senere TokTok |
| [Saksavslutning](CASE-ENDINGS-REVIEW.md) | Eksisterende utfall og åpne funn, ikke nye vedtak |
| [BACKLOG](BACKLOG.md) | Kjente problemer, videre oppgaver og forslag som trenger avklaring |
| [PR #89-kontroll](PR89-REVIEW.md) | Kontrollert, rapportert og fortsatt uavklart |

## Bevarte spesialreferanser

- [The Quiet Account](THE-QUIET-ACCOUNT.md): opprinnelig forfattergrunnlag med skjult kanon. Teknikk og gamle spørsmål er ikke dagens arbeidsplan. Ingen historie eller kanon er omskrevet i oppryddingen.
- [GRAPHICS](../graphics/GRAPHICS.md) og [COMFYUI](../graphics/COMFYUI.md): genererte kataloger, 123 ferdige elementer ved kontrollgrunnlaget. Rediger kildedata/generator, ikke generert Markdown. Katalogelementer er ikke samme antall som spillmodellens bildeobjekter (85).
- [Fotoenes stilreferanse](../graphics/sources/web-photos/STYLE.md): produksjonsgrunnlag beholdt. Nettstedfotoene ble laget med bildegenerator, selv om den eldre produksjonslisten heter COMFYUI.
- [Fase 9-spilltest](../PLAYTEST-FASE9.md) og [MVP-plan](PLAN.md): innganger til historikk, ikke aktive planer.

## Historikk og omfang

[Arkivet fra 25. november](https://github.com/zirkhel/BusAdventures/blob/50d5643703a9f7e136809e788eefb64059971383/games/dead-internet/DEVPLAN.md) bevarer dokumentene før opprydding, inkludert begrunnelser og gamle forslag. Gamle dokumenter leses ved den faste Git-committen; fullstendige kopier ligger ikke i den aktive grenen. Gamle «godkjent av Anders»-referater er ikke bevis på en ny godkjenning; se kontrollisten ved tvil.

De 14 opprinnelige Markdown-filene under Dead Internet er klassifisert her, sammen med de tre nye oversiktene. Repoets rotfiler om Empire og teksteventyrmotoren gjelder andre spill og er ikke ryddet som del av denne oppgaven. Gamle, usporede lokale Dead Internet-kopier utenfor denne grenen er heller ikke et gjeldende grunnlag og er ikke slettet.

Unngå nye parallelle statuslogger. Oppdater DEVPLAN for status, BACKLOG for restarbeid og det relevante fagarket for faktisk oppførsel. Eksakte runtime-tekster eies av `content/strings/en.json` og skal ikke kopieres til parallelle tekstoversikter.
