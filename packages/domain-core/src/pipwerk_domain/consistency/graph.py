"""Graph algorithms for the checks of the flow: strongly connected components, loops without
ending condition and reachability. All iterative."""

from collections.abc import Collection, Mapping, Sequence


def strongly_connected_components(
    nodes: Sequence[str], successors: Mapping[str, Collection[str]]
) -> list[list[str]]:
    """Strongly connected components (Tarjan, without recursion). Only edges between
    ``nodes`` count. Each component lists its nodes in the order of ``nodes``."""
    allowed = set(nodes)
    order = {node: position for position, node in enumerate(nodes)}
    index_of: dict[str, int] = {}
    low: dict[str, int] = {}
    on_stack: set[str] = set()
    stack: list[str] = []
    components: list[list[str]] = []
    counter = 0
    for root in nodes:
        if root in index_of:
            continue
        work: list[tuple[str, list[str]]] = [
            (root, [t for t in successors.get(root, ()) if t in allowed])
        ]
        index_of[root] = low[root] = counter
        counter += 1
        stack.append(root)
        on_stack.add(root)
        while work:
            node, pending = work[-1]
            if pending:
                target = pending.pop()
                if target not in index_of:
                    index_of[target] = low[target] = counter
                    counter += 1
                    stack.append(target)
                    on_stack.add(target)
                    work.append((target, [t for t in successors.get(target, ()) if t in allowed]))
                elif target in on_stack:
                    low[node] = min(low[node], index_of[target])
                continue
            work.pop()
            if work:
                parent = work[-1][0]
                low[parent] = min(low[parent], low[node])
            if low[node] == index_of[node]:
                component: list[str] = []
                while True:
                    member = stack.pop()
                    on_stack.discard(member)
                    component.append(member)
                    if member == node:
                        break
                component.sort(key=order.__getitem__)
                components.append(component)
    return components


def unending_loops(
    nodes: Sequence[str],
    edges: Mapping[str, Sequence[tuple[str, str]]],
    conditions: Collection[str],
    free_conditions: Collection[str],
) -> list[list[str]]:
    """Loops without an ending condition (specification 3.6).

    ``edges`` lists for each node the connections as pairs of output and target.
    ``conditions`` are the nodes that are conditions, ``free_conditions`` those conditions
    with an output that has no connection (the flow ends there). A loop ends if it contains
    a condition from which an output leads out of the loop or ends without continuation.
    Returns the groups of nodes that contain a loop that does not end.
    """
    successors = {node: [target for _, target in edges.get(node, ())] for node in nodes}
    bad: list[list[str]] = []
    work: list[list[str]] = [list(nodes)]
    while work:
        subset = work.pop()
        for component in strongly_connected_components(subset, successors):
            members = set(component)
            if len(component) == 1 and component[0] not in successors.get(component[0], ()):
                continue
            exits = {
                node
                for node in component
                if node in conditions
                and (
                    node in free_conditions
                    or any(target not in members for _, target in edges.get(node, ()))
                )
            }
            if not exits:
                bad.append(component)
                continue
            remaining = [node for node in component if node not in exits]
            if remaining:
                work.append(remaining)
    bad.sort(key=lambda group: min(nodes.index(node) for node in group))
    return bad


def reachable(starts: Collection[str], successors: Mapping[str, Collection[str]]) -> set[str]:
    """All nodes reachable from ``starts``, including the start nodes."""
    seen: set[str] = set(starts)
    queue = list(starts)
    while queue:
        node = queue.pop()
        for target in successors.get(node, ()):
            if target not in seen:
                seen.add(target)
                queue.append(target)
    return seen
