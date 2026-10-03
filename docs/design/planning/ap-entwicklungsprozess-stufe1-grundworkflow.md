# Arbeitsauftrag – Entwicklungsprozess Stufe 1: Agentischer Grundworkflow

## Status

- status: `draft`
- stand: 2026-10-02
- bereich: Entwicklungsprozess (keine Produktkomponente)

## Ziel

Den im Entwicklungsplan festgelegten automatisierten agentenbasierten Entwicklungsablauf auf dem Entwicklungsrechner einrichten und durch einen vollständigen Durchlauf nachweisen.

Nach diesem Arbeitspaket läuft ein vom Nutzer freigegebener Arbeitsauftrag ohne manuelle technische Zwischenschritte des Nutzers durch: Projektleitung, Softwarearchitektur und Orchestrierung, Implementierung, unabhängige QA, Korrekturschleife, commitgebundene Testbereitstellung, Prüfung der Auftragserfüllung und Übergabe zur fachlichen Erprobung. Die manuelle Tätigkeit des Nutzers beschränkt sich auf fachliche und grundlegende Architekturentscheidungen sowie die abschließende fachliche Erprobung.

Grundlage ist `docs/design/planning/entwicklungsplan-strategiedesigner.md`, Abschnitte „Automatisierter agentenbasierter Entwicklungsablauf“ und „Ausbau des Entwicklungsprozesses“.

## Umfang

1. Projektleiter-Agent auf Grundlage von OpenClaw einrichten: klärt und formuliert Arbeitsaufträge mit dem Nutzer, legt freigegebene Aufträge unter `docs/design/planning/work-orders/` ab, stößt den Softwarearchitekt-Agenten aktiv mit eindeutiger Auftragsreferenz an und prüft nach der Testbereitstellung die Auftragserfüllung.
2. Softwarearchitekt-Agent auf dem Entwicklungsrechner auf Grundlage von OpenClaw einrichten: verantwortet Softwarearchitektur und technische Konzeption, überwacht Architekturkonformität und orchestriert den automatisierten Ablauf.
3. KI-Modelle über den API-Key-basierten Multi-LLM-Anbieter anbinden; derzeit OpenRouter. Keine Bindung an einen einzelnen Modellanbieter oder ein einzelnes Modell; Anbieter und Modelle sind konfigurierbar und im laufenden Betrieb änderbar.
4. Entwicklungs-Agenten mit eigenem Arbeitsbereich `implement/` einrichten: setzt den übergebenen Auftrag innerhalb der Architekturvorgaben um, führt technische Prüfungen aus, erstellt Commit und Pull Request.
5. QA-Agenten mit eigenem Arbeitsbereich `review/` einrichten: führt unabhängige technische Qualitätssicherung gegen Auftrag, Architektur, Projektregeln, Code, Tests und Dokumentation durch; läuft mit einem anderen Modell als der Entwicklungs-Agent.
6. Automatische Korrekturschleifen einrichten: QA-Befunde und Abweichungen aus der Projektleiterprüfung werden über den Softwarearchitekt-Agenten klassifiziert und der zuständigen Rolle zur Korrektur zugeführt. Nach Codeänderungen erfolgt erneut QA.
7. Entscheidungswege einrichten: fachlicher Klärungsbedarf läuft über Softwarearchitekt → Projektleiter → Nutzer; Architekturentscheidungen innerhalb dokumentierter Vorgaben trifft und dokumentiert der Softwarearchitekt; neue Architekturgrundsätze oder Änderungen bestehender Vorgaben gehen über den Projektleiter an den Nutzer.
8. Testbereitstellung einrichten: QA gibt ausschließlich einen konkreten Commit frei. Exakt dieser Commit wird als Teststand aufgebaut, benötigte Abhängigkeiten werden eingerichtet, die Anwendung wird gestartet und ihre Erreichbarkeit geprüft. Vor Übergabe wird die Commit-Identität verifiziert. Ändert sich danach der Code, ist die QA-Freigabe ungültig und erneute QA erforderlich. Automatisierung unter `scripts/`.
9. Übergabe und Abschluss einrichten: Nach erfolgreicher Testbereitstellung prüft der Projektleiter-Agent den laufenden Stand gegen jedes Abnahmekriterium. Erst bei „Auftrag erfüllt“ erfolgt die Übergabe an den Nutzer. Nach Nutzerabnahme gibt der Projektleiter den Abschluss frei; der Softwarearchitekt veranlasst Merge und Abschluss und kontrolliert den übernommenen Stand.
10. Lokale Arbeitsbereiche an den Entwicklungsplan angleichen: `claude/` wird zu `implement/`, `codex/` wird zu `review/`; abhängige Verweise mitziehen.
11. Vor Freigabe des automatisierten Grundworkflows prüfen, ob die dokumentierten Architekturvorgaben für selbständige Architekturentscheidungen des Softwarearchitekten ausreichend sind.
12. Einrichtung und Bedienung des Grundworkflows in `docs/technical/` dokumentieren.

## Nicht Bestandteil dieses Arbeitspakets

- Spec Kit (Stufe 2);
- Linter und Codechecker als Quality Gates (Stufe 3);
- weitere Qualitätswerkzeuge (Stufe 4);
- n8n-Anbindung;
- Änderungen an Produktkomponenten über das für den Nachweis-Durchlauf Erforderliche hinaus;
- Orchestrierung über GitHub-Funktionen; GitHub bleibt Repository- und Pull-Request-Ablage.

Offene fachliche Fragen dürfen nicht selbst entschieden werden. Technische Entscheidungen folgen der festgelegten Rollenverteilung: Architekturentscheidungen innerhalb dokumentierter Vorgaben liegen beim Softwarearchitekten, normale Implementierungsentscheidungen beim Entwicklungs-Agenten; neue Architekturgrundsätze oder Änderungen bestehender Vorgaben werden dem Nutzer über den Projektleiter vorgelegt.

## Abnahmekriterien

Das Arbeitspaket ist abnahmefähig, wenn:

1. Ein vollständiger Durchlauf mit einem vereinbarten Nachweis-Auftrag belegt ist: Nutzerfreigabe, aktive Übergabe vom Projektleiter an den Softwarearchitekten, Implementierung mit technischen Prüfungen, Pull Request, unabhängige QA, commitgebundene Testbereitstellung, Projektleiterprüfung und Übergabe an den Nutzer.
2. Entwicklungs- und QA-Agent nachweislich mit unterschiedlichen Modellen gelaufen sind.
3. Die Korrekturschleife nachweislich funktioniert: Mindestens ein QA-Befund wurde über den Softwarearchitekten an den Entwicklungs-Agenten übergeben, korrigiert und erneut durch QA geprüft.
4. Der Eskalationsfall nachweislich funktioniert: Fachlicher Klärungsbedarf oder eine grundlegende Architekturentscheidung wird über den Projektleiter dem Nutzer vorgelegt; bei ausbleibendem Fortschritt entsteht keine Endlosschleife.
5. Der QA-Agent einen eindeutig bestimmten Commit freigegeben hat und ausschließlich dieser Commit automatisch bereitgestellt, gestartet und auf Erreichbarkeit geprüft wurde.
6. Vor der Projektleiterprüfung die Identität des laufenden Teststands mit dem QA-freigegebenen Commit verifiziert wurde.
7. Nachgewiesen ist, dass eine Codeänderung nach QA-Freigabe die Freigabe ungültig macht und erneute QA erfordert.
8. Der Projektleiter den laufenden Teststand gegen die Abnahmekriterien geprüft hat und die Nutzerübergabe erst nach „Auftrag erfüllt“ erfolgt ist.
9. Die Rückschleife bei „Auftrag nicht erfüllt“ über Projektleiter → Softwarearchitekt → zuständige Korrektur → QA → Testbereitstellung → Projektleiterprüfung funktioniert.
10. Nach Nutzerabnahme der Abschluss durch den Projektleiter freigegeben und Merge/Abschluss durch den Softwarearchitekten veranlasst und kontrolliert werden kann.
11. Keine Zugangsdaten oder API-Schlüssel im Repository liegen.
12. Die lokalen Arbeitsbereiche `implement/` und `review/` bestehen und verwendet wurden.
13. Die dokumentierten Architekturvorgaben auf ausreichende Grundlage für selbständige Architekturentscheidungen geprüft wurden.
14. Einrichtung und Bedienung dokumentiert sind.

## Grundsätze zur Modellwahl

Die Rollen sind nicht dauerhaft an konkrete KI-Modelle gebunden. Konkrete Modellnamen werden in Anforderungen, Architektur-, Rollen- und Prozessfestlegungen nicht als festgelegte Zuordnung geführt. Die jeweils eingesetzten Modelle sind austauschbare Laufzeitkonfiguration.

Die konkrete Modellwahl erfolgt als austauschbare Laufzeitkonfiguration und ist nicht Gegenstand dieses Arbeitspakets. Entwicklungs- und QA-Agent werden mit unterschiedlichen Modellen betrieben, um eine unabhängige Prüfung zu unterstützen.

## Weitere Festlegungen

Vom Nutzer entschieden:

- **Nachweis-Auftrag:** ein kleiner echter Code-Auftrag an Pipwerk Studio. Damit wird auch die Testbereitstellung (Anwendung starten, Erreichbarkeit prüfen) am echten Objekt nachgewiesen, und das Ergebnis bleibt nutzbar.
- **Korrekturschleife:** keine feste Obergrenze. Die Schleife läuft, bis die QA bestanden und die anschließende Projektleiterprüfung mit „Auftrag erfüllt“ abgeschlossen ist. Dem Nutzer werden fachliche Entscheidungen, grundlegende Architekturentscheidungen und Fälle ohne erkennbaren Fortschritt vorgelegt. Maßstab ist vollständige Erfüllung der Anforderungen.
- **Arbeitsauftragsübergabe:** Der Projektleiter-Agent stößt nach Nutzerfreigabe den Softwarearchitekt-Agenten aktiv mit eindeutiger Referenz auf den Arbeitsauftrag an; der Softwarearchitekt sucht oder pollt nicht nach Aufträgen.
- **QA-Freigabe:** Die QA-Freigabe gilt ausschließlich für den eindeutig geprüften Commit. Ändert sich danach der Code, ist die QA-Freigabe ungültig und eine erneute QA-Prüfung erforderlich.

Offene Punkte bestehen nicht mehr.

## Umsetzung

Auf dem bei Arbeitsbeginn aktuellen Stand von `main` aufsetzen und im Implementierungs-Arbeitsbereich in einem eigenen Branch arbeiten.

Die Festlegungen des Repositorys, insbesondere `docs/technical/development-test-security-rules.md` und `docs/design/planning/entwicklungsplan-strategiedesigner.md`, sind einzuhalten.

Der Pull Request weist kurz aus:

- umgesetzten Umfang;
- ausgeführte Prüfungen und Ergebnisse, einschließlich des Nachweis-Durchlaufs;
- bekannte Einschränkungen;
- Abweichungen vom Auftrag.

Offene Anforderungen nicht selbst entscheiden.
