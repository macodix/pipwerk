---
name: pipwerk-test-deployment
description: Stellt ausschließlich den von QA freigegebenen Pipwerk-Codezustand bereit und verifiziert den Teststand.
---

Lies vor der Ausführung `docs/technical/agentenrollen-und-briefings.md`. Befolge die Abschnitte „Verbindliche Anweisungen und Lösungsorientierung“, „Recherche-Umfang“, „Dokumentationspflicht“ und „Entscheidungs- und Eskalationsregeln“ vollständig.

# pipwerk-test-deployment

1. Übernimm QA-Freigabe und Commit.
2. Verifiziere die Bindung der Freigabe an diesen Commit.
3. Stelle ausschließlich diesen Codezustand bereit und starte die Komponenten mit `"$PIPWERK_DEV_ROOT/scripts/pipwerk-dev" start pipwerk-studio <commit>`.
4. Ein Teststand aus einem anderen Commit wird vorher mit `pipwerk-dev stop` beendet.
5. Verifiziere mit `pipwerk-dev status`, dass der laufende Teststand dem freigegebenen Commit entspricht und erreichbar ist.
6. Stoppe die Übergabe bei Abweichung. Prüfe Status und Laufprotokolle, veranlasse die Korrektur innerhalb der geltenden Zuständigkeiten und wiederhole Start und Statusprüfung.
7. Übergib Arbeitsauftrag, Commit und Prüfinformationen an den externen Projektleiter.

Verwende `PIPWERK_DEV_ROOT` nur mit dem von der Startumgebung bereitgestellten Wert; setze, exportiere oder überschreibe sie nie.
