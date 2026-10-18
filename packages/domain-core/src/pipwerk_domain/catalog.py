"""Delivered types (specification 3.2): triggers, flow elements, order types, objects of the
application, indicators and general object types, with German and English labels.

The types are only in this library, not in the backend and not in the user interface
(E2, E6). Identifiers of properties, parameters and fixed values are formed from the
German name by :func:`pipwerk_domain.identifiers.identifier_from_name`.
"""

from pipwerk_domain.identifiers import identifier_from_name
from pipwerk_domain.registry import ElementRegistry
from pipwerk_domain.typedesc import (
    ALL_BINDINGS,
    BindingKind,
    Choice,
    Condition,
    DataType,
    ElementKind,
    Label,
    ObjectCategory,
    OutputDescription,
    ParameterDescription,
    PropertyDescription,
    Scalar,
    TypeDescription,
)

# Identifiers of the delivered types
TRIGGER_CANDLE_CLOSE = "trigger.candle_close"
TRIGGER_TICK = "trigger.tick"
FLOW_CONDITION = "flow.condition"
FLOW_CALCULATION = "flow.calculation"
FLOW_SET_PARAMETER = "flow.set_parameter"
FLOW_PLACE_ORDER = "flow.place_order"
FLOW_MODIFY_ORDER = "flow.modify_order"
FLOW_DELETE_ORDER = "flow.delete_order"
FLOW_MODIFY_POSITION = "flow.modify_position"
FLOW_CLOSE_POSITION = "flow.close_position"
TREND_METHOD_EXPRESSION = "trend_method.expression"

MANAGEMENT_ONLY_FLOW_TYPES = frozenset(
    {FLOW_MODIFY_ORDER, FLOW_DELETE_ORDER, FLOW_MODIFY_POSITION, FLOW_CLOSE_POSITION}
)
"""Flow elements that stand only in a management (specification 3.6)."""

OBJECT_ORDER = "Order"
OBJECT_POSITION = "Position"
OBJECT_STRATEGY = "Strategie"
OBJECT_CANDLE = "Kerze"
TYPE_INDICATOR = "Indikator"
TYPE_TREND = "Trend"
TYPE_RULE = "Regel"
TYPE_RULESET = "Regelwerk"
ORDER_TYPES = ("MarketOrder", "StopOrder", "LimitOrder", "StopLimitOrder", "CloseOrder")

_EXPRESSION_ONLY = (BindingKind.EXPRESSION,)
_FIXED_ONLY = (BindingKind.FIXED,)


def _label(de: str, en: str | None = None) -> Label:
    return Label(de, de if en is None else en)


def _choice(de: str, en: str | None = None) -> Choice:
    return Choice(identifier_from_name(de), _label(de, en))


def _out(de: str, en: str, *, management: bool = False) -> OutputDescription:
    return OutputDescription(identifier_from_name(de), _label(de, en), management)


def _par(
    de: str,
    en: str,
    datatype: DataType,
    *,
    required: bool = False,
    default: Scalar | None = None,
    choices: tuple[Choice, ...] = (),
    bindings: tuple[BindingKind, ...] | None = None,
    when: Condition | None = None,
) -> ParameterDescription:
    return ParameterDescription(
        identifier_from_name(de),
        datatype,
        _label(de, en),
        required=required,
        default=default,
        choices=choices,
        bindings=ALL_BINDINGS if bindings is None else bindings,
        applies_when=when,
    )


def _prop(
    de: str,
    en: str,
    datatype: DataType,
    *,
    must: bool = False,
    user: bool = True,
    default: Scalar | None = None,
    choices: tuple[Choice, ...] = (),
    when: Condition | None = None,
    obj: str | None = None,
) -> PropertyDescription:
    return PropertyDescription(
        identifier_from_name(de),
        datatype,
        _label(de, en),
        must=must,
        set_by_user=user,
        default=default,
        choices=choices,
        applies_when=when,
        object_type=obj,
    )


DIRECTIONS = (_choice("buy"), _choice("sell"))
ORDER_STATUS = (
    _choice("wartend", "pending"),
    _choice("teilausgeführt", "partially filled"),
    _choice("ausgeführt", "filled"),
    _choice("gelöscht", "deleted"),
    _choice("abgelaufen", "expired"),
    _choice("abgelehnt", "rejected"),
)
VALIDITIES = (
    _choice("bis auf Widerruf", "good till cancelled"),
    _choice("bis Tagesende", "until end of day"),
    _choice("bis Zeitpunkt", "until time"),
    _choice("bis Ende eines Tages", "until end of a given day"),
)
TREND_DIRECTIONS = (
    _choice("aufwärts", "up"),
    _choice("abwärts", "down"),
    _choice("kein Trend", "no trend"),
)
PHASES = (_choice("Bewegung", "movement"), _choice("Korrektur", "correction"))
PRICE_SOURCES = (
    _choice("Schlusskurs", "close price"),
    _choice("Eröffnungskurs", "open price"),
    _choice("Hoch", "high"),
    _choice("Tief", "low"),
    _choice("Medianpreis", "median price"),
    _choice("Typischer Preis", "typical price"),
    _choice("Gewichteter Schlusskurs", "weighted close price"),
)

_DEFAULT_VALIDITY = identifier_from_name("bis auf Widerruf")
_VALIDITY_TIME = Condition("gueltigkeit", identifier_from_name("bis Zeitpunkt"))
_VALIDITY_DAY = Condition("gueltigkeit", identifier_from_name("bis Ende eines Tages"))


def _validity_parameters() -> tuple[ParameterDescription, ...]:
    return (
        _par("Gültigkeit", "Validity", DataType.CHOICE, choices=VALIDITIES),
        _par("Ablaufzeit", "Expiry time", DataType.TIMESTAMP, when=_VALIDITY_TIME),
        _par("Datum", "Date", DataType.DATE, when=_VALIDITY_DAY),
    )


def _triggers() -> list[TypeDescription]:
    return [
        TypeDescription(
            TRIGGER_CANDLE_CLOSE,
            ElementKind.TRIGGER,
            _label("Kerzenschluss", "Candle close"),
            _label(
                "Wertet die Strategie bei jedem Schluss einer Kerze der Zeiteinheit aus.",
                "Evaluates the strategy at every close of a candle of the time unit.",
            ),
            parameters=(_par("Zeiteinheit", "Time unit", DataType.TIME_UNIT, required=True),),
            outputs=(_out("weiter", "next"),),
            on_canvas=True,
        ),
        TypeDescription(
            TRIGGER_TICK,
            ElementKind.TRIGGER,
            _label("Tick"),
            _label(
                "Wertet die Strategie bei jedem neuen Tick aus.",
                "Evaluates the strategy at every new tick.",
            ),
            outputs=(_out("weiter", "next"),),
            on_canvas=True,
        ),
    ]


def _flow() -> list[TypeDescription]:
    expression = _par(
        "Ausdruck",
        "Expression",
        DataType.EXPRESSION,
        required=True,
        bindings=_EXPRESSION_ONLY,
    )
    next_output = (_out("weiter", "next"),)
    changed = (_out("geändert", "changed"), _out("nicht geändert", "not changed"))
    return [
        TypeDescription(
            FLOW_CONDITION,
            ElementKind.FLOW,
            _label("Bedingung", "Condition"),
            _label(
                "Verzweigt den Ablauf nach dem Ergebnis eines Ausdrucks.",
                "Branches the flow by the result of an expression.",
            ),
            parameters=(expression,),
            properties=(_prop("Ergebnis", "Result", DataType.BOOLEAN, must=True),),
            outputs=(_out("wahr", "true"), _out("falsch", "false")),
            on_canvas=True,
            named=True,
        ),
        TypeDescription(
            FLOW_CALCULATION,
            ElementKind.FLOW,
            _label("Berechnung", "Calculation"),
            _label(
                "Berechnet einen Ausdruck und liefert das Ergebnis.",
                "Calculates an expression and provides the result.",
            ),
            parameters=(expression,),
            properties=(_prop("Ergebnis", "Result", DataType.EXPRESSION, must=True),),
            outputs=next_output,
            on_canvas=True,
            named=True,
        ),
        TypeDescription(
            FLOW_SET_PARAMETER,
            ElementKind.FLOW,
            _label("Parameter setzen", "Set parameter"),
            _label(
                "Weist einem Strategieparameter einen Wert zu.",
                "Assigns a value to a strategy parameter.",
            ),
            parameters=(
                _par(
                    "Strategieparameter",
                    "Strategy parameter",
                    DataType.TEXT,
                    required=True,
                    bindings=_FIXED_ONLY,
                ),
                expression,
            ),
            outputs=next_output,
            on_canvas=True,
        ),
        TypeDescription(
            FLOW_PLACE_ORDER,
            ElementKind.FLOW,
            _label("Order aufgeben", "Place order"),
            _label(
                "Legt Ordertyp und Eigenschaften einer Order fest und übergibt sie an das "
                "Handelssystem.",
                "Sets the order type and the properties of an order and hands it to the "
                "trading system.",
            ),
            parameters=(
                _par(
                    "Ordertyp",
                    "Order type",
                    DataType.CHOICE,
                    required=True,
                    bindings=_FIXED_ONLY,
                ),
            ),
            outputs=(
                _out("gestellt", "placed", management=True),
                _out("nicht gestellt", "not placed"),
            ),
            rules_allowed=True,
            on_canvas=True,
        ),
        TypeDescription(
            FLOW_MODIFY_ORDER,
            ElementKind.FLOW,
            _label("Order ändern", "Modify order"),
            _label(
                "Ändert eine wartende Order. Ohne Wert bleibt die Angabe unverändert.",
                "Modifies a pending order. A property without a value stays unchanged.",
            ),
            parameters=(
                _par("Preis", "Price", DataType.NUMBER),
                _par("Limitpreis", "Limit price", DataType.NUMBER),
                _par("Stop-Loss", "Stop loss", DataType.NUMBER),
                _par("Take-Profit", "Take profit", DataType.NUMBER),
                *_validity_parameters(),
            ),
            outputs=changed,
            rules_allowed=True,
            on_canvas=True,
        ),
        TypeDescription(
            FLOW_DELETE_ORDER,
            ElementKind.FLOW,
            _label("Order löschen", "Delete order"),
            _label("Löscht eine wartende Order.", "Deletes a pending order."),
            outputs=next_output,
            on_canvas=True,
        ),
        TypeDescription(
            FLOW_MODIFY_POSITION,
            ElementKind.FLOW,
            _label("Position ändern", "Modify position"),
            _label(
                "Ändert Stop-Loss und Take-Profit einer offenen Position.",
                "Modifies stop loss and take profit of an open position.",
            ),
            parameters=(
                _par("Stop-Loss", "Stop loss", DataType.NUMBER),
                _par("Take-Profit", "Take profit", DataType.NUMBER),
            ),
            outputs=changed,
            rules_allowed=True,
            on_canvas=True,
        ),
        TypeDescription(
            FLOW_CLOSE_POSITION,
            ElementKind.FLOW,
            _label("Position schließen", "Close position"),
            _label(
                "Schließt eine offene Position ganz oder teilweise.",
                "Closes an open position completely or partially.",
            ),
            parameters=(_par("Volumen", "Volume", DataType.NUMBER),),
            outputs=next_output,
            rules_allowed=True,
            on_canvas=True,
        ),
    ]


def _order_types() -> list[TypeDescription]:
    # Properties filled by the application, not by the user (requirement req-fach-019)
    instrument = _prop(
        "Instrument", "Instrument", DataType.OBJECT, must=True, user=False, obj="Instrument"
    )
    price_assumed = _prop("Preis", "Price", DataType.NUMBER, must=True, user=False)
    price = _prop("Preis", "Price", DataType.NUMBER, must=True)
    direction = _prop("Richtung", "Direction", DataType.CHOICE, must=True, choices=DIRECTIONS)
    volume = _prop("Volumen", "Volume", DataType.NUMBER, must=True)
    stop_loss = _prop("Stop-Loss", "Stop loss", DataType.NUMBER)
    take_profit = _prop("Take-Profit", "Take profit", DataType.NUMBER)
    validity = (
        _prop(
            "Gültigkeit",
            "Validity",
            DataType.CHOICE,
            must=True,
            choices=VALIDITIES,
            default=_DEFAULT_VALIDITY,
        ),
        _prop("Ablaufzeit", "Expiry time", DataType.TIMESTAMP, must=True, when=_VALIDITY_TIME),
        _prop("Datum", "Date", DataType.DATE, must=True, when=_VALIDITY_DAY),
    )
    general = (
        _prop("Order-ID", "Order ID", DataType.TEXT, must=True, user=False),
        _prop("Status", "Status", DataType.CHOICE, must=True, user=False, choices=ORDER_STATUS),
        _prop("Konto", "Account", DataType.OBJECT, must=True, user=False, obj="Konto"),
        _prop("Strategie-ID", "Strategy ID", DataType.TEXT, user=False),
        _prop("Bemerkung", "Remark", DataType.TEXT),
    )
    pending = (instrument, direction, volume, price, stop_loss, take_profit, *validity)

    def order_type(
        type_id: str,
        de: str,
        en: str,
        description: Label,
        properties: tuple[PropertyDescription, ...],
        *,
        by_user: bool = True,
    ) -> TypeDescription:
        return TypeDescription(
            type_id,
            ElementKind.ORDER_TYPE,
            _label(de, en),
            description,
            properties=(*general, *properties),
            by_user=by_user,
        )

    return [
        order_type(
            "MarketOrder",
            "Marktorder",
            "Market order",
            _label(
                "Auftrag zur Ausführung zum aktuell verfügbaren Marktpreis.",
                "Order for execution at the currently available market price.",
            ),
            (instrument, direction, volume, price_assumed, stop_loss, take_profit),
        ),
        order_type(
            "StopOrder",
            "Stop-Order",
            "Stop order",
            _label(
                "Ausführung, sobald der Kurs den Preis in Handelsrichtung erreicht.",
                "Execution as soon as the price reaches the order price in trade direction.",
            ),
            pending,
        ),
        order_type(
            "LimitOrder",
            "Limit-Order",
            "Limit order",
            _label(
                "Ausführung, sobald der Kurs den Preis gegen die Handelsrichtung erreicht.",
                "Execution as soon as the price reaches the order price against the trade "
                "direction.",
            ),
            pending,
        ),
        order_type(
            "StopLimitOrder",
            "Stop-Limit-Order",
            "Stop limit order",
            _label(
                "Beim Erreichen des Auslösepreises wird eine Limit-Order zum Limitpreis gestellt.",
                "On reaching the trigger price a limit order is placed at the limit price.",
            ),
            (*pending, _prop("Limitpreis", "Limit price", DataType.NUMBER, must=True)),
        ),
        order_type(
            "CloseOrder",
            "Schließorder",
            "Close order",
            _label(
                "Schließt eine bestehende Position ganz oder teilweise. Entsteht nur über "
                "„Position schließen“.",
                "Closes an existing position completely or partially. Arises only from "
                '"Close position".',
            ),
            (
                _prop(
                    "Position", "Position", DataType.OBJECT, must=True, user=False, obj="Position"
                ),
                _prop("Volumen", "Volume", DataType.NUMBER),
                price_assumed,
            ),
            by_user=False,
        ),
    ]


def _application_objects() -> list[TypeDescription]:
    def number(de: str, en: str) -> PropertyDescription:
        return _prop(de, en, DataType.NUMBER, must=True)

    return [
        TypeDescription(
            "Konto",
            ElementKind.APPLICATION_OBJECT,
            _label("Konto", "Account"),
            _label("Das Handelskonto.", "The trading account."),
            properties=(
                number("Kapital", "Equity"),
                number("freie Margin", "Free margin"),
                _prop("Währung", "Currency", DataType.TEXT, must=True),
            ),
            on_canvas=True,
        ),
        TypeDescription(
            "Instrument",
            ElementKind.APPLICATION_OBJECT,
            _label("Instrument"),
            _label("Das gehandelte Instrument.", "The traded instrument."),
            properties=(
                _prop("Bezeichnung", "Designation", DataType.TEXT, must=True),
                number("Tickgröße", "Tick size"),
                number("Tickwert", "Tick value"),
                number("Punkt", "Point"),
                number("Pip", "Pip"),
                number("Spread", "Spread"),
                number("Mindestvolumen", "Minimum volume"),
                number("Volumenschritt", "Volume step"),
            ),
            on_canvas=True,
        ),
        TypeDescription(
            OBJECT_CANDLE,
            ElementKind.APPLICATION_OBJECT,
            _label("Kerze", "Candle"),
            _label(
                "Die jeweils letzte abgeschlossene Kerze einer Zeiteinheit.",
                "The most recent completed candle of a time unit.",
            ),
            parameters=(_par("Zeiteinheit", "Time unit", DataType.TIME_UNIT, required=True),),
            properties=(
                number("Eröffnung", "Open"),
                number("Hoch", "High"),
                number("Tief", "Low"),
                number("Schluss", "Close"),
                number("Volumen", "Volume"),
                _prop("Zeitpunkt", "Time", DataType.TIMESTAMP, must=True),
            ),
            on_canvas=True,
        ),
        TypeDescription(
            "Tick",
            ElementKind.APPLICATION_OBJECT,
            _label("Tick"),
            _label("Der jeweils letzte Tick.", "The most recent tick."),
            properties=(
                number("Geld", "Bid"),
                number("Brief", "Ask"),
                _prop("Zeitpunkt", "Time", DataType.TIMESTAMP, must=True),
            ),
            on_canvas=True,
        ),
        TypeDescription(
            OBJECT_ORDER,
            ElementKind.APPLICATION_OBJECT,
            _label("Order"),
            _label(
                "In einer Regel die Order, auf die sie angewendet wird; in der Verwaltung "
                "die eigene Order. Die Eigenschaften der Ordertypen kommen hinzu.",
                "In a rule the order it is applied to; in a management its own order. "
                "The properties of the order types are added.",
            ),
            properties=(
                _prop("Order-ID", "Order ID", DataType.TEXT, must=True, user=False),
                _prop(
                    "Status", "Status", DataType.CHOICE, must=True, user=False, choices=ORDER_STATUS
                ),
                _prop("Konto", "Account", DataType.OBJECT, must=True, user=False, obj="Konto"),
                _prop("Strategie-ID", "Strategy ID", DataType.TEXT, user=False),
                _prop("Bemerkung", "Remark", DataType.TEXT),
                _prop("Preis", "Price", DataType.NUMBER, must=True),
            ),
        ),
        TypeDescription(
            OBJECT_POSITION,
            ElementKind.APPLICATION_OBJECT,
            _label("Position"),
            _label(
                "Die Position, die durch die Ausführung einer Order entsteht.",
                "The position that arises from the execution of an order.",
            ),
            properties=(
                _prop("Instrument", "Instrument", DataType.OBJECT, must=True, obj="Instrument"),
                _prop("Richtung", "Direction", DataType.CHOICE, must=True, choices=DIRECTIONS),
                number("Volumen", "Volume"),
                number("Einstiegspreis", "Entry price"),
                _prop("Stop-Loss", "Stop loss", DataType.NUMBER),
                _prop("Take-Profit", "Take profit", DataType.NUMBER),
                number("offener Gewinn oder Verlust", "Open profit or loss"),
            ),
        ),
        TypeDescription(
            OBJECT_STRATEGY,
            ElementKind.APPLICATION_OBJECT,
            _label("Strategie", "Strategy"),
            _label(
                "Die eigene Strategie mit ihren Strategieparametern und Eigenschaften.",
                "The own strategy with its strategy parameters and properties.",
            ),
            properties=(
                _prop("Strategie-ID", "Strategy ID", DataType.TEXT, must=True),
                _prop("Bezeichnung", "Designation", DataType.TEXT, must=True),
                _prop("Beschreibung", "Description", DataType.TEXT),
                _prop("wartende Orders", "Pending orders", DataType.INTEGER, must=True),
                _prop("offene Positionen", "Open positions", DataType.INTEGER, must=True),
            ),
            strategy_parameters=True,
        ),
    ]


def _indicators() -> list[TypeDescription]:
    time_unit = _par("Zeiteinheit", "Time unit", DataType.TIME_UNIT, required=True)
    value = (_prop("Wert", "Value", DataType.NUMBER, must=True),)
    flag = DataType.BOOLEAN
    return [
        TypeDescription(
            TYPE_INDICATOR,
            ElementKind.OBJECT_TYPE,
            _label("Indikator", "Indicator"),
            _label(
                "Ein vom Anwender angelegter Indikator aus Regeln, mitgelieferten Indikatoren "
                "oder beidem. Parameter und Eigenschaften legt der Anwender fest.",
                "An indicator created by the user from rules, delivered indicators or both. "
                "The user defines parameters and properties.",
            ),
            category=ObjectCategory.INDICATOR,
            on_canvas=True,
        ),
        TypeDescription(
            "EMA",
            ElementKind.OBJECT_TYPE,
            _label("EMA"),
            _label(
                "Exponentieller gleitender Durchschnitt.",
                "Exponential moving average.",
            ),
            category=ObjectCategory.INDICATOR,
            parameters=(
                time_unit,
                _par("Periode", "Period", DataType.INTEGER, required=True),
                _par("Verschiebung", "Shift", DataType.INTEGER, default=0),
                _par(
                    "Kursquelle",
                    "Price source",
                    DataType.CHOICE,
                    default=identifier_from_name("Schlusskurs"),
                    choices=PRICE_SOURCES,
                ),
            ),
            properties=value,
            on_canvas=True,
        ),
        TypeDescription(
            "ATR",
            ElementKind.OBJECT_TYPE,
            _label("ATR"),
            _label(
                "Average True Range: durchschnittliche Schwankungsbreite einer Kerze.",
                "Average true range: average range of a candle.",
            ),
            category=ObjectCategory.INDICATOR,
            parameters=(time_unit, _par("Periode", "Period", DataType.INTEGER, required=True)),
            properties=value,
            on_canvas=True,
        ),
        TypeDescription(
            "Markttechnik",
            ElementKind.OBJECT_TYPE,
            _label("Markttechnik", "Market technique"),
            _label(
                "Bestimmt Trend, Phase und Punkte nach der Markttechnik aus ZigZag-Wendepunkten.",
                "Determines trend, phase and points by the market technique from ZigZag "
                "turning points.",
            ),
            category=ObjectCategory.INDICATOR,
            parameters=(
                time_unit,
                _par("Depth", "Depth", DataType.INTEGER, default=12),
                _par("Deviation", "Deviation", DataType.INTEGER, default=5),
                _par("Backstep", "Backstep", DataType.INTEGER, default=3),
            ),
            properties=(
                _prop(
                    "Trendrichtung",
                    "Trend direction",
                    DataType.CHOICE,
                    must=True,
                    choices=TREND_DIRECTIONS,
                ),
                _prop("Trend intakt", "Trend intact", flag, must=True),
                _prop("Phase", "Phase", DataType.CHOICE, choices=PHASES),
                _prop("Punkt 2", "Point 2", DataType.NUMBER),
                _prop("Punkt 1/3", "Point 1/3", DataType.NUMBER),
                _prop("Punkt 1/3 endgültig", "Point 1/3 final", flag),
            ),
            on_canvas=True,
        ),
    ]


def _general_object_types() -> list[TypeDescription]:
    return [
        TypeDescription(
            TYPE_TREND,
            ElementKind.OBJECT_TYPE,
            _label("Trend"),
            _label(
                "Die Richtung einer Entwicklung innerhalb einer Zeiteinheit, ermittelt nach "
                "einem Berechnungsverfahren.",
                "The direction of a development within a time unit, determined by a "
                "calculation method.",
            ),
            category=ObjectCategory.TREND,
            parameters=(
                _par("Zeiteinheit", "Time unit", DataType.TIME_UNIT, required=True),
                _par(
                    "Berechnungsverfahren",
                    "Calculation method",
                    DataType.CHOICE,
                    required=True,
                    default=TREND_METHOD_EXPRESSION,
                    bindings=_FIXED_ONLY,
                ),
            ),
            properties=(_prop("Richtung", "Direction", DataType.TEXT, must=True),),
            on_canvas=True,
        ),
        TypeDescription(
            TREND_METHOD_EXPRESSION,
            ElementKind.TREND_METHOD,
            _label("Ausdruck", "Expression"),
            _label(
                "Die Trendrichtung und weitere Eigenschaften ergeben sich aus Ausdrücken über "
                "enthaltene Instanzen von Indikatoren, Regeln und Regelwerken.",
                "The trend direction and further properties result from expressions over "
                "contained instances of indicators, rules and rulesets.",
            ),
        ),
        TypeDescription(
            TYPE_RULE,
            ElementKind.OBJECT_TYPE,
            _label("Regel", "Rule"),
            _label(
                "Bestimmt den Wert einer Eigenschaft einer Order oder prüft einen Sachverhalt.",
                "Determines the value of a property of an order or checks a fact.",
            ),
            category=ObjectCategory.RULE,
        ),
        TypeDescription(
            TYPE_RULESET,
            ElementKind.OBJECT_TYPE,
            _label("Regelwerk", "Ruleset"),
            _label(
                "Eine geordnete Sammlung konfigurierter Regeln.",
                "An ordered collection of configured rules.",
            ),
            category=ObjectCategory.RULESET,
        ),
    ]


def delivered_types() -> list[TypeDescription]:
    """All types delivered with the library, in the order of registration."""
    return [
        *_triggers(),
        *_flow(),
        *_order_types(),
        *_application_objects(),
        *_indicators(),
        *_general_object_types(),
    ]


def register_delivered_types(registry: ElementRegistry) -> None:
    """Register the delivered types."""
    for description in delivered_types():
        registry.register(description)
