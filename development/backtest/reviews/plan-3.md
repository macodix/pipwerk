# Prüfbericht QA, Arbeitspaketplan `backtest`, Durchlauf 3 (Änderung Beginn von `wp01`)

- Ergebnis: **bestanden**
- geprüfter Stand: `main`, Commit `ceb0f0f50dd73043aac87073a24b30f7b99123c3` (enthält diesen Prüfauftrag)
- geprüft: `git diff 219da4003214257b229474fbdd955c5d61a194f8 ceb0f0f50dd73043aac87073a24b30f7b99123c3 -- development/backtest/plan.md` (Kopf „prüfung“, Übersicht, Erläuterung, Absatz zu `integrated`, „Abhängigkeiten“ von `wp01`, Änderungsnachweis)
- Testumgebung: nicht nötig, nicht verwendet.

## Blockierende Befunde

Keine.

## Zu den drei Prüffragen

1. **Widersprüche.** Keine blockierenden.
   - Die Abweichung von „Ein Arbeitspaket beginnt, sobald alle Pakete, von denen es abhängt, abgenommen und übernommen sind“ (Entwicklungsverfahren, Phasen) ist im Plan ausdrücklich genannt und begründet.
   - Der Arbeitszweig wird vom Entwicklungsleiter angelegt (Zweige), jetzt von einem anderen Ausgangscommit. Das widerspricht der Tabelle nicht.
   - Phase 4 gilt für Änderungen am Code (erneute Prüfung): Das steht in Punkt 2.
   - Phase 6 („genau den abgenommenen Commit“): Punkt 4 hält das ein.
   - Der Commit `2cac35b…` existiert auf `origin/strategiedesign/wp02`. Der Prüfbericht `strategiedesign/wp02/reviews/4.md` auf `617867c` nennt ihn als geprüft und „bestanden“. Er ist nicht der Kopf des Zweigs; `617867c` und `e1afc6b` kamen danach und ändern nur Berichte und Aufträge (`git diff --stat 2cac35b 617867c`).
   - Zu `development/strategiedesign/plan.md`, Spezifikation und `scope.md` gibt es keinen Widerspruch. `wp01` ändert in pipwerk Studio nur Texte (Plan `wp01`, Umfang), das hatte schon Durchlauf 1 zu `strategiedesign/wp03` festgehalten.
2. **Ablauf.** Beginn, Zusammenführen in den Arbeitszweig, Stand bei der Abnahme und Übernahme sind beschrieben. Der Entwicklungsleiter kann ohne Rückfrage beginnen. Offene Stellen stehen unter den Hinweisen.
3. **Umfang und Abnahmekriterien.** Das Diff berührt Ziel, Umfang, Nicht-Umfang, umgesetzte Teile und Abnahmekriterien von `wp01` nicht. `wp02` bis `wp04` und die Abdeckungstabelle sind unverändert. Die Aussage „Umfang und Abnahmekriterien unverändert“ stimmt.

## Hinweise (verhindern das Bestehen nicht)

1. Punkt 3 und Punkt 4 (Abhängigkeiten `wp01`) messen verschieden. Punkt 3 verlangt den neuesten Commit „mit Änderungen an der Software“. Punkt 4 verlangt, dass der abgenommene Commit „den übernommenen Commit“ von `strategiedesign/wp02` enthält. Kommt auf `strategiedesign/wp02` nach der letzten Softwareänderung noch ein Commit nur mit Berichten oder Dokumenten und wird dieser übernommen, löst Punkt 4 eine erneute Prüfung und Abnahme aus, obwohl Punkt 3 erfüllt ist. Frage: Gilt für Punkt 4 dasselbe Maß wie für Punkt 3?
2. Punkt 4 sagt nicht, wie der Entwicklungsleiter von `wp01` erfährt, dass `strategiedesign/wp02` übernommen ist, und was mit `wp01` geschieht, wenn die Abnahme vorher fertig ist (warten, Meldung erst danach). Frage: Soll das im Plan stehen oder regelt es der Entwicklungsleiter?
3. Punkt 1: „er ist in der Abnahme“ lässt sich im Repository nicht belegen. `strategiedesign/wp02/acceptance/1.md` ist der gescheiterte erste Versuch; ein Abnahmebericht zu `2cac35b…` fehlt, sofern er überhaupt schon vorliegen müsste. Der Satz ist eine Aussage des Projektleiters zum Stand, keine Planregel.
4. Erläuterung und Übersicht: „Beginn: keine“ (Abhängigkeit) steht neben Punkt 1, der den Beginn an einen bestimmten Commit von `strategiedesign/wp02` bindet. Eine Formulierung wie „keine Wartezeit“ träfe es genauer.
5. Der Plan steht auf `draft`; „Beginn nach Bestätigung dieser Planänderung“ verweist auf eine Bestätigung des Auftraggebers, die der Änderungsnachweis nur als „Wunsch“ nennt. Frage: Wo wird die Bestätigung vermerkt (Phase 3: Präsentation mit Vermerk der Bestätigung)?
