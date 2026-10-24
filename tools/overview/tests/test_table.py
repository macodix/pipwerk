"""Jede Zeile der Tabelle in 7.2 der Spezifikation, ein Vorhaben ohne Plan (ref ``abc``)."""

from __future__ import annotations

from dataclasses import dataclass

import generate

from .support import RepoCase, moment

SPEC = "development/abc/specification.md"
PLAN = "development/abc/plan.md"


@dataclass(frozen=True)
class Step:
    recipient: str
    task: str
    document: str = SPEC


@dataclass(frozen=True)
class Row:
    name: str
    steps: tuple[Step, ...]
    phase: int
    bei: list[str]
    stand: str = generate.GELB
    finished: bool = False


ROWS = [
    Row("check", (Step("architect", "check"),), 1, ["Softwarearchitekt"]),
    Row("review", (Step("projectlead", "review"),), 1, ["Projektleiter"]),
    Row("specify", (Step("architect", "specify"),), 2, ["Softwarearchitekt"]),
    Row("revise zur Spezifikation", (Step("architect", "revise", SPEC),), 2, ["Softwarearchitekt"]),
    Row("present zur Spezifikation", (Step("projectlead", "present", SPEC),), 2, ["Projektleiter"]),
    Row("plan", (Step("architect", "plan"),), 3, ["Softwarearchitekt"]),
    Row("revise zum Plan", (Step("architect", "revise", PLAN),), 3, ["Softwarearchitekt"]),
    Row("present zum Plan", (Step("projectlead", "present", PLAN),), 3, ["Projektleiter"]),
    Row("implement", (Step("devlead", "implement"),), 4, ["Team"]),
    Row("fix", (Step("devlead", "fix"),), 4, ["Team"]),
    Row("amended", (Step("devlead", "amended"),), 4, ["Team"]),
    Row("answer an den Entwicklungsleiter", (Step("devlead", "answer"),), 4, ["Team"]),
    Row(
        "amend, Bezug implement",
        (Step("devlead", "implement"), Step("architect", "amend")),
        4,
        ["Softwarearchitekt"],
    ),
    Row(
        "amend, Bezug acceptance",
        (
            Step("devlead", "implement"),
            Step("projectlead", "acceptance"),
            Step("architect", "amend"),
        ),
        5,
        ["Softwarearchitekt"],
    ),
    Row(
        "answer an den Softwarearchitekten, Bezug plan",
        (Step("architect", "plan"), Step("architect", "answer")),
        3,
        ["Softwarearchitekt"],
    ),
    Row(
        "question, Bezug specify",
        (Step("architect", "specify"), Step("projectlead", "question")),
        2,
        ["Projektleiter"],
    ),
    Row(
        "question, Bezug acceptance",
        (Step("projectlead", "acceptance"), Step("projectlead", "question")),
        5,
        ["Projektleiter"],
    ),
    Row("acceptance", (Step("projectlead", "acceptance"),), 5, ["Projektleiter"]),
    Row("integrate", (Step("devlead", "integrate"),), 6, ["Team"]),
    Row(
        "integrated",
        (Step("devlead", "integrate"), Step("projectlead", "integrated")),
        6,
        [],
        stand=generate.GRUEN,
        finished=True,
    ),
    Row(
        "failed, Bezug implement",
        (Step("devlead", "implement"), Step("projectlead", "failed")),
        4,
        ["Projektleiter"],
    ),
    Row(
        "failed, Bezug specify",
        (Step("architect", "specify"), Step("projectlead", "failed")),
        2,
        ["Projektleiter"],
    ),
    Row(
        "question ohne Bezugsmeldung",
        (Step("projectlead", "question"),),
        1,
        ["Projektleiter"],
    ),
]


class TableRows(RepoCase):
    def test_every_row_of_the_table(self) -> None:
        for row in ROWS:
            with self.subTest(row.name):
                self.setUp()
                self.repo.scope("abc", "Probe")
                for index, step in enumerate(row.steps):
                    self.repo.message(
                        step.recipient, index + 1, "abc", step.task, document=step.document
                    )
                self.repo.commit()
                model = self.vorhaben("abc")
                self.assertEqual(model.phase, row.phase)
                self.assertEqual(model.bei, row.bei)
                self.assertEqual(model.stand, row.stand)
                self.assertEqual(model.finished, row.finished)
                self.assertEqual(model.since, None if row.finished else moment(len(row.steps)))

    def test_phase_colours_follow_the_newest_message(self) -> None:
        self.repo.scope("abc", "Probe")
        self.repo.message("devlead", 1, "abc", "implement")
        self.repo.message("projectlead", 2, "abc", "acceptance")
        self.repo.commit()
        stands = [phase.stand for phase in self.vorhaben("abc").phases]
        self.assertEqual(stands, ["gruen", "gruen", "gruen", "gruen", "gelb", "grau"])

    def test_finished_vorhaben_is_green_in_every_phase(self) -> None:
        self.repo.scope("abc", "Probe")
        self.repo.message("projectlead", 1, "abc", "integrated")
        self.repo.commit()
        model = self.vorhaben("abc")
        self.assertEqual([p.stand for p in model.phases], ["gruen"] * 6)
        self.assertEqual(model.stand, "gruen")

    def test_steps_of_the_yellow_phase(self) -> None:
        expected = {
            "check": "Anforderungen werden geprüft",
            "review": "Prüfbericht wird bearbeitet",
            "specify": "Spezifikation wird erstellt",
            "plan": "Plan wird erstellt",
            "revise": "Einwände werden eingearbeitet",
            "present": "Präsentation wird vorbereitet",
            "question": "Frage wird bearbeitet",
            "implement": "Umsetzung läuft",
            "fix": "Umsetzung läuft",
            "amended": "Umsetzung läuft",
            "amend": "Lücke in der Spezifikation",
            "acceptance": "Ergebnis wird vorgelegt",
            "integrate": "Übernahme in main",
            "failed": "Aufgabe abgebrochen",
        }
        recipients = {
            "amend": "architect",
            "check": "architect",
            "specify": "architect",
            "plan": "architect",
            "revise": "architect",
        }
        for task, text in expected.items():
            with self.subTest(task):
                self.setUp()
                self.repo.scope("abc", "Probe")
                self.repo.message(recipients.get(task, "devlead"), 1, "abc", task)
                self.repo.commit()
                self.assertEqual(self.vorhaben("abc").step, text)
                self.assertIn(text, self.page())
