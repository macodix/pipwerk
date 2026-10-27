# Auftrag Prototyp Übersicht in drei Ebenen aus Kästchen

- Vorhaben: `verfahren` (Entwicklungsverfahren verbessern), Phase 2 Konzeption
- zuständig: Entwickler Oberfläche
- Zweig: `verfahren/proto-uebersicht`, Prototyp, wird nicht übernommen. Er ersetzt den Entwurf aus [order-01.md](order-01.md), den der Auftraggeber abgelehnt hat, weil er eine Liste mit Tabellen und keine grafische Übersicht war.
- Stand: 2026-10-24

## Ziel

Ein klickbarer Oberflächenentwurf der Übersichtsseite nach Festlegung 6 in `development/verfahren/scope.md` (Fassung vom 24.10.2026 mit drei Ebenen aus Kästchen). Der Auftraggeber öffnet ihn und erkennt in zwei bis drei Klicks ohne Anleitung, wo ein Vorhaben steht, wer daran arbeitet und was auf ihn wartet. Er bestätigt den Entwurf, bevor die Seite spezifiziert und umgesetzt wird. Der Entwurf zeigt Inhalt, Anordnung und Erscheinungsbild mit fest eingetragenen Beispieldaten. Er wird nicht aus dem Repository erzeugt.

## Grundlagen

- `development/verfahren/scope.md`, Festlegungen 4 (Namen, Phasennamen) und 6 (Übersicht)
- `development/verfahren/specification.md`, Abschnitt 7.2 (Phase und „bei wem“ je Vorhaben und Paket)
- Vorbild der Kästchen: Folie „Sechs Phasen“ in `docs/technical/praesentation-entwicklungsprozess.html` (Klassen `.flow` und `.step`) und die Paketfolien in `development/backtest/presentations/plan-1.html`. Übernimm Form und Ruhe der Gestaltung, nicht die festen Foliengrößen.

## Umfang

1. Eine einzige HTML-Datei mit eingebetteten Stilen und wenig eingebettetem JavaScript. Kein Rahmenwerk, keine externen Dateien, keine Schriften oder Skripte aus dem Netz. Sie läuft durch Öffnen im Browser über `file://`. Sprache Deutsch.
2. Kopf: Überschrift „Stand der Vorhaben“, der Zeitpunkt der Erzeugung in Ortszeit ausgeschrieben („erzeugt am 24.10.2026 um 09:40 Uhr“) und eine Zeile, die die Angaben als Beispiel kennzeichnet. Darunter eine Pfadleiste der Ebenen, zum Beispiel „Alle Vorhaben › Strategietester › Umsetzung“. Jeder Teil davon führt zurück auf seine Ebene. Die Zurück-Taste des Browsers führt eine Ebene zurück (Ebene im Anker der Adresse).
3. Farben des Stands auf allen Ebenen gleich: grau nicht begonnen, gelb begonnen, grün erledigt. Der Stand steht in jedem Kästchen zusätzlich als Wort, damit er nicht allein an der Farbe erkennbar ist. Eine kleine Legende erklärt die Farben.
4. Erste Ebene: je Vorhaben ein Kästchen mit Name groß, Kennung klein, Phase, bei wem die Arbeit liegt und seit wann. Stand: grau, solange das Vorhaben noch keine Meldung hat; grün, wenn alle Pakete fertig sind; sonst gelb.
5. Zweite Ebene (Klick auf ein Vorhaben): seine sechs Phasen nebeneinander als Kästchen mit Nummer und Name wie in der Folie „Sechs Phasen“. Stand je Phase: grün, wenn das Vorhaben beziehungsweise alle Pakete sie hinter sich haben; gelb, wenn das Vorhaben oder mindestens ein Paket gerade in ihr ist; sonst grau. In den Phasen 4 bis 6 steht im Kästchen, wie viele Pakete in ihr sind, in der gelben Phase außerdem bei wem.
6. Dritte Ebene (Klick auf eine Phase):
   - Phasen 4 bis 6: alle Pakete des Plans als Kästchen, eingefärbt nach ihrem Stand in dieser Phase: grau noch nicht erreicht, gelb gerade in dieser Phase, grün hinter sich. Je Kästchen Name, Kennung klein, bei wem und seit wann; ein Paket, das noch auf ein anderes wartet, zeigt „wartet auf …“ mit dessen Namen.
   - Phasen 1 bis 3: Diese Phasen haben keine Pakete. Ein Kästchen zeigt den Schritt, in dem das Vorhaben steht: was gerade geschieht, bei wem und seit wann, eingefärbt wie die Phase.
   - Eine weitere Ebene unter den Paketen gibt es nicht. Die Seite liest nur `main` (Spezifikation E5), Aufträge eines Pakets liegen auf seinem Arbeitszweig.
7. Was auf den Auftraggeber wartet, ist auf jeder Ebene hervorgehoben: das Kästchen des Pakets oder Schritts, die Phase, in der es liegt, und das Vorhaben. Die Hervorhebung ist ein kräftiger Rahmen und die Marke „Wartet auf Sie“ mit der Handlung („Präsentation bestätigen“, „Frage beantworten“, „Abnahme durchführen“). Sie darf nicht allein an der Farbe erkennbar sein und muss sich von den drei Farben des Stands unterscheiden.
8. Werte für „bei wem“: „Team“, „Softwarearchitekt“, „Projektleiter“, „Auftraggeber“. Phasennamen: Anforderung, Konzeption, Planung, Umsetzung, Abnahme, Integration.
9. Beispieldaten, fest eingetragen, alle Namen erfunden außer dem ersten:
   - „Entwicklungsverfahren verbessern“ (`verfahren`): Konzeption, bei Softwarearchitekt, keine Pakete.
   - „Strategietester“ (`backtest`): Umsetzung; `wp01` „Kursdaten und Datenbestand“ fertig, `wp02` „Einzelschritt-Test“ in Abnahme beim Auftraggeber, `wp03` „Backtest und Vergleich“ wartet auf `wp02`.
   - „Strategiedesigner“ (`strategiedesign`): Umsetzung; `wp01` „Grundgerüst“ fertig, `wp02` „Bearbeiten von Strategien“ Umsetzung beim Team.
   - „Verbindung zum Broker“ (`relay`): Umsetzung; `wp01` „Abruf von Kursdaten“ Umsetzung beim Softwarearchitekten (Lücke in der Spezifikation), `wp02` „Handel“ wartet auf `wp01`.
   - „Neues Vorhaben“ (`beispiel`): Anforderung, beim Auftraggeber (Frage beantworten).
   - „Berichte“ (`berichte`): nicht begonnen.
   - „Über-Dialog“ (`ablauftest`): alle Pakete fertig.
10. Anpassung an die Fenstergröße in diesen Größen (Breite × Höhe in Pixeln): 390 × 844, 844 × 390, 820 × 1180, 1180 × 820, 1366 × 768, 1920 × 1080. Keine waagerechte Bildlaufleiste der Seite, nichts liegt übereinander. Die sechs Phasen stehen auf schmalen Fenstern in zwei oder mehr Reihen oder untereinander.
11. Hell und gut lesbar, ruhige Gestaltung. Kästchen, die zu einer weiteren Ebene führen, sind als anklickbar erkennbar und mit der Tastatur erreichbar.
12. Die Seite enthält keine Namen von Rechnern oder Benutzern, keine Pfade, keine Ports und keine Links nach außen.

## Nicht-Umfang

- Erzeugen der Seite aus dem Repository, Workflow, Skripte
- automatisches Neuladen
- Englisch

## Technische Abnahmekriterien

1. Die Datei öffnet sich in Chromium, Firefox und WebKit über `file://` ohne Fehler in der Konsole.
2. Ein Browsertest (Playwright) prüft in jeder Fenstergröße aus Punkt 10 auf allen drei Ebenen: keine waagerechte Bildlaufleiste der Seite, keine überlappenden Kästchen. Er prüft außerdem den Weg Vorhaben → Phase → Pakete per Klick und per Tastatur, den Rückweg über Pfadleiste und Zurück-Taste und dass die Marke „Wartet auf Sie“ auf allen drei Ebenen für `backtest`/`wp02` erscheint.
3. Bildschirmbilder als PNG unter `tools/overview/prototype/screenshots/` in allen Fenstergrößen aus Punkt 10, je Größe eins für jede Ebene: erste Ebene, Phasen von „Strategietester“, Pakete der Phase „Umsetzung“ von „Strategietester“. Die Bildschirmbilder des alten Entwurfs entfernst du.
4. `tools/overview/prototype/README.md` beschreibt Start, Beispieldaten und alle Entscheidungen, die du für Inhalt und Anordnung getroffen hast. Keine Pfade des Entwicklungsrechners, keine Zugangsdaten.
5. Die Datei ersetzt `tools/overview/prototype/uebersicht-prototyp.html`. Browsertest und seine Abhängigkeiten liegen ebenfalls unter `tools/overview/prototype/`. Keine Änderungen außerhalb dieses Verzeichnisses.

## Ergebnis

Ein benannter Commit im Zweig `verfahren/proto-uebersicht` auf GitHub. Nenne ihn vollständig im Ergebnis, dazu die erfüllten und nicht erfüllten Abnahmekriterien mit Nachweis und deine Entscheidungen.
