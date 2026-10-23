# Auftrag Prototyp pipwerk Studio, Einwände zu „Neue Strategie“ und Assistent

- Vorhaben: `strategiedesign`, Phase 2 Konzeption
- zuständig: Entwickler Oberfläche
- Zweig: `strategiedesign/proto-studio`, Prototyp, wird nicht übernommen
- Ausgangscommit: `6294ac17edc8b9a6cf8080fab87439a84951a5ff` (Ergebnis von [order-03.md](order-03.md))
- Stand: 2026-10-23

## Ziel

Der Prototyp behebt die beiden Einwände des Auftraggebers aus seinem Test (`development/strategiedesign/questions/strategiedesign-02.md`, Abschnitt „Antwort“). Alles, was dieser Auftrag nicht nennt, bleibt wie im Ausgangscommit.

## Grundlagen

- `docs/design/requirements/anforderungen-strategiedesigner.md`: req-ui-016 in der Fassung vom 2026-10-23
- `development/strategiedesign/specification.md`, Abschnitt 5.5, Zeile „Strategie anlegen“, und Abschnitt 5.1, Fenstergrößen
- `components/pipwerk-studio/prototype/README.md` im Ausgangscommit

## Umfang

1. **Elementbibliothek nach „Neue Strategie“.** Einwand des Auftraggebers: Nach „Neue Strategie“ ist „Elementbibliothek zeigen“ ohne Funktion. Die wörtliche Beschriftung „Elementbibliothek zeigen“ kommt im Quelltext des Ausgangscommits nicht vor; gemeint ist der Weg, auf dem der Anwender nach „Neue Strategie“ die Elementbibliothek erreicht (zum Beispiel der Reiter „Bibliothek“ der Leiste in kleinen Fenstern, ein Hinweis im leeren Zustand oder im Assistenten). Stelle den Fehler in allen sechs Fenstergrößen nach, beschreibe die Ursache im Ergebnis und behebe sie: Nach „Neue Strategie“ ist die Elementbibliothek in jeder Fenstergröße erreichbar und bedienbar, auch während der Assistent läuft; ein Klick auf ein Element fügt es ein. Jede Schaltfläche und jeder Reiter, die die Bibliothek zeigen sollen, zeigen sie.
2. **Name „Assistent“** (req-ui-016). Der geführte Aufbau heißt in der Oberfläche überall „Assistent“, im Englischen „Assistant“. Die Wendungen „geführter Aufbau“ und „Geführten Aufbau zeigen“ und gleichbedeutende Bezeichnungen kommen in keinem Text der Oberfläche vor, auch nicht in Erklärungen beim Zeigen, Hinweisen, Beschriftungen für Bildschirmleser und Meldungen. Eine Schaltfläche, die den Assistenten zeigt oder startet, heißt mit dem Wort „Assistent“.
3. Prüfe beim Durchgehen von Punkt 1 und 2 die übrigen Schaltflächen nach „Neue Strategie“ und im Assistenten in allen sechs Fenstergrößen. Hat eine davon keine Funktion, behebe es ebenso und nenne es im Ergebnis.
4. README nachführen. Alle Texte in Deutsch und Englisch, Fenstergrößen wie in `order-01.md`, Punkt 15.

## Nicht-Umfang

- Alles außerhalb von Punkt 1 bis 4, insbesondere Backend, Anwenderdokumentation und die Punkte aus `order-02.md` und `order-03.md`

## Technische Abnahmekriterien

1. Die gebaute Datei öffnet sich in Chromium, Firefox und WebKit über `file://` ohne Fehler in der Konsole.
2. Ein Browsertest wählt in jeder der sechs Fenstergrößen „Neue Strategie“, öffnet bei laufendem Assistenten die Elementbibliothek über jeden dafür vorgesehenen Weg, prüft, dass sie sichtbar ist, und fügt mit einem Klick ein Element ein.
3. Ein Browsertest durchsucht nach „Neue Strategie“ und in jedem Schritt des Assistenten den gesamten sichtbaren Text und die Beschriftungen für Bildschirmleser in Deutsch und Englisch: „geführt“ in Verbindung mit „Aufbau“ und „guided“ kommen nicht vor, „Assistent“ beziehungsweise „Assistant“ kommt vor. Zusätzlich enthält der Quelltext unter `src/` außerhalb von Kommentaren und Kennungen keinen solchen Text.
4. Alle bestehenden Browsertests bestehen weiterhin, auch der Test der sechs Fenstergrößen.
5. Ein Bildschirmbild in 390 × 844 der geöffneten Elementbibliothek bei laufendem Assistenten und eines in 1366 × 768 nach „Neue Strategie“.
6. README beschreibt Punkt 1 bis 3 und enthält keine Pfade des Entwicklungsrechners und keine Zugangsdaten.
7. Die gebaute Datei liegt unter `components/pipwerk-studio/prototype/dist/pipwerk-studio-prototyp.html`.

## Ergebnis

Ein benannter Commit auf `strategiedesign/proto-studio` auf GitHub. Nenne ihn vollständig, dazu die Ursache aus Punkt 1, die erfüllten und nicht erfüllten Abnahmekriterien mit Nachweis und deine Entscheidungen.
