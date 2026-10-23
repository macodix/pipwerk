# Prüfbericht Dokumente des Auftraggebers, Durchlauf 3 (Nachprüfung)

- Vorhaben: `relay`, Phase 1
- Ergebnis: **bestanden**
- geprüfter Commit: `75af0d53cc7146f783c186b391a857845ddd7fed` (`main`)
- Umfang: nur die geänderten Stellen (req-relay-002, req-relay-003, Glossar „Übertragungsweg“, jeweils mit Änderungsnachweis), gemäß `git diff 0383393c5e8f8d45df3b947f83a6d0285fa3020b~1 75af0d53cc7146f783c186b391a857845ddd7fed`.

## Blockierende Befunde

Keine.

## Prüfung der drei Fragen

1. **Wiedergabe der Festlegung:** Eindeutig. req-relay-003 nennt jetzt Komponente–Relay und Relay–Relay als Strecken mit austauschbarem Übertragungsweg. req-relay-002 verweist darauf und nennt die Konfiguration je Komponente. Beides deckt sich mit `scope.md`, Abschnitt „Stand“, letzter Eintrag.
2. **Widersprüche:** Keine neuen.
   - req-relay-001 (Komponente spricht nur mit dem Relay ihres Rechners) bleibt unberührt.
   - req-relay-004 (Matrix, Dateien als erste Wege) ist mit beiden Strecken vereinbar.
   - req-relay-006 (Adressbuch enthält nur Relays und deren Weg) betrifft nur die Strecke zwischen Relays und widerspricht nicht.
   - Das Glossar (Übertragungsweg, Relay, Adressbuch) stimmt mit den Anforderungen überein. Weitere Fundstellen von „Übertragungsweg“ in `docs` und `scope.md` gibt es nicht.
3. **Nachweis laut `scope.md`:** Lässt sich abbilden. Eine Anfrage und die Rücklieferung laufen über Komponente → Relay → Relay → Komponente. Matrix und Dateien sind in beiden Strecken zulässig.

## Hinweise (nicht blockierend)

- H1 – Fundstelle `scope.md`, „Nachweis des Vorhabens“ („einmal über Matrix und einmal über Dateien“). Der Nachweis sagt nicht, für welche Strecke der Weg gilt (Komponente–Relay oder Relay–Relay). Zuordnung: Lücke, Sache der Spezifikation. Der Nachweis bleibt mit jeder Lesart abbildbar.
- H2 – Fundstelle req-relay-003, zweiter Absatz („Jedes Relay hat nur die Übertragungswege, die für es konfiguriert sind“). Die Konfiguration auf der Komponentenseite steht nur in req-relay-002 („je Komponente“). Zuordnung: Sache der Spezifikation. Kein Widerspruch.
