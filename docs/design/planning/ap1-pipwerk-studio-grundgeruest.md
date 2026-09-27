# Arbeitsauftrag – Pipwerk Studio AP1: Grundgerüst

## Status

- status: `accepted`
- stand: 2026-09-27
- komponente: `pipwerk-studio`

## Ziel

Ein startbares technisches Grundgerüst von Pipwerk Studio erstellen, auf dem die folgenden Arbeitspakete aufbauen können.

Nach AP1 muss erstmals eine leere Pipwerk-Studio-Oberfläche im Browser benutzbar sein.

## Umfang

1. `components/pipwerk-studio/` als eigenständig startbare Komponente anlegen.
2. Python-Backend mit FastAPI einrichten.
3. React-/TypeScript-Frontend mit Vite einrichten.
4. React Flow als Grundlage der leeren Designer-Arbeitsfläche integrieren.
5. Deutsch und Englisch mit i18next/react-i18next einrichten.
6. Eine einfache Studio-Oberfläche bereitstellen mit:
   - erkennbarer Bezeichnung „Pipwerk Studio“,
   - leerer Designer-Arbeitsfläche,
   - Umschaltung Deutsch/Englisch.
7. Backend und Frontend so verbinden, dass automatisiert geprüft werden kann, dass die Studio-Anwendung mit ihrem Backend kommuniziert.
8. Notwendige Start- und Entwicklungsanweisungen dokumentieren.

## Nicht Bestandteil von AP1

Keine fachlichen Objekte, Strategien, Nodes oder Regeln implementieren.

Insbesondere noch nicht:

- Trend oder Indikatoren;
- EMA-Strategie oder Punkt-2-Strategie;
- Eigenschaftenansicht;
- Strategie speichern oder laden;
- Strategieformat;
- Strategieausführung;
- Backtest;
- Order- oder Positionslogik;
- Pipwerk Relay;
- Benutzerverwaltung oder produktive Authentifizierung;
- Persistenz.

Offene fachliche oder technische Fragen dürfen für AP1 nicht durch eigene Festlegungen vorweggenommen werden.

## Abnahmekriterien

AP1 ist technisch abnahmefähig, wenn:

1. Pipwerk Studio entsprechend der dokumentierten Entwicklungsanleitung gestartet werden kann.
2. Die Browseroberfläche ohne Fehler erscheint.
3. Eine leere React-Flow-Arbeitsfläche sichtbar ist.
4. Die Oberflächensprache zwischen Deutsch und Englisch gewechselt werden kann.
5. Der Sprachwechsel sichtbare Studio-Texte tatsächlich umschaltet.
6. Frontend und FastAPI-Backend nachweislich miteinander kommunizieren.
7. Backend-Tests mit pytest bestehen.
8. Python-Prüfungen mit Ruff und mypy bestehen.
9. Frontend-Tests mit Vitest/Testing Library bestehen.
10. TypeScript-Prüfung mit `strict` ohne Fehler besteht.
11. Ein einfacher Playwright-Test Start der Oberfläche, Arbeitsfläche und Sprachumschaltung prüft.
12. Es wurden keine Funktionen aus dem ausdrücklich ausgeschlossenen Umfang vorweggenommen.

## Umsetzung

Auf dem bei Arbeitsbeginn aktuellen Stand von `main` aufsetzen und im vorgesehenen Claude-Worktree in einem eigenen Branch arbeiten.

Die Festlegungen des Repositorys, insbesondere `docs/technical/development-test-security-rules.md` und `docs/design/planning/entwicklungsplan-strategiedesigner.md`, sind einzuhalten.

Nach der Umsetzung alle für AP1 vorgesehenen Prüfungen ausführen und einen Pull Request erstellen.

Der Pull Request weist kurz aus:

- umgesetzten Umfang;
- ausgeführte Prüfungen und Ergebnisse;
- bekannte Einschränkungen;
- Abweichungen vom Auftrag.

Offene Anforderungen nicht selbst entscheiden.
