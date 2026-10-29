# Prüfbericht Spezifikation, Durchlauf 16

- Vorhaben: `strategiedesign`, ref `strategiedesign/wp02`, Phase 4 (Prüfung des Entwurfs), QA
- geprüfter Commit: `4f04ed5c43406f7a00f94dadcbcba6e9275c2de1` (`origin/main`)
- Gegenstand: `git diff 9e9e6ca79582cdb25e0eeff7d6e99be300202e9e 4f04ed5c43406f7a00f94dadcbcba6e9275c2de1 -- development/strategiedesign/specification.md`
- Technische Dokumentation und Vertrag gelesen auf `origin/strategiedesign/wp02` (`docs/technical/pipwerk-studio.md` 5.2.2 bis 5.2.5, `contracts/api/pipwerk-studio/v1/openapi.json`).

## Ergebnis: bestanden

Keine blockierenden Befunde.

## Antworten zu den vier Fragen

1. **E2 gegen 3.3, 3.4, 5:** Kein Widerspruch. 3.3 legt fest, dass die Bibliothek Kennungen aus dem ersten Namen bildet, das Element der ersten Verwendung und die Verwendbarkeit bestimmt (Wegregel) und beim Einfügen Namen und Kennungen des Inhalts bildet und die Ausdrücke umschreibt. 3.4 legt das Entfernen mit leerem Platz in der Bibliothek fest. Abschnitt 5 verlangt von der Oberfläche nur, dass sie Rückfrage, Liste und Anzeige zeigt (5.4: Entfernen mit Rückfrage; 5.3/5.4: nur verwendbare Instanzen zur Wahl). Das stützt E2.
2. **Endpunkte in 4.2 gegen 3.3, 3.4 und Technik:** Der Zweck passt.
   - `keys`: 3.3 „Bildung der Kennungen“. 5.2.2 und OpenAPI nennen dasselbe (Name, Stelle als JSON-Zeiger, eindeutig im gemeinsamen Namensraum).
   - `usage`: 3.3 „Element der ersten Verwendung“, Verwendbarkeit. 5.2.3 liefert `first_use`, `usable_at`, `usable_everywhere` und je Element die Verwendungen. Eine Vorlage ergibt `422` (nur Strategie), wie 4.2 „zu einer Strategie“ sagt.
   - `insert`: 3.3 „Namensvorschlag beim Einfügen“ (`<Name der Instanz> <bisheriger Name>`, Zahl bei Vergabe, Umschreiben der Ausdrücke). 5.2.4 beschreibt dasselbe, ohne Speichern.
   - `removals`: 3.4 „Entfernen“. 5.2.5 hat Anfrage ohne `apply` für die Rückfrage und mit `apply` für den leeren Platz.
   - Der Satz „speichern nichts“ stimmt mit 5.2.3 bis 5.2.5 überein.
3. **E8 gegen `strategiedesign-04.md`:** Kein Widerspruch. Die Antwort des Projektleiters sagt, der Prototyp sei „nur Hilfsmittel für Spezifikation und Umsetzung, keine bestätigte Vorlage“. Ein Verbot, Code zu übernehmen, steht dort und in `scope.md` nicht. Das Verbot „sein Code wird nicht übernommen“ stand bisher nur in E8 selbst. Die Neufassung behält „keine bestätigte Vorlage“ und bindet die Übernahme an E2 und an die Prüfung wie bei jedem Code.
4. **Anforderung, Abnahmekriterium, Umfang:** Die Ergänzung ändert keine davon. `plan.md` Abschnitt `wp02` (Ziel, Kriterien) bleibt unberührt. In der Zuordnungstabelle gehört 4.2 ganz zu `wp01`/`wp02`, E2 und E8 zu `wp02`; die neuen Endpunkte liegen damit schon im Umfang von `wp02`. Der Änderungsnachweis vom 2026-10-29 sagt dasselbe.

## Hinweise (kein Einfluss auf das Bestehen)

1. `docs/technical/pipwerk-studio.md` Abschnitt 2.3 (Zeile 80) nennt den Prototyp noch „bestätigt“; das widerspricht E8 und der Antwort in `strategiedesign-04.md`. `wp02/conformance-1.md` führt es als K2, es ist nicht Gegenstand dieses Durchlaufs.
2. 4.2 und 5.4 sagen „Objekt“ beziehungsweise „Element“; `removals` nimmt als `kind` `element`, `strategy_parameter` oder `rule`. Eine Bedingung oder Berechnung ist ein Element. Das Wort „Objekt“ in 3.4 und 5.4 ist für Leser ohne 5.2.5 nicht eindeutig.
3. E8 hält mit „Übernommen ist er in `wp02` für die Anordnung und das Erscheinungsbild“ einen Stand des Arbeitspakets fest. Das ist keine Festlegung der Spezifikation und könnte nach `wp02` veralten.
4. Der Absatz „bisherige Prüfungen und Abstimmung“ im Status der Spezifikation nennt diesen Durchlauf noch nicht (nur der Änderungsnachweis).
