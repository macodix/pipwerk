"""``waiting.md``: Zeilen der Wartenden, Meldungen vor und nach der Vorlage (7.2, 4.3 Punkt 2)."""

from __future__ import annotations

import generate

from .support import RepoCase, moment, plan_text

VORLAGE = "2026-10-01T10:30:00Z"  # Minute 30 der Tests


class ParseWaiting(RepoCase):
    def test_table_and_list_formats(self) -> None:
        rows = generate.parse_waiting(
            "# Wartet\n\n"
            "| ref | Handlung | Zeitpunkt (UTC) |\n|---|---|---|\n"
            "| `abc` | Präsentation bestätigen | 2026-10-01T10:30:00Z |\n"
            "| `abc/wp02` | Abnahme durchführen | 2026-10-01 11:00 |\n"
            "- `xyz` | Frage beantworten | 2026-10-02 09:15:30 UTC\n"
            "| kein ref | Unsinn | 2026-10-01 11:00 |\n"
            "| `abc/wp03` | Handlung ohne Zeit | unbekannt |\n"
        )
        self.assertEqual(
            [(r.ref, r.handlung) for r in rows],
            [
                ("abc", "Präsentation bestätigen"),
                ("abc/wp02", "Abnahme durchführen"),
                ("xyz", "Frage beantworten"),
                ("abc/wp03", "Handlung ohne Zeit"),
            ],
        )
        self.assertEqual(rows[0].since, moment(30))
        self.assertEqual(rows[1].since, moment(60))
        self.assertEqual(rows[2].since, generate.parse_time("2026-10-02 09:15:30"))
        self.assertIsNone(rows[3].since)


class WaitingWithoutPlan(RepoCase):
    def setUp(self) -> None:
        super().setUp()
        self.repo.scope("abc", "Probe")
        self.repo.message(
            "projectlead", 10, "abc", "present", document="development/abc/specification.md"
        )

    def test_without_row_the_table_applies(self) -> None:
        self.repo.commit()
        model = self.vorhaben("abc")
        self.assertEqual(model.bei, ["Projektleiter"])
        self.assertEqual(model.handlungen, [])
        self.assertNotIn("Wartet auf Sie", self.page())

    def test_row_after_the_message(self) -> None:
        self.repo.waiting("abc", [("abc", "Präsentation bestätigen", VORLAGE)])
        self.repo.commit()
        model = self.vorhaben("abc")
        self.assertEqual(model.bei, ["Auftraggeber"])
        self.assertEqual(model.since, moment(30))
        self.assertEqual(model.handlungen, ["Präsentation bestätigen"])
        self.assertEqual(model.phase, 2)
        self.assertIn("Wartet auf Sie: Präsentation bestätigen", self.page())

    def test_newer_message_than_the_row_keeps_waiting(self) -> None:
        # Der Auftraggeber hat geantwortet, die Zeile besteht noch (7.2, Fußnote).
        self.repo.waiting("abc", [("abc", "Präsentation bestätigen", VORLAGE)])
        self.repo.message(
            "architect", 45, "abc", "revise", document="development/abc/specification.md"
        )
        self.repo.commit()
        model = self.vorhaben("abc")
        self.assertEqual(model.bei, ["Auftraggeber"])
        self.assertEqual(model.since, moment(30))
        self.assertEqual(model.handlungen, ["Präsentation bestätigen"])

    def test_removed_row_returns_to_the_table(self) -> None:
        self.repo.waiting("abc", [("abc", "Präsentation bestätigen", VORLAGE)])
        self.repo.commit()
        self.repo.remove("development/abc/waiting.md")
        self.repo.commit()
        self.assertEqual(self.vorhaben("abc").bei, ["Projektleiter"])

    def test_row_marks_the_yellow_phase_and_its_step(self) -> None:
        self.repo.waiting("abc", [("abc", "Präsentation bestätigen", VORLAGE)])
        self.repo.commit()
        model = self.vorhaben("abc")
        marked = [p.nr for p in model.phases if p.handlungen]
        self.assertEqual(marked, [2])
        self.assertEqual(model.step_handlung, "Präsentation bestätigen")

    def test_row_of_another_vorhaben_is_not_used(self) -> None:
        self.repo.waiting("abc", [("xyz", "Frage beantworten", VORLAGE)])
        self.repo.commit()
        self.assertEqual(self.vorhaben("abc").bei, ["Projektleiter"])


class WaitingWithPlan(RepoCase):
    def setUp(self) -> None:
        super().setUp()
        self.repo.scope("abc", "Probe")
        self.repo.write(
            "development/abc/plan.md",
            plan_text([("wp01", "Erstes", "–", "open"), ("wp02", "Zweites", "–", "open")]),
        )
        self.repo.message("devlead", 1, "abc/wp01", "implement", document="development/abc/plan.md")
        self.repo.message("devlead", 2, "abc/wp02", "implement", document="development/abc/plan.md")
        self.repo.message("projectlead", 20, "abc/wp01", "acceptance")

    def test_message_before_the_row(self) -> None:
        self.repo.waiting("abc", [("abc/wp01", "Abnahme durchführen", VORLAGE)])
        self.repo.commit()
        model = self.vorhaben("abc")
        package = model.packages[0]
        self.assertEqual((package.kind, package.phase, package.bei), ("aktiv", 5, "Auftraggeber"))
        self.assertEqual(package.since, moment(30))
        self.assertEqual(package.handlung, "Abnahme durchführen")
        self.assertEqual(model.packages[1].bei, "Team")

    def test_message_after_the_row(self) -> None:
        self.repo.waiting("abc", [("abc/wp01", "Abnahme durchführen", VORLAGE)])
        self.repo.message("devlead", 50, "abc/wp01", "fix")
        self.repo.commit()
        package = self.vorhaben("abc").packages[0]
        self.assertEqual((package.phase, package.bei), (4, "Auftraggeber"))
        self.assertEqual(package.since, moment(30))

    def test_marker_on_all_three_levels(self) -> None:
        self.repo.waiting("abc", [("abc/wp01", "Abnahme durchführen", VORLAGE)])
        self.repo.commit()
        model = self.vorhaben("abc")
        self.assertEqual(model.handlungen, ["Abnahme durchführen"])
        self.assertEqual([p.nr for p in model.phases if p.handlungen], [5])
        self.assertEqual(model.bei, ["Auftraggeber", "Team"])
        page = self.page()
        # Das Paket behält die Marke in jeder Phasenansicht (7.4 Punkt 3).
        for nr in (4, 5, 6):
            section = page.split(f'<section id="abc/{nr}"')[1].split("</section>")[0]
            self.assertIn("Wartet auf Sie: Abnahme durchführen", section)
        section4 = page.split('<section id="abc/4"')[1].split("</section>")[0]
        self.assertEqual(section4.count("Wartet auf Sie"), 1)

    def test_vorhaben_level_row_in_the_planning_phase(self) -> None:
        RepoCase.setUp(self)  # neues Repository ohne die Meldungen der Paket-Tests
        self.repo.scope("abc", "Probe")
        self.repo.write("development/abc/plan.md", plan_text([("wp01", "Erstes", "–", "open")]))
        self.repo.message("projectlead", 5, "abc", "present", document="development/abc/plan.md")
        self.repo.waiting("abc", [("abc", "Präsentation bestätigen", VORLAGE)])
        self.repo.commit()
        model = self.vorhaben("abc")
        self.assertEqual(model.phase, 3)
        self.assertEqual(model.handlungen, ["Präsentation bestätigen"])
        self.assertEqual([p.nr for p in model.phases if p.handlungen], [3])
