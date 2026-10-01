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
2. KI-Modelle über den API-Key-basierten Multi-LLM-Anbieter anbinden. Keine Bindung an einen einzelnen Modellanbieter oder ein einzelnes Modell; Anbieter und Modelle sind konfigurierbar.
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

## Offene Punkte [in Klärung]

Vom Nutzer zu entscheiden, nicht vom Implementierer:

1. Auswahl des Multi-LLM-Anbieters und der konkreten Modelle für Koordinator, Implementierungs- und Review-Agent. Der Entwicklungsplan legt diese Auswahl ausdrücklich nicht fest.
2. Nachweis-Auftrag für den Ende-zu-Ende-Durchlauf.
3. Begrenzung der Korrekturschleife: nach wie vielen erfolglosen Durchläufen wird dem Nutzer vorgelegt?

## Umsetzung

Auf dem bei Arbeitsbeginn aktuellen Stand von `main` aufsetzen und im Implementierungs-Arbeitsbereich in einem eigenen Branch arbeiten.

Die Festlegungen des Repositorys, insbesondere `docs/technical/development-test-security-rules.md` und `docs/design/planning/entwicklungsplan-strategiedesigner.md`, sind einzuhalten.

Der Pull Request weist kurz aus:

- umgesetzten Umfang;
- ausgeführte Prüfungen und Ergebnisse, einschließlich des Nachweis-Durchlaufs;
- bekannte Einschränkungen;
- Abweichungen vom Auftrag.

Offene Anforderungen nicht selbst entscheiden.
