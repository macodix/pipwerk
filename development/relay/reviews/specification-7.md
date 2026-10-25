# Prüfbericht Spezifikation relay, Durchlauf 7 (Nachprüfung)

- Ergebnis: **nicht bestanden** (ein neuer blockierender Befund)
- geprüfter Commit: `021cb226a66e2542d5c12e8da9ad29507093b6b5` (`main`, enthält `specification-7-order.md`)
- Gegenstand: Nachprüfung von B1 aus `specification-6.md`; geprüft sind die Änderungen in `development/relay/specification.md` gegenüber `69b324edb7ff607d4798399771bf30eaf6105be3` (E1, E8, 4.5, 4.7 neu, 6.1, 9, 10), dazu Entwicklungsregeln Abschnitt 5 Nr. 15 und req-system-017/018. Plan und Code sind nicht geprüft.

## Prüfung von B1

B1 ist im Kern behoben. `pipwerk-fetch-mt5-setup` legt die Startkonfiguration an (E1, 6.1). 4.7 beschreibt den Ablauf: eine Frage zur Zeitzone mit Liste und Erklärung, Kontrolle gegen MetaTrader 5, Start beim Anmelden. `pipwerk-fetch-request` braucht keine Datei. Abschnitt 9 verlangt die Einrichtung nach 4.7 in der Anwenderdokumentation. Die Aufgabe des neuen Programms ist eindeutig und es ist nach ihr benannt, das passt zu Regel 15. Die Ortsangabe in 4.5 stimmt mit req-system-017 überein.

## Blockierende Befunde

**B1 – Widerspruch beim zweiten Rechner: E8 und 4.7 Schritt 1 gegen Schritt 3 (Sache der Spezifikation)**
- Fundstelle: E8 (Installationsskript „startet danach die Einrichtung des Pakets, soweit es eine hat“), 4.7 Schritt 1 und 3.
- Sachverhalt: Schritt 1 lässt auf dem zweiten Rechner dieselbe Installationsdatei `pipwerk-fetch-mt5-<Version>.zip` installieren. Das Paket hat eine Einrichtung, also startet das Skript sie nach E8. Schritt 2 sagt, das Skript starte sie „unter Windows“. Schritt 3 sagt dagegen für den zweiten Rechner „Keine Einrichtung“. Ist der zweite Rechner ein Windows-Rechner ohne MetaTrader 5, würde nach E8 und Schritt 2 trotzdem die Frage nach der Zeitzone des Brokers gestellt, und es wäre offen, ob dort `pipwerk-fetch-mt5.ini` entsteht und ob `pipwerk-fetch-mt5-serve` beim Anmelden startet. Das widerspricht Schritt 3 und 6.1 (`server_time_zone` nicht für `pipwerk-fetch-request`).
- Maßstab: Briefing QA Phase 2, Bedienablauf aus Sicht des Anwenders; B1 aus `specification-6.md` betraf genau diesen Ablauf.
- Frage: Was erlebt der Anwender auf dem zweiten Rechner (Windows und Linux) bei der Installation? Wird die Einrichtung dort gestartet, und wenn nicht, woran erkennt das Skript, dass sie nicht gebraucht wird?

## Hinweise

- H1 (Sache der Spezifikation): 4.7 Schritt 2 lässt offen, wie der Anwender die Zeitzone später ändert und wie er die Zuordnungstabelle `[symbols]` in der „Auswahl“ pflegt. In 4.6 Schritt 5 steht dafür eine Aufzählung. Im Auftrag für das Paket festlegen.
- H2 (Sache der Spezifikation): Der Name der Komponente (`abruf`, `anfrage`) und der Weg in `[relay]` sind in der Einrichtung nicht änderbar (4.7). Ein anderer Name wäre nur durch Bearbeiten der Datei möglich, im Widerspruch zu 9. Klären, ob die Voreinstellung genügt.
- H3 (Sache der Spezifikation): Ob `pipwerk-fetch-mt5-serve` nach einem Relay-Start wartet oder erneut verbindet, und wie der Anwender es anhält, nennt 4.7 nicht (vergleiche 4.5 für das Relay).
- H4 (Sache der Spezifikation): Abschnitt 10 sagt zu `specification-6.md` H5, der Vorschlag zum Umsetzen des Rechnernamens stehe in 4.6 Schritt 2. Dort steht nur „Kleinbuchstaben und Ziffern“, nicht der Umgang mit einem Bindestrich. Entweder den Vorschlag nennen oder den Eintrag berichtigen.

## Entscheidung des Auftraggebers

Keine. 4.7 ist ein Vorschlag und wird dem Auftraggeber zur Bestätigung vorgelegt; B1 und die Hinweise sind Sache der Spezifikation.
