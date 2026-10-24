"""Vorhaben: ohne Plan, ohne ``scope.md``, Namen, Reihenfolge, Geschichte der Meldungen."""

from __future__ import annotations

import generate

from .support import RepoCase, moment

MELDUNGSTEXT = "NUR-IN-DER-MELDUNG"


class WithoutPlan(RepoCase):
    def test_vorhaben_without_plan_has_no_packages(self) -> None:
        self.repo.scope("abc", "Probe")
        self.repo.message("devlead", 1, "abc", "implement")
        self.repo.commit()
        model = self.vorhaben("abc")
        self.assertFalse(model.has_packages)
        self.assertEqual(model.packages, [])
        self.assertEqual(model.phase, 4)
        page = self.page()
        self.assertIn('<section id="abc/4"', page)
        self.assertNotIn("von 0 Paketen", page)
        self.assertNotIn("Pakete ansehen", page)

    def test_package_messages_of_a_vorhaben_without_plan_are_ignored(self) -> None:
        self.repo.scope("abc", "Probe")
        self.repo.message("devlead", 1, "abc", "specify")
        self.repo.message("devlead", 2, "abc/wp01", "implement")
        self.repo.commit()
        self.assertEqual(self.vorhaben("abc").phase, 2)

    def test_phase_steps_of_the_levels(self) -> None:
        self.repo.scope("abc", "Probe")
        self.repo.message("devlead", 1, "abc", "implement")
        self.repo.commit()
        page = self.page()
        green = page.split('<section id="abc/3"')[1].split("</section>")[0]
        grey = page.split('<section id="abc/6"')[1].split("</section>")[0]
        self.assertIn("Planung abgeschlossen", green)
        self.assertIn("Noch nicht erreicht", grey)

    def test_vorhaben_without_message_is_grey(self) -> None:
        self.repo.scope("abc", "Probe")
        self.repo.commit()
        model = self.vorhaben("abc")
        self.assertEqual(model.stand, "grau")
        self.assertIsNone(model.phase)
        self.assertEqual([p.stand for p in model.phases], ["grau"] * 6)
        self.assertIn("noch keine", self.page())


class Existence(RepoCase):
    def test_vorhaben_without_scope_does_not_appear(self) -> None:
        self.repo.write("development/nirgends/specification.md", "# Spezifikation\n")
        self.repo.message("devlead", 1, "nirgends", "implement")
        self.repo.commit()
        self.assertEqual(self.overview().vorhaben, [])
        self.assertNotIn("nirgends", self.page())

    def test_ref_without_vorhaben_does_not_appear(self) -> None:
        self.repo.scope("abc", "Probe")
        self.repo.message("devlead", 1, "abc", "implement")
        self.repo.message("projectlead", 2, "ungueltig", "failed")
        self.repo.commit()
        self.assertEqual([v.id for v in self.overview().vorhaben], ["abc"])

    def test_names_come_from_scope_and_fall_back_to_the_id(self) -> None:
        self.repo.scope("abc", "Entwicklungsverfahren verbessern")
        self.repo.scope("ohne")
        self.repo.commit()
        self.assertEqual(self.vorhaben("abc").name, "Entwicklungsverfahren verbessern")
        self.assertEqual(self.vorhaben("ohne").name, "ohne")

    def test_package_name_from_the_plan_heading(self) -> None:
        packages = generate.parse_plan(
            "| Paket | Titel | hängt ab von | Stand |\n|---|---|---|---|\n"
            "| `wp01` | Tabellentitel | – | `open` |\n\n## wp01 – Name in der Überschrift\n"
        )
        self.assertEqual(packages[0].name, "Name in der Überschrift")


class OrderAndHistory(RepoCase):
    def test_order_by_first_message_then_not_begun_then_finished(self) -> None:
        for vorhaben in ("fertig", "spaet", "frueh", "leer1", "leer2"):
            self.repo.scope(vorhaben)
        self.repo.message("projectlead", 1, "fertig", "integrated", seq=1)
        self.repo.message("devlead", 30, "spaet", "implement", seq=1)
        self.repo.message("devlead", 20, "frueh", "implement", seq=1)
        self.repo.message("devlead", 90, "frueh", "fix", seq=2)
        self.repo.commit()
        self.assertEqual(
            [v.id for v in self.overview().vorhaben],
            ["frueh", "spaet", "leer1", "leer2", "fertig"],
        )

    def test_newest_message_by_time_in_the_file_name_not_by_commit(self) -> None:
        self.repo.scope("abc", "Probe")
        self.repo.message("devlead", 50, "abc", "implement")
        self.repo.commit("zuerst die jüngere Meldung")
        self.repo.message("architect", 10, "abc", "specify")
        self.repo.commit("danach die ältere Meldung")
        model = self.vorhaben("abc")
        self.assertEqual(model.phase, 4)
        self.assertEqual(model.since, moment(50))

    def test_removed_messages_still_count(self) -> None:
        self.repo.scope("abc", "Probe")
        old = self.repo.message("devlead", 5, "abc", "implement")
        self.repo.commit()
        self.repo.remove(old)
        self.repo.commit("Meldung bearbeitet und entfernt")
        model = self.vorhaben("abc")
        self.assertEqual(model.phase, 4)
        self.assertEqual(model.since, moment(5))
        self.assertEqual(model.first_message, moment(5))

    def test_the_newest_message_wins_over_a_removed_older_one(self) -> None:
        self.repo.scope("abc", "Probe")
        first = self.repo.message("devlead", 5, "abc", "implement")
        self.repo.commit()
        self.repo.remove(first)
        self.repo.message("projectlead", 9, "abc", "acceptance")
        self.repo.commit()
        self.assertEqual(self.vorhaben("abc").phase, 5)

    def test_same_time_orders_by_sequence_number(self) -> None:
        self.repo.scope("abc", "Probe")
        self.repo.message("architect", 5, "abc", "specify", seq=1)
        self.repo.message("devlead", 5, "abc", "implement", seq=2)
        self.repo.commit()
        self.assertEqual(self.vorhaben("abc").phase, 4)

    def test_only_main_is_the_source(self) -> None:
        self.repo.scope("abc", "Probe")
        self.repo.message("devlead", 1, "abc", "implement")
        self.repo.commit()
        self.repo.git("checkout", "-q", "-b", "arbeit")
        self.repo.message("projectlead", 9, "abc", "acceptance")
        self.repo.scope("nurzweig", "Zweig")
        self.repo.commit()
        # Die Arbeitskopie zeigt den Zweig, gelesen wird main.
        model = self.vorhaben("abc")
        self.assertEqual(model.phase, 4)
        self.assertEqual([v.id for v in self.overview().vorhaben], ["abc"])

    def test_message_text_never_appears(self) -> None:
        self.repo.scope("abc", "Probe")
        self.repo.message("devlead", 1, "abc", "implement", text=MELDUNGSTEXT)
        self.repo.commit()
        self.assertNotIn(MELDUNGSTEXT, self.page())

    def test_unreadable_message_files_are_skipped(self) -> None:
        self.repo.scope("abc", "Probe")
        self.repo.write(
            "development/messages/devlead/20261001100000-projectlead-01.md", "kein Aufbau\n"
        )
        self.repo.write(
            "development/messages/devlead/notizen.md", "- ref: `abc`\n- task: `implement`\n"
        )
        self.repo.message("architect", 3, "abc", "specify")
        self.repo.commit()
        self.assertEqual(self.vorhaben("abc").phase, 2)


class Parsing(RepoCase):
    def test_name_line(self) -> None:
        self.assertEqual(generate.parse_name("# V\n\nName: Mein Name.\n\nText\n"), "Mein Name")
        self.assertIsNone(generate.parse_name("# V\n\nKein Name hier\n"))

    def test_parse_message_fields(self) -> None:
        message = generate.parse_message(
            "development/messages/devlead/20261024074954-projectlead-01.md",
            "# Meldung\n\n- from: `projectlead`\n- ref: `verfahren/wp01`\n- task: `implement`\n"
            "- document: `zweig:development/verfahren/plan.md`\n\nText\n",
        )
        assert message is not None
        self.assertEqual(
            (message.ref, message.task, message.recipient),
            ("verfahren/wp01", "implement", "devlead"),
        )
        self.assertEqual(message.when, generate.parse_time("2026-10-24 07:49:54"))
        self.assertIsNone(
            generate.parse_message("development/messages/devlead/x.md", "- ref: `a`\n")
        )
