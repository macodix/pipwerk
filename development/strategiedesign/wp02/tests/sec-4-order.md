# Prüfauftrag Sicherheit, Arbeitszweig wp02, Nachprüfung zu den Aufträgen 15 bis 18

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `91c86c3943ce120eba726ae9d689538e5fa1880b` auf Zweig `strategiedesign/wp02` (Stand nach Zusammenführung der Aufträge 15 bis 18). Vorheriger bestandener Stand: `adef3772f8027285a601a7ee4883cff6633ae06c` (`sec-securitytest-3.md`).
- Umfang: Nachprüfung. Geprüft wird der Unterschied zwischen beiden Commits unter `components/` (Bibliothek, Backend, Oberfläche, Skripte) und `docs/` sowie `contracts/`. Die Änderungen betreffen unter anderem die Oberfläche (Zeichenfläche mit Tasten Entf und Rücktaste und Fokus, Eigenschaftenansicht, Auswahl und Löschen einer Verbindung, Texte in `de.json` und `en.json`, Ausgabe fremder Texte), die Beispieldatei `str-03-…` (Umbenennung), die Konfiguration von Entwicklungsserver und Browsertests (Ports, Adresse des Servers ohne Standardwert), das Prüfskript und das Testumgebungsskript sowie die Dokumentation.
- Prüfe insbesondere: XSS und Ausgabe fremder Texte (kein `innerHTML`, `dangerouslySetInnerHTML`), Behandlung von Tastenereignissen, feste Werte, Zugangsdaten, Pfade und Rechnernamen im Repository, Bindung von Backend, Entwicklungsserver und Testumgebung an lokale Adressen, CORS, neue oder geänderte Abhängigkeiten (`npm audit`, `pip`-Prüfung), Pfadzugriffe im Objektverzeichnis, Fehlerantworten ohne interne Pfade.
- Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`; nur blockierende Befunde verhindern das Bestehen.
- Testberichte Funktion: `development/strategiedesign/wp02/tests/15-1-functiontest.md` bis `18-2-functiontest.md` (alle zuletzt bestanden)
- Befehle über 5 Minuten laufen im Hintergrund (Bash mit `run_in_background`); frage den Stand mindestens alle 5 Minuten ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet. Schreibe den Bericht sofort nach Ende der Prüfung und beende danach deine Sitzung.

Ablage: `sec-securitytest-4.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
