# Prüfbericht QA, Plan, Durchlauf 1

- Vorhaben: `relay`, Phase 3
- Geprüfter Commit: `0bf2be63a59cf42f0954b6b2bee087d141d2e33e` (`main`)
- Geprüft: `development/relay/plan.md` gegen `specification.md` und `scope.md` mit den dort genannten Anforderungen

## Ergebnis: **bestanden**

Kein blockierender Befund. Fünf Hinweise unten.

## Prüfpunkte

1. **Abdeckung.** Jede Anforderung aus `scope.md` hat in der Spezifikation ihren Platz (Abschnitt 10 und 1). Jeder Abschnitt der Spezifikation steht in der Tabelle „Abdeckung der Spezifikation“ und in „Umgesetzte Teile“ eines Pakets. Ich habe Abschnitte 1 bis 9 einzeln gegen die vier Pakete abgeglichen: Es fehlt kein Teil. Die Zuteilung stimmt mit den Umfängen überein: Matrix in `wp02`, `stored` und 3.6 in `wp03`, Web-API und `http` in `wp04`, Empfangsbestätigung in `wp01`.
2. **Aufbau der Pakete.** Alle vier Pakete haben Ziel, Umfang, Nicht-Umfang, umgesetzte Teile, Abhängigkeiten und Abnahmekriterien. Jedes endet in einem Ergebnis, das der Auftraggeber selbst führt (Durchgang 2, 1, 3; bei `wp04` die Umstellung auf `http`).
3. **Nachweis.** Der Nachweis aus `scope.md` (Anfrage über pipwerk relay, Dateien kommen zurück, einmal über Matrix, einmal über Dateien) ist führbar: Durchgang 2 in `wp01` (Kriterium 2), Durchgang 1 in `wp02` (Kriterium 2), Durchgang 3 in `wp03` (Kriterium 2). Die Rechner und Voraussetzungen stimmen mit Abschnitt 8 überein.
4. **Abhängigkeiten.** Sie sind schlüssig und ohne Zyklus: `wp01` ← `backtest/wp02`, `wp02` und `wp04` ← `wp01`, `wp03` ← `wp02` (Durchgang 3 braucht Matrix). `backtest/wp02`, Durchlauf 2: bestanden, geprüfter Commit `d994dfaf02a49aa1ac0ea954c35e6ce64d8a0f2d` (`backtest/wp02:development/backtest/wp02/reviews/2.md`), wie im Plan genannt. Der Zweig liegt inzwischen auf `b309f8ad52a015d3828ea04e0d90aaec6f4a89f5`; der Plan regelt das mit dem Merge-Commit vor der Prüfung von `wp01` (Abhängigkeiten, Nr. 2). `pipwerk-fetch-mt5` und das Dateiformat des Imports liefert `backtest/wp02`, wie in `scope.md` genannt.
5. **Einschränkungen durch Abnahmekriterien.** Keine gefunden. Die Kriterien folgen der Spezifikation (zum Beispiel `broker_mismatch` und `unknown_recipient` nach 6.2 und 4.1, kein Port nach E2, Bindung an `127.0.0.1` nach E3, Entfernen der Dateien nach 3.6).

## Hinweise (nicht blockierend)

- H1: Die Empfangsbestätigung (req-relay-013, 3.7) hat im Plan kein Abnahmekriterium, das der Auftraggeber selbst führt. Der Abruf setzt `receipt` nie (6.2), also zeigt keiner der Durchgänge sie. `wp01` Kriterium 6 prüft nur die Dokumentation, die Tests nach Abschnitt 8 die Funktion. Das entspricht Abschnitt 8 der Spezifikation; ich nenne es, weil das Ergebnis dieses Teils nicht selbst prüfbar ist.
- H2: Die Tabelle „Abdeckung“ nennt in der Zeile 3.4 den Weg `http` nicht, `wp04` setzt ihn aber um (Umfang, zweiter Punkt). Die Zeile „2 E3“ deckt ihn nur indirekt.
- H3: Abschnitt 7 (HTTPS mit Prüfung des Zertifikats, Geheimnisse) steht bei `wp01` ohne Einschränkung auf Matrix und bei `wp02` „für Matrix“. Die Grenze zwischen beiden ist nicht eindeutig.
- H4: Die Prüfung neuer Abhängigkeiten nach Regel 12 nennt der Plan nur bei `wp02` (`httpx`, `matrix-synapse`). `asyncssh` (`wp01`) und die Bausteine der Web-API in `wp04` (FastAPI, Server, `httpx` als Client des Wegs `http`) nennt er nicht. Die Spezifikation (Abschnitt 7) weist die Prüfung dem jeweiligen Auftrag zu.
- H5: `wp02`, `wp03` und `wp04` ändern nebeneinander dieselben Dateien (`packages/relay-core`, `docs/technical/pipwerk-relay.md`, `docs/user/pipwerk-relay.md`, `relay-config.schema.json`). Die Reihenfolge der Übernahme in `main` regelt der Plan nur für `wp01`.
