# pipwerk Studio – technische Dokumentation

## Dokumentstatus

- status: `draft`
- stand: 2026-10-17
- komponente: `pipwerk-studio`

## 1. Gegenstand

Dieses Dokument beschreibt den technischen Aufbau von pipwerk Studio, die Einrichtung einer Entwicklungsumgebung, den Start im Entwicklungsbetrieb und als Testumgebung und die vorgeschriebenen Prüfungen.

Der beschriebene Stand ist das technische Grundgerüst aus dem Arbeitspaket AP1, erweitert um die dauerhafte Oberflächensprache (WO-2026-10-04-001), die Anzeige des Stands (WO-2026-10-08-001) und den Tooltip der Standanzeige mit Commit und Commit-Datum (WO-2026-10-09-004). Hinzu kommen das Testumgebungsskript, das pipwerk Studio aus genau einem Commit baut und startet (Abschnitt 4a), und die einheitliche Schreibweise des Namens „pipwerk Studio“ in Oberfläche, Ausgaben des Backends und Dokumentation, mit Tests (Abschnitt 6.1). pipwerk Studio zeigt eine leere Designer-Arbeitsfläche, kann die Oberflächensprache zwischen Deutsch und Englisch wechseln, speichert die gewählte Sprache dauerhaft im Backend, prüft, ob das Backend erreichbar ist, und zeigt in der Fußzeile den Stand (Kurzform des Commits), aus dem es läuft; ein Tooltip nennt den vollständigen Commit und dessen Datum. Auf Anforderung zeigt es den Dialog „Über pipwerk Studio“ mit Name, Stand, Lizenz und Adresse des Repositorys (Abschnitt 2.7, req-ui-010). Hinzu kommen im Vorhaben `strategiedesign` (Arbeitspaket `wp01`, Auftrag 02) die Versionierung der Datenbank mit Alembic (Abschnitt 2.1) und die Einstellung „Objektverzeichnis“ mit der Ablage je Objekt, dem Verschieben der Dateien und zwei internen Endpunkten (Abschnitte 2.8 und 5). Mit Auftrag 03 binden das Backend die gemeinsame Python-Bibliothek `pipwerk_domain` ein (Abschnitt 2.9) und bietet die öffentliche Web-API unter `/api/v1/` für Typbeschreibungen, Strategien, Vorlagen, Verwendungen und die Konsistenzprüfung an (Abschnitt 5.2), beschrieben unter `contracts/api/pipwerk-studio/v1/openapi.json`. Die Oberfläche nutzt die Web-API noch nicht und bleibt unverändert; die Ausführung von Strategien ist nicht enthalten. Die Ablage (`object_store.py`) kennt den Inhalt der Dateien nicht; ihn prüfen `object_service.py` und die Bibliothek.

## 2. Aufbau der Komponente

pipwerk Studio liegt im Verzeichnis `components/pipwerk-studio/` und besteht aus zwei Teilen.

| Verzeichnis | Inhalt |
| --- | --- |
| `backend/` | Python-Paket `pipwerk_studio` mit der HTTP-Anwendung, den Backend-Tests und der Python-Lockdatei `uv.lock`; Pfadabhängigkeit auf die gemeinsame Python-Bibliothek `packages/domain-core` (Abschnitt 2.9) |
| `frontend/` | Browseroberfläche mit React und TypeScript, Vite-Konfiguration, Frontend-Tests, Playwright-Tests und der npm-Lockdatei `package-lock.json` |

### 2.1 Backend, Konfiguration und Persistenz

Das Backend ist eine FastAPI-Anwendung. Die Funktion `create_app()` in `backend/src/pipwerk_studio/app.py` erzeugt die Anwendung. Sie wird mit dem ASGI-Server Uvicorn gestartet. `cli.py` ist der eigenständige Startpunkt, `config.py` liest die INI-Startkonfiguration, `settings_service.py` bildet die anwendungsseitige Servicegrenze, `storage.py` kapselt SQLAlchemy und das relationale Speichermodell, `migrate.py` und das Paket `migrations/` versionieren die Datenbank mit Alembic, `object_store.py` legt die Objekte als Dateien ab (Abschnitt 2.8), `object_service.py` liest, prüft, speichert und löscht Strategien und Vorlagen mit der Bibliothek (Abschnitt 2.9), `web_api.py` ist die öffentliche Web-API (Abschnitt 5.2), `body_limit.py` begrenzt die Größe des Bodys (Abschnitt 5.2), `contract.py` erzeugt die Beschreibung der Web-API unter `contracts/api/` (Abschnitt 5.3) und `revision.py` ermittelt den Stand (Abschnitt 2.6).

Die Oberflächensprache ist eine einzige betriebliche Einstellung der Komponente, nicht benutzerbezogen und kein Bestandteil von Strategiedaten. Der Browser ist nicht autoritativ und verwendet dafür weder Local Storage noch Session Storage noch Cookies. Ohne gespeicherten Wert liefert der Service Deutsch (`de`). Die Datenbank enthält höchstens einen zentralen Datensatz in `studio_settings`. Er hält die Sprache und das Objektverzeichnis (Abschnitt 2.8). Wird das Objektverzeichnis gespeichert, bevor ein Datensatz besteht, legt der Service den Datensatz mit der Standardsprache `de` an; das ist der Wert, den das Lesen ohne Datensatz ohnehin liefert.

Enthält der gespeicherte Wert keine unterstützte Sprache (technisch fehlerhafter Speicherinhalt, zum Beispiel nach händischer Änderung der Datenbank), wird keine Ersatzsprache angenommen. Der Lesezugriff schlägt mit HTTP 503 und der Meldung `The stored pipwerk Studio language is invalid.` fehl und der Fehler wird im Backend protokolliert; die Oberfläche zeigt dann die Meldung zum fehlgeschlagenen Lesen (Abschnitt 2.4). Ein gültiger Schreibzugriff ersetzt den fehlerhaften Wert und behebt den Zustand.

SQLAlchemy bleibt hinter der Service-/Infrastrukturgrenze; ORM-Objekte werden nicht als API-Modelle verwendet.

Das Schema der Datenbank wird mit Alembic versioniert. Die Migrationen liegen im Paket `pipwerk_studio.migrations` (`env.py`, `versions/v0001_initial.py`, `versions/v0002_object_directory.py`) und werden mit der Installation ausgeliefert. Es gibt keine Konfigurationsdatei von Alembic mit fester URL: `migrate_database(engine)` in `migrate.py` übergibt Alembic die Verbindung der Engine, die aus der URL der Startkonfiguration entsteht (`config.attributes["connection"]`, Offline-Modus wird nicht unterstützt). Revision `0001` bildet das Schema ab, das vor Alembic beim Start angelegt wurde (Tabelle `studio_settings` mit `id` und `language`). Revision `0002` ergänzt die Spalte `object_directory` (Text, NULL erlaubt; ohne Wert gilt der Standard). `create_studio_engine()` ruft beim Start `migrate_database()` auf; es gibt kein `create_all` mehr. Drei Ausgangslagen sind abgedeckt:

| Datenbank beim Start | Vorgehen |
| --- | --- |
| neu (keine Tabelle) | alle Migrationen laufen |
| Schema vor Alembic (Tabelle `studio_settings` mit genau den Spalten `id` und `language`, keine Versionstabelle `alembic_version`) | wird als Revision `0001` erkannt (`stamp`), dann auf den neuesten Stand gebracht; die gespeicherte Sprache bleibt erhalten |
| aktuell | keine Änderung |

Eine Tabelle `studio_settings` ohne Versionstabelle mit anderen Spalten und eine Datenbank, deren Revision dieser Stand nicht kennt (zum Beispiel von einer neueren Version), lässt der Start mit `DatabaseMigrationError` und Exitcode 1 scheitern; die Meldung ist fest und nennt weder Pfad noch Inhalt, die Datenbank bleibt unverändert. Alle Migrationen eines Starts laufen mit der Versionstabelle in einer einzigen Transaktion (`migrate_database()`). Scheitert eine, wird die Transaktion zurückgenommen: Die Datenbank ist danach, wie sie vor dem Start war (ein bisheriges Schema bleibt ohne Versionstabelle mit erhaltener Sprache, eine neue Datenbank bleibt ohne Tabellen), und der nächste Start beginnt von vorn. Damit das auf SQLite gilt, nimmt `migrate_database()` genau eine Verbindung aus der übergebenen Engine (keine eigene Engine und keine Unterscheidung nach der Form der URL). Nur für diese Verbindung wird bei SQLite die Transaktionssteuerung des Treibers `sqlite3` abgeschaltet (`execution_options(isolation_level="AUTOCOMMIT")`); die Migration führt selbst `BEGIN IMMEDIATE` aus, ruft Alembic mit dieser Verbindung auf und beendet mit `COMMIT` beziehungsweise bei einem Fehler mit `ROLLBACK`. Ohne das würde der Treiber DDL-Anweisungen sofort festschreiben. `BEGIN IMMEDIATE` nimmt die Schreibsperre sofort; startet ein zweiter Prozess gleichzeitig, wartet er (Wartezeit 30 Sekunden) und findet danach den migrierten Stand vor. Beim Zurückgeben der Verbindung an den Pool stellt SQLAlchemy die Standardeinstellung des Treibers wieder her (ein Test prüft `isolation_level == ""` danach); weil dieselbe Verbindung der Engine benutzt wird, bleibt auch eine Datenbank im Speicher mit ihrem Schema erhalten. Bei anderen Datenbanken als SQLite gilt die übliche Transaktion von SQLAlchemy. Die Engine des Betriebs (`create_studio_engine()`) bleibt beim Standardverhalten des Treibers (die Transaktion beginnt erst beim Schreiben): Gleichzeitige Schreibzugriffe im Prozess warten auf die Sperre der Datei, statt sofort mit „database is locked“ zu scheitern. Einzige Ausnahme sind SQLite-Datenbanken im Speicher (`sqlite://`, `:memory:` und URI mit `mode=memory`): Sie verwenden `StaticPool`, damit alle Threads dieselbe Verbindung und damit dieselbe Datenbank sehen; sonst bekäme jeder Thread eine eigene, leere. Das ist für Tests und Versuche gedacht, nicht für den Betrieb mit gleichzeitigen Zugriffen. Der Fehler wird als `DatabaseMigrationError` gemeldet, der Start endet mit Exitcode 1 und der festen Meldung „A migration of the pipwerk Studio database schema failed. The changes of this start were rolled back.“, die weder Ausnahmetext noch Pfad nennt. Ein Fehler beim Aufbau der Verbindung (Datenbank nicht erreichbar) ist davon getrennt: Er bleibt ein Fehler von SQLAlchemy und wird als Problem der Datenbankverbindung gemeldet. Bei Datenbanken ohne transaktionale DDL-Anweisungen ist die Rücknahme nicht zugesichert. Die Migrationen sind an einer Testdatenbank geprüft (Abschnitt 6.1), auch mit einem simulierten Fehler in Revision `0002`; Rückwärtsmigrationen (`downgrade`) sind vorhanden, aber nicht Teil der Prüfungen. Eine Sicherung vor einer Aktualisierung ist Sache des Betreibers. Alembic schreibt über das Modul `logging` Meldungen der Stufe INFO; das Backend konfiguriert die Protokollierung nicht, sie bleiben unsichtbar.

### 2.2 Zweistufige Konfiguration

Die INI-Startkonfiguration enthält ausschließlich die SQLAlchemy-Datenbank-URL:

```ini
[database]
url = sqlite:///./pipwerk-studio.db
```

pipwerk Studio startet nicht ohne gültige INI-Startkonfiguration (Nutzerentscheidung vom 2026-10-06, gilt für pipwerk Studio). Die INI gehört zur Installation und muss mindestens die für den Start erforderliche Datenbankverbindung definieren. Eine implizite Ersatzdatenbank bei fehlender INI gibt es nicht. Ohne `-c` und ohne Datei an allen Suchorten endet der Start mit Exitcode 1 und einer Meldung, die die durchsuchten Orte und den Parameter `-c <PATH>` nennt:

```text
pipwerk-studio: No startup configuration found. pipwerk Studio does not start without one. Searched: <Suchorte>. Provide a startup configuration file with -c <PATH>.
```

Als ungültig gelten außerdem eine fehlende Datei bei `-c`, eine nicht lesbare oder nicht auswertbare Datei, ein fehlender Abschnitt `[database]`, ein fehlender oder leerer (auch nur aus Leerzeichen bestehender) Eintrag `url` und eine `url`, mit der keine Datenbank-Engine erzeugt werden kann oder die Datenbank nicht erreichbar ist. Der Start über `create_app()` ohne Argument (zum Beispiel `uvicorn --factory`) verwendet dieselbe Suche und bricht bei fehlender Konfiguration mit `StartupConfigError` ab.

Ein vollständiges Beispiel liegt in `backend/pipwerk-studio.example.ini`. Die Sprache steht ausdrücklich nicht in der INI, sondern im konfigurierten Speicher. Das gilt ebenso für das Objektverzeichnis (Abschnitt 2.8); die INI bleibt unverändert.

`config.py` gibt der Anwendung zusätzlich die Herkunft der Startkonfiguration (`ConfigOrigin`) weiter: `load_startup_config()` liefert `StartupConfig` mit `database_url` und `origin`. `system` gilt, wenn die Datei am systemweiten Suchort gefunden wurde (`/etc/pipwerk` beziehungsweise `%PROGRAMDATA%\pipwerk`), `user` für jeden anderen Suchort und `explicit` für eine mit `-c` angegebene Datei, auch wenn sie am systemweiten Ort liegt. `cli.py` übergibt die Herkunft an `create_app(…, config_origin=…)`; ohne Angabe gilt `explicit`. Die Herkunft bestimmt nur den Standard des Objektverzeichnisses.

Eine mit `-c <PATH>` angegebene Datei hat höchste Priorität. Ohne `-c` wird genau die erste vorhandene Datei namens `pipwerk-studio.ini` in dieser Reihenfolge verwendet; Inhalte werden nicht zusammengeführt:

1. `$HOME/pipwerk/etc/pipwerk-studio.ini`
2. `$HOME/.config/pipwerk/pipwerk-studio.ini`
3. `/etc/pipwerk/pipwerk-studio.ini`

Unter Windows gelten entsprechend `%USERPROFILE%\pipwerk\etc`, `%APPDATA%\pipwerk` und `%PROGRAMDATA%\pipwerk`. Eine explizit angegebene fehlende, unlesbare, nicht auswertbare oder unvollständige Datei beendet den Start mit einer Fehlermeldung. Ist eine der Umgebungsvariablen `HOME`, `USERPROFILE`, `APPDATA` oder `PROGRAMDATA` nicht gesetzt, leer oder kein absoluter Pfad, entfallen die davon abhängigen Suchorte; es werden nie Pfade relativ zum Startverzeichnis durchsucht.

### 2.3 Oberfläche

Die Oberfläche ist eine React-Anwendung in TypeScript. Vite dient im Entwicklungsbetrieb als Entwicklungsserver und erzeugt bei Bedarf die auslieferbaren Dateien.

Die Oberfläche besteht aus folgenden Bestandteilen:

| Datei | Aufgabe |
| --- | --- |
| `src/main.tsx` | Startpunkt; bindet Übersetzung, TanStack Query und die Anwendung ein |
| `src/App.tsx` | Seitenaufbau aus Kopfzeile, Arbeitsfläche und Fußzeile; setzt das Attribut `lang` des Dokuments auf die gewählte Sprache; enthält die Schaltfläche „Über pipwerk Studio“ rechts neben der Sprachauswahl und hält den Zustand „offen“ des Dialogs (Abschnitt 2.7) |
| `src/DesignerCanvas.tsx` | leere Designer-Arbeitsfläche auf Grundlage von React Flow |
| `src/LanguageSelect.tsx` | Auswahlfeld für die Oberflächensprache; zeigt einen Fehlerzustand, wenn das Speichern fehlschlägt |
| `src/useStudioLanguage.ts` | Lesen und Schreiben der Oberflächensprache als Serverzustand mit TanStack Query |
| `src/settingsApi.ts` | Abruf und strenge Prüfung der Antworten der Spracheinstellungs-Schnittstelle |
| `src/BackendStatus.tsx` | Anzeige, ob das Backend erreichbar ist |
| `src/api.ts` | Abruf und Prüfung der Antwort der Verbindungsprüfung |
| `src/RevisionDisplay.tsx` | Anzeige des Stands in der Fußzeile rechts neben dem Backend-Status, mit Tooltip und zugänglicher Beschreibung (Commit und Commit-Datum in Ortszeit des Browsers) |
| `src/revisionApi.ts` | Abruf und strenge Prüfung der Antwort der Stand-Schnittstelle (drei Felder, Invarianten, Format des Datums) |
| `src/timestamp.ts` | Prüfung eines Zeitstempels auf Muster, echtes Kalenderdatum und gültige Uhrzeit (`isTimestamp`); gemeinsam verwendet von `src/revisionApi.ts`, `src/buildRevision.ts` und `buildinfo/gitRevision.ts` |
| `src/commitDate.ts` | Zerlegung eines Zeitstempels in Jahr, Monat, Tag, Stunde und Minute in der Ortszeit des Browsers (`localParts`); gemeinsam verwendet von `src/RevisionDisplay.tsx` und `src/AboutDialog.tsx` |
| `src/AboutDialog.tsx` | Dialog „Über pipwerk Studio“ mit den Eigenschaften `open` und `onClose` (Abschnitt 2.7) |
| `src/buildRevision.ts` | Lesen und erneutes Prüfen des beim Bau eingesetzten Stands (`parseBuildRevision`, `buildRevision`) |
| `src/repository.ts` | Adresse des Repositorys aus dem Feld `repository` der `package.json` mit Prüfung (`parseRepositoryUrl`, `repositoryUrl`) |
| `src/vite-env.d.ts` | Typangabe des beim Bau eingesetzten Werts `__PIPWERK_STUDIO_BUILD_REVISION__` |
| `buildinfo/gitRevision.ts` | Ermittlung von Kennung und Datum des Commits beim Bau (`lookupGitRevision`); läuft nur in Node.js, nie im Browser |
| `vite.config.ts` | Konfiguration von Vite: Weiterleitung von `/api`, Einsetzen des Stands beim Bau, Freigabe von `LICENSE` für den Entwicklungsserver, Testeinstellungen |
| `playwright.config.ts` | Konfiguration der Browsertests: Bau in `dist-e2e` und Auslieferung mit `vite preview` (Abschnitt 6.3) |
| `src/i18n.ts` | Einrichtung von i18next mit den unterstützten Sprachen |
| `src/locales/de.json`, `src/locales/en.json` | deutsche und englische Oberflächentexte |
| `src/styles.css` | Gestaltung der Oberfläche |

Die Arbeitsfläche enthält keine Knoten und keine Verbindungen. React-Flow-Objekte werden in diesem Stand weder erzeugt noch gespeichert.

### 2.4 Mehrsprachigkeit

Alle sichtbaren Texte der Oberfläche werden über Übersetzungsschlüssel aus den Dateien in `src/locales/` geladen. Beide Dateien müssen dieselben Schlüssel enthalten; ein Frontend-Test prüft das.

Der Produktname „pipwerk Studio“ wird nicht übersetzt. Die Sprachnamen im Auswahlfeld werden in ihrer eigenen Sprache angezeigt, also „Deutsch“ und „English“.

Die Oberflächensprache wird vom Backend gelesen und dort dauerhaft gespeichert (Abschnitt 2.1). Ist noch nichts gespeichert, ist Deutsch eingestellt. Der Hook `useStudioLanguage` leitet die angezeigte Sprache, den Zustand der Auswahl und die Meldung an einer Stelle aus dem Lesezustand (TanStack Query) und dem Speicherzustand (Mutation) ab. Die Auswahl und die Texte zeigen immer dieselbe Sprache. Eine „bestätigte“ Sprache ist die zuletzt vom Backend gelesene oder nach dem Speichern zurückgegebene Sprache.

| Zustand | Angezeigte Sprache | Auswahl | Meldung | Test |
| --- | --- | --- | --- | --- |
| erstes Lesen läuft | Deutsch (Standard) | deaktiviert | keine | A1 |
| erstes Lesen erfolgreich | gelesene Sprache | bedienbar | keine | A2 |
| erstes Lesen fehlgeschlagen (Fehler oder Zeitbegrenzung) | Deutsch (Standard) | bedienbar | Lesefehler | A3, A4 |
| erneutes Lesen läuft, noch keine Sprache bestätigt (Fensterfokus, Wiederverbindung) | Deutsch (Standard) | deaktiviert | keine; schlägt es wieder fehl, kehrt der Lesefehler zurück | A5 |
| erneutes Lesen läuft nach „Speichern fehlgeschlagen, keine Sprache bestätigt“ | Deutsch (Standard) | deaktiviert | Speicherfehler ohne bestätigte Sprache bleibt | B4 |
| Speichern läuft | gewählte Sprache | deaktiviert (nie zwei Speicheranfragen gleichzeitig) | keine | B1, E1 |
| Speichern erfolgreich | gespeicherte Sprache | bedienbar | keine (ein vorheriger Lese- oder Speicherfehler entfällt) | B2, B4, E2 |
| Speichern fehlgeschlagen (Fehler oder Zeitbegrenzung), Sprache bestätigt | bestätigte Sprache | bedienbar | Speicherfehler | B3, B5 |
| Speichern fehlgeschlagen, keine Sprache bestätigt | Deutsch (Standard) | bedienbar | Speicherfehler mit Hinweis, dass die gespeicherte Sprache nicht gelesen werden konnte | B4 |
| Speichern wird wiederholt | gewählte Sprache | deaktiviert | keine, bis das Ergebnis vorliegt | E2 |
| späteres Lesen erfolgreich, Sprache bestätigt | vom Backend gemeldete Sprache | unverändert | keine | C1 |
| späteres Lesen fehlgeschlagen, Sprache bestätigt | bestätigte Sprache | unverändert | keine | C2 |
| späteres Lesen erfolgreich nach fehlgeschlagenem ersten Lesen | gelesene Sprache | bedienbar | Lesefehler entfällt | C3 |
| späteres Lesen erfolgreich nach „Speichern fehlgeschlagen, keine Sprache bestätigt“ | gelesene Sprache | bedienbar | wechselt zum Speicherfehler mit bestätigter Sprache | C4 |
| Lesen läuft, Speichern ist erfolgreich | gespeicherte Sprache; die ältere Antwort wird verworfen | bedienbar | keine | D1 |
| Lesen startet während des Speicherns, Speichern ist erfolgreich | gespeicherte Sprache; die ältere Antwort wird verworfen | bedienbar | keine | D2 |
| Lesen endet während des Speicherns | gewählte Sprache bis zum Ende des Speicherns; danach bei Fehler die gelesene Sprache | deaktiviert, danach bedienbar | keine, danach Speicherfehler | D3 |
| Lesen läuft beim Beginn des Speicherns, Speichern schlägt fehl | bestätigte Sprache; die Antwort des Lesens wird danach übernommen, es wird nichts abgebrochen | bedienbar | Speicherfehler | D4 |

Beim Erfolg eines Speicherns werden laufende Leseanfragen abgebrochen; ein Abbruch ist kein Fehler und erzeugt keine Meldung. Eine ältere Antwort kann dadurch die gespeicherte Sprache nicht überschreiben. Nach einem fehlgeschlagenen Speichern wird nichts abgebrochen, weil eine laufende Leseanfrage dann den tatsächlichen Zustand des Backends meldet. Nach dem Speichern ist die Antwort des Backends der bestätigte Zustand. Das automatische erneute Lesen löst keine Schreibaktion aus; während des Speicherns wird keine Meldung angezeigt. Die Kennungen der Tabelle stehen in den Testnamen in `src/LanguageSelect.test.tsx`.

Jede Anfrage der Oberfläche an die Spracheinstellungs-API (Lesen und Speichern) hat eine feste Zeitbegrenzung von 10 Sekunden (`LANGUAGE_REQUEST_TIMEOUT_MS` in `src/settingsApi.ts`, nicht umgebungsabhängig). Das Backend ist ein lokaler Prozess, der eine einzelne Datenbankzeile liest oder schreibt; eine längere Wartezeit gilt deshalb als Fehler. Ohne Zeitbegrenzung bliebe die Auswahl bei einer nie beantworteten Anfrage dauerhaft deaktiviert. Die Anfragen werden unabhängig vom Online-Zustand gesendet, den der Browser meldet (`networkMode: 'always'` bei Abfrage und Mutation der Sprache in `src/useStudioLanguage.ts`; der gemeinsame QueryClient bleibt unverändert): Der Hintergrunddienst ist der eigene Backendprozess der Komponente, und der Internetzustand des Browsers sagt nichts über seine Erreichbarkeit. Sonst würde TanStack Query eine Anfrage im Zustand „offline“ gar nicht senden und der Timer nie starten. Die Zeitbegrenzung gilt daher in jedem Fall (Tests A6 und B6). Eine Zeitbegrenzung ohne `AbortSignal.any` verbindet das Abbruchsignal des Aufrufers und das der Zeitbegrenzung über einen eigenen `AbortController`. Läuft die Zeit ab, wird die Anfrage abgebrochen und wie jeder andere Fehler dieser Anfrage behandelt (Lese- bzw. Speicherfehler, kein eigener Meldungstext). Nach einem abgelaufenen Speichern ist unklar, ob das Backend die Änderung noch übernommen hat; die Oberfläche zeigt die zuletzt bestätigte Sprache und gleicht sich beim nächsten erfolgreichen Lesen mit dem Backend ab.

Der Browser speichert die Sprache weder in Local Storage noch in Session Storage noch in Cookies.

### 2.5 Verbindung zwischen Oberfläche und Backend

Die Oberfläche ruft beim Laden die Verbindungsprüfung des Backends mit TanStack Query ab. Sie prüft, ob die Antwort genau den erwarteten Inhalt hat. Das Ergebnis wird in der Fußzeile angezeigt. Bei einem HTTP-Fehler, einem Netzwerkfehler oder einer unerwarteten Antwort zeigt die Oberfläche an, dass das Backend nicht erreichbar ist.

Im Entwicklungsbetrieb ruft der Browser nur den Vite-Entwicklungsserver auf. Vite leitet alle Anfragen unter `/api` an das Backend weiter. Browser und Backend verwenden dadurch aus Sicht des Browsers dieselbe Adresse. Eine CORS-Freigabe im Backend ist deshalb nicht nötig und nicht eingerichtet.

### 2.6 Anzeige des Stands

Die Fußzeile zeigt rechts neben dem Backend-Status den Stand, aus dem pipwerk Studio läuft: die ersten 7 Zeichen des Git-Commits. Auf Deutsch lautet die Anzeige „Stand: <kurzform>“, auf Englisch „Revision: <kurzform>“; ein Sprachwechsel schaltet die Bezeichnung um. Die Texte stehen unter dem Schlüssel `revision` in `de.json` und `en.json`. Lässt sich der Stand nicht ermitteln, erscheint „Stand: unbekannt“ beziehungsweise „Revision: unknown“ ohne Tooltip.

Fährt man mit dem Mauszeiger über die Standanzeige, erscheint ein Tooltip mit dem vollständigen Commit (40 Zeichen) und dem Committer-Datum dieses Commits. Auf Deutsch lautet er „Commit <hash> vom TT.MM.JJJJ, hh:mm Uhr“, auf Englisch „Commit <hash> from YYYY-MM-DD hh:mm“; die Uhrzeit hat das 24-Stunden-Format und ist die Ortszeit des Browsers. Ist das Datum nicht ermittelbar, lautet er „Commit <hash>“. Ein Sprachwechsel schaltet den Tooltip um. Die Texte stehen unter den Schlüsseln `revision.commit` und `revision.commitAt` in `de.json` und `en.json`.

Architekturentscheidung (Softwarearchitekt, WO-2026-10-08-001):

- Das Backend ermittelt den Stand einmal beim Erzeugen der Anwendung in `create_app()`, nicht je Anfrage. Der Stand ändert sich während eines Prozesses nicht; der Prozess läuft aus dem Stand, der beim Start ausgecheckt war. Eine Ermittlung je Anfrage würde den Stand eines später veränderten Arbeitsbereichs melden, aus dem der Prozess gar nicht läuft, und für jede Anfrage einen Unterprozess starten.
- Die Ermittlung (`revision.py`) führt `git -C <Verzeichnis des Pakets pipwerk_studio> rev-parse HEAD` als Unterprozess mit fester Argumentliste, ohne Shell und mit einer Zeitbegrenzung von 5 Sekunden aus. Gültig ist nur eine Ausgabe aus genau 40 Hexadezimalzeichen in Kleinbuchstaben; die Kurzform sind deren erste 7 Zeichen. `--short` wird nicht verwendet, weil Git die Kurzform bei Mehrdeutigkeit verlängert, die Anzeige aber genau 7 Zeichen hat.
- Jeder Fehler (Git nicht vorhanden, kein Git-Arbeitsbereich, Zeitüberschreitung, Exitcode ungleich 0, ungültige Ausgabe) ergibt „nicht ermittelbar“. Das Backend startet und arbeitet dann normal und schreibt genau eine Warnung ins Protokoll. Die Warnung nennt nur eine feste, allgemeine Ursache (zum Beispiel „Git could not be run“); sie enthält weder Bestandteile der Git-Ausgabe (stdout, stderr) noch den Text einer Ausnahme noch einen Pfad. Ein Test je Fehlerweg belegt das (Abschnitt 6.1).
- Die Ermittlung ist über den optionalen Parameter `revision_lookup` von `create_app()` austauschbar, damit Tests ohne echtes Git deterministisch sind. `lookup_git_revision()` nimmt das zu prüfende Verzeichnis als optionalen Parameter (Standard: Verzeichnis des Pakets); nur Tests übergeben ein anderes.
- Die Oberfläche ruft den Stand über die interne Schnittstelle `GET /api/studio/revision` (Abschnitt 5) mit TanStack Query ab. `/api/health` antwortet unverändert mit `{"status": "ok"}`.
- Solange der Abruf läuft, fehlschlägt, eine ungültige Antwort liefert oder `null` liefert, zeigt die Oberfläche „unbekannt“ beziehungsweise „unknown“ ohne Tooltip und ohne Beschreibung. Die Anzeige trägt bewusst nicht die Rolle `status`, die allein dem Backend-Status gehört.

Der Stand ist keine Versionsnummer und kein Build-Datum. Der Tooltip nennt das Datum des Commits, nicht den Zeitpunkt des Builds oder des Starts.

Architekturentscheidung (Softwarearchitekt, WO-2026-10-09-004):

- Ermittlung im Backend, weiterhin einmal in `create_app()` und nicht je Anfrage. Der bestehende Aufruf `git rev-parse HEAD` liefert den Hash. Nur wenn er einen gültigen Hash (genau 40 Hexadezimalzeichen in Kleinbuchstaben) liefert, folgt ein zweiter Unterprozess für das Committer-Datum: `git -C <Verzeichnis des Pakets pipwerk_studio> log -1 --no-show-signature --format=%cI <hash>`, mit fester Argumentliste, ohne Shell, mit `stdin=DEVNULL` und einer Zeitbegrenzung von 5 Sekunden wie beim ersten Aufruf.
- Gültig ist nur eine Ausgabe, die nach `strip()` genau ein strenger ISO-8601-Zeitstempel mit Zeitzonenangabe ist (Format von `%cI`, zum Beispiel `2026-10-09T14:52:03+02:00`). Das Backend prüft das Muster und mit `datetime.fromisoformat`, dass die Zeitzone gesetzt ist, und gibt den Wert ohne Umrechnung als ISO-8601-Zeichenkette mit Offset weiter. Die Umrechnung in Ortszeit erfolgt allein im Browser.
- Jeder Fehler der Datumsermittlung (Git nicht ausführbar, Zeitüberschreitung, Exitcode ungleich 0, ungültige Ausgabe, Ausnahme) ergibt „Datum nicht ermittelbar“ (`null`). Der Hash bleibt erhalten, das Backend startet normal und schreibt genau eine Warnung ohne Git-Ausgabe, Ausnahmetext oder Pfad. Ist der Hash nicht ermittelbar, wird kein Datum ermittelt und keine zusätzliche Warnung geschrieben.
- Die Datumsermittlung ist über den optionalen Parameter `commit_date_lookup` von `create_app()` austauschbar (analog zu `revision_lookup`). `lookup_git_commit_date()` nimmt das Verzeichnis als optionalen Parameter (Standard: Verzeichnis des Pakets); nur Tests übergeben ein anderes. `determine_revision()` in `revision.py` verbindet beide Ermittlungen zu einem `Revision` mit Commit und Datum.
- `GET /api/studio/revision` liefert genau drei Felder (Abschnitt 5). Invarianten: `revision` ist genau dann `null`, wenn `commit` `null` ist; `revision` ist die Kurzform (erste 7 Zeichen) von `commit`; `committed_at` ist nur ungleich `null`, wenn `commit` ungleich `null` ist. Das Pydantic-Modell `StudioRevision` erzwingt das mit `extra="forbid"` und `strict`. `/api/health` bleibt unverändert.
- Die Oberfläche (`revisionApi.ts`) akzeptiert nur Antworten mit genau diesen drei Feldern und eingehaltenen Invarianten; `committed_at` muss dem Muster `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$` entsprechen und ein echtes Kalenderdatum mit gültiger Uhrzeit sein (Monat 1 bis 12, Tag gemäß Monatslänge einschließlich Schaltjahr, Stunde 0 bis 23, Minute und Sekunde 0 bis 59, Offset höchstens 23:59). Die Prüfung rechnet selbst und hängt nicht von `Date.parse` ab, weil Browser unmögliche Daten unterschiedlich umrechnen. Jede andere Antwort gilt als ungültig: „unbekannt“ ohne Tooltip.
- Der Tooltip ist das native `title`-Attribut der Standanzeige (`RevisionDisplay`). Zusätzlich verweist `aria-describedby` auf ein verstecktes Element (Attribut `hidden`) mit demselben Text, damit die zugängliche Beschreibung nicht von der Behandlung von `title` durch den Browser abhängt. Dieses Element steht unmittelbar hinter der Standanzeige und verändert die sichtbare Fußzeile nicht. Es gibt kein eigenes Tooltip-Bauteil und keine neue Abhängigkeit; die Standanzeige wird nicht fokussierbar.
- Die Formatierung erfolgt im Browser in Ortszeit mit eigenen, mit Nullen aufgefüllten Bestandteilen (`getFullYear`, `getMonth`, `getDate`, `getHours`, `getMinutes`), nicht über `Intl` oder `toLocaleString`, damit Format und 24-Stunden-Uhr unabhängig von der Browsersprache feststehen.

### 2.7 Dialog „Über pipwerk Studio“

Der Dialog nach req-ui-010 zeigt Name, Stand, Lizenz und die Adresse des Repositorys. Eine Schaltfläche in der Kopfzeile rechts neben der Sprachauswahl öffnet ihn (Beschriftung „Über pipwerk Studio“ beziehungsweise „About pipwerk Studio“). Die Standanzeige in der Fußzeile mit ihrem Tooltip bleibt unverändert (Abschnitt 2.6).

Entscheidungen (Softwarearchitekt, Vorhaben `ablauftest`):

- E1: Der Dialog ist ein reiner Bestandteil der Oberfläche. Verhalten, Endpunkte und Datenformate des Backends bleiben unverändert. Der Dialog stellt keine Anfrage, weder an das Backend noch nach außen.
- E2: Datum und Uhrzeit des Stands sind das Committer-Datum des Commits (`git log -1 --format=%cI`, Abschnitt 2.6). Dialog und Tooltip nennen für denselben Commit dasselbe Datum.
- E3: Kennung und Datum des Commits werden beim Bau der Oberfläche aus Git ermittelt und über die Vite-Option `define` als `__PIPWERK_STUDIO_BUILD_REVISION__` in die ausgelieferten Dateien geschrieben. Die gebaute Oberfläche braucht zur Laufzeit weder Git noch Netz noch Backend. Der Entwicklungsserver ermittelt den Stand bei seinem Start.
- E4: Der Dialog zeigt den Stand nur, wenn Kennung und Datum beide vorliegen und gültig sind. Sonst zeigt er „unbekannt“ beziehungsweise „unknown“. Eine Abfrage bei GitHub oder einem anderen Dienst gibt es nicht.
- E5: Die Ermittlung beim Bau verwendet dieselben Git-Aufrufe und dieselben Prüfregeln wie das Backend (Abschnitt 2.6). Jeder Fehler ergibt „nicht ermittelbar“ und bricht den Bau nicht ab; ein Bau ohne Git bleibt möglich und zeigt „unbekannt“.
- E6: Die Adresse des Repositorys steht genau einmal: im Feld `repository` der `package.json` der Oberfläche (`https://github.com/macodix/pipwerk`).
- E7: Der Lizenztext ist die Datei `LICENSE` im Wurzelverzeichnis des Repositorys. `src/AboutDialog.tsx` importiert sie mit dem Zusatz `?raw`; Vite schreibt den Text beim Bau in die ausgelieferten Dateien. Es gibt keine Kopie und keinen Ersatztext.
- E8: Der Dialog ist das HTML-Element `<dialog>`, geöffnet mit `showModal()`. Der Browser sperrt damit die übrige Oberfläche für Maus, Tastatur und Hilfstechnik und schließt den Dialog mit der Escape-Taste. Ein Klick neben den Dialog schließt ihn nicht. Den Fokus hält der Browser nicht in jedem Fall im Dialog: Ohne eigenen Code verlässt der Fokus den Dialog oder landet auf dem Dialogelement selbst. Das zeigte die Messung in Chromium, Firefox und WebKit. Der Dialog hält den Fokus deshalb selbst (siehe Punkt „Fokus im Dialog“ weiter unten in diesem Abschnitt): Tab und Umschalt+Tab springen an den Enden innerhalb des Dialogs zum anderen Ende.
- E9: Genau ist der Stand in der Testumgebung und in jeder späteren Installation. Der Dialog nennt immer den Commit, der beim Bau der ausgelieferten Oberfläche ausgecheckt war. Genau ist die Angabe, wenn Oberfläche und Backend aus demselben Commit stammen und beim Bau im ganzen Repository keine nicht committeten Änderungen vorlagen. Das Testumgebungsskript stellt das sicher (Abschnitt 4a); der Browsertest weist an der gebauten Oberfläche nach, dass Dialog und Fußzeile den Commit nennen, der beim Bau ausgecheckt war (Abschnitt 6.3). Wie eine spätere Installation das sicherstellt, legt ihre eigene Spezifikation fest.

Aufbau (von oben nach unten): Überschrift (`h2`, zugleich zugänglicher Name des Dialogs über `aria-labelledby`), Name „pipwerk Studio“ (nicht übersetzt), Stand, Lizenz (Name „GNU General Public License, Version 3“ und vollständiger Text), Repository (Verweis mit der Adresse als Text), Schaltfläche „Schließen“. Alle übersetzten Texte stehen unter dem Schlüssel `about` in `de.json` und `en.json` und folgen der Oberflächensprache jederzeit, auch bei offenem Dialog. Die Sprachauswahl ist bei offenem Dialog gesperrt; ändert sich die Sprache trotzdem (die Oberfläche liest sie erneut vom Backend, Abschnitt 2.4), wechseln die Texte des offenen Dialogs sofort, der Dialog bleibt offen und der Fokus bleibt, wo er ist. Name, Lizenzname, Lizenztext und Adresse sind nicht übersetzt.

- Stand: „<Kennung mit 40 Zeichen> vom TT.MM.JJJJ, hh:mm Uhr“ (Deutsch) beziehungsweise „<Kennung> from YYYY-MM-DD hh:mm“ (Englisch), Ortszeit des Browsers, 24-Stunden-Format, Formatierung mit `localParts` aus `src/commitDate.ts` (nicht über `Intl`). Ist der eingesetzte Wert ungültig oder fehlt er, steht „unbekannt“ beziehungsweise „unknown“.
- Lizenz: Name und Text stehen mit `lang="en"` in einem `p` beziehungsweise `pre`. Das `pre`-Element hat eine eigene Bildlaufleiste und ist mit der Tastatur erreichbar (`tabIndex=0`). Zeilenumbrüche und Einrückungen bleiben wie in `LICENSE`.
- Repository: `a`-Element mit `href` gleich der Adresse, `target="_blank"` und `rel="noopener noreferrer"`. Besteht die Adresse die Prüfung in `src/repository.ts` nicht (Muster `^https://github\.com/[A-Za-z0-9-]+/[A-Za-z0-9._-]+$`), steht „unbekannt“ beziehungsweise „unknown“ ohne Verweis.
- Öffnen und Schließen: `src/App.tsx` hält den Zustand „offen“. `src/AboutDialog.tsx` ruft in einem Effekt `showModal()` beziehungsweise `close()` auf und setzt nach `showModal()` den Fokus ausdrücklich auf „Schließen“ (das Attribut `autoFocus` wirkt hier nicht, weil der Dialog beim Einhängen noch nicht angezeigt wird). „Schließen“ ruft `close()` auf; die Escape-Taste löst `cancel` aus, den der Dialog nicht unterdrückt. Beide Wege enden im Ereignis `close`, das `onClose` aufruft. Andere Wege zum Schließen gibt es nicht (`closedby` ist nicht gesetzt). `App.tsx` setzt den Fokus nach dem Schließen ausdrücklich auf die Schaltfläche „Über pipwerk Studio“.
- Fokus im Dialog: `src/AboutDialog.tsx` hört, solange der Dialog offen ist, auf die Taste Tab (Ereignis `keydown` am Dokument). Die fokussierbaren Elemente bestimmt es bei jedem Tastendruck mit `a[href], button:not([disabled]), [tabindex="0"]` in der Reihenfolge des Dokuments: Lizenzfeld (erstes Element), Verweis auf das Repository, Schaltfläche „Schließen“ (letztes Element). Der Verweis fehlt, wenn die Adresse ungültig ist (siehe „Repository“); das erste Element ist immer das Lizenzfeld, das letzte immer „Schließen“. Liegt der Fokus auf dem letzten Element, geht er mit Tab auf das erste; liegt er auf dem ersten, geht er mit Umschalt+Tab auf das letzte (`preventDefault`). Liegt der Fokus nicht im Dialog (auf dem Dokument oder auf dem Dialogelement selbst), führt Tab auf das erste und Umschalt+Tab auf das letzte Element. Innerhalb des Dialogs bewegt der Browser den Fokus wie üblich.
- Größe: höchstens 48rem breit und 16px Abstand zum Fensterrand, höchstens 90 % der Fensterhöhe; bei kleinem Fenster schrumpft das Lizenzfeld zuerst (`src/styles.css`).

Ermittlung beim Bau (`buildinfo/gitRevision.ts`, `lookupGitRevision(directory)`): `directory` ist das Verzeichnis von `vite.config.ts`, aus `import.meta.url` berechnet. Erster Aufruf `git -C <directory> rev-parse HEAD`; gültig ist nur eine Ausgabe aus genau 40 Hexadezimalzeichen in Kleinbuchstaben (nach Entfernen des abschließenden Zeilenumbruchs). Nur bei gültiger Kennung folgt `git -C <directory> log -1 --no-show-signature --format=%cI <commit>`; gültig ist nur ein Zeitstempel mit Zeitzone, der `isTimestamp` aus `src/timestamp.ts` besteht. Beide Aufrufe laufen mit `execFileSync`, fester Argumentliste, ohne Shell, Eingabe `ignore`, Zeitbegrenzung 5 Sekunden und Ausgabe als Text; die Fehlerausgabe von Git wird verworfen. Ergebnis ist `{ commit, committedAt }` oder `null`. Jeder Fehler (Git nicht ausführbar, kein Git-Arbeitsbereich, Zeitüberschreitung, Exitcode ungleich 0, ungültige Ausgabe, Ausnahme) ergibt `null` und genau eine Warnung auf der Fehlerausgabe mit festem Text (`pipwerk Studio: revision for the About dialog could not be determined`) ohne Git-Ausgabe, Ausnahmetext, Pfad und Kennung. `vite.config.ts` ruft die Funktion einmal beim Laden der Konfiguration auf und setzt das Ergebnis mit `define` ein; das gilt für `vite build`, `vite` und `vite preview`. Vite lädt die Konfiguration im Entwicklungsbetrieb neu, wenn sich `vite.config.ts` oder eine davon geladene Datei ändert (`buildinfo/gitRevision.ts`, `src/timestamp.ts`); das Verhalten von Vite ist nicht am Rechner geprüft. `src/buildRevision.ts` prüft den Wert im Browser erneut (genau die Felder `commit` und `committedAt`) und liefert sonst `null`.

Abbruch des Baus ohne `LICENSE`: Fehlt die Datei `LICENSE` im Wurzelverzeichnis des Repositorys, schlägt der Import fehl. `npm run build` und `npm test` enden mit einem Fehler, der Entwicklungsserver meldet den Fehler beim Laden der Seite. Gebaut wird die Oberfläche deshalb aus dem Repository, nicht aus dem Verzeichnis der Komponente allein; die gebaute Oberfläche enthält den Text selbst.

Zugriff des Entwicklungsservers auf `LICENSE`: Der Entwicklungsserver liefert Dateien außerhalb des Verzeichnisses `frontend` nur aus, wenn sie freigegeben sind. `vite.config.ts` ergänzt `server.fs.allow` neben der Standardfreigabe (`searchForWorkspaceRoot`) um die Datei `LICENSE`, als Pfad relativ zur Konfigurationsdatei berechnet. Vite vergleicht Dateieinträge der Liste genau und prüft den Import mit `?raw` sowohl mit als auch ohne den Zusatz; die Liste enthält deshalb die Datei und dieselbe Datei mit dem Zusatz `?raw`. Ein Verzeichnis wird nicht freigegeben. Der Test `buildinfo/viteConfig.test.ts` weist nach, dass der Entwicklungsserver `LICENSE` liefert und eine andere Datei des Wurzelverzeichnisses ablehnt.

Grenze im Entwicklungsbetrieb: Der Entwicklungsserver liefert geänderte Dateien sofort aus, auch nicht committete. pipwerk Studio läuft dort nicht notwendig aus einem Commit. Backend und Entwicklungsserver ermitteln den Stand jeweils bei ihrem Start, der Entwicklungsserver außerdem bei jedem Neuladen der Konfiguration. Deshalb gilt im Entwicklungsbetrieb:

1. Der Dialog nennt den Commit beim letzten Start des Entwicklungsservers, die Fußzeile den Commit beim Start des Backends.
2. Nach einem Wechsel des Commits oder bei nicht committeten Änderungen können beide von dem Code abweichen, der tatsächlich läuft, und voneinander abweichen.
3. Nach einem Neustart beider Prozesse nennen beide den Commit, der dann ausgecheckt ist. Nicht committete Änderungen gehören zu keinem Commit; der laufende Code weicht auch nach dem Neustart vom angezeigten Commit ab, bis die Änderungen committet oder verworfen sind und beide Prozesse erneut gestartet wurden.

### 2.8 Objektverzeichnis

Grundlage ist Abschnitt 4.1 der Spezifikation des Vorhabens `strategiedesign` (req-ui-009, req-ablauf-009). Das Objektverzeichnis ist das Verzeichnis, in dem pipwerk Studio je Objekt (Strategie oder Vorlage) eine Datei ablegt. Die Einstellung ist ein absoluter Pfad in `studio_settings.object_directory`; sie wird in der Servicegrenze `settings_service.py` gelesen und geschrieben.

Standard, solange nichts gespeichert ist (`default_object_directory()`):

| Herkunft der Startkonfiguration | POSIX | Windows |
| --- | --- | --- |
| `system` | `/var/lib/pipwerk/studio/objects` | `%PROGRAMDATA%\pipwerk\studio\objects` |
| `user`, `explicit` | `$HOME/.local/share/pipwerk/studio/objects` | `%LOCALAPPDATA%\pipwerk\studio\objects` |

Ist die dafür nötige Umgebungsvariable (`HOME`, `LOCALAPPDATA`, `PROGRAMDATA`) nicht gesetzt, leer oder nicht absolut, gibt es keinen Standard: Lesen meldet „nicht festgelegt“ (`path` ist `null`), das Schreiben eines Objekts scheitert mit `ObjectDirectoryNotSetError` und einer Meldung ohne Pfad. Der Standard ist der des laufenden Systems; nur Tests übergeben `windows` und `environ`. `is_default` ist wahr, solange nichts gespeichert ist; wird ein Pfad gleich dem Standard gespeichert, ist er gespeichert und `is_default` falsch. Ein gespeicherter Wert, der nicht absolut ist (händisch geänderte Datenbank), wird nicht verwendet: Lesen meldet HTTP 503. Ein Schreiben ohne „verschieben“ behebt den Zustand. Ein Schreiben mit „verschieben“ wird mit HTTP 409 und festem Text abgelehnt (`StoredObjectDirectoryInvalidError`), weil es kein gültiges Verzeichnis gibt, aus dem verschoben werden kann; nichts wird verschoben und gespeichert.

Ablage (`object_store.py`, Klasse `ObjectStore`, ohne Kenntnis des Inhalts):

- Datei `<uuid>.<art>.json`, `<art>` aus `strategy`, `indicator`, `trend`, `rule`, `ruleset`. Der Dateiname entsteht nur aus einer UUID in kanonischer Kleinschreibung (geprüft mit einem festen Muster und `uuid.UUID`) und einer der festen Arten; andere Eingaben werden mit `InvalidObjectIdError` beziehungsweise `InvalidObjectKindError` abgelehnt.
- Funktionen: `create` (neue UUID), `write` (anlegen oder ersetzen), `read_bytes`, `read_text`, `delete`, `list_objects(art)` mit dem Zeitpunkt der letzten Änderung (UTC). Lesen liefert `ReadResult` mit `status` `ok`, `missing` oder `unreadable` und löst dafür keine Ausnahme aus. Eine Datei, die sich nicht lesen lässt oder als Text kein UTF-8 ist, meldet `unreadable`; sie bleibt in der Liste. Mit dem optionalen Parameter `max_bytes` von `read_bytes` und `read_text` meldet eine größere Datei `unreadable`; gelesen werden dann höchstens `max_bytes` plus ein Byte. Die Prüfung des Inhalts und das Kennzeichen „nicht lesbar“ in der Liste liegen in `object_service.py` (Abschnitt 2.9).
- Schreiben: temporäre Datei im selben Verzeichnis (Name beginnt mit `.` und endet mit `.tmp`, passt nie auf das Muster), `fsync`, `os.replace`, danach `fsync` des Verzeichnisses (nicht unter Windows). Schlägt ein Schritt fehl, bleibt die alte Datei unverändert, die temporäre Datei wird entfernt und `ObjectWriteError` (fester Text, ohne Pfad) gemeldet. Eine abgebrochene temporäre Datei wird nicht aufgelistet.
- Fehlt das Verzeichnis, wird es beim ersten Schreiben angelegt (`mode=0o700`, übergeordnete Verzeichnisse mit den üblichen Rechten); die Dateien haben Rechte nur für den Benutzer. Ein vorhandenes Verzeichnis behält seine Rechte. Lesen und Auflisten legen nichts an.
- Andere Dateien werden nicht aufgelistet und nicht verändert. Symbolische Verknüpfungen werden nicht verfolgt: nicht aufgelistet, Lesen und Löschen behandeln sie als nicht vorhanden (`O_NOFOLLOW`, Prüfung mit `lstat`), Schreiben unter ihrem Namen scheitert, ohne die Verknüpfung oder ihr Ziel zu ändern. Dasselbe gilt für ein Verzeichnis mit dem Namen einer Objektdatei.

Ändern des Objektverzeichnisses (`SettingsService.set_object_directory(pfad, move=…)`, `move_objects()` in `object_store.py`):

1. Der Pfad muss absolut sein, höchstens 4096 Zeichen haben und kein Nullzeichen enthalten (`InvalidObjectDirectoryError`, HTTP 422).
2. Ohne „verschieben“ wird nur die Einstellung gespeichert. Dateien im neuen Verzeichnis spielen dann keine Rolle.
3. Mit „verschieben“ gilt das aktuelle Verzeichnis (gespeichert oder Standard) als Quelle. Gibt es keine Quelle oder ist sie nicht vorhanden oder dasselbe Verzeichnis wie das Ziel (`os.path.samefile`), wird nur gespeichert. Sonst werden alle Dateien nach dem Muster verschoben (temporäre Dateien, Verknüpfungen und fremde Dateien bleiben liegen) und erst danach wird die Einstellung gespeichert.
4. Liegt im Ziel schon etwas unter dem Namen einer zu verschiebenden Datei (auch eine Verknüpfung), wird nichts verschoben und die Änderung abgelehnt (`ObjectConflictError`, HTTP 409).
5. Verschoben wird nur eine reguläre Datei und nie überschreibend: Unmittelbar vor dem Verschieben wird mit `lstat` erneut geprüft, dass es eine reguläre Datei ist (auch beim Zurückholen); eine Verknüpfung, die seit dem Auflisten an ihre Stelle getreten ist, lässt die Prüfung scheitern und das Verschieben schlägt fehl. Tritt eine Verknüpfung erst im Zeitfenster zwischen dieser Prüfung und dem Verknüpfen an die Stelle der Datei, wird sie ebenfalls nicht verfolgt (`os.link(…, follow_symlinks=False)`, beim Kopieren Öffnen mit `O_NOFOLLOW`), aber das Verschieben scheitert dann nicht: Unter Linux kommt die Verknüpfung selbst ins neue Verzeichnis und der alte Name wird entfernt. Dort wird sie wie jede Verknüpfung unter einem Objektnamen weder aufgelistet noch gelesen. Eine harte Verknüpfung auf ihr Ziel entsteht nicht. Unter Windows meldet `os.link` keine Unterstützung für `follow_symlinks`; dort wird ohne den Schalter verknüpft, das Verhalten ist nicht geprüft. Eine Datei wird mit `os.link` unter dem neuen Namen angelegt, was bei einem vorhandenen Namen mit `FileExistsError` scheitert, auch wenn die Datei erst nach der Prüfung entstanden ist; danach wird der alte Name entfernt. Ist Verknüpfen nicht möglich (zum Beispiel anderes Dateisystem), wird die Datei in eine temporäre Datei im Zielverzeichnis kopiert, mit `fsync` geschrieben und ebenfalls mit `os.link` unter dem Zielnamen angelegt. Die Zeitpunkte der letzten Änderung bleiben beim Verknüpfen erhalten.
6. Scheitert eine Datei unterwegs (oder das Speichern der Einstellung nach dem Verschieben), werden die schon verschobenen Dateien zurückgeholt (ebenfalls ohne Überschreiben), die alte Einstellung bleibt und der Fehler wird gemeldet (`ObjectMoveError`, HTTP 500). Das Zielverzeichnis, das dafür angelegt wurde, bleibt bestehen. Lässt sich das Zielverzeichnis gar nicht anlegen (zum Beispiel ist ein Teil des Pfades eine Datei), wurde nichts verschoben (`ObjectTargetNotCreatableError`, HTTP 500 mit eigenem Text).
7. Scheitert auch das Zurückholen, meldet `ObjectMoveRollbackError` beide Verzeichnisse (altes und neues) und die Namen der Dateien, die nicht zurückgeholt werden konnten und im neuen Verzeichnis liegen. Die Einstellung bleibt die alte.

Sperren: Der `ObjectStore` besitzt eine Sperre (`threading.RLock`, Eigenschaft `lock`) im Prozess. Jede Funktion der Ablage hält sie, und `set_object_directory` hält sie vom Bestimmen der Quelle bis zum Speichern der Einstellung. Gleichzeitige Änderungen laufen damit nacheinander, und Schreibzugriffe der Ablage warten, bis die Änderung beendet ist; sie schreiben danach in das neue Verzeichnis. Die Sperre gilt nur innerhalb eines Prozesses; mehrere Backend-Prozesse auf demselben Verzeichnis sind nicht gegeneinander gesperrt. Der Dienst `SettingsService` besitzt den `ObjectStore` (`settings_service.object_store`); der Speicher liest das aktuelle Verzeichnis bei jedem Zugriff aus dem Dienst, eine Änderung wirkt also sofort. Eine geöffnete Strategie bleibt geöffnet und wird beim nächsten Speichern in das neue Verzeichnis geschrieben.

### 2.9 Gemeinsame Bibliothek, Objekte und Dokumente

Grundlage sind die Abschnitte 2 (E1, E2, E5, E6), 3.6, 3.7, 4.1 und 4.2 der Spezifikation des Vorhabens `strategiedesign`.

**Einbindung der Bibliothek (E1).** Das Backend bindet die gemeinsame Python-Bibliothek `packages/domain-core` (Paket `pipwerk_domain`, Version 0.1.0) als Pfadabhängigkeit ein: `dependencies` in `backend/pyproject.toml` nennt `pipwerk-domain`, `[tool.uv.sources]` legt den Pfad `../../../packages/domain-core` fest und `editable = true`. `backend/uv.lock` hält die Abhängigkeit mit `source = { editable = "../../../packages/domain-core" }` und der Version `0.1.0` fest; die Bibliothek verlangt nur Pydantic (`==2.13.5`, dieselbe Version wie in der Lockdatei des Backends). Die Bibliothek ist editierbar eingebunden, weil uv den Quelltext einer nicht editierbaren Pfadabhängigkeit nach einer Änderung sonst nicht neu installiert (es beobachtet nur ihre `pyproject.toml`): Eine Änderung an der Bibliothek wirkt so in Tests, Testumgebung und Entwicklungsbetrieb sofort. Der Eintrag in `uv.lock` ist von Hand ergänzt, weil das verfügbare uv (0.5.9) die Lockdatei sonst im Format und in den aufgelösten Paketen verändert (wie bei Alembic, Abschnitt 7); `uv lock --check` und `uv sync --frozen` bestätigen ihn. Das Backend läuft deshalb nur aus einem Arbeitsverzeichnis des Repositorys, in dem auch `packages/domain-core` liegt; `testenv start` prüft das (Abschnitt 4a). Die Bibliothek trägt die Markierung `py.typed`, damit mypy ihre Typen für das Backend nutzt. Das Backend kennt keinen einzelnen Elementtyp und keinen Objekttyp (E2): Typbeschreibungen, die mitgelieferten Vorlagen, Prüfung, Normalisierung und Dokumente kommen aus der Bibliothek. Ein Test durchsucht dazu den Quelltext des Backends nach den Kennungen aller angemeldeten Typen (Abschnitt 6.1). `create_app(…, registry=…)` nimmt ein anderes Elementregister der Bibliothek entgegen (nur Tests); ohne Angabe gilt `default_registry()` mit den mitgelieferten Typen und den Typen der Einstiegspunkte.

**Objekte (`object_service.py`, Klasse `ObjectService`).** Der Dienst liegt zwischen der Ablage (Abschnitt 2.8) und der Web-API (Abschnitt 5.2) und kennt kein HTTP. Er liest und prüft die Dateien, listet die Objekte, speichert, löscht und findet die Verwendungen einer Vorlage. Die Dateien sind die einzige Quelle; es gibt keinen Index und keinen Zwischenspeicher (E5), jede Anfrage liest die Dateien neu.

- Lesen: Eine Datei ist lesbar, wenn sie höchstens `MAX_STORED_FILE_BYTES` groß ist (acht Mal 2 MiB; das größte Dokument, das als Body angenommen wird, ist nach dem Schreiben mit Einrückung größer als sein Body, aber nicht um diesen Faktor), mit `parse_document` der Bibliothek (strenges UTF-8, JSON ohne doppelte Schlüssel und ohne `NaN`, Schema, Begrenzungen) gelesen werden kann, das Feld `format` zur Art in ihrem Dateinamen passt (`pipwerk.<art>`) und ihre Kennung `id` die im Dateinamen ist. Sonst ist sie „nicht lesbar“.
- Eine nicht lesbare Datei erscheint in der Liste mit der Kennung aus dem Dateinamen, dem Zeitpunkt der letzten Änderung und dem Kennzeichen „nicht lesbar“ und wird nie verändert: Lesen, Ersetzen und Löschen über den Dienst scheitern mit `ObjectUnreadableError`, die Verwendungen überspringen sie und zählen sie. Dateien, die keinen Namen einer Objektdatei tragen, und symbolische Verknüpfungen bleiben unbeachtet (Abschnitt 2.8). Wer eine nicht lesbare Datei entfernen will, löscht sie im Dateisystem.
- Speichern (`create`, `replace`): Der Dienst prüft zuerst, dass das `format` des Dokuments zur Art passt (`DocumentKindError`); bei `replace` außerdem, dass `id` die Kennung des Pfads ist (`DocumentIdentifierError`) und dass die Datei vorhanden und lesbar ist (unter der Sperre der Ablage, damit kein Löschen dazwischenkommt). Bei `create` ersetzt eine neue UUID (Version 4) die Kennung im Dokument; ein belegter Dateiname wird nie überschrieben. Dann schreibt `normalize_strategy` beziehungsweise `normalize_template` alle Ausdrücke in der normalisierten Schreibweise der Bibliothek (3.4: „Gespeichert wird die Schreibweise der Kennung“), `write_document` erzeugt den Text, `check_strategy` beziehungsweise `check_template` prüfen das normalisierte Objekt (die Stellen in den Befunden beziehen sich damit auf den gespeicherten Text) und die Ablage schreibt die Datei über eine temporäre Datei (Abschnitt 2.8). Befunde der Prüfung verhindern das Speichern nicht (req-ablauf-005). Der Zeitpunkt der letzten Änderung ist der der Datei; das Dokument enthält keinen. Ist der geschriebene Text größer als `MAX_STORED_FILE_BYTES`, wird nichts gespeichert (`DocumentTooLargeError`).
- Mitgelieferte Vorlagen (E6): `builtin_templates()` der Bibliothek liefert sie. Sie stehen nicht im Objektverzeichnis und nicht in der Liste. Lesen liefert sie, Ersetzen und Löschen scheitern mit `BuiltinObjectError`. Ein Dokument mit der Kennung einer mitgelieferten Vorlage erhält beim Anlegen wie jedes andere eine neue.
- Verwendungen (`usages`): liest alle Dateien aller Arten und nennt die Strategien und Vorlagen, die irgendwo eine Instanz mit `origin.template_id` gleich der Kennung enthalten (in der Strategie, in Elementen und deren Regeln, in enthaltenen Instanzen und Regelwerken beliebig tief). Das Objekt selbst bleibt außen vor; nicht lesbare Dateien werden gezählt.
- Prüfen (`check`): prüft ein Dokument jeder Art wie beim Speichern, aber ohne Normalisierung und ohne zu schreiben, und liefert zusätzlich je Ausdruck die erkannten Namen (`check_strategy_with_names`, `check_template_with_names`, Abschnitt 9.3 der Dokumentation der Bibliothek).
- Fehler des Verzeichnisses: Fehlt das Objektverzeichnis (kein Standard bestimmbar), meldet Schreiben `ObjectDirectoryMissingError`, Lesen und Auflisten sehen ein leeres Verzeichnis. Lässt sich das Verzeichnis nicht auflisten (zum Beispiel ist es eine Datei), meldet der Dienst `ObjectDirectoryUnreadableError`. Schreibt oder löscht die Ablage nicht, meldet er `ObjectWriteFailedError`.

## 3. Voraussetzungen für die Entwicklung

Für die Entwicklung werden folgende Programme benötigt:

| Programm | Version | Herkunft |
| --- | --- | --- |
| Python | 3.14 oder neuer | Ubuntu-Paketquelle (Ubuntu 26.04: Python 3.14) |
| uv | geprüft mit 0.5.9 | Installation nach der Anleitung des Herstellers unter https://docs.astral.sh/uv/ |
| Node.js mit npm | 24 oder neuer | geprüft mit Node.js 24.19.0 und npm 11.17.0 aus der konfigurierten Paketquelle |

Alle Python-Pakete werden von uv in eine eigene virtuelle Umgebung unter `backend/.venv` installiert. Alle Node-Pakete werden von npm in `frontend/node_modules` installiert. Die systemweite Python- und Node-Umgebung wird dabei nicht verändert.

Für die Playwright-Tests werden zusätzlich die Testbrowser von Playwright benötigt (siehe Abschnitt 6.3).

## 4. Einrichtung und Start im Entwicklungsbetrieb

### 4.1 Einrichtung

Die Abhängigkeiten werden genau in den Versionen der Lockdateien installiert:

```sh
cd components/pipwerk-studio/backend
uv sync --frozen

cd ../frontend
npm ci
```

`uv sync --frozen` im Backend installiert auch die gemeinsame Python-Bibliothek aus `packages/domain-core` (editierbar, Abschnitt 2.9); das Repository muss dazu vollständig ausgecheckt sein.

### 4.2 Start

Im Entwicklungsbetrieb laufen Backend und Oberfläche als zwei Prozesse. Beide werden in je einem eigenen Terminal gestartet.

Das Backend wird im Verzeichnis `components/pipwerk-studio/backend` gestartet. Ohne `-c` wird einer der in Abschnitt 2.2 beschriebenen Suchpfade verwendet; ohne gültige INI startet das Backend nicht (Abschnitt 2.2). Das Beispiel kopiert die Beispiel-INI und gibt sie ausdrücklich an:

```sh
cp pipwerk-studio.example.ini pipwerk-studio.ini
uv run --frozen pipwerk-studio -c pipwerk-studio.ini --host 127.0.0.1 --port 8000
```

Die Oberfläche wird im Verzeichnis `components/pipwerk-studio/frontend` gestartet:

```sh
npm run dev
```

Danach ist pipwerk Studio im Browser unter `http://127.0.0.1:5173/` erreichbar.

Die lokal erzeugten Dateien `backend/pipwerk-studio.ini` und `backend/pipwerk-studio.db` (einschließlich `-journal`, `-wal`, `-shm`) werden von `components/pipwerk-studio/.gitignore` ausgeschlossen und können nicht versehentlich committet werden. Versioniert bleibt nur `backend/pipwerk-studio.example.ini`.

Vite leitet Anfragen unter `/api` standardmäßig an `http://127.0.0.1:8000` weiter. Läuft das Backend unter einer anderen Adresse, wird diese beim Start der Oberfläche in der Umgebungsvariable `PIPWERK_STUDIO_BACKEND_URL` angegeben:

```sh
PIPWERK_STUDIO_BACKEND_URL=http://127.0.0.1:8100 npm run dev
```

Beide Server nehmen standardmäßig nur Verbindungen vom eigenen Rechner an. Der Vite-Entwicklungsserver ist nur für die Entwicklung bestimmt und keine Sicherheitsgrenze.

### 4.3 Erzeugen der Oberflächendateien

Der Befehl `npm run build` im Verzeichnis `frontend` prüft zuerst die Typen und schreibt anschließend die auslieferbaren Oberflächendateien nach `frontend/dist`. Dieses Verzeichnis wird nicht versioniert. Der Bau schreibt Kennung und Datum des ausgecheckten Commits und den Text der Datei `LICENSE` aus dem Wurzelverzeichnis des Repositorys in die Dateien (Abschnitt 2.7); er braucht deshalb das Repository und bricht ohne `LICENSE` ab. Ein Start, bei dem das Backend diese Dateien selbst ausliefert, ist noch nicht vorhanden.

## 4a. Start als Testumgebung

Die Testumgebung ist pipwerk Studio, gebaut und gestartet aus genau einem Commit. Das Testumgebungsskript `components/pipwerk-studio/scripts/testenv` (POSIX-Shell) baut die Oberfläche aus dem Arbeitsverzeichnis, in dem das Skript liegt, und startet das Backend aus demselben Arbeitsverzeichnis. Oberfläche und Backend stammen damit aus demselben Commit, den Fußzeile und Dialog nennen (Abschnitt 2.7). Das Arbeitsverzeichnis wird aus dem Pfad des Skripts bestimmt; das Skript wird mit absolutem Pfad aus einem beliebigen Verzeichnis aufgerufen oder mit relativem Pfad, zum Beispiel aus dem Wurzelverzeichnis des Arbeitsverzeichnisses (`components/pipwerk-studio/scripts/testenv …`; so nennt es die Anwenderdokumentation). In beiden Fällen arbeitet es auf dem Arbeitsverzeichnis, in dem es liegt, nicht auf dem aktuellen Verzeichnis des Aufrufs. Es enthält keine festen Ports, Pfade oder Rechnernamen.

```sh
<Arbeitsverzeichnis>/components/pipwerk-studio/scripts/testenv start --frontend-port <port> --backend-port <port> [--host <adresse>]
<Arbeitsverzeichnis>/components/pipwerk-studio/scripts/testenv status
<Arbeitsverzeichnis>/components/pipwerk-studio/scripts/testenv stop
```

Voraussetzungen: Git, Python 3 (Prüfung der Ports und der Erreichbarkeit), `ps`, uv und Node.js mit npm in den Versionen aus Abschnitt 3, ein Zugriff auf die Paketquellen für `uv sync --frozen` und `npm ci`, und zwei freie Ports. Das Arbeitsverzeichnis muss ein Arbeitsverzeichnis von Git sein.

`start`:

1. Prüft die Parameter. `--frontend-port` und `--backend-port` sind Pflicht, ganze Zahlen von 1 bis 65535 und verschieden. `--host` ist die Adresse, an die sich die Oberfläche bindet; ohne Angabe `127.0.0.1`. Das Backend bindet sich immer an `127.0.0.1`.
2. Prüft, dass das Verzeichnis des Skripts in einem Arbeitsverzeichnis von Git liegt, ermittelt dessen Wurzel (`git rev-parse --show-toplevel`) und prüft mit `git status --porcelain` für die ganze Wurzel, also das ganze Repository einschließlich `LICENSE` und der Dateien außerhalb der Komponente, dass es keine nicht committeten Änderungen und keine nicht ignorierten neuen Dateien gibt. Ignorierte Dateien wie `backend/.venv/`, `frontend/node_modules/`, `frontend/dist/` und `.testenv/` sind zulässig. Zum Repository gehört auch die gemeinsame Python-Bibliothek: Eine nicht committete Änderung unter `packages/domain-core/` bricht den Start ebenfalls ab, und die Datei `packages/domain-core/pyproject.toml` muss in der Wurzel vorhanden sein, weil das Backend die Bibliothek als Pfadabhängigkeit braucht (Abschnitt 2.9).
3. Prüft, dass die benötigten Programme vorhanden sind, dass keine laufende Testumgebung verzeichnet ist und dass beide Ports frei sind.
4. Installiert die Abhängigkeiten nach den Lockdateien (`uv sync --frozen`, `npm ci`) und baut die Oberfläche (`npm run build`).
5. Legt unter `components/pipwerk-studio/.testenv/` eine INI-Startkonfiguration mit einer eigenen SQLite-Datei an und speichert das Objektverzeichnis `components/pipwerk-studio/.testenv/objects` der Testumgebung in deren Datenbank (die Umgebung des Backends hat `uv sync --frozen` angelegt; ein kleines Python-Programm aus `backend/.venv/bin/python`, im isolierten Modus `-I`, damit das aktuelle Verzeichnis des Aufrufs nicht nach Modulen durchsucht wird, ruft `SettingsService.set_object_directory(…, move=False)` auf; die INI bleibt unverändert und es gibt keine Umgebungsvariable dafür), und startet das Backend mit `-c` auf `127.0.0.1:<backend-port>` sowie die gebaute Oberfläche mit `vite preview` auf `<host>:<frontend-port>`. `vite preview` leitet Anfragen unter `/api` an das Backend weiter (`PIPWERK_STUDIO_BACKEND_URL`).
6. Wartet, bis `/api/health` über den Port der Oberfläche `{"status": "ok"}` liefert (Zeitbegrenzung 120 Sekunden), und meldet dann die Adresse der Oberfläche.

Abbruchfälle von `start`, jeweils mit Exitcode ungleich 0 und einer Fehlermeldung auf der Fehlerausgabe, die die Ursache nennt:

- ungültige oder fehlende Parameter
- das Verzeichnis des Skripts liegt nicht in einem Arbeitsverzeichnis von Git
- eine nicht committete Änderung oder eine nicht ignorierte neue Datei irgendwo im Repository, auch unter `packages/domain-core/`; die Meldung nennt die ersten betroffenen Dateien
- `packages/domain-core/pyproject.toml` fehlt in der Wurzel des Arbeitsverzeichnisses (Meldung „packages/domain-core is missing in the working directory; the backend needs the shared library“). Bei diesen vier Abbruchfällen bis hierher wurde nichts angelegt, installiert, gebaut oder gestartet.
- ein benötigtes Programm fehlt, es läuft schon eine Testumgebung oder ein Port ist belegt
- die Installation oder der Bau scheitert, ein Prozess endet beim Start oder `/api/health` antwortet nicht rechtzeitig. Das Skript gibt die letzten Zeilen der Protokolle aus, beendet die gestarteten Prozesse und entfernt `.testenv/`.

`status` nennt, ob die Testumgebung läuft, und ihre Ports (Exitcode 0 bei laufender, 1 bei nicht oder nur teilweise laufender Testumgebung). `stop` beendet beide Prozesse (zuerst mit SIGTERM, nach 10 Sekunden mit SIGKILL) und entfernt `.testenv/`, also auch die Datenbank und das Objektverzeichnis der Testumgebung mit den darin gespeicherten Strategien und Vorlagen. Wurde das Objektverzeichnis in der Testumgebung auf ein anderes Verzeichnis geändert, bleiben die Dateien dort erhalten; `stop` entfernt nur `.testenv/`. Prozesskennungen, Ports, Protokolle (`backend.log`, `frontend.log`), die INI, die Datenbank und das Objektverzeichnis (`objects/`) liegen in `components/pipwerk-studio/.testenv/`; das Verzeichnis steht in `components/pipwerk-studio/.gitignore`.

Adressen in der Testumgebung:

- Oberfläche: `http://<host>:<frontend-port>/`. Diese Adresse nennen `start` am Ende und `status`. Den Wert `<host>` bildet die Funktion `url_host` aus `--host` nach folgender Regel: `0.0.0.0` wird zu `127.0.0.1`, `::` wird zu `[::1]`, jede andere IPv6-Adresse (jeder Wert mit Doppelpunkt) steht in eckigen Klammern, jeder andere Wert gilt unverändert. `0.0.0.0` und `::` sind keine Adressen zum Aufrufen; die Oberfläche ist dann auf dem eigenen Rechner unter `127.0.0.1` beziehungsweise `[::1]` und von anderen Rechnern unter einer Netzwerkadresse des Rechners erreichbar.
- Aufruf von anderen Rechnern: `vite preview` prüft den Kopf `Host` jeder Anfrage (Schutz vor DNS-Rebinding). Zugelassen sind IP-Adressen, `localhost` und Namen auf `.localhost` sowie der mit `--host` angegebene Wert. Die Konfiguration setzt kein `allowedHosts`. Beim Start mit `--host 0.0.0.0` oder mit einer Netzwerkadresse verwenden andere Rechner deshalb die Netzwerkadresse. Ein Name des Rechners wird dann mit HTTP 403 abgewiesen. Ist mit `--host` ein Name angegeben, ist genau dieser Name zugelassen.
- Schnittstellenbeschreibung des Backends: `http://127.0.0.1:<backend-port>/docs` und `http://127.0.0.1:<backend-port>/openapi.json`. Sie ist nur auf `127.0.0.1` des Rechners der Testumgebung erreichbar. Derselbe Pfad `/docs` am Port der Oberfläche zeigt die Schnittstellenbeschreibung nicht, weil `vite preview` nur Anfragen unter `/api` an das Backend weiterleitet.

Prüfung der Web-API über `/docs`: `/docs` zeigt die öffentliche Web-API unter `/api/v1/` und die internen Endpunkte unter `/api/` außerhalb von `/api/v1/`. „Try it out“ sendet JSON mit dem Medientyp `application/json`, den die schreibenden Endpunkte verlangen. Der Ablauf der Abnahmekriterien von `wp01`: `GET /api/v1/element-types` (Typen mit deutschen und englischen Beschriftungen, „Risiko je Trade“, Funktionen); `POST /api/v1/strategies` mit dem Inhalt von `contracts/strategies/v1/testcases/str-01.strategy.json` und `str-03.strategy.json` (Antwort `201` mit leerer Liste der Befunde; je Strategie liegt eine Datei in `components/pipwerk-studio/.testenv/objects`); `GET /api/v1/strategies` und `GET /api/v1/strategies/{id}` (dasselbe Dokument bis auf die Kennung); `POST /api/v1/check` mit einer abgewandelten Fassung; `PUT /api/v1/strategies/{id}` mit einer abgewandelten Fassung (Antwort `200` mit Befunden, gespeichert); ein Dokument mit einem zusätzlichen Feld (`422`); `POST /api/v1/rules` mit einer Vorlage, `GET /api/v1/rules/{id}/usages` und `DELETE /api/v1/rules/{id}`. Die Seiten von `/docs` laden Swagger UI von einem Auslieferungsnetz (CDN) im Internet; ohne Zugang des Browsers dorthin bleibt `/docs` leer, `/openapi.json` und die Endpunkte arbeiten trotzdem. `testenv stop` entfernt das Objektverzeichnis der Testumgebung und damit die gespeicherten Strategien und Vorlagen.

Risiko bei `--host` außerhalb der Loopback-Adresse: Ohne Angabe bindet sich die Oberfläche an `127.0.0.1` und ist nur vom eigenen Rechner erreichbar. Gibt `--host` eine andere Adresse an, zum Beispiel `0.0.0.0` oder die Adresse einer Netzwerkschnittstelle, ist die Oberfläche aus dem Netz erreichbar. Weil `vite preview` alle Anfragen unter `/api` an das Backend weiterleitet, sind dann auch alle Endpunkte des Backends über `http://<host>:<frontend-port>/api/…` aus dem Netz erreichbar, darunter das schreibende `PUT /api/studio/settings/language`, das schreibende `PUT /api/studio/settings/object-directory`, das Dateien auf dem Rechner der Testumgebung verschieben kann, und die schreibenden Endpunkte der öffentlichen Web-API (`POST`, `PUT` und `DELETE` unter `/api/v1/` für Strategien und Vorlagen), mit denen jeder im Netz Strategien und Vorlagen anlegen, ändern und löschen kann. Eine Authentisierung gibt es nicht. Dass das Backend selbst nur an `127.0.0.1` gebunden ist, ändert daran nichts. `vite preview` ist keine Sicherheitsgrenze. Eine Adresse außerhalb der Loopback-Adresse ist deshalb nur in einem Netz zu verwenden, dem alle Teilnehmer vertraut werden; ein Schutz davor (Firewall oder anderer Zugriffsschutz) liegt außerhalb des Skripts und ist nicht eingerichtet.

Die Kommandozeile `pipwerk-studio` (Hilfetext, Fehlermeldung beim Start ohne Startkonfiguration) wird aus der Umgebung des Backends im Arbeitsverzeichnis der Testumgebung aufgerufen:

```sh
uv --directory <Arbeitsverzeichnis>/components/pipwerk-studio/backend run --frozen pipwerk-studio --help
uv --directory <Arbeitsverzeichnis>/components/pipwerk-studio/backend run --frozen pipwerk-studio
```

Der zweite Aufruf endet ohne `-c` und ohne INI-Startkonfiguration an den Suchorten aus Abschnitt 2.2 mit der dort gezeigten Fehlermeldung. Er setzt voraus, dass `testenv start` die Umgebung des Backends (`backend/.venv`) schon angelegt hat; sonst legt `uv run` sie an.

## 5. HTTP-Schnittstelle

Das Backend stellt zwei Gruppen von Endpunkten bereit: sechs interne Endpunkte unter `/api/` für die Oberfläche (Abschnitt 5.1) und die öffentliche Web-API unter `/api/v1/` (Abschnitt 5.2), die unter `contracts/api/pipwerk-studio/v1/openapi.json` beschrieben ist (Abschnitt 5.3).

### 5.1 Interne Endpunkte

| Methode | Pfad | Erfolgsantwort | Zweck |
| --- | --- | --- | --- |
| `GET` | `/api/health` | HTTP 200 mit `{"status": "ok"}` | technische Prüfung, ob die Oberfläche ihr Backend erreicht |
| `GET` | `/api/studio/settings/language` | HTTP 200 mit `{"language": "de"}` oder `{"language": "en"}` | autoritative Oberflächensprache lesen; ohne gespeicherten Wert `de` |
| `PUT` | `/api/studio/settings/language` | HTTP 200 mit `{"language": "de"}` oder `{"language": "en"}` | Oberflächensprache zentral speichern |
| `GET` | `/api/studio/revision` | HTTP 200 mit `{"revision": "<7 Zeichen>", "commit": "<40 Zeichen>", "committed_at": "<ISO 8601 mit Offset>"}`; jedes Feld kann `null` sein (Invarianten in Abschnitt 2.6) | Stand lesen: Kurzform und vollständiger Commit sind `null`, wenn der Stand nicht ermittelbar ist; das Datum ist `null`, wenn es nicht ermittelbar ist (Abschnitt 2.6) |
| `GET` | `/api/studio/settings/object-directory` | HTTP 200 mit `{"path": "<absoluter Pfad>", "is_default": true}`; `path` ist `null`, wenn nichts gespeichert ist und kein Standard bestimmt werden kann | Objektverzeichnis lesen (Abschnitt 2.8); HTTP 503 mit `{"detail": "The stored pipwerk Studio object directory is invalid."}`, wenn der gespeicherte Wert nicht absolut ist |
| `PUT` | `/api/studio/settings/object-directory` | HTTP 200 mit `{"path": "<absoluter Pfad>", "is_default": false}` | Objektverzeichnis ändern; Body `{"path": "<absoluter Pfad>", "move": true}` oder `false` |

Fehler des Schreibens des Objektverzeichnisses, jeweils mit festem Text und ohne Ausnahmetext, Pfad oder Eingabe:

| Status | Fall | Body |
| --- | --- | --- |
| 422 | Body ungültig (kein JSON, fehlende, zusätzliche oder falsch typisierte Felder, Pfad länger als 4096 Zeichen) | `{"detail": "The request body must be a JSON object with the fields path (text) and move (true or false)."}` |
| 422 | Pfad nicht absolut (auch leer oder mit Nullzeichen) | `{"detail": "The object directory must be an absolute path."}` |
| 409 | im Zielverzeichnis liegt schon eine Datei gleichen Namens; nichts wurde verschoben | `{"detail": "The new object directory already contains files with the same names. Nothing was moved."}` |
| 409 | der gespeicherte Wert des Objektverzeichnisses ist nicht absolut und es soll verschoben werden; nichts wurde verschoben. Ein Schreiben mit `"move": false` behebt den Zustand | `{"detail": "The stored pipwerk Studio object directory is invalid, so no files can be moved. Save the object directory without moving files to repair it."}` |
| 500 | das neue Verzeichnis lässt sich nicht anlegen; nichts wurde verschoben | `{"detail": "The new object directory could not be created. Nothing was moved and the object directory is unchanged."}` |
| 500 | Verschieben gescheitert, die Dateien wurden zurückgeholt, die Einstellung ist unverändert | `{"detail": "Moving the object files failed. The files were brought back and the object directory is unchanged."}` |
| 500 | Verschieben gescheitert und Zurückholen gescheitert | `{"detail": "Moving the object files failed and some files could not be brought back. The object directory is unchanged.", "source_directory": "<altes Verzeichnis>", "target_directory": "<neues Verzeichnis>", "files": ["<Dateiname>", …]}` |

Der feste Text bei ungültigem Body gilt nur für diesen Pfad; die bestehenden Endpunkte antworten bei ungültigem Body unverändert mit der Standardantwort von FastAPI. Die Namen der Felder (`path`, `is_default`, `move`) sind eine Festlegung dieses Auftrags; die Spezifikation nennt sie nicht.

Andere Methoden auf diesen Pfaden werden mit HTTP 405 abgelehnt. Die Antworten werden mit den Pydantic-Modellen `HealthStatus`, `StudioLanguage`, `StudioRevision`, `StudioObjectDirectory` und für Fehler `ObjectDirectoryError` und `ObjectMoveRestoreFailure` erzeugt, die keine zusätzlichen Felder zulassen (`extra="forbid"`, `strict`). Der Schreibzugriff auf das Objektverzeichnis verwendet das Modell `StudioObjectDirectoryUpdate` (`path`, `move`, ebenfalls streng). Der Schreibzugriff auf die Sprache verwendet das getrennte Modell `StudioLanguageUpdate`: Der Body enthält ausschließlich `{"language": "de"}` oder `{"language": "en"}`; andere Werte, andere Typen, fehlende oder zusätzliche Felder und ein Body, der kein JSON ist, werden mit HTTP 422 abgelehnt. Ist der gespeicherte Wert ungültig, antwortet das Lesen mit HTTP 503 (Abschnitt 2.1). Das Frontend akzeptiert seinerseits nur eine Antwort mit genau einem gültigen `language`-Feld beziehungsweise bei der Stand-Schnittstelle genau den drei Feldern `revision` (7 Hexadezimalzeichen in Kleinbuchstaben oder `null`), `commit` (40 Hexadezimalzeichen in Kleinbuchstaben oder `null`) und `committed_at` (ISO-8601-Zeitstempel mit Zeitzonenangabe, der ein echtes Kalenderdatum mit gültiger Uhrzeit ist, oder `null`) unter Einhaltung der Invarianten aus Abschnitt 2.6.

Diese sechs Endpunkte sind interne Verbindungen innerhalb von pipwerk Studio (auch `/api/studio/revision`). Sie sind kein Bestandteil der öffentlichen Web-API und keine versionierte Definition der Schnittstellen unter `contracts/`; sie bleiben in `/docs` sichtbar, stehen aber nicht in der Datei unter `contracts/api/`. Die von FastAPI erzeugte Schnittstellenbeschreibung (internen Endpunkte und öffentliche Web-API zusammen) ist im Entwicklungsbetrieb unter `http://127.0.0.1:8000/docs` und `http://127.0.0.1:8000/openapi.json` abrufbar, in der Testumgebung am Port des Backends (Abschnitt 4a). Ihr Titel lautet „pipwerk Studio“; Titel, Zusammenfassungen und Beschreibungen schreiben den Namen einheitlich so (Abschnitt 6.1).

### 5.2 Öffentliche Web-API unter `/api/v1/`

Grundlage ist Abschnitt 4.2 der Spezifikation des Vorhabens `strategiedesign` (req-system-009). `web_api.py` verbindet HTTP mit der Bibliothek und dem Dienst für Objekte (Abschnitt 2.9); es hat keine Kenntnis einzelner Element- oder Objekttypen. `<art>` steht für `strategies`, `indicators`, `trends`, `rules`, `rulesets` (Dateiart `strategy`, `indicator`, `trend`, `rule`, `ruleset`, Dokumentformat `pipwerk.<art>`). `{id}` ist eine UUID.

| Methode | Pfad | Erfolgsantwort | Zweck |
| --- | --- | --- | --- |
| `GET` | `/api/v1/element-types` | `200` mit `types`, `templates`, `functions` | alle Typbeschreibungen des Elementregisters (Beschriftungen in Deutsch und Englisch aus den Typbeschreibungen), die mitgelieferten Vorlagen als Dokumente (derzeit „Risiko je Trade“) und die Funktionen der Ausdrücke |
| `GET` | `/api/v1/<art>` | `200` mit `items` | Liste mit `id`, `title`, `description`, `object_type`, `modified` (UTC) und `unreadable` |
| `POST` | `/api/v1/<art>` | `201` mit `id`, `document`, `findings` | legt das Dokument mit einer neuen Kennung an |
| `GET` | `/api/v1/<art>/{id}` | `200` mit dem Dokument | liest das Dokument, wie es gespeichert ist |
| `PUT` | `/api/v1/<art>/{id}` | `200` mit `id`, `document`, `findings` | speichert das Dokument, auch mit Befunden (req-ablauf-005) |
| `DELETE` | `/api/v1/<art>/{id}` | `204` ohne Body | löscht das Objekt; Instanzen in anderen Objekten bleiben unverändert (E4) |
| `GET` | `/api/v1/<art>/{id}/usages` | `200` mit `usages` und `skipped_unreadable` | Strategien und Vorlagen mit einer Instanz aus dieser Vorlage (req-ablauf-006) |
| `POST` | `/api/v1/check` | `200` mit `findings`, `expressions`, `names_truncated` | Konsistenzprüfung eines Dokuments jeder Art ohne Speichern |

Modelle: Die Dokumente sind die Pydantic-Modelle aus `pipwerk_domain.documents` (`StrategyDocument`, `IndicatorDocument`, `TrendDocument`, `RuleDocument`, `RulesetDocument`). Alle eigenen Antwortmodelle in `web_api.py` lassen keine zusätzlichen Felder zu (`extra="forbid"`): `ElementTypesResponse` (mit `TypeDescriptionModel` und Untermodellen, die Feld für Feld den Klassen von `pipwerk_domain.typedesc` folgen, und `FunctionModel`), `ObjectList` mit `ObjectListEntry`, `Saved<Dokument>` (je Art, zum Beispiel `SavedStrategy`: `id`, `document`, `findings`), `UsagesResponse` mit `UsageEntry` (`art`, `id`, `title`), `CheckResponse` mit `ExpressionNamesModel` und `NameModel`, `FindingModel` (`level`, `code`, `element`, `subject`, `details`), `ApiError` und `InvalidRequest`. Die Bedeutung von Befunden, Namen und Kennungen steht in der technischen Dokumentation der Bibliothek (`docs/technical/pipwerk-domain.md`, Abschnitte 9 und 9.3).

Verhalten:

- Liste: sortiert nach Bezeichnung (ohne Beachtung der Schreibweise), nicht lesbare Dateien zuletzt. Eine Datei, die sich nicht lesen lässt oder dem Schema nicht entspricht, erscheint mit der Kennung aus dem Dateinamen, ohne `title`, `description` und `object_type` (`null`) und mit `unreadable` wahr; sie wird nicht verändert (4.1, Abschnitt 2.9). `object_type` ist bei Strategien `null`.
- Anlegen (`POST`): Die Kennung im Dokument wird durch eine neue ersetzt. Die Ausdrücke werden in der normalisierten Schreibweise der Bibliothek gespeichert (3.4). Die Befunde der Konsistenzprüfung gelten für den gespeicherten Text und verhindern das Speichern nicht.
- Lesen, Ersetzen, Löschen und Verwendungen einer nicht lesbaren Datei antworten mit `409` und dem festen Text „The object file cannot be read or does not fit the document schema. It is left unchanged.“; die Datei bleibt unverändert. Eine unbekannte Kennung ist `404`. Ersetzen legt nie ein Objekt an.
- Ersetzen (`PUT`): Die Kennung im Pfad ist maßgeblich; weicht `id` im Dokument ab, antwortet `422`. Dasselbe gilt für ein `format`, das nicht zur Art passt.
- Mitgelieferte Vorlagen (E6): `GET /api/v1/rules/7c1d4e2a-5b3f-4a86-9d27-e1f0a3c8b645` liefert „Risiko je Trade“; `PUT` und `DELETE` antworten mit `403`. Sie stehen nicht in der Liste und nicht im Objektverzeichnis. Die Typbeschreibungen sind nur lesbar (kein Endpunkt ändert sie).
- Verwendungen: `usages` nennt die Strategien und Vorlagen, die eine Instanz mit dieser Vorlage als Herkunft enthalten, auch in enthaltenen Instanzen und Regelwerken; nicht lesbare Dateien werden übersprungen und in `skipped_unreadable` gezählt. Die Vorlage selbst muss vorhanden und lesbar sein (`404`, `409`).
- Prüfen (`POST /api/v1/check`): Das Dokument darf von jeder Art sein; es wird nicht normalisiert und nicht gespeichert. Die Stellen (`start`, `end`) in den Befunden und in `expressions` beziehen sich auf die Ausdrücke, wie sie gesendet wurden. `expressions` nennt je Ausdruck (`element`, `subject`, `field`) die erkannten Namen mit Stelle, Kennung, `resolved`, `previous` und `segments` (5.3 der Spezifikation); `names_truncated` ist wahr, wenn mehr als `MAX_NAMES_PER_CHECK` Namen vorkamen.
- Der Medientyp eines Bodys muss `application/json` sein (auch mit Parametern wie `charset`), sonst antwortet das Backend mit `415`. Eine Webseite eines anderen Ursprungs kann so nicht mit einem einfachen Formular oder `text/plain` schreiben; mit `application/json` braucht der Browser vorab eine Anfrage nach Erlaubnis (Preflight), die das Backend nicht erlaubt (keine CORS-Freigabe, Abschnitt 2.5).

Begrenzungen (Abschnitt 8 der Spezifikation, OWASP API4): Die Größe des Bodys ist höchstens 2 MiB (`MAX_BODY_BYTES`, der Wert `MAX_DOCUMENT_BYTES` der Bibliothek), sonst `413`. `body_limit.py` (`BodyLimitMiddleware`) prüft das für alle Anfragen unter `/api/v1/`, bevor die Anwendung den Body liest und bevor JSON gelesen wird: Nennt `Content-Length` mehr als das Limit, wird sofort mit `413` geantwortet und der Body nicht gelesen. Sonst liest die Middleware den Body selbst und zählt die ankommenden Bytes, ohne `Content-Length` zu trauen (fehlend, falsch, keine Zahl oder Body in Stücken), höchstens das Limit plus ein Stück liegt im Speicher, und bricht beim Überschreiten ab. Ein Body innerhalb des Limits geht unverändert weiter. Die übrigen Begrenzungen der Bibliothek (Länge und Schachtelungstiefe eines Ausdrucks, Zahl der Elemente und Verbindungen, Regeln je Liste, Strategieparameter, Schachtelung von Instanzen) führen zu `422` (Schema); die Zahl der Befunde und der Namen ist begrenzt (`MAX_FINDINGS_PER_CHECK`, `MAX_NAMES_PER_CHECK`).

Fehler: Ein Dokument, das dem Schema nicht entspricht (kein JSON, doppelter Schlüssel, `NaN`, Kodierung, zusätzliches Feld, falscher Typ, höhere Hauptversion, Überschreitung einer Begrenzung, nicht zur Art passendes `format`, abweichende Kennung), wird mit `422` abgelehnt (4.2). Die Fehlertexte sind fest. Sie nennen weder Pfade noch Ausnahmetexte noch Werte der Anfrage:

| Status | Fall | Body |
| --- | --- | --- |
| 403 | Ersetzen oder Löschen einer mitgelieferten Vorlage | `{"detail": "A delivered template cannot be changed or deleted."}` |
| 404 | unbekannte Kennung (auch bei einer mitgelieferten Vorlage einer anderen Art) | `{"detail": "The object does not exist."}` |
| 409 | die Datei des Objekts ist nicht lesbar | `{"detail": "The object file cannot be read or does not fit the document schema. It is left unchanged."}` |
| 413 | Body über 2 MiB (vor dem Lesen des JSON), oder das gespeicherte Dokument wäre größer als `MAX_STORED_FILE_BYTES` | `{"detail": "The request body is larger than the limit of 2 MiB."}` beziehungsweise `{"detail": "The document is too large to be stored."}` |
| 415 | der Medientyp ist nicht `application/json` | `{"detail": "The request body must be JSON (Content-Type: application/json)."}` |
| 422 | Dokument oder Anfrage passt nicht zum Schema; `{id}` ist keine UUID; Dokument passt nicht zur Art; Kennung weicht ab | `{"detail": "<fester Text>", "errors": [{"location": [...], "type": "<Fehlertyp von Pydantic>"}]}` mit höchstens 50 Einträgen, `location` ist der Ort im Dokument (ein Text über 100 Zeichen wird gekürzt), `type` die Art des Fehlers, zum Beispiel `extra_forbidden`, `missing`, `uuid_parsing`, `format_mismatch`, `id_mismatch` |
| 500 | die Datei konnte nicht geschrieben oder gelöscht werden; das Objektverzeichnis lässt sich nicht lesen | `{"detail": "The object file could not be written or deleted."}` beziehungsweise `{"detail": "The object directory of pipwerk Studio cannot be read."}` |
| 503 | kein Objektverzeichnis bestimmbar (kein Standard und nichts gespeichert) | `{"detail": "The object directory of pipwerk Studio is not set."}` |

Die Fehler `500` werden im Protokoll vermerkt. Die Reihenfolge der Einträge in `errors` entspricht der Prüfung durch Pydantic und ist nicht festgelegt. Ein Dokument ohne `id` ist ungültig (`missing`); beim Anlegen genügt irgendeine gültige Kennung, sie wird ersetzt.

Eine Anfrage mit anderer Methode auf diesen Pfaden antwortet mit `405`, ein unbekannter Pfad mit `404`.

### 5.3 Beschreibung der Web-API unter `contracts/api/`

Die Beschreibung (OpenAPI 3.1) liegt unter `contracts/api/pipwerk-studio/v1/openapi.json` und gehört zu `/api/v1/`. Sie wird aus der Anwendung erzeugt (`pipwerk_studio.contract`): Die Funktion `public_description()` beschränkt die Beschreibung der Anwendung auf die Pfade unter `/api/v1/` und behält nur die Schemata, die diese Pfade verwenden. Die internen Endpunkte unter `/api/` gehören nicht hinein. Titel ist „pipwerk Studio“, `info.version` ist die Version der Web-API (`1.0.0`). Die Anwendung wird mit `separate_input_output_schemas=False` erzeugt, damit die Schemata der Dokumente (mit Standardwerten, die eine Anfrage weglassen darf) für Anfrage und Antwort dieselben sind. Der Body der Anfragen ist mit `openapi_extra` beschrieben, weil der Body gelesen und von der Bibliothek geprüft wird (strenger als das Lesen durch FastAPI). Der Befehl, der die Datei neu erzeugt (im Verzeichnis `components/pipwerk-studio/backend`):

```sh
uv run --frozen python -m pipwerk_studio.contract ../../../contracts/api/pipwerk-studio/v1/openapi.json
```

Mit `--check` schreibt der Befehl nichts und endet mit Exitcode 1, wenn die Datei von der Anwendung abweicht. Der Befehl erzeugt die Anwendung mit einer Datenbank im Speicher und ohne Aufruf von Git; er braucht keine Startkonfiguration. Ein Test vergleicht die erzeugte Beschreibung mit der Datei (Abschnitt 6.1). Eine Änderung an Endpunkten, Modellen, Texten der Web-API oder an den Dokumentmodellen der Bibliothek macht die Datei veraltet; sie wird dann mit dem Befehl neu erzeugt und mit der Änderung committet.

Versionierung: Die Version steht im Pfad (`/api/v1/`). Eine nicht rückwärtsverträgliche Änderung der Web-API erhält einen neuen Pfad (`/api/v2/`) und eine neue Datei unter `contracts/api/pipwerk-studio/v2/`; `v1` bleibt daneben bestehen, solange Abnehmer sie brauchen. Rückwärtsverträglich sind zusätzliche Endpunkte und zusätzliche Felder in Antworten. Das Dokumentformat hat eine eigene Version (`format_version`, Abschnitt 10 der Dokumentation der Bibliothek).

## 6. Prüfungen

Ein Pull Request ist nur abnahmefähig, wenn alle folgenden Prüfungen bestehen.

### 6.1 Backend

Im Verzeichnis `components/pipwerk-studio/backend`:

```sh
uv sync --frozen
uv run --frozen pytest
uv run --frozen ruff check
uv run --frozen ruff format --check
uv run --frozen mypy
```

pytest prüft die HTTP-Anwendung ohne gestarteten Server mit dem Testclient von FastAPI sowie die Konfiguration. Die Tests decken Konfigurationspriorität, Suchpfade (POSIX und Windows, auch bei leerem `HOME`; vom Rechner unabhängig), Fehlerfälle, API-Validierung, Start ohne gültige INI (kein Ersatzwert, Exitcode, Meldung, leere `url`, nicht nutzbare Datenbank-URL, `create_app()` ohne Konfiguration), falsche Methoden, ungültigen gespeicherten Wert, den Ausweg bei gleichzeitigem ersten Schreiben, Standardwert, Umschalten, Trennung verschiedener Datenbanken, den Stand und sein Datum (`tests/test_revision.py`, jeder Fall getrennt: gültiger Hash ergibt 7 Zeichen und den vollständigen Commit, gültiges Datum wird unverändert weitergegeben, kein Aufruf der Datumsermittlung ohne gültigen Hash und dann keine zusätzliche Warnung; Git nicht ausführbar, Zeitüberschreitung, Exitcode ungleich 0 bei vorhandenem Arbeitsbereich (gemockt, mit Ausgabe auf stderr) und ungültige Ausgabe ergeben je `null`; kein Arbeitsbereich mit echtem Git in einem temporären Verzeichnis außerhalb jedes Git-Arbeitsbereichs (`GIT_DIR`, `GIT_WORK_TREE` und `GIT_CEILING_DIRECTORIES` werden kontrolliert; ohne installiertes Git wird der Test mit Begründung übersprungen) ergibt `null` und genau eine Warnung; die Anwendung startet bei nicht ermittelbarem Stand normal, `/api/health` liefert `{"status": "ok"}` und `/api/studio/revision` liefert alle drei Felder als `null`; für jeden Fehlerweg (Git nicht ausführbar, Exitcode ungleich 0, Zeitüberschreitung, ungültige Ausgabe, Ausnahme der Ermittlung) genau eine Warnung, die mit unverwechselbaren Markierungstexten in stdout, stderr und Ausnahme belegt weder Git-Ausgabe noch Ausnahmetext noch Pfad enthält; einmalige Ermittlung; für jeden Fehlerweg der Datumsermittlung getrennt (Git nicht ausführbar, Zeitüberschreitung, Exitcode ungleich 0, ungültige und leere Ausgabe, Zeitstempel ohne Offset, mehrere Zeilen, unmögliches Datum, anderes Format, Ausnahme der Ermittlung): Hash bleibt, Datum `null`, Anwendung startet, genau eine Warnung ohne Git-Ausgabe, Ausnahmetext, Pfad und Hash; echtes Git in einem temporären Repository mit festem Committer-Datum; Antwortmodell mit seinen Invarianten; falsche Methoden; Aufruf ohne Shell mit fester Argumentliste, bei beiden Unterprozessen) und die Wiederherstellung von Englisch und Deutsch nach echten Stop-/Startzyklen separater Backendprozesse mit derselben temporären INI und SQLite-Datei ab. Ruff prüft Programmierstil und typische Fehler; `ruff format --check` meldet Formatabweichungen, ohne Dateien zu ändern. mypy prüft die Typen im strengen Modus.

Für das Objektverzeichnis und Alembic (Abschnitte 2.1 und 2.8) kommen folgende Tests hinzu:

- `tests/test_migrations.py`: neue Datenbank, Datenbank des Schemas vor Alembic mit gespeicherter Sprache (bleibt erhalten, auch ohne gespeicherte Zeile), zweiter Start ohne Änderung, mehrfaches Migrieren, abgelehnter unbekannter und neuerer Stand (Datenbank unverändert, Meldung ohne Pfad), Gleichheit des migrierten Schemas mit dem ORM-Modell (`compare_metadata`), Migrationen im Paket, keine `alembic.ini`, Start über die Kommandozeile mit unbrauchbarem Schema (Exitcode 1).
- `tests/test_object_directory_setting.py`: Standard je Herkunft für POSIX und Windows, auch ohne und mit leerer oder relativer Umgebungsvariable; Herkunft der Startkonfiguration (`explicit`, `user`, `system`, Windows-Suchorte) und ihre Weitergabe über `cli.py` und `create_app()`; Lesen und Speichern der Einstellung, Ablehnung nicht absoluter Pfade, ungültiger gespeicherter Wert.
- `tests/test_object_store.py`: Datei je Objekt, Ablehnung ungültiger UUID und Art in jeder Funktion, Schreiben über eine temporäre Datei in der Reihenfolge `fsync`, Umbenennen, abgebrochenes Schreiben (alte Datei unverändert, keine temporäre Datei), Anlegen des Verzeichnisses beim ersten Schreiben mit Rechten nur für den Benutzer, Auflisten je Art mit Zeitpunkt, fremde Dateien, temporäre Reste und symbolische Verknüpfungen, nicht lesbare Datei ohne Ausnahme.
- `tests/test_object_directory_move.py`: Verschieben, Nichtverschieben, Konflikt, Datei, die erst nach der Prüfung entsteht (auch im Weg über Kopieren), Scheitern unterwegs mit Zurückholen, Scheitern des Zurückholens, Scheitern des Speicherns der Einstellung, Kopieren statt Verknüpfen, Sperren gegen gleichzeitige Änderung und gegen Schreibzugriffe der Ablage.
- `tests/test_object_directory_api.py`: beide Endpunkte mit Erfolgs- und Fehlerfällen einschließlich zusätzlicher Felder, falscher Typen, relativer Pfade, Konflikt und Scheitern, feste Texte ohne Eingabe und Ausnahmetext, falsche Methoden, bestehende Endpunkte unverändert.

Ergänzt nach den Testberichten des ersten Durchlaufs: in `tests/test_migrations.py` ein simulierter Fehler in Revision `0002` (bisheriges Schema mit Sprache und neue Datenbank: danach unveränderter Zustand, nächster Start erfolgreich, Sprache erhalten; Meldung nennt die Migration), in `tests/test_object_directory_api.py` und `tests/test_object_directory_move.py` das Verschieben bei ungültigem gespeichertem Wert (409, Speichern ohne Verschieben behebt es), der eigene Text bei nicht anlegbarem Zielverzeichnis sowie Dateien, die nach dem Auflisten durch eine symbolische Verknüpfung ersetzt werden (beim Verschieben, Zurückholen und Kopieren), und in `tests/test_testenv.py` der isolierte Modus des Python-Aufrufs.

Ergänzt nach dem zweiten Durchlauf: `tests/test_concurrent_writes.py` schreibt die Sprache aus mehreren Threads gleichzeitig über den Dienst auf der Engine aus `create_studio_engine()` und über HTTP, ebenso das Objektverzeichnis ohne Verschieben im Wechsel mit der Sprache, jeweils ohne Fehler; zwei gleichzeitige Starts auf einer neuen Datenbank gelingen beide; die Engine des Betriebs hat das Standardverhalten des Treibers.

Ergänzt nach dem dritten Durchlauf: `tests/test_memory_databases.py` startet mit SQLite im Speicher (URI mit `mode=memory`, `cache=shared`, `uri=true`, `sqlite://` und `sqlite:///:memory:`), liest und schreibt Sprache und Objektverzeichnis mit HTTP 200, prüft zweimaliges Migrieren und, dass die Verbindung im Pool nach der Migration wieder die Standardeinstellung des Treibers hat (Datei und Speicher).

Die Tests in `tests/test_name.py`, die Protokolleinträge prüfen, erfassen nur den Logger `pipwerk_studio`; Meldungen von Alembic gehören nicht dazu.

Für die Bibliothek, den Dienst für Objekte und die öffentliche Web-API (Auftrag 03, Abschnitte 2.9 und 5.2) kommen folgende Tests hinzu. `tests/conftest.py` stellt einen Client mit Objektverzeichnis unter einem temporären `HOME` bereit, `tests/web_api_support.py` Hilfen und Dokumente (die Testfalldokumente `str-01` und `str-03` aus `contracts/strategies/v1/testcases/`, Vorlagen jeder Art):

- `tests/test_web_api_element_types.py`: `GET /api/v1/element-types` liefert genau die Typen des Elementregisters Feld für Feld gleich den Typbeschreibungen der Bibliothek, mit Beschriftungen in Deutsch und Englisch für jeden Typ, Parameter, jede Eigenschaft und jeden Ausgang, die Vorlage „Risiko je Trade“ mit dem Ausdruck aus 3.5 und die Funktionen; die Modelle folgen den Klassen der Bibliothek Feld für Feld; alle Antwortmodelle lassen keine zusätzlichen Felder zu; ein der Anwendung übergebenes Register wird verwendet; der Quelltext des Backends nennt keine Kennung eines angemeldeten Typs (E2).
- `tests/test_web_api_objects.py`: beide Testfalldokumente anlegen (Antwort ohne Befund, neue Kennung), auflisten, lesen (gleich bis auf die Kennung) mit je einer Datei im Objektverzeichnis; Anlegen, Auflisten, Lesen, Ersetzen und Löschen für alle fünf Arten; unbekannte Kennung `404`; Kennung keine UUID `422` ohne Wiedergabe der Eingabe; Art und Format passen nicht `422`; Kennung im Pfad ist maßgeblich; Ersetzen legt nichts an; die abgewandelten Fassungen mit den passenden Befunden (entfernter Auslöser, Schreibfehler mit Stelle, unbekannter Name mit Stelle, `Order` im Hauptablauf, Regel mit `Order` in einem Indikator, Order ändern außerhalb einer Verwaltung, unbekannter Elementtyp) durch `check` und durch `PUT`, das trotz Befunden speichert; Normalisierung beim Speichern; mitgelieferte Vorlage nicht änderbar (`403`) und nicht in der Liste; geändertes Objektverzeichnis wirkt sofort.
- `tests/test_web_api_templates.py`: Vorlage `Regel` anlegen, ändern, löschen; `usages` nennt die Strategie (auch Instanzen in Regelwerken, Elementen und Indikatoren); die Strategie ist nach dem Ändern und nach dem Löschen der Vorlage unverändert; Verwendungen der mitgelieferten Vorlage.
- `tests/test_web_api_check.py`: `POST /api/v1/check` für beide Testfälle und jede Art von Vorlage; die erkannten Namen mit Stelle und Kennung, nicht erkannte Namen, `PREVIOUS`, ohne Normalisierung, ohne Objektverzeichnis, Begrenzung der Namen.
- `tests/test_web_api_errors.py`: zusätzliches Feld `422` (auch tief im Dokument, bei `PUT`), falsche Typen, Hauptversion, Schemaverletzungen und Begrenzungen der Bibliothek `422`, Dokumente, die kein JSON sind, ohne Wiedergabe von Werten, Pfaden und Ausnahmetexten, höchstens 50 Einträge und gekürzte Orte, Medientyp `415`, Body von genau 2 MiB angenommen, darüber `413` vor dem Lesen des JSON für alle Methoden, das Limit gilt nur unter `/api/v1/`, nicht beschreibbares oder fehlendes Objektverzeichnis.
- `tests/test_body_limit.py`: die Begrenzung der Größe auf der Ebene von ASGI: fehlendes, zu kleines, zu großes und ungültiges `Content-Length`, Body in Stücken, Abbruch beim Überschreiten, andere Pfade.
- `tests/test_web_api_unreadable.py`: jede Art von nicht lesbarer Datei (kein JSON, leer, kein UTF-8, Schema, anderes Format, andere Kennung, zu groß) in der Liste mit Kennzeichen, `409` beim Lesen, Ersetzen, Löschen und für die Verwendungen, Datei Byte für Byte und Zeitpunkt unverändert; fremde Dateien, Verzeichnisse und symbolische Verknüpfungen; die Dateien werden bei jeder Anfrage neu gelesen; Zählung bei `usages`.
- `tests/test_contract.py`: die erzeugte Beschreibung ist gleich der Datei unter `contracts/api/pipwerk-studio/v1/` und enthält genau die Pfade unter `/api/v1/` und deren Schemata, keine internen Endpunkte; der Befehl zum Erzeugen und `--check`.
- `tests/test_name.py` (ergänzt): Schreibweise des Namens in der Beschreibung unter `contracts/api/` und in den festen Fehlertexten der Web-API.
- `tests/test_object_store.py` (ergänzt): Grenze der Größe einer gelesenen Datei (`max_bytes`).
- `tests/test_testenv.py` (ergänzt): der Nachbau enthält `packages/domain-core/**`; Abbruch bei geänderter Datei der Bibliothek und bei fehlender Bibliothek.

Die Bibliothek hat eigene Prüfungen (`docs/technical/pipwerk-domain.md`, Abschnitt 12), im Verzeichnis `packages/domain-core` mit denselben Befehlen (`uv sync --frozen`, `uv run --frozen pytest`, `uv run --frozen ruff check`, `uv run --frozen ruff format --check`, `uv run --frozen mypy`).

Zu den Prüfungen im Backend gehören außerdem drei Punkte:

- Test des Testumgebungsskripts (`tests/test_testenv.py`, läuft mit den übrigen Backend-Tests). Er ruft `testenv start` in einem Nachbau des Repositorys in einem temporären Verzeichnis auf, je Fall frisch angelegt. Der Nachbau enthält genau die versionierten Dateien `LICENSE`, `components/pipwerk-studio/**` und `packages/domain-core/**` (das Backend braucht die Bibliothek als Pfadabhängigkeit) in derselben Verzeichnisstruktur; ignorierte Inhalte wie `.testenv/`, `backend/.venv/`, `frontend/node_modules/` und `frontend/dist/` werden nicht übernommen. In den Fällen mit Git ist das Verzeichnis die Wurzel eines frisch angelegten Repositorys mit einem Commit dieses Inhalts; Git wird über `GIT_CEILING_DIRECTORIES` und ohne geerbte `GIT_DIR` und `GIT_WORK_TREE` von umgebenden Arbeitsbereichen getrennt. `uv`, `npm` und `npx` sind im Suchpfad durch Platzhalterprogramme ersetzt, die jeden Aufruf vermerken und mit Exitcode 1 enden. Geprüft wird: Der Start bricht mit Exitcode ungleich 0 und einer Fehlermeldung zur Ursache ab bei einer geänderten versionierten Datei in der Komponente, bei einer geänderten `LICENSE` außerhalb der Komponente, bei einer geänderten Datei der Bibliothek unter `packages/domain-core/`, bei einer nicht ignorierten neuen Datei in der Komponente, bei einer nicht ignorierten neuen Datei im Wurzelverzeichnis, ohne Git und in einem Nachbau ohne `packages/domain-core/` (Meldung „packages/domain-core is missing“). In allen sieben Fällen wurde kein Platzhalterprogramm aufgerufen, `.testenv/` und `frontend/dist/` sind nicht vorhanden und es läuft kein vom Skript gestarteter Prozess. Die Gegenprobe ohne Änderungen und mit einer ignorierten neuen Datei (unter `frontend/node_modules/`) lässt den Start zu: Das erste Platzhalterprogramm (`uv sync --frozen`) wird aufgerufen, der Start endet danach wegen des Platzhalters mit Fehler und hinterlässt weder Prozesse noch `.testenv/`. Der Aufruf mit relativem Pfad aus dem Wurzelverzeichnis des Nachbaus (der Aufruf der Anwenderdokumentation, die bisherigen Fälle rufen das Skript mit absolutem Pfad auf) wird in drei Fällen geprüft: Bei einer nicht ignorierten neuen Datei im Wurzelverzeichnis bricht der Start ab und die Meldung nennt diese Datei; ohne Änderungen wird als erstes Platzhalterprogramm `uv --directory <backend des Nachbaus> sync --frozen` aufgerufen, der Aufruf arbeitet also auf dem Arbeitsverzeichnis des Skripts; `status` ohne Testumgebung meldet „not running“ mit Exitcode 1. Außerdem weist er ungültige Aufrufe (fehlende, ungültige oder gleiche Ports, ungültiger Host, unbekannter Parameter oder Befehl) vor jeder Wirkung ab und prüft `status` und `stop` ohne Testumgebung. Der Test wird mit Begründung übersprungen, wenn Git nicht installiert ist oder der Arbeitsbereich, in dem er läuft, kein Git-Arbeitsbereich ist (zum Beispiel ein entpacktes Archiv des Repositorys). Das Skript wird mit `sh` aufgerufen. Ein weiterer Fall ersetzt `uv`, `npm` und `npx` durch Programme, die mit Exitcode 0 enden, `backend/.venv/bin/python` durch einen Aufruf des Python der Tests und `backend/.venv/bin/pipwerk-studio` durch ein Programm, das die übergebene INI und die darin genannte Datenbank sichert und mit Exitcode 1 endet. Er weist nach, dass die Datenbank der Testumgebung beim Start des Backends das Objektverzeichnis `.testenv/objects` (mit aufgelöstem Pfad) und die neueste Revision enthält, dass die INI nur `[database]` mit `url` enthält und dass der abgebrochene Start `.testenv/` entfernt. Ein weiterer Test prüft, dass das Skript das Verzeichnis über die Datenbank und nicht über eine Umgebungsvariable setzt. Ein vollständiger Start mit Installation, Bau und laufenden Prozessen ist nicht Gegenstand dieses Tests.
- Tests der Schreibweise (`tests/test_name.py`). Jede Zeichenfolge aus „pipwerk“, einem Leerzeichen oder Bindestrich und dem Wort „studio“ in beliebiger Groß- und Kleinschreibung muss genau „pipwerk Studio“ oder genau der Bezeichner `pipwerk-studio` in Kleinbuchstaben sein, und jedes Vorkommen des zweiten Wortes des Namens als ganzes Wort mit großem Anfangsbuchstaben muss unmittelbar nach „pipwerk “ stehen. Geprüft werden die vollständige Fehlerausgabe beim Start ohne Startkonfiguration, der Hilfetext der Kommandozeile bei den Breiten 40, 80 und 200 Zeichen (die Ausgabe wird vor der Prüfung zusammengefasst, sodass ein Zeilenumbruch zwischen den beiden Wörtern des Namens nicht als Fehler zählt; die farbige Ausgabe von argparse ist abgeschaltet), der Detailtext der HTTP-Antwort bei ungültiger gespeicherter Sprache, die Protokolleinträge bei nicht ermittelbarem Stand oder Datum und beim Lesen einer ungültigen gespeicherten Sprache und die Schnittstellenbeschreibung (`/openapi.json`: Titel genau „pipwerk Studio“, `summary` und `description` unter `paths`, `description` unter `components.schemas`). Zusätzlich prüft der Test an den unformatierten Texten des Parsers, dass Beschreibung und Hilfetext jedes Parameters den Bezeichner `pipwerk-studio` nicht enthalten und keine eigenen Zeilenumbrüche haben, und dass der Parser den Standardformatierer von argparse verwendet.
- Suche im Repository. Eine Suche mit `git grep` ohne Beachtung der Groß- und Kleinschreibung nach dem Namen mit Leerzeichen oder Bindestrich zwischen den beiden Wörtern über alle versionierten Dateien, außer unter `docs/design/` und `development/` und außer den beiden Dateien, die unzulässige Schreibweisen als Prüfwert enthalten dürfen (`components/pipwerk-studio/backend/tests/test_name.py` und `components/pipwerk-studio/scripts/check`). Zulässig sind nur Treffer, die genau „pipwerk Studio“ oder genau den Bezeichner `pipwerk-studio` in Kleinbuchstaben lauten; jeder andere Treffer lässt die Prüfung scheitern. Die Kurzform des Namens ohne „pipwerk“ ist mit einer Suche nicht sicher von Bezeichnern zu trennen; sie prüfen die Tests der Schreibweise für die Ausgaben und der Tester Funktion für die Dokumentation.

```sh
git grep -n -i -E 'pipwerk[ -]studio' -- . ':!docs/design' ':!development' ':!components/pipwerk-studio/backend/tests/test_name.py' ':!components/pipwerk-studio/scripts/check'
```

Die Prüfung der Python-Abhängigkeiten auf bekannte Sicherheitslücken erfolgt mit `pip-audit`, das über `uvx` ohne Installation in die Projektumgebung ausgeführt wird. Die Anforderungsliste wird aus der Lockdatei erzeugt:

```sh
AUDIT_REQUIREMENTS="$(mktemp)"
uv export --frozen --no-hashes --no-emit-project --no-emit-package pipwerk-domain -o "$AUDIT_REQUIREMENTS"
uvx pip-audit -r "$AUDIT_REQUIREMENTS" --no-deps --disable-pip
rm "$AUDIT_REQUIREMENTS"
```

Die temporäre Anforderungsliste enthält auch die Entwicklungsgruppe und wird nicht im Repository abgelegt. `--no-emit-package pipwerk-domain` lässt die Bibliothek des Repositorys aus: Ohne den Schalter steht in der Liste die Zeile `-e ../../../packages/domain-core`: ein Pfad relativ zum Backend, keine Veröffentlichung auf PyPI, also nichts, wofür es bekannte Sicherheitslücken geben kann. Ob `pip-audit` an dieser Zeile aus einer temporären Datei außerhalb des Backends scheitert, ist nicht geprüft (`pip-audit` wurde im Auftrag 03 nicht ausgeführt). Die Pakete, von denen die Bibliothek abhängt (Pydantic und dessen Abhängigkeiten), stehen in der Liste.

### 6.2 Frontend

Im Verzeichnis `components/pipwerk-studio/frontend`:

```sh
npm ci
npm run typecheck
npm test
npm run build
npm audit
```

`npm run typecheck` führt den TypeScript-Compiler mit `strict` und ohne Ausgabe von Dateien aus. `npm test` führt die Vitest-Tests aus. Sie prüfen mit Testing Library das sichtbare Verhalten der Oberfläche: Produktname, leere Arbeitsfläche, Sprachwechsel einschließlich Fehlerfällen und Speichern per Mutation, Anzeige des Backendzustands, Anzeige des Stands (Deutsch und Englisch, Sprachwechsel, `null`, Fehler, ungültige Antwort einschließlich verletzter Invarianten, Position rechts neben dem Backend-Status), den Tooltip und die zugängliche Beschreibung (Deutsch und Englisch, Sprachwechsel, nur Commit ohne Datum, kein Tooltip bei `null`, Fehler und ungültiger Antwort, unmögliche Kalenderdaten und Uhrzeiten (31.02., 31.04., 29.02. im Nicht-Schaltjahr, 24:00, Sekunde 60, ungültiger Offset) sowie ein gültiger Schalttag, Umrechnung in die Ortszeit bei fest eingestellten Zeitzonen, Auffüllen mit Nullen, nicht fokussierbar) und Vollständigkeit der Übersetzungen. Die Anfragen an das Backend werden in diesen Tests durch festgelegte Antworten ersetzt. `npm audit` prüft die npm-Abhängigkeiten auf bekannte Sicherheitslücken.

Frontend-Tests des Dialogs (Abschnitt 2.7). jsdom bildet `showModal()` und `close()` nicht vollständig nach; `src/test-setup.ts` ergänzt beide für `HTMLDialogElement` (Attribut `open` setzen beziehungsweise entfernen, `close()` löst das Ereignis `close` aus). Die Sperrung der übrigen Oberfläche weist der Browsertest nach (Abschnitt 6.3). Die Include-Liste von Vitest enthält zusätzlich `buildinfo/**/*.test.ts`; diese Tests laufen in der Umgebung `node`. Geprüft wird:

- `src/App.test.tsx`: Schaltfläche in der Kopfzeile rechts neben der Sprachauswahl, Beschriftung in Deutsch und Englisch, Öffnen mit Maus und Tastatur, Fokus nach dem Schließen wieder auf der Schaltfläche, Fußzeile unverändert; Überschrift „pipwerk Studio“ in beiden Sprachen
- `src/AboutDialog.test.tsx`: Überschrift, Name, Bezeichnungen und „Schließen“ in beiden Sprachen, Name unübersetzt; Stand in beiden Sprachen bei fest eingestellten Zeitzonen (Auffüllen mit Nullen, Tageswechsel durch die Zeitzone, vollständige Kennung) und „unbekannt“/„unknown“; Sprachwechsel bei offenem Dialog (Texte wechseln, Dialog bleibt offen, Lizenz, Name und Adresse bleiben, Fokus bleibt); Lizenzname und Lizenztext Zeichen für Zeichen gleich `LICENSE` mit `lang="en"`, Lizenzfeld mit der Tastatur erreichbar; Verweis mit `href`, `target`, `rel` und Adresse als Text, „unbekannt“ ohne Verweis bei ungültiger Adresse; Fokus beim Öffnen auf „Schließen“; Schließen mit der Schaltfläche und mit `cancel` (nicht unterdrückt, endet im Ereignis `close`); Fokus im Dialog (Tab vom letzten Element zum ersten, Umschalt+Tab vom ersten zum letzten, nach jedem Tastendruck im Dialog und nie auf dem Dokument, Fokus auf dem Dokument oder dem Dialogelement wird in den Dialog geführt, nach dem Schließen keine Wirkung von Tab); kein `fetch` beim Öffnen
- `src/buildRevision.test.ts`: gültiger Wert; jede Abweichung einzeln ergibt `null` (kein Objekt, Feld fehlt, zusätzliches Feld, falsche Länge, Großbuchstaben, Datum fehlt, kein Text, ohne Zeitzone, unmögliches Datum, Kennung ohne Datum)
- `src/repository.test.ts`: Adresse in `package.json` genau `https://github.com/macodix/pipwerk`; abweichende Formen werden ohne Ausnahme abgelehnt
- `src/commitDate.test.ts`, `src/timestamp.test.ts`: die verschobenen Hilfsfunktionen (Zerlegung in Ortszeit, Prüfung von Muster, Kalenderdatum, Schaltjahr und Uhrzeit)
- `buildinfo/gitRevision.test.ts`: echtes Git in einem temporären Repository mit festem Committer-Datum; kein Git-Arbeitsbereich und Repository ohne Commit (mit kontrolliertem `GIT_DIR`, `GIT_WORK_TREE` und `GIT_CEILING_DIRECTORIES`, ohne installiertes Git übersprungen); Git nicht ausführbar, Zeitüberschreitung, Exitcode ungleich 0, ungültige Kennung, ungültiges Datum und Ausnahme ergeben je `null` und genau eine feste Warnung ohne Git-Ausgabe, Ausnahmetext, Pfad und Kennung (mit unverwechselbaren Markierungstexten belegt); kein zweiter Aufruf ohne gültige Kennung; Aufruf ohne Shell mit fester Argumentliste, Zeitbegrenzung und Eingabe `ignore`
- `buildinfo/viteConfig.test.ts`: `vite.config.ts` setzt `__PIPWERK_STUDIO_BUILD_REVISION__` für `build` und `serve` auf das Ergebnis eines eigenen Aufrufs von `lookupGitRevision` für das Verzeichnis der Konfiguration; die Freigabe des Entwicklungsservers umfasst genau `LICENSE` (der Entwicklungsserver liefert die Datei, eine andere Datei des Wurzelverzeichnisses nicht)

### 6.3 Browsertest gegen die gebaute Oberfläche mit `vite preview`

Die Testbrowser von Playwright werden einmalig im Verzeichnis `frontend` installiert:

```sh
npx playwright install chromium firefox webkit
```

Die für die Playwright-Browser erforderliche Testumgebung einschließlich benötigter Betriebssystemabhängigkeiten muss auf dem Entwicklungs- beziehungsweise Testsystem vorhanden sein. Die allgemeinen Systemanforderungen dafür sind in `docs/technical/development-test-security-rules.md` festgelegt.

Der Test wird mit folgendem Befehl ausgeführt:

```sh
npm run e2e
```

Der Browsertest läuft gegen die gebaute Oberfläche, so wie die Testumgebung sie ausliefert (Abschnitt 4a), nicht gegen den Entwicklungsserver. `playwright.config.ts` startet dafür nacheinander `vite build --outDir dist-e2e` und `vite preview --outDir dist-e2e --port <port>` mit `PIPWERK_STUDIO_BACKEND_URL` auf das Backend des Tests. Das eigene Ausgabeverzeichnis `frontend/dist-e2e/` lässt eine Oberfläche in `frontend/dist` unberührt und steht in `components/pipwerk-studio/.gitignore`. Die Zeitbegrenzung des Starts der Oberfläche (180 Sekunden) deckt den Bau ab. Alle Browsertests laufen damit gegen die gebaute Oberfläche.

Playwright startet ein isoliertes Backend auf Port 18000 und die gebaute Oberfläche auf Port 15173. Andere Ports können über `PIPWERK_STUDIO_E2E_BACKEND_PORT` und `PIPWERK_STUDIO_E2E_FRONTEND_PORT` gewählt werden. `e2e/start-backend.mjs` erzeugt je Lauf ein temporäres Verzeichnis mit INI und SQLite-Datei, startet das Backend ausschließlich über die dokumentierte Option `-c` und entfernt das Verzeichnis, wenn Playwright das Backend beendet (`gracefulShutdown` mit SIGTERM). Es gibt keine zusätzliche Datenbank-Umgebungsvariable.

Der Test läuft in Chromium, Firefox und WebKit. Er prüft, dass die Seite ohne Fehlermeldungen im Browser erscheint, dass Titel der Seite und Überschrift der Kopfzeile „pipwerk Studio“ lauten, dass die leere Arbeitsfläche sichtbar ist, dass die Oberfläche eine erfolgreiche Antwort des echten Backends erhält und anzeigt, dass der Sprachwechsel die sichtbaren Texte umschaltet, dass die Fußzeile rechts neben dem Backend-Status den Stand zeigt (7 Hexadezimalzeichen, gleich den ersten 7 Zeichen von `git rev-parse HEAD` des Arbeitsbereichs, in dem der Test läuft; ohne Git-Arbeitsbereich „unbekannt“) und beim Sprachwechsel die Bezeichnung umschaltet, dass `title` und zugängliche Beschreibung der Standanzeige genau den vollständigen Commit aus `git rev-parse HEAD` und das Datum aus `git log -1 --format=%cI` in der Zeitzone des Testbrowsers enthalten (fest eingestellte `timezoneId`; der Erwartungswert wird im Test unabhängig vom Produktionscode berechnet) und beim Sprachwechsel umschalten, dass es ohne Git-Arbeitsbereich keinen Tooltip gibt (dieser Test wird übersprungen, wenn der Arbeitsbereich ein Git-Arbeitsbereich ist), und dass die gewählte Sprache nach einem Neuladen der Seite erhalten bleibt.

Browsertests des Dialogs (Abschnitt 2.7, in `e2e/studio.spec.ts`), ebenfalls in Chromium, Firefox und WebKit:

- Öffnen über die Schaltfläche in der Kopfzeile mit Maus und mit Tastatur (Tabulatortaste und Eingabetaste); Inhalte in beiden Sprachen, Lizenztext Zeichen für Zeichen gleich `LICENSE`, Verweis mit der Adresse aus `package.json`
- Stand gleich `git rev-parse HEAD` und dem Datum aus `git log -1 --format=%cI` in der fest eingestellten Zeitzone des Testbrowsers, in beiden Sprachen; der Erwartungswert wird im Test unabhängig vom Produktionscode berechnet. Damit ist nachgewiesen, dass der Stand beim Bau in die ausgelieferten Dateien geschrieben wird und dem Commit entspricht, aus dem gebaut wurde. Ohne Git-Arbeitsbereich zeigt der Dialog „unbekannt“ (eigener Test; in einem Git-Arbeitsbereich wird er übersprungen und erscheint im Ergebnis als übersprungen, wie der bestehende Test der Fußzeile ohne Tooltip). Der Test zum Stand mit Kennung und Datum wird umgekehrt ohne Git-Arbeitsbereich übersprungen.
- Kennung im Dialog gleich der Kennung im Tooltip der Fußzeile (Oberfläche und Backend stammen dabei aus demselben Arbeitsverzeichnis, E9). Ob das Arbeitsverzeichnis nicht committete Änderungen hat, prüft der Browsertest nicht; das weist der Test des Testumgebungsskripts nach (Abschnitt 6.1).
- Beim Öffnen und bei offenem Dialog entsteht keine Anfrage an eine andere Adresse als die der Testumgebung.
- Sperrung: Bei offenem Dialog liegt an der Stelle von Sprachauswahl und Schaltfläche „Über pipwerk Studio“ (`document.elementFromPoint`) kein Element der Kopfzeile, und ein Mausklick dort setzt den Fokus nicht auf Sprachauswahl oder Schaltfläche; der Dialog bleibt offen und die Sprache unverändert.
- Fokus im Dialog: Bei offenem Dialog liegt der Fokus nach jedem Tastendruck von Tab und Umschalt+Tab auf einem Element im Dialog, nie auf `body` oder `html`, nie auf dem Dialogelement selbst und nie auf Sprachauswahl oder Schaltfläche „Über pipwerk Studio“. Tab vom letzten Element führt zum ersten, Umschalt+Tab vom ersten zum letzten. Dass das der Dialog selbst leisten muss, steht in E8 (Abschnitt 2.7): Ohne eigenen Code verlässt der Fokus den Dialog oder landet auf dem Dialogelement selbst. Das zeigte die Messung in Chromium, Firefox und WebKit. Der Dialog hält den Fokus deshalb selbst.
- Schließen: Escape schließt, „Schließen“ schließt, ein Klick neben den Dialog schließt nicht; danach liegt der Fokus auf der Schaltfläche „Über pipwerk Studio“.
- Der Verweis öffnet sich in einem neuen Tab mit der Adresse (die Seite wird über `route` des Browserkontexts abgefangen und nicht geladen).

Einen Backend-Neustart weist der Browsertest nicht nach; dieser wird im Backend-Komponententest durch echte Prozessneustarts nachgewiesen (Abschnitt 6.1).

### 6.4 Prüfskript

Das Prüfskript `components/pipwerk-studio/scripts/check` (POSIX-Shell) führt die Prüfungen aus den Abschnitten 6.1 bis 6.3 nacheinander aus und endet mit Exitcode 0 nur, wenn alle bestehen. Es legt und hält der Tester Funktion. Es prüft das Arbeitsverzeichnis, in dem das Skript liegt; das Verzeichnis wird aus dem Pfad des Skripts bestimmt. Das Skript wird mit absolutem Pfad aus einem beliebigen Verzeichnis aufgerufen und enthält keine festen Ports, Pfade oder Rechnernamen.

```sh
<Arbeitsverzeichnis>/components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port> [--with-audit]
```

| Parameter | Bedeutung |
| --- | --- |
| `--backend-port <port>` | Pflicht. Port des Backends im Browsertest (`PIPWERK_STUDIO_E2E_BACKEND_PORT`, Abschnitt 6.3), ganze Zahl von 1 bis 65535 |
| `--frontend-port <port>` | Pflicht. Port der Oberfläche im Browsertest (`PIPWERK_STUDIO_E2E_FRONTEND_PORT`, Abschnitt 6.3), ganze Zahl von 1 bis 65535, verschieden vom Port des Backends |
| `--with-audit` | Optional. Führt zusätzlich `pip-audit` (Abschnitt 6.1) und `npm audit` (Abschnitt 6.2) aus. Ohne diesen Parameter entfallen beide Prüfungen auf bekannte Sicherheitslücken, weil `npm audit` wegen des bekannten Befunds aus Abschnitt 7 mit einem Fehler endet und `pip-audit` einen Zugriff auf das Internet braucht. |

Reihenfolge der Prüfungen:

1. Backend im Verzeichnis `backend`: `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check`, `mypy`
2. Suche im Repository nach der Schreibweise des Namens (Abschnitt 6.1, dritter Punkt). Das Skript wertet jeden Treffer aus; die Prüfung scheitert, sobald ein Treffer nicht genau „pipwerk Studio“ oder der Bezeichner `pipwerk-studio` ist, und nennt Datei, Zeile und Treffer.
3. mit `--with-audit`: `pip-audit`
4. Oberfläche im Verzeichnis `frontend`: `npm ci`, `npm run typecheck`, `npm test`, `npm run build`
5. mit `--with-audit`: `npm audit`
6. Browsertest `npm run e2e` mit den beiden Ports

Eine gescheiterte Prüfung bricht die übrigen nicht ab. Am Ende nennt das Skript die bestandenen und die gescheiterten Prüfungen. Exitcodes: 0, wenn alle Prüfungen bestehen; 1, wenn mindestens eine scheitert; 2 bei ungültigem Aufruf, fehlendem Programm oder wenn das Verzeichnis des Skripts nicht in einem Arbeitsverzeichnis von Git liegt.

Voraussetzungen: Git, uv, Node.js mit npm und `npx` in den Versionen aus Abschnitt 3, die Testbrowser von Playwright (Abschnitt 6.3), Zugriff auf die Paketquellen für `uv sync --frozen` und `npm ci` und zwei freie Ports. `npm ci` ersetzt `frontend/node_modules`; das Skript darf deshalb nicht gleichzeitig mit einer Testumgebung oder einem Entwicklungsserver im selben Arbeitsverzeichnis laufen.

## 7. Abhängigkeiten

Alle direkten und indirekten Abhängigkeiten sind in `backend/uv.lock` und `frontend/package-lock.json` festgeschrieben. Das Backend hängt zusätzlich von der gemeinsamen Python-Bibliothek `pipwerk_domain` des Repositorys ab (Pfadabhängigkeit auf `packages/domain-core`, Abschnitt 2.9); sie steht in `uv.lock` mit ihrer Version `0.1.0` und der Angabe `editable`, ihre Abhängigkeit ist Pydantic in derselben Version wie in der Lockdatei des Backends. Die direkten npm-Abhängigkeiten sind in `package.json` zusätzlich mit exakter Version angegeben.

Alembic (mit Mako und MarkupSafe) kam am 2026-10-16 hinzu (Auftrag 02, `wp01`). Die Lizenzen wurden aus den Metadaten der installierten Pakete gelesen (MIT, MIT, BSD-3-Clause), Alembic 1.20.0 verlangt `SQLAlchemy>=2.0` und ist mit dem festgeschriebenen SQLAlchemy 2.1.3 lauffähig (Tests). Die Veröffentlichungsdaten stammen von PyPI (Abruf am 2026-10-16). `pip-audit` (Aufruf in Abschnitt 6.1) meldete am 2026-10-16 für alle 33 festgeschriebenen Python-Pakete einschließlich alembic 1.20.0, mako 1.4.3 und markupsafe 3.0.4 keine bekannten Sicherheitslücken (Ergebnis der Prüfungen der Tester Funktion und Sicherheit am Commit `c663d9d5b7414db24b4678bc1a07b493f114b6cb`). `uv.lock` wurde mit dem verfügbaren uv 0.5.9 nicht neu erzeugt, weil dieses das Format der Lockdatei und die aufgelösten Pakete verändert; die Einträge für Alembic, Mako und MarkupSafe sind aus einer Auflösung mit uv 0.5.9 in die bestehende Lockdatei übernommen (ohne Zeitangaben der Pakete).

Die übrigen Abhängigkeiten wurden am 2026-10-06 geprüft. Die Spalte „Veröffentlicht“ nennt das Datum der verwendeten Version und dient als Hinweis auf den Wartungszustand. `pip-audit` (Aufruf in Abschnitt 6.1) meldete für die festgeschriebenen Python-Abhängigkeiten keine bekannten Sicherheitslücken. `npm audit` meldete einen Befund mit hoher Schwere: `source-map-js` 1.2.1 (GHSA-68fv-2mgg-jv7q), indirekt über vite/postcss und jsdom. Betroffen sind nur Entwicklungsabhängigkeiten; `npm audit --omit=dev` meldet keine bekannten Sicherheitslücken. Der Befund besteht unverändert bereits im Stand von `main` und ist nicht Gegenstand von WO-2026-10-04-001.

### 7.1 Laufzeitabhängigkeiten

| Paket | Version | Lizenz | Veröffentlicht | Zweck | Kopplung |
| --- | --- | --- | --- | --- | --- |
| fastapi | 0.141.1 | MIT | 2026-07-29 | HTTP-Schnittstelle des Backends | nur in `app.py`; keine Fachlogik |
| uvicorn | 0.54.0 | BSD-3-Clause | 2026-09-25 | ASGI-Server zum Start des Backends | nur beim Start in `cli.py` verwendet |
| sqlalchemy | 2.1.3 | MIT | 2026-10-02 | konfigurierbare relationale Persistenz der Betriebskonfiguration (req-system-015) | nur in `storage.py` und `settings_service.py`; ORM-Klassen verlassen die Servicegrenze nicht und sind keine API-Modelle |
| pydantic | 2.13.5 | MIT | 2026-08-28 | Lese- und Schreibmodelle der Schnittstelle; indirekt über FastAPI und über die Bibliothek `pipwerk_domain` | an der HTTP-Grenze (`app.py`, `web_api.py`) und in den Dokumentmodellen der Bibliothek (`pipwerk_domain.documents`) |
| pipwerk-domain | 0.1.0 | GPL-3.0-only | – (Teil dieses Repositorys) | gemeinsame Python-Bibliothek: Typbeschreibungen, Objektmodell, Ausdrücke, Konsistenzprüfung, Dokumente (E1) | `object_service.py`, `web_api.py`, `app.py`; keine Kenntnis einzelner Typen im Backend |
| alembic | 1.20.0 | MIT | 2026-09-11 | versionierte Migrationen des Datenbankschemas (Abschnitt 2.1) | nur in `migrate.py` und im Paket `migrations/`; kein Zugriff aus Fachlogik oder Schnittstelle |
| mako | 1.4.3 | MIT | 2026-09-22 | Vorlagen von Alembic; indirekt über Alembic (zur Laufzeit nur für das Erzeugen neuer Revisionen) | nur über Alembic |
| markupsafe | 3.0.4 | BSD-3-Clause | 2026-10-02 | von Mako verwendet; indirekt | nur über Mako |
| react, react-dom | 19.3.0 | MIT | 2026-09-09 | Browseroberfläche | Oberfläche |
| @xyflow/react (React Flow) | 12.12.0 | MIT | 2026-09-24 | Designer-Arbeitsfläche | nur in `DesignerCanvas.tsx` |
| i18next | 26.4.2 | MIT | 2026-09-03 | Übersetzung der Oberflächentexte | nur Darstellung |
| react-i18next | 17.0.15 | MIT | 2026-09-21 | Einbindung von i18next in React | nur Darstellung |
| @tanstack/react-query | 5.104.0 | MIT | 2026-09-26 | Abruf und Schreiben des Backendzustands | nur in `BackendStatus.tsx`, `RevisionDisplay.tsx`, `useStudioLanguage.ts` und `settingsApi.ts` |

### 7.2 Entwicklungs- und Prüfwerkzeuge

| Paket | Version | Lizenz | Veröffentlicht | Zweck |
| --- | --- | --- | --- | --- |
| hatchling | 1.32.4 | MIT | 2026-09-20 | Bau des Python-Pakets |
| pytest | 9.1.1 | MIT | 2026-06-19 | Backend-Tests |
| httpx2 | 2.13.1 | BSD-3-Clause | 2026-09-23 | HTTP-Client für den Testclient von FastAPI |
| ruff | 0.16.9 | MIT | 2026-09-24 | Python-Stil- und Fehlerprüfung |
| mypy | 2.3.1 | MIT | 2026-08-15 | Python-Typprüfung |
| vite | 8.3.1 | MIT | 2026-09-24 | Entwicklungsserver und Erzeugen der Oberflächendateien |
| @vitejs/plugin-react | 6.1.1 | MIT | 2026-08-28 | React-Unterstützung für Vite |
| typescript | 7.0.2 | Apache-2.0 | 2026-07-08 | TypeScript-Typprüfung |
| vitest | 5.0.2 | MIT | 2026-09-25 | Frontend-Tests |
| @testing-library/react, /dom, /user-event, /jest-dom | 16.3.3, 10.4.2, 14.6.7, 7.0.1 | MIT | 2026-08-09 bis 2026-09-13 | benutzernahe Prüfung der Oberfläche |
| jsdom | 30.1.1 | MIT | 2026-09-22 | nachgebildete Browserumgebung für Vitest |
| @playwright/test | 1.63.0 | Apache-2.0 | 2026-09-04 | Browser-End-to-End-Tests |
| @types/react, @types/react-dom, @types/node | 19.3.0, 19.3.0, 26.6.3 | MIT | – | Typdefinitionen für TypeScript |

Für das Backend-Testwerkzeug wird `httpx2` statt `httpx` verwendet, weil Starlette die Verwendung von `httpx` mit seinem Testclient als veraltet meldet.

## 8. Sicherheit

Backend und Entwicklungsserver sind im Entwicklungsbetrieb nur an die Adresse `127.0.0.1` gebunden. In der Testumgebung (Abschnitt 4a) bindet sich das Backend ebenfalls nur an `127.0.0.1`; die Oberfläche (`vite preview`) bindet sich an `--host`, ohne Angabe an `127.0.0.1`. Das Testumgebungsskript startet Unterprozesse nur mit fester Argumentliste und ohne Shell-Auswertung von Eingaben; die Parameter werden zuvor geprüft (Ports als Zahlen, Host nur aus Buchstaben, Ziffern und `.:_-`). Die Schnittstellenbeschreibung des Backends ist nur auf `127.0.0.1` erreichbar. Das gilt nicht für die Endpunkte unter `/api`: Gibt `--host` eine Adresse außerhalb der Loopback-Adresse an, leitet `vite preview` alle Anfragen unter `/api` an das Backend weiter, und alle Endpunkte des Backends sind ohne Authentisierung über den Port der Oberfläche aus dem Netz erreichbar, auch das Schreiben der Oberflächensprache. Die Bindung des Backends an `127.0.0.1` schützt davor nicht. Das Risiko ist nicht durch eine Maßnahme im Skript gemindert; die Voreinstellung `127.0.0.1` ist die sichere Wahl, und eine andere Adresse gehört nur in ein vertrauenswürdiges Netz (Abschnitt 4a). `vite preview` prüft den Kopf `Host` jeder Anfrage (Schutz vor DNS-Rebinding) und lässt nur IP-Adressen, `localhost`, Namen auf `.localhost` und den mit `--host` angegebenen Wert zu; die Konfiguration setzt kein `allowedHosts` (Einzelheiten in Abschnitt 4a). Das Backend enthält drei schreibende Gruppen von Funktionen: das Speichern der Oberflächensprache, das Ändern des Objektverzeichnisses und das Anlegen, Ändern und Löschen von Strategien und Vorlagen über die öffentliche Web-API (letzteres siehe den Absatz zur Web-API unten). Die Sprache nimmt nur die Werte `de` und `en` an; andere Werte, Typen und zusätzliche Felder werden abgelehnt. Das Objektverzeichnis (zweite schreibende Funktion, Abschnitt 2.8) nimmt einen absoluten Pfad (höchstens 4096 Zeichen, ohne Nullzeichen) und „verschieben“ ja oder nein an; andere Typen und zusätzliche Felder werden abgelehnt. Es ist die einzige Pfadangabe von außen. Dateizugriff nach Abschnitt 8 der Spezifikation: Dateinamen entstehen nur aus einer geprüften UUID in kanonischer Kleinschreibung und einer der festen Arten, nie aus einer anderen Eingabe; Symbolische Verknüpfungen werden nicht verfolgt; Verschieben und Schreiben überschreiben keine fremde Datei (Verschieben legt den neuen Namen mit `os.link` an, das bei vorhandenem Namen scheitert, auch wenn die Datei zwischen Prüfung und Verschieben entsteht); das Verzeichnis und die Dateien werden mit Rechten nur für den Benutzer angelegt. Fehlermeldungen nennen weder Pfade der Eingabe noch Ausnahmetexte; nur die Antwort auf ein gescheitertes Zurückholen nennt die beiden Verzeichnisse und die Dateinamen, damit der Anwender die Dateien finden kann. Der Pfad des Objektverzeichnisses ist frei wählbar: Wer die Schnittstelle erreicht, kann Objektdateien in jedes Verzeichnis verschieben lassen, in dem der Prozess schreiben darf (Risiko bei `--host` außerhalb der Loopback-Adresse, Abschnitt 4a). Die Migrationen sind Datenbankänderungen: Sie laufen in einer eigenen Transaktion (`BEGIN IMMEDIATE` auf einer einzigen Verbindung der Engine, nur für die Migration) und werden bei einem Fehler zurückgenommen, sodass die Datenbank nach einem Abbruch nicht dauerhaft unstartbar ist; die Engine des Betriebs bleibt unverändert, gleichzeitige Schreibzugriffe warten auf die Sperre (Abschnitt 2.1). Eine Sicherung der Datenbank vor einer Aktualisierung bleibt Sache des Betreibers. Es startet beim Erzeugen der Anwendung bis zu zwei Unterprozesse, `git rev-parse HEAD` und, nur bei gültigem Hash, `git log -1 --no-show-signature --format=%cI <hash>` (Abschnitt 2.6), jeweils mit fester Argumentliste, ohne Shell, ohne Eingaben von außen (der Hash stammt aus dem ersten Aufruf und wird zuvor auf 40 Hexadezimalzeichen geprüft) und mit Zeitbegrenzung. Beim Bau der Oberfläche startet `buildinfo/gitRevision.ts` (Abschnitt 2.7) dieselben zwei Unterprozesse, `git -C <Verzeichnis der Oberfläche> rev-parse HEAD` und, nur bei gültiger Kennung, `git -C <Verzeichnis der Oberfläche> log -1 --no-show-signature --format=%cI <Kennung>`, mit `execFileSync`, fester Argumentliste, ohne Shell, ohne Eingaben von außen (die Kennung stammt aus dem ersten Aufruf und wird zuvor geprüft), mit Zeitbegrenzung von 5 Sekunden und ohne Weitergabe der Fehlerausgabe von Git; Warnungen enthalten keine Git-Ausgabe, keinen Ausnahmetext und keinen Pfad. Der Dialog stellt keine Netzwerkanfrage; der Wert wird im Browser erneut geprüft, alle Texte setzt React als Text, nie als HTML. Der Verweis auf das Repository öffnet mit `noopener noreferrer` einen neuen Tab. Kennung und Datum des Commits stehen in den ausgelieferten Dateien; beide sind öffentlich, weil das Repository öffentlich ist. Die Freigabe in `server.fs.allow` gilt nur für die Datei `LICENSE`. Es enthält keine ausführenden oder handelsbezogenen Funktionen und verwendet keine Zugangsdaten. Eine Authentifizierung ist in diesem Stand nicht eingerichtet; sie ist nicht Bestandteil von AP1 und von WO-2026-10-04-001.

Öffentliche Web-API (Abschnitt 5.2; Spezifikation Abschnitt 8): Die schreibenden Endpunkte `POST`, `PUT` und `DELETE` unter `/api/v1/` legen Strategien und Vorlagen an, ändern und löschen sie. Es gibt keine Anmeldung, die Endpunkte gelten wie die übrigen nur im vom Betreiber kontrollierten Netz (req-system-011). Bei `--host` außerhalb der Loopback-Adresse kann jeder im Netz damit alle Strategien und Vorlagen im Objektverzeichnis ändern oder löschen und Dateien der Größe bis 2 MiB je Anfrage ablegen; das erhöht das bekannte Risiko (Abschnitt 4a). Maßnahmen: (1) Dateinamen entstehen nur aus einer geprüften UUID (der Pfadparameter `{id}` ist eine UUID, sonst `422`; die Ablage prüft sie erneut) und einer festen Art; keine Pfadangabe kommt von außen. (2) Der Body ist auf 2 MiB begrenzt, geprüft vor dem Lesen des JSON, auch bei fehlendem oder falschem `Content-Length`; die Begrenzungen der Bibliothek (Ausdruck, Schachtelung, Elemente, Verbindungen, Regeln, Instanzen) begrenzen Rechenzeit und Speicher der Prüfung, die Zahl der Befunde und der erkannten Namen ist begrenzt (OWASP API4). Gelesene Dateien sind auf `MAX_STORED_FILE_BYTES` begrenzt. (3) Pydantic ist streng und lehnt zusätzliche Felder ab; Ausdrücke werden nur zerlegt, nie mit `eval` oder Ähnlichem ausgeführt (Bibliothek). (4) Der Medientyp `application/json` ist Pflicht; eine Webseite eines anderen Ursprungs kann ohne Erlaubnis des Backends nicht schreiben (keine CORS-Freigabe). (5) Fehlertexte sind fest und nennen weder Pfade noch Ausnahmetexte noch Werte der Anfrage; Ausnahmen werden im Protokoll vermerkt. (6) Eine Datei, die sich nicht lesen lässt, wird nie verändert oder gelöscht. Speichern geschieht über eine temporäre Datei und Umbenennen; zwei gleichzeitige Schreibzugriffe laufen nacheinander (Sperre der Ablage, nur innerhalb eines Prozesses). Das Objektverzeichnis ist die einzige Pfadangabe von außen (Einstellung, Abschnitt 2.8). Die Texte der Dokumente (Bezeichnungen, Beschreibungen, Ausdrücke) gibt das Backend als JSON zurück; die Oberfläche setzt sie als Text, nie als HTML. Eine Anmeldung und eine Beschränkung des Zugriffs sind nicht eingerichtet.

Die Datenbank-URL der INI-Startkonfiguration kann Zugangsdaten enthalten. Die INI gehört deshalb in einen administrativ geschützten Ort und nicht in das Repository. Die Tests verwenden ausschließlich temporäre lokale SQLite-Dateien.

Die Oberfläche übernimmt Antworten des Backends nur, wenn sie genau dem erwarteten Inhalt entsprechen. Fehlermeldungen der Oberfläche enthalten keine technischen Details des Backends.

## 9. Bekannte Einschränkungen

Die folgenden Punkte sind bewusst noch nicht umgesetzt oder noch nicht festgelegt:

- Das Backend liefert die Oberflächendateien nicht selbst aus. Im Entwicklungsbetrieb laufen deshalb zwei Prozesse.
- Im Entwicklungsbetrieb ist der Stand im Dialog nicht notwendig der Stand des laufenden Codes (Grenze im Entwicklungsbetrieb, Abschnitt 2.7): Der Dialog nennt den Commit beim letzten Start des Entwicklungsservers, die Fußzeile den Commit beim Start des Backends. Nach einem Wechsel des Commits oder bei nicht committeten Änderungen können beide vom laufenden Code und voneinander abweichen. Nach einem Neustart beider Prozesse nennen beide den dann ausgecheckten Commit; nicht committete Änderungen gehören zu keinem Commit und bleiben eine Abweichung, bis sie committet oder verworfen sind und beide Prozesse neu gestartet wurden.
- Außerhalb des Entwicklungsbetriebs startet pipwerk Studio mit dem Testumgebungsskript (Abschnitt 4a). Installation und Paketierung sind nicht festgelegt.
- Die öffentliche Web-API hat die Version 1 unter `/api/v1/`; die Versionierung gilt über den Pfad (Abschnitt 5.3). Noch nicht festgelegt sind Anmeldung und Zugriffsschutz der Web-API (Abschnitt 8) und der Zeitraum, für den eine ältere Version neben einer neueren bestehen bleibt.
- Die Oberfläche nutzt die Web-API noch nicht (Arbeitspakete `wp02` und `wp03`). Strategien und Vorlagen lassen sich bisher nur über die Web-API und `/docs` bearbeiten.
- Eine nicht lesbare Datei im Objektverzeichnis lässt sich über die Web-API weder ersetzen noch löschen (`409`); sie wird im Dateisystem entfernt (Abschnitt 2.9).
- Die Sperre der Ablage gilt nur innerhalb eines Prozesses; auch das Anlegen und Ersetzen über die Web-API ist nicht gegen mehrere Backend-Prozesse auf demselben Verzeichnis gesperrt.
- Die Ausführung von Strategien, die Berechnung von Indikatoren und die Auswertung von Ausdrücken gibt es nicht (Spezifikation Abschnitt 1).
- Eine Erkennung der Browsersprache gibt es nicht. Die Oberflächensprache gilt komponentenweit und nicht benutzerbezogen; Benutzerkonten sind nicht Bestandteil von WO-2026-10-04-001.
- Die Sperre der Ablage gilt nur innerhalb eines Backend-Prozesses (Abschnitt 2.8).
- Der Browser-End-to-End-Test weist keinen Backend-Neustart nach. Die Wiederherstellung nach einem Neustart weist der Backend-Komponententest mit echten Prozessneustarts nach (Abschnitt 6.1).
- Der `npm audit`-Befund zu `source-map-js` (Abschnitt 7) ist nicht behoben.

## 10. Glossar

| Begriff | Bedeutung |
| --- | --- |
| Alembic | Werkzeug zu SQLAlchemy, das Änderungen am Datenbankaufbau versioniert durchführt (Abschnitt 2.1). |
| ASGI-Server | Programm, das eine Python-Webanwendung ausführt und ihr die HTTP-Anfragen aus dem Netzwerk übergibt. |
| autoritativ | Maßgebliche Quelle; hier ist dies das Backend und nicht der Browser. |
| Backend | Der Teil einer Anwendung, der auf dem Rechner als eigener Prozess läuft und Anfragen der Oberfläche beantwortet. |
| Betriebskonfiguration | Im Speicher der Komponente abgelegte Einstellungen, die zur Laufzeit verwendet werden, zum Beispiel die Oberflächensprache. |
| CORS | Regeln, mit denen ein Server erlaubt, dass eine Webseite von einer anderen Adresse aus auf ihn zugreift. |
| Endpunkt | Eine Adresse der HTTP-Schnittstelle, die eine bestimmte Anfrage entgegennimmt. |
| End-to-End-Test | Ein Test, der die Anwendung in einem echten Browser bedient und dabei alle beteiligten Teile gemeinsam prüft. |
| Entwicklungsserver | Ein Programm, das die Oberfläche während der Entwicklung im Browser bereitstellt und Änderungen sofort sichtbar macht. |
| Lockdatei | Datei, in der die genauen Versionen aller installierten Pakete festgehalten sind, damit jede Installation dieselben Versionen erhält. |
| Objektverzeichnis | Verzeichnis, in dem pipwerk Studio je Objekt eine Datei `<uuid>.<art>.json` ablegt; eine Einstellung der Komponente (Abschnitt 2.8). |
| Oberfläche | Der im Browser angezeigte und bedienbare Teil von pipwerk Studio. |
| SQLAlchemy-URL | Zeichenfolge, die Art und Adresse eines Datenbankspeichers beschreibt. |
| Startkonfiguration | Administrativ verwaltete INI-Datei mit den Angaben, die zum Start und zum Auffinden des Speichers nötig sind. |
| Testumgebung | pipwerk Studio, gebaut und gestartet aus genau einem Commit eines Arbeitsverzeichnisses ohne nicht committete Änderungen (Abschnitt 4a). |
| Testumgebungsskript | Das Skript `components/pipwerk-studio/scripts/testenv`, das die Testumgebung startet, abfragt und beendet. |
| Übersetzungsschlüssel | Ein sprachneutraler Name für einen sichtbaren Text. Zu jedem Schlüssel gibt es einen Text je Sprache. |
| Virtuelle Umgebung | Ein eigenes Verzeichnis mit Python-Paketen für ein Projekt, getrennt von den Paketen des Betriebssystems. |
| Bibliothek | Die gemeinsame Python-Bibliothek `pipwerk_domain` in `packages/domain-core`: Typbeschreibungen, Objektmodell, Ausdrücke, Konsistenzprüfung und Dokumente. Das Backend bindet sie als Pfadabhängigkeit ein (Abschnitt 2.9). |
| Web-API | Die über HTTP erreichbare Schnittstelle der Komponente. Die öffentliche Web-API liegt unter `/api/v1/` und ist unter `contracts/api/pipwerk-studio/v1/openapi.json` beschrieben; die Endpunkte unter `/api/` außerhalb von `/api/v1/` sind interne Verbindungen (Abschnitt 5). |
| nicht lesbare Datei | Eine Datei im Objektverzeichnis, die sich nicht lesen lässt, dem Schema nicht entspricht, zu groß ist oder zu ihrem Dateinamen nicht passt. Sie erscheint in der Liste mit dem Kennzeichen „nicht lesbar“ und wird nie verändert (Abschnitt 2.9). |
