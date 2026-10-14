# Prüfauftrag Sicherheitstest, Auftrag 03, Durchlauf 2

- Vorhaben: `ablauftest`
- Arbeitspaket: `wp01`
- Rolle: Tester Sicherheit
- zu prüfender Commit: `42d3938843f2cf321230a9a04a412bc01e2f40f3` (Zweig `ablauftest/wp01-03`)
- Auftrag: `development/ablauftest/wp01/orders/03.md` auf dem Zweig `ablauftest/wp01`
- vorheriger Bericht: `development/ablauftest/wp01/tests/03-securitytest-1.md` auf dem Zweig `ablauftest/wp01` (Commit `74cc3edd5623b19f6e3778078f95be5a142c1fb9`, bestanden)

## Gegenstand

Der Stand hat sich nach deinem Bericht geändert. Die Prüfung ist deshalb zu wiederholen. Geändert sind laut Entwickler:

- `docs/user/pipwerk-studio.md`: Glossar, Aufrufe mit Pfad und ein erfundenes Beispiel für einen vollständigen Pfad
- `docs/technical/pipwerk-studio.md`: Abschnitte 4a und 6.1
- `components/pipwerk-studio/backend/tests/test_testenv.py`: drei neue Fälle mit Aufruf über einen relativen Pfad

Prüfe, ob die Änderungen neue Probleme verursachen. Prüfe besonders, dass das Beispiel keinen Pfad, Rechnernamen oder Benutzernamen des Entwicklungsrechners enthält und dass die neuen Tests keine Seiteneffekte außerhalb ihres temporären Verzeichnisses haben.

Alle übrigen Vorgaben aus `03-securitytest-1-order.md` gelten weiter.

## Ablage

Schreibe den Testbericht ohne Commit als Datei `03-securitytest-2.md` in dein Arbeitsverzeichnis `work/ablauftest/wp01/securitytest/` im Entwicklungsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde mit Fundstelle.
