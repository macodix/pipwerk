# Prüfauftrag Sicherheit, Arbeitszweig wp02, Nachprüfung zu den Aufträgen 08 bis 14

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `adef3772f8027285a601a7ee4883cff6633ae06c` auf Zweig `strategiedesign/wp02` (Stand nach Zusammenführung der Aufträge 08 bis 14). Vorheriger bestandener Stand: `bb200ef3abffed8aab9e55f8ef508971d624145f` (`sec-securitytest-2.md`).
- Umfang: Nachprüfung. Geprüft wird der Unterschied zwischen beiden Commits unter `components/` (Bibliothek, Backend, Oberfläche, Skripte) und `docs/`. Die Änderungen betreffen unter anderem neue Endpunkte und Schnittstellenangaben (`/api/v1/usage`, `/api/v1/removals`, `/api/v1/expressions`, Anschluss der Bibliothek), Objekttypen und ihre Methoden, die Ausgabe fremder Texte (Namen, Beschreibungen, Befundtexte, Ausdrücke) in der Oberfläche, die Zeichenfläche, Eigenschaftenansicht, Bausteine und den Formeleditor, die Browsertests (Konfiguration, Ports) und das Testumgebungsskript.
- Prüfe insbesondere: Eingabevalidierung und Begrenzungen der neuen Endpunkte (Größe, Tiefe, Anzahl; Fehlerantworten ohne interne Pfade oder Ausnahmetexte), Pfadzugriffe im Objektverzeichnis (Pfadumleitung, Verknüpfungen), XSS und Ausgabe fremder Texte (kein `innerHTML`, `dangerouslySetInnerHTML`), Auswertung von Ausdrücken (keine Ausführung beliebigen Codes), neue Abhängigkeiten (`npm audit`, `pip`-Prüfung), Zugangsdaten, Pfade und Rechnernamen im Repository, Bindung von Backend und Testumgebung an lokale Adressen, CORS.
- Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`; nur blockierende Befunde verhindern das Bestehen.
- Testberichte Funktion: `development/strategiedesign/wp02/tests/08-functiontest-1.md` bis `14-3-functiontest.md` (alle bestanden)
- Befehle über 5 Minuten laufen im Hintergrund (Bash mit `run_in_background`); frage den Stand mindestens alle 5 Minuten ab.

Ablage: `sec-securitytest-3.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
