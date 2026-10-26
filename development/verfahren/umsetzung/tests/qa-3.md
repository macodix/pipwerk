# Prüfbericht QA 3: Vorhaben `verfahren`

- Ergebnis: **bestanden** (kein blockierender Befund)
- geprüfter Commit: `a3684d2f431ffb8233f8b98691003326f7ee42d4` (Zweig `verfahren/umsetzung`), Nachprüfung nach amend 01
- Testumgebung: keine (Vorhaben ohne Dienst und Port)
- Grundlagen: `git diff a06dd8411de5835fce194faa12050b9f7e6fbc19 a3684d2f431ffb8233f8b98691003326f7ee42d4` (Dokumente), Auftrag 11, Spezifikation auf `origin/main` (7.1, 4.3 Punkt 2, 6.1, Abschnitt 8), `qa-1.md`
- Bewusst offen, kein Befund (laut Übergabe): Konflikte mit `origin/main`, Platzhalter der Nutzungsgrenze (3.3 Punkt 5).

## Nicht geprüft
- Unit-Tests von `tools/overview/`: nicht ausgeführt. Auftrag 11 ändert keinen Code. Ein Test, der den Text der README liest, ist nicht vorhanden (`grep` über `tools/overview/tests` und `generate.py` findet keinen).
- Die Präsentation habe ich nur im Text gelesen, nicht im Browser. Der Diff ändert nur Text innerhalb bestehender Elemente, keine Stile und keinen Aufbau.

## Befunde
Keine.

## Hinweise (verhindern das Bestehen nicht)
1. `docs/technical/entwicklungsverfahren.md` Zeile 465: Der Satz „Ort der Seite ist dieser Pfad auf `main`“ wiederholt den Satz davor („Die Seite ist die Datei `development/overview.html` auf `main`“). Der Inhalt steht damit zweimal in einem Absatz. Ein Satz würde genügen: „Der feste Link wird noch festgelegt.“ Der Wortlaut ist sonst mit 7.1 vereinbar.
2. `tools/overview/README.md` Zeile 11 wiederholt den Ort der Seite aus dem Verfahren. Die Spezifikation verlangt dort die Angabe (Abschnitt 8, Zeile „Ablage“, und Hinweis 3), also ist das gedeckt. Wird der feste Link festgelegt, müssen beide Stellen geändert werden.

## Prüfergebnisse zu den Fragen
- **7.1, Ort der Seite:** `entwicklungsverfahren.md` Abschnitt „Übersicht“ (Zeile 465) und `tools/overview/README.md` (Zeile 11) nennen `development/overview.html` auf `main` und dass der feste Link noch festgelegt wird. Die Ablage-Zeile von `overview.html` (Zeile 196) verweist auf den Abschnitt „Übersicht“. Erfüllt.
- **Abschnitt 8, Format von `waiting.md`:** Das Format (`ref`, Handlung, Zeitpunkt der Vorlage in UTC, Handlungen) steht im „Eingang des Projektleiters“ Punkt 2 (Zeile 283) und stimmt mit 4.3 Punkt 2 überein, auch bei „Vorhaben ohne Plan“. Die Ablage-Zeile `waiting.md` (Zeile 199) verweist darauf. Die README enthält das Format nicht mehr, sie verweist mit einem Link auf `#eingang-des-projektleiters` (der Anker existiert, Zeile 278). Was sie behält (Lesbarkeit des Zeitpunkts, Kopf- und Trennzeilen, Beispiel), betrifft das Skript. Die Angabe `<vorhaben>` oder `<vorhaben>/<paket>` zum `ref` wurde entfernt. Sie stand sonst nirgends im Verfahren. Das folgt der Vorgabe, die README nicht zu duplizieren. Das Briefing des Projektleiters (Zeile 105) verweist ebenfalls auf den Eingang. Erfüllt.
- **Abschnitt 8 und 6.1, Präsentation:** `grep -i prototyp` findet in `praesentation-entwicklungsprozess.html` nichts mehr. Die Zeilen 100, 128 und 129 verwenden „Machbarkeitstest“ und „Oberflächenentwurf“ entsprechend 6.1 (Machbarkeitstest für die Umsetzbarkeit, Oberflächenentwurf für eine Oberfläche). Der Diff ändert nur diese drei Zeilen. Gestaltung und Aufbau sind unverändert. Erfüllt.
- **Reste von „Prototyp“:** In `entwicklungsverfahren.md`, `agentenrollen-und-briefings.md` und `glossar.md` stehen nur Änderungsnachweise, die die Ersetzung beschreiben. Die Treffer unter `docs/design/` sind Dokumente des Auftraggebers zu einem anderen Gegenstand (der Prototyp eines Produkts) und gehören nicht zu 6.1. In der README ist `prototype/uebersicht-prototyp.html` ein Dateipfad. Kein Befund.
- **Hinweis 3 aus `qa-1.md`** (Adresse der Seite): erledigt, siehe oben.
- **Hinweis 4** (Format von `waiting.md` nur in der README): erledigt. Das Format steht einmal im Verfahren, die README verweist.
- **Hinweis 9** (Präsentation sagt „Prototypen“): erledigt.
- **Änderungsnachweis:** `entwicklungsverfahren.md` Zeile 549, Datum 2026-10-26, Auftrag 11, beschreibt die Änderung zutreffend. `agentenrollen-und-briefings.md` ist nicht geändert und braucht keinen Eintrag.
- **Verständlichkeit und Widerspruch:** Die geänderten Stellen sind kurz und ohne Vorwissen lesbar. Es bleiben keine projekt- oder domänenspezifischen Namen in den Verfahrensdokumenten. Die Ablage-Zeile „Format der Zeilen im Eingang des Projektleiters (Projektleiter)“ hat zwei Klammern oder Angaben hintereinander, ist aber verständlich. Querverweise und Anker in den geänderten Dokumenten (`#eingang-des-projektleiters`, `#übersicht`, Abschnitt „Übersicht“) stimmen. Einen Widerspruch zwischen den drei Dokumenten und der Spezifikation habe ich nicht gefunden.
