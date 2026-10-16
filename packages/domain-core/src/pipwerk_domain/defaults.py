"""The register with the delivered types and the types of other packages."""

from functools import lru_cache

from pipwerk_domain.catalog import register_delivered_types
from pipwerk_domain.registry import ElementRegistry


def create_registry(*, entry_points: bool = True) -> ElementRegistry:
    """A new register with the delivered types and, if wanted, the types that other
    packages register under the entry point group ``pipwerk.element_types``."""
    registry = ElementRegistry()
    register_delivered_types(registry)
    if entry_points:
        registry.load_entry_points()
    return registry


@lru_cache(maxsize=1)
def default_registry() -> ElementRegistry:
    """The register of this process, created on first use."""
    return create_registry()
