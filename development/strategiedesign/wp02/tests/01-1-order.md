# Prüfauftrag Auftrag 01, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `f22b0a98f3ef22d649fd1dc85bdeb2f91436a3b4` auf Zweig `strategiedesign/wp02-01`, aufgesetzt auf `b158eae2636f3f210e11fb2bcbfa27d3cfcd80fa`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/01.md`
- Prüfgrundlagen: der Auftrag, `development/strategiedesign/specification.md` (Abschnitte 2 E2 und E3, 3.7, 5, 7 Punkt Oberfläche, 8), `development/strategiedesign/plan.md` (`wp02`), `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-studio.md`, `docs/technical/pipwerk-domain.md`
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Dieser Durchlauf ist der erste und vollständig. Nur blockierende Befunde verhindern das Bestehen, alles andere steht als Hinweis im Bericht.

## Angaben des Entwicklers

- Alle 16 Punkte umgesetzt, keine neue Abhängigkeit. Sprachauswahl in den Einstellungen. Rahmen der Verwaltung aus dem Dokument abgeleitet, Einklappen nur Ansichtszustand, Zuordnung über den Mittelpunkt des gezogenen Elements. Ausdruckseingabe fragt `check` nach 400 ms Pause ab, ältere Anfragen werden abgebrochen. Alle Anfragen über `requestJson` mit 10 s Zeitgrenze und geprüften Antworten.
- Neu `e2e/designer.spec.ts`; das Objektverzeichnis liegt im Browsertest im temporären Verzeichnis des Laufs.
- Prüfskript auf freien Ports mit Exitcode 0: Vitest 674 Tests, Browsertests 63 Tests in drei Browsern, Bibliothek 985 Tests, Backend bestanden.
- Keine Stellen nach Nicht-Umfang, dritter Punkt (keine Fehler in Bibliothek, Backend, Web-API gemeldet).

## Tester Funktion

Führe das Prüfskript `components/pipwerk-studio/scripts/check` ohne `--with-audit` auf freien Ports aus, nicht 5174 und 8001. Prüfe erwartetes Verhalten, Grenzfälle und Fehlerfälle gegen den Auftrag, insbesondere die technischen Abnahmekriterien 1 bis 6: keine Typkenntnis in der Darstellung (Kriterium 3), Ableitung Dokument → Zeichenfläche → Dokument ohne Verlust für beide Testfalldokumente, Erhalt unbekannter Felder und Belegungen, Verwaltung, Rückfragen, Befundanzeige, Ausdruckseingabe einschließlich der Entscheidung zu S19, unbekannter Typ nach der Entscheidung zu S20, Einstellungen, Zeitbegrenzung und Prüfung der Antworten. Prüfe Programmierregeln und die technische Dokumentation auf Vollständigkeit und Übereinstimmung mit dem Code. Änderungen am Prüfskript machst du im Zweig `strategiedesign/wp02-functiontest`, aufgesetzt auf dem geprüften Commit. Nenne den Commit des Prüfskripts.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/reports/01-functiontest-1.md`

## Tester Sicherheit

Prüfe den Commit nach BSI-Grundschutz, OWASP und den Sicherheitsregeln: Texte nur als Text (kein `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, keine HTML-Auswertung in Übersetzungen), Umgang mit Antworten des Backends und Eingaben des Anwenders, Pfadeingabe des Objektverzeichnisses, keine festen Ports, Pfade, Rechnernamen oder Zugangsdaten, Browsertests schreiben nicht außerhalb ihres temporären Verzeichnisses, Abhängigkeiten unverändert.

Ablage: `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/reports/01-securitytest-1.md`
