# Prototyp: Stand der Vorhaben (drei Ebenen aus Kästchen)

Klickbarer Oberflächenentwurf der Übersichtsseite nach Festlegung 6 in `development/verfahren/scope.md` (Auftrag `development/verfahren/prototype/order-02.md`). Er ersetzt den abgelehnten ersten Entwurf. Prototyp, wird nicht übernommen und nicht aus dem Repository erzeugt.

## Start

- Ansehen: `uebersicht-prototyp.html` im Browser öffnen (`file://`). Eine Datei mit eingebetteten Stilen und wenig JavaScript, keine externen Dateien, keine Schrift oder Skripte aus dem Netz.
- Browsertest installieren: im Verzeichnis `npm install`, einmalig `npx playwright install chromium firefox webkit` (nur nötig, wenn die Browser fehlen).
- Browsertest in Chromium (schreibt auch die Bildschirmbilder nach `screenshots/`): `npm test`.
- Firefox beziehungsweise WebKit: `npm run test:firefox`, `npm run test:webkit`; alle drei: `npm run test:alle`.

Der Test prüft in den Fenstergrößen 390×844, 844×390, 820×1180, 1180×820, 1366×768 und 1920×1080 auf jeder der drei Ebenen: keine waagerechte Bildlaufleiste, nichts ragt aus dem Fenster, Text läuft nicht aus einem Kästchen, nichts liegt übereinander (Kopf, Legende, Pfadleiste, Kästchen und die Teile in einem Kästchen), keine Meldung in der Konsole. Dazu: Weg Vorhaben → Phase → Pakete per Klick und per Tastatur, Rückweg über Pfadleiste und Zurück-Taste, Marke „Wartet auf Sie“ für `backtest`/`wp02` auf allen drei Ebenen, Farben und Wörter des Stands, Schritte der Phasen 1 bis 3, keine Links nach außen und keine Pfade.

Bildschirmbilder: `screenshots/ebene1-vorhaben-<Breite>x<Höhe>.png` (alle Vorhaben), `ebene2-phasen-…` (Phasen von „Strategietester“), `ebene3-pakete-…` (Pakete der Phase „Umsetzung“ von „Strategietester“).

## Bedienung

- Die Ebene steht im Anker der Adresse: `#` alle Vorhaben, `#backtest` Phasen, `#backtest/4` Pakete der vierten Phase. Die Zurück-Taste des Browsers führt eine Ebene zurück.
- Kästchen, die weiterführen, sind Verweise (Tabulator, Eingabetaste), tragen unten „… ansehen ›“ und heben sich beim Überfahren. Kästchen der dritten Ebene führen nicht weiter und sind keine Verweise.
- Nach dem Wechsel der Ebene liegt der Fokus auf der Überschrift. Mit Umschalt+Tab erreicht man die Pfadleiste.

## Beispieldaten

Fest in der Datei eingetragen, oben als Beispiel gekennzeichnet; „erzeugt am 24.10.2026 um 09:40 Uhr“ ebenfalls fest. Alle Zeitpunkte außer dem Zeitpunkt der Erzeugung sind erfunden.

| Vorhaben | Kennung | Stand |
|---|---|---|
| Entwicklungsverfahren verbessern | `verfahren` | Konzeption, beim Softwarearchitekten, keine Pakete |
| Strategietester | `backtest` | Umsetzung; `wp01` „Kursdaten und Datenbestand“ fertig, `wp02` „Einzelschritt-Test“ in Abnahme beim Auftraggeber, `wp03` „Backtest und Vergleich“ wartet auf `wp02` |
| Strategiedesigner | `strategiedesign` | Umsetzung; `wp01` „Grundgerüst“ fertig, `wp02` „Bearbeiten von Strategien“ Umsetzung beim Team |
| Verbindung zum Broker | `relay` | Umsetzung; `wp01` „Abruf von Kursdaten“ Umsetzung beim Softwarearchitekten (Lücke in der Spezifikation), `wp02` „Handel“ wartet auf `wp01` |
| Neues Vorhaben | `beispiel` | Anforderung, beim Auftraggeber (Frage beantworten) |
| Berichte | `berichte` | nicht begonnen |
| Über-Dialog | `ablauftest` | alle Pakete fertig; Paketnamen „Dialog anlegen“ und „Dialog anzeigen“ von mir als Beispiel erfunden |

## Entscheidungen für Inhalt und Anordnung

1. **Stand durchgehend nach Spezifikation 7.2.** Vorhaben: grau ohne Meldung, grün wenn alle Pakete fertig, sonst gelb. Phase: grün, wenn das Vorhaben beziehungsweise alle Pakete sie hinter sich haben; gelb, wenn das Vorhaben oder mindestens ein Paket in ihr ist; sonst grau. Paket in Phase 4 bis 6: grau noch nicht erreicht, gelb gerade darin, grün dahinter. Ein fertiges Paket ist in jeder Phase grün, ein wartendes in jeder grau.
2. **Stand als Wort mit Zeichen** in jedem Kästchen: „○ Nicht begonnen“, „◐ Begonnen“, „● Erledigt“. Die Legende oben zeigt die drei Farben und den blauen Rahmen.
3. **Hervorhebung „Wartet auf Sie“:** blauer Rahmen von 5 Pixeln (die Stände haben 2 Pixel und sind grau, gelb, grün) und oben im Kästchen die ausgefüllte blaue Marke „▶ Wartet auf Sie: <Handlung>“. Die Marke steht auf der ersten Ebene am Vorhaben, auf der zweiten an der Phase, in der der Eintrag liegt, auf der dritten am Paket oder Schritt. Sie ist so auch ohne Farbe erkennbar.
4. **Das Paket behält seine Marke in jeder Phasenansicht.** `backtest`/`wp02` ist in Abnahme. Sieht man die Phase „Umsetzung“ an, steht das Paket dort grün („Erledigt“, „diese Phase liegt hinter dem Paket; es ist jetzt in Abnahme“), trägt aber weiter die Marke, weil der Auftrag sie auf allen drei Ebenen für dieses Paket verlangt. Die Phase „Umsetzung“ selbst ist auf der zweiten Ebene nicht hervorgehoben, nur „Abnahme“.
5. **Phase des Vorhabens bei Paketen:** `backtest` steht in „Umsetzung“, solange nicht alle Pakete fertig sind, auch wenn ein Paket schon in Abnahme ist (Spezifikation 7.2: Umsetzung, bis alle Pakete fertig sind). Deshalb ist die Phase „Umsetzung“ von `backtest` gelb, obwohl kein Paket gerade darin ist; ihr Kästchen sagt „0 von 3 Paketen in dieser Phase“.
6. **„Bei“ und „seit“ eines Vorhabens mit Paketen** werden aus den Paketen in Arbeit gebildet (weder fertig noch wartend): die Stellen aller dieser Pakete, „seit“ des zuletzt genannten Pakets. Die Marke nennt die Handlungen aller Pakete, die auf den Auftraggeber warten, ohne Doppelte.
7. **Kästchen der ersten Ebene:** Name groß, Kennung klein in Großbuchstaben, Stand, Phase, bei wem, seit wann; darunter, wie viele Pakete warten. „Berichte“: „Phase: noch keine“. „Über-Dialog“: „Phase: Integration“ und „Alle Pakete fertig“. Die Reihenfolge der Vorhaben ist die des Auftrags, nicht nach Dringlichkeit; abgeschlossene Vorhaben stehen am Ende.
8. **Kästchen der zweiten Ebene** wie in der Folie „Sechs Phasen“: „Phase n“ klein, Name groß. In den Phasen 4 bis 6 steht „<n> von <m> Paketen in dieser Phase“, in einer gelben Phase mit Paketen außerdem bei wem. Bei Vorhaben ohne Pakete steht in der gelben Phase bei wem und seit wann.
9. **Anordnung der sechs Phasen:** ab 1100 Pixel Breite sechs nebeneinander, bis 1099 Pixel zwei Reihen mit je drei, unter 520 Pixel untereinander. Erste und dritte Ebene sind Raster, dessen Spalten sich der Breite anpassen; unter 520 Pixel eine Spalte.
10. **Dritte Ebene Phasen 4 bis 6:** alle Pakete des Plans in der Reihenfolge des Plans, je Kästchen Name, Kennung, Stand; bei Paketen in dieser Phase bei wem, seit wann und gegebenenfalls ein Hinweis („Lücke in der Spezifikation“); bei fertigen „fertig, in main seit <Datum>“; bei wartenden „wartet auf <Name> (<Kennung>)“; bei Paketen in einer anderen Phase ein Satz, wo das Paket jetzt steht.
11. **Dritte Ebene Phasen 1 bis 3:** ein einziges Kästchen für den Schritt: in der gelben Phase der Schritt als Name („Spezifikation wird erstellt“, „Eine Frage zu den Anforderungen wartet auf Antwort“) mit bei wem und seit wann; in einer grünen „<Phase> abgeschlossen“; in einer grauen „Noch nicht erreicht“. Die Schritttexte sind Beispiel; die Spezifikation legt fest, woraus sie sich ergeben.
12. **Pfadleiste** unter der Legende: „Alle Vorhaben › Strategietester › Umsetzung“. Jeder Teil außer dem letzten ist ein Verweis auf seine Ebene. Der Kopf mit Überschrift, Zeitpunkt und Beispielhinweis bleibt auf allen Ebenen stehen.
13. **Gestaltung:** hell, Grund `#f4f6f3` und Grün wie die Folien der Präsentation, Kästchen mit 2 Pixel Rahmen und runden Ecken wie `.step`, Systemschrift, keine Schrift aus dem Netz. Gelb ist ein helles Gelb mit dunkelgelbem Rahmen, Schrift immer dunkel. Der Tastaturfokus ist ein dunkler Rahmen von 3 Pixeln mit Abstand.
14. **Silbentrennung** der Namen mit der Trennung des Browsers (`hyphens: auto`), damit lange Namen wie „Entwicklungsverfahren“ in schmalen Kästchen nicht mitten im Wort brechen. Die Marke wird nicht getrennt.
15. **Wartende Pakete** gelten in jeder Phase als noch nicht erreicht (grau), auch in Phase 4; die Spezifikation kennt für sie die Phase „wartet“.
16. **Testwerkzeug:** Playwright 1.64.1, wie im ersten Entwurf.
