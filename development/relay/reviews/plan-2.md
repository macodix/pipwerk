# Prüfbericht Plan, Durchlauf 2 – Vorhaben relay

- Ergebnis: **bestanden**
- Geprüfter Commit: `40e5ea8a51fa913a9e559a1453d6c1741d65e36c` (`main`)
- Umfang: nur die geänderten Stellen und ihre Folgen (Spezifikation Abschnitt 8 mit 4.5, 5, 9; `plan.md`), nach dem Einwand zu `plan-1.html` (`scope.md`, Eintrag 2026-10-24).

## Blockierende Befunde

Keine.

## Ergebnis zu den vier Prüffragen

1. **Einwand umgesetzt.** `wp01` nutzt nur den Verzeichnis-Weg im Dateisystem. Zwischen den Rechnern liegt ein Netzlaufwerk (plan.md Ziel, Umfang, Kriterium 1; Spezifikation 8, Durchgang 1). SFTP ist das eigene Paket `wp02`, Matrix `wp03`, Wege für Dateien `wp04`, Web-API `wp05`. Das Nicht-Umfang von `wp01` nennt alle vier.
2. **Teile der Grundmechanik in den Kriterien von `wp01`:**
   - Adresse, Adressbuch, Weitergabe über zwei Relays: Kriterien 1 und 2.
   - Abruf: Kriterium 2.
   - Prüfwert: Kriterium 5.
   - Warteschlange und Wiederholung der Übergabe: Kriterium 4.
   - Wiederholter Umschlag: Kriterium 5.
   - Unzustellbare Nachricht: Kriterien 4 und 6.
   - Empfangsbestätigung: Kriterium 3, mit der Prüfkomponente `probe send` und `probe listen`. Der Auftraggeber kann sie selbst auslösen und sehen. Auch der Fall ohne verlangte Bestätigung ist abgedeckt.
   - Robustheit: Störungen 1 bis 7 in den Kriterien 4 bis 6.
3. **Keine Widersprüche zu 3.4, 3.7, 4.1, 4.4, E4 und `scope.md`.** Die Netzlaufwerk-Aussage in 3.4 („auch ein vom Betreiber eingebundenes Netzlaufwerk“, „SFTP-Server oder Netzlaufwerk“) passt zu Durchgang 1. Die Störungen stimmen mit den Regeln überein: keine Meldung bei Fälschung (4.1 Schritt 1), Wiederholung vor Schleife (Schritt 4), neue Bestätigung bei Wiederholung (3.7), `relay_unreachable` nach Frist (Schritt 7). Die Prüfkomponente schränkt nichts ein. Sie ist kein Teil des Abrufs, und der Abruf bleibt ohne `receipt` (3.7).
4. **Abdeckung und Abhängigkeiten schlüssig.** Jeder Teil der Spezifikation steht in der Tabelle „Abdeckung der Spezifikation“. Die Durchgänge 1 bis 4 gehören zu `wp01` bis `wp04`. Abhängigkeiten: `wp02`, `wp03` und `wp05` hängen von `wp01` ab, `wp04` von `wp02` und `wp03`. Es gibt keinen Zyklus. Der Nachweis laut `scope.md` ist mit `wp01` (Verzeichnisse) und `wp03` (Matrix) zu führen.

## Hinweise (nicht blockierend)

- H1, plan.md Kriterien 4 und 6: „beim Absender“ und „beim Anfrage-Programm mit Exitcode 1“ sind nicht in jedem Fall eindeutig. Bei `too_large` und `relay_unreachable` einer `fetch.file` geht die Meldung an `serve`, nicht an das Anfrage-Programm, das dann nur nach seiner Wartezeit endet (Spezifikation 4.4, 6.3). Die Aufträge sollten je Störung sagen, welche Komponente die Meldung anzeigt: Prüfkomponente oder Anfrage-Programm.
- H2, Kriterium 5: Störung 5 verlangt in Spezifikation 8 auch „Bestätigung wird erneut geschickt“, und Störung 4 nennt den „Umschlag mit falschem Schlüssel“. Beides steht nicht im Kriterium.
- H3, Kriterien 4 und 5: Der Auftraggeber muss Umschläge im Verzeichnis verändern oder erneut ablegen, und er muss eine Schleife über zwei Relays einrichten, die einander Standard-Relay sind. Der Leser entfernt Dateien nach dem Quittieren. Die Anwenderdokumentation (Kriterium 8) sollte sagen, wie er diese Störungen auslöst (Kopie vor dem Lesen, Relay angehalten).
- H4, Spezifikation 3.4 und 8: Die Robustheit von `wp01` hängt an Netzlaufwerken, nämlich am Umbenennen und an der Reihenfolge von Anlagen und Umschlag. Die Spezifikation nennt keine Annahmen oder Grenzen dazu, zum Beispiel für das Zwischenspeichern von SMB. Der Auftrag sollte sie festhalten.
- H5, Spezifikation 1: Der Nachweis nennt noch „einen Durchgang über Matrix und einen über Verzeichnisse“. Seit der Änderung gibt es zwei Verzeichnis-Durchgänge (Netzlaufwerk, SFTP) und Durchgang 4. Die Abdeckungstabelle hält „1 Nachweis“ bei `wp01` und `wp03`. Das ist vereinbar, aber Abschnitt 1 ist nicht angepasst.
- H6, Spezifikation 9 und plan.md `wp01`: Der Begriff „Prüfkomponente“ fehlt in der Glossarliste.
