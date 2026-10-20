"""The delivered rule template "Risiko je Trade" (specification 3.5, E6)."""

from pipwerk_domain.catalog import TYPE_RULE
from pipwerk_domain.model import (
    Binding,
    Comparison,
    Instance,
    Origin,
    ParameterDefinition,
    Template,
)
from pipwerk_domain.typedesc import BindingKind, DataType, Label

RISK_PER_TRADE_RULE_ID = "7c1d4e2a-5b3f-4a86-9d27-e1f0a3c8b645"
"""Fixed identifier of the delivered rule template "Risiko je Trade". Every installation
has the same one, so instances in strategies name their origin the same way."""

RISK_PER_TRADE_NAME = "Risiko je Trade"
RISK_PER_TRADE_LABEL = Label("Risiko je Trade", "Risk per trade")
"""The name of the template in German and English (specification 3.5)."""

RISK_PER_TRADE_EXPLANATION = Label(
    "Begrenzt den Verlust bis zum Stop-Loss auf einen Anteil des Kapitals und bestimmt daraus "
    "das Volumen.",
    "Limits the loss up to the stop loss to a share of the equity and derives the volume from it.",
)
RISK_LIMIT_PARAMETER = "risikogrenze"
RISK_LIMIT_NAME = "Risikogrenze"
RISK_LIMIT_DEFAULT = 0.01
"""Default value of the risk limit: 1 % (a percentage is a share, 1 % is 0.01)."""

_DISTANCE_ORDER = (
    'IF(Order.richtung = "buy"; IFNA(Order.limitpreis; Order.preis) - Order.stop_loss;'
    " Order.stop_loss - IFNA(Order.limitpreis; Order.preis))"
)
_DISTANCE_POSITION = (
    'IF(Position.richtung = "buy"; Position.einstiegspreis - Position.stop_loss;'
    " Position.stop_loss - Position.einstiegspreis)"
)

RISK_PER_TRADE_EXPRESSION = f"""IF(ISNA(Position.volumen);
   IF({_DISTANCE_ORDER} <= 0;
      Order.volumen;
      FLOOR({RISK_LIMIT_PARAMETER} * Konto.kapital
              / ({_DISTANCE_ORDER} / Order.instrument.tickgroesse * Order.instrument.tickwert);
            Order.instrument.volumenschritt));
   IF({_DISTANCE_POSITION} <= 0;
      Position.volumen;
      FLOOR({RISK_LIMIT_PARAMETER} * Konto.kapital
              / ({_DISTANCE_POSITION} / Order.instrument.tickgroesse * Order.instrument.tickwert);
            Order.instrument.volumenschritt)))"""
"""The expression of specification 3.5 in the normalized spelling. The distance from the
price to the stop loss is written out at both places."""

RISK_PER_TRADE_DESCRIPTION = (
    "Bestimmt das größte Volumen, abgerundet auf den Volumenschritt, bei dem der Verlust vom "
    "Preis bis zum Stop-Loss die Risikogrenze nicht übersteigt, und prüft es bei einer "
    "bestehenden Order oder Position."
)


def _definition() -> ParameterDefinition:
    return ParameterDefinition(
        RISK_LIMIT_NAME,
        DataType.PERCENT,
        required=True,
        default=RISK_LIMIT_DEFAULT,
        key=RISK_LIMIT_PARAMETER,
    )


def risk_per_trade_template() -> Template:
    """The rule template "Risiko je Trade": parameter ``risikogrenze`` (percent, mandatory,
    default 1 %), determined property ``volumen``, comparison ``hoechstens``."""
    return Template(
        id=RISK_PER_TRADE_RULE_ID,
        name=RISK_PER_TRADE_NAME,
        description=RISK_PER_TRADE_DESCRIPTION,
        object_type=TYPE_RULE,
        parameters=[_definition()],
        expression=RISK_PER_TRADE_EXPRESSION,
        determined_property="volumen",
        comparison=Comparison.AT_MOST,
    )


def risk_per_trade_instance(
    name: str = RISK_PER_TRADE_NAME,
    risk_limit: float = RISK_LIMIT_DEFAULT,
    key: str = "",
) -> Instance:
    """An instance of "Risiko je Trade" with the given name and risk limit, a complete copy
    of the template (E4) with its origin. The origin names no template name: the template is
    a delivered one (specification 3.7)."""
    return Instance(
        name=name,
        key=key,
        object_type=TYPE_RULE,
        origin=Origin(TYPE_RULE, RISK_PER_TRADE_RULE_ID),
        parameter_values={RISK_LIMIT_PARAMETER: Binding(BindingKind.FIXED, risk_limit)},
        parameters=[_definition()],
        expression=RISK_PER_TRADE_EXPRESSION,
        determined_property="volumen",
        comparison=Comparison.AT_MOST,
    )
