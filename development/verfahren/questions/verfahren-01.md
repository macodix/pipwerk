# Frage verfahren-01 – Bestätigung des Oberflächenentwurfs „Stand der Vorhaben“

- Vorhaben: Entwicklungsverfahren verbessern (`verfahren`), ref `verfahren`
- von: Softwarearchitekt
- an: Projektleiter
- Stand: 2026-10-24

## Unterbrochene Aufgabe

`specify` für `verfahren` (Phase 2, Konzeption). Stand:

- Nachprüfung der Festlegungen: bestanden ([requirements-2.md](../reviews/requirements-2.md), geprüft auf Commit `051e6c8dcdd1d7b58bbfc6f22337d05ba4cc7d2f`). Hinweis H20 betrifft den Wortlaut von Festlegung 7 („blockiert die Arbeit vollständig blockiert“) und ist Sache des Projektleiters.
- Oberflächenentwurf der Übersicht nach Festlegung 6 ist fertig. Auftrag: [prototype/order-01.md](../prototype/order-01.md). Zweig `verfahren/proto-uebersicht`, Commit `565baa3725e5bffdb65f121f1c291fe7d28cfcc0`. Alle fünf technischen Abnahmekriterien sind laut Entwickler erfüllt: Browsertest `30 passed` in Chromium, Firefox und WebKit, Bildschirmbilder in sechs Fenstergrößen. Das Bild in 1366 × 768 habe ich selbst angesehen.
- Entwurf der Spezifikation: [specification.md](../specification.md) auf `main`. Alles steht außer Abschnitt 7.4 (Gestaltung der Übersicht). Von der QA noch nicht geprüft.
- Wartet auf die Antworten: Abschnitt 7.4 nach dem bestätigten Entwurf, Antworten zu Fragen 2 und 3 in die Abschnitte 4.1 und 7.2, dann Prüfung durch die QA, danach `present`.

## Wo der Entwurf liegt

- Zum Ansehen: `development/verfahren/prototype/uebersicht-prototyp.html` auf `main`. Die Datei im Browser öffnen, ohne Server und ohne Internetverbindung.
- Bildschirmbilder in allen sechs Fenstergrößen: `verfahren/proto-uebersicht:tools/overview/prototype/screenshots/`.
- Entscheidungen des Entwicklers: `verfahren/proto-uebersicht:tools/overview/prototype/README.md`.

Was der Entwurf nur vortäuscht: Alle Angaben sind fest eingetragene Beispiele, auch der Zeitpunkt „erzeugt am“. Die Namen „Strategietester“, „Strategiedesigner“, „Verbindung zum Broker“, „Über-Dialog“ und alle Paketnamen sind erfunden. Die echte Seite wird aus dem Stand im Repository erzeugt (Spezifikation Abschnitt 7).

## Fragen

### 1. Bestätigung des Oberflächenentwurfs

Benötigte Entscheidung: Bestätigt der Auftraggeber den Entwurf als Vorlage für die Übersicht? Er soll dafür die Seite öffnen und ohne Anleitung ablesen: was auf ihn wartet, in welcher Phase jedes Paket ist und wer daran arbeitet.

Im Entwurf sind folgende Punkte so gelöst. Festlegung 6 legt sie nicht fest. Mit der Bestätigung gelten sie als bestätigt:

1. Ganz oben steht „Wartet auf Sie“ mit jedem offenen Punkt: was zu tun ist (Präsentation bestätigen, Frage beantworten, Abnahme durchführen), Vorhaben, Paket und seit wann. Ist nichts offen, steht dort „Im Moment wartet nichts auf Sie.“
2. Darunter ein Block je laufendem Vorhaben mit Name, Kennung klein daneben und Phase. Darin eine Zeile je Paket mit Name, Phase, bei wem, seit wann. Was auf den Auftraggeber wartet, steht im Vorhaben oben und ist mit Rahmen, Tönung und der Marke „Wartet auf Sie“ hervorgehoben, nicht nur über die Farbe.
3. Ein Paket, das noch auf ein anderes wartet, zeigt „wartet auf …“. Fertige Pakete stehen zuletzt in grauer, kleinerer Schrift mit dem Tag der Übernahme.
4. Ein Vorhaben ohne Pakete (Anforderung, Konzeption, Planung) zeigt eine Zeile mit Phase, bei wem und seit wann.
5. Vorhaben, deren Pakete alle fertig sind, stehen unten unter „Abgeschlossene Vorhaben“, zugeklappt.
6. Auf schmalen Fenstern werden die Zeilen zu untereinander stehenden Karten.

Vorschlag: Entwurf bestätigen.

### 2. Wert „Projektleiter“ bei „bei wem“

Sachverhalt: Festlegung 6 nennt „Team, Softwarearchitekt oder Auftraggeber“. Einige kurze Schritte erledigt der Projektleiter selbst, ohne den Auftraggeber: einen Prüfbericht einarbeiten oder eine Aufgabe nach dem dritten Abbruch wieder anstoßen (Spezifikation Abschnitt 7.2). Die Arbeit liegt dann bei keinem der drei.

Benötigte Entscheidung: Soll die Übersicht in diesen Fällen „Projektleiter“ anzeigen?

Vorschlag: Ja, „Projektleiter“ als vierter Wert, ohne Hervorhebung. Sonst müsste die Seite einen dieser Schritte einer Rolle zuschreiben, die gerade nicht daran arbeitet.

### 3. Umgebung des Chats des Projektleiters (Frage an den Projektleiter)

Sachverhalt: Die Wiedervorlage nach Festlegung 2 setzt voraus, dass der Chat des Projektleiters sich selbst alle 20 Minuten eine wiederkehrende Aufgabe stellen kann (Spezifikation Abschnitt 4.1). Ob seine Umgebung das bietet, ist von hier aus nicht prüfbar.

Benötigte Angabe: In welcher Umgebung arbeitet der Chat des Projektleiters? Kann er dort eine wiederkehrende Aufgabe alle 20 Minuten einrichten, und läuft sie nach einer Frist von selbst aus?

Vorschlag: Der Chat arbeitet in Claude Code und nutzt dessen geplante Aufgaben (zum Beispiel `/loop 20m`). Läuft die Aufgabe nach einer Frist aus, richtet der Chat sie bei jeder Ansprache durch den Auftraggeber neu ein.

## Hinweis an den Projektleiter

Beim Bau des Entwurfs hat `npx playwright install` im gemeinsamen Zwischenspeicher der Browser auf dem Entwicklungsrechner die älteren Browserversionen von Playwright entfernt (Playwright 1.64.1 statt bisher älterer Versionen). Laut Entwickler hat das Playwright selbst getan, beim Aufräumen nach der Installation. Andere Vorhaben, deren Browsertests eine ältere Playwright-Version verwenden, müssen ihre Browser beim nächsten Lauf neu installieren. Für dieses Vorhaben ist nichts zu tun. Nach Festlegung 7 greift dieses Vorhaben dort nicht ein.
