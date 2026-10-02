---
name: pipwerk-test-deployment
description: Stellt ausschließlich den von QA freigegebenen Pipwerk-Codezustand für die Projektleiterprüfung bereit und verifiziert den laufenden Teststand.
---

# pipwerk-test-deployment

## Zweck

Den von QA freigegebenen Codezustand für die Projektleiterprüfung bereitstellen.

## Verfahren

1. Übernimm die eindeutige QA-Freigabe einschließlich Commit.
2. Verifiziere, dass die Freigabe genau für diesen Commit gilt.
3. Stelle ausschließlich den freigegebenen Codezustand bereit.
4. Starte die für die Prüfung erforderlichen Komponenten.
5. Verifiziere nach der Bereitstellung, dass der laufende Teststand dem freigegebenen Codezustand entspricht.
6. Bei Abweichung: Übergabe stoppen; keine Projektleiterprüfung auf einem nicht freigegebenen Stand.
7. Übergib dem Projektleiter Arbeitsauftrag, freigegebenen Commit und Testzugang bzw. erforderliche Prüfinformationen.
