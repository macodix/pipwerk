# Arbeitsauftrag WO-2026-10-04-001 -- Dauerhafte Oberflächensprache des Strategiedesigners

## Status

- status: `umgesetzt`
- freigegeben am: `2026-10-04`
- übernommen in `main`: PR #31, Merge-Commit `780e81d85978556f12d82e195ea196dbe76cfd27`
- maßgeblicher Ausgangsstand: `origin/main` bei Commit `829920faf45fc17b7a7a3987b1ba3d38ae6e245e`

## Ziel

Der Strategiedesigner unterstützt Deutsch und Englisch. Die im Strategiedesigner gewählte Oberflächensprache wird dauerhaft gespeichert.

## Umfang und gewünschtes Verhalten

Ohne gespeicherte Sprachauswahl startet der Strategiedesigner auf Deutsch. Eine Sprachänderung wird zentral als Einstellung der Komponente gespeichert und nach einem Neuladen der Oberfläche sowie nach einem Neustart des Strategiedesigners wiederhergestellt.

Der Sprachwechsel verändert weder Strategieinhalte noch sonstige fachliche Konfigurationen. Vom Nutzer vergebene Namen und frei eingegebene Texte werden nicht automatisch übersetzt. Die Sprachauswahl gilt ausschließlich für den Strategiedesigner.

## Nicht-Umfang

Nicht Bestandteil dieses Arbeitsauftrags sind:

- Benutzerkonten oder eine Anmeldung;
- benutzerbezogene Spracheinstellungen;
- eine Speicherung der Sprachauswahl im Browser;
- weitere Oberflächensprachen neben Deutsch und Englisch.

## Abnahmekriterien

1. Im Strategiedesigner können Deutsch und Englisch als Oberflächensprache ausgewählt werden.
2. Wenn noch keine Sprachauswahl gespeichert ist, startet der Strategiedesigner auf Deutsch.
3. Nach der Auswahl von Englisch bleibt Englisch nach einem Neuladen der Oberfläche und nach einem Neustart des Strategiedesigners aktiv.
4. Nach dem Rückwechsel zu Deutsch bleibt Deutsch nach einem Neuladen der Oberfläche und nach einem Neustart des Strategiedesigners aktiv.
5. Die gespeicherte Sprachauswahl gilt ausschließlich für den Strategiedesigner.
6. Ein Sprachwechsel lässt alle Strategieinhalte und sonstigen fachlichen Konfigurationen unverändert.

## Offener Punkt für später

Es ist später zu prüfen, ob Pipwerk Benutzerkonten benötigt. Falls Benutzerkonten eingeführt werden, ist gesondert zu entscheiden, ob die Oberflächensprache pro Benutzer gespeichert wird. Dieser Punkt ist keine Voraussetzung für die Ausführung dieses Arbeitsauftrags.

## Referenzen

- `docs/design/requirements/anforderungen-strategiedesigner.md`, insbesondere `req-ui-007` und `req-ui-008`
- `docs/design/requirements/anforderungen-gesamtsystem.md`, insbesondere `req-system-012` bis `req-system-016`
- `docs/design/planning/entwicklungsplan-strategiedesigner.md`
- `docs/technical/development-test-security-rules.md`

## Entscheidungsgrenze

Dieser Arbeitsauftrag legt keine Architektur oder konkrete Implementierung fest. Technische Entscheidungen erfolgen im weiteren Ablauf gemäß den dokumentierten Rollen und Zuständigkeiten.
