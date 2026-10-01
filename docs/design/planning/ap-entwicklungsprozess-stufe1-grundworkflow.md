# Arbeitsauftrag – Entwicklungsprozess Stufe 1: Agentischer Grundworkflow

## Status

- status: `draft`
- stand: 2026-10-01
- bereich: Entwicklungsprozess (keine Produktkomponente)

## Ziel

Den im Entwicklungsplan festgelegten automatisierten agentenbasierten Entwicklungsablauf auf dem Entwicklungsrechner einrichten und durch einen vollständigen Durchlauf nachweisen.

Nach diesem Arbeitspaket läuft ein Arbeitsauftrag ohne manuelle technische Zwischenschritte des Nutzers durch: Auftrag, Implementierung, unabhängiges Review, Korrekturschleife, Testbereitstellung, Übergabe zur fachlichen Erprobung. Die manuelle Tätigkeit des Nutzers beschränkt sich auf fachliche Entscheidungen bei der Auftragsklärung und die abschließende fachliche Erprobung.

Grundlage ist `docs/design/planning/entwicklungsplan-strategiedesigner.md`, Abschnitte „Automatisierter agentenbasierter Entwicklungsablauf“ und „Ausbau des Entwicklungsprozesses“.

## Umfang

1. KI-Koordinator auf dem Entwicklungsrechner auf Grundlage von OpenClaw einrichten.
2. KI-Modelle über den API-Key-basierten Multi-LLM-Anbieter anbinden; derzeit OpenRouter. Keine Bindung an einen einzelnen Modellanbieter oder ein einzelnes Modell; Anbieter und Modelle sind konfigurierbar und im laufenden Betrieb änderbar.
3. Implementierungs-Agenten mit eigenem Arbeitsbereich `implement/` einrichten: setzt den übergebenen Auftrag um, führt die vorgesehenen technischen Prüfungen aus, erstellt Commit und Pull Request.
4. Review-Agenten mit eigenem Arbeitsbereich `review/` einrichten: prüft den Pull Request unabhängig gegen Auftrag und Repository-Stand; läuft mit einem anderen Modell als der Implementierungs-Agent.
5. Automatische Korrekturschleife einrichten: Der Koordinator übergibt Review-Befunde an den Implementierungs-Agenten; nach der Korrektur wird erneut geprüft. Die Schleife endet mit bestandener Prüfung oder mit Vorlage eines nicht automatisch lösbaren Punkts an den Nutzer.
6. Testbereitstellung einrichten: Nach bestandener Prüfung wird der Teststand aus dem vorgesehenen Repository-Stand aufgebaut, benötigte Abhängigkeiten werden eingerichtet, die Anwendung wird gestartet und ihre Erreichbarkeit geprüft. Automatisierung unter `scripts/`.
7. Übergabe an den Nutzer einrichten: erst nach erfolgreicher Bereitstellung, mit kurzer Ergebniszusammenfassung und noch erforderlichen Entscheidungen.
8. Lokale Arbeitsbereiche an den Entwicklungsplan angleichen: `claude/` wird zu `implement/`, `codex/` wird zu `review/`; abhängige Verweise mitziehen.
9. Einrichtung und Bedienung des Grundworkflows in `docs/technical/` dokumentieren.

## Nicht Bestandteil dieses Arbeitspakets

- Spec Kit (Stufe 2);
- Linter und Codechecker als Quality Gates (Stufe 3);
- weitere Qualitätswerkzeuge (Stufe 4);
- n8n-Anbindung;
- Änderungen an Produktkomponenten über das für den Nachweis-Durchlauf Erforderliche hinaus;
- Orchestrierung über GitHub-Funktionen; GitHub bleibt Repository- und Pull-Request-Ablage.

Offene fachliche oder technische Fragen dürfen nicht durch eigene Festlegungen vorweggenommen werden.

## Abnahmekriterien

Das Arbeitspaket ist abnahmefähig, wenn:

1. Ein vollständiger Durchlauf mit einem vereinbarten Nachweis-Auftrag belegt ist: Auftragsübergabe an den Koordinator, Implementierung mit technischen Prüfungen, Pull Request, unabhängiges Review, Testbereitstellung, Übergabemeldung.
2. Implementierungs- und Review-Agent nachweislich mit unterschiedlichen Modellen gelaufen sind.
3. Die Korrekturschleife nachweislich funktioniert: Mindestens ein Review-Befund wurde automatisch an den Implementierungs-Agenten übergeben, korrigiert und erneut geprüft.
4. Der Abbruchfall nachweislich funktioniert: Ein nicht automatisch lösbarer Punkt führt zur Vorlage an den Nutzer, nicht zu einer Endlosschleife.
5. Der Teststand automatisch bereitgestellt, gestartet und auf Erreichbarkeit geprüft wurde.
6. Die Übergabemeldung erst nach bestandener Prüfung und erfolgreicher Bereitstellung erfolgt ist.
7. Keine Zugangsdaten oder API-Schlüssel im Repository liegen.
8. Die lokalen Arbeitsbereiche `implement/` und `review/` bestehen und verwendet wurden.
9. Einrichtung und Bedienung dokumentiert sind.

## Festlegungen zur Modellwahl

Vom Nutzer entschieden am 2026-10-01:

- Multi-LLM-Anbieter: OpenRouter.
- KI-Koordinator: Claude Sonnet 5.
- Implementierungs-Agent: Claude Opus 5.
- Review-Agent: ein Modell eines anderen Herstellers als der Implementierungs-Agent; vorgesehen ein aktuelles GPT-5.x- oder Gemini-3-Modell. Die konkrete Version wird bei der Einrichtung anhand des OpenRouter-Katalogs festgelegt.

Die Modellwahl ist Konfiguration und im laufenden Betrieb änderbar. Dauerhafte Bedingung: Implementierungs- und Review-Agent laufen mit unterschiedlichen Modellen.

## Weitere Festlegungen

Vom Nutzer entschieden am 2026-10-01:

- **Nachweis-Auftrag:** ein kleiner echter Code-Auftrag an Pipwerk Studio. Damit wird auch die Testbereitstellung (Anwendung starten, Erreichbarkeit prüfen) am echten Objekt nachgewiesen, und das Ergebnis bleibt nutzbar.
- **Korrekturschleife:** keine feste Obergrenze. Die Schleife läuft, bis das Review bestanden ist. Dem Nutzer vorgelegt wird nur, wenn erkennbar kein Fortschritt mehr erfolgt (derselbe Befund bleibt nach einer Korrektur bestehen) oder eine fachliche Entscheidung erforderlich ist. Maßstab ist maximale Qualität: Das Ergebnis muss den Anforderungen vollständig entsprechen.

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
