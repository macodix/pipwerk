# Strategieregister

## Zweck

Das Register verwaltet die acht Teststrategien getrennt voneinander. Gemeinsamkeiten werden erst nach bestätigter fachlicher Erfassung abgeleitet.

## Verbindliche Arbeitsregeln

1. Jede Strategie erhält ein eigenes Dokument auf Basis von `strategie-vorlage.md`.
2. Originalbeschreibung und Interpretation bleiben getrennt.
3. Eine Aussage aus einer Strategie wird nicht auf eine andere übertragen.
4. Begriffe werden nicht vereinheitlicht, bevor ihre Bedeutung je Strategie bestätigt wurde.
5. Ablaufschritte werden als Tätigkeiten oder konkrete Prüfungen formuliert.
6. Unbelegte Ergänzungen werden als offene Frage geführt, nicht als Regel.
7. Ein grafisches Modell entsteht erst nach dem Status `understood`.
8. Gemeinsame Knoten werden erst aus mehreren bestätigten Einzelmodellen abgeleitet.

## Bestand

| strategie-id | Strategie | Quelle | aktueller Stand | nächster Schritt |
|---|---|---|---|---|
| str-01 | Punkt-2-Ausbruch, einfach | Nutzerdatei `scalping-punkt-2-ausbruch-einfach(1).md` | Original vorhanden; bisherige Modellierung verworfen | separates Strategiedokument aus Original erstellen |
| str-02 | Punkt-2-Ausbruch mit Signal- und Handelszeiteinheit | Nutzerdatei `scalping-punkt-2-ausbruch(1).md` | Original und mehrere Klärungen vorhanden; bisherige Modellierung verworfen | separates Strategiedokument aus Original und bestätigten Klärungen erstellen |
| str-03 | Trendfolge mit gleitenden Durchschnitten | Testentwurf des Assistenten | fachlicher Entwurf vorhanden | isoliert präzisieren |
| str-04 | Mean Reversion mit Bollinger-Bändern und RSI | Testentwurf des Assistenten | fachlicher Entwurf vorhanden | isoliert präzisieren |
| str-05 | zeitgebundener Volatilitätsausbruch | Testentwurf des Assistenten | fachlicher Entwurf vorhanden | isoliert präzisieren |
| str-06 | Pairs Trading / statistische Arbitrage | Testentwurf des Assistenten | fachlicher Entwurf vorhanden | isoliert präzisieren |
| str-07 | Multi-Timeframe-Trend und Entry | Testentwurf des Assistenten | fachlicher Entwurf vorhanden | isoliert präzisieren |
| str-08 | regimeabhängige Strategie | Testentwurf des Assistenten | fachlicher Entwurf vorhanden | isoliert präzisieren |

## Korrekturhinweis

Die vorhandene `anforderungs-und-bausteinmatrix-der-acht-teststrategien.md` ist derzeit nicht verbindlich. Insbesondere die Zeilen zu `str-01` und `str-02` beruhen auf einer unzulässigen Vermischung beider Strategien. Die Matrix wird erst nach der getrennten Erfassung aller acht Strategien neu erstellt.

## Bearbeitungsreihenfolge

1. `str-01` vollständig getrennt erfassen und vom Nutzer bestätigen lassen.
2. `str-02` vollständig getrennt erfassen und vom Nutzer bestätigen lassen.
3. `str-03` bis `str-08` jeweils isoliert erfassen und präzisieren.
4. Erst danach gemeinsame Anforderungen und Bausteine ableiten.
5. Anschließend je einen grafischen Entwurf für strukturell unterschiedliche Strategien erstellen.
