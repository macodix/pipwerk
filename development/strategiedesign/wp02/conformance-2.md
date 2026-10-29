# Prüfung des Entwurfs, Arbeitspaket wp02, Durchlauf 2

- Ergebnis: **bestanden** (kein blockierender Befund)
- Art: Nachprüfung von K1 und K2 aus [Durchlauf 1](conformance-1.md) und der dafür geänderten Stellen
- Bezug: `strategiedesign/wp02`, Meldung `conform` mit dem Prüfbericht der QA `strategiedesign/wp02:development/strategiedesign/wp02/reviews/7.md`
- geprüfter Commit: `18ec1ffb94d211e6e7818e79a5b1135cb3d5f11e`. Der Zweig steht danach auf `d3f5b93`; der Unterschied sind nur Prüfauftrag und Bericht der QA.
- Grundlage: Spezifikation E2, E4, E8, 3.3, 4.2 (Fassung vom 2026-10-29), Auftrag 19 `strategiedesign/wp02:development/strategiedesign/wp02/orders/19.md`, Testbericht `strategiedesign/wp02:development/strategiedesign/wp02/tests/19-1-functiontest.md`, Prüfbericht der QA Durchlauf 7
- Mittel: Unterschied der Commits `5f4df69` und `18ec1ff` in `components/` und `docs/` gelesen, Suche im Quelltext der Oberfläche mit `git grep`, Quelltext von `insert_instance` in der Bibliothek gelesen. Die Testumgebung steht auf `18ec1ff` (`git rev-parse HEAD`), Backend (Port 8001) und Oberfläche (Port 5174) antworten mit 200. Einen eigenen Aufruf von `POST /api/v1/insert` mit der gesicherten Strategie konnte ich nicht ausführen: Die beiden Befehle dafür wurden in dieser Sitzung abgelehnt. Den Fall am echten Backend hat die QA im Browser geprüft (Bericht 7, Punkt 1).

## Nachprüfung

- **K1 behoben.** `requestInsert` (`frontend/src/api/objects.ts:196`) ruft `/api/v1/insert` mit Dokument, Vorlage oder Objekttyp und Namen auf. `insertNow` (`state/useStudioController.ts:471`) nimmt jede eingefügte Instanz daraus, für mitgelieferte und eigene Vorlagen, Regeln, Listen von Instanzen und Objekttypen mit Instanz; Klick, Ziehen und die Liste „Regel oder Regelwerk hinzufügen …“ laufen über dieselbe Funktion. `instanceFromTemplate`, `instanceFromType` und `newTemplateElement` gibt es nicht mehr (`git grep` ohne Treffer). Die Oberfläche bildet Namen nur noch für Auslöser und Schritte des Ablaufs (`useStudioController.ts:508`), deren Kennung von `/api/v1/keys` kommt; das entspricht E2. Das Dokument ändert sich erst mit der Antwort; Einfügungen laufen nacheinander (`insertQueue`). Nachweis am echten Backend: QA Bericht 7 Punkt 1 („Prüfregeln Mindestvolumen“, `pruefregeln_mindestvolumen`, `check` ohne `name.duplicate`).
- **K2 behoben.** `docs/technical/pipwerk-studio.md` Abschnitt 2.3 nennt Abschnitt 5 der Spezifikation maßgeblich und den Prototyp ein Hilfsmittel; eine Tabelle nennt die Dateien mit übernommenem Code (`arrange/layout.ts`, `arrange/scene.ts`, `styles.css`, `ui/Icon.tsx`, `ui/TipLayer.tsx`) und die Dateien, deren Aufbau dem Prototyp folgt. Das entspricht E8.

## Geänderte Stellen

- Aufbau unverändert: kein neues Programm, kein neuer Baustein, keine neue Schnittstelle; die Oberfläche nutzt den Endpunkt aus 4.2. Kein neuer blockierender Befund.
- `testing/fakeInsert.ts` bildet die Benennung von `insert_instance` für die Tests nach. Das ist Testcode, nicht Teil der ausgelieferten Oberfläche.

## Hinweise (nicht blockierend)

- H1 bis H8 aus Durchlauf 1 bleiben offen; Auftrag 19 hat sie nach seinem Nicht-Umfang nicht bearbeitet.
- H9 Standardwerte der Parameter setzt beim Einfügen aus einem Objekttyp die Oberfläche (`document/build.ts`, `withStandardValues`), nicht die Bibliothek (`operations.py:486`: `Instance` ohne `parameter_values`). 4.2 nennt die Antwort von `insert` eine vollständige Instanz. Die Oberfläche liest die Standardwerte allgemein aus der Typbeschreibung, ohne Verzweigung nach Typen; besser wäre, die Bibliothek setzte sie.

## Nächster Schritt

Der Entwicklungsleiter meldet das Paket zur Abnahme (`acceptance`).
