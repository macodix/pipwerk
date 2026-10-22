# Auftrag Prototyp pipwerk Studio, Namensvorschlag und gemeinsamer Namensraum

- Vorhaben: `strategiedesign`, Phase 2 Konzeption
- zuständig: Entwickler Oberfläche
- Zweig: `strategiedesign/proto-studio`, Prototyp, wird nicht übernommen
- Ausgangscommit: `87b86924ad5cf6485e821793a204b63d7955f168` (Ergebnis von [order-02.md](order-02.md))
- Stand: 2026-10-23

## Ziel

Der Prototyp zeigt die Festlegungen des Auftraggebers vom 23. Oktober 2026 zum gemeinsamen Namensraum und zum Namensvorschlag beim Einfügen einer Vorlage. Alles, was dieser Auftrag nicht nennt, bleibt wie im Ausgangscommit.

## Grundlagen

- `docs/design/requirements/anforderungen-strategiedesigner.md`: req-ablauf-003, req-ui-014 Absatz 2
- `docs/design/domain/fachmodell.md`: req-fach-055, Absatz zum gemeinsamen Namensraum
- `development/strategiedesign/specification.md`, Abschnitt 3.3: „Element der ersten Verwendung“, „Namensraum der Strategie“ und die beiden folgenden Absätze; Abschnitt 3.6: Zeilen „Name doppelt vergeben“ und „Instanz ohne Verbindung“
- `components/pipwerk-studio/prototype/README.md` im Ausgangscommit

## Umfang

1. **Namensvorschlag beim Einfügen** (req-ablauf-003, Spezifikation 3.3). Wird eine Vorlage eingefügt, die selbst Instanzen oder Regeln enthält (ein Trend mit Indikatoren, ein Indikator mit Regeln, ein Regelwerk mit Regeln), erhält jede enthaltene Instanz und Regel den Namen „<Name der neuen Instanz> <bisheriger Name>“, bei Vergabe mit angehängter Zahl. Die Eigenschaftenansicht der eingefügten Instanz zeigt die enthaltenen Namen; der Anwender kann jeden ändern. Umbenennen der umgebenden Instanz ändert die enthaltenen Namen nicht. Lege für den Nachweis unter „Öffnen“ beziehungsweise in der Bibliothek mindestens eine Vorlage eines Trends mit zwei Indikatoren und eine Vorlage eines Regelwerks mit zwei Regeln bereit, falls es sie noch nicht gibt.
2. **Gemeinsamer Namensraum** (req-fach-055, Spezifikation 3.3). Enthaltene Instanzen und Regeln in Regelwerken sind in Bausteinen und Formeleditor der übrigen Strategie unter ihrem Namen auswählbar. Die Prüfung meldet „Name doppelt vergeben“ auch für Namen in enthaltenen Instanzen und Regelwerken und für einen Parameter einer Regel mit dem Namen einer Instanz der Strategie.
3. **Verwendung nur im Ausdruck** (req-ui-014, Spezifikation 3.3 und 3.6). Prüfe, dass der Prototyp das schon so umsetzt, und passe ihn nur an, wo nicht: Eine Instanz, die nur im Ausdruck verwendet wird, erhält keinen Befund „Instanz ohne Verbindung“, auch wenn nur ein späteres Element sie verwendet; sie liegt beim ersten Element in der Reihenfolge des Ablaufs, das sie verwendet.
4. Alle Texte in Deutsch und Englisch, Fenstergrößen wie in `order-01.md`, Punkt 15.

## Nicht-Umfang

- Alles außerhalb von Punkt 1 bis 4, insbesondere Backend und Anwenderdokumentation

## Technische Abnahmekriterien

1. Die gebaute Datei öffnet sich in Chromium, Firefox und WebKit über `file://` ohne Fehler in der Konsole.
2. Ein Browsertest fügt die Trend-Vorlage aus Punkt 1 zweimal ein und prüft die vorgeschlagenen Namen einschließlich der angehängten Zahl, das Ändern eines Namens und das Umbenennen der umgebenden Instanz.
3. Ein Browsertest prüft die Befunde aus Punkt 2 und 3.
4. Alle bestehenden Browsertests bestehen weiterhin, auch der Test der sechs Fenstergrößen.
5. Ein Bildschirmbild in 1366 × 768 der Eigenschaftenansicht einer eingefügten Trend-Vorlage mit den vorgeschlagenen Namen.
6. README beschreibt Punkt 1 bis 3 und enthält keine Pfade des Entwicklungsrechners und keine Zugangsdaten.
7. Die gebaute Datei liegt unter `components/pipwerk-studio/prototype/dist/pipwerk-studio-prototyp.html`.

## Ergebnis

Ein benannter Commit auf `strategiedesign/proto-studio` auf GitHub. Nenne ihn vollständig, dazu die erfüllten und nicht erfüllten Abnahmekriterien mit Nachweis und deine Entscheidungen.
