# Prüfauftrag Sicherheit, Arbeitszweig wp02, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `3ad5bc48bdf31396a8e2e144abdb17074c915fe8` auf Zweig `strategiedesign/wp02` (Merge-Commit der Aufträge 04, 05 und 06; später folgen nur Testberichte und Prüfaufträge unter `development/`), Vergleichsstand `main` (`c79b1f8f73cb0f9f844f0cd96709530997eb6041`)
- Aufträge: `development/strategiedesign/wp02/orders/04.md`, `05.md`, `06.md` auf `strategiedesign/wp02`
- Prüfgrundlagen: Spezifikation `development/strategiedesign/specification.md` auf `main`, Abschnitt 8 (Sicherheit), Plan `wp02`, `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md`, `docs/technical/pipwerk-domain.md`
- Testberichte Funktion: `development/strategiedesign/wp02/tests/04-functiontest-1.md`, `05-functiontest-1.md`, `06-functiontest-1.md` (alle bestanden)
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dies ist der erste und einzige Durchlauf je Arbeitspaket und vollständig. Nur blockierende Befunde verhindern das Bestehen.

## Tester Sicherheit

Prüfe den Arbeitszweig nach BSI-Grundschutz, OWASP und den Sicherheitsregeln. Schwerpunkte: neue Endpunkte `/api/v1/expressions` und `/api/v1/keys` (Eingabevalidierung, Grenzen, JSON Pointer, nie Ausführung von Ausdrücken), Lesen von Format 1.0 und 2.0 (unbekannte Elemente, höhere Hauptversion, Größen), Fehlerantworten ohne Systemdetails, Dateizugriffe im Objektverzeichnis (nur geprüfte UUID), Abhängigkeiten der Oberfläche (`npm audit`) und der Python-Pakete, Oberfläche (XSS, kein `dangerouslySetInnerHTML` mit fremden Daten, Ausdruckstexte nur als Text), Host- und Herkunftsprüfung, keine Zugangsdaten und Pfade im Repository.

Ablage: `sec-securitytest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
