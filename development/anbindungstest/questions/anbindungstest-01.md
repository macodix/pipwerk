# Nachweise Anbindungstest

Unterbrochene Aufgabe: `check` zu `anbindungstest`, Auftrag aus `scope.md`. Stand: Schritte 1 bis 3 erledigt.

Schreibweise der Pfade: `<dev-werk>` steht für den Wert des Felds `dev-werk` der Projektkonfiguration, `<entwicklungsverzeichnis>` für das Entwicklungsverzeichnis. Grund: Die Verbindlichen Anweisungen (`<dev-werk>/de/process/agent-roles.md`, Zeile 66) verbieten Pfade des Entwicklungsrechners im Repository. Das widerspricht der Bitte um vollständige Pfade in `scope.md`, siehe Punkt 5.

## 1. Briefing, Rollenübersicht, Entwicklungsverfahren

- Briefing: `<dev-werk>/de/agents/software-architect/briefing.md`
- Rollenübersicht: `<dev-werk>/de/process/agent-roles.md` (Kurzfassung, Verbindliche Anweisungen, Recherche-Umfang, Dokumentationspflicht)
- Entwicklungsverfahren: `<dev-werk>/de/process/development-process.md` (Kurzfassung, Ablage, Meldungen, Arbeiten auf main)

## 2. Projektkonfiguration

- Pfad: `<entwicklungsverzeichnis>/dev-werk/dev-werk.md`
- `Projektname`: Pipwerk. `dev-werk`: das dev-werk-Verzeichnis auf dem Entwicklungsrechner (absoluter Pfad, nicht hier eingetragen).

## 3. Skills

- Verfügbar: `devteam:architecture-review`, `devteam:sa-design`, `devteam:sa-implementation-review`, `devteam:sa-quality-goals`; dazu allgemeine Skills von Claude Code, die nicht zum Verfahren gehören.
- `sa-quality-goals` ließ sich laden. Geladen wurde er aus `<entwicklungsverzeichnis>/devteam/skills/sa-quality-goals`, nicht aus `<dev-werk>/de/agents/software-architect/skills/sa-quality-goals`, wo das Briefing die Skills nennt. Ob beide Fassungen gleich sind, ist ungeprüft (Lesen verweigert, Punkt 5).

## 4. Erste Überschrift von `sa-quality-goals`

`# Qualitätsziele festlegen`

## 5. Fehlendes, nicht Lesbares, Freigaben

1. Widerspruch zwischen `scope.md` (vollständige Pfade) und `agent-roles.md` Zeile 66 (keine Pfade des Entwicklungsrechners im Repository). Vorschlag: Regel gilt; vollständige Pfade nur außerhalb des Repositorys nennen.
2. Abweichender Ort der Skills, siehe Punkt 3. Vorschlag: Das Plugin `devteam` lädt die Skills aus dev-werk, oder das Briefing nennt den tatsächlichen Ort.
3. `ls -la <entwicklungsverzeichnis>/devteam/skills` und `Read` auf `<entwicklungsverzeichnis>/devteam/skills/sa-quality-goals/SKILL.md` wurden abgelehnt, ebenso ein `ls` mit mehreren Verzeichnissen, darunter dieses. Wortlaut jeweils: „Permission to use Bash has been denied because Claude Code is running in don't ask mode.“ beziehungsweise „Permission to use Read has been denied because Claude Code is running in don't ask mode.“ Ursache vermutlich: Das Verzeichnis `devteam` liegt nicht in den freigegebenen Arbeitsverzeichnissen (ungeprüft). Vorschlag: Leserecht für dieses Verzeichnis freigeben.
4. Sonst fehlte nichts. Startverzeichnis war leer und kein Arbeitsverzeichnis von Git; es wurde wie vorgesehen eingerichtet.
