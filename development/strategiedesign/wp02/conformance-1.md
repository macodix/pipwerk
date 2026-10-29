# Prüfung des Entwurfs, Arbeitspaket wp02, Durchlauf 1

- Ergebnis: **nicht bestanden** (2 blockierende Befunde)
- Bezug: `strategiedesign/wp02`, Meldung `conform` mit dem Prüfbericht der QA `strategiedesign/wp02:development/strategiedesign/wp02/reviews/6.md`
- geprüfter Commit: `5f4df690807d7864bd8701ea577504f24fc8d3e5`. Der Zweig steht auf `b1f4433`; der Unterschied sind nur Prüfauftrag und Bericht der QA.
- Grundlage: Spezifikation Abschnitte 2 bis 9, Plan `wp02`, Qualitätskriterien, Designgrundsätze
- Mittel: eigene Testumgebung aus dem Commit (Ports 5274 und 8101, danach beendet), Web-API mit `curl`. Den Code von Bibliothek, Backend und Oberfläche haben zwei Unteragenten durchsucht; jede Abweichung unten habe ich selbst an der Fundstelle nachgelesen. Die Bedienung im Browser habe ich nicht wiederholt: Die QA hat sie auf diesem Commit geprüft, und `node` für einen eigenen Browserlauf wurde in dieser Sitzung abgelehnt.

## Bedienabläufe

| Ablauf | Soll laut Spezifikation | Ist |
|---|---|---|
| Installation | Start aus genau einem Commit mit `testenv start` (technische Dokumentation 4a); ein Paket für Anwender gibt es noch nicht (Anwenderdokumentation 2) | gebaut und gestartet, Exitcode 0 |
| Einrichtung beim ersten Start | Objektverzeichnis unter `.testenv/`, darin die gesicherte „EMA-Trendfolge“ (7, 4.1) | so; Datei gleich der gesicherten (gleiche SHA-256) |
| Aktualisierung | Format 1.0 wird beim Lesen nach 2.0 umgewandelt, die Datei bleibt unverändert (3.7, 4.1) | `GET` liefert 2.0 mit „Aktualisieren“ für `ema20`, `ema50`, `atr14` in der Order- und Positionsverwaltung, `check` ohne Befund, Datei unverändert |
| Hauptaufgabe | `str-01` und `str-03` speichern, je eine Datei, ohne Befund (6, 7) | so (`POST`, Befunde leer) |
| fehlerhafte Eingabe | 422 mit Kennung der Ursache (4.2) | zusätzliches Feld und kein JSON: 422 `document.invalid`; unbekannte Kennung 404 `object.not_found`; relativer Pfad 422 `object_directory.not_absolute` |
| Konflikt beim Verschieben | nichts verschoben, alte Einstellung (4.1) | 409 `object_directory.conflict`, beide Verzeichnisse und Einstellung unverändert |
| nicht lesbare Datei | in der Liste mit Kennzeichen, unverändert (4.1) | `unreadable: true` |
| fremder Kopf `Host` | abgewiesen (8) | 400 |
| Entfernen | `testenv stop` entfernt Prozesse und `.testenv/` | so; Port 8101 antwortet nicht mehr, Arbeitsverzeichnis sauber |

Qualitätsziele mit Messvorgabe nennt die Spezifikation für `wp02` nicht; die Grenzwerte aus Abschnitt 8 hat der Tester Sicherheit geprüft.

## Aufbau

- E1: Typbeschreibungen, Register, Objektmodell, Ausdrücke, Konsistenzprüfung und Dokumente liegen in `pipwerk_domain`; Pydantic nur in `pipwerk_domain.documents`; Pfadabhängigkeit in `backend/uv.lock`. Erfüllt.
- E2: In der Oberfläche keine Verzweigung nach einzelnen Typen; Ausdrücke, Kennungen, Verwendbarkeit und Entfernen über die Web-API. Ausnahme: Befund K1.
- E3: Zeichenfläche aus dem Dokument, React Flow ohne eigenen Zustand der Knoten (`canvas/Canvas.tsx:700-736`). Erfüllt.
- E5: keine Tabelle der Objekte (Migrationen `v0001`, `v0002`), kein Zwischenspeicher. E7: Einstiegspunkt `pipwerk.element_types` (`registry.py:26`). Erfüllt.
- Daten: Schreiben über temporäre Datei und `os.replace`, Dateiname nur aus UUID, Rückholen beim Verschieben, Migration beim Start. Erfüllt.
- Abhängigkeiten: alle in den Regeln oder in der technischen Dokumentation 7.1 begründet.
- Abweichungen, die die bessere Lösung sind; die Spezifikation ist dafür angepasst (Änderungsnachweis vom 2026-10-29), nicht die Umsetzung:
  - Web-API mit `POST /api/v1/keys`, `/usage`, `/insert`, `/removals` (`web_api.py:1022`, `:1059`, `:1100`, `:1150`). 4.2 nannte sie nicht. Ohne sie müsste die Oberfläche gegen E2 selbst rechnen.
  - Anordnung und Erscheinungsbild aus dem Code des Prototyps übernommen (`arrange/layout.ts:3-4`, `arrange/scene.ts:3-6`, `styles.css:1`). E8 schloss das aus. Der Code erfüllt E2 und ist geprüft wie jeder andere Code.
- Die QA hat die Ergänzung geprüft: [specification-16.md](../reviews/specification-16.md), bestanden, Commit `4f04ed5c43406f7a00f94dadcbcba6e9275c2de1`. Sie ist rein technisch; Plan und Abnahmekriterien bleiben.

## Befunde (blockierend)

- **K1 Einfügen einer Vorlage ohne Bibliothek.** Fundstelle: `frontend/src/document/build.ts:190-224`, aufgerufen in `state/useStudioController.ts:476-506`; `/api/v1/insert` ruft die Oberfläche nirgends. Soll (E2, 3.3): Beim Einfügen heißen enthaltene Instanzen und Regeln „<Name der neuen Instanz> <bisheriger Name>“, die Bibliothek bildet ihre Kennungen und schreibt die Ausdrücke um. Ist: Die Oberfläche kopiert den Inhalt unverändert. Eigene Vorlagen bietet die Elementbibliothek in `wp02` an (`useStudioController.ts:149-170`; technische Dokumentation Abschnitt 9). Nachweis: Eine Strategie mit Regel „Mindestvolumen“ und einem so eingefügten Regelwerk mit Regel „Mindestvolumen“ meldet bei `check` den Fehler `name.duplicate`; `/api/v1/insert` liefert für denselben Fall „Prüfregeln Mindestvolumen“, `pruefregeln_mindestvolumen` und das umgeschriebene Gesamtergebnis.
- **K2 Technische Dokumentation widerspricht E8.** Fundstelle: `docs/technical/pipwerk-studio.md` Abschnitt 2.3 (Zeile 80): „Sie folgt dem bestätigten Prototyp (Spezifikation E8): Bedienung, Erscheinungsbild … stammen von dort“. Soll (E8 in der Fassung vom 2026-10-29): Maßgeblich ist Abschnitt 5; der Prototyp ist Hilfsmittel; die technische Dokumentation nennt, welcher Code übernommen ist. Ist: Sie nennt den Prototyp bestätigt und die Bedienung von dort übernommen, nicht welche Dateien Code des Prototyps enthalten.

## Hinweise (nicht blockierend)

- H1 Backend baut Kleinigkeiten der Bibliothek nach: Erkennung von Format 1.0 (`object_service.py:189-195` gegen `io.py:71-77`), Durchlauf über enthaltene Instanzen für `usages` (`object_service.py:203-233`), Suche nach Kennung (`usage_api.py:272-277`, `:295-296`). Ergebnis heute gleich.
- H2 Ohne Antwort von `/usage` oder bei gekürzter Antwort gilt in der Oberfläche jede Instanz überall als verwendbar (`model/uses.ts:72-138`, `:264`). Die Konsistenzprüfung meldet eine falsche Verbindung dann; besser wäre, Verbinden bis zur Antwort nicht anzubieten.
- H3 Eigene Regel für eckige Klammern bei Vorschlägen (`expression/formulaAssist.ts:28-30`) statt der Anzeigeform aus den sichtbaren Namen; die Bibliothek nimmt beide Formen an.
- H4 Fehlermeldungen ohne Abhilfe, entgegen den Qualitätskriterien („Ursache und was der Anwender tun kann“): zum Beispiel „Der Server ist nicht erreichbar.“ (`locales/de.json:771`), `document.invalid`, `request.invalid`, `object_directory.conflict`.
- H5 Das Backend richtet die Protokollierung nicht ein (technische Dokumentation 2.1); `app.py:361`, `:364` schreiben den Aufrufstapel, `web_api.py:569-579` nicht.
- H6 Technische Dokumentation 7.1 nennt in der Spalte „Kopplung“ nicht alle Module (fastapi: `errors.py`, `api_models.py`; TanStack Query: `state/useUsage.ts` u. a.); 7.2 nennt Playwright 1.63.0, `package.json` hat 1.64.1; Abschnitte 1 und 6.2 nennen noch den geführten Aufbau aus Auftrag 06 als Bestand.
- H7 `scripts/put_saved_strategy.py:28-35` schreibt ohne temporäre Datei; Testwerkzeug, nicht Teil des Backends.
- H8 Ein Bausteinbaum mit leerem Platz bleibt im Formeleditor, wie der Anwender ihn gebaut hat (`expression/useExpressionSession.ts:96-103`); nach Neuladen kann derselbe Ausdruck anders gegliedert erscheinen.

## Nächster Schritt

Der Entwicklungsleiter lässt K1 und K2 beheben. Danach prüfen Tester, QA und diese Prüfung erneut, die Nachprüfung beschränkt auf K1, K2 und die dafür geänderten Stellen.
