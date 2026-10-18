# Testbericht Tester Sicherheit – Auftrag 02, Durchlauf 2

- Bezug: `strategiedesign/wp02`, Auftrag 02, Abschnitt „Korrektur nach Durchlauf 1 der Tester“ (Punkte 4 bis 7)
- Übergabedokument: `strategiedesign/wp02:development/strategiedesign/wp02/tests/02-2-order.md`
- geprüfter Commit: `6d656ae38c07b171bc10af61d1e740000f26bebb` (Zweig `strategiedesign/wp02-02`), Elterncommit `b9cc906c6981a927961ca9bd08cbd51f01249529`; ausgecheckt und mit `git rev-parse HEAD` bestätigt
- vorheriger Durchlauf: `02-securitytest-1.md` (bestanden, Hinweise H1 bis H3)
- Prüfgrundlagen: wie in `02-1-order.md`; `docs/technical/development-test-security-rules.md`, `docs/technical/entwicklungsverfahren.md` („Umfang der Prüfungen“), BSI IT-Grundschutz CON.8, OPS.1.1.3, OPS.1.1.6, OWASP ASVS (Konfiguration, Abhängigkeiten)
- Art: Nachprüfung der geänderten Stellen

## Ergebnis: bestanden

Es gibt keinen blockierenden Befund.

## Umfang der Änderung

`git diff --stat b9cc906… 6d656ae…` nennt 4 Dateien:

- `components/pipwerk-studio/frontend/e2e/support.ts` (neue Hilfe `restoreObjectDirectory`, verwendet in `useCleanRun`)
- `components/pipwerk-studio/frontend/e2e/workflows.spec.ts` (Lage des Zielverzeichnisses, Reihenfolge in `afterEach`)
- `docs/technical/pipwerk-studio.md` (Abschnitt 6.3)
- `docs/user/pipwerk-studio.md` (Glossar, Eintrag „Datentyp“)

## Prüfungen und Nachweise

| Nr. | Prüfpunkt (Übergabedokument) | Ergebnis | Nachweis |
|---|---|---|---|
| 1 | Browsertests schreiben nur in ihr temporäres Verzeichnis | erfüllt | `workflows.spec.ts`, `beforeEach` des Blocks „settings: the object directory“: `original = await objectDirectory(page)`, danach `target = mkdtempSync(join(dirname(original), 'target-'))`. Das Objektverzeichnis des Laufs ist `join(dir, 'objects')` mit `dir = mkdtempSync(join(tmpdir(), 'pipwerk-studio-e2e-<port>-'))` (`e2e/start-backend.mjs`, unverändert). `dirname(original)` ist damit das Verzeichnis des Laufs, das `start-backend.mjs` beim Ende des Backends mit `rmSync(dir, { recursive: true, force: true })` entfernt. `playwright.config.ts` setzt `reuseExistingServer: false` (unverändert), die Tests laufen also immer gegen dieses eigene Backend. Der Import von `tmpdir` ist aus `workflows.spec.ts` entfernt. Das Zielverzeichnis liegt nicht mehr außerhalb des Verzeichnisses des Laufs. Hinweis H1 aus Durchlauf 1 ist erledigt. Nach den Läufen des Prüfskripts ist `git status --short` im Arbeitsverzeichnis leer. Das Systemverzeichnis für temporäre Dateien konnte ich in dieser Sitzung nicht auflisten (Befehl nicht zugelassen); dafür stützt sich die Aussage auf den Code. |
| 2 | Wiederherstellen des Objektverzeichnisses vor dem Entfernen des Zielverzeichnisses | erfüllt | `workflows.spec.ts`, `afterEach` des Blocks: zuerst `await restoreObjectDirectory(request, original)`, danach `rmSync(target, …)`. `restoreObjectDirectory` (`support.ts`) sendet `PUT /api/studio/settings/object-directory` mit `move: false` und prüft `expect(restored.ok()).toBe(true)`. Schlägt das Wiederherstellen fehl, bricht `afterEach` vor `rmSync` ab; das Zielverzeichnis bleibt dann im Verzeichnis des Laufs und wird mit ihm entfernt. Die Annotation `object-directory` wird jetzt in `beforeEach` gesetzt, vor jeder Änderung im Test; `useCleanRun` (Datei-`afterEach`, läuft nach dem `afterEach` des Blocks) stellt mit derselben Hilfe noch einmal her und leert die Strategien. Der zweite Aufruf setzt denselben Pfad, er ändert nichts. Kommentar im Test und Abschnitt 6.3 der technischen Dokumentation beschreiben genau diese Reihenfolge und den internen Endpunkt (Punkte 4 und 5 des Auftrags). |
| 3 | Keine festen Ports, Pfade, Rechnernamen | erfüllt | Suche in den hinzugefügten Zeilen des Diffs nach `localhost`, `127.0.0`, `0.0.0.0`, `http`, `/srv`, `/home`, `/tmp`, `/Users`, `/var`, `aixlab`, `passw`, `secret`, `token`, `key`, `credential`, `bearer`, `tmpdir` und nach Zahlen ab vier Stellen: kein Treffer. Der Endpunkt wird relativ über `baseURL` angesprochen. Die Dokumentation nennt keinen Pfad des Entwicklungsrechners. |
| 4 | Abhängigkeiten unverändert | erfüllt | `git diff --stat b9cc906… 6d656ae… -- '*package.json' '*package-lock.json' '*pyproject.toml' '*uv.lock' '*playwright.config.ts' '*vite.config.ts' '*start-backend.mjs' components/pipwerk-studio/frontend/src components/pipwerk-studio/backend contracts`: keine Ausgabe. Produktionscode, Backend und Verträge sind nicht geändert. Im Prüfskript bestehen `npm ci` und `uv sync --frozen` für Bibliothek und Backend. Der neue Import `type APIRequestContext` stammt aus dem vorhandenen Paket `@playwright/test`. |
| 5 | Prüfskript auf freien Ports | bestanden | Vorher mit `ss -ltn` geprüft, dass 28427 und 28428 frei sind (nicht 5174 und 8001). `components/pipwerk-studio/scripts/check --backend-port 28427 --frontend-port 28428` (ohne `--with-audit`): erster Lauf gibt „check: all checks passed“ aus, Browsertests 123 bestanden und 6 übersprungen (in drei Browsern). Zweiter Lauf zum Beleg des Exitcodes: Exitcode 0 (`… && echo "exit 0"` gab „exit 0“ aus). |
| 6 | Dokumentation | erfüllt | Abschnitt 6.3 stimmt mit dem Code überein (Lage des Zielverzeichnisses, interner Endpunkt mit `move: false`, Reihenfolge). Der Eintrag „Datentyp“ der Anwenderdokumentation enthält keine sicherheitsrelevanten Angaben. |

## Vorherige Hinweise

- H1 (Lage des Zielverzeichnisses, Reihenfolge in `afterEach`): erledigt, siehe Prüfpunkte 1 und 2.
- H2 (fester Port 5173 in `docs/user/pipwerk-studio.md`, Bestand): in diesem Commit nicht berührt; unverändert Bestand, kein Befund dieses Commits.
- H3 (`source-map-js` 1.2.1 in `package-lock.json`, Bestand): nach Auftrag 02 Punkt 7 nicht Teil dieses Auftrags; das Lockfile ist unverändert.

## Befundliste

Blockierende Befunde: keine.

Neue Hinweise: keine.

## Bereinigung

Im Arbeitsverzeichnis habe ich keinen Code geändert und nichts committet. Das Prüfskript hat nur ignorierte Verzeichnisse erzeugt oder ersetzt. `git status --short` ist leer.
