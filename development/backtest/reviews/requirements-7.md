# Prüfbericht Dokumente des Auftraggebers, Durchlauf 7

- Vorhaben: `backtest`, Phase 1, Rückkopplung aus der Abnahme von `wp02`, Versuch 2
- Ergebnis: **bestanden**
- Geprüfter Commit: `d1943301dc121ddf21d8ef6d0dc761214531a52e` (`main`)
- Umfang: nur die geänderten Stellen req-system-025 (Absatz zum Löschen) und req-system-026 (Dateien, Größe, Fortschritt, Abbrechen) in `docs/design/requirements/anforderungen-gesamtsystem.md`, dazu Widersprüche zu nicht geänderten Stellen, Fachmodell, Glossar und den Testfällen `str-01`, `str-03` laut `scope.md`.

## Blockierende Befunde

Keine.

## Geprüft

- Widersprüche: Keiner. Die Änderungen widersprechen weder req-system-027 noch req-test-003 (fehlende Kursdaten werden nach dem Löschen neu beschafft, in der Übergangslösung nicht) noch dem Nachrichtensystem (dort keine Größengrenze für Dateien, `anforderungen-nachrichtensystem.md`).
- Umsetzungsdetails: Keine. Weder Format, Ansicht noch Speicherung sind vorgegeben.
- Offene Fragen: Keine ungekennzeichneten.
- Testfälle `str-01`, `str-03`: Sie brauchen Kerzen, bei Auslöser `Tick` auch Ticks (req-test-003). Die Änderungen schränken das nicht ein. Löschen und Importgröße berühren die Testfälle nicht.
- Änderungsnachweis (Zeile 2026-10-23, Versuch 2) nennt beide Änderungen und die Festlegung des Auftraggebers.

## Hinweise (nicht blockierend)

Alle Sache der Spezifikation, keine Frage an den Auftraggeber.

1. req-system-025, Absatz zum Löschen: „Reihe“ kommt sonst nirgends vor, weder in den Anforderungen noch im Glossar. Die Spezifikation legt fest, was eine Reihe ist (Kerzen je Instrument und Zeiteinheit, Ticks je Instrument; ob je Broker getrennt, sagt req-system-025 für Kerzen und Ticks nicht).
2. req-system-025, Absatz zum Löschen: „ebenso die Angaben zu einem Instrument je Broker“ kann als „auch für einen Zeitraum“ gelesen werden. Die Angaben haben keinen Zeitbezug. Die Spezifikation legt fest, dass sie nur ganz gelöscht werden.
3. req-system-025, Lücke: Nicht gesagt ist, ob Löschen verhindert wird oder Folgen hat, wenn ein laufender Testlauf die Daten liest. Die Spezifikation regelt das, wenn es den Betrieb betrifft.
4. req-system-026, Lücke: Nicht gesagt ist, was beim Abbrechen mit den bereits übernommenen Daten geschieht (behalten oder zurücknehmen) und ob der Abbruch eine Datei oder den ganzen Vorgang betrifft. Die Spezifikation legt es fest.
5. req-system-026: „beliebig viele“ und „nur durch den Speicherplatz begrenzt“ sind Festlegungen des Auftraggebers. Die Spezifikation darf sie nur mit begründeter technischer Erfordernis einschränken (Verfahren „Keine Einschränkung ohne Erfordernis“).
6. Glossar: Die Einträge „Datenbestand historischer Kursdaten“ und „Import“ nennen Löschen, Fortschritt und Abbrechen nicht. Das Glossar kann ergänzt werden, ein Widerspruch besteht nicht.
