---
name: pipwerk-test-deployment
description: Stellt ausschließlich den von QA freigegebenen Pipwerk-Codezustand bereit und verifiziert den Teststand.
---

# pipwerk-test-deployment

1. Übernimm QA-Freigabe und Commit.
2. Verifiziere die Bindung der Freigabe an diesen Commit.
3. Stelle ausschließlich diesen Codezustand bereit.
4. Starte die erforderlichen Komponenten.
5. Verifiziere, dass der laufende Teststand dem freigegebenen Commit entspricht.
6. Stoppe die Übergabe bei Abweichung.
7. Übergib Arbeitsauftrag, Commit und Prüfinformationen an den externen Projektleiter.
