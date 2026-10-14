# Prüfbericht Plan, Durchlauf 2

- Vorhaben: `ablauftest`
- Phase: 3 Planung, Prüfung des Arbeitspaketplans, Nachprüfung
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/plan-2-order.md`
- geprüfter Commit: `32424d3ce5aa0fe141287dfbe92d0c87dc08a3c1`
- Prüfgegenstand: `development/ablauftest/plan.md`

## Ergebnis

**nicht bestanden**

P1, P2 und P3 aus Durchlauf 1 sind erledigt. Die Hinweise H1 bis H4 sind sachgerecht berücksichtigt. P4 ist nur teilweise erledigt: Die Backend-Dateien im Umfang von `wp01` stehen jetzt mit vollem Pfad. Die Pfadregel wurde aber auf alle Pfade des Plans ausgeweitet und sagt jetzt, Dateien des Backends stünden „immer“ mit vollem Pfad. An mehreren Stellen stimmt das nicht (Befund N1). Dazu kommen drei Hinweise zu den geänderten Stellen, die das Ergebnis nicht bestimmen.

## 1. Geprüfter Stand

- Das Arbeitsverzeichnis stand auf dem Commit von Durchlauf 1. Nach `git fetch origin` habe ich es auf `32424d3ce5aa0fe141287dfbe92d0c87dc08a3c1` gesetzt. Diesen Commit liefert `git log -1 --format=%H origin/main -- development/ablauftest/reviews/plan-2-order.md`. Er ist zugleich der aktuelle Stand von `origin/main`.
- `git diff --stat bd4638b370effce3c70f14dec343d37c6e25bd19 32424d3ce5aa0fe141287dfbe92d0c87dc08a3c1` zeigt drei geänderte Dateien: `plan.md`, `reviews/plan-1.md` und `reviews/plan-2-order.md`. Spezifikation, `scope.md` und Anforderungsdokumente sind gegenüber Durchlauf 1 unverändert. Die Prüfung der Abdeckung von req-ui-010 durch die Spezifikation aus Durchlauf 1 (plan-1.md, Abschnitt 2) gilt deshalb weiter.
- Grundlage dieser Prüfung sind der Diff von `plan.md` (Auftrag Punkt 3), die Spezifikation, `docs/technical/entwicklungsverfahren.md`, `docs/technical/agentenrollen-und-briefings.md`, `development/ablauftest/reviews/specification-16.md` und der Stand des Codes im geprüften Commit.

## 2. Befunde aus Durchlauf 1

| Befund | Stelle im Plan | Ergebnis |
|---|---|---|
| P1 Verweise aus dem Fließtext auf das Glossar | Zeile 45, letzter Satz; Abnahmekriterium 6 von `wp01`, Zeile 83 („die bestehenden Erklärungen im Fließtext verweisen darauf“) | erledigt. Der Satz entspricht `specification.md` Zeile 285. |
| P2 Beschreibung des Prüfskripts | Umfang Zeile „Prüfskript“ (Zeile 34), Dokumentation in `wp01` (Zeile 44: „Abschnitt 6 mit der Beschreibung des Prüfskripts (Tester Funktion …)“), Abnahmekriterium 6 (Zeile 83: „Name und Aufruf von Testumgebungsskript und Prüfskript“) | erledigt. Paket, Ort im Dokument und zuständige Rolle sind genannt. Siehe Hinweise H5 und H6. |
| P3 Abnahmekriterium 5 von `wp01` | Zeile 82; Dokumentation in `wp01`, Zeile 44 (Adresse von `/docs` am Port des Backends, nur auf `127.0.0.1` des Rechners der Testumgebung; Aufruf von `pipwerk-studio` aus der Umgebung des Backends) | erledigt. Die Aussage, dass `/docs` über den Port der Oberfläche nicht erreichbar ist, stimmt mit `vite.config.ts` Zeilen 8 bis 10 und 19 bis 23 überein (Weiterleitung nur für `/api`). Die Bindung des Backends an `127.0.0.1` entspricht `specification.md` Zeile 256. Siehe Hinweis H7. |
| P4 Pfade der Backend-Dateien | Zeile 37 und Zeile 20 | Zeile 37: erledigt; alle elf Dateien stehen mit vollem Pfad und sind im geprüften Commit vorhanden (`git ls-files components/pipwerk-studio/backend`). Zeile 20: **nicht vollständig erledigt**, siehe N1. |

## 3. Hinweise aus Durchlauf 1

| Hinweis | Stelle im Plan | Ergebnis |
|---|---|---|
| H1 Bestehende Browsertests der Fußzeile bei `wp02` | Zeile 128 | berücksichtigt |
| H2 `e2e/studio.spec.ts` in der Liste zu Abschnitt 3.1 von `wp02` | Zeile 125 | berücksichtigt |
| H3 W2 nicht in Auftrag und Test lösbar | Zeile 65 | berücksichtigt. W1 ist richtig wiedergegeben; laut `specification-16.md` Zeile 58 entscheiden Entwickler und Tester darüber in Phase 4, das passt zu „in Auftrag und Test gelöst“. |
| H4 Abbruchfälle in Abnahmekriterium 3 von `wp01` | Zeile 80 | berücksichtigt: geänderte versionierte Datei, auch `LICENSE` außerhalb der Komponente, und nicht ignorierte neue Datei. Der Fall „Inhalt ohne Git“ bleibt technischer Nachweis (`specification.md` Zeile 211); für den Auftraggeber ist das kein sinnvoller Prüfschritt. |

## 4. Befunde

### N1 – Pfadregel widerspricht weiter Einträgen im Plan (P4 nur teilweise erledigt)

- Fundstelle: `plan.md` Zeile 20, neu: „Pfade gelten wie in Abschnitt 3.1 der Spezifikation: Pfade, die mit `components/`, `docs/` oder `README.md` beginnen, ab dem Wurzelverzeichnis des Repositorys, alle anderen ab `components/pipwerk-studio/frontend/`. Dateien des Backends stehen deshalb immer mit vollem Pfad.“ Bisher galt die Regel nur für „Pfade in den Tabellen“; jetzt gilt sie für den ganzen Plan.
- Sachverhalt: An folgenden Stellen stehen Dateien außerhalb von `frontend/` ohne vollen Pfad. Nach der Regel lägen sie unter `components/pipwerk-studio/frontend/`, wo es sie nicht gibt und nicht geben soll:
  - Zeile 61 (`wp01`, „Umgesetzte Teile der Spezifikation“, Abschnitt 3.1): `scripts/testenv`, `scripts/check`, `tests/test_testenv.py`, `test_cli.py`, `test_studio_language.py`, `test_name.py`. Davon sind vier Dateien des Backends; für sie ist der neue Satz „Dateien des Backends stehen deshalb immer mit vollem Pfad“ nicht zutreffend. Diese Zeile ist erst durch die Ausweitung der Regel auf den ganzen Plan unter die Regel gefallen.
  - Zeile 105 (`wp02`, Umfang, Zeile „Prüfskript“, also in einer Tabelle): „hält `scripts/check` aktuell“. Das galt schon unter der alten Regel und ist in Durchlauf 1 übersehen worden.
  - Zeilen 85 und 149 (technische Nachweise beider Pakete): „Das Prüfskript `scripts/check`“.
- Einordnung: Durchlauf 1 hat genau diesen Widerspruch zwischen Regel und Einträgen als Befund P4 gemeldet. Laut Übergabedokument, Punkt 1, soll die Pfadregel sagen, dass Backend-Dateien mit vollem Pfad stehen. Das sagt sie jetzt, trifft aber nicht für alle Einträge zu. Ein Auftrag, der die Zeile „Prüfskript“ aus `wp02` übernimmt, nennt nach der Regel eine Datei, die es nicht gibt.
- Kritikpunkt: Regel und Einträge des Plans stimmen weiterhin nicht überein. Frage: Sollen die genannten Stellen von der Regel erfasst sein, und wenn ja, mit welchem Pfad?

## 5. Hinweise

Diese Hinweise machen die Prüfung nicht „nicht bestanden“.

### H5 – Ort der Beschreibung des Prüfskripts gegenüber Abschnitt 7 der Spezifikation

- Fundstelle: `plan.md` Zeilen 34 und 44; `specification.md` Zeile 271 („Skripte der Komponente mit einem neuen Abschnitt „Start als Testumgebung“ neben Abschnitt 4“) und Zeile 265 („führt die Prüfungen aus Abschnitt 6.1 bis 6.3 der technischen Dokumentation … aus“).
- Sachverhalt: Die Spezifikation nennt die Skripte der Komponente in der Mehrzahl zusammen mit dem neuen Abschnitt „Start als Testumgebung“. Der Plan beschreibt dort nur das Testumgebungsskript und legt für das Prüfskript einen neuen Abschnitt „Prüfskript“ in Abschnitt 6 an. Der Wortlaut der Spezifikation lässt beides zu. Der Plan sagt nicht, an welcher Stelle in Abschnitt 6 der neue Abschnitt steht. Wird er vor dem neuen Abschnitt 6.3 eingefügt, stimmt der Verweis „Abschnitt 6.1 bis 6.3“ in Zeile 265 der Spezifikation nicht mehr.
- Frage: Ist die Aufteilung auf zwei Stellen so gemeint, und wird die Nummerung von 6.1 bis 6.3 im Auftrag festgelegt?

### H6 – Dokumentation durch den Tester Funktion in seinem Zweig

- Fundstelle: `plan.md` Zeile 34; `entwicklungsverfahren.md` Zeile 107 (technische Dokumentation ist Ergebnis des Entwicklers), Zeile 280 (Inhalt des Zweigs `<vorhaben>/<arbeitspaket>-functiontest`: „Änderungen am Prüfskript“), Zeile 283 („Eine Änderung nur am Prüfskript macht vorhandene Testberichte nicht ungültig“); `agentenrollen-und-briefings.md` Zeile 71 („Dokumentation ist Bestandteil jeder Änderung“) und Zeile 145 (Briefing Tester Funktion).
- Sachverhalt: Der Plan lässt den Tester Funktion `docs/technical/pipwerk-studio.md` in seinem Zweig ändern. Das Verfahren nennt als Inhalt dieses Zweigs nur Änderungen am Prüfskript. Mit Zeile 71 der Briefings lässt sich die Beschreibung als Teil dieser Änderung lesen; ausdrücklich geregelt ist es nicht. Offen bleibt auch, wer diesen Abschnitt der technischen Dokumentation prüft, da die Prüfung der technischen Dokumentation beim Tester Funktion selbst liegt.
- Frage: Ist diese Zuordnung durch das Verfahren gedeckt, und wer prüft den Abschnitt „Prüfskript“? Die Entscheidung liegt nicht bei der QA.

### H7 – Aufruf von `/docs` über den Port der Oberfläche

- Fundstelle: `plan.md` Zeile 82, letzter Satz.
- Sachverhalt: `vite preview` liefert nach der Dokumentation von Vite für unbekannte Pfade die Seite `index.html` aus (nicht am Rechner geprüft). Ruft der Auftraggeber `/docs` irrtümlich über den Port der Oberfläche auf, sieht er dann pipwerk Studio selbst, nach `wp01` mit dem Titel „pipwerk Studio“, und nicht die Schnittstellenbeschreibung. „Nicht erreichbar“ trifft auf die Schnittstellenbeschreibung zu, eine Fehlermeldung bekommt er aber wahrscheinlich nicht.
- Frage: Soll die technische Dokumentation im Abschnitt „Start als Testumgebung“ darauf hinweisen, damit das Abnahmekriterium nicht am falschen Port als erfüllt gilt?

## 6. Weitere Prüfung der Änderungen

Ich habe jede geänderte Stelle des Diffs geprüft (Zeilen 9, 20, 34, 37, 44, 45, 65, 80, 82, 83, 125, 128, 175). Außer N1 und den Hinweisen H5 bis H7 habe ich keinen neuen Fehler gefunden. Die Änderungen widersprechen keiner Anforderung und lassen keinen Teil der Spezifikation unabgedeckt. Die Abdeckung der Spezifikation durch die Pakete aus Durchlauf 1 (plan-1.md, Abschnitt 3) bleibt bestehen; P1 und P2, die dort als nicht zugeordnet galten, sind jetzt `wp01` zugeordnet.
