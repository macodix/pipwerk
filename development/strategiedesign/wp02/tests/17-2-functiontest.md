# Testbericht Funktion – Auftrag 17, Durchlauf 2

- Ergebnis: **bestanden** (kein blockierender Befund, 1 Hinweis)
- geprüfter Commit: `e96d4601bf008a59b1d29191024c41752c1a15b5` (Zweig `strategiedesign/wp02-17`, Ausgangscommit `ab452de0fb2163d880b6648034e9daa22083678d`); im Arbeitsverzeichnis ausgecheckt, per `rev-parse HEAD` bestätigt
- Prüfskript: unverändert, kein eigener Commit am Prüfskript

## Prüfskript `components/pipwerk-studio/scripts/check`
- Lauf 1 (Ports 18900/18901) und Lauf 2 (Ports 18902/18903), nacheinander, beide „all checks passed“. Ausführungsrechte vorhanden.
- Je Lauf: Backend 1044 Tests, Vitest 53 Dateien mit 664 Tests (vorher 658), build, Playwright 357 bestanden (Chromium, Firefox, WebKit), keine übersprungenen oder unsicheren Tests im Ausgabeprotokoll.
- Logs: `work/strategiedesign/wp02/ft17-2-check-1.log`, `ft17-2-check-2.log`.

## Nachprüfung der Befunde aus Durchlauf 1
- **B1 behoben:** `pipwerk-studio-testfaelle.md` Zeile 35 nennt die Kreuzung nur noch als zusammengesetzt aus „Alle gelten (und)“, Vergleichen und „Vorheriger Wert von“. In `pipwerk-studio.md` bezeichnen alle Fundstellen die Kreuzung als ausgeschrieben, nicht als Baustein; kein Widerspruch.
- **B2 behoben:** `revision.commit/commitAt` lauten „Stand …“ / „Revision …“, `about.repository` „Quelltext“ / „Source code“, `backend.*` „Verbindung zum Server: …“. In `de.json` und `en.json` steht kein „Commit“, „Repository“ oder „Backend“ mehr als sichtbarer Text. `locales.test.ts` hat die Ausnahmeliste (`allowed`) nicht mehr und prüft alle Schlüssel gegen die Begriffsliste; das ist strenger als vorher.
- **H1 behoben:** `vite.config.ts` liest `PIPWERK_STUDIO_BACKEND_URL` ohne Standardwert. Ohne Wert antwortet der Server auf `/api` mit 503 und nennt den fehlenden Wert. Die Variable setzen `testenv` und `playwright.config.ts`. `sourceRules.test.ts` und `viteConfig.test.ts` prüfen das (neue Tests).
- **H2 behoben:** In `Instances.tsx` steht der Datentyp als `Info` in der Erklärung (`fields.expects`), kein Chip mehr. Die übrigen `dtype-chip` in `Supplied.tsx` und `ElementView.tsx` zeigen Methode beziehungsweise Art der Bindung, keinen Datentyp. Test in `App.expressions.test.tsx` ergänzt.

## Umfang 1 bis 5 und Tests
- Punkte 1 bis 5 wie in Durchlauf 1 erfüllt; der Diff zu `ab452de` berührt sie nur über Texte und `Instances.tsx`.
- Kein `skip`, `only`, `todo`, `fixme` in `src`, `e2e`, `buildinfo`. Die im Diff entfernten Testzeilen betreffen nur geänderte Texte („Commit“, „Backend: …“, „Repository“) und die entfernte Ausnahmeliste; die Ersatzprüfungen sind gleich streng oder strenger. Keine verwaisten Tests gefunden.
- Kein fester Pfad, Port oder Rechnername im Code, auch nicht in `vite.config.ts`.

## Befunde
- **H3 (Hinweis, nicht blockierend):** `docs/user/pipwerk-studio.md` nennt die Kreuzung noch als Art einer Bedingung (Zeilen 450 und 650, Zeile 611 „geführter Aufbau … oder eine Kreuzung“, Zeile 442 „kreuzt nach oben“). Die Anwenderdokumentation ist laut Auftrag Nicht-Umfang (Auftrag 18) und gehört dorthin.

## Nicht geprüft
- Optische Wirkung der Oberfläche (nicht prüfbar); Textqualität nur stichprobenartig und über die Regeln der Durchsicht.
