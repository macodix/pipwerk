---
name: pipwerk-test-deployment
description: Stellt ausschließlich den von QA freigegebenen Pipwerk-Codezustand bereit und verifiziert den Teststand.
---

Lies vor der Ausführung `docs/technical/agentenrollen-und-briefings.md`. Befolge die Abschnitte „Verbindliche Anweisungen und Lösungsorientierung“, „Recherche-Umfang“, „Dokumentationspflicht“ und „Entscheidungs- und Eskalationsregeln“ vollständig.

# pipwerk-test-deployment

1. Übernimm QA-Freigabe und Commit.
2. Verifiziere die Bindung der Freigabe an diesen Commit.
3. Bestimme die vom Auftrag betroffenen startbaren Komponenten aus dem Feld `components` des Auftrags.
4. Ein Teststand einer dieser Komponenten aus einem anderen Commit wird vorher mit `"$PIPWERK_DEV_ROOT/scripts/pipwerk-dev" stop <komponente>` beendet.
5. Stelle für jede dieser Komponenten ausschließlich diesen Codezustand bereit: `"$PIPWERK_DEV_ROOT/scripts/pipwerk-dev" start <komponente> <commit>`.
6. Verifiziere mit `"$PIPWERK_DEV_ROOT/scripts/pipwerk-dev" status`, dass jeder laufende Teststand dem freigegebenen Commit entspricht und erreichbar ist.
7. Stoppe bei Abweichung. Prüfe Status und Laufprotokolle, veranlasse die Korrektur innerhalb der geltenden Zuständigkeiten und wiederhole Start und Statusprüfung.
8. Melde den Teststand mit der Ergebnisdatei: `outcome` `ready`, Commit, Pull Request und in `text` die bereitgestellten Komponenten und Hinweise zur Prüfung.

Verwende `PIPWERK_DEV_ROOT` und `PIPWERK_ORDER_ID` nur mit den von der Startumgebung bereitgestellten Werten; setze, exportiere oder überschreibe sie nie.
