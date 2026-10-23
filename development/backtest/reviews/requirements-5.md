# Prüfbericht Dokumente des Auftraggebers, Vorhaben backtest, Durchlauf 5 (Nachprüfung)

- Rolle: QA
- Phase: 2 Konzeption, Schritt 1: Nachprüfung nach der Abstimmung
- geprüfter Stand: `main`, Commit `e80090ca20e7794523c386e79bc6e38b06c0286a`
- Vorheriger Durchlauf: `requirements-4.md` (Commit `42b60dbdf678d37fdccaecc5341a81fe9dc9902d`, bestanden)
- Ergebnis: **bestanden**
- Punkt 1 (blockierende Befunde der Phase 1): **erledigt**
- Punkt 2 (H6, Glossar „leer“): **erledigt**
- neue blockierende Befunde: 0, Hinweise: 2 (H11, H12)

## Punkt 1: blockierende Befunde

`git diff` zwischen den beiden Commits ändert in den Dokumenten des Auftraggebers nur drei Stellen: Status in `anforderungen-strategietester.md`, Eintrag „leer“ in `glossar.md`, Abschnitt „Stand“ in `scope.md`. req-test-004, req-test-008, `str-01` und das Fachmodell sind unverändert. Damit bleiben M1, M2 und H4 erledigt; keine Änderung öffnet sie wieder.

## Punkt 2: H6

`glossar.md` Eintrag „leer“ nennt jetzt die Ausnahme im Strategietester: Liefert ein Indikator zu Beginn eines Testlaufs noch keine Werte, gilt eine Bedingung mit diesen Werten als nicht erfüllt, die Auswertung bricht nicht ab; Verweis auf req-test-008. Das entspricht dem Wortlaut von req-test-008 (Zeile 50) und `str-01` Abschnitt 1 („kein Trend“). Der Änderungsnachweis des Glossars nennt Festlegung und H6. Erledigt.

## Punkt 3: geänderte Stellen

- `scope.md` „Stand“: Aussagen (Nachprüfung bestanden, Präsentation bestätigt am 21.10.2026, Phase 1 abgeschlossen) passen zu `requirements-4.md` und zum Auftrag. Kein Befund.
- Status von `anforderungen-strategietester.md`: Verweise auf `requirements-4.md` und die Präsentation stimmen, beide Dateien bestehen. Siehe H11.
- Glossar „leer“: Widerspruch zu nicht geänderten Stellen siehe H12.

## Neue blockierende Befunde

Keine.

## Hinweise

- H11 (Sache der Spezifikation, nicht blockierend): `anforderungen-strategietester.md` Dokumentstatus: „zuletzt aktualisiert“ steht weiter auf `2026-10-19`, obwohl „abgestimmt“ geändert wurde und der Änderungsnachweis (Abschnitt 6) Änderungen vom 2026-10-21 nennt. Für die Änderung des Status fehlt dort ein Eintrag; `status` bleibt `draft`. Ob der Status nach der Abstimmung anders lauten soll, legt der Auftraggeber fest.
- H12 (Sache der Spezifikation, nicht blockierend): `docs/technical/pipwerk-domain.md` Zeile 344 („Leer“) sagt weiter ohne Ausnahme „Rechnung und Vergleich mit ‚leer‘ sind ein Fehler“. Das Dokument ist nicht Gegenstand dieser Prüfung, widerspricht aber nun dem Glossar. Ebenso offen: Das Glossar nennt nur „Bedingung“ (wie req-test-008); ob `ISBLANK` auf einen Indikatorwert ohne Werte im Testlauf weiterhin Wahr liefert oder die ganze Bedingung „nicht erfüllt“ ist, steht nicht da.

## Zuordnung

| Befund | blockierend | Zuordnung |
|---|---|---|
| H11, H12 | nein | Sache der Spezifikation |

Fragen an den Auftraggeber: keine.
