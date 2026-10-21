# Prüfbericht Arbeitspaketplan backtest, Durchlauf 1

- Ergebnis: **nicht bestanden** (1 blockierender Befund)
- Geprüfter Stand: `main`, Commit `8ce9905563f12a73e99af623f77a07ccae5ace4d`
- Gegenstand: `development/backtest/plan.md` (Phase 3, QA)
- Geprüft gegen: `scope.md`, `specification.md` (Bestätigungsvermerk in `presentations/specification-1.html` vorhanden), `strategiedesign/plan.md`, `strategiedesign/specification.md` (nur Abschnitt 3.2, `ZigZag`), die Anforderungen an den Strategietester und das Gesamtsystem (req-system-024 bis 027).

## Ergebnis je Prüfpunkt

1. Anforderungen → Spezifikation: req-test-001 bis 022 und req-system-024 bis 027 sind in der Spezifikation abgedeckt (Spalte „Anforderungen“ in 8.3 und Abschnitte 3 bis 6). Kein Befund. Offene Punkte (Unterschiede zwischen Fassungen, `Markttechnik`) sind in Abschnitt 1 ausgenommen.
2. Spezifikation → Pakete: Jeder Abschnitt der Spezifikation steht in „Abdeckung der Spezifikation“ und in den „Umgesetzten Teilen“ mindestens eines Pakets. Alle Glossarbegriffe aus Abschnitt 12 sind einem Paket zugeordnet. Kein Befund.
3. Gliederung der Pakete: Alle vier Pakete haben Ziel, Umfang, Nicht-Umfang, umgesetzte Teile, Abhängigkeiten und Abnahmekriterien. `wp02` bis `wp04` haben ein Kriterium zur Bedienbarkeit nach dem Prototyp. Kein Befund (siehe Hinweis 1).
4. Abhängigkeiten: Befund B1.
5. Abnahmekriterien: stimmen mit Spezifikation und Anforderungen überein, außer B1.

## Befunde (blockierend)

**B1 – `wp01` verlangt in Umfang und Kriterium 4 etwas, das erst `wp03` liefert**
- Fundstelle: `plan.md`, `wp01` Umfang dritter Punkt und Abnahmekriterium 4; `wp03` Umfang erster Punkt („`ZigZag` mit den neuen Eigenschaften und ergänzter Typbeschreibung“); `specification.md` 3.3 und 9.
- Sachverhalt: `wp01` passt das Testfalldokument `str-01` an die Fassung vom 2026-10-21 an und verlangt, dass es sich „ohne Fehler der Konsistenzprüfung“ öffnet. Nach Abschnitt 9 verwendet `str-01` die Eigenschaften `letztes_hoch`, `vorletztes_hoch`, `letztes_tief`, `vorletztes_tief` des `ZigZag`. Diese Eigenschaften gibt es im Katalog nicht: `strategiedesign/specification.md` (Abschnitt 3.2) kennt nur `wendepunkt_1_*` bis `wendepunkt_3_*`. Die Typbeschreibung des `ZigZag` ergänzt nach Abschnitt 3.3 erst `wp03`. `wp01` hängt nur von `strategiedesign/wp02` ab, nicht von `wp03`.
- Frage: Wie soll `str-01` in `wp01` ohne Befund der Konsistenzprüfung öffnen, solange die Eigenschaften nicht im Katalog stehen? Welches Paket ändert die Typbeschreibung des `ZigZag` und das Testfalldokument, und wie ist das mit der Reihenfolge der Abhängigkeiten und den Kriterien 4 von `wp01` und 2 von `wp03` vereinbar?

## Hinweise (nicht blockierend)

1. `wp01` ändert sichtbar Texte und Katalog in pipwerk Studio, hat aber kein Kriterium zur Bedienbarkeit; die Kriterien 1 bis 5 sind für den Auftraggeber prüfbar, ein Testfall ohne Anleitung fehlt.
2. `wp04` Kriterium 2 setzt voraus, dass `str-01` im vorbelegten Zeitraum eine abgelehnte Stop-Order erzeugt (Spezifikation 4.3: nur wenn der Brief den Preis erreicht hat). Ob das mit den Kursdaten eintritt, ist offen.
3. `wp01` und `strategiedesign/wp03` ändern beide pipwerk Studio und hängen nicht voneinander ab; nur für `wp04` begründet der Plan die Reihenfolge.
4. `wp03` ist erst abnehmbar, wenn der Auftraggeber die Referenzwerte aus MetaTrader 5 liefert; der Plan beschreibt den Weg (`question` über den Projektleiter), nennt aber keinen Zeitpunkt vor dem Nachweis im Prüfbericht.
5. `wp02` Kriterium 3 braucht eine echte Installation von MetaTrader 5 beim Auftraggeber und eine Netzverbindung zur Testumgebung; diese Voraussetzung steht im Plan nicht.
6. Die Vorbelegung und Änderung der Standardquelle (Spezifikation 5.1) und die Verdichtung der Kontoentwicklung (6.4) kommen in keinem Abnahmekriterium vor; Testdetail, kein Befund.
