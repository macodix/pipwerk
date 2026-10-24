# Prüfbericht Spezifikation und Plan, Durchlauf 8

- Vorhaben: `backtest`
- Geprüfter Commit: `fc89d3c9ae50fb7abe2ef63084c829138780ee37`
- Geprüft: Diff `9f46c6c07fde06988b96b4d748f0cc6655cd2fef..fc89d3c9ae50fb7abe2ef63084c829138780ee37` für `development/backtest/specification.md` und `plan.md`, dazu die Stellen im Commit, die Import-, Export- und Ablageverzeichnis nennen.
- Ergebnis: **bestanden**

## Blockierende Befunde

Keine.

## Prüfung 1: Spezifikation

- Einwand vollständig umgesetzt:
  - Import- und Exportverzeichnis sind Einstellungen auf dem Rechner des Backends, kein Startverzeichnis der Dateiauswahl (5.7, Zeilen 243 und 244).
  - Der Import bietet die Dateien des Importverzeichnisses an und liest sie dort direkt, ohne Hochladen und ohne Kopie (5.3, Zeile 194).
  - Das Hochladen über den Browser bleibt daneben bestehen, auch zusammen in einem Vorgang (5.3, Zeile 195; req-system-026).
  - Das Exportverzeichnis gilt als voreingestellter Ablageort künftiger Exporte; die Einstellung kommt jetzt ohne Export (5.7).
  - „Dateien behalten“ gilt nur für hochgeladene Dateien, Dateien im Importverzeichnis werden nie entfernt, verschoben oder geändert (5.3, 5.6; req-system-028).
- Widerspruchsfrei zu req-test-009: Import- und Exportverzeichnis stehen dort als Voreinstellungen. Zu req-system-026: Hochladen und Verzeichnis, mehrere Dateien, Fortschritt und Abbrechen bleiben. Zu req-system-028: keine Kopie ohne Erfordernis, Pflege durch den Anwender.
- Die Folgestellen 7, 8.3, 10, 11 und 12 sind angeglichen. In 5.3, 5.6 und 5.7 bleibt keine Aussage zurück, die den Einwand verneint (Suche nach Importverzeichnis, Exportverzeichnis, Dateidialog, Startverzeichnis im Commit).
- Einschränkungen: Der Pfad liegt unterhalb des Importverzeichnisses, symbolische Verweise nach außen werden abgelehnt, nur gewöhnliche Dateien. Der Grund steht in Abschnitt 11 (sonst gäbe die Web-API fremde Dateiinhalte preis). Die Grenze je Datei gilt weiter wie beim Hochladen; sie ist in 5.3 begründet. Die Prüfung der Verzeichnisse beim Speichern (absolut, anlegbar, lesbar beziehungsweise beschreibbar) schränkt nichts ein, was der Auftraggeber freigibt. Keine unbegründete Einschränkung gefunden.

## Prüfung 2: Plan

- `wp02` Umfang nennt den Import aus dem Importverzeichnis, alle vier Einstellungen, das Unverändertlassen der Dateien und die Anwenderdokumentation.
- Der Nicht-Umfang nennt Exporte; das Exportverzeichnis ist nur Einstellung.
- Kriterium 13 kann der Auftraggeber selbst prüfen: Einstellungen ändern, relativen Pfad prüfen, Dateien aus Importverzeichnis und Unterverzeichnis zusammen mit einer hochgeladenen Datei importieren, danach unverändert im Importverzeichnis (auch mit „Dateien behalten“).
- Kriterien 11 und 12 stehen im Diff nicht, sie sind unverändert.

## Hinweise

- H1: Der Kopf „stand der arbeit“ der Spezifikation nennt die Änderung vom 2026-10-24 zum Einwand nicht; der Änderungsnachweis nennt sie.
- H2: Das Glossar (Abschnitt 12) führt „Importverzeichnis“ und „Exportverzeichnis“ nicht unter den Begriffen auf.
- H3: Kriterium 13 nennt nicht ausdrücklich, dass das Exportverzeichnis nach dem Speichern wieder angezeigt wird.
