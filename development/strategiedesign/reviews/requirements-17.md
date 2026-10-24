# Prüfbericht Dokumente des Auftraggebers, Durchlauf 17 (QA, Phase 1, geänderte Stelle)

- Vorhaben: `strategiedesign`
- Ergebnis: **nicht bestanden** (ein blockierender Befund, B1)
- Geprüfter Commit: `df7f2efcab36d260b078d130e96f6b30dd0f260e` (jüngster Commit auf `origin/main`, der den Prüfauftrag enthält)
- Maßstab: `git diff 1772667804e1977e27e0513e520b8280fbb4764e^ 1772667804e1977e27e0513e520b8280fbb4764e -- docs/design/requirements/anforderungen-strategiedesigner.md`

## Geprüfte Änderung

- req-ui-016, neuer Satz: „Hinweise und Dialoge des Strategiedesigners, zum Beispiel „Keine Strategie geöffnet“ oder der Assistent, erscheinen in der Eigenschaftenansicht und nur dort, nicht zusätzlich auf der Zeichenfläche.“
- Dazu die Zeile vom 2026-10-23 im Änderungsnachweis. Sonst enthält der Diff nichts.

## Blockierende Befunde

### B1 – „Dialoge … nur in der Eigenschaftenansicht“ widerspricht Dialogen und Rückfragen, die andere Anforderungen verlangen

- Fundstelle: `anforderungen-strategiedesigner.md`, req-ui-016 (neuer Satz) gegen req-ui-010, req-ui-011, req-ablauf-004 (Schließen mit ungespeicherten Änderungen), req-ablauf-005 (Löschen nach Rückfrage; Zeilen 379 und 383, Kennungen der Abschnitte nicht einzeln geprüft).
- Sachverhalt:
  - req-ui-010 verlangt einen Dialog „Über pipwerk Studio“, bei dem „die übrige Oberfläche gesperrt“ ist und der nur mit „Schließen“ oder Escape endet. Die Eigenschaftenansicht ist selbst Teil der Oberfläche. Ein Dialog, der „nur dort“ erscheint, und eine gesperrte übrige Oberfläche passen nicht zusammen.
  - req-ui-011 verlangt Meldungen, die bestätigt werden müssen, bei kritischen Fehlern (etwa Speichern schlägt fehl).
  - Zeile 379: beim Schließen mit ungespeicherten Änderungen „fragt der Designer: speichern, verwerfen oder abbrechen“. Zeile 383: Löschen „nach Rückfrage“. Das sind Rückfragen, ob sie „Dialoge“ sind, sagt der Text nicht.
  - Der Satz sagt „Dialoge des Strategiedesigners“ ohne Eingrenzung. Die Beispiele („Keine Strategie geöffnet“, Assistent) decken nur einen Teil. Der Einwand des Auftraggebers (`strategiedesign-03.md`, Antwort Punkt 1) nennt ebenfalls nur den Hinweis und den Assistenten.
- Zuordnung: Entscheidung des Auftraggebers. Der Satz ist weiter gefasst als der Einwand; ob er auch den Dialog „Über“, Rückfragen und bestätigungspflichtige Fehlermeldungen meint, folgt aus keiner Festlegung. „Keine Einschränkung ohne Erfordernis“ spricht gegen eine stillschweigende Ausweitung.
- Frage an den Auftraggeber: Gilt „nur in der Eigenschaftenansicht“ für alle Hinweise und Dialoge, oder nur für Hinweise zu leeren Zuständen und den Assistenten? Wo erscheinen der Dialog „Über pipwerk Studio“, die Rückfragen (Schließen, Löschen) und die zu bestätigenden Fehlermeldungen?

## Testfälle

- `str-01` und `str-03`: Die Änderung betrifft nur den Ort von Hinweisen und Dialogen. Objekte, Elemente und Arbeitsabläufe bleiben gleich (Anlegen, Speichern, Laden nur auf dem Dokumentstand durchgespielt). Beide Testfälle lassen sich weiterhin vollständig gestalten, speichern und wieder laden.
- Der Weg zum Speichern bleibt offen: Bei offenem B1 ist nur unklar, wo die Rückfrage beim Schließen erscheint, nicht ob sie möglich ist.

## Hinweise (nicht blockierend, je eine Zeile)

- H1 – „Hinweise“ meint in req-ui-016 Bedienhinweise, in req-ablauf-007 (Zeilen 401, 402) die Stufe „Hinweis“ der Konsistenzprüfung; req-ui-011 lässt die „Darstellung von Hinweisen“ offen. Zuordnung: offener Punkt (bereits gekennzeichnet); ob der neue Satz ihn berührt, entscheidet der Auftraggeber zusammen mit B1.
- H2 – Befunde stehen laut req-ui-011 am Element auf der Zeichenfläche (rote Umrandung) und in der Eigenschaftenansicht; der neue Satz nennt Befunde nicht. Kein Widerspruch, solange Befunde nicht als „Hinweise“ gelten. Zuordnung: Sache der Spezifikation (Abgrenzung).
- H3 – Die Eigenschaftenansicht zeigt sonst das ausgewählte Objekt oder, nach Klick auf die leere Zeichenfläche, die Strategie (req-ui-005). Der Text sagt nicht, was Vorrang hat, wenn Hinweis oder Assistent und eine Auswahl zusammentreffen. Zuordnung: Sache der Spezifikation.
- H4 – req-system-024: In schmalen Fenstern darf die Eigenschaftenansicht eingeklappt sein. Dann muss der Hinweis, der den nächsten Schritt nennt (req-ui-016, „Jeder leere Zustand …“), erreichbar bleiben. Zuordnung: Sache der Spezifikation (Fenstergrößen legt sie fest).
- H5 – „Jeder leere Zustand nennt den nächsten Schritt“ gilt auch für Bereiche außerhalb der Zeichenfläche (zum Beispiel leere Liste bei „Öffnen“, leerer Objektbereich). „Nur dort“ ist für sie nicht gemeint, aber nicht ausgeschlossen. Zuordnung: Sache der Spezifikation.
- H6 – Die Erklärungen „beim Zeigen“ (Elementbibliothek, Felder) erscheinen an Ort und Stelle, nicht in der Eigenschaftenansicht. Ob sie „Hinweise“ sind, sagt der Satz nicht. Zuordnung: Sache der Spezifikation (Hinweis ist hier nicht gemeint, sofern B1 so entschieden wird).
- H7 – Das Glossar kennt „Assistent“ (Zeile 36), nicht „Eigenschaftenansicht“ als Ort für Hinweise; kein Widerspruch. Zuordnung: Sache der Spezifikation, nur zur Kenntnis.

## Fragen an den Auftraggeber

- Eine, siehe B1.
