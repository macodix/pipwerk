# Testbericht Auftrag 20, Durchlauf 1

- Geprüfter Commit: `afe466008c6357fcf7a5ab02b3b6a442f8958063` (Zweig `strategiedesign/wp02-20`, Vorgänger `ea495766b04407ac2233852853991f106a3cb0b4`)
- Prüfauftrag: `development/strategiedesign/wp02/tests/20-1-order.md`
- Prüfer: Tester Funktion

## Ergebnis: nicht bestanden

Drei blockierende Befunde (B1 bis B3). B1 und B2 haben dieselbe Ursache, B3 ist ein eigener Fehler.

## Automatische Tests (Prüfskript, einmal vollständig, Ports 18950/18951)

`components/pipwerk-studio/scripts/check --backend-port 18950 --frontend-port 18951` endet mit Exitcode 1.

| Schritt | Ergebnis |
|---|---|
| Bibliothek: uv sync, pytest (1795), ruff, mypy, Schemas v1/v2 | bestanden |
| Backend: uv sync, pytest (1044), ruff, mypy | bestanden |
| Schreibweise des Namens | bestanden |
| Frontend: npm ci | bestanden |
| Frontend: typecheck | **FAILED** |
| Frontend: Vitest | bestanden (55 Dateien, 693 Tests) |
| Frontend: build | **FAILED** (`tsc --noEmit` vor `vite build`) |
| Browsertest Chromium, Firefox, WebKit | **FAILED**: 420 bestanden, 3 fehlgeschlagen |

Dateimodus im Commit: `check` und `testenv` je `100755`. In Ordnung.

## Blockierende Befunde

**B1 – `typecheck` und `build` schlagen fehl.**
`e2e/library.spec.ts(1,18): error TS6133: 'clickMenu' is declared but its value is never read.`
Der Import `clickMenu` wird in der Datei nicht benutzt. Das Abnahmekriterium 1 (typecheck, build mit Exitcode 0) und 2 (Prüfskript mit Exitcode 0) ist damit nicht erfüllt.

**B2 – Neuer Browsertest zu F1 schlägt in allen drei Browsern fehl.**
`e2e/library.spec.ts:61` „does not insert without a strategy: the library says so itself and its entries do nothing (order 20, F1)“ in Chromium, Firefox und WebKit.
Ursache laut Fehlerprotokoll: `entry.click()` (Zeile 84) wartet 30 s und bricht mit Zeitüberschreitung ab. Playwright meldet „element is not enabled“, weil der Eintrag `aria-disabled="true"` trägt. Der Test prüft damit den Klick auf einen nicht verwendbaren Eintrag nicht, und der Test belegt F1 („Klick ohne Wirkung“) nicht. Die Anwendung selbst ist nicht als fehlerhaft belegt: Die Einträge zeigen `aria-disabled="true"`, `draggable="false"` und Klasse `closed`. Der Test muss den Klick erzwingen (zum Beispiel `click({ force: true })`) und danach prüfen, dass nichts passiert. Die Eingabetaste (F1 „Klick und Eingabetaste ohne Wirkung“) prüft der Browsertest nicht; der Vitest `App.library.test.tsx` deckt sie nach Angabe des Entwicklers ab (nicht einzeln nachgeprüft).

**B3 – Fehlende Meldung bei einer Ablehnung (F8, „jede Ablehnung nennt den Grund“).**
Beim Lesen des Codes (nicht im Browser nachgespielt): `connectTo` in `canvas/Canvas.tsx` liefert `false` ohne Meldung, wenn Quelle und Ziel dasselbe Element sind (`sourceId === targetId`). Dasselbe gilt für `connectValueTo` bei `card === target`. Die Meldung „Ein Schritt lässt sich nicht mit sich selbst verbinden.“ (`same_element`) steht in den Sprachdateien und wird von `connect` geliefert, ist aber auf diesem Weg nicht erreichbar. Das Ziehen von einem Ausgang auf denselben Schritt ist damit eine Ablehnung ohne Grund. Die Benutzerdokumentation (Abschnitt 6.x, Punkt 5) verspricht dagegen eine Meldung bei „ein Schritt mit sich selbst“. Wegen der Reihenfolge der Prüfung im Auftrag („eine Ablehnung ohne Grund bleibt“) werte ich das als blockierend. Der Entwickler soll die Stelle prüfen oder zeigen, dass sie nicht erreichbar ist, und einen Test ergänzen.

## Geprüft und in Ordnung (Code- und Diff-Prüfung, Vitest, Browsertests außer B2)

- **F1:** Satz `library.closed` steht in der Bibliothek (`Library.tsx`, `data-testid="library-closed"`), nicht auf der Zeichenfläche; Einträge `closed`, `aria-disabled`, `draggable` nur mit offener Strategie; `insert` kehrt ohne Strategie ohne Meldung zurück; `notices.openFirst` ist entfallen; die Erklärung (`data-tip`) bleibt. Der Test mit Fenstergrößen ohne waagerechte Bildlaufleiste besteht in allen Browsern. Nur das Verhalten von Klick und Ziehen ist wegen B2 im Browser nicht belegt.
- **F3:** Kennzeichnung „Auslöser“ aus `kind === 'trigger'` (`isTriggerType`), keine festen Kennungen im neuen Code; Gruppen und Reihenfolge unverändert; Meldung `notices.startWithTrigger` bei erstem Element ohne Auslöser, das Element entsteht, der Befund bleibt; gilt auch für „Verbindung“; Hinweis der leeren Strategie nennt die Auslöser über `triggerNames`. `roles.spec.ts` besteht in allen drei Browsern.
- **F8:** Kennzeichnung „Schritt im Ablauf“ / „liefert Werte“ aus `roleOf(kind)`; Legende mit zwei Formen (7 Zeilen); Gründe `object_as_source`, `object_as_target`, `value_to_object`, `value_not_usable`, `choose_step` u. a. Der Fall „Indikator am Ablaufausgang des Auslösers“ zeigt den Grund `object_as_target` mit Namen des Objekts (Ziehen und Klick, `roles.spec.ts:110` besteht in allen drei Browsern). Die Unterscheidung der Kastenformen ohne Farbe ist in `styles.css` und `roles.spec.ts:89` angelegt; sie besteht im Browsertest, ich habe sie nicht optisch geprüft.
- **Texte:** Neue Schlüssel stehen in `de.json` und `en.json`, die Schlüsselgleichheit ist durch den bestandenen Vitest belegt; Händlersprache, keine Einzelwörter. Kleinigkeit: In beiden Dateien steht `"legendFlow":"…"` ohne Leerzeichen nach dem Doppelpunkt (nur Format).
- **Bestehende Tests:** `App.hints.test.tsx`, `App.canvas.test.tsx`, `canvas.spec.ts`, `surface.spec.ts`, `library.spec.ts`, `ops.test.ts` wurden angepasst, weil Satz und Legende die alte Meldung ersetzen oder neue Zeilen hinzukommen. Kein Test ist übersprungen oder deaktiviert. Die Erwartung wurde nirgends abgeschwächt: Der Testfall „Meldung bei kurzer Mitteilung“ nutzt jetzt „Verbindung“ ohne gewählten Schritt statt eines Bibliothekseintrags, mit gleicher Prüftiefe. In `ops.test.ts` wurde `toEqual({ problem })` zu `toMatchObject({ problem })`, weil das Ergebnis ein Feld `element` tragen kann; ein eigener Test prüft das Feld genau.
- **Feste Werte:** Im neuen Code der Bibliothek, `typeIndex.ts` und `roles.spec.ts` stehen kein fester Pfad, Port oder Rechnername (Suche).
- **Dokumentation:** `docs/user/pipwerk-studio.md` (Bibliothek ohne Strategie, Auslöser, Schritte und Werte, Legende, Ablehnung von Verbindungen) und `docs/technical/pipwerk-studio.md` (Kennzeichnung, Wahl zum ersten Element, Meldungen, Tests) passen zum Verhalten, mit der Ausnahme zu B3 (Selbstverbindung).

## Nicht geprüft

- Kastenformen und Kennzeichnung optisch (kein Bild gesehen); belegt nur durch Code und Browsertests.
- Verhalten bei Selbstverbindung im Browser (B3 aus dem Code gelesen).
- Ob Ablehnungen im Entwicklerergebnis vollständig aufgelistet sind: das Ergebnis des Entwicklers liegt mir nicht vor.

## Für die Nachprüfung

B1 (ungenutzten Import entfernen), B2 (Klick auf nicht verwendbaren Eintrag im Browsertest erzwingen und Wirkung prüfen), B3 (Grund bei Selbstverbindung). Danach Prüfskript erneut vollständig.

Bericht: bestanden: **nein** – **nicht bestanden**.
