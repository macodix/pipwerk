# Prüfbericht Spezifikation relay, Durchlauf 6

- Ergebnis: **nicht bestanden** (ein blockierender Befund)
- geprüfter Commit: `69b324edb7ff607d4798399771bf30eaf6105be3` (`main`, enthält `specification-6-order.md`)
- Gegenstand: `development/relay/specification.md` im Vergleich zu `5871ed93f1d26e96a50c3d53bfd0da58a8cd395d`; Abnahmebericht `wp01/acceptance/1.md`; Entwicklungsregeln Abschnitt 5 Nr. 15
- Erster, vollständiger Durchlauf für die geänderten Stellen.

## Prüfung der Mängel

- M1 behoben: eine Installationsdatei je Paket von der Release-Seite, Skript, Programme unter ihrem Namen aufrufbar (E8, 4.6 Schritt 1).
- M2 behoben für das Relay: `pipwerk-relay.ini` legt die Einrichtung an, `betrieb.json` entfällt, Betriebskonfiguration nur über `pipwerk-relay-setup` (E6, 4.5). Für den Abruf siehe B1.
- M3 behoben: Datenbankschema beim Start (E6), Relay startet bei der Anmeldung (4.5).
- M4 behoben für Relay und Komponenten auf demselben Rechner: Schlüsselpaar je Relay, Austausch über den gemeinsamen Weg mit Prüfcode (E5, 4.3, 4.6). Für SFTP siehe H2.
- M5 behoben: getrennte Programme ohne Unterbefehle, Prüfprogramme in eigener Komponente (E1). Aufgabe, Name und Begründung stehen in der Tabelle und in E1. Betrieb, Verwaltung und Werkzeuge für Tests sind getrennt.
- M6 behoben: Durchgänge 1 bis 4 brauchen nur Relay und Prüfprogramme, der Abruf hat die Durchgänge 5 und 6 (Abschnitt 1, 8). Der Nachweis nach `scope.md` (einmal Verzeichnisse, einmal Matrix) bleibt mit den Durchgängen 5 und 6 führbar.
- M7 behoben: E9 (deutsche Ausgaben, Beispielnamen aus Kleinbuchstaben und Ziffern).

## Blockierende Befunde

**B1 – Einrichtung des Abrufs ist nicht aus Sicht des Anwenders beschrieben (Sache der Spezifikation)**
- Fundstelle: 6.1 und 4.6. 4.6 beschreibt nur Installation und Einrichtung des Relays. Für `pipwerk-fetch-mt5-serve` und `pipwerk-fetch-request` steht nur, dass die Startkonfiguration `pipwerk-fetch-mt5.ini` einen Abschnitt `[relay]` kennt und dass `server_time_zone` für `pipwerk-fetch-mt5-serve` Pflicht ist (6.1).
- Sachverhalt: Wer die Datei anlegt und wie der Anwender den Pflichtwert einträgt, steht nirgends. Nach dem Wortlaut legt der Anwender die Datei von Hand an. Ein Programm zur Einrichtung gibt es für den Abruf nicht (E1), und Abschnitt 9 verlangt nur, dass die Anwenderdokumentation keinen Schritt mit Bearbeiten einer Datei enthält. Beides widerspricht sich für den Abruf.
- Maßstab: Briefing QA Phase 2 und M2 („von Hand angelegt und gepflegt“ ist nicht annehmbar). Die Durchgänge 5 und 6 des Nachweises (8) setzen genau diese Einrichtung voraus.
- Frage: Wie richtet der Anwender den Abruf ein, ohne eine Datei von Hand anzulegen? Welches Programm erledigt das, und wie sieht der Ablauf für ihn aus?
- Ich habe `pipwerk-fetch-mt5` nicht eingesehen (nicht in diesem Stand); geprüft ist nur der Wortlaut der Spezifikation.

## Hinweise

- H1 (Sache der Spezifikation): E1 und E8 nennen nur zwei Installationsdateien (Relay, Prüfprogramme). 6.1 verlangt eine dritte für `pipwerk-fetch-mt5`. Die Aufzählung in E8 angleichen.
- H2 (Sache der Spezifikation): 3.4 (SFTP) verlangt, dass der Anwender den öffentlichen Schlüssel anzeigen lässt und beim SFTP-Server einträgt. Das ist ein Schlüssel, der von Hand verteilt wird (M4). Der Ablauf wird vor `wp02` festgelegt; dort prüfen, ob er ohne Kopieren auskommt.
- H3 (Sache der Spezifikation): E5 schützt die Verbindung Komponente–Relay auf demselben Rechner nur durch Zugriffsrechte auf das Verzeichnis. Das Relay erkennt dort keine Veränderung durch einen anderen Prozess desselben Benutzers (req-relay-010), und jeder solche Prozess kann ein fremdes Komponentenverzeichnis beschreiben. E5 begründet das ausdrücklich, daher nur ein Hinweis. Eine Komponente unter einem anderen Benutzer erreicht das Relay nur über `http` oder Matrix (3.5); das in der Anwenderdokumentation nennen.
- H4: Anhalten und Starten des Relays steht nicht in der Einrichtung (4.5); Störung 1 (8) verlangt es vom Anwender mit Mitteln des Betriebssystems. Die Anwenderdokumentation muss Zweck und Befehle erklären (9). Unter Linux läuft ein Benutzerdienst ohne Anmeldung nicht an; für ein Relay auf einem Rechner ohne angemeldeten Benutzer klären.
- H5: 4.6 Schritt 2 „Name des Rechners in Kleinbuchstaben und Ziffern“: Wie wird ein Rechnername mit Bindestrich umgesetzt? Im Auftrag festlegen.
- H6: E8 lädt uv und Python bei Bedarf aus dem Netz (req-system-006: Laufzeitbestandteile mit der Komponente). Als bewusste Abweichung in der technischen Dokumentation begründen.
- H7: 4.5 „am ersten Ort nach req-system-017“ ist unklar, weil `-c <PATH>` dort der erste Eintrag ist. Außerdem nicht ausdrücklich: `pipwerk-relay`, `-setup`, `-status` und die Abrufprogramme unterstützen `-c` (req-system-018).

## Entscheidung des Auftraggebers

Keine. Der Bedienablauf 4.6 ist ein Vorschlag; gegen die Mängel und Anforderungen geprüft ist er schlüssig. B1 und die Hinweise sind Sache der Spezifikation.
