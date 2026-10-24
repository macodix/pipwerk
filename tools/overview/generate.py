#!/usr/bin/env python3
"""Erzeugt die Übersicht ``development/overview.html`` aus ``main`` eines Repositorys.

Aufruf::

    python3 generate.py <wurzelverzeichnis-des-repositorys> <ausgabedatei> [--ref main] [--now ZEIT]

Das Skript liest nur (``git show``, ``git log``, ``git ls-tree``) und schreibt nur die
Ausgabedatei. Quelle ist allein der Zweig ``main`` des übergebenen Repositorys: ``scope.md``,
``plan.md`` und ``waiting.md`` jedes Vorhabens und die Geschichte von ``development/messages/``.
Die Regeln stehen in Abschnitt 7 der Spezifikation des Vorhabens ``verfahren`` (7.2: Stand,
7.3: Grenzen, 7.4: Gestaltung); ``README.md`` beschreibt Aufruf, Quellen und Tests.
"""

from __future__ import annotations

import argparse
import html
import re
import subprocess
import sys
from collections.abc import Iterable, Sequence
from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from pathlib import Path

TEMPLATE_PATH = Path(__file__).resolve().parent / "template.html"

PHASEN = ("Anforderung", "Konzeption", "Planung", "Umsetzung", "Abnahme", "Integration")

ARCHITEKT = "Softwarearchitekt"
PROJEKTLEITER = "Projektleiter"
TEAM = "Team"
AUFTRAGGEBER = "Auftraggeber"

GRAU, GELB, GRUEN = "grau", "gelb", "gruen"
STANDWORT = {GRAU: "○ Nicht begonnen", GELB: "◐ Begonnen", GRUEN: "● Erledigt"}

MESSAGE_PATH = re.compile(
    r"^development/messages/(?P<recipient>architect|devlead|projectlead)/"
    r"(?P<stamp>\d{14})-(?P<sender>[a-z]+)-(?P<seq>\d+)\.md$"
)
SCOPE_PATH = re.compile(r"^development/(?P<name>[a-z0-9]+)/scope\.md$")
REF_PATTERN = re.compile(r"^[a-z0-9]+(?:/wp\d+)?$")
FIELD_LINE = re.compile(r"^-\s+(?P<key>[a-z]+):\s*(?P<value>.*?)\s*$")
NAME_LINE = re.compile(r"^(?:[-*]\s+)?Name:\s*(?P<name>.+?)\s*$", re.MULTILINE)
PLAN_TABLE_ROW = re.compile(
    r"^\|\s*`?(?P<id>wp\d+)`?\s*\|(?P<title>[^|]*)\|(?P<deps>[^|]*)\|\s*`?(?P<state>[A-Za-z]+)`?\s*\|\s*$"
)
PLAN_HEADING = re.compile(r"^##\s+(?P<id>wp\d+)\s*[–—-]\s*(?P<name>.+?)\s*$", re.MULTILINE)
DEPENDENCY_ID = re.compile(r"`([a-z0-9]+(?:/wp\d+)?)`")
TIME_PATTERN = re.compile(r"(\d{4})-(\d\d)-(\d\d)[T ](\d\d):(\d\d)(?::(\d\d))?\s*(?:Z|UTC)?\s*$")


class GenerateError(Exception):
    """Fehler, der das Skript mit Meldung beendet."""


# --------------------------------------------------------------------------------------
# Lesen aus Git (nur lesend)
# --------------------------------------------------------------------------------------


class Source:
    """Lesender Zugriff auf einen Zweig eines Git-Repositorys."""

    def __init__(self, root: Path, ref: str) -> None:
        self.root = root
        self.ref = ref
        self._git("rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}")

    def _git(self, *args: str, stdin: bytes | None = None) -> bytes:
        try:
            result = subprocess.run(  # noqa: S603
                ["git", "-C", str(self.root), *args],  # noqa: S607
                input=stdin,
                capture_output=True,
                check=True,
            )
        except subprocess.CalledProcessError as error:
            detail = error.stderr.decode("utf-8", "replace").strip()
            raise GenerateError(f"git {args[0]} schlug fehl: {detail}") from error
        except FileNotFoundError as error:
            raise GenerateError("git ist nicht installiert") from error
        return result.stdout

    def files(self, prefix: str) -> list[str]:
        out = self._git("ls-tree", "-r", "--name-only", "-z", self.ref, "--", prefix)
        return [name for name in out.decode("utf-8").split("\0") if name]

    def read(self, path: str) -> str | None:
        """Inhalt der Datei auf dem Zweig oder ``None``, wenn es sie nicht gibt."""
        if path not in set(self.files(path)):
            return None
        return self._git("show", f"{self.ref}:{path}").decode("utf-8", "replace")

    def message_files(self) -> list[tuple[str, str]]:
        """Alle Meldungsdateien der Geschichte, auch entfernte: (Pfad, Inhalt)."""
        log = self._git(
            "log",
            self.ref,
            "--first-parent",
            "--diff-merges=first-parent",
            "--no-renames",
            "--diff-filter=A",
            "--name-only",
            "-z",
            "--format=%x01%H",
            "--",
            "development/messages",
        ).decode("utf-8")
        wanted: dict[str, str] = {}
        for block in log.split("\x01"):
            names = [part for part in block.split("\0") if part.strip()]
            if not names:
                continue
            commit, *paths = (part.strip("\n") for part in names)
            for path in paths:
                if MESSAGE_PATH.match(path):
                    wanted.setdefault(path, commit)
        if not wanted:
            return []
        request = "".join(f"{commit}:{path}\n" for path, commit in wanted.items()).encode()
        raw = self._git("cat-file", "--batch", stdin=request)
        result: list[tuple[str, str]] = []
        position = 0
        for path in wanted:
            end = raw.index(b"\n", position)
            header = raw[position:end].split()
            if len(header) != 3 or header[1] != b"blob":
                position = end + 1
                continue
            size = int(header[2])
            body = raw[end + 1 : end + 1 + size]
            result.append((path, body.decode("utf-8", "replace")))
            position = end + 1 + size + 1
        return result


# --------------------------------------------------------------------------------------
# Meldungen (7.2)
# --------------------------------------------------------------------------------------


@dataclass(frozen=True)
class Message:
    when: datetime
    seq: int
    recipient: str
    ref: str
    task: str
    document: str

    @property
    def sort_key(self) -> tuple[datetime, int]:
        return (self.when, self.seq)


@dataclass(frozen=True)
class Rule:
    """Eine Zeile der Tabelle in 7.2. ``phase`` ist ``None`` für „wie die Bezugsmeldung“."""

    phase: int | None
    bei: str | None
    step: str
    finished: bool = False


@dataclass(frozen=True)
class Resolved:
    message: Message
    phase: int
    bei: str | None
    step: str
    finished: bool

    @property
    def when(self) -> datetime:
        return self.message.when


def parse_message(path: str, text: str) -> Message | None:
    matched = MESSAGE_PATH.match(path)
    if matched is None:
        return None
    fields: dict[str, str] = {}
    for line in text.splitlines():
        field_match = FIELD_LINE.match(line)
        if field_match:
            fields.setdefault(field_match["key"], field_match["value"].strip("`"))
    ref = fields.get("ref", "")
    task = fields.get("task", "")
    if not REF_PATTERN.match(ref) or not task:
        return None
    try:
        when = datetime.strptime(matched["stamp"], "%Y%m%d%H%M%S").replace(tzinfo=UTC)
    except ValueError:
        return None
    return Message(
        when=when,
        seq=int(matched["seq"]),
        recipient=matched["recipient"],
        ref=ref,
        task=task,
        document=fields.get("document", ""),
    )


def _is_plan(document: str) -> bool:
    return document.rsplit(":", 1)[-1].rsplit("/", 1)[-1] == "plan.md"


def rule_for(message: Message) -> Rule | None:
    """Zeile der Tabelle in 7.2 und Schritt nach 7.4 Punkt 7 für eine Meldung."""
    task = message.task
    document_phase = 3 if _is_plan(message.document) else 2
    if task == "check":
        return Rule(1, ARCHITEKT, "Anforderungen werden geprüft")
    if task == "review":
        return Rule(1, PROJEKTLEITER, "Prüfbericht wird bearbeitet")
    if task == "specify":
        return Rule(2, ARCHITEKT, "Spezifikation wird erstellt")
    if task == "plan":
        return Rule(3, ARCHITEKT, "Plan wird erstellt")
    if task == "revise":
        return Rule(document_phase, ARCHITEKT, "Einwände werden eingearbeitet")
    if task == "present":
        return Rule(document_phase, PROJEKTLEITER, "Präsentation wird vorbereitet")
    if task in {"implement", "fix", "amended"}:
        return Rule(4, TEAM, "Umsetzung läuft")
    if task == "answer":
        if message.recipient == "devlead":
            return Rule(4, TEAM, "Umsetzung läuft")
        if message.recipient == "architect":
            return Rule(None, ARCHITEKT, "Antwort wird eingearbeitet")
        return None
    if task == "amend":
        return Rule(None, ARCHITEKT, "Lücke in der Spezifikation")
    if task == "question":
        return Rule(None, PROJEKTLEITER, "Frage wird bearbeitet")
    if task == "acceptance":
        return Rule(5, PROJEKTLEITER, "Ergebnis wird vorgelegt")
    if task == "integrate":
        return Rule(6, TEAM, "Übernahme in main")
    if task == "integrated":
        return Rule(6, None, "Abgeschlossen", finished=True)
    if task == "failed":
        return Rule(None, PROJEKTLEITER, "Aufgabe abgebrochen")
    return None


def resolve(messages: Sequence[Message]) -> list[Resolved]:
    """Ordnet jeder Meldung Phase und Stelle zu. ``messages`` ist aufsteigend sortiert.

    Eine Meldung „wie die Bezugsmeldung“ übernimmt die Phase der jüngsten älteren Meldung
    desselben ``ref`` mit eigener Phase, sonst die der jüngsten älteren Meldung des Vorhabens,
    sonst Phase 1.
    """
    own: list[tuple[Message, Rule]] = []
    for message in messages:
        rule = rule_for(message)
        if rule is not None:
            own.append((message, rule))
    result: list[Resolved] = []
    for index, (message, rule) in enumerate(own):
        phase = rule.phase
        if phase is None:
            earlier = own[:index]
            for same_ref in (True, False):
                for other, other_rule in reversed(earlier):
                    if other_rule.phase is None:
                        continue
                    if same_ref and other.ref != message.ref:
                        continue
                    phase = other_rule.phase
                    break
                if phase is not None:
                    break
        result.append(
            Resolved(
                message=message,
                phase=phase if phase is not None else 1,
                bei=rule.bei,
                step=rule.step,
                finished=rule.finished,
            )
        )
    return result


# --------------------------------------------------------------------------------------
# Scope, Plan, waiting.md
# --------------------------------------------------------------------------------------


@dataclass(frozen=True)
class Waiting:
    ref: str
    handlung: str
    since: datetime | None


@dataclass(frozen=True)
class PlanPackage:
    id: str
    name: str
    depends: tuple[str, ...]
    done: bool


def parse_name(scope_text: str) -> str | None:
    matched = NAME_LINE.search(scope_text)
    if matched is None:
        return None
    name = matched["name"].strip().strip("`").rstrip(".").strip()
    return name or None


def parse_plan(plan_text: str) -> list[PlanPackage]:
    names = {m["id"]: m["name"] for m in PLAN_HEADING.finditer(plan_text)}
    packages: list[PlanPackage] = []
    for line in plan_text.splitlines():
        row = PLAN_TABLE_ROW.match(line.strip())
        if row is None:
            continue
        package_id = row["id"]
        name = names.get(package_id) or row["title"].strip().strip("`") or package_id
        packages.append(
            PlanPackage(
                id=package_id,
                name=name,
                depends=tuple(DEPENDENCY_ID.findall(row["deps"])),
                done=row["state"].lower() == "done",
            )
        )
    if not packages:
        packages = [
            PlanPackage(id=package_id, name=name, depends=(), done=False)
            for package_id, name in names.items()
        ]
    return packages


def parse_time(text: str) -> datetime | None:
    matched = TIME_PATTERN.search(text.strip())
    if matched is None:
        return None
    year, month, day, hour, minute, second = matched.groups()
    try:
        return datetime(
            int(year), int(month), int(day), int(hour), int(minute), int(second or 0), tzinfo=UTC
        )
    except ValueError:
        return None


def parse_waiting(text: str) -> list[Waiting]:
    """Zeilen ``| ref | Handlung | Zeitpunkt (UTC) |`` oder ``- ref | Handlung | Zeitpunkt``."""
    rows: list[Waiting] = []
    for raw in text.splitlines():
        line = raw.strip()
        if line[:2] in {"- ", "* "}:
            line = line[2:].strip()
        line = line.strip("|")
        cells = [cell.strip() for cell in line.split("|")]
        if len(cells) != 3:
            continue
        ref = cells[0].strip("`")
        if ref == "ref" or not REF_PATTERN.match(ref) or not cells[1]:
            continue  # Kopfzeile, Trennzeile oder keine Zeile der Tabelle
        rows.append(Waiting(ref=ref, handlung=cells[1], since=parse_time(cells[2])))
    return rows


# --------------------------------------------------------------------------------------
# Modell der Übersicht
# --------------------------------------------------------------------------------------


@dataclass
class PackageModel:
    id: str
    name: str
    kind: str  # "fertig", "wartet" oder "aktiv"
    phase: int | None = None  # 4 bis 6 bei "aktiv"
    bei: str | None = None
    since: datetime | None = None
    notiz: str | None = None
    handlung: str | None = None  # Zeile aus waiting.md
    depends: list[str] = field(default_factory=list)  # "Name (Kennung)"
    integrated_on: date | None = None

    def stand_in(self, nr: int) -> str:
        """Stand des Pakets in einer der Phasen 4 bis 6."""
        if self.kind == "fertig":
            return GRUEN
        if self.kind == "wartet" or self.phase is None:
            return GRAU
        if nr < self.phase:
            return GRUEN
        return GELB if nr == self.phase else GRAU


@dataclass
class PhaseModel:
    nr: int
    stand: str
    handlungen: list[str] = field(default_factory=list)
    in_phase: int = 0  # Pakete in dieser Phase (nur mit Plan)
    bei: list[str] = field(default_factory=list)
    since: datetime | None = None


@dataclass
class VorhabenModel:
    id: str
    name: str
    stand: str
    phase: int | None
    has_packages: bool
    bei: list[str]
    since: datetime | None
    handlungen: list[str]
    packages: list[PackageModel]
    phases: list[PhaseModel]
    step: str | None
    step_bei: str | None
    step_since: datetime | None
    step_handlung: str | None
    first_message: datetime | None
    finished: bool


@dataclass
class Overview:
    generated: datetime
    vorhaben: list[VorhabenModel]


def _unique(items: Iterable[str]) -> list[str]:
    seen: list[str] = []
    for item in items:
        if item and item not in seen:
            seen.append(item)
    return seen


def _effective(
    resolved: Resolved | None, waiting: Waiting | None
) -> tuple[str | None, datetime | None, str | None]:
    """Stelle, Zeitpunkt und Handlung einer Meldung unter Beachtung von ``waiting.md`` (7.2*)."""
    if resolved is None:
        return (None, None, None)
    if waiting is not None:
        return (AUFTRAGGEBER, waiting.since, waiting.handlung)
    return (resolved.bei, resolved.when, None)


def _package_model(
    plan_package: PlanPackage,
    history: Sequence[Resolved],
    waiting: Waiting | None,
    names: dict[str, str],
    vorhaben_id: str,
) -> PackageModel:
    model = PackageModel(
        id=plan_package.id,
        name=plan_package.name,
        kind="wartet",
        depends=[
            f"{names.get(dep if '/' in dep else f'{vorhaben_id}/{dep}', dep)} ({dep})"
            for dep in plan_package.depends
        ],
    )
    newest = history[-1] if history else None
    integrated = [item for item in history if item.finished]
    if plan_package.done or (newest is not None and newest.finished):
        model.kind = "fertig"
        if integrated:
            model.integrated_on = integrated[-1].when.date()
        return model
    if newest is None:
        return model
    bei, since, handlung = _effective(newest, waiting)
    model.kind = "aktiv"
    model.phase = min(max(newest.phase, 4), 6)
    model.bei = bei
    model.since = since
    model.handlung = handlung
    if handlung is not None:
        model.notiz = handlung
    elif newest.message.task == "amend":
        model.notiz = "Lücke in der Spezifikation"
    elif newest.message.task == "question":
        model.notiz = "Frage wird bearbeitet"
    elif newest.message.task == "failed":
        model.notiz = "Aufgabe abgebrochen"
    return model


def _phase_models(
    phase: int | None,
    finished: bool,
    has_started: bool,
    packages: Sequence[PackageModel],
    handlungen_by_phase: dict[int, list[str]],
    step_bei: str | None,
    step_since: datetime | None,
) -> list[PhaseModel]:
    models: list[PhaseModel] = []
    for nr in range(1, 7):
        if not has_started or phase is None:
            stand = GRAU
        elif finished:
            stand = GRUEN
        elif packages and phase >= 4:
            states = [package.stand_in(nr) for package in packages]
            if nr < 4 or all(state == GRUEN for state in states):
                stand = GRUEN
            elif phase == nr or GELB in states:
                stand = GELB
            else:
                stand = GRAU
        else:
            stand = GRUEN if nr < phase else (GELB if nr == phase else GRAU)
        model = PhaseModel(nr=nr, stand=stand, handlungen=handlungen_by_phase.get(nr, []))
        if packages and nr >= 4:
            inside = [package for package in packages if package.phase == nr]
            model.in_phase = len(inside)
            model.bei = _unique(package.bei or "" for package in inside)
            model.since = max((p.since for p in inside if p.since), default=None)
        elif stand == GELB:
            model.bei = [step_bei] if step_bei else []
            model.since = step_since
        models.append(model)
    return models


def build_vorhaben(
    vorhaben_id: str,
    scope_text: str,
    plan_packages: list[PlanPackage],
    waiting_rows: list[Waiting],
    messages: Sequence[Message],
    package_names: dict[str, str],
) -> VorhabenModel:
    name = parse_name(scope_text) or vorhaben_id
    waiting = {row.ref: row for row in waiting_rows}
    has_packages = bool(plan_packages)
    package_ids = {package.id for package in plan_packages}

    if has_packages:
        relevant = [
            m
            for m in messages
            if m.ref == vorhaben_id
            or (m.ref.startswith(f"{vorhaben_id}/") and m.ref.split("/", 1)[1] in package_ids)
        ]
    else:
        relevant = [m for m in messages if m.ref == vorhaben_id]
    relevant.sort(key=lambda m: m.sort_key)
    resolved_all = resolve(relevant)
    first_message = resolved_all[0].when if resolved_all else None

    packages: list[PackageModel] = []
    if has_packages:
        for plan_package in plan_packages:
            ref = f"{vorhaben_id}/{plan_package.id}"
            history = [item for item in resolved_all if item.message.ref == ref]
            packages.append(
                _package_model(plan_package, history, waiting.get(ref), package_names, vorhaben_id)
            )

    own_history = [item for item in resolved_all if item.message.ref == vorhaben_id]
    newest_own = own_history[-1] if own_history else (resolved_all[-1] if resolved_all else None)
    newest_all = resolved_all[-1] if resolved_all else None
    all_done = has_packages and all(package.kind == "fertig" for package in packages)

    # Phase des Vorhabens (7.2)
    phase: int | None
    if not resolved_all and not all_done:
        phase = None
        finished = False
    elif has_packages:
        finished = all_done
        if all_done:
            phase = 6
        elif any(item.message.task == "implement" for item in resolved_all):
            phase = 4
        else:
            phase = newest_all.phase if newest_all else None
    else:
        finished = newest_own is not None and newest_own.finished
        phase = newest_own.phase if newest_own else None
    has_started = phase is not None
    stand = GRUEN if finished else (GELB if has_started else GRAU)

    # Stelle des Vorhabens selbst (ohne Pakete oder in den Phasen 1 bis 3)
    own_waiting = waiting.get(vorhaben_id)
    step_bei, step_since, step_handlung = _effective(newest_own, own_waiting)
    step = None if newest_own is None else newest_own.step

    active = [package for package in packages if package.kind == "aktiv"]
    if finished:
        bei: list[str] = []
        since: datetime | None = None
    elif active:
        bei = _unique(package.bei or "" for package in active)
        since = max((package.since for package in active if package.since), default=None)
    else:
        bei = [step_bei] if step_bei else []
        since = step_since

    by_phase: dict[int, list[str]] = {}
    handlungen: list[str] = []
    if phase is not None and not finished:
        handlungen = _unique([package.handlung or "" for package in active] + [step_handlung or ""])
        if step_handlung:
            by_phase.setdefault(phase, []).append(step_handlung)
        for package in active:
            if package.handlung and package.phase is not None:
                by_phase.setdefault(package.phase, []).append(package.handlung)
        by_phase = {nr: _unique(items) for nr, items in by_phase.items()}

    phases = _phase_models(phase, finished, has_started, packages, by_phase, step_bei, step_since)
    return VorhabenModel(
        id=vorhaben_id,
        name=name,
        stand=stand,
        phase=phase,
        has_packages=has_packages,
        bei=bei,
        since=since,
        handlungen=handlungen,
        packages=packages,
        phases=phases,
        step=step,
        step_bei=step_bei,
        step_since=step_since,
        step_handlung=step_handlung,
        first_message=first_message,
        finished=finished,
    )


def build_overview(source: Source, generated: datetime) -> Overview:
    scopes: dict[str, str] = {}
    for path in source.files("development"):
        matched = SCOPE_PATH.match(path)
        if matched is None:
            continue
        text = source.read(path)
        if text is not None:
            scopes[matched["name"]] = text

    plans: dict[str, list[PlanPackage]] = {}
    waitings: dict[str, list[Waiting]] = {}
    for vorhaben_id in scopes:
        plan_text = source.read(f"development/{vorhaben_id}/plan.md")
        plans[vorhaben_id] = parse_plan(plan_text) if plan_text is not None else []
        waiting_text = source.read(f"development/{vorhaben_id}/waiting.md")
        waitings[vorhaben_id] = parse_waiting(waiting_text) if waiting_text is not None else []

    package_names = {
        f"{vorhaben_id}/{package.id}": package.name
        for vorhaben_id, packages in plans.items()
        for package in packages
    }

    messages: list[Message] = []
    for path, text in source.message_files():
        message = parse_message(path, text)
        if message is not None:
            messages.append(message)

    models = [
        build_vorhaben(
            vorhaben_id,
            scope_text,
            plans[vorhaben_id],
            waitings[vorhaben_id],
            [m for m in messages if m.ref == vorhaben_id or m.ref.startswith(f"{vorhaben_id}/")],
            package_names,
        )
        for vorhaben_id, scope_text in scopes.items()
    ]
    return Overview(generated=generated, vorhaben=order_vorhaben(models))


def order_vorhaben(models: Sequence[VorhabenModel]) -> list[VorhabenModel]:
    """7.4 Punkt 4: nach erster Meldung, nicht begonnene danach, abgeschlossene zuletzt."""
    far = datetime.max.replace(tzinfo=UTC)

    def key(model: VorhabenModel) -> tuple[datetime, str]:
        return (model.first_message or far, model.id)

    running = sorted((m for m in models if m.stand == GELB), key=key)
    not_begun = sorted((m for m in models if m.stand == GRAU), key=lambda m: m.id)
    finished = sorted((m for m in models if m.stand == GRUEN), key=key)
    return running + not_begun + finished


# --------------------------------------------------------------------------------------
# HTML
# --------------------------------------------------------------------------------------


def esc(text: str) -> str:
    return html.escape(text, quote=True)


def time_html(moment: datetime) -> str:
    stamp = moment.astimezone(UTC)
    return (
        f'<time class="zeitpunkt" datetime="{stamp:%Y-%m-%dT%H:%M:%SZ}">'
        f"{stamp:%Y-%m-%d %H:%M} UTC</time>"
    )


def _p(css: str, inner: str) -> str:
    return f'<p class="{css}">{inner}</p>'


def _line(label: str, value: str) -> str:
    return _p("zeile", f"{esc(label)} <b>{esc(value)}</b>")


def _since(moment: datetime | None) -> str:
    return _p("zeile", f"seit {time_html(moment)}") if moment else ""


def _marke(handlungen: Sequence[str]) -> str:
    if not handlungen:
        return ""
    return _p("marke", esc("Wartet auf Sie: " + ", ".join(handlungen)))


def _kasten(stand: str, handlungen: Sequence[str], inner: str, target: str | None = None) -> str:
    css = f"kasten s-{stand}" + (" wartet" if handlungen else "")
    body = _marke(handlungen) + inner
    if target is None:
        return f'<li><div class="{css}">{body}</div></li>'
    return f'<li><a class="{css}" href="#{esc(target)}">{body}</a></li>'


def render_level1(overview: Overview) -> str:
    boxes: list[str] = []
    for v in overview.vorhaben:
        inner = [
            _p("name", esc(v.name)),
            _p("kenn", esc(v.id)),
            _p("stand", esc(STANDWORT[v.stand])),
        ]
        if v.phase is None:
            inner.append(_line("Phase:", "noch keine"))
        elif v.finished:
            inner.append(_line("Phase:", PHASEN[v.phase - 1]))
            inner.append(_p("zeile", "Alle Pakete fertig" if v.has_packages else "Abgeschlossen"))
        else:
            inner.append(_line("Phase:", PHASEN[v.phase - 1]))
            if v.bei:
                inner.append(_line("Bei:", ", ".join(v.bei)))
                inner.append(_since(v.since))
            waiting_count = sum(1 for p in v.packages if p.kind == "wartet")
            if waiting_count:
                inner.append(
                    _p(
                        "zeile",
                        "1 Paket wartet"
                        if waiting_count == 1
                        else f"{waiting_count} Pakete warten",
                    )
                )
        inner.append(_p("oeffnen", "Phasen ansehen"))
        boxes.append(_kasten(v.stand, v.handlungen, "".join(inner), v.id))
    return (
        '<section id="ebene-alle" data-ebene="1" data-name="Alle Vorhaben">'
        '<h2 tabindex="-1">Alle Vorhaben</h2>'
        f'<ul class="kaesten ebene1">{"".join(boxes)}</ul></section>'
    )


def render_level2(v: VorhabenModel) -> str:
    boxes: list[str] = []
    for phase in v.phases:
        inner = [
            _p("kenn", f"Phase {phase.nr}"),
            _p("name", esc(PHASEN[phase.nr - 1])),
            _p("stand", esc(STANDWORT[phase.stand])),
        ]
        with_packages = phase.nr >= 4 and v.has_packages
        if with_packages:
            inner.append(
                _p("zeile", f"{phase.in_phase} von {len(v.packages)} Paketen in dieser Phase")
            )
            if phase.stand == GELB and phase.bei:
                inner.append(_line("Bei:", ", ".join(phase.bei)))
        elif phase.stand == GELB and phase.bei:
            inner.append(_line("Bei:", ", ".join(phase.bei)))
            inner.append(_since(phase.since))
        inner.append(_p("oeffnen", "Pakete ansehen" if with_packages else "Schritt ansehen"))
        boxes.append(_kasten(phase.stand, phase.handlungen, "".join(inner), f"{v.id}/{phase.nr}"))
    return (
        f'<section id="{esc(v.id)}" data-ebene="2" data-name="{esc(v.name)}">'
        f'<h2 tabindex="-1">{esc(v.name)} <small>({esc(v.id)})</small></h2>'
        f'<ul class="kaesten ebene2">{"".join(boxes)}</ul></section>'
    )


def _package_box(v: VorhabenModel, package: PackageModel, nr: int) -> str:
    stand = package.stand_in(nr)
    handlungen = [package.handlung] if package.handlung else []
    inner = [
        _p("name", esc(package.name)),
        _p("kenn", esc(package.id)),
        _p("stand", esc(STANDWORT[stand])),
    ]
    if package.kind == "wartet":
        if package.depends:
            inner.append(_p("warte", esc("wartet auf " + ", ".join(package.depends))))
        else:
            inner.append(_p("warte", "wartet auf den Beginn"))
    elif package.kind == "fertig":
        if package.integrated_on:
            day = package.integrated_on
            inner.append(
                _p(
                    "zeile",
                    f'fertig, in main seit <time datetime="{day:%Y-%m-%d}">{day:%d.%m.%Y}</time>',
                )
            )
        else:
            inner.append(_p("zeile", "fertig, in main"))
    elif stand == GELB:
        inner.append(_line("Bei:", package.bei or "–"))
        inner.append(_since(package.since))
        if package.notiz:
            inner.append(_p("zeile", esc(package.notiz)))
    else:
        where = PHASEN[(package.phase or 4) - 1]  # ein aktives Paket hat immer eine Phase
        sentence = (
            f"diese Phase liegt hinter dem Paket; es ist jetzt in {where}"
            if stand == GRUEN
            else f"diese Phase ist noch nicht erreicht; das Paket ist in {where}"
        )
        inner.append(_p("zeile", esc(sentence)))
    return _kasten(stand, handlungen, "".join(inner))


def _step_box(v: VorhabenModel, phase: PhaseModel) -> str:
    inner = [_p("kenn", esc(f"Schritt in der Phase {PHASEN[phase.nr - 1]}"))]
    handlungen: list[str] = []
    if phase.stand == GELB:
        text = v.step_handlung or v.step or "In Arbeit"
        handlungen = phase.handlungen
        inner.append(_p("name", esc(text)))
        inner.append(_p("stand", esc(STANDWORT[GELB])))
        if v.step_bei:
            inner.append(_line("Bei:", v.step_bei))
        inner.append(_since(v.step_since))
    elif phase.stand == GRUEN:
        inner.append(_p("name", esc(f"{PHASEN[phase.nr - 1]} abgeschlossen")))
        inner.append(_p("stand", esc(STANDWORT[GRUEN])))
    else:
        inner.append(_p("name", "Noch nicht erreicht"))
        inner.append(_p("stand", esc(STANDWORT[GRAU])))
    return _kasten(phase.stand, handlungen, "".join(inner))


def render_level3(v: VorhabenModel, phase: PhaseModel) -> str:
    if phase.nr >= 4 and v.has_packages:
        boxes = "".join(_package_box(v, package, phase.nr) for package in v.packages)
    else:
        boxes = _step_box(v, phase)
    phase_name = PHASEN[phase.nr - 1]
    title = f"{v.name}: {phase_name}"
    return (
        f'<section id="{esc(v.id)}/{phase.nr}" data-ebene="3" data-name="{esc(phase_name)}"'
        f' data-vorhaben="{esc(v.id)}" data-vorhaben-name="{esc(v.name)}">'
        f'<h2 tabindex="-1">{esc(title)}</h2>'
        f'<ul class="kaesten ebene3">{boxes}</ul></section>'
    )


def render_html(overview: Overview, template: str) -> str:
    sections = [render_level1(overview)]
    for v in overview.vorhaben:
        sections.append(render_level2(v))
        sections.extend(render_level3(v, phase) for phase in v.phases)
    content = "\n".join(sections)
    for placeholder in ("{{ZEIT}}", "{{INHALT}}"):
        if placeholder not in template:
            raise GenerateError(f"Vorlage ohne Platzhalter {placeholder}")
    return template.replace("{{ZEIT}}", time_html(overview.generated)).replace(
        "{{INHALT}}", content
    )


# --------------------------------------------------------------------------------------
# Aufruf
# --------------------------------------------------------------------------------------


def generate(root: Path, output: Path, ref: str = "main", now: datetime | None = None) -> None:
    source = Source(root, ref)
    overview = build_overview(source, (now or datetime.now(UTC)).astimezone(UTC))
    template = TEMPLATE_PATH.read_text(encoding="utf-8")
    output.write_text(render_html(overview, template), encoding="utf-8", newline="\n")


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Erzeugt die Übersicht der Vorhaben.")
    parser.add_argument("root", type=Path, help="Wurzelverzeichnis eines Repositorys")
    parser.add_argument("output", type=Path, help="Pfad der Ausgabedatei")
    parser.add_argument("--ref", default="main", help="Zweig, aus dem gelesen wird (main)")
    parser.add_argument("--now", help="Zeitpunkt der Erzeugung in UTC (nur für Tests)")
    args = parser.parse_args(argv)
    now = None
    if args.now:
        now = parse_time(args.now)
        if now is None:
            parser.error("--now: erwartet JJJJ-MM-TTThh:mm[:ss]Z")
    try:
        generate(args.root, args.output, args.ref, now)
    except GenerateError as error:
        print(f"Fehler: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
