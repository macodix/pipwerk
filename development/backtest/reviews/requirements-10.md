# Prüfbericht Dokumente des Auftraggebers, Durchlauf 10

- Vorhaben: `backtest`, Phase 1 (Rückkopplung, req-system-028)
- Geprüfter Commit: `d1ec3cc10f06408e45365bef90f4782695bf4655` (`main`)
- Prüfumfang: nur die zwei neuen Absätze von req-system-028 und der Eintrag im Änderungsnachweis (`docs/design/requirements/anforderungen-gesamtsystem.md`), gegen den übrigen Text von req-system-028, req-system-025 bis 027, Glossar und `scope.md`.

## Ergebnis: bestanden

Blockierende Befunde: keine. Die neuen Absätze widersprechen weder dem übrigen Text von req-system-028 noch req-system-025 bis 027, dem Glossar oder `scope.md`.
- „genau eine Ablageform" und „Behaltene Dateien liegen in einem Ablageverzeichnis" stehen nicht im Widerspruch. Die Ablageform gilt „für ihre Arbeit". Behaltene Dateien sind eine Wahl des Anwenders und damit ein Erfordernis im Sinne von „keine Kopien ohne Erfordernis".
- „Pflege durch den Anwender" widerspricht dem Satz „Entfernen ist Aufgabe der Komponente" nicht. Dieser Satz gilt nur für Daten, die nur für einen Vorgang angelegt werden.
- Der Änderungsnachweis nennt die Festlegung des Auftraggebers vom 2026-10-24.

## Hinweise (verhindern das Bestehen nicht)

1. **Automatischer Abruf und Import.** req-system-028 / req-system-027, req-test-003. Die Wahl „beim Import legt der Anwender fest" passt für den Import von Hand. Beim automatischen Abruf mit Import (req-system-027) greift der Anwender nicht ein. Lücke, Sache der Spezifikation: Gilt dort „sonst entfernt die Komponente sie"? Die Regel „Sonst entfernt…" legt das als Vorgabe nahe.
2. **Eigene Dateien des Anwenders.** req-system-028 / req-system-026. „Sonst entfernt die Komponente sie nach dem Import" ist mehrdeutig bei Dateien von der Festplatte des Anwenders: gemeint sind vermutlich nur Kopien der Komponente (Upload), nicht die Originaldatei. Sache der Spezifikation.
3. **Wahl bei mehreren Dateien.** req-system-028 / req-system-026. Ob die Wahl je Vorgang oder je Datei gilt und was bei Abbruch oder Fehler mit behaltenen Dateien geschieht, ist nicht gesagt. Sache der Spezifikation; der Abbruch-Satz des ersten Absatzes deckt das Entfernen ab.
4. **Format und JSON/CSV.** req-system-028 / req-system-026, req-system-027. req-system-026 nennt JSON oder CSV als festgelegtes Dateiformat, req-system-028 verlangt für Formate von pipwerk das effizienteste und seine Begründung in der Spezifikation. Die Spezifikation muss begründen, dass JSON/CSV diese Wahl erfüllt, oder die Formate abweichend belegen. Das Verhältnis ist Sache der Spezifikation (Festlegung: Anforderung req-system-028, Bestätigung 2026-10-24); der Auftraggeber legt kein Format fest.
5. **Übergangslösung.** req-system-027. Ob das Verzeichnis, in das das Programm schreibt, das „Ablageverzeichnis" ist oder ein davon getrenntes, ist nicht gesagt. Sache der Spezifikation.
6. **Glossar.** „Ablageverzeichnis" und „Ablageform" fehlen im Glossar (`docs/technical/glossar.md`), und die Definition von „Import" nennt das Behalten oder Entfernen der Dateien nicht. Folgt aus der Festlegung vom 2026-10-24; der Softwarearchitekt gleicht das Glossar an.

## Fragen an den Auftraggeber

Keine. Der Bericht geht nicht an den Auftraggeber.
