# Modellbewertung – Kandidatenfilter und erste Kandidatenmenge

## Dokumentstatus

- status: `draft`
- stand: `2026-10-03`
- bezug: `modellbewertung-evaluationssatz-01.md`

## 1. Zweck

Dieses Dokument bestimmt die technische Vorauswahl für den ersten Evaluationsdurchgang. Es bewertet keine Modellqualität und legt kein Modell dauerhaft für eine Agentenrolle fest.

## 2. Technischer Mindestfilter

Ein Modell wird nur in die Qualitätsbewertung aufgenommen, wenn es zum Zeitpunkt des Evaluationslaufs:

1. über den eingesetzten Multi-LLM-Provider verfügbar ist,
2. Text und Programmcode verarbeiten kann,
3. Tool Calling für den vorgesehenen Agentenbetrieb unterstützt,
4. genügend Kontext für Agentenbriefing, Arbeitsauftrag und den benötigten Repository-Ausschnitt bereitstellt,
5. mit einer stabilen Modellkennung adressierbar ist,
6. die für den Lauf benötigten Tool- und Reasoning-Parameter über den Provider unterstützt.

Anonyme oder nur temporär bezeichnete Preview-/Stealth-Modelle werden nicht als reguläre Kandidaten verwendet.

Kosten, Tokenverbrauch, Geschwindigkeit, Popularität und externe Benchmark-Ranglisten sind keine Qualitäts- oder Auswahlkriterien.

## 3. Erste Kandidatenmenge

Für den ersten Evaluationsdurchgang werden drei unterschiedliche Modellfamilien verwendet, sofern sie den Mindestfilter unmittelbar vor dem Lauf weiterhin erfüllen:

- Anthropic Claude Sonnet 5
- Google Gemini 3.1 Pro Preview
- OpenAI GPT-5.4

Die Liste ist eine Evaluationsmenge, keine Rangfolge und keine Vorentscheidung.

Alle drei Modelle werden grundsätzlich für alle vier Rollen geprüft. Erst die Pipwerk-eigene Evaluation darf zu einer rollenspezifischen Auswahl führen.

## 4. Rollen und Unabhängigkeit

Zu prüfen sind:

- Projektleiter
- Softwarearchitekt
- Entwicklung
- QA

Entwicklung und QA dürfen im späteren Regelbetrieb nicht dasselbe Modell verwenden. Die Evaluation selbst darf dasselbe Kandidatenmodell in beiden Rollen prüfen, damit seine rollenspezifische Qualität messbar bleibt.

## 5. Verifikation vor jedem Lauf

Vor einem Evaluationslauf werden mindestens dokumentiert:

- exakte Provider-Modellkennung,
- aktuelle Verfügbarkeit,
- Tool-Calling-Unterstützung,
- Kontextgrenze,
- relevante Reasoning-/Tool-Parameter,
- Datum der Prüfung.

Fällt ein Kandidat durch den technischen Mindestfilter, wird er nicht bewertet. Der Ausschluss wird dokumentiert und ist keine Qualitätsbewertung.

## 6. Startreihenfolge

Der erste praktische Durchgang beginnt mit `eval-01`.

Je Kandidatenmodell und Rolle sind mindestens drei unabhängige Läufe vorgesehen. Die Eingabe und Repository-Basis bleiben innerhalb eines vergleichbaren Laufs unverändert.

Die Produktänderung aus einem Evaluationslauf wird nicht automatisch in `main` übernommen. Evaluationsartefakte und Produktänderungen bleiben getrennt.
