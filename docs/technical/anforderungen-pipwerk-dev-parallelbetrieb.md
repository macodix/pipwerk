# Anforderungen an pipwerk-dev – Parallelbetrieb mehrerer Arbeitsaufträge

## Status

- status: `draft`
- stand: 2026-10-08
- bereich: Entwicklungsprozess, lokales Hilfswerkzeug `pipwerk-dev` (keine Produktkomponente)

## Zweck und Abgrenzung

Dieses Dokument beschreibt die Anforderungen, die `pipwerk-dev` erfüllen muss, damit mehrere Arbeitsaufträge gleichzeitig bearbeitet werden können. Grundlage ist die Festlegung im Abschnitt [Parallele Bearbeitung von Aufträgen](entwicklungsverfahren.md#parallele-bearbeitung-von-aufträgen) des Entwicklungsverfahrens.

`pipwerk-dev` liegt nicht im Pipwerk-Repository. Es wird nicht vom Agententeam geändert, sondern in einer eigenen Claude-Code-Sitzung auf Grundlage dieses Dokuments. Bis zur Umsetzung gelten die heutigen festen Arbeitsbereiche und Befehle aus dem [Entwicklungsverfahren](entwicklungsverfahren.md) unverändert.

## Ausgangslage

Heute gibt es je Entwicklungsverzeichnis genau einen Arbeitsbereich `implement/`, einen Arbeitsbereich `review/` und einen Teststand `test/`. Die Sitzung des Softwarearchitekten läuft in `repo/`. Daraus folgen vier Hindernisse für einen zweiten gleichzeitigen Auftrag:

1. Zwei Entwickler oder zwei QA-Agenten würden sich denselben Arbeitsbereich teilen.
2. `sync-repo` verweigert die Arbeit, solange eine Sitzung in `repo/` läuft. Ein zweiter Auftrag kann `repo/` deshalb nicht aktualisieren.
3. Es gibt nur einen Teststand mit festen Ports.
4. Ein zweiter zustandsändernder Aufruf von `pipwerk-dev` wird abgelehnt, solange ein anderer läuft, auch wenn er einen ganz anderen Arbeitsbereich betrifft.

## Begriffe

- **Auftragskennung:** die Kennung eines Arbeitsauftrags, zum Beispiel `WO-2026-10-08-001`. Sie wird in Verzeichnisnamen verwendet und darf nur Buchstaben, Ziffern und Bindestriche enthalten.
- **Auftragsarbeitsbereich:** das Verzeichnis `work/<auftragskennung>/` mit den Git-Arbeitskopien eines Auftrags.
- **Worktree:** eine zusätzliche Git-Arbeitskopie desselben Repositorys, die sich die Versionsdaten mit `repo/` teilt, aber einen eigenen Branch oder Commit ausgecheckt hat.
- **Komponententeststand:** der Teststand einer Komponente unter `test/<komponente>/` mit eigenen Ports.

## Anforderungen

### pd-par-001 – Arbeitsbereiche je Auftrag

Für jeden Auftrag werden eigene Worktrees unter `$PIPWERK_DEV_ROOT/work/<auftragskennung>/` angelegt:

| Verzeichnis | Nutzer | Inhalt |
|---|---|---|
| `lead/` | Softwarearchitekt | Commit `origin/main` zu Beginn des Auftrags, ohne Branch („detached“); Arbeitsverzeichnis der Sitzung des Softwarearchitekten |
| `implement/` | Entwickler | Arbeitsbranch des Auftrags |
| `review/` | QA | lokaler Prüfbranch auf dem zu prüfenden Commit |

Die Schutzregeln der heutigen Befehle `prepare` und `update` gelten unverändert für jeden dieser Worktrees, insbesondere der Abbruch bei lokalen Änderungen, fremden Daten, vorhandenem Branch oder ausgechecktem `main`.

### pd-par-002 – Befehle mit Auftragskennung

`prepare`, `update`, `test` und `status` erhalten die Auftragskennung als Pflichtangabe, zum Beispiel:

```sh
pipwerk-dev prepare --order <auftragskennung> <lead|implement|review> [<branch>] --base <commit>
pipwerk-dev update  --order <auftragskennung> <implement|review> <ref>
pipwerk-dev test    <komponente> --order <auftragskennung> --workspace <implement|review>
pipwerk-dev status  [--order <auftragskennung>]
```

Die genaue Schreibweise der Befehle legt die umsetzende Sitzung fest und dokumentiert sie. Für `lead` wird kein Branch angelegt.

### pd-par-003 – Abbau eines Auftragsarbeitsbereichs

Ein neuer Befehl entfernt nach dem Abschluss eines Auftrags dessen Worktrees und lokale Branches, zum Beispiel `pipwerk-dev remove --order <auftragskennung>`. Er bricht ohne Änderung ab, wenn ein Worktree lokale Änderungen hat, wenn ein lokaler Branch Commits enthält, die nicht auf `origin` liegen, oder wenn in einem der Worktrees ein von `pipwerk-dev` verwalteter Prozess oder eine Claude-Code-Sitzung läuft.

### pd-par-004 – Teststand je Komponente

`start`, `stop` und `status` arbeiten je Komponente. Der Teststand einer Komponente liegt unter `$PIPWERK_DEV_ROOT/test/<komponente>/`. Jede Komponente hat eigene, konfigurierbare Ports. Zwei Teststände verschiedener Komponenten können gleichzeitig laufen. Für dieselbe Komponente gilt weiterhin: Läuft sie aus einem anderen Commit, bricht `start` ab.

Die heutigen Regeln für `start` bleiben erhalten: nur vollständiger Commit-Hash, Erreichbarkeitsprüfung, Abbruch bei fremd belegten Ports, Testdatenbank im lokalen Zustandsverzeichnis. Die Testdatenbank wird je Komponente getrennt geführt.

### pd-par-005 – Parallele automatische Prüfungen

`test` muss in mehreren Auftragsarbeitsbereichen gleichzeitig laufen können. Dafür vergibt `pipwerk-dev` je Lauf freie Ports für die Browser-End-to-End-Tests. Für Pipwerk Studio sind das die Umgebungsvariablen `PIPWERK_STUDIO_E2E_BACKEND_PORT` und `PIPWERK_STUDIO_E2E_FRONTEND_PORT` (siehe [Pipwerk Studio – technische Dokumentation](pipwerk-studio.md)).

### pd-par-006 – Sperren je Arbeitsbereich

Die heutige globale Sperre wird durch Sperren je Arbeitsbereich ersetzt. Ein Aufruf für einen Auftragsarbeitsbereich oder Komponententeststand blockiert nur Aufrufe für denselben Bereich. Operationen auf den gemeinsamen Git-Daten, zum Beispiel `git fetch` und das Anlegen oder Entfernen von Worktrees, werden kurz und für alle Bereiche gemeinsam gesperrt. Ein gesperrter Aufruf endet wie heute mit Exitcode 3 und nennt den Grund.

### pd-par-007 – Referenz-Repository

`repo/` bleibt der normale Klon und Träger der gemeinsamen Git-Daten. Da keine Agentensitzung mehr in `repo/` läuft, kann `sync-repo` auch während laufender Aufträge ausgeführt werden. Die bestehenden Abbruchbedingungen von `sync-repo` bleiben erhalten.

### pd-par-008 – Erweiterbare Komponentenliste

Welche Komponenten `pipwerk-dev` testen und starten kann, wird je Komponente beschrieben: Prüfschritte, Startbefehle, Erreichbarkeitsprüfungen und Ports. Eine weitere Komponente, zum Beispiel Pipwerk Relay, muss ergänzt werden können, ohne die Logik für Arbeitsbereiche, Sperren und Prozessverwaltung zu ändern. Umgesetzt werden muss zunächst nur `pipwerk-studio`.

### pd-par-009 – Zustandsübersicht

`status` zeigt ohne Angabe einer Auftragskennung alle Auftragsarbeitsbereiche mit Commit, Branch, Zahl lokaler Änderungen und laufenden Prozessen sowie alle Komponententeststände mit laufendem Commit und Ergebnis der Erreichbarkeitsprüfungen. `status` verändert weiterhin nichts.

### pd-par-010 – Unveränderte Grundsätze

Weiterhin gelten: Ausgabe als JSON mit `--json`, Exitcodes 0 bis 3, Protokolle im lokalen Zustandsverzeichnis, Ersetzen von Zugangsdaten in Ausgaben und Protokollen, kein Verändern oder Verwerfen fremder Daten, kein Bewegen von `main` außer durch `sync-repo`, `pipwerk-dev` startet keine Agenten und kennt keine Auftragsinhalte.

### pd-par-011 – Umstellung

Die bisherigen Arbeitsbereiche `implement/`, `review/` und `test/` werden bei der Umstellung nur entfernt, wenn sie keine lokalen Änderungen und keine nicht übertragenen Commits enthalten. Andernfalls bricht die Umstellung ab und nennt die betroffenen Dateien und Commits.

### pd-par-012 – Nachweis und Dokumentation

Die automatischen Tests von `pipwerk-dev` decken jede Anforderung dieses Dokuments ab, insbesondere zwei gleichzeitig laufende Aufträge, zwei gleichzeitige Prüfläufe und zwei gleichzeitig laufende Teststände verschiedener Komponenten. Die lokale Dokumentation von `pipwerk-dev` wird vollständig aktualisiert. Die umsetzende Sitzung liefert eine Liste der geänderten Befehle als Grundlage für die Anpassung der Repository-Dokumentation.

## Offene Punkte

- Die Ports der Komponententeststände für weitere Komponenten werden festgelegt, wenn die Komponente in `pipwerk-dev` aufgenommen wird.

## Änderungsnachweis

| Datum | Änderung |
|---|---|
| 2026-10-08 | Erstfassung. |
