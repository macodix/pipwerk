# Bearbeitung des Prüfberichts, Durchlauf 1

- Vorhaben: `strategiedesign`
- Prüfbericht: [requirements-1.md](requirements-1.md)
- Rolle: Projektleiter
- Stand: 2026-10-14

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
| C6 | req-ablauf-006: Löschschutz auch bei Verwendung in anderen Objekten (Zweck des Löschschutzes, Entscheidung vom 2026-10-12). |
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

Vorgelegt in der Präsentation [requirements-1.html](../presentations/requirements-1.html). Die Entscheidungen werden in die Dokumente eingearbeitet und hier vermerkt.

| Nr. | Befunde | Gegenstand | Entscheidung |
|---|---|---|---|
| 1 | A1, A12 (Einheiten) | Objekte Konto, Instrument und Kurs mit ihren Eigenschaften | offen |
| 2 | A2, A7 | Indikatoren EMA und ATR, Zeiteinheit und Instrument eines Indikators, mitgelieferte Indikatoren | offen |
| 3 | A3 | Zugriff auf frühere Werte einer Eigenschaft | offen |
| 4 | A4, A15 | Objekt Position, Status einer Order, Bezug auf Order, Position und Strategie in Ausdrücken | offen |
| 5 | A5, C4 | Auslösertypen und ihre Parameter, Auslöser der Verwaltung | offen |
| 6 | A6, A8, A9 | `str-01`: Zeiteinheiten, Handelsrichtung, Ausweichen auf die kleinere Handelszeiteinheit | offen |
| 7 | A10 | Reihenfolge von direkten Werten und Regeln | offen |
| 8 | A11 | Regeln und Ausgänge bei `Order ändern` | offen |
| 9 | A12 | `str-01`: Berechnung von Einstieg, Stop-Loss und Take-Profit | offen |
| 10 | A13 | Fallunterscheidung in Ausdrücken | offen |
| 11 | A14 | Schreibweise von Objekten und Eigenschaften in Ausdrücken | offen |
| 12 | B4, C5 | Bearbeiten gespeicherter Objekte, neues Objekt aus einem Objekttyp in einer Strategie | offen |
| 13 | B2, zweiter Teil | Ändern des Objektverzeichnisses mit vorhandenen Dateien | offen |
| 14 | B8 | Risikoregel: Konto, allgemeine Regel oder Regel der Strategie | offen |
| 15 | C1 | Öffnen einer Strategie und eines Objekts | offen |
| 16 | C2 | Regeln und Regelwerke zuordnen, Eigenschaftenansicht der Strategie | offen |
| 17 | C3 | Verbindung oder Ausdruck bei der Verwendung einer Eigenschaft | offen |
| 18 | C7 | Konsistenzprüfung eigenständiger Objekte und von Ausdrücken | offen |
| 19 | C8 | Schutz der Web-API in diesem Vorhaben | offen |
| 20 | D4 | Technische Ebene nach req-ui-004, Benennung von Ablaufschritten | offen |
