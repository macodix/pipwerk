# Prüfbericht Dokumente des Auftraggebers, Vorhaben backtest, Durchlauf 3 (Nachprüfung)

- Rolle: QA
- Phase: 1 Anforderung, Nachprüfung vor der Präsentation
- geprüfter Stand: `main`, Commit `4356fa63ccbe5d7b90364871f3d2a6eaf7688526`
- Vorheriger Durchlauf: `requirements-2.md` (Commit `5a1072494849c0110f86804686ecb092dd9b6d3a`, nicht bestanden)
- Ergebnis: **nicht bestanden**
- blockierende Befunde: 2 (M1, M2), Hinweise: 5 (H1 bis H5)

## Stand der Befunde aus Durchlauf 2

| Befund | Stand | Beleg |
|---|---|---|
| N1 | erledigt | `Markttechnik` ist nicht mehr geltend (scope.md, Fachmodell req-fach-054). `str-01` bestimmt Trend und Bezüge aus dem `ZigZag` (Abschnitte 1 und 2). Die Fragen aus N1 gibt es nicht mehr. Ob `str-01` damit ausführbar ist, regeln M1 und M2. |
| N5 | erledigt | Datei heißt `anforderungen-strategietester.md`, `scope.md` verweist darauf. Im Glossar steht in „Kennung“ `trendrichtung`. Alte Dateinamen stehen nur noch in früheren Berichten. |
| N6 | erledigt | In `str-01` stehen weder „intakt“ noch „Trend und Marktphase“ als Parameterbeschreibung. Handelsidee, Abschnitt 6 und Parametertabelle sind umformuliert. |

## Neue blockierende Befunde

### M1 – str-01: Trendprüfung mit weniger als zwei endgültigen Hochs oder Tiefs

- Fundstelle: `str-01` Abschnitt 1 (Aufzählung Auf-/Abwärtstrend, „Sonst liegt kein Trend vor“) und Voraussetzungen; `glossar.md` Eintrag „leer“; Anforderungen Strategietester req-test-002, req-test-003.
- Sachverhalt: Das Glossar nennt als Beispiel für „leer“ das vorletzte Hoch des `ZigZag`, solange er noch keine zwei Hochs gesetzt hat, und sagt: Vergleichen mit „leer“ ist ein Fehler der Auswertung. `str-01` Abschnitt 1 vergleicht genau diese Werte und sagt für alles, was kein Auf- oder Abwärtstrend ist, „kein Trend“. Kursdaten vor dem Testzeitraum sind nicht vorgesehen (req-test-002, req-test-003 verlangen sie nur „für den Testzeitraum“). Zu Beginn jedes Testlaufs, in beiden Betriebsarten, hat der `ZigZag` daher noch keine zwei endgültigen Hochs und Tiefs. Es ist offen, ob dort „kein Trend“ gilt oder die Auswertung mit Fehler abbricht. Dasselbe gilt für Hoch und Tief, die der `ZigZag` zwar gesetzt, aber noch nicht endgültig gemeldet hat.
- Warum blockierend: Je nach Lesart bricht jeder Testlauf von `str-01` mit der ersten Auswertung ab oder läuft weiter. Der Nachweis des Vorhabens (beide Testfälle ohne Bearbeitung der Strategie) hängt davon ab.
- Zuordnung: Entscheidung des Auftraggebers.
- Fragen: Gilt „kein Trend“, wenn der `ZigZag` noch nicht zwei endgültige Hochs und zwei endgültige Tiefs geliefert hat, oder ist das ein Fehler der Auswertung? Sollen Kursdaten vor dem Testzeitraum geladen werden, damit die Indikatoren Werte haben?

### M2 – str-01: Einstiegsbezug kann vom Kurs bereits überschritten sein (Nachfolger von N1, Teil 1)

- Fundstelle: `str-01` Abschnitt 1 (letzter Satz), Abschnitt 2 (Tabelle der Bezüge), Abschnitt 3 (Einstieg), Abschnitt 5; Anforderungen Strategietester req-test-004.
- Sachverhalt: Verwendet werden nur endgültige Wendepunkte. Setzt der Kurs nach dem letzten endgültigen Hoch ein höheres, noch nicht endgültiges Hoch, liegt er über dem Einstiegsbezug. Die Stop-Order Long (Einstiegsbezug + Spread + Puffer) liegt dann unter dem Kurs, bei Short entsprechend darüber. Abschnitt 1 sagt aber, sie werde „erst ausgeführt, wenn der Kurs ihn überschreitet“. Wie die interne Abwicklung (req-test-004) eine solche Stop-Order behandelt (sofort ausführen, ablehnen, wartend lassen), steht nirgends. Der Fall tritt in einem Aufwärtstrend regelmäßig auf.
- Warum blockierend: Je nach Lesart führt dieselbe Strategie über denselben Zeitraum zu anderen Trades. Der Fall kehrt unverändert aus N1 (Durchlauf 2, Punkt 1, Variante „Kurs liegt über Punkt 2“) wieder.
- Zuordnung: Entscheidung des Auftraggebers (Verhalten von `str-01`); die Abwicklung einer Stop-Order auf der falschen Seite des Kurses wäre danach Sache der Spezifikation.
- Fragen: Soll `str-01` in diesem Fall eine Order stellen? Wenn ja, wie soll die Stop-Order behandelt werden, die schon über (Long) beziehungsweise unter (Short) dem Kurs liegt?

## Hinweise

- H1 (Spezifikation): `str-01` Abschnitt 6 passt eine wartende Order nur an, wenn der Stop-Bezug wechselt. Setzt der `ZigZag` ein neues endgültiges Hoch (neuer Einstiegsbezug) oder endet der Trend, bleibt die Order unverändert, bis der Stop-Bezug durchbrochen wird. Ob das gewollt ist, steht nicht da.
- H2 (Spezifikation): Der Stop-Bezug „letztes Tief“ (Long) kann zeitlich vor dem letzten Hoch liegen, wenn das Korrekturtief noch nicht endgültig ist. `str-01` sagt nicht, ob das gewollt ist. Es bleibt eindeutig lesbar.
- H3 (Spezifikation): Bei Gleichheit von Hochs oder Tiefs gilt „Sonst kein Trend“. Abschnitt 6, „Durchbricht der Kurs den Stop-Bezug“: Kurs (Bid, Ask, Schlusskurs) und Gleichheit nicht gesagt. Liegt der Kurs schon beim Planen jenseits des Stop-Bezugs, wird die Order sofort wieder gelöscht und beim nächsten Kerzenschluss neu gestellt.
- H4 (folgt aus Festlegung, Entscheidung 2026-10-21): Reste des zurückgestellten Indikators in geltenden Dokumenten: `fachmodell.md` Abschnitt zur Punkt-Schreibweise (Kennung `punkt_13`, Anzeigenamen `Punkt 1/3`, `Punkt 1/3 endgültig`); `str-01` Titel und Dateiname („Punkt 2 Ausbruch“, Begriff nicht mehr definiert); `str-01` Abschnitt 1 und Strategiedesigner-Anforderungen („Marktphase“, Beispiel „Trend und Marktphase prüfen“) benutzen „Marktphase“, die Anforderungen nennen dazu keine Bedeutung mehr. Außerhalb dieser Prüfung: `anforderungs-und-bausteinmatrix-der-acht-teststrategien.md` und `trading-strategiesammlung_v0.5.md` nennen für `str-01` weiter Markttechnik, Bewegung/Korrektur und Punkt 2 (nicht geändert, nicht Gegenstand).
- H5 (folgt aus Festlegung): `fachmodell.md` req-fach-054 beschreibt die Oberfläche des zurückgestellten Indikators („1-2-3-Trend (Markttechnik)“). Kein Widerspruch; der Satz steht ausdrücklich beim zurückgestellten Indikator.

## Zuordnung

| Befund | blockierend | Zuordnung |
|---|---|---|
| M1 | ja | Entscheidung des Auftraggebers |
| M2 | ja | Entscheidung des Auftraggebers |
| H1, H2, H3 | nein | Sache der Spezifikation |
| H4, H5 | nein | folgt aus Festlegung |

## Nachweis des Vorhabens

`str-03` blieb unberührt. `str-01` ist mit den Dokumenten noch nicht ausführbar, solange M1 und M2 offen sind. Der Produktname pipwerk replay und die Umbenennung der Datei sind in `scope.md`, Anforderungen, Glossar und Projektziel einheitlich. Widersprüche zu `anforderungen-strategiedesigner.md` und `strategiedesign/scope.md` wurden nicht gefunden.
