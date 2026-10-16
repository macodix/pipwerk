# Prüfbericht Spezifikation, Durchlauf 1

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Prüfung der Spezifikation
- Rolle: QA
- geprüfter Commit: `f48d259fa257f5c1fb83f172f0e1cef44134319a` (bei Beginn der Prüfung zugleich Stand von `origin/main`)
- Prüfauftrag: `work/strategiedesign/architect/development/strategiedesign/reviews/specification-1-order.md`
- Gegenstand: `development/strategiedesign/specification.md`

## Ergebnis

**nicht bestanden**

Es gibt vier blockierende Befunde (B1 bis B4) und fünfzehn Hinweise (S1 bis S15).

- B1: Die Regelvorlage „Risiko je Trade“ erfüllt req-core-002 nicht in allen Fällen. Beim Nachziehen des Stop-Loss über den Einstiegspreis hinaus (`str-03`) lehnt sie Änderungen ab, und beim Stop-Loss auf dem Einstiegspreis teilt sie durch null.
- B2: Die Spezifikation legt nicht fest, was ein Fehler oder „leer“ in einer Bedingung, Berechnung oder Belegung bei der Ausführung bewirkt. `str-01` trifft diesen Fall in einer gewöhnlichen Marktlage.
- B3: Die Spezifikation entscheidet zu req-fach-012 gegen den Wortlaut des Fachmodells und nennt das in Abschnitt 10 nicht.
- B4: Ein Indikator aus Regeln (req-fach-013a) ist nicht abbildbar.

Beide Testfälle lassen sich mit den spezifizierten Typen und Abläufen gestalten, speichern und wieder laden. Unter den Bedingungen in S7 meldet die Konsistenzprüfung keinen Fehler (Abschnitt 4 unten). B1 und B2 betreffen die Bedeutung bei der späteren Ausführung. Diese Bedeutung legt die Spezifikation nach ihrem Abschnitt 1 ausdrücklich fest (req-system-004).

Blockierend heißt nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Der Befund widerspricht einer Anforderung oder einem Abnahmekriterium, beeinträchtigt die Funktion oder ist eine Sicherheitslücke. Alles andere ist ein Hinweis und verhindert das Bestehen nicht. Dies ist der erste Durchlauf. Der Bericht meldet alle Befunde.

## 1. Geprüfte Unterlagen

- `development/strategiedesign/specification.md`, `development/strategiedesign/scope.md`
- `docs/design/requirements/anforderungen-gesamtsystem.md`, `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/domain/fachmodell.md`, `docs/design/domain/indikator-markttechnik.md`
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md`, `docs/design/strategies/str-03-fachlich-ema-trendfolge.md`
- `development/strategiedesign/reviews/requirements-6-response.md`, `development/strategiedesign/reviews/requirements-7.md` (Hinweise H23, H24)
- Prüfgrundlagen: `docs/technical/entwicklungsverfahren.md` (Umfang der Prüfungen), `docs/technical/agentenrollen-und-briefings.md` (Briefing QA), `docs/technical/pipwerk-studio.md`, `docs/technical/development-test-security-rules.md`, `docs/technical/glossar.md`

Wie im Auftrag festgelegt, wurden nicht geprüft: die Ausführung von Strategien als solche, die in `scope.md` und in den Dokumenten als offen gekennzeichneten Punkte, die Vorlagen unter `docs/design/planning/`. Schreibweisen, Testdetails und vollständige Listen von Kennungen sind kein Befund.

---

## 2. Blockierende Befunde

### B1 – Regelvorlage „Risiko je Trade“: Betrag des Abstands und Division durch null

- Fundstelle: Spezifikation Abschnitt 3.5, Ausdruck der Regelvorlage (`ABS(IF(ISNA(Position.Volumen); …; Position.Einstiegspreis - Position.Stop_Loss))`) und Tabelle der Fälle, Zeile „Position ändern, Prüfung nach der Ausführung“. Anforderung: req-core-002 („Der Verlust vom Preis bis zum Stop-Loss darf höchstens die Risikogrenze betragen“), Fachmodell req-fach-049a, Testfall `str-03` Abschnitt 4.
- Sachverhalt: Der Ausdruck nimmt den Betrag des Abstands zwischen Preis und Stop-Loss als Verlust. Das gilt nur, solange der Stop-Loss auf der Verlustseite liegt. In `str-03` zieht „Position ändern“ den Stop-Loss einer Position laufend nach. Die Regel prüft dabei das Volumen der Position.
  - Beispiel Kauf: Einstiegspreis 1,1000, erster Stop-Loss 1,0950. Das Volumen V ist für einen Abstand von 50 Pips bestimmt.
  - Stop-Loss auf 1,1000 nachgezogen: Der Abstand ist 0. Der Ausdruck teilt durch null. Abschnitt 3.4 legt nur die Werte „nicht verfügbar“ und „leer“ fest. Was bei einer Division durch null gilt, steht nicht da.
  - Stop-Loss auf 1,1060 nachgezogen: `ABS(1,1000 - 1,1060)` ergibt 60 Pips. Das zulässige Volumen wird kleiner als V. Die Prüfung ist nicht erfüllt, „Position ändern“ nimmt `nicht geändert`. Der Stop-Loss bleibt stehen, obwohl die Position mit diesem Stop-Loss keinen Verlust mehr machen kann. Das höhere Kapital durch den offenen Gewinn gleicht das bei 1 % Risikogrenze erst ab etwa 1000 Pips Gewinn aus.
  - Fachlich ist der Verlust in beiden Fällen null. Nach req-core-002 ist die Bedingung erfüllt.
- Folge: Der Ausdruck widerspricht req-core-002 im Fall „Position ändern“. Das Nachziehen in `str-03` bleibt stehen. Prüfpunkt 4 des Auftrags ist nicht erfüllt.
- Frage: Wie bildet der Ausdruck einen Stop-Loss auf oder hinter dem Preis ab, also ohne möglichen Verlust, und was gilt bei einem Abstand von null?

### B2 – Bedeutung von Fehler und „leer“ außerhalb von Regeln nicht festgelegt

- Fundstelle: Spezifikation Abschnitt 1 („Die Spezifikation legt die Bedeutung von Ausdrücken und Regeln aber so fest, dass Strategietester und Handelssystem sie später ohne Änderung des Strategiedokuments ausführen können“), Abschnitt 3.4, Absatz „Werte, die fehlen“, dritter Punkt, Abschnitt 6 `str-01`. Anforderungen: req-system-004, Fachmodell req-fach-003, `indikator-markttechnik.md` Abschnitt 4 („`Phase` … nur bei Trendrichtung aufwärts oder abwärts belegt“, „die Punkte sind nicht belegt“).
- Sachverhalt: Abschnitt 3.4 sagt: Rechnung und Vergleich mit „leer“ sind ein Fehler. Die Wirkung legt er nur für Regeln fest: Eine bestimmende Regel kann nicht bestimmen, eine prüfende ist nicht erfüllt. Für Bedingung, Berechnung, Belegung einer Eigenschaft der Order und Eigenschaften von Indikator und Trend steht keine Wirkung da. Das betrifft den Fehler durch „leer“, die Division durch null aus B1 und andere Fehlerwerte von OpenFormula.
  - `str-01`, erste Bedingung: `AND(mt_signal.trend_intakt; mt_signal.phase = "bewegung")`. Ohne Trend ist `phase` nicht belegt, also „leer“. Der Vergleich ist ein Fehler. `AND` wertet nach OpenFormula alle Argumente aus. Abschnitt 3.4 nimmt nur `IF` davon aus. Was die Bedingung dann tut (`falsch`, Abbruch der Auswertung, Meldung), ist offen.
  - `str-01`, Verwaltung: `Tick.Geld < mt_handel.punkt_13`. Fällt die Handelszeiteinheit auf „kein Trend“, ist `punkt_13` „leer“. Ob die Order dann gelöscht wird, ist offen.
  - Die Konsistenzprüfung meldet hier nichts, denn der Fall entsteht erst bei der Ausführung.
- Folge: Die Testfalldokumente, die jetzt entstehen, haben keine festgelegte Bedeutung in einer gewöhnlichen Marktlage. Ob sie später ohne Änderung ausführbar sind, wie Abschnitt 1 und req-system-004 verlangen, ist nicht entscheidbar.
- Frage: Was bewirkt ein Fehler oder ein „leer“ in einer Bedingung, einer Berechnung, einer Belegung der Order und einer Eigenschaft eines Indikators oder Trends? Ist das eine fachliche Festlegung, die in Abschnitt 10 zur Bestätigung gehört?

### B3 – Eigenschaften enthaltener Indikatoren: Entscheidung ohne Bestätigung

- Fundstelle: Spezifikation Abschnitt 3.3, letzter Satz („Eine Eigenschaft eines in einem Indikator oder Trend enthaltenen Indikators wird von außen nicht angesprochen, solange req-fach-012 das offen lässt.“), Abschnitt 10. Anforderung: Fachmodell req-fach-012 („Sie müssen jedoch über die Struktur des Trendobjekts für andere Elemente referenzierbar sein. … Wie eine Eigenschaft eines Indikators über den Trend angesprochen wird, ist noch nicht festgelegt.“).
- Sachverhalt: Offen ist im Fachmodell nur, *wie* die Eigenschaft angesprochen wird. *Dass* sie ansprechbar sein muss, ist festgelegt. Die Spezifikation legt fest, dass sie nicht ansprechbar ist. Abschnitt 10 nennt diese Festlegung nicht. Sie sagt außerdem, dass keine Entscheidung des Auftraggebers nötig ist. Eine eigene Eigenschaft des Trends als Ersatz widerspricht req-fach-012 ebenfalls („werden nicht zu Eigenschaften des Trends“). Die Testfälle sind nicht betroffen.
- Folge: Die Spezifikation widerspricht einer Festlegung des Fachmodells und trifft eine Entscheidung des Auftraggebers, ohne sie in Abschnitt 10 zur Bestätigung zu nennen (Prüfpunkt 2 des Auftrags).
- Frage: Setzt die Spezifikation req-fach-012 um, oder legt sie die Einschränkung dem Auftraggeber in Abschnitt 10 vor?

### B4 – Indikator aus Regeln nicht abbildbar

- Fundstelle: Spezifikation Abschnitt 3.3, Tabelle der Vorlagen, Zeile `Indikator` („eigene Parameter …, enthaltene Instanzen von Indikatoren, eigene Eigenschaften, jede mit Name, Datentyp und Ausdruck“). Anforderung: Fachmodell req-fach-013a („Ein Indikator kann aus fest programmierten Einheiten, aus Regeln oder aus einer Kombination von beidem bestehen.“), dazu req-fach-034 („von Elementen und anderen Objekten verwendet werden“), Strategiedesigner req-fach-009.
- Sachverhalt: Die Vorlage `Indikator` enthält Instanzen von Indikatoren und Ausdrücke. Regeln oder Regelwerke enthält sie nicht. Eine Regel ist im Fachmodell ein eigenes, wiederverwendbares Objekt mit Kennung, Bezeichnung, Parametern und Ausdruck (req-fach-035). Ein Ausdruck in einer eigenen Eigenschaft ist keine Regel. Er lässt sich nicht als Vorlage wiederverwenden. Abschnitt 3.4 nennt den Zusammenhang „Indikator“ für Ausdrücke, die Spezifikation sieht aber keine Regel in einem Indikator vor.
- Folge: Eine Fähigkeit, die req-fach-013a ausdrücklich nennt, ist nicht abgedeckt (Prüfpunkt 1 des Auftrags).
- Frage: Wie bildet die Spezifikation einen Indikator aus Regeln ab? Wenn sie das bewusst auslässt: Gehört das als Festlegung in Abschnitt 10?

---

## 3. Hinweise (nicht blockierend)

### S1 – Hinweis H24 nur für den Hauptablauf beantwortet

- Fundstelle: Spezifikation Abschnitt 3.4, Tabelle „Zusammenhang“ und letzter Absatz, Abschnitt 10 Punkt 4. Bezug: H24 aus `requirements-7.md`.
- Sachverhalt: Für den Hauptablauf ist festgelegt, dass das Ergebnis einer Regel mit `Order` oder `Position` ein Fehler ist. Nicht festgelegt ist:
  - welche Order und Position eine solche Regel sieht, wenn ein Ausdruck der Verwaltung ihr Ergebnis verwendet,
  - was `Position` in der Verwaltung bezeichnet, solange die Order noch wartet. `str-03` sichert das mit `Order.Status = "ausgefuehrt"` ab, aber die Konsistenzprüfung verlangt das nicht,
  - was gilt, wenn eine Regel das Ergebnis einer anderen Regel verwendet (req-fach-038).
- Frage: Was gilt in diesen drei Fällen?

### S2 – Inhalt einer Instanz einer eigenen Indikator- oder Trendvorlage

- Fundstelle: Spezifikation E4 („Instanzen sind vollständige Kopien“) gegen Abschnitt 3.3, Absatz „Instanz“ („Parameterwerte und bei Regel und Regelwerk den Inhalt“). Anforderungen: req-fach-013a, req-ablauf-006.
- Sachverhalt: Abschnitt 3.3 nennt für Instanzen von Indikatoren und Trends nur Parameterwerte. Eigene Eigenschaften, Ausdrücke und enthaltene Instanzen einer eigenen Vorlage fehlen. Wer nach Abschnitt 3.3 umsetzt, braucht zur Ausführung die Vorlage. Dann bricht das Löschen der Vorlage die Strategie. Das widerspricht E4 und req-ablauf-006.
- Kritikpunkt: E4 und Abschnitt 3.3 sagen Verschiedenes über den Inhalt einer Instanz.

### S3 – Namen in Ausdrücken von Indikator- und Trendvorlagen

- Fundstelle: Spezifikation Abschnitt 3.4, Punkt „Namen“, Abschnitt 3.1, Bindungsarten. Anforderungen: req-fach-009, req-fach-011 („Die Zeiteinheit ist eine Vorgabe des Trends und kann … die Parametrisierung … seiner Indikatoren beeinflussen“).
- Sachverhalt: Die Namen in einem Ausdruck sind: Objekte der Anwendung, Instanzen der Strategie, Bedingungen, Berechnungen, Regeln, Strategieparameter, Parameter einer Regel. Nicht genannt sind die eigenen Parameter einer Indikator- oder Trendvorlage und die darin enthaltenen Instanzen, etwa `ema20.Wert` im Ausdruck für `Richtung`. Ebenso fehlt eine Bindungsart, mit der eine enthaltene Instanz einen Parameter der Vorlage übernimmt, etwa die Zeiteinheit des Trends. Nach dem Wortlaut meldet die Konsistenzprüfung für jeden solchen Ausdruck „unbekannter Name“.
- Frage: Wie werden eigene Parameter und enthaltene Instanzen in Ausdrücken einer Vorlage angesprochen und gebunden?

### S4 – Parameter je Berechnungsverfahren des Trends

- Fundstelle: Spezifikation Abschnitt 3.1, Typbeschreibung, und Abschnitt 3.3, Zeile `Trend` („Weitere Verfahren melden sich im Elementregister an“). Anforderung: req-param-005 („Je nach gewähltem Verfahren zeigt die Eigenschaftenansicht die zugehörigen weiteren Parameter“).
- Sachverhalt: Die Typbeschreibung kennt keine Parameter, die von einem anderen Parameter abhängen. Offen ist auch, wie ein Berechnungsverfahren seine Parameter beschreibt. Mit dem einzigen mitgelieferten Verfahren „Ausdruck“ hindert das nichts.
- Frage: Wo beschreibt ein Berechnungsverfahren seine Parameter, sodass die Eigenschaftenansicht sie nach der Wahl zeigt?

### S5 – Bedienung beim Bearbeiten einer Vorlage

- Fundstelle: Spezifikation Abschnitt 5.1, Abschnitt 5.2, Zeilen „Objekt anlegen, öffnen, ändern“ und „Löschen“, Abschnitt 5.4. Anforderungen: req-ablauf-001 Punkt 2 und 3, req-ablauf-004, req-ablauf-007, req-ui-011.
- Sachverhalt: Eine Vorlage wird in der Eigenschaftenansicht bearbeitet. Nicht beschrieben ist:
  - was mit einer gleichzeitig offenen Strategie geschieht,
  - womit der Anwender die Vorlage speichert, prüft und schließt, und ob die Rückfrage bei ungespeicherten Änderungen gilt,
  - wo er eine Vorlage löscht,
  - wie er einer Indikator-, Trend- oder Regelwerksvorlage Instanzen hinzufügt,
  - wo Befunde einer Vorlage erscheinen, die nicht auf der Zeichenfläche liegt.
- Frage: Wie läuft die Bearbeitung einer Vorlage in der Oberfläche?

### S6 – Inhalt der Elementbibliothek

- Fundstelle: Spezifikation Abschnitt 5.1, Zeile „links“ („Elemente des Ablaufs, Objekttypen, mitgelieferte und gespeicherte Vorlagen“) gegen Abschnitt 3.1, Feld „Art“ (Auslöser und Objekt der Anwendung sind eigene Arten). Anforderungen: req-fach-015, req-ablauf-003.
- Sachverhalt: Auslöser und Objekte der Anwendung (Konto, Instrument, Kerze, Tick) stehen nicht in der Aufzählung der Elementbibliothek. Beide Testfälle brauchen weitere Auslöser in der Verwaltung. Nach E2 und dem Feld „auf Zeichenfläche“ ist wahrscheinlich gemeint, dass sie in der Bibliothek stehen.
- Kritikpunkt: Die Aufzählung in Abschnitt 5.1 ist enger als req-fach-015 und req-ablauf-003.

### S7 – Voraussetzungen für null Fehler bei den Testfällen

- Fundstelle: Spezifikation Abschnitt 3.1 (Eigenschaften der Ordertypen „ob der Anwender sie belegt“), Abschnitt 3.6, Zeile MUSS-Eigenschaft, Abschnitt 3.4, Abschnitt 6.
- Sachverhalt: Zwei Punkte entscheiden, ob die Konsistenzprüfung für die Testfälle wirklich keinen Fehler meldet. Die Spezifikation legt keinen davon fest:
  - `Instrument` und `Konto` sind MUSS-Eigenschaften der Order (req-fach-019, req-fach-028, req-fach-029). Abschnitt 6 belegt sie nicht. Sie sind nur dann kein Fehler, wenn der Anwender sie nicht belegt.
  - Die Richtung wird als Text belegt: `IF(…; "buy"; "sell")` und `richtung.Ergebnis`. Abschnitt 3.4 regelt Werte einer Auswahl nur für den Vergleich. Ob Text als Belegung einer Auswahl und als Ergebnis einer Berechnung zulässig ist oder „unpassender Typ“ ergibt, steht nicht da.
- Frage: Ist festgelegt, dass `Instrument` und `Konto` aus der Anwendung kommen und Text mit einer Kennung eine Auswahl belegen kann?

### S8 – Namen von Regeln in Regelwerken und Mehrfachverwendung

- Fundstelle: Spezifikation Abschnitt 3.6, Zeile „Name doppelt vergeben (… Regel)“, Abschnitt 3.3, Zeile `Regelwerk`. Anforderungen: Fachmodell req-fach-041 („Dieselbe Regel kann in mehreren Regelwerken verwendet werden“), req-fach-046 („Dieselbe Regel kann an beiden Stellen verwendet werden“), req-fach-045.
- Sachverhalt: Steht dasselbe Regelwerk an der Strategie und an einem Element, tragen die enthaltenen Regeln dieselben Namen. Nach Abschnitt 3.6 ist das ein Fehler. Offen ist auch, ob Regeln innerhalb eines Regelwerks einen eigenen Namensraum haben. Das braucht req-fach-045 für Bezüge innerhalb des Regelwerks.
- Frage: Wie werden Regeln in Regelwerken benannt und angesprochen, und ist dieselbe Regel an zwei Stellen ohne Umbenennung ein Fehler?

### S9 – Bindungsart „Regel“ und zugeordnete Regeln

- Fundstelle: Spezifikation Abschnitt 3.1, Bindungsarten („Regel (`bestimmen()`)“), Abschnitt 3.3, „Element“ (Belegung mit Bindungsart und zugeordnete Regeln). Anforderung: Fachmodell req-fach-046 (Reihenfolge: direkte Werte, Regeln der Strategie, Regeln der Elemente).
- Sachverhalt: Eine Eigenschaft der Order kann eine Regel über ihre Bindungsart erhalten oder über die zugeordneten Regeln des Elements. In welcher Reihenfolge eine über die Bindungsart gebundene Regel angewendet wird, steht nicht da.
- Frage: Sind das zwei Wege für dasselbe, und wo steht die gebundene Regel in der Reihenfolge nach req-fach-046?

### S10 – Prüfung der Rückführung schwächer als die Anforderung

- Fundstelle: Spezifikation Abschnitt 3.6, Zeile „Rückführung, auf deren Weg keine Bedingung liegt“. Anforderungen: req-ablauf-007 („Rückführung im Ablauf ohne Bedingung, die sie beendet“), Fachmodell req-fach-047.
- Sachverhalt: Eine Bedingung auf dem Weg, deren beide Ausgänge in die Rückführung führen, beendet sie nicht. Nach dem Wortlaut der Spezifikation meldet die Prüfung das nicht.
- Kritikpunkt: Die Prüfung verlangt eine Bedingung auf dem Weg, nicht eine Bedingung mit einem Ausgang aus der Rückführung.

### S11 – Verschieben des Objektverzeichnisses bei einem Fehler

- Fundstelle: Spezifikation Abschnitt 4.1, letzter Punkt. Anforderung: req-ablauf-009.
- Sachverhalt: Geregelt ist der Konflikt mit einer vorhandenen Datei. Nicht geregelt ist ein Fehler während des Verschiebens, zum Beispiel fehlende Schreibrechte nach der Hälfte der Dateien. Die Objekte lägen dann in zwei Verzeichnissen, und die Einstellung zeigt auf das alte. Ebenso offen ist, was mit einer gerade geöffneten Strategie geschieht.
- Frage: Was gilt bei einem Fehler während des Verschiebens und für eine offene Strategie?

### S12 – Bildungsregel der Kennungen und Beispiel `punkt_13`

- Fundstelle: Spezifikation Abschnitt 3.1, Absatz „Kennungen“ („jedes andere Zeichen außer Buchstaben und Ziffern als `_`“, Beispiel `punkt_13`), Abschnitt 6 (`mt_handel.punkt_13`). Bezug: Fachmodell req-fach-036 (Beispiel `punkt_13`).
- Sachverhalt: Nach der Regel wird aus „Punkt 1/3“ die Kennung `punkt_1_3`. Das Beispiel und Abschnitt 6 verwenden `punkt_13`, wie das Fachmodell. Regel und Beispiel passen nicht zusammen. Die vollständige Liste der Kennungen ist Sache der Aufträge. Die Regel selbst steht aber in der Spezifikation.
- Kritikpunkt: Die Bildungsregel ergibt eine andere Kennung als das Beispiel daneben.

### S13 – Dokumentation: Ausdrücke für Anwender, Glossar

- Fundstelle: Spezifikation Abschnitt 9. Anforderungen: req-system-020, req-system-021. Dazu `docs/technical/glossar.md`.
- Sachverhalt:
  - Die Anwenderdokumentation soll die Arbeitsabläufe und beide Testfälle beschreiben. Die Ausdruckssprache ist nicht genannt: Funktionen, Trennzeichen `;`, Kennungen, Werte einer Auswahl, „nicht verfügbar“ und „leer“. Ebenso fehlt die Bedeutung der Befunde. Beides braucht ein Anwender, um eine Strategie zu gestalten. Die QA gibt Phase 4 ohne diese Teile nicht frei.
  - Das Glossar widerspricht der Spezifikation in mehreren Einträgen. Abschnitt 9 nennt nur neue Begriffe. Die Einträge sind:
    - „Pydantic“: „In der gemeinsamen Python-Bibliothek wird sie nicht verwendet“. Dagegen steht E1 (`pipwerk_domain.documents` verwendet Pydantic).
    - „Index“: eine Tabelle in der Datenbank. Dagegen steht E5.
    - „Strategiedatei“: eine Datei „im Strategieverzeichnis“. Dagegen steht Objektverzeichnis.
    - „Typbeschreibung“: nennt „Eingaben“. Dagegen steht Abschnitt 3.1.
  - Die technische Dokumentation `docs/technical/pipwerk-studio.md` sagt in Abschnitt 2.1, dass Alembic nicht eingesetzt wird. Abschnitt 9 der Spezifikation nennt Alembic bereits.
- Kritikpunkt: Der Umfang der Anwenderdokumentation und die Berichtigung bestehender Glossareinträge sind in Abschnitt 9 nicht genannt.

### S14 – Folgen der fachlichen Festlegung für den Auftraggeber

- Fundstelle: Spezifikation Abschnitt 3.5, Abschnitt 10. Bezug: req-core-002, Fachmodell req-fach-046, req-fach-049a.
- Sachverhalt: Die folgenden Folgen ergeben sich aus den Dokumenten des Auftraggebers, nicht aus der Spezifikation. Sie werden aber erst mit der Abbildung in der Spezifikation sichtbar:
  - Die Regel prüft bei „Order ändern“ und „Position ändern“ mit dem aktuellen Kapital. Ist das Kapital gesunken, etwa durch Verluste anderer Positionen, lehnt sie auch eine Änderung ab, die das Risiko verringert.
  - Legt eine Regel des Elements „Order aufgeben“ 2 % fest, prüft bei „Order ändern“ nur die Regel der Strategie mit 1 %. Das Volumen für 2 % besteht diese Prüfung nicht. Die Regeln des Elements „Order aufgeben“ gelten bei „Order ändern“ nicht (req-fach-049a, „des Elements“). Die Order lässt sich dann nicht ändern.
- Frage: Nennt die Spezifikation diese Folgen in Abschnitt 10, damit der Auftraggeber sie bei der Abstimmung sieht?

### S15 – Element mit unbekanntem Typ in der Oberfläche

- Fundstelle: Spezifikation Abschnitt 3.7, zweiter Absatz, E2. Anforderung: req-ablauf-008.
- Sachverhalt: Ein Dokument mit unbekanntem Typ wird geladen und die Konsistenzprüfung meldet es. Ohne Typbeschreibung ist offen, wie die Oberfläche das Element zeigt, ob der Anwender es löschen kann und ob seine Belegungen beim erneuten Speichern erhalten bleiben.
- Frage: Wie erscheint ein Element ohne Typbeschreibung, und bleibt es beim Speichern unverändert?

---

## 4. Abbildbarkeit der Testfälle (Prüfpunkt 3)

| Testfall | gestalten | speichern | laden | Konsistenzprüfung ohne Fehler | Einschränkung |
|---|---|---|---|---|---|
| `str-01` | ja | ja | ja | ja, unter den Bedingungen in S7 | B2 (Bedeutung bei „leer“), S6 |
| `str-03` | ja | ja | ja | ja, unter den Bedingungen in S7 | B1 (Nachziehen des Stop-Loss), S6 |

Geprüft wurde Abschnitt 6 der Spezifikation gegen die Testfälle:

- `str-01`: Strategieparameter, zwei Instanzen `Markttechnik` mit Zeiteinheit aus Strategieparametern, Regel `risiko`, Hauptablauf nach Abschnitt 1 bis 5 des Testfalls, Verwaltung mit den Auslösern `Tick` und `Kerzenschluss` nach Abschnitt 6. Alle verwendeten Eigenschaften sind in der Verwaltung bekannt (Abschnitt 3.4, Tabelle „Zusammenhang“). Kein Ausdruck verwendet `Kerze`, daher kein Fehler nach req-fach-051 beim Auslöser `Tick`. Das Volumen bestimmt `risiko`, daher kein Fehler zur MUSS-Eigenschaft `Volumen`.
- `str-03`: Instanzen `ema20`, `ema50`, `atr14`, Kreuzen mit `PREVIOUS`, `Kerze.Schluss` ohne Instanz mit der Zeiteinheit des Auslösers, Marktorder, Verwaltung mit „Position schließen“ und „Position ändern“. `risiko` wird auf die Schließorder nicht angewendet (Ergebnis „nicht verfügbar“, Abschnitt 3.5). `mindestvolumen` ist Regel des Elements und gilt nicht für die Schließorder (Abschnitt 6, letzter Absatz).
- Speichern und Laden: Dokumentformat, Schemata und Rundweg sind in Abschnitt 3.7 festgelegt, der Browsertest in Abschnitt 7 vergleicht nach Neuladen.

## 5. Regelvorlage „Risiko je Trade“ (Prüfpunkt 4)

| Fall nach req-core-002 und Abschnitt 3.5 | Ergebnis |
|---|---|
| „Order aufgeben“, Markt-, Stop-, Limit-Order | erfüllt: `Position` nicht verfügbar, `Order.Limitpreis` nicht verfügbar, gerechnet wird mit `Order.Preis` |
| „Order aufgeben“, Stop-Limit-Order | erfüllt: gerechnet wird mit `Order.Limitpreis`; einen einzigen Preis für Bestimmen und Prüfen (N10) hält die Spezifikation ein |
| „Order ändern“ | erfüllt, solange der Stop-Loss auf der Verlustseite liegt |
| „Position ändern“, Prüfung nach der Ausführung | nicht erfüllt bei Stop-Loss auf oder hinter dem Einstiegspreis (B1) |
| Schließorder | erfüllt: Ergebnis nicht verfügbar, Regel wird nicht angewendet |
| ohne Stop-Loss | festgelegt als nicht erfüllt, in Abschnitt 10 Punkt 5 zur Bestätigung genannt |
| H23 (`Position` in einer Regel auf eine Order) | beantwortet: „nicht verfügbar“, Abschnitt 3.4 und Abschnitt 10 Punkt 4 |
| H24 (Regel ohne Order und Position) | für den Hauptablauf beantwortet, für Verwaltung und verschachtelte Regeln offen (S1) |

## 6. Zusammenfassung

| Art | Anzahl | blockierend |
|---|---|---|
| blockierende Befunde | 4 (B1 bis B4) | ja |
| Hinweise | 15 (S1 bis S15) | nein |

Die Prüfung ist nicht bestanden. B1 und B2 betreffen die Bedeutung von Ausdrücken, die die Spezifikation nach ihrem Abschnitt 1 festlegt. B3 und B4 betreffen Festlegungen des Fachmodells zu Indikatoren und Trends. Keiner der Befunde verlangt nach Einschätzung der QA eine neue Anforderung. Ob B3 eine Entscheidung des Auftraggebers braucht, entscheidet der Softwarearchitekt mit Abschnitt 10.
