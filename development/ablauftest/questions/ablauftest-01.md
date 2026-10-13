# Frage ablauftest-01

- von: Softwarearchitekt
- an: Auftraggeber über den Projektleiter
- Bezug: req-ui-010 „Angaben zu pipwerk studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`
- unterbrochene Aufgabe: `specify` für das Vorhaben `ablauftest`
- Stand der Aufgabe: Die Spezifikation liegt als Entwurf in `development/ablauftest/specification.md`. Sie ist bis auf die zwei Stellen dieser Frage vollständig (Abschnitt 3.3 und 3.6, dort als offen gekennzeichnet). Die Prüfung durch die QA folgt nach der Antwort, damit sie den vollständigen Stand prüft.

Die Fragen sind voneinander unabhängig und können einzeln vorgelegt werden.

## Frage 1: Wo wird der Dialog geöffnet?

req-ui-010 kennzeichnet die Aufrufstelle selbst als offen. Ohne sie lässt sich der Dialog nicht bedienen und nicht abnehmen.

Heute hat die Oberfläche eine Kopfzeile mit dem Namen links und der Sprachauswahl rechts, die Arbeitsfläche und eine Fußzeile mit Verbindungsanzeige und Standanzeige. Ein Menü gibt es noch nicht. Der Menüpunkt „Einstellungen“ aus req-ui-009 ist noch nicht gebaut.

Benötigt wird: An welcher Stelle steht das Bedienelement, mit dem der Anwender den Dialog öffnet, und wie ist es beschriftet?

Vorschlag des Softwarearchitekten: eine Schaltfläche „Über pipwerk studio“ (englisch „About pipwerk studio“) in der Kopfzeile rechts neben der Sprachauswahl.

Antwort:

## Frage 2: Was zeigt der Dialog, wenn kein Datum zu finden ist?

req-ui-010 legt fest: Der Stand ist die Kennung des Commits mit Datum und Uhrzeit. Ist das Datum auf dem Rechner nicht ermittelbar, kommt es von GitHub. Ist der Stand nicht ermittelbar, steht dort „unbekannt“.

Nicht festgelegt ist der Fall, dass die Kennung bekannt ist, das Datum aber weder auf dem Rechner noch bei GitHub zu ermitteln ist. Das kommt vor, wenn GitHub nicht erreichbar ist, zum Beispiel ohne Internetverbindung.

Benötigt wird: Was steht in diesem Fall beim Stand?

Vorschlag des Softwarearchitekten: die Kennung ohne Datum. Die Kennung allein bezeichnet den Stand eindeutig. „unbekannt“ würde eine bekannte Angabe verschweigen.

Antwort:
