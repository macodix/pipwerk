# Prüfbericht Plan, Durchlauf 4

- Vorhaben: `ablauftest`
- Phase: 3 Planung, Prüfung des Arbeitspaketplans, Nachprüfung zu N2, H8 und H9
- Rolle: QA
- Übergabedokument: `development/ablauftest/reviews/plan-4-order.md`
- Freigabe des Durchlaufs: Antwort des Projektleiters in `development/ablauftest/questions/ablauftest-08.md`, Zeile 26
- geprüfter Commit: `31da0e960c688c1216cf28f0bf66b8058e542b11`
- Prüfgegenstand: `development/ablauftest/plan.md`

## Ergebnis

**bestanden**

N2 ist erledigt: Alle elf Dateien in der Zeile „Schreibweise im Backend“ stehen mit vollem Pfad ab dem Wurzelverzeichnis. H8 und H9 sind berücksichtigt. In den geänderten Stellen habe ich keinen neuen Befund gefunden. Es gibt einen Hinweis (H10). Er bestimmt das Ergebnis nicht.

## 1. Geprüfter Stand

- `git log -1 --format=%H origin/main -- development/ablauftest/reviews/plan-4-order.md` liefert `31da0e960c688c1216cf28f0bf66b8058e542b11`. Das ist auch der Stand von `origin/main` nach `git fetch origin`. Mein Arbeitsverzeichnis steht auf diesem Commit.
- `git diff --stat b9c3d77caf608a8ebde2b634f30e9c354cf66189 31da0e960c688c1216cf28f0bf66b8058e542b11` zeigt sechs geänderte Dateien: `plan.md`, `questions/ablauftest-08.md`, `reviews/plan-3.md`, `reviews/plan-4-order.md` und zwei Meldungen unter `development/messages/architect/`. Spezifikation, Anforderungsdokumente und `docs/technical/pipwerk-studio.md` sind gegenüber Durchlauf 3 unverändert. Die Abdeckung von req-ui-010 durch die Spezifikation und der Spezifikation durch die Pakete (plan-1.md bis plan-3.md) gilt deshalb weiter.
- In `plan.md` sind gegenüber Durchlauf 3 genau fünf Stellen geändert: Zeile 9 (Status „prüfung“), Zeile 34 (`wp01`, „Prüfskript“), Zeile 37 (`wp01`, „Schreibweise im Backend“), Zeile 98 (`wp02`, „Gemeinsame Hilfsfunktionen“) und Zeile 177 (neue Zeile im Änderungsnachweis).

## 2. N2 – Zeile „Schreibweise im Backend“ (Auftrag Punkt 1)

Fundstelle: `plan.md` Zeile 37. Abgleich mit der Pfadregel in Zeile 20 und mit `git ls-files` im geprüften Commit.

| Pfad in Zeile 37 | voller Pfad ab Wurzelverzeichnis | im Commit vorhanden |
|---|---|---|
| `components/pipwerk-studio/backend/src/pipwerk_studio/config.py` | ja | ja |
| `components/pipwerk-studio/backend/src/pipwerk_studio/cli.py` | ja | ja |
| `components/pipwerk-studio/backend/src/pipwerk_studio/app.py` | ja | ja |
| `components/pipwerk-studio/backend/src/pipwerk_studio/revision.py` | ja | ja |
| `components/pipwerk-studio/backend/src/pipwerk_studio/__init__.py` | ja | ja |
| `components/pipwerk-studio/backend/src/pipwerk_studio/settings_service.py` | ja | ja |
| `components/pipwerk-studio/backend/src/pipwerk_studio/storage.py` | ja | ja |
| `components/pipwerk-studio/backend/pyproject.toml` | ja | ja |
| `components/pipwerk-studio/backend/pipwerk-studio.example.ini` | ja | ja |
| `components/pipwerk-studio/backend/tests/test_cli.py` | ja | ja |
| `components/pipwerk-studio/backend/tests/test_studio_language.py` | ja | ja |

Der Zusatz „(alle in diesem Verzeichnis)“ ist entfallen. Die Menge der Dateien ist dieselbe wie in Abschnitt 3.1 der Spezifikation, Zeilen 55 bis 58. Weitere Pfadangaben enthält die Zeile nicht. Ergebnis: erledigt.

## 3. H8 – Nummer 6.4 (Auftrag Punkt 2)

Fundstelle: `plan.md` Zeile 34, letzter Satz: „Der Entwickler ergänzt Abschnitt 6 nur innerhalb der Abschnitte 6.1 bis 6.3 und belegt die Nummer 6.4 nicht; die Tests des Testumgebungsskripts und der Schreibweise und die Suche im Repository stehen in 6.1 (Backend), die Suche als eigener Punkt.“

- Festlegung: Der Satz legt ausdrücklich fest, dass die Ergänzungen des Entwicklers die Nummer 6.4 nicht belegen. Er nennt außerdem, wo diese Ergänzungen stehen. Die Frage aus H8 ist damit beantwortet.
- In sich widerspruchsfrei: Der Tester Funktion legt 6.4 „Prüfskript“ nach 6.3 an. Die Nummern 6.1 bis 6.3 bleiben. Der Entwickler bleibt in 6.1 bis 6.3. Der Zweig des Testers Funktion setzt auf dem Commit des Entwicklers auf. Bei dieser Festlegung ist 6.4 zu diesem Zeitpunkt frei. Durch die Umstellung bezieht sich die Begründung „weil er das Skript anlegt und hält“ jetzt ausdrücklich auf den Tester Funktion. Vorher stand dort „Er“.
- Mit der Aufzählung zur Dokumentation (Zeile 44, Punkt `docs/technical/pipwerk-studio.md`) widerspruchsfrei: Zeile 44 nennt für Abschnitt 6 die Beschreibung des Prüfskripts in 6.4 mit Verweis auf die Zeile „Prüfskript“. Außerdem nennt sie den Test des Testumgebungsskripts, die Tests der Schreibweise, die Suche im Repository und Abschnitt 6.3 „Browsertest gegen die gebaute Oberfläche mit `vite preview`“. Alle Teile des Entwicklers liegen damit in 6.1 bis 6.3, wie Zeile 34 es verlangt. Keiner liegt in 6.4.
- Mit den Grundlagen vereinbar: `docs/technical/pipwerk-studio.md` hat im geprüften Commit die Abschnitte 6.1 Backend (Zeile 234), 6.2 Frontend (Zeile 259) und 6.3 Browser-End-to-End-Test (Zeile 273). Danach folgt Abschnitt 7 (Zeile 293). Abschnitt 6.2 der Spezifikation (Zeile 265) verlangt, dass das Prüfskript die Prüfungen aus 6.1 bis 6.3 und die Suche nach Abschnitt 4.4 ausführt. Steht die Suche als eigener Punkt in 6.1, ist sie davon erfasst. Abschnitt 7 der Spezifikation (Zeile 271) verlangt Tests der Schreibweise und die Suche „in Abschnitt 6“, ohne Unterabschnitt. Die Zuordnung zu 6.1 widerspricht dem nicht. Der Test des Testumgebungsskripts liegt unter `components/pipwerk-studio/backend/tests/` und läuft mit pytest. Die Tests der Schreibweise ebenso. Beide passen damit zu 6.1.
- `wp02`: Zeile 110 nennt „Tests des Dialogs in Abschnitt 6“, Zeile 105 den Abschnitt „Prüfskript“ ohne Nummer. Zu diesem Zeitpunkt besteht 6.4 bereits. Ein Widerspruch zu Zeile 34 entsteht nicht.

Ergebnis: berücksichtigt.

## 4. H9 – `src/` bei zwei Dateien der Oberfläche (Auftrag Punkt 3)

Fundstelle: `plan.md` Zeile 98. Die Zeile nennt `src/RevisionDisplay.tsx` und `src/revisionApi.ts` an beiden Stellen mit `src/`. Nach der Regel in Zeile 20 gelten die Pfade ab `components/pipwerk-studio/frontend/`. Dort liegen beide Dateien im geprüften Commit (`git ls-files`: `components/pipwerk-studio/frontend/src/RevisionDisplay.tsx`, `components/pipwerk-studio/frontend/src/revisionApi.ts`). Die übrigen Angaben der Zeile (`src/commitDate.ts`, `src/timestamp.ts`, `localParts`, `isTimestamp`) sind unverändert und stimmen mit Abschnitt 3.1 der Spezifikation überein (Zeilen 73, 74 und 76). Ergebnis: berücksichtigt.

## 5. Weitere geänderte Stellen (Auftrag Punkt 4)

| Stelle | Ergebnis |
|---|---|
| Zeile 9, Status „prüfung“ | Stimmt mit plan-3.md (Ergebnis „nicht bestanden“, N2, H8, H9) und mit Frage und Antwort in `ablauftest-08.md` überein. Die Verweise `reviews/plan-3.md` und `questions/ablauftest-08.md` führen zu vorhandenen Dateien. Der Verweis `reviews/plan-4.md` hat im geprüften Commit noch kein Ziel. Das Ziel ist dieser Bericht. Er liegt nach dem Verfahren zunächst nur in meinem Arbeitsverzeichnis. Das ist kein Befund. |
| Zeile 34 | siehe Abschnitt 3 |
| Zeile 37 | siehe Abschnitt 2 |
| Zeile 98 | siehe Abschnitt 4 |
| Zeile 177, Änderungsnachweis | Die Zeile nennt N2, H8 und H9 inhaltlich zutreffend. Siehe Hinweis H10. |

Keine der Änderungen widerspricht einer Anforderung. Keine Änderung lässt einen Teil der Spezifikation ohne Paket.

## 6. Befunde

Keine.

## 7. Hinweise

Dieser Hinweis bestimmt das Ergebnis nicht.

### H10 – Änderungsnachweis zur Zeile „Prüfskript“

- Fundstelle: `plan.md` Zeile 177, letzter Satz: „Satz zum Entwickler in der Zeile „Prüfskript“ ans Ende der Zelle gestellt, damit sich die Begründung eindeutig auf den Tester Funktion bezieht.“
- Sachverhalt: Der Diff zu Durchlauf 3 zeigt in Zeile 34 zwei Änderungen. Erstens ist der Satz zum Entwickler neu und steht am Ende der Zelle. Zweitens ist „Er schreibt die Beschreibung“ durch „Der Tester Funktion schreibt die Beschreibung“ ersetzt. Die eindeutige Zuordnung der Begründung zum Tester Funktion beruht auf der zweiten Änderung. Der Änderungsnachweis nennt sie nicht.
- Frage: Soll der Änderungsnachweis auch die Ersetzung von „Er“ durch „Der Tester Funktion“ nennen?
