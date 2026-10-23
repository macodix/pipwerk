# Prüfbericht Spezifikation, Durchlauf 13 (Nachprüfung)

- Vorhaben: `strategiedesign`, ref `strategiedesign`, Phase 2, Rolle QA
- Geprüfter Commit: `b35d08498292bc197593316511a11aac24610cfc` (`main`)
- Vergleichsstand: `bb5e5716eee7fe66d1198abe3ab3ec64c4df75ad` (Durchlauf 12)
- Ergebnis: **bestanden**. Es gibt keinen blockierenden Befund. B1 aus Durchlauf 12 ist behoben.

## Umfang der Prüfung

Geprüft wurden nur die Stellen aus dem Prüfauftrag: der Diff `bb5e571` bis `b35d084` von `specification.md` und die Abbildung von `str-01`, `str-03` und der gesicherten „EMA-Trendfolge“. Dazu wurden `req-ui-012` und `req-fach-049a`/`req-fach-049` gegen die neuen Formulierungen gelesen.

## B1 – behoben

3.3 „Stand einer Instanz“ (Zeilen 146 bis 150) legt jetzt fest, was als Weg gilt:
- Im Hauptablauf ist es jeder Weg von einem Auslöser des Hauptablaufs.
- In einer Verwaltung, mit oder ohne eigene Auslöser, ist es jeder Weg zu ihrem „Order aufgeben“, fortgesetzt von einem eigenen Auslöser beziehungsweise vom Ausgang `gestellt` an.

Der Grund (eigene Auslöser wirken erst nach dem Stellen der Order) stimmt mit `req-fach-049` und `req-fach-049a` überein. Er stimmt auch mit 3.3 „Verbindung“ überein.

Abbildung der Testfälle:
- `str-01`: `zz_handel` hat die erste Verwendung in `trend_handel`. Jeder Weg zu „Order aufgeben“ führt über diese Berechnung. Die Verwendungen in `einstieg`, `stop`, `ziel` und in der Verwaltung mit den Auslösern `Tick` und `Kerzenschluss` sind damit zulässig. `zz_signal` wird nur in `trend_signal` verwendet. Null Fehler.
- `str-03`: `ema20` und `ema50` haben die erste Verwendung in der Bedingung „Kreuzen“, `atr14` in `stop`. Beide Stellen liegen vor „Order aufgeben“ auf jedem Weg. Die Verwendung in der Verwaltung mit eigenem Auslöser ist zulässig. Null Fehler.
- „EMA-Trendfolge“ (3.7, Zeile 344): Die Umwandlung legt in der Verwaltung den Eingang mit „Aktualisieren“ an. Die Wegprüfung ist erfüllt, wenn die erste Verwendung im Hauptablauf vor „Order aufgeben“ liegt. Das folgt aus der Rückfallregel in 3.3 (Zeile 140) und ist bei dieser Strategie so.

Die Zeile in 3.6 (Zeile 311), Abschnitt 10 Punkt 24 und der Änderungsnachweis stimmen mit der neuen Fassung überein.

## Blockierende Befunde

Keine.

## Geänderte Stellen zu H1 bis H4 und H6: keine neuen Fehler

- H1 (5.3, 10 Punkt 22): Startwert „Auswahl“ und Lage einer unverbundenen Instanz sind jetzt als Entscheidung der Spezifikation gekennzeichnet, nicht als Antwort des Auftraggebers.
- H2 (5.1, Abschnitt 6): Der Prototyp ist nicht mehr Vorlage und kein Nachweis. Der Nachweis verweist auf den Browsertest in Abschnitt 7, der die Testfälle ohne Textausdruck aufbaut (Zeile 498).
- H3 (3.3): Eine Regel der Strategie verwendet ihre Werte an den Elementen, auf die sie angewendet wird. Die Lücke ist geschlossen, es bleiben die Hinweise H-A und H-B.
- H4 (5.4): Passt zu `req-ui-012` (Zeile 304 im Anforderungsdokument): vorläufig, Darstellung offen, Vorschlag des Projektleiters nicht umgesetzt.
- H6 (5.2): „zwei Typen mit verschiedenen Kennungen und Arten (3.1)“ passt zu 3.1 (Kennung sprachneutral, Art Auslöser beziehungsweise Objekt der Anwendung). Eine konkrete Kennung des Auslösers nennt die Spezifikation nicht, das legt der Auftrag fest.

## Hinweise (je eine Zeile)

- H-A – 3.3 Zeile 150 und 3.6 Zeile 325 (und 140): Wo eine Instanz nur eine Regel der Strategie verwendet, bleibt offen, ob „seiner Regeln“ in „Instanz ohne Verbindung“ die Regeln der Strategie einschließt und zu welchem Element die Linie in 5.3 führt. Zählen alle Elemente mit Regeln, kann die Wegprüfung bei zwei „Order aufgeben“ auf getrennten Zweigen nie erfüllt sein. Ist das gewollt? Die Testfälle sind nicht betroffen: „Risiko je Trade“ verwendet keine Instanz.
- H-B – 3.3 Zeile 150: „Eine Instanz, deren erste Verwendung in einer Verwaltung liegt, verwenden weder der Hauptablauf noch eine andere Verwaltung“ passt nicht zur Wegregel, wenn die Verwaltung ein „Order aufgeben“ mit eigener Verwaltung enthält (Zeile 157). Dort ließe die Wegregel die Verwendung in der inneren Verwaltung zu. Gilt „andere Verwaltung“ auch für diese?
- H-C – 5.3 (Lage unverbundener Instanzen): Die Kennzeichnung als Entscheidung der Spezifikation steht nur in 10 Punkt 22, nicht in 5.3 selbst. Der Umschalter ist in 5.3 gekennzeichnet.
