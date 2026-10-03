# Vorlage Modell-Evaluationslauf

## Identifikation

- evaluationssatz:
- testfall:
- evaluationssatz-commit:
- repository-basis:
- rolle:
- laufnummer:
- datum:

## Laufzeitkonfiguration

- modell:
- modellversion:
- provider:
- agentenkonfiguration:
- prompt-version:
- relevante laufzeitparameter:

## Eingabe

Die Eingabe des Testfalls wird unverändert aus dem referenzierten Evaluationssatz übernommen.

## Ergebnis

Hier wird das vollständige für die Bewertung relevante Ergebnis des Agenten referenziert oder abgelegt.

## Bewertung

| Kriterium | Wert 0–3 | Befund |
| --- | ---: | --- |
| Korrektheit |  |  |
| Vollständigkeit |  |  |
| Anforderungstreue |  |  |
| Fehlererkennung |  |  |
| Entscheidungsqualität |  |  |
| Robustheit |  |  |
| Korrekturqualität |  |  |
| rollenspezifische Kriterien |  |  |

Nicht anwendbare Kriterien werden mit `n/a` gekennzeichnet und nicht künstlich bewertet.

## Harte Fehler

- keine / konkrete Befunde

## Gesamturteil des Laufs

- bestanden / nicht bestanden

## Evaluator

- evaluator:
- bewertungsdatum:

## Hinweise

Kosten, Tokenverbrauch und Geschwindigkeit dürfen separat technisch erfasst werden, fließen aber nicht in Qualitätsbewertung oder Modellauswahl ein.

Robustheit wird nicht aus einem einzelnen Lauf abgeleitet, sondern erst aus den mindestens drei unabhängigen Läufen desselben Modells und Testfalls bewertet.
