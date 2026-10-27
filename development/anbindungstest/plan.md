# Plan anbindungstest

## wp01 Anbindungstest des Teams

Ziel: Nachweis, dass Entwicklungsleiter, Entwickler, Tester und QA mit den Briefings, Skills und der Projektkonfiguration aus dev-werk starten, lesen, berichten und enden.

Ablauf für den Entwicklungsleiter:

1. Richte dein Arbeitsverzeichnis und den Arbeitszweig `anbindungstest/wp01` wie bei `implement` ein.
2. Starte nacheinander je einmal, wie im Verfahren vorgesehen: Entwickler Backend und Entwickler Oberfläche als Unteragenten, Tester Funktion, Tester Sicherheit und QA mit ihren Startskripten. Jeder erhält ein Übergabedokument mit diesem Auftrag:
   - eigenes Briefing, die Rollenübersicht und die Projektkonfiguration lesen,
   - Bericht `<rolle>.md` im Berichtsverzeichnis schreiben, höchstens zehn Zeilen: gelesene Dokumente (Pfade mit Platzhaltern `<dev-werk>` und `<entwicklungsverzeichnis>`), Projektname aus der Projektkonfiguration, verfügbare Skills, jede verweigerte Freigabe oder fehlende Datei mit Wortlaut,
   - keinen Code, keine Commits, keine Prüfung, dann enden.
3. Notiere je Rolle: gestartet ja/nein, Bericht vorhanden ja/nein, Dauer bis zum Bericht.
4. Schreibe `development/anbindungstest/questions/wp01-01.md` auf `main`: je Rolle die Notiz aus Schritt 3 und die Fundstellen aus ihrem Bericht, dazu deine eigenen Fundstellen in derselben Form.
5. Räume auf wie bei der Integration: alle Arbeitsverzeichnisse und das Berichtsverzeichnis des Pakets, den Zweig `anbindungstest/wp01` auf GitHub und lokal.
6. Melde `question` an den Projektleiter mit `development/anbindungstest/questions/wp01-01.md` und entferne die bearbeitete Meldung im selben Commit.

Keine Testumgebung, keine Meldung `acceptance`.
