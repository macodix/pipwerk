# Auftrag Prototyp Übersicht über den Stand der Vorhaben

- Vorhaben: `verfahren` (Entwicklungsverfahren verbessern), Phase 2 Konzeption
- zuständig: Entwickler Oberfläche
- Zweig: `verfahren/proto-uebersicht`, Prototyp, wird nicht übernommen
- Stand: 2026-10-24

## Ziel

Ein klickbarer Oberflächenentwurf der Übersichtsseite nach Festlegung 6 in `development/verfahren/scope.md`. Der Auftraggeber öffnet ihn und erkennt ohne Anleitung: welche Vorhaben es gibt, in welcher Phase jedes Arbeitspaket ist, wer gerade daran arbeitet und was auf ihn wartet. Er bestätigt den Entwurf, bevor die Seite spezifiziert und umgesetzt wird (`docs/technical/entwicklungsverfahren.md`, Phase 2, Schritt 2). Der Entwurf zeigt Inhalt, Anordnung und Erscheinungsbild mit fest eingetragenen Beispieldaten. Er wird nicht aus dem Repository erzeugt.

## Grundlagen

- `development/verfahren/scope.md`, Festlegungen 4 (Namen, Phasennamen) und 6 (Übersicht)
- `docs/technical/entwicklungsverfahren.md`, Abschnitte „Phasen“ und „Meldungen“ (welche Meldung wann bei wem liegt)

## Umfang

1. Eine einzige HTML-Datei mit eingebetteten Stilen und, nur falls nötig, wenig eingebettetem JavaScript. Kein Rahmenwerk, keine externen Dateien, keine Schriften oder Skripte aus dem Netz. Sie läuft durch Öffnen im Browser über `file://`. Sprache Deutsch.
2. Kopf: Überschrift „Stand der Vorhaben“ und der Zeitpunkt, zu dem die Seite erzeugt wurde, in Ortszeit ausgeschrieben (Beispiel: „erzeugt am 24.10.2026 um 09:40 Uhr“).
3. Ganz oben ein hervorgehobener Bereich „Wartet auf Sie“. Je Eintrag: Name des Vorhabens, Name des Arbeitspakets (falls es eines gibt), was zu tun ist („Präsentation bestätigen“, „Frage beantworten“, „Abnahme durchführen“) und seit wann. Ist nichts offen, steht dort „Im Moment wartet nichts auf Sie.“
4. Darunter je laufendem Vorhaben ein Block: Name des Vorhabens groß, die Kennung klein daneben, die Phase des Vorhabens. Darin je Arbeitspaket eine Zeile: Name (Kennung klein), Phase, bei wem die Arbeit gerade liegt, seit wann. Liegt die Arbeit beim Auftraggeber, ist die Zeile genauso hervorgehoben wie der Bereich „Wartet auf Sie“. Ein Vorhaben in Anforderung, Konzeption oder Planung hat noch keine Arbeitspakete; der Block zeigt dann statt der Tabelle eine Zeile mit Phase, bei wem und seit wann.
5. Werte für „bei wem“: „Team“, „Softwarearchitekt“, „Auftraggeber“ und als Vorschlag zusätzlich „Projektleiter“ für die kurzen Schritte, die der Projektleiter selbst erledigt (zum Beispiel einen Prüfbericht einarbeiten). Werte für die Phase: Anforderung, Konzeption, Planung, Umsetzung, Abnahme, Integration, dazu für Pakete „wartet“ (Abhängigkeit noch nicht erfüllt) und „fertig“ (in `main` übernommen).
6. Fertige Pakete stehen in ihrem Vorhaben zuletzt und zurückgenommen. Vorhaben, deren Pakete alle fertig sind, stehen unten unter „Abgeschlossene Vorhaben“, zugeklappt; ein Klick klappt sie auf.
7. Beispieldaten, fest eingetragen und auf der Seite oben in einer Zeile als Beispiel gekennzeichnet:
   - „Entwicklungsverfahren verbessern“ (`verfahren`): Konzeption, bei Softwarearchitekt, keine Pakete.
   - „Strategietester“ (`backtest`): Umsetzung; `wp01` „Kursdaten und Datenbestand“ fertig, `wp02` „Einzelschritt-Test“ Abnahme beim Auftraggeber, `wp03` „Backtest und Vergleich“ wartet.
   - „Strategiedesigner“ (`strategiedesign`): Umsetzung; `wp01` „Grundgerüst“ fertig, `wp02` „Bearbeiten von Strategien“ Umsetzung beim Team.
   - „Verbindung zum Broker“ (`relay`): Umsetzung; `wp01` „Abruf von Kursdaten“ Umsetzung beim Softwarearchitekt (Lücke in der Spezifikation), `wp02` „Handel“ wartet.
   - „Neues Vorhaben“ (`beispiel`): Anforderung, beim Auftraggeber (Frage beantworten).
   - „Über-Dialog“ (`ablauftest`): alle Pakete fertig, unter „Abgeschlossene Vorhaben“.
8. Anpassung an die Fenstergröße in diesen Größen (Breite × Höhe in Pixeln): 390 × 844, 844 × 390, 820 × 1180, 1180 × 820, 1366 × 768, 1920 × 1080. Keine waagerechte Bildlaufleiste der Seite, nichts liegt übereinander. Tabellen dürfen auf schmalen Fenstern als untereinander stehende Karten erscheinen.
9. Hell und gut lesbar, ruhige Gestaltung, Hervorhebung für „Wartet auf Sie“ deutlich, aber nicht schreiend. Die Hervorhebung darf nicht allein an der Farbe erkennbar sein (zusätzlich zum Beispiel Rahmen oder Kennzeichen).
10. Die Seite enthält keine Namen von Rechnern oder Benutzern, keine Pfade, keine Ports und keine Links.

## Nicht-Umfang

- Erzeugen der Seite aus dem Repository, Workflow, Skripte
- automatisches Neuladen
- Englisch

## Technische Abnahmekriterien

1. Die Datei öffnet sich in Chromium, Firefox und WebKit über `file://` ohne Fehler in der Konsole.
2. Ein Browsertest (Playwright, Chromium) prüft in jeder Fenstergröße aus Punkt 8: keine waagerechte Bildlaufleiste der Seite, keine überlappenden Bereiche, der Bereich „Wartet auf Sie“ ist ohne Bildlauf sichtbar. Er prüft außerdem das Auf- und Zuklappen der abgeschlossenen Vorhaben.
3. Bildschirmbilder der ganzen Seite in allen Fenstergrößen aus Punkt 8 als PNG unter `tools/overview/prototype/screenshots/`.
4. `tools/overview/prototype/README.md` beschreibt Start, Beispieldaten und alle Entscheidungen, die du für Inhalt und Anordnung getroffen hast. Keine Pfade des Entwicklungsrechners, keine Zugangsdaten.
5. Die Datei liegt im Zweig unter `tools/overview/prototype/uebersicht-prototyp.html`, Browsertest und seine Abhängigkeiten ebenfalls unter `tools/overview/prototype/`. Keine Änderungen außerhalb dieses Verzeichnisses.

## Ergebnis

Ein benannter Commit im Zweig `verfahren/proto-uebersicht` auf GitHub. Nenne ihn vollständig im Ergebnis, dazu die erfüllten und nicht erfüllten Abnahmekriterien mit Nachweis und deine Entscheidungen.
