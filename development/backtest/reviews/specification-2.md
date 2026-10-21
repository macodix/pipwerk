# Prüfbericht Spezifikation backtest, Durchlauf 2 (Nachprüfung)

- Ergebnis: **bestanden**
- geprüft: `development/backtest/specification.md` auf `main`, Commit `34a51ccadb0456ffc691982b134e6a1f7fa55077`
- Grundlage: Auftrag `reviews/specification-2-order.md`; Änderungen gegenüber `67c0339d26f4137e8f540b7cf41111dd8fb8e33c`; `specification-1.md`; `questions/backtest-01.md`; die geänderten Stellen habe ich gegen die unveränderten Stellen gelesen (3.4, 3.5, 4.1 bis 4.3, 5.1, 5.4, 6.1 bis 6.5, 7, 8.3, 8.4, 9, 10, 11, 13).
- Die Prüfung war nur statisch am Text. Eine Testumgebung wurde nicht gebraucht.

## Stand der blockierenden Befunde aus Durchlauf 1

| Befund | Stand | Beleg |
|---|---|---|
| B1 Zählung auf einem Instrument | erledigt | 3.4: „auf jedem Instrument (req-fach-046)“ |
| B2 Wirkung von Marktorder und Schließen | erledigt | 4.2: sofortige Ausführung; Position, Konto, freie Margin, `Order.Status` und die Zähler zeigen den neuen Stand in derselben und in jeder folgenden Auswertung. Die Folge für `str-03` steht in 4.2 und in 9. |
| B3 „Zum Testbeginn“ | erledigt | E8, 6.3 (Befehlsliste und Beschreibung), 7 (Befehle aus 6.3), 8.3. Haltepunkte bleiben, eingefügte `Manuell`-Auswertungen entfallen. Kein Widerspruch zu E7. |
| B4 Standard-Testkonto | erledigt | 6.2 und 8.3: löschbar, wird beim Start neu angelegt wie im bestätigten Prototyp |

## Neue blockierende Befunde

Keine. An den geänderten Stellen gibt es keinen Widerspruch zu den Dokumenten des Auftraggebers, zu `backtest-01` oder zu den unveränderten Stellen. Neue Einschränkungen tragen eine Begründung.

## Hinweise (keine Bedingung für das Bestehen)

1. 6.3, 8.4 Punkt 9: „Manuell auslösen“ mitten in einer Auswertung fügt die Auswertung erst nach deren Ende ein. Der Auftraggeber sagt „an der aktuellen Stelle“ (backtest-01, Antwort zu 2). Der bestätigte Prototyp sperrt den Befehl dort. Die Spezifikation weicht damit vom Prototyp ab und begründet es. Offen bleibt, wohin die Auswertung fällt, wenn zum selben Ereignis noch weitere Verwaltungen und der Hauptablauf folgen. Gehört in den Auftrag.
2. 5.1, 8.3: Die Zeitzone beim CSV-Import soll der Anwender angeben. In der Ansicht „Datenbestand“ (8.3) steht dafür kein Feld, und der Prototyp hat keins. Nicht geregelt ist auch die doppelte oder fehlende Ortszeit beim Wechsel der Sommerzeit.
3. 8.4 Punkt 7: Der Punkt steht unter den vom Auftraggeber bestätigten Festlegungen, nennt aber jetzt zusätzlich den Swap. Das ergänzt den Wortlaut aus `backtest-01` und ist als Abweichung vom Prototyp vermerkt. Der Auftraggeber sollte es zur Kenntnis bekommen.
4. 4.2: „Eröffnung `buy` und Schließen `sell` am Brief“ ist missverständlich. Gemeint ist offenbar die Richtung der geschlossenen Position (Schließen einer `sell`-Position am Brief). Das passt zu Stop-Loss und Take-Profit in derselben Liste.
5. 6.1: „also des letzten Montags bis Freitags davor“ kennt keine Feiertage und keine Handelspausen. Für die Vorbelegung genügt es, weil der Anwender den Zeitraum ändern kann.
