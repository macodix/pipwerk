# Anforderungen an das Gesamtsystem

## Dokumentstatus

- status: `draft`
- zweck: Übergreifende Anforderungen an Aufbau, Abgrenzung und Zusammenarbeit der Hauptkomponenten
- zuletzt aktualisiert: `2026-09-26`

## 1. Systemaufteilung

### req-system-001 -- Hauptkomponenten

Das Gesamtsystem besteht derzeit aus folgenden fachlich getrennten Hauptkomponenten:

- `Strategiedesigner` -- erstellt und bearbeitet ausführbare Strategiedefinitionen.
- `Strategietester` -- führt Strategiedefinitionen zu Testzwecken, insbesondere gegen historische oder aufgezeichnete Marktdaten, aus und stellt die Testergebnisse bereit.
- `Handelssystem` -- wendet Strategiedefinitionen zur Laufzeit auf konkrete Handelskonten an und führt den daraus entstehenden Handelsablauf aus.
- `Nachrichtensystem` -- ermöglicht den Nachrichtenaustausch zwischen eigenständig arbeitenden Komponenten.

Die weitere fachliche Ausgestaltung der einzelnen Komponenten erfolgt in den jeweils zuständigen Anforderungsdokumenten.

### req-system-002 -- Eigenständig lauffähige Hauptkomponenten

Die Hauptkomponenten werden als eigenständig lauffähige Komponenten konzipiert. Keine Hauptkomponente darf voraussetzen, dass eine andere Hauptkomponente im selben Prozess oder auf demselben Rechner ausgeführt wird.

Die Komponenten müssen dadurch insbesondere in getrennten Prozessen und auf unterschiedlichen Rechnern beziehungsweise Systemumgebungen betrieben werden können.

### req-system-003 -- Unabhängige Bereitstellung

Die Hauptkomponenten müssen unabhängig voneinander bereitgestellt und eingesetzt werden können, soweit die jeweilige fachliche Aufgabe keine andere Komponente benötigt. Dadurch müssen insbesondere getrennte Umgebungen für Strategieentwicklung, Strategietest und produktiven Handel möglich sein.

### req-system-004 -- Gemeinsame Strategiedefinition

`Strategiedesigner`, `Strategietester` und `Handelssystem` müssen dieselbe fachliche Strategiedefinition verwenden können. Eine Strategiedefinition darf für Test oder produktive Ausführung nicht in ein anderes fachliches Strategiemodell übertragen werden müssen.

### req-system-005 -- Kommunikation zwischen Komponenten

Die Zusammenarbeit eigenständig laufender Komponenten erfolgt über klar definierte Schnittstellen. Für den Nachrichtenaustausch zwischen Komponenten wird das gemeinsame `Nachrichtensystem` verwendet.

Die konkrete technische Umsetzung der Schnittstellen und des Nachrichtentransports wird durch diese Anforderung nicht festgelegt.

### req-system-006 -- Technische Eigenständigkeit

Jede Hauptkomponente muss einschließlich ihrer benötigten Laufzeitbestandteile eigenständig installierbar und startbar sein. Gemeinsam verwendete Bibliotheken werden mit der jeweiligen Komponente in einer festgelegten Version bereitgestellt. Eine Hauptkomponente darf für ihre eigene Ausführung keinen zentral laufenden gemeinsamen Fachkern voraussetzen.

### req-system-007 -- Gemeinsamer fachlicher Python-Kern

Der gemeinsame fachliche Kern wird in Python implementiert. `Strategiedesigner`, `Strategietester` und `Handelssystem` verwenden dieselbe versionierte Python-Bibliothek für fachliche Objekttypen und deren Prüf- und Auswertungslogik. Diese Logik darf nicht unabhängig in den Benutzeroberflächen nachimplementiert werden.

Das `Nachrichtensystem` wird ebenfalls in Python implementiert. Seine eigenständige Ausführbarkeit und die sprachunabhängige Definition seiner Schnittstellen bleiben davon unberührt.

### req-system-008 -- Benutzeroberflächen

`Strategiedesigner`, `Strategietester` und `Handelssystem` erhalten jeweils eine eigene Browseroberfläche auf Basis von TypeScript, React und CSS. Die Oberflächen verwenden gemeinsame Gestaltungsregeln und, soweit fachlich passend, gemeinsam entwickelte und versionierte UI-Komponenten. Jede Hauptkomponente liefert die von ihr benötigten UI-Bestandteile selbst mit und bleibt unabhängig installierbar und startbar.

Eine eigene Benutzeroberfläche des `Nachrichtensystems` ist derzeit nicht festgelegt.

### req-system-009 -- Web-APIs der Hauptkomponenten

Jede Hauptkomponente stellt die für eine externe Nutzung vorgesehenen Funktionen über eine dokumentierte HTTP-Web-API bereit. Dadurch müssen insbesondere andere Programme, Automatisierungswerkzeuge und alternative Benutzeroberflächen diese Funktionen ohne Bedienung der mitgelieferten Oberfläche verwenden können.

Die Web-API muss von internen, nicht als stabiler Vertrag vorgesehenen GUI-Implementierungsdetails getrennt werden. Für eingehende Ereignisse können ausdrücklich definierte Webhook-Endpunkte bereitgestellt werden.

### req-system-010 -- Austauschbarkeit über definierte Verträge

Eine Hauptkomponente muss durch eine andere Implementierung ersetzt werden können, sofern diese die vereinbarten Schnittstellen und das vereinbarte fachliche Verhalten erfüllt. Die Austauschbarkeit stützt sich mindestens auf:

- die versionierte Web-API,
- das gemeinsame Format der Strategiedefinition,
- die festgelegten Nachrichtenformate,
- die gemeinsam verwendeten fachlichen Datenformate.

Die konkrete Programmiersprache einer Ersatzimplementierung ist nicht Bestandteil dieser Verträge.

### req-system-011 -- Schutz externer Schnittstellen

Die Erreichbarkeit und Berechtigungen der Web-APIs müssen konfigurierbar sein. Schreibende, ausführende oder den Handel betreffende Funktionen dürfen nicht ohne geeignete Authentifizierung und Autorisierung extern zugänglich sein. Webhooks müssen ihren Absender beziehungsweise ihre Berechtigung prüfen und wiederholte Übermittlung eindeutig behandelbar machen.


### req-system-012 -- Konfigurierbare Datenspeicherung

Das konkrete Speicher-Backend ist konfigurierbar. Pipwerk schreibt kein bestimmtes Speicher-Backend für das Gesamtsystem oder eine Komponente fest.

Jede Komponente, die Daten persistent speichert, muss ihre Speicheranbindung über ihre Konfiguration festlegen können.

### req-system-013 -- Unabhängige Speicherzuordnung

Unterschiedliche Hauptkomponenten sowie unterschiedliche Komponenten innerhalb einer Hauptkomponente dürfen unterschiedliche Speicher verwenden. Eine Hauptkomponente beziehungsweise Komponente darf bei Bedarf auch mehrere Speicher verwenden.

Die Speicherzuordnung darf nicht voraussetzen, dass alle beteiligten Komponenten oder Speicher auf demselben Rechner oder in derselben Systemumgebung betrieben werden.

### req-system-014 -- Gemeinsame Speicher

Mehrere Hauptkomponenten oder Komponenten dürfen denselben physischen Speicher verwenden.

Wenn mehrere Komponenten einen Speicher gemeinsam verwenden, müssen ihre Datenbestände voneinander abgrenzbar sein. Die konkrete Art dieser Abgrenzung ist abhängig vom verwendeten Speicher-Backend und wird nicht allgemein festgelegt.

### req-system-015 -- SQLAlchemy als Speicherschnittstelle

Für persistente Datenspeicherung wird SQLAlchemy als gemeinsame Speicherschnittstelle verwendet.

Das über SQLAlchemy verwendete konkrete Speicher-Backend ist Bestandteil der Konfiguration und wird von Pipwerk nicht allgemein festgelegt.


### req-system-016 -- Zweistufige Konfiguration

Die Konfiguration einer eigenständig startbaren Komponente ist in Startkonfiguration und Betriebskonfiguration getrennt.

Die Startkonfiguration enthält ausschließlich die Informationen, die benötigt werden, um die Komponente zu starten und ihre konfigurierten Speicher zu finden und zu verwenden. Sie wird als INI-Datei bereitgestellt.

Alle weiteren Konfigurationswerte werden im jeweiligen Speicher der Komponente abgelegt. Dadurch müssen insbesondere Einstellungen, die durch die Komponente selbst oder über ihre Benutzeroberfläche geändert werden können, nicht in der administrativ verwalteten Startkonfiguration geführt werden.

### req-system-017 -- Pfade der Startkonfiguration

Eine eigenständig startbare Komponente muss ihre INI-Startkonfiguration an den folgenden Orten verwenden können:

- über den Aufrufparameter `-c <PATH>`,
- unter `$HOME/pipwerk/etc`,
- unter `$HOME/.config/pipwerk`,
- unter `/etc/pipwerk`.

Unter Windows gelten entsprechend:

- `-c <PATH>`,
- `%USERPROFILE%\\pipwerk\\etc`,
- `%APPDATA%\\pipwerk`,
- `%PROGRAMDATA%\\pipwerk`.

Bei der automatischen Suche gilt die jeweils aufgeführte Reihenfolge als Priorität; eine mit `-c <PATH>` ausdrücklich angegebene Startkonfiguration hat höchste Priorität.

Es wird genau eine Startkonfiguration verwendet. Inhalte mehrerer INI-Dateien werden nicht zusammengeführt.

### req-system-018 -- Eigener Speicher und eigenständige Startbarkeit

Eine Komponente mit eigenem konfigurierbarem Speicher muss als eigenständiges Programm beziehungsweise in einem eigenständigen Prozess startbar sein.

Sie besitzt dafür eine eigene Startkonfiguration und muss den Parameter `-c <PATH>` unterstützen.



## 2. Abgrenzung

Die Festlegung eigenständig lauffähiger Hauptkomponenten bestimmt die Systemstruktur, aber nicht, auf wie viele Rechner die Komponenten in einer konkreten Installation verteilt werden. Mehrere Hauptkomponenten dürfen auf demselben Rechner betrieben werden.

Die Festlegung schließt auch nicht aus, dass eine Benutzeroberfläche Funktionen mehrerer Hauptkomponenten zugänglich macht. Die fachlichen Verantwortlichkeiten und die eigenständige Ausführbarkeit der Komponenten bleiben davon unberührt.

## 3. Änderungsnachweis

| Datum | Änderung |
| --- | --- |
| 2026-09-25 | Erstanlage; Hauptkomponenten und eigenständige Ausführbarkeit sowie gemeinsame Strategiedefinition und komponentenübergreifende Kommunikation festgelegt. |
| 2026-09-25 | Python für Fachkern und Backends, TypeScript/React/CSS für die Oberflächen von Designer, Tester und Handelssystem sowie eigenständige Bereitstellung gemeinsamer Bibliotheken festgelegt. |
| 2026-09-25 | Dokumentierte Web-APIs, Webhooks, Austauschbarkeit über versionierte Verträge und Schutz externer Schnittstellen ergänzt. |
| 2026-09-26 | Konfigurierbare Datenspeicherung, unabhängige und gemeinsame Speicherzuordnung sowie SQLAlchemy als gemeinsame Speicherschnittstelle festgelegt. |
| 2026-09-26 | Zweistufige Konfiguration aus INI-Startkonfiguration und gespeicherter Betriebskonfiguration, Suchpfade und Zusammenhang zwischen eigenem Speicher und eigenständiger Startbarkeit festgelegt. |
