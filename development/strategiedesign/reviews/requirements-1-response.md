# Bearbeitung des Prüfberichts, Durchlauf 1

- Vorhaben: `strategiedesign`
- Prüfbericht: [requirements-1.md](requirements-1.md)
- Rolle: Projektleiter
- Stand: 2026-10-15

## Vom Projektleiter korrigiert

Korrekturen, die sich aus bestehenden Festlegungen eindeutig ergeben:

| Befund | Korrektur |
|---|---|
| B1 | req-ui-010: Schaltfläche „rechts in der Kopfzeile“, ohne Bezug auf die Sprachauswahl. Die Sprachauswahl gehört nach req-ui-009 in die Einstellungen. |
| B2, erster Teil | req-ui-009: Die Einstellung „Objektverzeichnis“ liegt im Speicher der Komponente (Entscheidung vom 2026-10-12). Die Dateien sind die verbindliche Fassung, das Verzeichnis der Objekte im Speicher ist daraus neu erzeugbar. Der zweite Teil (Ändern des Verzeichnisses) ist Frage 13. |
| B3 | req-fach-027 dritter Absatz verweist auf die Verwaltung nach req-fach-049a (jüngere Festlegung vom 2026-10-14). |
| B5 | req-fach-001: Marktphase, Bewegung und Korrektur sind Werte der Eigenschaft `Phase` (Indikator Markttechnik). Position bleibt Objekt (Frage 4). |
| B6 | req-fach-006, req-ui-007 und Abschnitt 9 Punkt 7 ohne „Ergebnisse“ von Objekten (Glossar). |
| B7 | req-core-001: keine `ExitOrder`, Schließen über `Position schließen` und `CloseOrder` (Fachmodell vom 2026-10-14). |
| C6 | req-ablauf-006: zunächst Löschschutz bei Verwendung in anderen Objekten; durch Entscheidung 12 (Instanzmodell) überholt, eine Vorlage kann gelöscht werden, ihre Instanzen bleiben bestehen. |
| C9 | req-system-017: Dateiname der Startkonfiguration legt die technische Dokumentation der Komponente fest (Umsetzungsdetail, Zuständigkeit des Softwarearchitekten). |
| C10 | req-ui-010: Standanzeige in der Fußzeile beschrieben, wie sie seit dem Vorhaben `ablauftest` besteht. |
| D1 | „Komponente“ eines Objekts durch „Berechnungsverfahren“ beziehungsweise „Objekttyp“ ersetzt. „Komponente“ bezeichnet nur noch Teile des Systems. |
| D2 | „Prototyp“ in req-ui-007 und req-fach-046 entfernt. Die Aussagen gelten allgemein. |
| D3 | „Strategie“ statt „Strategiedefinition“. Das Format heißt Strategiedokument (Glossar). |
| D5 | „Eigenschaften“ statt „Parameter“ eines Ordertyps. „Bestimmungsverfahren“ ersetzt durch „Regeln zu ihrer Bestimmung und Prüfung“. |
| E1 | Änderungsnachweis des Anforderungsdokuments als eine Tabelle nach Datum, Dokumentstatus mit Vermerk der Abstimmung. Änderungsnachweis des Fachmodells nach Datum geordnet. |
| E2 | Sprachliche Fehler in req-param-004, req-ui-007 und req-fach-006 behoben. |
| E3 | Einfache Backslashes in req-system-017. |
| E4 | Glossar: „pipwerk Studio“. |
| E5 | `str-01`: Abschnitt „Herkunft“ statt „Originalbeschreibung“. Die Ursprungsdatei liegt nicht im Repository, maßgeblich ist das Dokument. |

## Fragen an den Auftraggeber

Vorgelegt in der Präsentation [requirements-1.html](../presentations/requirements-1.html), vom Auftraggeber im Chat am 15. Oktober 2026 entschieden und in die Dokumente eingearbeitet. Die Spalte „Entscheidung“ nennt die Abweichung vom Vorschlag, „wie Vorschlag“ bedeutet Bestätigung.

| Nr. | Befunde | Gegenstand | Entscheidung |
|---|---|---|---|
| 1 | A1, A12 (Einheiten) | Objekte Konto, Instrument und Kurs mit ihren Eigenschaften | Objekte der Anwendung Konto, Instrument, Kerze (je Zeiteinheit) und Tick statt „Kurs“, ohne Parameter, nicht gespeichert, Werte vom Handelssystem oder vom Strategietester (dort einstellbar je Testlauf). Offen: Objekt Kurs für Strategien ohne Kerzen. Fachmodell req-fach-051. |
| 2 | A2, A7 | Indikatoren EMA und ATR, Zeiteinheit und Instrument eines Indikators, mitgelieferte Indikatoren | wie Vorschlag, Parameter nach dem Muster der MetaTrader-5-Indikatoren. Offen: weitere Indikatoren, Expert Advisors als Objekte. Fachmodell req-fach-054. |
| 3 | A3 | Zugriff auf frühere Werte einer Eigenschaft | Funktion VORHER (gespeichert PREVIOUS) statt Klammerschreibweise. Auswahlliste der Eigenschaften als Anforderung req-ui-013. Fachmodell req-fach-014, req-fach-036. |
| 4 | A4, A15 | Objekt Position, Status einer Order, Bezug auf Order, Position und Strategie in Ausdrücken | wie Vorschlag, mit der Klarstellung: die Ausführung einer Order erzeugt eine Position, die Order wird nicht zur Position. Fachmodell req-fach-016, req-fach-019, req-fach-052, req-fach-049a. |
| 5 | A5, C4 | Auslösertypen und ihre Parameter, Auslöser der Verwaltung | wie Vorschlag, zusätzlich dritter Auslösertyp „externes Ereignis“ (Nachricht, Aufruf, externer Indikator, Agent), Daten und Weg offen. Fachmodell req-fach-053. |
| 6 | A6, A8, A9 | `str-01`: Zeiteinheiten, Handelsrichtung, Ausweichen auf die kleinere Handelszeiteinheit | Strategieparameter eingeführt (Signalzeiteinheit, Handelszeiteinheit). Am Ausgang „nicht gestellt“ (vorher „abgelehnt“) setzt der Ablauf die Handelszeiteinheit um und durchläuft die gesamte Prüfung erneut, Element „Parameter setzen“ und Rückführung. Handelsrichtung ist die Trendrichtung der Signalzeiteinheit, Markttechnik Abschnitt 5 ergänzt. Fachmodell req-fach-046, req-fach-047, req-fach-049. |
| 7 | A10 | Reihenfolge von direkten Werten und Regeln | wie Vorschlag. Fachmodell req-fach-046. |
| 8 | A11 | Regeln und Ausgänge bei `Order ändern` | wie Vorschlag, Ausgänge „geändert“ und „nicht geändert“, auch bei Position ändern. Eine Risikoregel kann durch eine Änderung nie umgangen werden. Fachmodell req-fach-049a. |
| 9 | A12 | `str-01`: Berechnung von Einstieg, Stop-Loss und Take-Profit | wie Vorschlag. Einheiten wählt der Anwender in der Berechnung, das Instrument stellt Pip, Punkt, Tickgröße bereit. str-01 Abschnitt 3. |
| 10 | A13 | Fallunterscheidung in Ausdrücken | wie Vorschlag, beides zulässig: Fallunterscheidung im Ausdruck oder wiederverwendbare Regel. Fachmodell req-fach-036. |
| 11 | A14 | Schreibweise von Objekten und Eigenschaften in Ausdrücken | Objekte der Anwendung heißen in Ausdrücken wie sie heißen, Instanzen tragen den vom Anwender vergebenen Namen ohne Leerzeichen, Punkt-Schreibweise. Eingabehilfe nach Objektname und Punkt (req-ui-013). Fachmodell req-fach-036. |
| 12 | B4, C5 | Bearbeiten gespeicherter Objekte, neues Objekt aus einem Objekttyp in einer Strategie | Instanzmodell statt Verweis: Alle Objekte (auch Regeln und Regelwerke) werden beim Einfügen als Instanz angelegt, erben die Standardwerte der Vorlage, erhalten einen Namen in der Strategie und sind dort in vollem Umfang änderbar. Vorlagen bleiben unberührt. Regelwerke sind Sammlungen konfigurierter Regeln mit Werten. Fachmodell req-fach-013a, req-fach-041, Anforderungen req-param-005, req-core-002, req-ablauf-003, req-ablauf-006. |
| 13 | B2, zweiter Teil | Ändern des Objektverzeichnisses mit vorhandenen Dateien | Abfrage, ob vorhandene Dateien verschoben werden sollen. req-ablauf-009. |
| 14 | B8 | Risikoregel: Konto, allgemeine Regel oder Regel der Strategie | Regelvorlage „Risiko je Trade“ mit Standardwert 1 %, in beiden Testfällen als Instanz der Strategie. Folgt aus Frage 12. |
| 15 | C1 | Öffnen einer Strategie und eines Objekts | wie Vorschlag. req-ablauf-008. |
| 16 | C2 | Regeln und Regelwerke zuordnen, Eigenschaftenansicht der Strategie | wie Vorschlag, als vorläufig gekennzeichnet, mit den Testfällen zu erproben. req-ui-012. |
| 17 | C3 | Verbindung oder Ausdruck bei der Verwendung einer Eigenschaft | Objekte der Anwendung sind in Ausdrücken immer verfügbar und stehen zusätzlich als Elemente in der Elementbibliothek. Keine Ablaufverbindung, „Element ohne Verbindung“ nur für Ablaufelemente. req-ablauf-003, req-ablauf-007. |
| 18 | C7 | Konsistenzprüfung eigenständiger Objekte und von Ausdrücken | wie Vorschlag. req-ablauf-007. |
| 19 | C8 | Schutz der Web-API in diesem Vorhaben | Anmeldung grundsätzlich vorgesehen, Zeitpunkt offen, nicht in diesem Vorhaben. pipwerk Studio nur im eigenen Netz des Anwenders. Gesamtsystem req-system-011, Anforderungen Abschnitt 9 Punkt 10. |
| 20 | D4 | Technische Ebene nach req-ui-004, Benennung von Ablaufschritten | wie Vorschlag, zusätzlich zeigt jede Instanz ihre Herkunft (Vorlage und Objekttyp) in der Eigenschaftenansicht. req-ui-003, req-ui-004, req-ui-005. |
