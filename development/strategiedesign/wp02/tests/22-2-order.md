# Prüfauftrag Auftrag 22, Durchlauf 2 (Nachprüfung)

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `f1196c83aed7eff67b783859e2caa1e61b12816a` auf Zweig `strategiedesign/wp02-22`, Vorgänger `a2aab998b08ea041b5ca4929a2b758173eea80a9`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/22.md`; vorheriger Bericht: `strategiedesign/wp02:development/strategiedesign/wp02/tests/22-functiontest-1.md`
- Es prüft nur der Tester Funktion. Eine Nachprüfung prüft nur die Befunde des vorigen Durchlaufs und die dafür geänderten Stellen.

## Tester Funktion

- B1: Prüfe, dass `test_remove_an_instance_with_its_uses` in `packages/domain-core/tests/test_operations.py` genau 3 Befunde festschreibt und die drei Elemente prüft; der Test besteht.
- Prüfe, dass der Diff zum Vorgänger nur diesen Test ändert.
- Führe die Tests der Bibliothek (`packages/domain-core`) mit ruff und mypy aus. Das Prüfskript `check` ist für die Nachprüfung nicht nötig; der Vorgänger hat es bestanden und der Diff berührt nur einen Test.
- Befehle enthalten keine Umgebungsvariablen und keine Kommandoersetzungen.

Ablage: `22-functiontest-2.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
