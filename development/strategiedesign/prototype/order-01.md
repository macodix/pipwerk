# Auftrag Prototyp pipwerk Studio

- Vorhaben: `strategiedesign`, Phase 2 Konzeption
- zuständig: Entwickler Oberfläche
- Zweig: `strategiedesign/proto-studio`, Prototyp, wird nicht übernommen
- Stand: 2026-10-19

## Ziel

Ein klickbarer Prototyp der gesamten Oberfläche von pipwerk Studio, in dem der Auftraggeber die Testfälle `str-01` und `str-03` ohne Anleitung gestalten kann, in allen Fenstergrößen unten. Der Auftraggeber bestätigt den Prototyp, bevor die Oberfläche spezifiziert und umgesetzt wird (`docs/technical/entwicklungsverfahren.md`, Phase 2, Schritt 2). Der Prototyp zeigt Bedienung und Erscheinungsbild. Er rechnet nichts und braucht kein Backend.

Anlass: Arbeitspaket `wp02` wurde nicht abgenommen. Die Bedienung erschloss sich dem Auftraggeber nicht, das Erscheinungsbild wirkte „wie Formulare aus den 90er Jahren“. Der Abnahmebericht `development/strategiedesign/wp02/acceptance/1.md` nennt die Mängel M1 bis M17. Lies ihn vollständig, er ist die wichtigste Grundlage dieses Auftrags.

## Grundlagen

- `development/strategiedesign/wp02/acceptance/1.md`, Mängel M2 bis M17 (M1 betrifft nur die Dokumentation und ist nicht Gegenstand)
- `docs/design/requirements/anforderungen-strategiedesigner.md`, besonders req-ui-005, req-ui-007 bis req-ui-017 und req-ablauf-001 bis req-ablauf-009
- `docs/design/requirements/anforderungen-gesamtsystem.md`, req-system-024 (Anpassung an die Fenstergröße)
- `docs/design/domain/fachmodell.md` (Objekte, Ordertypen, Auslöser req-fach-053, mitgelieferte Indikatoren req-fach-054, Objekte der Anwendung req-fach-051) und `docs/design/domain/indikator-markttechnik.md`
- Testfälle `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md` und `docs/design/strategies/str-03-fachlich-ema-trendfolge.md`, ihre Dokumente `contracts/strategies/v1/testcases/str-01.strategy.json` und `str-03.strategy.json`
- die vom Auftraggeber gebaute Strategie `development/strategiedesign/wp02/acceptance/ema-trendfolge-auftraggeber.strategy.json`
- `development/strategiedesign/specification.md`, Abschnitte 3.1 bis 3.5 (Typbeschreibungen, mitgelieferte Typen, Instanzen, Ausdrücke, Regelvorlage) und 5. Abschnitt 5 ist der Stand vor der Abnahme und wird nach dem Prototyp neu geschrieben. Wo er den Anforderungen oder Mängeln widerspricht, gelten diese.
- Glossar `docs/technical/glossar.md`
- Die Oberfläche von `wp02` auf dem Zweig `origin/strategiedesign/wp02` unter `components/pipwerk-studio/frontend/` darfst du als Quelle nutzen, zum Beispiel für Typbeschreibungen, Übersetzungen oder Teile der Zeichenfläche. Sie ist kein Maßstab für die Bedienung.

## Umfang

Der Prototyp zeigt alle Arbeitsabläufe aus req-ablauf-001 mit simulierten Daten:

1. Aufbau: Kopfzeile mit Menü und „Über pipwerk Studio“, Elementbibliothek, Zeichenfläche, Eigenschaftenansicht, Fußzeile. Ein dauerhaft sichtbarer, ohne Vorwissen erreichbarer Bereich für die Strategieparameter (M12).
2. Elementbibliothek mit den Gruppen und Inhalten, die der Auftraggeber in M8 festgelegt hat, in Händlersprache. Gespeicherte Vorlagen stehen in ihrer Gruppe, gekennzeichnet als „eigene“. ZigZag als Indikator, „1-2-3-Trend (Markttechnik)“ bei den Trends (M9). Jeder Eintrag und jedes Feld der Eigenschaftenansicht hat eine kurze Erklärung in Händlersprache, die beim Zeigen erscheint (req-ui-016).
3. Zeichenfläche nach req-ui-017: Ablauf senkrecht, Eingang oben, Ausgänge unten, bei einer Bedingung `wahr` und `falsch` nebeneinander; automatische Anordnung mit möglichst wenigen Kreuzungen, Elemente verschiebbar; Objekte ohne Ablaufverbindung geordnet in einem eigenen Bereich neben dem Ablauf; benannte, einklappbare Abschnitte; die Verwaltung einer Order am Ausgang `gestellt`. Elemente sind bei normaler Ansicht lesbar (M10). Die Ansicht springt beim Ablegen nicht (M3). Der offene Punkt „Ausrichtung umschaltbar“ wird im Prototyp als Umschalter gezeigt, damit der Auftraggeber entscheiden kann.
4. Datenverbindungen nach req-ui-014: Eigenschaften eines Objekts als Ausgänge, Linie zu einem Eingang einer Bedingung, Berechnung, „Order aufgeben“ oder zum Parameter eines anderen Objekts; sichtbar von Ablaufverbindungen unterschieden; ein nur im Ausdruck verwendeter Name erscheint ebenfalls als Datenverbindung (M11). Die offenen Punkte der Spezifikation aus req-ui-014 (Darstellung der Ein- und Ausgänge, Bündelung vieler Ausgänge, Umbenennen und Löschen eines verbundenen Objekts) entscheidest du im Prototyp und beschreibst die Entscheidung im Ergebnis.
5. Bedingungen und Berechnungen aus Bausteinen nach req-ui-015 (M16): Werte aus allem, was ein Ausdruck ansprechen kann, Vergleiche und Verknüpfungen aus Listen in Händlersprache, Anzeige als lesbarer Satz auf der Zeichenfläche und in der Eigenschaftenansicht; die Ansicht als Ausdruck für Fortgeschrittene mit Formeleditor nach req-ui-015 (Hervorhebung, Klammern, Fehler an der Stelle, Vorschläge nach `Objekt.` auch für benannte Bedingungen und Berechnungen, M15). Beide Ansichten zeigen dieselbe Bedingung. Die Kreuzungsbedingung von `str-03` und die Bedingungen von `str-01` müssen sich in den Bausteinen bilden lassen.
6. Eigenschaftenansicht jeder Instanz mit ihren Parametern und ihren Eigenschaften (M7), Herkunft (req-ui-005), verständlicher Belegung eines Parameters mit sichtbarer Beschriftung der Belegungsart, „Strategieparameter“ als Auswahl der angelegten mit der Möglichkeit, dort einen neuen anzulegen, und einem Hinweis, wenn keine Auswahl möglich ist (M5, M12). Ein Trend lässt sich vollständig belegen, auch der Ausdruck für `Richtung` (M6). Jedes Objekt, Element und jeder Strategieparameter hat genau einen frei wählbaren Namen mit Leerzeichen und Umlauten, keine getrennte Bezeichnung, keine sichtbaren internen Kennungen (M14, req-ui-016).
7. Auslöser `Kerzenschluss` und `Tick` mit den Parametern nach req-fach-053, Instrument vorbelegt mit dem Instrument der Anwendung.
8. Regeln und Regelwerke in der Eigenschaftenansicht der Strategie und der Elemente nach req-ui-012, mit „Risiko je Trade“.
9. Bedienerführung nach req-ui-016: jeder leere Zustand nennt den nächsten sinnvollen Schritt; „Neue Strategie“ bietet einen geführten Aufbau (Auslöser, Indikatoren, Bedingung, Order), jederzeit verlassbar; Befunde nennen, wie man sie behebt, und führen per Klick zur Stelle (M13).
10. Konsistenzprüfung simuliert, ohne Meldung zum Wegklicken (req-ui-011): mindestens die Befunde „Element ohne Verbindung“, „Pflichtparameter ohne Wert“, „fehlerhafter Ausdruck“ und „kein Element ‚Order aufgeben‘ erreichbar“ (Hinweis), mit Markierung am Element und Text in der Eigenschaftenansicht.
11. Strategie anlegen, öffnen, speichern, schließen, löschen mit den Rückfragen aus req-ablauf-005 und req-ablauf-006. „Öffnen“ bietet die Strategie des Auftraggebers „EMA-Trendfolge“ (aus seiner gesicherten Datei, mit seinem Namen, seiner Beschreibung und seinen Werten, umgesetzt in die Darstellung des Prototyps) und die beiden Testfälle an.
12. Vorlagen (Inhalt des früheren Pakets `wp03`): „Neues Objekt“ für Indikator, Trend, Regel und Regelwerk, eigene Ansicht der Vorlage mit „Speichern“, „Prüfen“, „Schließen“, „Löschen“, die geöffnete Strategie bleibt dahinter offen; „Als Vorlage speichern“ an einer Instanz; Löschen einer Vorlage mit Anzeige der Strategien und Vorlagen, die Instanzen daraus enthalten; mitgelieferte Typen und „Risiko je Trade“ ohne Ändern und Löschen.
13. Einstellungen mit Sprache und Objektverzeichnis mit Rückfrage „Dateien verschieben?“. Alle Texte in Deutsch und Englisch, auch Befunde und Bezeichnungen mitgelieferter Vorlagen (M4).
14. Erscheinungsbild einer Anwendung für Händler (M10): einheitliche Farben, Abstände, Schrift, Symbole, gestaltete Steuerelemente statt unveränderter Standardsteuerelemente des Browsers, gruppierte Eigenschaftenansicht mit klarer Rangfolge, zurückhaltende Darstellung von „Entfernen“.
15. Anpassung an die Fenstergröße nach req-system-024 (M2) in diesen Größen (Breite × Höhe in Pixeln): 390 × 844 (Smartphone hoch), 844 × 390 (Smartphone quer), 820 × 1180 (Tablet hoch), 1180 × 820 (Tablet quer), 1366 × 768 (Notebook), 1920 × 1080 (großer Bildschirm). Bereiche dürfen ein- und ausgeklappt, umgeordnet oder nacheinander gezeigt werden.

Technik nach deiner Wahl, passend zu den Werkzeugen der Komponente (React, TypeScript, Vite, React Flow). Der Prototyp liegt auf seinem Zweig in `components/pipwerk-studio/prototype/`, getrennt von der bestehenden Oberfläche. Er lässt sich zu einer einzigen HTML-Datei bauen, die alle Skripte und Stile enthält und ohne Server und ohne Internetverbindung durch Öffnen im Browser läuft. Gespeichertes darf im Browser des Anwenders liegen; nach Neuladen muss der Prototyp mindestens wieder mit der Strategie des Auftraggebers und den Testfällen starten.

## Nicht-Umfang

- Backend, Web-API, Bibliothek, echte Konsistenzprüfung, Speichern im Objektverzeichnis
- Anwenderdokumentation und Testanleitungen (M1)
- Unit-Tests über das hinaus, was du zur eigenen Absicherung brauchst

## Technische Abnahmekriterien

1. Die gebaute Datei öffnet sich in Chromium, Firefox und WebKit über `file://` ohne Fehler in der Konsole.
2. Ein Browsertest (Playwright) baut in Chromium `str-03` aus der leeren Zeichenfläche nur über die Bedienung auf (Auslöser, drei Indikatoren, Kreuzungsbedingung aus Bausteinen, Berechnungen, „Order aufgeben“, Verwaltung), und ebenso den Hauptablauf und die Verwaltung von `str-01`. Kein Schritt braucht die Eingabe eines Ausdrucks als Text.
3. Ein Browsertest prüft in jeder Fenstergröße aus Punkt 15 mit geöffneter Strategie „EMA-Trendfolge“: keine waagerechte Bildlaufleiste der Seite, kein sichtbarer Bereich mit Breite oder Höhe null, keine überlappenden Bereiche; Elementbibliothek, Zeichenfläche, Eigenschaftenansicht und Strategieparameter sind erreichbar.
4. Bildschirmbilder der geöffneten Strategie „EMA-Trendfolge“ in allen Fenstergrößen aus Punkt 15, dazu je ein Bild der Fenstergröße 1366 × 768 von: Elementbibliothek mit Erklärung beim Zeigen, Bedingung aus Bausteinen, Formeleditor, geführter Aufbau, Befund mit Hinweis zur Behebung, Ansicht einer Vorlage, Einstellungen. Die Bilder liegen als PNG im Zweig unter `components/pipwerk-studio/prototype/screenshots/`.
5. `components/pipwerk-studio/prototype/README.md` beschreibt Bau und Start, was simuliert ist, und deine Entscheidungen zu den offenen Punkten aus Umfang Punkt 3 und 4. Keine Pfade des Entwicklungsrechners, keine Zugangsdaten.
6. Die gebaute Datei liegt im Zweig unter `components/pipwerk-studio/prototype/dist/pipwerk-studio-prototyp.html`.

## Ergebnis

Ein benannter Commit im Zweig `strategiedesign/proto-studio` auf GitHub. Nenne ihn vollständig im Ergebnis, dazu die erfüllten und nicht erfüllten Abnahmekriterien mit Nachweis und die Entscheidungen zu den offenen Punkten.
