# Prüfbericht Spezifikation, Durchlauf 2

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/specification-2-order.md`
- geprüfter Commit: `345b7b044f43a12aea5ff009aae53e78cf46a8e1` (`main`)
- Ergebnis: **nicht bestanden**

## Gegenstand

Geprüft wurde `development/ablauftest/specification.md` gegen:

- req-ui-010 „Angaben zu pipwerk studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`, Zeilen 287–296
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt (req-system-006, 008, 009, 011, 019–021, 023)
- die Antworten in `development/ablauftest/questions/ablauftest-01.md`

Zum Abgleich herangezogen wurden `docs/technical/pipwerk-studio.md`, `docs/user/pipwerk-studio.md` und die Dateien der Oberfläche unter `components/pipwerk-studio/frontend/` im geprüften Commit (`vite.config.ts`, `playwright.config.ts`, `package.json`, `tsconfig.json`, `src/test-setup.ts`).

Zeilenangaben zu `specification.md` beziehen sich auf den geprüften Commit.

## Zusammenfassung

Die Befunde S2 bis S6 aus `specification-1.md` sind behoben. S7 und S8 stehen als Fragen an den Auftraggeber in Abschnitt 9. S1 ist zum größten Teil behoben: E9 legt fest, welcher Commit gemeint ist. Der Browsertest weist nach, dass Dialog und Fußzeile denselben Commit nennen.

Ein Teil von S1 bleibt offen (Befund N1). Die Spezifikation nimmt im Entwicklungsbetrieb hin, dass der Dialog einen anderen Commit nennt als den, aus dem pipwerk studio läuft. Laut E9 ist der Entwicklungsbetrieb aber eine vorgesehene Bereitstellung. Das weicht vom Wortlaut von req-ui-010 ab. Ob diese Abweichung hinnehmbar ist, entscheidet der Auftraggeber. Die Spezifikation legt ihm die Frage nicht vor und kennzeichnet sie nicht als offen. Zudem ist eine Aussage über das Verhalten des Entwicklungsservers möglicherweise unvollständig.

Weitere neue Probleme durch die Änderungen habe ich nicht gefunden.

## Kontrolle der Befunde aus Durchlauf 1

| Befund | Stelle in der Spezifikation | Ergebnis |
|---|---|---|
| S1 Commit „aus dem pipwerk studio läuft“ | E9 (Zeile 29), Absatz „Grenze im Entwicklungsbetrieb“ (Zeile 31), Browsertest Zeile 167 | Frage 1 und 2 beantwortet: Gemeint ist der gemeinsame Commit von Oberfläche und Backend. Ein Betrieb aus verschiedenen Ständen ist keine vorgesehene Bereitstellung. Die Gleichheit von Dialog und Tooltip wird geprüft. Frage 3 ist nur zum Teil behandelt. Die Grenze ist beschrieben und ihre Dokumentation festgelegt (Zeilen 31, 214, 222). Ob sie hinnehmbar ist, hat der Auftraggeber nicht entschieden. Siehe N1. |
| S2 Sprachwechsel bei offenem Dialog | Abschnitt 3.2, Zeile 81; Test Zeile 149 | behoben. Das Verhalten bei einer Sprachänderung von außen ist festgelegt und wird geprüft. Es entspricht req-ui-010, Zeile 296. |
| S3 ungültige Adresse zur Laufzeit | Abschnitt 3.5, Zeile 129; Test Zeile 157 | behoben. Der Dialog zeigt „unbekannt“ ohne Verweis, die übrige Oberfläche arbeitet weiter. Ein Test verhindert den Fall in einer geprüften Oberfläche. |
| S4 Bau ohne `LICENSE`, Widerspruch zu E5 | E5 (Zeile 25), E7 (Zeile 27), Abschnitt 3.6 (Zeile 133) | behoben. Ohne `LICENSE` bricht der Bau ab, es gibt keinen Ersatztext. E5 spricht jetzt von einem Archiv des Repositorys, das `LICENSE` enthält. E7 begründet die Vereinbarkeit mit req-system-006 und req-system-008: Die gebaute Oberfläche enthält den Text und braucht zur Installation das Repository nicht. `LICENSE` ist im Wurzelverzeichnis vorhanden (674 Zeilen). |
| S5 Vorgaben zur Anwenderdokumentation | Abschnitt 7, Zeilen 218–224 | behoben. Gleichheit von Dialog und Fußzeile, Grenze bis zum Neustart, Internetverbindung nur für den Verweis und ein Glossar mit den genannten Begriffen sind vorgegeben. Hinweis zu N1: Ändert sich die Festlegung zur Grenze, muss auch Zeile 222 angepasst werden. |
| S6 Dateiliste | Abschnitt 3.1, Zeilen 35–64 | behoben. Testumgebungsskript, Prüfskript, `.gitignore`, `src/test-setup.ts`, alle Testdateien und `src/vite-env.d.ts` (im geprüften Commit noch nicht vorhanden, also neu) sind genannt. `playwright.config.ts` und `e2e/start-backend.mjs` sind nicht genannt. Nach der Spezifikation müssen sie auch nicht geändert werden, denn der Browsertest startet Backend und Entwicklungsserver bereits aus demselben Arbeitsverzeichnis (`playwright.config.ts`, Abschnitt `webServer`). |
| S7 Schreibweise des Produktnamens | Abschnitt 8 (Zeile 228), Abschnitt 9 (Zeile 236) | als Frage an den Auftraggeber festgehalten. Die Spezifikation hängt nicht davon ab. |
| S8 Aufrufstelle und req-ui-009 | Abschnitt 9, Zeile 237 | als Frage an den Auftraggeber festgehalten. Die Spezifikation hängt nicht davon ab. |

## Befunde

### N1 – Abweichung im Entwicklungsbetrieb ohne Entscheidung des Auftraggebers

- Fundstelle: `specification.md`, Zeile 29 (E9), Zeile 31 (Absatz „Grenze im Entwicklungsbetrieb“), Zeile 222; req-ui-010, Zeile 292: „die vollständige Kennung des Commits, aus dem pipwerk studio läuft“; Prüfbericht `specification-1.md`, S1, Frage 3
- Sachverhalt:
  1. E9 nennt den Start im Entwicklungsbetrieb ausdrücklich als vorgesehene Bereitstellung. Zeile 31 legt fest: Wird das Arbeitsverzeichnis nach dem Start auf einen anderen Commit gesetzt, lädt der Entwicklungsserver den neuen Code nach. Der Dialog nennt aber weiter den Commit beim Start. In diesem Fall nennt der Dialog einen Commit, aus dem pipwerk studio nicht mehr läuft. Das weicht vom Wortlaut von req-ui-010 ab. Die Spezifikation nimmt die Abweichung hin und lässt sie dokumentieren. Ob sie hinnehmbar ist, betrifft den Inhalt der Anforderung. Diese Frage hatte S1 gestellt (Frage 3). Abschnitt 9 legt sie dem Auftraggeber nicht vor, und die Spezifikation kennzeichnet sie nicht als offen.
  2. Derselbe Fall tritt auch ohne Wechsel des Commits ein: wenn im Entwicklungsbetrieb Dateien geändert, aber nicht committet werden. Diesen Fall erwähnt die Spezifikation nicht.
  3. Möglicherweise trifft die Aussage in Zeile 31 nicht in jedem Fall zu: „Dialog und Fußzeile nennen aber beide weiter den Stand beim Start, bis beide neu gestartet sind“. Nach meiner Kenntnis startet der Entwicklungsserver von Vite sich selbst neu, wenn sich `vite.config.ts` oder eine davon geladene Datei ändert. Nach Abschnitt 3.1 und 3.4 sind das hier `buildinfo/gitRevision.ts` und `src/timestamp.ts`. Bei diesem Neustart würde der Wert neu ermittelt. Ändert ein Wechsel des Commits eine dieser Dateien, zeigt der Dialog dann den neuen Commit, die Fußzeile aber den alten. **Ungeprüft:** Den Quelltext von Vite konnte ich nicht einsehen. Im Arbeitsverzeichnis ist Vite nicht installiert, und Abfragen im Internet waren mir nicht erlaubt.
- Fragen und Kritikpunkte:
  1. Ist es hinnehmbar, dass der Dialog im Entwicklungsbetrieb nach einem Wechsel des Commits oder bei nicht committeten Änderungen einen Commit nennt, aus dem pipwerk studio nicht oder nicht unverändert läuft? Diese Frage betrifft den Inhalt von req-ui-010 und ist dem Auftraggeber vorzulegen. Bis zu seiner Antwort sollte sie in der Spezifikation als offen gekennzeichnet sein.
  2. Trifft die Aussage in Zeile 31 auch dann zu, wenn der Wechsel des Commits `vite.config.ts` oder eine davon geladene Datei ändert? Wenn nicht: Welche Aussage machen dann Spezifikation, technische Dokumentation (Abschnitt 9) und Anwenderdokumentation (Zeile 222)?

## Geprüft ohne Befund

| Aussage von req-ui-010 | Umsetzung in der Spezifikation |
|---|---|
| Dialog auf Anforderung des Anwenders (Zeile 289) | Abschnitt 3.6, Zeile 135; Tests Zeilen 147 und 165 |
| Name „pipwerk studio“, nicht übersetzt, Schreibweise laut Projektziel (Zeilen 289, 291) | Abschnitt 3.2, Zeilen 73 und 79; Test Zeile 148 |
| Vollständige Kennung mit Datum und Uhrzeit in Ortszeit des Browsers (Zeile 292) | E2, Abschnitt 3.3, Zeilen 97 und 100; Tests Zeilen 150 und 166. Das Committer-Datum beantwortet den Kritikpunkt aus B2 von `requirements-1.md`. |
| Angaben in der Software enthalten, keine Internetverbindung (Zeile 292; Antwort auf Frage 2) | E1, E3, E4, Abschnitte 3.3 und 3.4; Tests Zeilen 156 und 168 |
| „unbekannt“, wenn die Angaben fehlen; keine Kennung ohne Datum (Zeile 292; Antwort auf Frage 2) | E4, E5, Abschnitt 3.3, Zeile 98; Tests Zeilen 150–152 und 166 |
| Lizenzname und vollständiger Text im englischen Original (Zeile 293) | E7, Abschnitt 3.2, Zeilen 75 und 83; Abschnitt 3.6; Test Zeile 153 |
| Adresse https://github.com/macodix/pipwerk als Verweis in neuem Tab (Zeile 294) | E6, Abschnitt 3.2, Zeile 85; Abschnitt 3.5; Tests Zeilen 154, 157 und 171 |
| Schaltfläche „Über pipwerk studio“ / „About pipwerk studio“ in der Kopfzeile rechts neben der Sprachauswahl (Zeile 296; Antwort auf Frage 1) | Abschnitt 3.6, Zeile 135; Tests Zeilen 147 und 165 |
| Übrige Oberfläche gesperrt, solange der Dialog offen ist (Zeile 296) | E8; Abschnitt 3.2, Zeile 81; Test Zeile 169 |
| Schließen nur mit „Schließen“ oder Escape (Zeile 296) | E8, Abschnitt 3.2, Zeile 87; Tests Zeilen 155 und 170 |
| Übrige Texte folgen der Oberflächensprache (Zeile 296) | Abschnitt 3.2, Zeile 81; Tests Zeilen 148 und 149 |
| Standanzeige in der Fußzeile bleibt (Zeile 296) | Zeile 13, Abschnitt 8; Tests Zeilen 159 und 172 |
| Gesamtsystem req-system-023 (mehrsprachige Oberfläche) | Texte unter dem Schlüssel `about` in `de.json` und `en.json`; Vollständigkeitstest Zeile 158 |
| Gesamtsystem req-system-006 und 008 (eigenständige Installation) | E7: Die gebaute Oberfläche enthält den Lizenztext; zur Installation ist das Repository nicht nötig |
| Gesamtsystem req-system-009 und 011 (Web-API, Schutz) | Backend und Schnittstellen unverändert (E1, Abschnitt 8) |
| Gesamtsystem req-system-019 bis 021 (Dokumentation) | Abschnitt 7; siehe Hinweis zu S5 und N1 |

Bis auf N1 legt die Spezifikation nichts fest, was req-ui-010 widerspricht.
