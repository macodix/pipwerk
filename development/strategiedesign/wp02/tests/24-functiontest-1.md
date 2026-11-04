# Testbericht Auftrag 24, Durchlauf 1 (Tester Funktion)

- Geprüfter Commit: `049b0a9c65bfc7086b07f03f9f32e5be4852d8b6` auf Zweig `strategiedesign/wp02-24` (Vorgänger `d90b73f878fd88fef3319aacc9967fad98d71d8a`); in `git rev-parse HEAD` des Prüfverzeichnisses kontrolliert.
- Übergabedokument: `development/strategiedesign/wp02/tests/24-1-order.md`

## Ergebnis: nicht bestanden

Zwei blockierende Befunde (B1, B2). Die übrigen Punkte des Prüfauftrags sind erfüllt oder unten als nicht blockierend vermerkt.

## Automatische Tests

Aufruf: `components/pipwerk-studio/scripts/check --backend-port 18624 --frontend-port 15624` (freie Ports). Ausgabe: `work/strategiedesign/wp02/ft24-check.log`. Exitcode 1.

| Schritt | Ergebnis |
|---|---|
| Bibliothek: sync, pytest, ruff, ruff format, mypy, Schemas v1/v2 | bestanden |
| Backend: sync, ruff, ruff format, mypy | bestanden |
| Backend: pytest | **1 fehlgeschlagen**, 1045 bestanden (B2) |
| Suche nach der Schreibweise des Namens | bestanden |
| Frontend: npm ci, Typprüfung, Vitest, Bau | bestanden |
| Frontend einzeln: `npm run typecheck` (Exitcode 0), `npm run test`: 57 Dateien, 729 Tests bestanden (40 s) | bestanden |
| Browsertests (Chromium, Firefox, WebKit, 20,2 min) | **465 bestanden, 3 fehlgeschlagen** (B1) |

Der bekannte Test `testcases.spec.ts` „str-01 Scalping Punkt 2 Ausbruch …“ ist in allen drei Browsern bestanden (Chromium 41,4 s, Firefox 1,2 min, WebKit 1,1 min).
Die Browsertests liefen im Standardfenster von Playwright. Einen eigenen Lauf nur mit 390 × 844 habe ich nicht gemacht; die Tests mit „(390 x 844, with clicks)“ in `parameters.spec.ts` und `used.spec.ts` sind im Lauf bestanden.

## Befunde

### B1 (blockierend): Browsertest `e2e/fields.spec.ts:109` scheitert in allen drei Browsern

Test: „the instrument of the order has the same field and says "diese Order"; in English the words follow the specification“. Er ist im Commit geändert (Auftrag 24, Umfang 5). Er scheitert in Chromium, Firefox und WebKit.

Fehler: `TimeoutError: locator.click: Timeout 10000ms exceeded` bei `getByTestId('menu-settings')` (`support.ts:55`). Playwright meldet in jeder Wiederholung: `<button data-testid="findings-count" class="count-pill hints-only" …>` aus dem Teilbaum `.head-right` fängt die Zeigerereignisse ab. Der Menüpunkt „Einstellungen“ ist sichtbar und stabil, aber vom Zähler der Befunde („0 Fehler, 1 Hinweis“) überdeckt.

Der Commit ändert die Kopfzeile (`Header.tsx`: neue `status-pill` mit Name und Zustand der Strategie, Klasse `has-status`; `styles.css`). Ob die Überdeckung davon kommt oder der Test den Menüpunkt in einem Zustand anklickt, den die Oberfläche so nicht vorsieht, habe ich nicht untersucht. Belegt ist nur: Der Menüpunkt lässt sich im Test nicht anklicken. Folge, falls es echt ist: Anwender erreichen „Einstellungen“ (Sprache) nicht, solange dieser Zähler so steht. Der Test, der die Englisch-Wörter des Instrument-Felds der Order belegen soll, läuft dadurch nicht bis dorthin.

Der Entwickler muss nennen, ob er diesen Lauf gesehen hat; sein Ergebnis habe ich nicht gelesen.

### B2 (blockierend nach Abnahmekriterium 2): Backend-Test `tests/test_frontend_type_copy.py` scheitert, `check` endet mit Exitcode 1

`test_the_copy_of_the_user_interface_equals_the_answer_of_the_backend`: Die Kopie `frontend/src/testing/element-types.json` ist ungleich der Antwort des Backends dieses Commits („Write the copy anew …“). Ursache laut Auftrag: Der Commit hat die Kopie von Hand auf „Voreingestelltes Instrument aus Strategie“ eingestellt, das Backend dieses Commits liefert das noch nicht (kommt mit Auftrag 23). Abnahmekriterium 2 verlangt `check` mit Exitcode 0; das gilt hier nicht. Der Entwicklungsleiter entscheidet, ob das bis zur Zusammenführung mit Auftrag 23 hinzunehmen ist. Nicht geprüft: ob der Test am Vorgänger-Commit bestanden hat.

## Prüfung der Punkte des Prüfauftrags

- **Streifen entfallen:** `ParamStrip.tsx` ist gelöscht; `git grep ParamStrip` in `src` und `e2e` findet nichts. `param-strip` kommt nur noch in Tests als `toHaveCount(0)`/`toBeNull` vor. Die Raster-Bereiche `params` in `styles.css` sind entfernt. In Ordnung.
- **Bereich „Strategieparameter“** (`properties/StrategyParameters.tsx`): leer (Satz aus dem Auftrag), Liste mit Name, Datentypwort, Wert; Klick öffnet Name/Datentyp/Wert zum Ändern; Entfernen über `requestRemoveParameter` (Rückfrage bestand schon; Test „used.spec.ts:178“ bestanden); „Neuer Strategieparameter“ mit Name, Datentyp, Wert, „Abbrechen“. Durch Code und bestandene Komponententests (`App.parameters.test.tsx`) belegt.
- **Kein Anlegen im Feld:** `ParameterPicker` in `fields.tsx` hat Eingabefeld, „__new“-Eintrag und `onCreate` nicht mehr; bei leerer Auswahl Satz plus „Zur Strategie“ (`param-go`).
- **„Zur Strategie“ / „Zurück zu …“:** `visitParameters` setzt Auswahl Strategie, Eigenschaftenansicht, Datentyp wird vorgewählt; `backToField` wählt das Element und fokussiert das Feld. Der Rückweg wird bei jeder anderen Auswahl im Reducer verworfen (`select`, `replaceDocument` mit anderer Auswahl); ist das Element weg, entfällt der Knopf (`origin` nicht gefunden), kein Fehler. Browsertest in `parameters.spec.ts` (auch 390 × 844) bestanden.
- **Feld „Instrument wählen (optional)“:** Beschriftung, eine Auswahl mit Vorbelegung „Voreingestelltes Instrument aus Strategie“, Erklärung mit „dieses Element“/„diese Order“, „fest eingeben“ mit Hinweis „zum Beispiel EURUSD“, leer = Vorbelegung. Wörter „anderes Instrument wählen“ und die Schaltfläche „wieder das Instrument, auf dem die Strategie läuft“ sind aus dem Code und den Sprachdateien entfernt. Der Order-Teil im Browser ist wegen B1 nicht durchgelaufen; die Komponententests dazu sind bestanden.
- **Deutsch und Englisch:** `de.json` und `en.json` tragen `backTo`, `goToStrategy`, `fields.preset.*` mit den Wörtern des Auftrags; `locales.test.ts` bestanden. Neue Texte stehen nur in den Sprachdateien.
- **Fake-Antwort `element-types.json` gegen Zweig `strategiedesign/wp02-23`:** Die Beschriftung „Voreingestelltes Instrument aus Strategie“ / „Default instrument from strategy“ ist in beiden Zweigen gleich. Unterschiede bestehen nur in Feldern, die Auftrag 24 nicht braucht (`category_label` fehlt hier, „Hauptablauf“-Satz, „Formel“/„Ausdruck“). Nicht blockierend.
- **Geänderte bestehende Tests:** Die Diffs der Komponenten- und Browsertests ersetzen die Erwartungen zum Streifen und zum Anlegen im Feld durch die neuen (Streifen nicht vorhanden, Bereich in der Eigenschaftenansicht, „Zur Strategie“). Ich habe keine entfernte Prüfung ohne Ersatz bemerkt; jede einzelne Zeile habe ich nicht verglichen. Mehr Tests als vorher (Vitest 729, Browser 468 Läufe).
- **Dateimodus:** `check` und `testenv` im Commit `100755`. In Ordnung.
- **Kein fester Pfad, Port, Rechnername** in `src` (außer Testdaten): `git grep` nach `/srv/`, `/home/`, Portnummern, `localhost`, `127.0.0.1` ohne Treffer in den Nicht-Test-Dateien. `playwright.config.ts` verlangt die Ports als Parameter. In Ordnung.
- **Anwenderdokumentation:** `docs/user/pipwerk-studio.md` beschreibt den Streifen nicht mehr; Zeile 70 sagt nur noch „Einen eigenen Streifen unter der Kopfzeile gibt es nicht“ (nicht blockierend; das Wort könnte ganz entfallen). Keine Treffer für `testenv`, Anschlussnummern, Playwright, Vitest. Die technische Dokumentation (`docs/technical/pipwerk-studio.md`, Abschnitt zur Testumgebung) trägt den Start über `testenv`.

## Nicht geprüft

- Sicherheit, Architektur, Optik. Gestaltung der Kopfzeile und Zähler habe ich nicht angesehen; B1 beruht nur auf der Playwright-Meldung.
- Ob B1 auch in einem anderen Fenster als dem Standardfenster der Konfiguration auftritt.

Zusammenfassung: **nicht bestanden** (B1, B2).
