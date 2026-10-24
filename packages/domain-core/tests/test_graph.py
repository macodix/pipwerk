"""Dominance in a flow (specification 3.3, the ways to an element)."""

import itertools

from pipwerk_domain.consistency.graph import Dominance


def edges(*pairs: tuple[str, str]) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for source, target in pairs:
        result.setdefault(source, []).append(target)
        result.setdefault(target, [])
    return result


def test_a_chain_is_dominated_in_order() -> None:
    flow = Dominance(["a"], edges(("a", "b"), ("b", "c")))
    assert flow.dominates("a", "c") and flow.dominates("b", "c")
    assert not flow.dominates("c", "b")
    assert flow.dominates("b", "b")  # a node dominates itself


def test_a_branch_and_a_join() -> None:
    flow = Dominance(["a"], edges(("a", "b"), ("a", "c"), ("b", "d"), ("c", "d")))
    assert flow.dominates("a", "d")
    assert not flow.dominates("b", "d") and not flow.dominates("c", "d")
    assert not flow.dominates("b", "c")


def test_a_loop_back_does_not_break_the_dominance_of_the_head() -> None:
    flow = Dominance(["a"], edges(("a", "b"), ("b", "c"), ("c", "b"), ("c", "d")))
    assert flow.dominates("b", "c") and flow.dominates("b", "d") and flow.dominates("c", "d")
    assert not flow.dominates("d", "b")


def test_a_second_start_gives_another_way() -> None:
    flow = Dominance(["a", "x"], edges(("a", "b"), ("b", "c"), ("x", "c")))
    assert not flow.dominates("b", "c")
    assert not flow.dominates("a", "c")
    assert flow.dominates("a", "b")


def test_a_node_that_no_start_reaches_is_outside() -> None:
    flow = Dominance(["a"], edges(("a", "b"), ("z", "b"), ("z", "y")))
    assert flow.contains("a") and flow.contains("b")
    assert not flow.contains("z") and not flow.contains("y")
    assert not flow.dominates("z", "b") and not flow.dominates("a", "z")
    # `z` does not reach `b` for the question: `a` still dominates it
    assert flow.dominates("a", "b")


def test_without_starts_nothing_is_inside() -> None:
    flow = Dominance([], edges(("a", "b")))
    assert not flow.contains("a")


def test_a_long_chain_needs_no_recursion() -> None:
    names = [f"n{number}" for number in range(5000)]
    flow = Dominance([names[0]], edges(*itertools.pairwise(names)))
    assert flow.dominates(names[0], names[-1])
    assert flow.dominates(names[2500], names[-1])
    assert not flow.dominates(names[-1], names[0])


def test_a_diamond_in_a_loop() -> None:
    flow = Dominance(
        ["s"],
        edges(("s", "a"), ("a", "b"), ("a", "c"), ("b", "d"), ("c", "d"), ("d", "a"), ("d", "e")),
    )
    assert flow.dominates("a", "d") and flow.dominates("a", "e") and flow.dominates("d", "e")
    assert not flow.dominates("b", "e")
    assert not flow.dominates("c", "d")
