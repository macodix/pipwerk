# Prüfbericht Dokumente des Auftraggebers, Durchlauf 6

- Vorhaben: `backtest`, Phase 1 (Rückkopplung aus der Abnahme von `wp02`)
- Rolle: QA
- geprüfter Commit: `95d5bda70e36ebacc3d00cf94c9a2d0352e1a34d` auf `main`
- Umfang: beschränkt auf die geänderten Stellen req-system-026, req-system-027 (Gesamtsystem) und req-test-003 (Strategietester), einschließlich Widersprüchen zu nicht geänderten Stellen, zum Fachmodell, zum Glossar und zu den Testfällen laut `scope.md`.

## Ergebnis

**bestanden**

Blockierende Befunde: keine.

## Prüfung

- req-system-026: „mehrere Dateien in einem Vorgang“ ist eindeutig und widerspricht keiner Stelle. Format, Prüfung und Übernahme bleiben wie bisher.
- req-system-027: „pipwerk relay“ ist in `docs/design/projektziel.md` (Tabelle der Module) als Nachrichtensystem festgelegt und passt zu req-system-005. Die Übergangslösung (Programm von Hand aufgerufen, Dateien in ein Verzeichnis, Import nach req-system-026, kein Server, kein Port) ist in sich geschlossen und deckt M4 des Abnahmeberichts ab.
- req-test-003: „entfällt die automatische Beschaffung“ bleibt mit req-system-027 und der Meldung bei fehlenden Daten vereinbar. Der Testlauf startet dann nicht, die Meldung nennt die fehlenden Daten.
- Testfälle `str-01` und `str-03`: Beide lassen sich weiter abbilden. Die Daten kommen in der Übergangszeit über den Import in den Datenbestand.
- Glossar: Der Eintrag „Beschaffung“ (`docs/technical/glossar.md`) widerspricht den Änderungen nicht.

## Hinweise (nicht blockierend)

Alle Hinweise folgen aus einer Festlegung (Angleichen von Folgesätzen). Die Zuordnung ist „folgt aus einer Festlegung“, nämlich aus der Entscheidung des Auftraggebers vom 2026-10-23 (Übergangslösung bis pipwerk relay).

- H1: `anforderungen-strategietester.md`, Abschnitt 2 (Testlauf): „Fehlende Kursdaten werden nach req-test-003 beschafft.“ Der Satz nennt die Übergangslösung nicht und liest sich unbedingt.
- H2: `anforderungen-strategietester.md`, req-test-003, Absatz „Fehlen danach Daten …“: „danach“ und „warum sie nicht beschafft werden konnten“ setzen eine automatische Beschaffung voraus. In der Übergangslösung gibt es keinen Beschaffungsversuch. Der Satz sollte auch dort gelten oder sagen, was die Meldung dann nennt.
- H3: `anforderungen-gesamtsystem.md`, req-system-027: „Der Anwender kann die Beschaffung auch von Hand anstoßen“ steht vor der Übergangslösung („pipwerk stößt die Beschaffung nicht an“). Unklar ist, ob „anstoßen“ in der Übergangszeit den Aufruf des Programms meint.
- H4: `anforderungen-gesamtsystem.md`, req-system-027, Übergangslösung: Das Verzeichnis, in das die Beschaffung die Dateien schreibt, ist nicht benannt. Es ist eine Lücke ohne Beeinträchtigung von Betrieb, Umsetzung oder Sicherheit und gehört in die Spezifikation.
- H5: `anforderungen-gesamtsystem.md`, req-system-027: Der Zeitpunkt „bis pipwerk relay zur Verfügung steht“ ist offen. Der Auftraggeber hat ihn nicht als offenen Punkt gekennzeichnet. Das ist für die laufende Arbeit unschädlich.
