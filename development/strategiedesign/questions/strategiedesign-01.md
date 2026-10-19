# Frage strategiedesign-01 – Bestätigung des Prototyps pipwerk Studio, Rollendateien in `devteam/`

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- von: Softwarearchitekt
- an: Projektleiter
- Stand: 2026-10-19

## Unterbrochene Aufgabe

`specify` für `strategiedesign` (Phase 2). Stand:

- Nachprüfung der Dokumente des Auftraggebers, Durchlauf 12: bestanden (`development/strategiedesign/reviews/requirements-12.md`, geprüft auf Commit `8a023d14ee9e256797925d677e5d5deb18a657a2`). Bearbeitung der Hinweise N1 bis N6: `development/strategiedesign/reviews/requirements-12-response.md`. N1, N3 und N4 liegen beim Projektleiter zur nächsten passenden Gelegenheit; sie blockieren nichts.
- Klickbarer Prototyp der gesamten Oberfläche von pipwerk Studio einschließlich `wp03` ist fertig. Auftrag: `development/strategiedesign/prototype/order-01.md`. Zweig `strategiedesign/proto-studio`, Commit `dce2b7b1939a91bdd56802812e36cb900c6b4558`. Alle sechs technischen Abnahmekriterien des Auftrags sind erfüllt. Nachweis: Die Browsertests auf diesem Commit habe ich selbst laufen lassen, Ergebnis `34 passed` in Chromium, Firefox und WebKit (Aufbau von `str-03` und `str-01` nur über die Bedienung, Anordnung in den sechs Fenstergrößen nach req-system-024, Start über `file://` ohne Fehler).
- Wartet auf die Bestätigung des Prototyps (Frage 1): technische Spezifikation der Oberfläche, Prüfung durch die QA, danach `present`; anschließend der neue Plan.

## Wo der Prototyp liegt

- Zum Ausprobieren: `development/strategiedesign/prototype/pipwerk-studio-prototyp.html` auf `main`. Die Datei im Browser öffnen, ohne Server und ohne Internetverbindung. Beim Start ist die Strategie „EMA-Trendfolge“ des Auftraggebers offen. Unter „Öffnen“ stehen außerdem die Testfälle `str-01` und `str-03`. Neu angelegte Strategien bleiben nur im Speicher dieses Browsers.
- Bildschirmbilder (13 Stück, darunter die EMA-Trendfolge in allen sechs Fenstergrößen): `strategiedesign/proto-studio:components/pipwerk-studio/prototype/screenshots/`.
- Beschreibung, Bedienung in Kürze, Zuordnung zu den Mängeln M2 bis M17 und alle Entscheidungen des Entwicklers: `strategiedesign/proto-studio:components/pipwerk-studio/prototype/README.md`.

Was der Prototyp nur vortäuscht: Er rechnet nichts und hat kein Backend. Die Konsistenzprüfung läuft im Browser nach. Die drei Wendepunkte beim `ZigZag` und die Vorlage „Schneller EMA 9“ sind Annahmen, damit etwas zu sehen ist. Die Namen der Strategie des Auftraggebers sind in Händlersprache gesetzt, zum Beispiel `order_ausgefuehrt` als „Order ausgeführt“; seine Werte sind unverändert.

Grenzen: Echte Touch-Eingabe ist nicht geprüft. Ziehen aus der Bibliothek auf die Fläche geht auf Touchgeräten nicht, dort fügt ein Klick das Element ein. Bei sehr verzweigten Abläufen können sich Linien kreuzen.

## Fragen

### 1. Bestätigung des Prototyps

Benötigte Entscheidung: Bestätigt der Auftraggeber den Prototyp als Vorlage für Spezifikation und Umsetzung der Oberfläche (Entwicklungsverfahren, Phase 2, Schritt 2)? Er soll dafür die Testfälle `str-01` und `str-03` und seine Strategie ohne Anleitung durchspielen, in den Fenstergrößen, die er nutzt.

Im Prototyp sind folgende Punkte so gelöst, wie unten beschrieben. Mit der Bestätigung gelten sie als bestätigt; jeder Einwand geht mit `revise` zurück:

1. Ausrichtung des Ablaufs (req-ui-017): Umschalter „Senkrecht / Waagerecht“ auf der Zeichenfläche, senkrecht als Standard.
2. Werte von Objekten: Ein Objekt ist eine Karte im Bereich „Objekte und ihre Werte“, jede Eigenschaft eine Zeile mit eigenem Anschlusspunkt. Ein Element hat einen einzigen Eingangspunkt. Seine einzelnen Eingänge stehen in der Eigenschaftenansicht und in den Bausteinen unter „Verbundene Werte“.
3. Linien: Ablauf durchgezogen mit Pfeil, Verwaltung grün gepunktet, Wert farbig gestrichelt. Mehrere Werte desselben Objekts zum selben Element sind eine Linie mit Zahl. Der Umschalter „Alle / Auswahl / Aus“ zeigt Wertlinien für alle Elemente, nur für das gewählte Element oder gar nicht.
4. Umbenennen eines Objekts: Alle Verwendungen ziehen ohne Rückfrage mit.
5. Löschen eines verwendeten Objekts: Rückfrage mit der Liste der betroffenen Elemente. Danach bleibt im Ausdruck ein leerer Baustein, und die Prüfung meldet ihn mit dem Weg zur Behebung.

Vorschlag: Prototyp bestätigen, die Ausrichtung umschaltbar lassen. Begründung: Die Anordnung ist in beiden Richtungen dieselbe, der Aufwand ist gering, und waagerecht nutzt breite Bildschirme besser aus.

### 2. Rollendateien in `devteam/`

Sachverhalt: Die Meldung verlangt, die Rollendateien in `devteam/` an die Briefings anzugleichen. Der Softwarearchitekt kann `devteam/` weder lesen noch schreiben. Lese- und Schreibversuche wurden mit „Permission … has been denied because Claude Code is running in don't ask mode“ abgelehnt. Änderungen an `devteam/` veranlasst laut Entwicklungsverfahren, Abschnitt „Konfiguration der Rollen“, der Projektleiter über eine Anweisung in `transfer/`.

Benötigte Handlung, zuständig Projektleiter: Die Rollendateien in `devteam/` an `docs/technical/agentenrollen-und-briefings.md` auf dem aktuellen Stand von `main` angleichen. Abweichungen, die ich an meiner eigenen Rollendatei sehe, weil sie als Anweisung meiner Sitzung vorliegt:

1. Verbindliche Anweisungen, für alle Rollen: Die Regel „Keine Einschränkung ohne Erfordernis“ fehlt (Briefings, Zeile „Schränke nichts ein …“, Commit `96b1d33`).
2. Verbindliche Anweisungen, für alle Rollen: Statt „Halte die Grenze von drei Durchläufen je Prüfschleife ein“ gilt die Grenze nach Fortschritt (Abschnitt „Grenze der Durchläufe“).
3. Briefing Softwarearchitekt, `check`: Satz zur Nachprüfung ab dem zweiten Durchlauf und Absatz zur Selbstkorrektur (Befunde, die aus einer Festlegung folgen, und Befunde der Spezifikation) fehlen.
4. Briefing Softwarearchitekt, `specify`: Beginn mit der Nachprüfung der Befunde aus Phase 1 fehlt.
5. Briefing Softwarearchitekt, Schritt 11: Erst die unabhängigen Teile bearbeiten, alle Fragen in einem Dokument mit Vorschlag sammeln, und die Grenze nach Fortschritt. Das fehlt.
6. Briefing QA: Die Regel „Lücken“ (Commit `dd10cea`). Die Datei der QA kann ich nicht einsehen; ob dort weitere Abweichungen bestehen, ist ungeprüft.

Die übrigen Rollendateien kann ich nicht einsehen. Ob sie weitere Abweichungen haben, ist ungeprüft.

Vorschlag: Alle Rollendateien gegen den aktuellen Stand der Briefings vergleichen und angleichen. Die Antwort nennt den Commit des Stands der Briefings, gegen den abgeglichen wurde.

## Hinweise an den Projektleiter, keine Fragen

- Das Briefing Softwarearchitekt, Schritt 10, verlangt bei jeder Ergänzung der Spezifikation in Phase 4 `present`, und das Paket ruht. Das Entwicklungsverfahren, Abschnitt „Meldungen“, lässt eine rein technische Ergänzung ohne `present` zu. Die beiden Stellen sollten übereinstimmen.
- Das Briefing Softwarearchitekt, `specify`, nennt den klickbaren Prototyp vor der Spezifikation jeder neuen Oberfläche nicht. Das Entwicklungsverfahren, Phase 2, Schritt 2, verlangt ihn. Gearbeitet habe ich nach dem Entwicklungsverfahren.

## Antwort

