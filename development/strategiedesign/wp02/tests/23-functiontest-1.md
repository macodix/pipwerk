# Testbericht Auftrag 23, Durchlauf 1

- Vorhaben `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- geprüfter Commit: `9b2855269ae3e9936f77e5eb59f9a4bcee476d94` (Zweig `strategiedesign/wp02-23`, Vorgänger `d90b73f878fd88fef3319aacc9967fad98d71d8a`), im Arbeitsverzeichnis mit `rev-parse HEAD` bestätigt
- Art: erste Prüfung (keine Nachprüfung)
- Grundlage: Auftrag 23, Prüfauftrag `tests/23-1-order.md`, Testregeln Abschnitt 7

## Ergebnisse der automatischen Tests

| Prüfung | Ergebnis |
|---|---|
| `packages/domain-core`: pytest | 1808 bestanden, Exitcode 0 |
| `packages/domain-core`: ruff check, ruff format --check, mypy (`src tests`) | ohne Befund (81 Dateien formatiert, 80 Quelldateien typgeprüft) |
| Backend: pytest | 1050 bestanden (185 s), Exitcode 0 |
| Backend: ruff check, ruff format --check, mypy (`src tests`) | ohne Befund (61 Dateien) |
| Frontend: `tsc --noEmit` (typecheck) | ohne Befund |
| Frontend: Vitest | 56 Dateien, 717 Tests bestanden |
| Dateimodus `check`, `testenv` im Commit | beide `100755` |
| Prüfskript `check` mit Browsertests | wie im Prüfauftrag nicht wiederholt |

## Geprüftes Verhalten

1. **Festgelegter Wert des Parameters `Instrument`**: `typedesc.INSTRUMENT_CHOICES[0]` hat die Beschriftung „Voreingestelltes Instrument aus Strategie“ / „Default instrument from strategy“. Die Kennung `instrument_der_anwendung` (`APPLICATION_INSTRUMENT`) ist unverändert. Das gilt für den Parameter (zum Beispiel `EMA`) und für die Eigenschaft der Order (`MarketOrder`). Die Tests `test_visible_words`, `test_catalog`, `test_datatype_labels` und `test_web_api_element_types` prüfen es, auch über die Antwort von `GET /api/v1/element-types`. Der Weg zurück zur Vorbelegung bleibt ein gültiges Dokument ohne Befund (`test_datatype_labels`). Gespeicherte Strategien, Vorlagen, Beispiele und Testfälle öffnen weiter, denn die Kennung blieb gleich. Die Suiten für Dokumente, Beispiele und Testfälle laufen in den 1808 und 1050 bestandenen Tests mit.
2. **Kennung `ausdruck`**: Sie bleibt (`catalog.EXPRESSION_PARAMETER`) und die Beschriftung lautet „Formel“ / „Formula“. Das ist begründet, weil gespeicherte Dokumente die Kennung tragen. Der Entwickler hat dafür `test_identifiers_follow_the_formation_rule` bewusst um genau zwei Ausnahmen erweitert (`ausdruck` und `instrument_der_anwendung`), im Docstring und in der Dokumentation (`pipwerk-domain.md`) begründet. Ich bewerte das nicht als Abschwächung, da die Bildungsregel sonst weiter für alle anderen Kennungen gilt.
3. **Verbotene Wörter**: `test_no_visible_text_contains_an_excluded_word` läuft über 700+ Beschriftungen aller Typen des Registers, die Wörter der Datentypen und Arten, die mitgelieferten Vorlagen, die Funktionen und die Feldbeschriftungen der Befunde. Es prüft „Ausdruck“, „Ausdrück“, „Objekttyp“, „Objekt(e) der Anwendung“, „Einstellungen des Objekts“, „(ohne Name)“ sowie englisch „expression(s)“, „object type(s)“, „object(s) of the application“, „settings of the object“, „(no name)“. Es gibt keine Ausnahmen bei den Texten. Das Backend prüft dasselbe an der Antwort der Web-API. Ein Treffer in `git grep` gibt es nur in Docstrings und Kommentaren (`engine.py` Zeile 1882, `typedesc.py` Zeile 90), also in keinem sichtbaren Text. Grammatik der geänderten Sätze: „Formel“ als Beschriftung und im Satz „Berechnungsverfahren ‚Formel‘“ ist in Artikel und Fall richtig. Das ist stichprobenhaft am Wortlaut der Tests und der Dokumentation gelesen, nicht über jeden Satz des Katalogs.
4. **`category_label`**: `CATEGORY_LABELS` liefert Indikator / indicator, Trend / trend, Regel / rule, Regelwerk / rule set. `category_label(None)` gibt `None` (also `null` ohne Art). Der Contract `contracts/api/pipwerk-studio/v1/openapi.json` enthält das Feld (anyOf LabelModel/null) und es ist Pflichtfeld in `TypeDescriptionModel`. `test_frontend_type_copy.py` bestätigt, dass `frontend/src/testing/element-types.json` der Antwort gleicht (bestanden). Die Herkunft „Indikator EMA“ ist im Test gebildet. Die Dokumentation beschreibt den Weg, „EMA 20 – Indikator EMA“ zu bilden.
5. **„Hauptablauf“**: `typedesc.MAIN_FLOW_EXPLANATION` lautet deutsch „Der Hauptablauf ist der Ablauf der Strategie ab ihren Auslösern, ohne die Schritte in den Order- und Positionsverwaltungen.“ und englisch „The main flow is the flow of the strategy from its triggers, without the steps inside the order and position managements.“, wortgleich zum Prüfauftrag. Im Katalog nennt nur `trigger.manual` das Wort, in Beschreibung und Erklärung. Jeder der vier Texte endet mit dem Satz, und er steht in jedem genau einmal (Test `test_every_text_with_the_main_flow_...` und Backend-Gegenstück). `describe.py` liefert keine Sätze; das ist nach Auftrag 25 nicht Teil dieses Auftrags.
6. **Geänderte bestehende Tests**: Es sind nur Wortlaute geändert (`Ausdruck` → `Formel`, `Expression` → `Formula`, alte → neue Beschriftung des festgelegten Werts) in `test_catalog.py`, `test_datatype_labels.py`, `test_finding_names.py` und `test_web_api_finding_names.py`. Keine Zusicherung entfällt. Die einzige inhaltliche Änderung ist die unter Punkt 2 genannte Ausnahme der Bildungsregel.
7. **Feste Pfade, Ports, Rechnernamen**: Die hinzugefügten Zeilen der Python-Dateien enthalten keine (`grep` ohne Treffer).
8. **Dokumentation**: `pipwerk-domain.md` hat den neuen Abschnitt „Wörter der sichtbaren Texte“, die Zeile `category_label`, die neue Beschriftung in 3.2, der Tabellen und der Befundfelder. `pipwerk-studio.md` ist nachgezogen. Beides passt zum Code (Namen `CATEGORY_LABELS`, `category_label`, `MAIN_FLOW_EXPLANATION`, `EXPRESSION_PARAMETER`, `APPLICATION_INSTRUMENT`, `test_visible_words.py` stimmen).

## Grenzfälle

- Typ ohne Art: `category_label` ist `null` (geprüft).
- Alle vier Arten kommen im Katalog vor (`test_each_object_type_of_the_catalog_names_its_kind`).
- Die Abnahme „kein Text ‚(ohne Name)‘“ ist nur ein Negativtest: Die Bibliothek liefert keinen Text für ein Element ohne Namen; „(noch ohne Name)“ wird daher nicht positiv geprüft und kann es auch nicht, solange es keinen solchen Text gibt.

## Befunde

Keine blockierenden Befunde.

Hinweise, nicht blockierend:
- Die Dokumentation `pipwerk-studio.md` nennt an anderer Stelle weiterhin „Ausdruck“ und „Objekte der Anwendung“ als Fachbegriffe; es sind keine sichtbaren Texte der Bibliothek. Die Anwenderdokumentation ist laut Auftrag Sache von Auftrag 25.
- Die Begriffe „Handelsdaten“ und „Einstellungen von „<Name>““ sind in keinem Test positiv geprüft, nur die alten Wörter sind ausgeschlossen. Im Katalog gab es keine Treffer der alten Wörter, so dass der Auftrag keine Ersetzung verlangt.

## Ergebnis

Geprüfter Commit `9b2855269ae3e9936f77e5eb59f9a4bcee476d94`: **bestanden**.
