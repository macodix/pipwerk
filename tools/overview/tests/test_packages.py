"""Pakete: Reihenfolge des Plans, Paket ohne Meldung, ``done`` im Plan, Farben, Plan im Vorhaben."""

from __future__ import annotations

import generate

from .support import RepoCase, moment, plan_text

PLAN_DOC = "development/abc/plan.md"


class Packages(RepoCase):
    def setUp(self) -> None:
        super().setUp()
        self.repo.scope("abc", "Probe")
        self.repo.write(
            PLAN_DOC,
            plan_text(
                [
                    ("wp01", "Grundlage", "–", "done"),
                    ("wp02", "Mitte", "`wp01`", "open"),
                    ("wp03", "Ende", "`wp02`, `xyz/wp07`", "open"),
                ]
            ),
        )
        self.repo.scope("xyz", "Fremdes")
        self.repo.write(
            "development/xyz/plan.md", plan_text([("wp07", "Fremdes Paket", "–", "open")])
        )

    def test_packages_in_the_order_of_the_plan_with_names(self) -> None:
        self.repo.commit()
        model = self.vorhaben("abc")
        self.assertEqual([p.id for p in model.packages], ["wp01", "wp02", "wp03"])
        self.assertEqual([p.name for p in model.packages], ["Grundlage", "Mitte", "Ende"])

    def test_package_without_message_waits_with_its_dependencies(self) -> None:
        self.repo.commit()
        packages = self.vorhaben("abc").packages
        self.assertEqual(packages[1].kind, "wartet")
        self.assertEqual(packages[1].depends, ["Grundlage (wp01)"])
        self.assertEqual(packages[2].depends, ["Mitte (wp02)", "Fremdes Paket (xyz/wp07)"])
        page = self.page()
        self.assertIn("wartet auf Grundlage (wp01)", page)
        self.assertIn("wartet auf Mitte (wp02), Fremdes Paket (xyz/wp07)", page)

    def test_package_with_done_is_finished(self) -> None:
        self.repo.commit()
        package = self.vorhaben("abc").packages[0]
        self.assertEqual(package.kind, "fertig")
        for nr in (4, 5, 6):
            self.assertEqual(package.stand_in(nr), "gruen")

    def test_finished_package_names_the_day_of_integrated(self) -> None:
        self.repo.message(
            "projectlead", 60 * 24 * 3 + 5, "abc/wp01", "integrated", document=PLAN_DOC
        )
        self.repo.commit()
        package = self.vorhaben("abc").packages[0]
        self.assertEqual(str(package.integrated_on), "2026-10-04")
        self.assertIn("fertig, in main seit", self.page())
        self.assertIn("04.10.2026", self.page())

    def test_package_colours_in_phases_four_to_six(self) -> None:
        self.repo.message("devlead", 1, "abc/wp02", "implement", document=PLAN_DOC)
        self.repo.message("projectlead", 2, "abc/wp02", "acceptance")
        self.repo.commit()
        package = self.vorhaben("abc").packages[1]
        self.assertEqual((package.kind, package.phase), ("aktiv", 5))
        self.assertEqual([package.stand_in(nr) for nr in (4, 5, 6)], ["gruen", "gelb", "grau"])
        waiting = self.vorhaben("abc").packages[2]
        self.assertEqual([waiting.stand_in(nr) for nr in (4, 5, 6)], ["grau", "grau", "grau"])

    def test_notes_for_amend_question_and_failed(self) -> None:
        notes = {
            ("architect", "amend"): "Lücke in der Spezifikation",
            ("projectlead", "question"): "Frage wird bearbeitet",
            ("projectlead", "failed"): "Aufgabe abgebrochen",
        }
        for (recipient, task), text in notes.items():
            with self.subTest(task):
                self.setUp()
                self.repo.message("devlead", 1, "abc/wp02", "implement", document=PLAN_DOC)
                self.repo.message(recipient, 2, "abc/wp02", task)
                self.repo.commit()
                package = self.vorhaben("abc").packages[1]
                self.assertEqual(package.notiz, text)
                self.assertEqual(package.phase, 4)
                self.assertEqual(package.since, moment(2))

    def test_package_ref_outside_the_plan_is_ignored(self) -> None:
        self.repo.message("devlead", 1, "abc/wp09", "implement", document=PLAN_DOC)
        self.repo.commit()
        model = self.vorhaben("abc")
        self.assertEqual([p.id for p in model.packages], ["wp01", "wp02", "wp03"])
        self.assertIsNone(model.first_message)


class VorhabenWithPlan(RepoCase):
    def setUp(self) -> None:
        super().setUp()
        self.repo.scope("abc", "Probe")
        self.repo.write(
            PLAN_DOC,
            plan_text(
                [
                    ("wp01", "Eins", "–", "open"),
                    ("wp02", "Zwei", "–", "open"),
                    ("wp03", "Drei", "`wp01`", "open"),
                ]
            ),
        )

    def test_bei_and_seit_come_from_the_packages_in_progress(self) -> None:
        self.repo.message("devlead", 1, "abc/wp01", "implement", document=PLAN_DOC)
        self.repo.message("devlead", 2, "abc/wp02", "implement", document=PLAN_DOC)
        self.repo.message("projectlead", 9, "abc/wp02", "acceptance")
        self.repo.message("devlead", 5, "abc/wp01", "fix")
        self.repo.commit()
        model = self.vorhaben("abc")
        self.assertEqual(model.phase, 4)
        self.assertEqual(model.bei, ["Team", "Projektleiter"])
        self.assertEqual(model.since, moment(9))
        self.assertEqual(model.stand, "gelb")

    def test_waiting_package_is_not_counted_for_bei(self) -> None:
        self.repo.message("devlead", 1, "abc/wp01", "implement", document=PLAN_DOC)
        self.repo.commit()
        model = self.vorhaben("abc")
        self.assertEqual(model.bei, ["Team"])
        self.assertEqual(sum(1 for p in model.packages if p.kind == "wartet"), 2)
        self.assertIn("2 Pakete warten", self.page())

    def test_phase_colours_with_packages(self) -> None:
        self.repo.message("devlead", 1, "abc/wp01", "implement", document=PLAN_DOC)
        self.repo.message("projectlead", 2, "abc/wp01", "acceptance")
        self.repo.commit()
        model = self.vorhaben("abc")
        self.assertEqual([p.stand for p in model.phases], ["gruen"] * 3 + ["gelb", "gelb", "grau"])
        self.assertEqual([p.in_phase for p in model.phases][3:], [0, 1, 0])

    def test_all_packages_finished_is_green(self) -> None:
        self.repo.write(
            PLAN_DOC,
            plan_text([("wp01", "Eins", "–", "done"), ("wp02", "Zwei", "–", "done")]),
        )
        self.repo.message("projectlead", 3, "abc/wp02", "integrated", document=PLAN_DOC)
        self.repo.commit()
        model = self.vorhaben("abc")
        self.assertEqual(model.stand, "gruen")
        self.assertEqual([p.stand for p in model.phases], ["gruen"] * 6)
        self.assertEqual(model.bei, [])

    def test_phases_before_implementation_follow_the_newest_message(self) -> None:
        self.repo.message("projectlead", 1, "abc", "present", document=PLAN_DOC)
        self.repo.commit()
        model = self.vorhaben("abc")
        self.assertEqual(model.phase, 3)
        self.assertEqual(
            [p.stand for p in model.phases], ["gruen", "gruen", "gelb", "grau", "grau", "grau"]
        )
        self.assertEqual(model.bei, ["Projektleiter"])
        self.assertTrue(all(p.kind == "wartet" for p in model.packages))

    def test_first_implement_sets_phase_four_until_all_are_finished(self) -> None:
        self.repo.message("projectlead", 1, "abc", "present", document=PLAN_DOC)
        self.repo.message("devlead", 2, "abc/wp01", "implement", document=PLAN_DOC)
        self.repo.message("architect", 3, "abc", "revise", document=PLAN_DOC)
        self.repo.commit()
        self.assertEqual(self.vorhaben("abc").phase, 4)

    def test_dependency_ids_of_the_plan_table(self) -> None:
        packages = generate.parse_plan(
            plan_text([("wp01", "A", "–", "done"), ("wp02", "B", "`wp01`, Text, `r/wp03`", "open")])
        )
        self.assertEqual(packages[1].depends, ("wp01", "r/wp03"))
        self.assertTrue(packages[0].done)
        self.assertFalse(packages[1].done)
