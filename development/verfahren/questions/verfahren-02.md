# Frage verfahren-02 – Bestätigung des neuen Oberflächenentwurfs der Übersicht

- Vorhaben: Entwicklungsverfahren verbessern (`verfahren`), ref `verfahren`
- von: Softwarearchitekt
- an: Projektleiter
- Stand: 2026-10-24

## Unterbrochene Aufgabe

`specify` für `verfahren` (Phase 2, Konzeption). Stand:

- Antworten aus [verfahren-01.md](verfahren-01.md) sind in der [Spezifikation](../specification.md) eingearbeitet (4.1, 7.2). H20 erledigt.
- Neuer Oberflächenentwurf nach Festlegung 6 (drei Ebenen aus Kästchen) ist fertig. Auftrag: [prototype/order-02.md](../prototype/order-02.md). Zweig `verfahren/proto-uebersicht`, Commit `f2e178dfcc3e8d1b69ae8fcc649001a1f0216be7`. Laut Entwickler alle fünf technischen Abnahmekriterien erfüllt: Browsertest `78 passed` in Chromium, Firefox und WebKit, 18 Bildschirmbilder (drei Ebenen in sechs Fenstergrößen). Die Bilder habe ich nicht selbst angesehen.
- Wartet auf die Antwort: Abschnitt 7.4 nach dem bestätigten Entwurf, dann Prüfung durch die QA, danach `present`.

## Wo der Entwurf liegt

- Zum Ansehen: `development/verfahren/prototype/uebersicht-prototyp.html` auf `main`, im Browser öffnen, ohne Server.
- Bildschirmbilder: `verfahren/proto-uebersicht:tools/overview/prototype/screenshots/`.
- Entscheidungen des Entwicklers: `verfahren/proto-uebersicht:tools/overview/prototype/README.md`.

Alle Angaben sind fest eingetragene Beispiele. Außer „Entwicklungsverfahren verbessern“ sind alle Namen erfunden.

## Fragen

### 1. Bestätigung des Oberflächenentwurfs

Benötigte Entscheidung: Bestätigt der Auftraggeber den Entwurf als Vorlage für die Übersicht? Er soll in zwei bis drei Klicks ohne Anleitung ablesen, wo ein Vorhaben steht, wer daran arbeitet und was auf ihn wartet.

So ist der Entwurf gelöst. Mit der Bestätigung gelten diese Punkte als bestätigt:

1. Ebene 1 je Vorhaben ein Kästchen, Ebene 2 die sechs Phasen, Ebene 3 die Pakete der Phase. Oben eine Pfadleiste zurück, auch die Zurück-Taste des Browsers führt eine Ebene zurück.
2. Grau nicht begonnen, gelb begonnen, grün erledigt, in jedem Kästchen zusätzlich als Wort.
3. Was auf den Auftraggeber wartet, hat auf allen drei Ebenen einen kräftigen blauen Rahmen und die Marke „Wartet auf Sie: <Handlung>“.
4. In Phase 1 bis 3 gibt es keine Pakete. Ebene 3 zeigt dort ein Kästchen mit dem aktuellen Schritt, bei wem und seit wann.
5. Ein Paket wird in einer Phase grau angezeigt, solange es sie nicht erreicht hat, gelb, solange es in ihr ist, grün danach. Die Phase Umsetzung bleibt gelb, bis alle Pakete fertig sind, auch wenn gerade kein Paket in ihr ist (im Beispiel „Strategietester“: „0 von 3 Paketen in dieser Phase“).

Vorschlag: Entwurf bestätigen.

**Antwort des Auftraggebers (2026-10-24):** Bestätigt in Aufbau und Bedienung, „nicht wirklich hübsch, aber funktional“. Die optische Gestaltung der echten Seite darf ansprechender werden.
