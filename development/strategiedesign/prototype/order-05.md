# Auftrag Prototyp pipwerk Studio, Hinweise und Assistent nur in der Eigenschaftenansicht

- Vorhaben: `strategiedesign`, Phase 2 Konzeption
- zuständig: Entwickler Oberfläche
- Zweig: `strategiedesign/proto-studio`, Prototyp, wird nicht übernommen
- Ausgangscommit: `675cbbabe62ea77c78accd9b0f9ff45fb373c341` (Ergebnis von [order-04.md](order-04.md))
- Stand: 2026-10-23

## Ziel

Der Prototyp behebt den Einwand des Auftraggebers aus seinem Test (`development/strategiedesign/questions/strategiedesign-03.md`, Abschnitt „Antwort“): Der Hinweis „Keine Strategie geöffnet“ erscheint zweimal, auf der Zeichenfläche und in der Eigenschaftenansicht. Hinweise und der Assistent erscheinen nur in der Eigenschaftenansicht (req-ui-016 in der Fassung vom 2026-10-23). Alles, was dieser Auftrag nicht nennt, bleibt wie im Ausgangscommit.

Ob die Regel auch für die Fenster „Über pipwerk Studio“, „Öffnen“, „Einstellungen“, die Rückfragen und die zu bestätigenden Fehlermeldungen gilt, entscheidet der Auftraggeber noch. Dieser Auftrag setzt den Vorschlag um: Diese Fenster bleiben unverändert.

## Grundlagen

- `docs/design/requirements/anforderungen-strategiedesigner.md`: req-ui-016 in der Fassung vom 2026-10-23, req-ui-005, req-ui-010, req-ui-011
- `development/strategiedesign/specification.md`, Abschnitt 5.1 (Aufbau, Fenstergrößen) und 5.5 (Zeile „Strategie anlegen“, Absatz zu leeren Zuständen)
- `development/strategiedesign/reviews/requirements-17.md`, Hinweise H2 bis H6
- `components/pipwerk-studio/prototype/README.md` im Ausgangscommit

## Umfang

1. **Keine Hinweise auf der Zeichenfläche.** Die Zeichenfläche zeigt keinen Hinweis und keine Schaltfläche eines Hinweises, weder ohne geöffnete Strategie („Keine Strategie geöffnet“) noch bei leerer Strategie. Sie zeigt nur Elemente, Verbindungen, Rahmen, Abschnitte, den Bereich „Objekte und ihre Werte“ und ihre Bedienelemente (Zoom, Einpassen, Umschalter, Legende). „Keine Strategie geöffnet“ steht genau einmal in der Oberfläche, in der Eigenschaftenansicht. Die Anzeige des Stands in der Fußzeile ist kein Hinweis und bleibt.
2. **Leere Strategie.** Der Hinweis zum nächsten Schritt bei leerer Strategie (Auslöser einfügen, Schaltfläche „Assistent starten“) steht in der Eigenschaftenansicht der Strategie, oberhalb ihrer Felder. In Fenstern bis 1099 Pixel Breite hat er die Schaltfläche „Elementbibliothek zeigen“, wie bisher auf der Zeichenfläche.
3. **Assistent.** Der Assistent läuft weiter in der Eigenschaftenansicht, mit „Elementbibliothek zeigen“ in Fenstern bis 1099 Pixel Breite. Wählt der Anwender bei laufendem Assistenten ein Element oder die Strategie, zeigt die Eigenschaftenansicht dieses Element beziehungsweise die Strategie; über den Feldern steht eine Zeile „Assistent, Schritt n von 5“ mit der Schaltfläche „Assistent fortsetzen“, die den Assistenten im erreichten Schritt wieder zeigt. Elementbibliothek und Zeichenfläche bleiben bedienbar.
4. **Kurze Meldungen.** Meldungen, die heute kurz am Rand des Fensters erscheinen und von selbst verschwinden (zum Beispiel „Der Assistent ist fertig …“, Bestätigung des Speicherns), erscheinen in der Eigenschaftenansicht, oben, und verschwinden wie bisher. Liegt eine Meldung vor, während die Eigenschaftenansicht in kleinen Fenstern verdeckt ist, trägt der Reiter beziehungsweise die Schaltfläche der Leiste für die Eigenschaftenansicht eine Markierung, bis die Meldung verschwunden ist.
5. **Kleine Fenster.** Unter 1100 Pixel Breite zeigt die Oberfläche nach „Neue Strategie“, beim Start ohne geöffnete Strategie und nach „Assistent starten“ die Eigenschaftenansicht, damit Hinweis beziehungsweise Assistent sichtbar sind. „Elementbibliothek zeigen“ wechselt zur Bibliothek; der Assistent bleibt dabei in seinem Schritt erhalten, der Reiter beziehungsweise die Schaltfläche der Eigenschaftenansicht führt zu ihm zurück.
6. **Unverändert:** Erklärungen beim Zeigen an Ort und Stelle (req-ui-016), Markierung von Befunden an den Elementen der Zeichenfläche (req-ui-011), Hinweise zu leeren Zuständen innerhalb von Elementbibliothek, Ansicht einer Vorlage und den Fenstern, und die Fenster „Über pipwerk Studio“, „Öffnen“, „Einstellungen“, Rückfragen und zu bestätigende Fehlermeldungen.
7. Prüfe nach Punkt 1 bis 5 jede Schaltfläche nach „Neue Strategie“, ohne geöffnete Strategie und in jedem Schritt des Assistenten in allen sechs Fenstergrößen wie in `order-04.md`, Punkt 3. Hat eine keine Funktion, behebe es und nenne es im Ergebnis.
8. README nachführen. Alle Texte in Deutsch und Englisch, Fenstergrößen wie in `order-01.md`, Punkt 15.

## Nicht-Umfang

- Alles außerhalb von Punkt 1 bis 8, insbesondere Backend, Anwenderdokumentation und die Punkte aus `order-02.md` bis `order-04.md`

## Technische Abnahmekriterien

1. Die gebaute Datei öffnet sich in Chromium, Firefox und WebKit über `file://` ohne Fehler in der Konsole.
2. Ein Browsertest prüft in jeder der sechs Fenstergrößen in beiden Sprachen: ohne geöffnete Strategie, nach „Neue Strategie“, in jedem Schritt des Assistenten und nach „Ohne Assistent weiterarbeiten“ enthält die Zeichenfläche keinen Hinweistext und keine Schaltfläche eines Hinweises; „Keine Strategie geöffnet“ kommt im sichtbaren Text außerhalb der Fußzeile genau einmal vor, in der Eigenschaftenansicht; der Hinweis der leeren Strategie und der Assistent sind nach dem jeweiligen Schritt ohne weiteren Klick sichtbar.
3. Ein Browsertest wählt bei laufendem Assistenten ein Element, prüft die Zeile „Assistent, Schritt n von 5“, kehrt mit „Assistent fortsetzen“ in denselben Schritt zurück und beendet den Assistenten.
4. Ein Browsertest prüft, dass eine kurze Meldung in der Eigenschaftenansicht erscheint und in den beiden Smartphone-Größen bei verdeckter Eigenschaftenansicht die Markierung zeigt.
5. Der Browsertest aus `order-04.md`, Kriterium 2 (Elementbibliothek bei laufendem Assistenten über jeden vorgesehenen Weg, Einfügen mit Klick) und alle übrigen bestehenden Browsertests bestehen, auch der Test der sechs Fenstergrößen und der Test aller Schaltflächen.
6. Bildschirmbilder in 1366 × 768 und 390 × 844: ohne geöffnete Strategie, nach „Neue Strategie“, und in 1366 × 768 ein gewähltes Element bei laufendem Assistenten.
7. README beschreibt Punkt 1 bis 7 und enthält keine Pfade des Entwicklungsrechners und keine Zugangsdaten.
8. Die gebaute Datei liegt unter `components/pipwerk-studio/prototype/dist/pipwerk-studio-prototyp.html`.

## Ergebnis

Ein benannter Commit auf `strategiedesign/proto-studio` auf GitHub. Nenne ihn vollständig, dazu die erfüllten und nicht erfüllten Abnahmekriterien mit Nachweis und deine Entscheidungen.
