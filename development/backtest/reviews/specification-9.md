# Prüfbericht Spezifikation und Plan, Durchlauf 9

- Vorhaben: `backtest`, Arbeitspaket `wp02`, ref `backtest/wp02`
- Rolle: QA
- geprüfter Stand: `main`, Commit `2f1f95d0681e843a8629f87199f4dc6a88038390`
- Gegenstand: Änderungen gegenüber `69b324edb7ff607d4798399771bf30eaf6105be3` in `development/backtest/specification.md` und `development/backtest/plan.md`
- Umfang: nur die geänderten Stellen, nach Prüfauftrag `specification-9-order.md`

## Ergebnis: bestanden

Blockierende Befunde: keine.

## Zu Frage 1: Umsetzung der Entscheidung

Belege: `specification.md`, Zeilen 197, 231, 247, 366, 367, 376, 386, 433.

- Eine behaltene Datei ersetzt nie eine vorhandene. Das steht in 5.6 (Zeile 231: „gleich welcher Herkunft“, nicht nur aus dem Importverzeichnis). Dazu kommen der eindeutige Name (kleinste freie Nummer ab 2 vor der Endung, ein Verzeichnis oder Verweis zählt als vergeben) und das Anlegen ohne Ersetzen bei gleichzeitigen Anfragen. Das Ergebnis nennt den Namen, die Erklärung beim Zeigen nennt die Regel.
- Die Verzeichniswahl ist nicht eingeschränkt. 5.3 (Zeile 197) und 5.7 (Zeile 247) sagen, dass Ablage- und Importverzeichnis gleich sein oder ineinander liegen dürfen und dass das Backend sie beim Speichern nicht gegeneinander prüft. Die Dateien im Importverzeichnis bleiben unverändert (Zeile 196 und 197). Eine zusätzliche behaltene Datei im Importverzeichnis ist kein Fehler. Zwischendateien erscheinen in keiner Liste (Zeilen 194 und 197).
- Zeile 229 (5.6) schließt das Lesen behaltener Dateien „von sich aus“ aus und lässt den Import durch den Anwender zu. Das passt zu req-system-026 und req-system-028 („Pflege durch den Anwender“).
- req-test-009: Die Einstellungen sind unverändert (Zeilen 242 bis 245). Auch sie enthalten keine Einschränkung.
- Mit `grep` nach „ersetz“, „überschreib“ und „gleichen Namens“ in Spezifikation, `docs/technical` und `docs/user` bleibt keine Aussage zurück, nach der eine behaltene Datei eine vorhandene ersetzt. Die übrigen Treffer betreffen Datenbestand (Kerzen gleichen Zeitpunkts), Version 2 des Dateiformats, `pipwerk-fetch-mt5` und Dokumente von pipwerk Studio. Sie sind von der Entscheidung nicht betroffen.
- Die Tests (Zeilen 366 und 367) decken die Fälle ab: gleich, Ablage im Import, Import in der Ablage, vorhandene Datei unverändert, gleichzeitige Anfragen, Name mit Nummer, Name im Ergebnis. Sicherheit (Zeile 376) und Anwenderdokumentation (Zeile 386) sind angeglichen.
- Eine nicht geforderte Einschränkung finde ich nicht. Die Regeln für den Namen (Nummer in Klammern, Kürzen bei zu langem Namen, Höchstzahl von Versuchen als Fehler beim Schreiben) sind Ausführung der Entscheidung („eindeutiger Name“), jeweils mit Grund oder technischer Erfordernis (atomares Anlegen). Sie beschränken weder die Verzeichniswahl noch eine Anforderung.

## Zu Frage 2: rein technisch, Plan

- Keine Änderung von Anforderung, Fachmodell, Strategiebeschreibung oder Umfang. Die Anforderungen und `scope.md` nennen kein Ersetzen behaltener Dateien. Das Ersetzen stand nur in 5.6 selbst (Änderung vom 2026-10-24, Hinweis H4 aus `specification-6.md`), nicht in der vom Auftraggeber bestätigten Fassung. Die Entscheidung des Projektleiters (`questions/wp02-01.md`, Punkt 2) schreibt die Spezifikation fest und ändert keine Anforderung. Die Ergänzung ist rein technisch im Sinn von „Meldungen“.
- Kriterien 12 und 13 (`plan.md`, Zeilen 131 und 132) bleiben richtig. „Unverändert im Ablageverzeichnis“ und „unverändert im Importverzeichnis“ gelten auch bei gleichem Verzeichnis. Der Plan kann ohne Änderung bleiben. Geändert sind nur das Prüfungsfeld und der Änderungsnachweis, ohne Inhalt.

## Hinweise

- H1: 5.3 beschreibt das Ergebnis je Datei (Zeile 183) ohne den Namen der behaltenen Datei. Er steht nur in 5.6 (Zeile 231). Ein Verweis in Zeile 183 würde beide Stellen verbinden.
- H2: 5.4 (Zeile 207) lässt `pipwerk-fetch-mt5` eine bestehende Datei gleichen Namens ersetzen. Das ist ein anderes Programm und nicht „Dateien behalten“. Wählt der Anwender sein Zielverzeichnis als Importverzeichnis, verändert er die Dateien dort selbst. Kein Widerspruch zu 5.3 („pipwerk replay ändert nie“), kein Handlungsbedarf.
- H3: Wie Zwischendateien im Ablageverzeichnis erkennbar sind, damit die Liste sie auslässt, steht nicht in der Spezifikation (Zeilen 194, 197). Der Auftrag legt es fest.
