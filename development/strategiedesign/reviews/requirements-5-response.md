# Bearbeitung des Prüfberichts, Durchlauf 5 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Prüfbericht: [requirements-5.md](requirements-5.md)
- Rolle: Projektleiter
- Stand: 2026-10-16

Der blockierende Befund N8 geht auf eine Bearbeitung des Projektleiters zurück (H1 aus Durchlauf 4) und wurde ohne Rückfrage korrigiert. Die Grenze der Durchläufe gilt seit Commit `70507a6` nach Fortschritt, nicht nach fester Zahl.

| Befund | Bearbeitung |
|---|---|
| N8 | req-fach-019: `Preis` ist bei den wartenden Ordertypen der vorgegebene Preis nach req-fach-029, bei der `StopLimitOrder` also der Auslösepreis; `Limitpreis` bleibt zusätzliche Eigenschaft. req-core-002: Die Regel „Risiko je Trade“ rechnet bei einer Stop-Limit-Order mit `Order.Limitpreis`. |
| H13 | req-fach-051: Einleitung nennt Instanzen nur für Konto, Instrument, Kerze und Tick; Tabelle nennt die Bedeutung von Order und Position in einer Regel. |
| H14 | req-fach-051: In einer Regel auf eine Order ist `Order` diese Order, `Position` nicht verfügbar; in einer Regel auf eine Position ist `Position` diese Position und `Order` die Order, aus der sie entstanden ist. req-ablauf-003 und Glossar gleichbedeutend gefasst. |
| H15 | req-fach-019: `MarketOrder` und `CloseOrder` gleich behandelt: angenommener Preis ist der aktuelle Kurs (Brief für Kauf, Geld für Verkauf), nach der Ausführung der Ausführungspreis. req-fach-021: Prüfung nach Ausführung nur für `MarketOrder`. |
| H16 | req-fach-021 und req-core-002: Prüfung nach der Ausführung auf der entstandenen Position mit deren Werten. Keine Fallunterscheidung im Ausdruck: bestimmen oder prüfen ergibt sich aus dem Aufruf (req-fach-020), Order oder Position aus dem Objekt, auf das die Regel angewendet wird. |
| H17 | req-fach-013a: Objekttyp `Indikator` beziehungsweise `Trend` für vom Anwender angelegte Objekte. Glossar „Objekttyp“ nennt „Indikator“. |
| H18 | `scope.md`: Zahl der Durchläufe entfernt. |
