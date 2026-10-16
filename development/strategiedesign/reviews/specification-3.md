# Prüfbericht Spezifikation, Durchlauf 3 (Nachprüfung nach Einwand des Auftraggebers)

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Nachprüfung der Spezifikation nach `revise`
- Rolle: QA
- Prüfauftrag: `development/strategiedesign/reviews/specification-3-order.md` auf `main`
- geprüfter Commit: `d90f994cb15a717786b5fefacad041ec004e28a7`
- Vergleichsstand: `2d2f96839f9b066706fb518aedfe43279225fb28`
- gelesen im Stand `873b789d1357978e42a4e02f93bc6acd79f60a91` (`origin/main`). Zwischen dem geprüften Commit und diesem Stand kam nur der Prüfauftrag hinzu (`git diff --stat d90f994 873b789`: nur `reviews/specification-3-order.md`).

## Ergebnis

**bestanden.**

- Der Einwand zu Festlegung 4 ist umgesetzt: für Indikator und Trend vollständig und wörtlich; für den Hauptablauf in der Sache. Die Abweichung im Wortlaut beim Hauptablauf steht in Hinweis S23.
- Die geänderten Stellen enthalten keinen neuen blockierenden Befund.
- Beide Testfälle lassen sich weiterhin vollständig gestalten, speichern und laden. Sie bleiben ohne Fehler der Konsistenzprüfung.
- Neue Hinweise: 5 (S23 bis S27). Sie verhindern das Bestehen nicht.

## 1. Geprüfte Unterlagen

- `development/strategiedesign/specification.md`, Änderungen nach `git diff 2d2f968 d90f994`: Abschnitt „Status“ (Zeile 10), Abschnitt 3.4 (Zeilen 114, 121 bis 123, 139, 141 bis 149), Abschnitt 3.6 (Zeilen 213, 214), Abschnitt 10 Punkt 4 (Zeile 341). Zeilenangaben nach dem geprüften Stand.
- zum Abgleich unverändert: Abschnitt 3.3 (Namensräume), Abschnitt 3.5 (Ausdruck „Risiko je Trade“ und Zeile „Schließorder“), Abschnitt 6 (Testfälle)
- `development/strategiedesign/presentations/specification-1.html`, Folie Festlegung 4 (Zeile 218) und „Vermerk der Bestätigung“ (Zeile 272)
- `development/strategiedesign/scope.md`
- Fachmodell req-fach-013a, req-fach-016, req-fach-032, req-fach-034 bis req-fach-046, req-fach-049a, req-fach-051
- Anforderungen Strategiedesigner req-ui-012
- `development/strategiedesign/reviews/requirements-7.md` (H23, H24), `development/strategiedesign/reviews/specification-2.md`

## 2. Umsetzung des Einwands (Prüfpunkt 1)

Wortlaut des Einwands (Präsentation, Zeile 272): Eine Regel, deren Ausdruck `Order` oder `Position` anspricht, darf nur stehen, wo eine Order vorhanden ist: am Element „Order aufgeben“, in dessen Verwaltung oder als Regel der Strategie. In einem Indikator, einem Trend oder im Hauptablauf ist schon das Einfügen ein Fehler der Konsistenzprüfung, nicht erst die Verwendung des Ergebnisses. Der Fall „Regel wird nicht angewendet“ entfällt.

| Teil des Einwands | Stelle in der Spezifikation | Ergebnis |
|---|---|---|
| zulässige Orte: Strategie, „Order aufgeben“, dessen Verwaltung | 3.4, Zeile 143; 10 Punkt 4, Zeile 341 | umgesetzt |
| Indikator, Trend: schon das Einfügen ist ein Fehler | 3.4, Zeilen 139 und 145 („gleich ob ein Ausdruck ihr Ergebnis verwendet“, für Vorlage und jede Instanz, auch in einem Regelwerk); 3.6, Zeile 214 | umgesetzt |
| auch über das Ergebnis einer anderen Regel | 3.4, Zeile 143 („selbst oder über das Ergebnis einer anderen Regel“) | umgesetzt |
| Hauptablauf: schon das Einfügen ist ein Fehler | 3.4, Zeile 146; 10 Punkt 4 | in der Sache umgesetzt, im Wortlaut abweichend, siehe S23 |
| Fall „Regel wird nicht angewendet“ entfällt | 3.4, Zeilen 121 und 149; 10 Punkt 4 | umgesetzt für den Fall „keine Order vorhanden“. Der Fall nach req-fach-046 (Ordertyp hat die Eigenschaft nicht) bleibt, siehe S23 |
| Vorlage einer Regel darf `Order` und `Position` ansprechen | 3.4, Zeile 141 | folgt aus dem Einwand: Erst der Ort des Einfügens ist ein Fehler |

Zum Hauptablauf: Im Hauptablauf gibt es keinen Ort, an dem eine solche Regel eingefügt werden kann, außer den vom Auftraggeber zugelassenen. Das ergibt sich so:

- Nach req-ui-012 stehen Regeln nicht auf der Zeichenfläche. Sie werden der Strategie oder den Elementen „Order aufgeben“, „Order ändern“, „Position ändern“ und „Position schließen“ zugeordnet.
- Die Strategie und „Order aufgeben“ hat der Auftraggeber zugelassen.
- Die übrigen drei Elemente sind im Hauptablauf schon selbst ein Fehler (req-fach-049a; Spezifikation 3.6, Zeile 216).
- Die Regeln eines Elements sind nur in den Ausdrücken der Regeln dieses Elements ansprechbar (3.3, Zeile 100).

Ein Ausdruck des Hauptablaufs kann also nur das Ergebnis einer Regel der Strategie verwenden. Genau diesen Fall meldet die Spezifikation als Fehler (3.4, Zeile 146; 3.6, Zeile 213).

## 3. Neue Fehler an den geänderten Stellen (Prüfpunkt 2)

Kein blockierender Befund. Geprüft:

- **Abschnitt 3.5, Zeile „Schließorder“ (Zeile 195):** Die Regel wird auf die `CloseOrder` angewendet. `Position` ist dann „nicht verfügbar“, aber nicht vom Ordertyp. `ISNA(Position.Volumen)` fängt das ab. Danach ist `Order.Richtung` „nicht verfügbar“, weil der Ordertyp die Eigenschaft nicht hat. Damit ist das Ergebnis „nicht verfügbar“ und vom Ordertyp. Nach Zeile 121 wird die Regel nicht angewendet. Das stimmt mit Zeile 195, req-fach-046 und req-core-002 überein („Für eine Schließorder gilt sie nicht“). Voraussetzung ist, dass der Vermerk zur Herkunft durch die Rechnung weitergegeben wird. Das steht nicht ausdrücklich da, siehe S24.
- **req-fach-046:** Der Satz „Eine Regel, die eine Eigenschaft voraussetzt, die der Ordertyp nicht hat, wird auf diese Order nicht angewendet, ohne Fehler oder Meldung“ ist in Zeile 121 erhalten. Kein Widerspruch.
- **req-fach-051:** Verwendung von `Order` und `Position` im Ablauf außerhalb einer Verwaltung ist weiter ein Fehler, jetzt auch über das Ergebnis einer Regel (Zeile 213). Das widerspricht req-fach-051 nicht. In einer Regel bezeichnen `Order` und `Position` weiter die Order oder Position, auf die die Regel angewendet wird (Zeile 136).
- **req-ui-012:** Die zulässigen Orte nach dem Einwand passen zu den Elementen mit Regeln nach req-ui-012. Zeile 146 verweist richtig auf req-ui-012 und auf Abschnitt 3.6.
- **Typprüfung, Tabelle 3.4 (Zeilen 134 bis 139):** Die neue Zeile 139 widerspricht den übrigen Zeilen nicht.
- **Wirkungstabelle (Zeilen 121 bis 123):** Die drei Zeilen decken zusammen jedes Ergebnis „nicht verfügbar“ einer Regel ab. Einen Fall ohne Wirkung gibt es nicht.

## 4. Testfälle (Prüfpunkt 3)

| Testfall | gestalten | speichern, laden | Fehler der Konsistenzprüfung an den geänderten Stellen |
|---|---|---|---|
| `str-01` | ja | ja | keiner |
| `str-03` | ja | ja | keiner |

Begründung (Spezifikation Abschnitt 6):

- `risiko` aus „Risiko je Trade“ ist Regel der Strategie. Dieser Ort ist zulässig (Zeile 143). Die Vorlage darf `Order` und `Position` ansprechen (Zeile 141).
- `mindestvolumen` ist Regel des Elements „Order aufgeben“ im Hauptablauf. Auch dieser Ort ist zulässig. Die Regel spricht `Position` nicht an.
- Kein Indikator und kein Trend der Testfälle enthält eine Regel: `Markttechnik`, `EMA` und `ATR` sind mitgeliefert und enthalten keine.
- Kein Ausdruck im Hauptablauf verwendet ein Regelergebnis. Die neue Zeile 213 trifft deshalb nicht zu.
- `Order` und `Position` stehen sonst nur in Ausdrücken der Verwaltung.
- Ausführung, nur zur Kontrolle der Bedeutung:
  - `risiko` bei „Order ändern“ (`str-01`): `Position` ist „nicht verfügbar“, `ISNA` fängt das ab.
  - `risiko` bei „Position ändern“ (`str-03`): Die Regel wird auf die Position angewendet.
  - `risiko` bei „Position schließen“ (`str-03`): Die Regel wird nicht angewendet, wie in Abschnitt 3 dieses Berichts.

## 5. Neue Befunde

Keine.

## 6. Neue Hinweise (nicht blockierend)

### S23 – Einwand beim Hauptablauf und beim Satz „entfällt“ ausgelegt; das muss bei der erneuten Vorlage sichtbar sein

- Fundstelle: Spezifikation 10 Punkt 4 (Zeile 341: „im Hauptablauf … ist es die Verwendung ihres Ergebnisses in einem Ausdruck“; „Nicht angewendet wird eine Regel nur nach req-fach-046“), 3.4 Zeilen 146 und 149. Dagegen der Vermerk (Präsentation, Zeile 272): „In einem Indikator, einem Trend oder im Hauptablauf ist bereits das Einfügen der Regel ein Fehler …, nicht erst die Verwendung ihres Ergebnisses; der Fall ‚Regel wird nicht angewendet‘ entfällt.“
- Sachverhalt:
  - Hauptablauf: Die Spezifikation sagt für den Hauptablauf ausdrücklich das, was der Einwand verneint, nämlich dass die Verwendung des Ergebnisses der Fehler ist. In der Sache ist das richtig (Abschnitt 2 dieses Berichts): Im Hauptablauf gibt es keinen Ort, an dem man eine solche Regel einfügen kann. Ein Ausdruck dort kann nur eine Regel der Strategie ansprechen, und die hat der Auftraggeber zugelassen. Die Spezifikation begründet das nur knapp mit „wo eine Regel sonst nur an ‚Order aufgeben‘ steht“.
  - „entfällt“: Der Einwand nennt den Fall „Regel wird nicht angewendet“ ohne Einschränkung. Die Spezifikation liest das eng, als „weil es keine Order gibt“. Den Fall nach req-fach-046 behält sie. Das ist eine Anforderung des Auftraggebers und Grundlage der Zeile „Schließorder“ (3.5). Er muss deshalb bleiben.
  - Nebenpunkt, unverändert: Abschnitt 5.2, „Objekt verwenden“, lässt das Ziehen eines „Objekttyps oder einer Vorlage“ auf die Zeichenfläche zu. Für Regel und Regelwerk ist das nicht ausgenommen. req-ui-012 schließt es aus. Ließe die Oberfläche das zu, gäbe es doch einen Ort zum Einfügen im Hauptablauf.
- Kritikpunkt: Der Wortlaut von Festlegung 4 weicht an zwei Stellen vom Wortlaut des Einwands ab. Die Begründung dafür steht nicht in Festlegung 4.
- Frage: Ist der Auftraggeber mit beiden Auslegungen einverstanden? Erstens: Im Hauptablauf ist es die Verwendung des Ergebnisses einer Regel der Strategie, weil es dort keinen anderen Ort zum Einfügen gibt. Zweitens: „entfällt“ meint nur den Fall ohne Order, nicht den Fall nach req-fach-046. Das sollte bei der erneuten Vorlage von Festlegung 4 ausdrücklich gefragt werden.

### S24 – Vermerk „vom Ordertyp“: Weitergabe und gemischte Herkunft nicht festgelegt

- Fundstelle: Spezifikation 3.4, Zeile 114 („Die Auswertung vermerkt bei ‚nicht verfügbar‘, ob er von einer Eigenschaft stammt, die der Ordertyp nicht hat.“), Zeilen 121 bis 123
- Sachverhalt: Die Wirkung einer Regel hängt jetzt an der Herkunft von „nicht verfügbar“. Vom Ordertyp heißt: nicht angewendet. Sonst heißt es: nicht bestimmbar beziehungsweise nicht erfüllt. Offen ist dreierlei:
  - ob der Vermerk durch Rechnungen, durch `IF` und durch das Ergebnis einer anderen Regel weitergegeben wird. Die Zeile „Schließorder“ (3.5) braucht das: `Order.Richtung` steht dort in der Bedingung eines `IF` und im Teilausdruck `A_Order`.
  - welche Herkunft gilt, wenn zwei Werte „nicht verfügbar“ verschiedener Herkunft zusammentreffen, etwa `Position.Volumen + Order.Limitpreis` bei einer Stop-Order.
  - ob die Herkunft „vom Ordertyp“ auch gilt, wenn eine Regel auf eine Position angewendet wird und `Order` die Order ist, aus der die Position entstand.
  
  Die Antwort entscheidet bei der Ausführung, ob eine Order gestellt beziehungsweise eine Position geschlossen wird. Nach Abschnitt 1 (req-system-004) muss die Bedeutung so festgelegt sein, dass Strategietester und Handelssystem sie ohne Änderung des Strategiedokuments ausführen. Für Gestaltung, Speichern und Laden der Testfälle ohne Bedeutung.
- Frage: Wird der Vermerk durch Rechnung, Fallunterscheidung und Regelergebnisse weitergegeben? Welche Herkunft gilt bei gemischter Herkunft?

### S25 – „In der Verwaltung sieht die Regel die Order und Position der Verwaltung“ neben „Eine Regel, die auf eine Order angewendet wird, findet dort keine Position vor“

- Fundstelle: Spezifikation 10 Punkt 4 (Zeile 341, beide Sätze), 3.4 Zeilen 114 und 147; Fachmodell req-fach-016 (Teilausführung: „gleichzeitig eine Position und ein noch offener Rest der Order“)
- Sachverhalt: Punkt 4 stellt jetzt beide Sätze nebeneinander. Bei „Order ändern“ in einer Verwaltung nach einer Teilausführung gibt es eine Position der Verwaltung. Die Regel wird aber auf die Order angewendet. Nach dem einen Satz sieht sie die Position, nach dem anderen ist `Position` „nicht verfügbar“. Für „Risiko je Trade“ führt das zu verschiedenen Zweigen des Ausdrucks. Aus Zeile 141 ergibt sich, dass Zeile 147 Regeln meint, deren Ergebnis ein Ausdruck der Verwaltung verwendet. Der Text von Punkt 4 sagt das nicht. Die Testfälle sind nicht betroffen.
- Frage: Gilt „sieht die Order und Position der Verwaltung“ nur für Regeln, deren Ergebnis ein Ausdruck der Verwaltung verwendet, und nicht für Regeln, die bei einem Element der Verwaltung auf die Order angewendet werden?

### S26 – Neue Einschränkung steht nur in Präsentation und Spezifikation, nicht im Fachmodell

- Fundstelle: Spezifikation 3.6, Zeile 214 (Grundlage „req-fach-051, Entscheidung des Auftraggebers am 2026-10-16“), 3.4 Zeile 143; Fachmodell req-fach-013a („Ein Indikator kann aus … Regeln … bestehen“), req-fach-034 („von Elementen und anderen Objekten verwendet werden können“), req-fach-051
- Sachverhalt: Der Einwand schränkt ein, wo eine Regel stehen darf. Weder req-fach-051 noch ein anderes Dokument des Auftraggebers enthält diese Einschränkung. Sie steht nur im Vermerk der Präsentation und in der Spezifikation. Ein Widerspruch zu einer Anforderung besteht nicht. req-fach-013a und req-fach-034 schließen die Einschränkung nicht aus, und der Auftraggeber hat sie selbst entschieden. Nach `entwicklungsverfahren.md`, Phase 1, „Rückkopplung“, gehen geänderte Anforderungen aus späteren Phasen in die Dokumente des Auftraggebers zurück. Die Grundlage „req-fach-051“ in Zeile 214 trägt die Zeile nicht allein.
- Frage an den Projektleiter: Soll die Entscheidung in das Fachmodell (req-fach-051 oder req-fach-034) übernommen werden, damit die Konsistenzprüfung eine Grundlage in den Dokumenten des Auftraggebers hat?

### S27 – Zusammenhang der Typprüfung für die Vorlage einer Regel nicht genannt

- Fundstelle: Spezifikation 3.4, Zeile 141 („Die Vorlage einer Regel oder eines Regelwerks darf `Order` und `Position` ansprechen.“), Tabelle Zeilen 134 bis 139
- Sachverhalt: Die Tabelle nennt den Zusammenhang „Regel der Strategie oder eines Elements“. Die Vorlage einer Regel, die für sich gespeichert und geprüft wird (req-ablauf-007), ist keine davon. Der neue Satz erlaubt `Order` und `Position`. Er sagt nicht, ob dafür die Eigenschaften aller Ordertypen gelten wie in Zeile 136. Für die mitgelieferte Vorlage „Risiko je Trade“ ohne Bedeutung, weil sie aus der Bibliothek kommt. Bei einer eigenen Vorlage entscheidet die Antwort, ob `Order.Limitpreis` bekannt ist. Das gehört in den Auftrag zur Typprüfung.
- Frage: Gilt für die Vorlage einer Regel oder eines Regelwerks der Zusammenhang der Zeile „Regel der Strategie oder eines Elements“?

## 7. Zusammenfassung

| Punkt | Ergebnis | blockierend |
|---|---|---|
| Einwand zu Festlegung 4 umgesetzt | ja; für den Hauptablauf in der Sache, der abweichende Wortlaut steht in S23 | nein |
| neue Fehler an den geänderten Stellen | keine | – |
| Widerspruch zu 3.5 „Schließorder“, req-fach-046, req-fach-051, req-ui-012 | keiner | – |
| `str-01`, `str-03` gestalten, speichern, laden, ohne Fehler | ja | – |
| neue Befunde | 0 | – |
| neue Hinweise | 5 (S23 bis S27) | nein |

Die Nachprüfung ist bestanden. S23 sollte bei der erneuten Vorlage von Festlegung 4 dem Auftraggeber gezeigt werden. Die übrigen Hinweise werden nach „Umfang der Prüfungen“ bei der nächsten passenden Gelegenheit erledigt oder verworfen. S24 und S25 betreffen die Ausführung und spätestens die Aufträge zur Bedeutung von „nicht verfügbar“. S26 betrifft die Dokumente des Auftraggebers.
