"""Delivered types (specification 3.2): triggers, flow elements, order types, objects of the
application, indicators and general object types, with German and English names and
explanations in trader language (specification 3.1).

The types are only in this library, not in the backend and not in the user interface
(E2, E6). Identifiers of properties, parameters and fixed values are formed from the
German name by :func:`pipwerk_domain.identifiers.identifier_from_name`.
"""

from pipwerk_domain.identifiers import identifier_from_name
from pipwerk_domain.registry import ElementRegistry
from pipwerk_domain.typedesc import (
    ALL_BINDINGS,
    APPLICATION_INSTRUMENT,
    INSTRUMENT_CHOICES,
    INSTRUMENT_PARAMETER,
    INSTRUMENT_TYPE,
    BindingKind,
    Choice,
    Condition,
    DataType,
    ElementKind,
    Group,
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
TRIGGER_MANUAL = "trigger.manual"
LEGACY_TRIGGER_MANUAL_START = "trigger.manual_start"
"""The identifier of "Start von Hand", the former name of the trigger ``Manuell``. A document
with this identifier is read as ``trigger.manual`` (specification 3.7); it is no registered
type."""
FORMER_TYPE_IDS = {LEGACY_TRIGGER_MANUAL_START: TRIGGER_MANUAL}
"""Identifiers that a document may still carry, and the identifiers it is read with."""
FLOW_CONDITION = "flow.condition"
FLOW_CALCULATION = "flow.calculation"
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

NAMED_FLOW_TYPES = frozenset({FLOW_CONDITION, FLOW_CALCULATION})
"""Flow elements whose result expressions address by a key (``key.ergebnis``)."""

OBJECT_ORDER = "Order"
OBJECT_POSITION = "Position"
OBJECT_STRATEGY = "Strategie"
OBJECT_CANDLE = "Kerze"
OBJECT_TICK = "Tick"
OBJECT_INSTRUMENT = INSTRUMENT_TYPE
OBJECT_ACCOUNT = "Konto"
TYPE_INDICATOR = "Indikator"
TYPE_TREND = "Trend"
TYPE_RULE = "Regel"
TYPE_RULESET = "Regelwerk"
ORDER_TYPES = ("MarketOrder", "StopOrder", "LimitOrder", "StopLimitOrder", "CloseOrder")

_EXPRESSION_ONLY = (BindingKind.EXPRESSION,)
_FIXED_ONLY = (BindingKind.FIXED,)

RESULT_PROPERTY = "ergebnis"
"""Identifier of the result of a rule, condition or calculation (``key.ergebnis``)."""


def current_type_id(type_id: str) -> str:
    """The identifier a document is read with: the former identifier of a type that was
    renamed is replaced by the current one (specification 3.7, "Start von Hand" is
    ``Manuell``), any other identifier stays."""
    return FORMER_TYPE_IDS.get(type_id, type_id)


def _label(de: str, en: str | None = None) -> Label:
    return Label(de, de if en is None else en)


def _choice(de: str, en: str | None = None) -> Choice:
    return Choice(identifier_from_name(de), _label(de, en))


def _out(de: str, en: str, tip: tuple[str, str], *, management: bool = False) -> OutputDescription:
    return OutputDescription(
        identifier_from_name(de), _label(de, en), management, explanation=_label(*tip)
    )


# Explanations of parameters and properties by identifier (trader language). A text that
# differs for one parameter or property is given at its place.
_TIPS: dict[str, tuple[str, str]] = {
    "zeiteinheit": (
        "Die Kerzenlänge, auf der gerechnet wird, zum Beispiel M15 für 15-Minuten-Kerzen oder "
        "H1 für Stundenkerzen.",
        "The candle length used for the calculation, for example M15 for 15-minute candles "
        "or H1 for hourly candles.",
    ),
    INSTRUMENT_PARAMETER: (
        "Das gehandelte Instrument. Vorbelegt mit dem Instrument, auf dem die Strategie "
        "angewendet wird.",
        "The traded instrument. Preset with the instrument the strategy is applied to.",
    ),
    "periode": (
        "Anzahl der Kerzen, über die gerechnet wird. Kleinere Werte reagieren schneller, "
        "größere ruhiger.",
        "Number of candles used. Smaller values react faster, larger ones calmer.",
    ),
    "verschiebung": (
        "Verschiebt die Linie um so viele Kerzen. Normalerweise 0.",
        "Shifts the line by that many candles. Normally 0.",
    ),
    "anwenden_auf": (
        "Aus welchem Kurs der Kerze gerechnet wird, zum Beispiel dem Schlusskurs.",
        "Which price of the candle is used, for example the close price.",
    ),
    "depth": (
        "Mindestzahl an Kerzen zwischen zwei Wendepunkten (Einstellung des ZigZag in "
        "MetaTrader 5).",
        "Minimum number of candles between two turning points (setting of the ZigZag in "
        "MetaTrader 5).",
    ),
    "deviation": (
        "Mindestbewegung in Punkten, damit ein neuer Wendepunkt entsteht.",
        "Minimum move in points for a new turning point.",
    ),
    "backstep": (
        "Mindestabstand in Kerzen zwischen einem Hoch und einem Tief.",
        "Minimum distance in candles between a high and a low.",
    ),
    "ausdruck": (
        "Hier legen Sie fest, was geprüft oder berechnet wird. Wählen Sie die Bausteine aus "
        "den Listen.",
        "Here you define what is checked or calculated. Choose the blocks from the lists.",
    ),
    "ordertyp": (
        "Marktorder: sofort zum aktuellen Kurs. Stop-Order: wird ausgelöst, wenn der Kurs den "
        "Preis erreicht. Limit-Order: wartet auf einen besseren Preis.",
        "Market: immediately at the current price. Stop: triggers when the price reaches the "
        "order price. Limit: waits for a better price.",
    ),
    "richtung": (
        "buy kauft, sell verkauft.",
        "buy buys, sell sells.",
    ),
    "volumen": (
        "Die Menge, die gehandelt wird. Meist bestimmt eine Regel wie „Risiko je Trade“ das "
        "Volumen.",
        'The quantity traded. Usually a rule such as "Risk per trade" determines the volume.',
    ),
    "preis": (
        "Bei wartenden Orders der Preis, bei dem die Order ausgelöst wird.",
        "For pending orders the price at which the order triggers.",
    ),
    "limitpreis": (
        "Der Preis, zu dem die Order nach dem Auslösen gestellt wird.",
        "The price at which the order is placed after it triggers.",
    ),
    "stop_loss": (
        "Der Kurs, bei dem die Position mit Verlust geschlossen wird, um den Verlust zu begrenzen.",
        "The price at which the position is closed at a loss to limit the loss.",
    ),
    "take_profit": (
        "Der Kurs, bei dem die Position mit Gewinn geschlossen wird. Leer: kein Take-Profit.",
        "The price at which the position is closed at a profit. Empty: no take profit.",
    ),
    "gueltigkeit": (
        "Wie lange eine wartende Order gilt, wenn sie nicht ausgeführt wird.",
        "How long a pending order stays valid if it is not executed.",
    ),
    "ablaufzeit": ("Zeitpunkt, zu dem die Order endet.", "Time at which the order ends."),
    "datum": (
        "Tag, an dessen Ende die Order endet.",
        "Day at the end of which the order ends.",
    ),
    "bemerkung": ("Freier Text, nur zur Information.", "Free text, for information only."),
    "berechnungsverfahren": (
        "Wie der Trend berechnet wird. Mitgeliefert ist „Ausdruck“: Sie legen die Richtung "
        "mit Bausteinen fest.",
        'How the trend is calculated. Delivered is "Expression": you define the direction '
        "with blocks.",
    ),
    "risikogrenze": (
        "Höchster Verlust je Trade als Anteil des Kapitals, zum Beispiel 1 %.",
        "Maximum loss per trade as a share of the equity, for example 1 %.",
    ),
    "wert": ("Der aktuelle Wert des Indikators.", "The current value of the indicator."),
    "letztes_hoch": (
        "Der Kurs des letzten endgültigen Hochs des ZigZag. Leer, solange der ZigZag noch "
        "kein Hoch gefunden hat.",
        "The price of the last final high of the ZigZag. Empty as long as the ZigZag has "
        "not found a high yet.",
    ),
    "vorletztes_hoch": (
        "Der Kurs des endgültigen Hochs vor dem letzten Hoch des ZigZag. Leer, solange es "
        "noch kein zweites Hoch gibt.",
        "The price of the final high before the last high of the ZigZag. Empty as long as "
        "there is no second high yet.",
    ),
    "letztes_tief": (
        "Der Kurs des letzten endgültigen Tiefs des ZigZag. Leer, solange der ZigZag noch "
        "kein Tief gefunden hat.",
        "The price of the last final low of the ZigZag. Empty as long as the ZigZag has "
        "not found a low yet.",
    ),
    "vorletztes_tief": (
        "Der Kurs des endgültigen Tiefs vor dem letzten Tief des ZigZag. Leer, solange es "
        "noch kein zweites Tief gibt.",
        "The price of the final low before the last low of the ZigZag. Empty as long as "
        "there is no second low yet.",
    ),
    "ergebnis": (
        "Das Ergebnis dieses Schritts. Spätere Schritte können es verwenden.",
        "The result of this step. Later steps can use it.",
    ),
    "kapital": (
        "Kontostand einschließlich der Gewinne und Verluste offener Positionen.",
        "Account balance including profits and losses of open positions.",
    ),
    "freie_margin": (
        "Das Geld, das für neue Positionen noch zur Verfügung steht.",
        "The money still available for new positions.",
    ),
    "waehrung": ("Die Währung des Kontos.", "The currency of the account."),
    "bezeichnung": ("Name des Instruments.", "Name of the instrument."),
    "tickgroesse": (
        "Kleinste Kursänderung des Instruments.",
        "Smallest price change of the instrument.",
    ),
    "tickwert": (
        "Wert einer Kursänderung um einen Tick in der Kontowährung.",
        "Value of a price change by one tick in account currency.",
    ),
    "punkt": ("Ein Punkt in Kursdifferenz.", "One point as price difference."),
    "pip": ("Ein Pip in Kursdifferenz.", "One pip as price difference."),
    "spread": (
        "Abstand zwischen Brief- und Geldkurs.",
        "Distance between ask and bid.",
    ),
    "mindestvolumen": ("Kleinstes handelbares Volumen.", "Smallest tradable volume."),
    "volumenschritt": (
        "Kleinste Stufe, in der sich das Volumen ändern lässt.",
        "Smallest step in which the volume can change.",
    ),
    "eroeffnung": (
        "Eröffnungskurs der letzten abgeschlossenen Kerze.",
        "Open of the last completed candle.",
    ),
    "hoch": (
        "Höchstkurs der letzten abgeschlossenen Kerze.",
        "High of the last completed candle.",
    ),
    "tief": (
        "Tiefstkurs der letzten abgeschlossenen Kerze.",
        "Low of the last completed candle.",
    ),
    "schluss": (
        "Schlusskurs der letzten abgeschlossenen Kerze.",
        "Close of the last completed candle.",
    ),
    "geld": ("Der Kurs, zu dem Sie verkaufen.", "The price at which you sell."),
    "brief": ("Der Kurs, zu dem Sie kaufen.", "The price at which you buy."),
    "zeitpunkt": (
        "Zeitpunkt der Kerze beziehungsweise des Ticks.",
        "Time of the candle or tick.",
    ),
    "status": ("Wartend, ausgeführt, gelöscht …", "Pending, filled, deleted …"),
    "order_id": ("Die Kennzeichnung der Order beim Broker.", "The identification of the order."),
    "konto": ("Das Handelskonto der Order.", "The trading account of the order."),
    "strategie_id": (
        "Die Kennzeichnung der Strategie, die die Order gestellt hat.",
        "The identification of the strategy that placed the order.",
    ),
    "einstiegspreis": (
        "Der Preis, zu dem die Position eröffnet wurde.",
        "The price at which the position was opened.",
    ),
    "offener_gewinn_oder_verlust": (
        "Gewinn oder Verlust der Position beim aktuellen Kurs.",
        "Profit or loss of the position at the current price.",
    ),
    "wartende_orders": (
        "Anzahl der wartenden Orders dieser Strategie.",
        "Number of pending orders of this strategy.",
    ),
    "offene_positionen": (
        "Anzahl der offenen Positionen dieser Strategie.",
        "Number of open positions of this strategy.",
    ),
    "name": ("Der Name der Strategie.", "The name of the strategy."),
    "beschreibung": (
        "Die Beschreibung der Strategie.",
        "The description of the strategy.",
    ),
    "position": (
        "Die Position, die die Schließorder schließt.",
        "The position that the close order closes.",
    ),
}

_TURNING_POINT_ORDINALS = (
    ("jüngsten", "most recent"),
    ("zweitjüngsten", "second most recent"),
    ("drittjüngsten", "third most recent"),
)


def _turning_point_tip(number: int, kind: str) -> tuple[str, str]:
    """The explanation of a property (``price``, ``kind`` or ``final``) of the ``number``-th
    most recent turning point."""
    ordinal_de, ordinal_en = _TURNING_POINT_ORDINALS[number - 1]
    texts = {
        "price": (
            f"Der Kurs des {ordinal_de} Wendepunkts des ZigZag.",
            f"The price of the {ordinal_en} turning point of the ZigZag.",
        ),
        "kind": (
            f"Die Art (Hoch oder Tief) des {ordinal_de} Wendepunkts des ZigZag.",
            f"The kind (high or low) of the {ordinal_en} turning point of the ZigZag.",
        ),
        "final": (
            f"Ja, wenn der {ordinal_de} Wendepunkt des ZigZag endgültig ist und sich nicht mehr "
            "verschiebt.",
            f"Yes if the {ordinal_en} turning point of the ZigZag is final and does not move "
            "any more.",
        ),
    }
    de, en = texts[kind]
    return (
        f"{de} Der jüngste Wendepunkt kann sich noch verschieben. Vorläufig sind die drei "
        "jüngsten Wendepunkte ansprechbar.",
        f"{en} The most recent turning point can still move. Provisionally the three most "
        "recent turning points can be addressed.",
    )


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
    obj: str | None = None,
    tip: tuple[str, str] | None = None,
) -> ParameterDescription:
    ident = identifier_from_name(de)
    texts = tip or _TIPS.get(ident)
    return ParameterDescription(
        ident,
        datatype,
        _label(de, en),
        required=required,
        default=default,
        choices=choices,
        bindings=ALL_BINDINGS if bindings is None else bindings,
        applies_when=when,
        object_type=obj,
        explanation=_label(*texts) if texts else _label(""),
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
    ident: str | None = None,
    tip: tuple[str, str] | None = None,
) -> PropertyDescription:
    ident = ident or identifier_from_name(de)
    texts = tip or _TIPS.get(ident)
    return PropertyDescription(
        ident,
        datatype,
        _label(de, en),
        must=must,
        set_by_user=user,
        default=default,
        choices=choices,
        applies_when=when,
        object_type=obj,
        explanation=_label(*texts) if texts else _label(""),
    )


def _instrument_parameter() -> ParameterDescription:
    """The parameter ``Instrument`` (specification 3.1): preset with the instrument of the
    application, any binding kind."""
    return _par(
        "Instrument",
        "Instrument",
        DataType.OBJECT,
        default=APPLICATION_INSTRUMENT,
        choices=INSTRUMENT_CHOICES,
        obj=INSTRUMENT_TYPE,
    )


def _time_unit_parameter() -> ParameterDescription:
    return _par("Zeiteinheit", "Time unit", DataType.TIME_UNIT, required=True)


def _type(
    type_id: str,
    kind: ElementKind,
    name: tuple[str, str],
    description: tuple[str, str],
    explanation: tuple[str, str],
    **fields: object,
) -> TypeDescription:
    return TypeDescription(
        type_id,
        kind,
        _label(*name),
        _label(*description),
        explanation=_label(*explanation),
        **fields,  # type: ignore[arg-type]
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
TURNING_POINT_KINDS = (_choice("hoch", "high"), _choice("tief", "low"))
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
_TURNING_POINTS = 3


def _validity_parameters() -> tuple[ParameterDescription, ...]:
    return (
        _par("Gültigkeit", "Validity", DataType.CHOICE, choices=VALIDITIES),
        _par("Ablaufzeit", "Expiry time", DataType.TIMESTAMP, when=_VALIDITY_TIME),
        _par("Datum", "Date", DataType.DATE, when=_VALIDITY_DAY),
    )


def _triggers() -> list[TypeDescription]:
    next_output = (_out("weiter", "next", ("Der Ablauf geht weiter.", "The flow continues.")),)
    return [
        _type(
            TRIGGER_CANDLE_CLOSE,
            ElementKind.TRIGGER,
            ("Kerzenschluss", "Candle close"),
            (
                "Wertet die Strategie bei jedem Schluss einer Kerze der Zeiteinheit aus.",
                "Evaluates the strategy at every close of a candle of the time unit.",
            ),
            (
                "Die Strategie rechnet jedes Mal, wenn eine Kerze der gewählten Länge "
                "abgeschlossen ist, zum Beispiel jede Stunde bei H1.",
                "The strategy calculates whenever a candle of the chosen length closes, for "
                "example every hour with H1.",
            ),
            parameters=(_instrument_parameter(), _time_unit_parameter()),
            outputs=next_output,
            on_canvas=True,
            group=Group.FLOW,
        ),
        _type(
            TRIGGER_TICK,
            ElementKind.TRIGGER,
            ("Tick", "Tick"),
            (
                "Wertet die Strategie bei jedem neuen Tick aus.",
                "Evaluates the strategy at every new tick.",
            ),
            (
                "Die Strategie rechnet bei jedem neuen Kurs (Tick). Das ist sehr oft, daher "
                "eher für die Überwachung einer Order geeignet.",
                "The strategy calculates at every new quote (tick). That is very often, so it "
                "suits monitoring an order.",
            ),
            parameters=(_instrument_parameter(),),
            outputs=next_output,
            on_canvas=True,
            group=Group.FLOW,
        ),
        _type(
            TRIGGER_MANUAL,
            ElementKind.TRIGGER,
            ("Manuell", "Manual"),
            (
                "Wertet die Strategie aus, wenn der Anwender sie von Hand startet. Steht nur "
                "im Hauptablauf.",
                "Evaluates the strategy when the user starts it by hand. Stands only in the "
                "main flow.",
            ),
            (
                "Die Strategie rechnet, wenn Sie sie selbst starten. Das hilft beim "
                "Ausprobieren, ohne auf eine Kerze oder einen Kurs zu warten. Den Start von "
                "Hand gibt es nur im Hauptablauf, nicht in der Verwaltung einer Order.",
                "The strategy calculates when you start it yourself. That helps to try it out "
                "without waiting for a candle or a quote. Starting by hand exists only in the "
                "main flow, not in the management of an order.",
            ),
            outputs=next_output,
            on_canvas=True,
            group=Group.FLOW,
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
    next_output = (_out("weiter", "next", ("Der Ablauf geht weiter.", "The flow continues.")),)
    changed = (
        _out(
            "geändert",
            "changed",
            ("Weiter, wenn die Änderung gelungen ist.", "Continues if the change succeeded."),
        ),
        _out(
            "nicht geändert",
            "not changed",
            ("Weiter, wenn nichts geändert werden konnte.", "Continues if nothing was changed."),
        ),
    )
    result_note = ("Das Ergebnis dieses Schritts.", "The result of this step.")
    return [
        _type(
            FLOW_CONDITION,
            ElementKind.FLOW,
            ("Bedingung", "Condition"),
            (
                "Verzweigt den Ablauf nach dem Ergebnis eines Ausdrucks.",
                "Branches the flow by the result of an expression.",
            ),
            (
                "Prüft etwas, zum Beispiel „EMA 20 kreuzt EMA 50“. Bei „wahr“ geht es auf dem "
                "einen Weg weiter, bei „falsch“ auf dem anderen.",
                'Checks something, for example "EMA 20 crosses EMA 50". If true the flow '
                "continues one way, if false the other.",
            ),
            parameters=(
                _par(
                    "Ausdruck",
                    "Expression",
                    DataType.EXPRESSION,
                    required=True,
                    bindings=_EXPRESSION_ONLY,
                    tip=_TIPS["ausdruck"],
                ),
            ),
            properties=(_prop("Ergebnis", "Result", DataType.BOOLEAN, must=True, tip=result_note),),
            outputs=(
                _out(
                    "wahr",
                    "true",
                    ("Weiter, wenn die Bedingung zutrifft.", "Continues if the condition holds."),
                ),
                _out(
                    "falsch",
                    "false",
                    (
                        "Weiter, wenn die Bedingung nicht zutrifft.",
                        "Continues if the condition does not hold.",
                    ),
                ),
            ),
            on_canvas=True,
            named=True,
            group=Group.FLOW,
        ),
        _type(
            FLOW_CALCULATION,
            ElementKind.FLOW,
            ("Berechnung", "Calculation"),
            (
                "Berechnet einen Ausdruck und liefert das Ergebnis.",
                "Calculates an expression and provides the result.",
            ),
            (
                "Rechnet einen Wert aus, zum Beispiel den Stop-Loss. Das Ergebnis können "
                "spätere Schritte verwenden.",
                "Calculates a value, for example the stop loss. Later steps can use the result.",
            ),
            parameters=(expression,),
            properties=(
                _prop("Ergebnis", "Result", DataType.EXPRESSION, must=True, tip=result_note),
            ),
            outputs=next_output,
            on_canvas=True,
            named=True,
            group=Group.CALCULATION,
        ),
        _type(
            FLOW_PLACE_ORDER,
            ElementKind.FLOW,
            ("Order aufgeben", "Place order"),
            (
                "Legt Ordertyp und Eigenschaften einer Order fest und übergibt sie an das "
                "Handelssystem.",
                "Sets the order type and the properties of an order and hands it to the "
                "trading system.",
            ),
            (
                "Gibt eine Order an den Markt. Am Ausgang „gestellt“ steht danach die "
                "Verwaltung dieser Order.",
                'Sends an order to the market. After "placed" follows the management of this '
                "order.",
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
                _out(
                    "gestellt",
                    "placed",
                    (
                        "Hier hängt die Verwaltung der Order: was mit ihr geschieht, solange "
                        "sie wartet oder als Position offen ist.",
                        "The management of the order hangs here: what happens to it while it "
                        "waits or is open as a position.",
                    ),
                    management=True,
                ),
                _out(
                    "nicht gestellt",
                    "not placed",
                    (
                        "Weiter, wenn die Order nicht gestellt werden konnte.",
                        "Continues if the order could not be placed.",
                    ),
                ),
            ),
            rules_allowed=True,
            on_canvas=True,
            group=Group.ACTIONS,
        ),
        _type(
            FLOW_MODIFY_ORDER,
            ElementKind.FLOW,
            ("Order ändern", "Modify order"),
            (
                "Ändert eine wartende Order. Ohne Wert bleibt die Angabe unverändert.",
                "Modifies a pending order. A property without a value stays unchanged.",
            ),
            (
                "Ändert eine wartende Order, zum Beispiel Stop-Loss oder Take-Profit. Was leer "
                "bleibt, bleibt unverändert.",
                "Modifies a pending order, for example stop loss or take profit. Whatever "
                "stays empty stays unchanged.",
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
            group=Group.ACTIONS,
        ),
        _type(
            FLOW_DELETE_ORDER,
            ElementKind.FLOW,
            ("Order löschen", "Delete order"),
            ("Löscht eine wartende Order.", "Deletes a pending order."),
            (
                "Löscht die wartende Order dieser Verwaltung.",
                "Deletes the pending order of this management.",
            ),
            outputs=next_output,
            on_canvas=True,
            group=Group.ACTIONS,
        ),
        _type(
            FLOW_MODIFY_POSITION,
            ElementKind.FLOW,
            ("Position ändern", "Modify position"),
            (
                "Ändert Stop-Loss und Take-Profit einer offenen Position.",
                "Modifies stop loss and take profit of an open position.",
            ),
            (
                "Ändert Stop-Loss oder Take-Profit der offenen Position, zum Beispiel um den "
                "Stop-Loss nachzuziehen.",
                "Modifies stop loss or take profit of the open position, for example to trail "
                "the stop loss.",
            ),
            parameters=(
                _par("Stop-Loss", "Stop loss", DataType.NUMBER),
                _par("Take-Profit", "Take profit", DataType.NUMBER),
            ),
            outputs=changed,
            rules_allowed=True,
            on_canvas=True,
            group=Group.ACTIONS,
        ),
        _type(
            FLOW_CLOSE_POSITION,
            ElementKind.FLOW,
            ("Position schließen", "Close position"),
            (
                "Schließt eine offene Position ganz oder teilweise.",
                "Closes an open position completely or partially.",
            ),
            (
                "Schließt die offene Position ganz oder, mit Angabe eines Volumens, teilweise.",
                "Closes the open position completely or, with a volume, partially.",
            ),
            parameters=(
                _par(
                    "Volumen",
                    "Volume",
                    DataType.NUMBER,
                    tip=(
                        "Die Menge, die geschlossen wird. Leer: die Position wird ganz "
                        "geschlossen.",
                        "The quantity to close. Empty: the position is closed completely.",
                    ),
                ),
            ),
            outputs=next_output,
            rules_allowed=True,
            on_canvas=True,
            group=Group.ACTIONS,
        ),
    ]


def _order_types() -> list[TypeDescription]:
    # Properties filled by the application, not by the user (requirement req-fach-019)
    instrument = _prop(
        "Instrument",
        "Instrument",
        DataType.OBJECT,
        must=True,
        default=APPLICATION_INSTRUMENT,
        choices=INSTRUMENT_CHOICES,
        obj=INSTRUMENT_TYPE,
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
        _prop(
            "Konto",
            "Account",
            DataType.OBJECT,
            must=True,
            user=False,
            obj=OBJECT_ACCOUNT,
        ),
        _prop("Strategie-ID", "Strategy ID", DataType.TEXT, user=False),
        _prop("Bemerkung", "Remark", DataType.TEXT),
    )
    pending = (instrument, direction, volume, price, stop_loss, take_profit, *validity)

    def order_type(
        type_id: str,
        names: tuple[str, str],
        description: tuple[str, str],
        properties: tuple[PropertyDescription, ...],
        *,
        by_user: bool = True,
    ) -> TypeDescription:
        return _type(
            type_id,
            ElementKind.ORDER_TYPE,
            names,
            description,
            description,
            properties=(*general, *properties),
            by_user=by_user,
        )

    return [
        order_type(
            "MarketOrder",
            ("Marktorder", "Market order"),
            (
                "Auftrag zur Ausführung zum aktuell verfügbaren Marktpreis.",
                "Order for execution at the currently available market price.",
            ),
            (instrument, direction, volume, price_assumed, stop_loss, take_profit),
        ),
        order_type(
            "StopOrder",
            ("Stop-Order", "Stop order"),
            (
                "Ausführung, sobald der Kurs den Preis in Handelsrichtung erreicht.",
                "Execution as soon as the price reaches the order price in trade direction.",
            ),
            pending,
        ),
        order_type(
            "LimitOrder",
            ("Limit-Order", "Limit order"),
            (
                "Ausführung, sobald der Kurs den Preis gegen die Handelsrichtung erreicht.",
                "Execution as soon as the price reaches the order price against the trade "
                "direction.",
            ),
            pending,
        ),
        order_type(
            "StopLimitOrder",
            ("Stop-Limit-Order", "Stop limit order"),
            (
                "Beim Erreichen des Auslösepreises wird eine Limit-Order zum Limitpreis gestellt.",
                "On reaching the trigger price a limit order is placed at the limit price.",
            ),
            (*pending, _prop("Limitpreis", "Limit price", DataType.NUMBER, must=True)),
        ),
        order_type(
            "CloseOrder",
            ("Schließorder", "Close order"),
            (
                "Schließt eine bestehende Position ganz oder teilweise. Entsteht nur über "
                "„Position schließen“.",
                "Closes an existing position completely or partially. Arises only from "
                '"Close position".',
            ),
            (
                _prop(
                    "Position",
                    "Position",
                    DataType.OBJECT,
                    must=True,
                    user=False,
                    obj=OBJECT_POSITION,
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
        _type(
            OBJECT_ACCOUNT,
            ElementKind.APPLICATION_OBJECT,
            ("Konto", "Account"),
            ("Das Handelskonto.", "The trading account."),
            (
                "Zeigt Kapital, freie Margin und Währung des Handelskontos. Legen Sie es auf "
                "die Fläche, wenn Sie Werte davon verbinden wollen.",
                "Shows equity, free margin and currency of the trading account. Place it on "
                "the canvas to wire values from it.",
            ),
            properties=(
                number("Kapital", "Equity"),
                number("freie Margin", "Free margin"),
                _prop("Währung", "Currency", DataType.TEXT, must=True),
            ),
            on_canvas=True,
            can_refresh=True,
            group=Group.ACCOUNT,
        ),
        _type(
            OBJECT_INSTRUMENT,
            ElementKind.APPLICATION_OBJECT,
            ("Instrument", "Instrument"),
            ("Das gehandelte Instrument.", "The traded instrument."),
            (
                "Zeigt Eigenschaften des gehandelten Instruments, zum Beispiel Spread, Pip und "
                "Mindestvolumen.",
                "Shows properties of the traded instrument, for example spread, pip and "
                "minimum volume.",
            ),
            parameters=(_instrument_parameter(),),
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
            can_refresh=True,
            group=Group.MARKET,
        ),
        _type(
            OBJECT_CANDLE,
            ElementKind.APPLICATION_OBJECT,
            ("Kerze", "Candle"),
            (
                "Die jeweils letzte abgeschlossene Kerze einer Zeiteinheit.",
                "The most recent completed candle of a time unit.",
            ),
            (
                "Die jeweils letzte abgeschlossene Kerze einer Zeiteinheit mit Eröffnung, "
                "Hoch, Tief und Schluss.",
                "The most recent completed candle of a time unit with open, high, low and close.",
            ),
            parameters=(_instrument_parameter(), _time_unit_parameter()),
            properties=(
                number("Eröffnung", "Open"),
                number("Hoch", "High"),
                number("Tief", "Low"),
                number("Schluss", "Close"),
                number("Volumen", "Volume"),
                _prop("Zeitpunkt", "Time", DataType.TIMESTAMP, must=True),
            ),
            on_canvas=True,
            can_refresh=True,
            group=Group.MARKET,
        ),
        _type(
            OBJECT_TICK,
            ElementKind.APPLICATION_OBJECT,
            ("Tick", "Tick"),
            ("Der jeweils letzte Tick.", "The most recent tick."),
            (
                "Der jeweils letzte Kurs mit Geld- und Briefkurs.",
                "The most recent quote with bid and ask.",
            ),
            parameters=(_instrument_parameter(),),
            properties=(
                number("Geld", "Bid"),
                number("Brief", "Ask"),
                _prop("Zeitpunkt", "Time", DataType.TIMESTAMP, must=True),
            ),
            on_canvas=True,
            can_refresh=True,
            group=Group.MARKET,
        ),
        _type(
            OBJECT_ORDER,
            ElementKind.APPLICATION_OBJECT,
            ("Order", "Order"),
            (
                "In einer Regel die Order, auf die sie angewendet wird; in der Verwaltung "
                "die eigene Order. Die Eigenschaften der Ordertypen kommen hinzu.",
                "In a rule the order it is applied to; in a management its own order. "
                "The properties of the order types are added.",
            ),
            (
                "Die Order, um die es in einer Regel oder in der Verwaltung einer Order geht.",
                "The order a rule or the management of an order is about.",
            ),
            properties=(
                _prop("Order-ID", "Order ID", DataType.TEXT, must=True, user=False),
                _prop(
                    "Status", "Status", DataType.CHOICE, must=True, user=False, choices=ORDER_STATUS
                ),
                _prop(
                    "Konto",
                    "Account",
                    DataType.OBJECT,
                    must=True,
                    user=False,
                    obj=OBJECT_ACCOUNT,
                ),
                _prop("Strategie-ID", "Strategy ID", DataType.TEXT, user=False),
                _prop("Bemerkung", "Remark", DataType.TEXT),
                _prop("Preis", "Price", DataType.NUMBER, must=True),
            ),
        ),
        _type(
            OBJECT_POSITION,
            ElementKind.APPLICATION_OBJECT,
            ("Position", "Position"),
            (
                "Die Position, die durch die Ausführung einer Order entsteht.",
                "The position that arises from the execution of an order.",
            ),
            (
                "Die offene Position, die aus einer ausgeführten Order entstanden ist.",
                "The open position that arose from an executed order.",
            ),
            properties=(
                _prop(
                    "Instrument",
                    "Instrument",
                    DataType.OBJECT,
                    must=True,
                    obj=INSTRUMENT_TYPE,
                ),
                _prop("Richtung", "Direction", DataType.CHOICE, must=True, choices=DIRECTIONS),
                number("Volumen", "Volume"),
                number("Einstiegspreis", "Entry price"),
                _prop("Stop-Loss", "Stop loss", DataType.NUMBER),
                _prop("Take-Profit", "Take profit", DataType.NUMBER),
                number("offener Gewinn oder Verlust", "Open profit or loss"),
            ),
        ),
        _type(
            OBJECT_STRATEGY,
            ElementKind.APPLICATION_OBJECT,
            ("Strategie", "Strategy"),
            (
                "Die eigene Strategie mit ihren Strategieparametern und Eigenschaften.",
                "The own strategy with its strategy parameters and properties.",
            ),
            (
                "Die eigene Strategie: ihre Strategieparameter, ihr Name und die Zahl der "
                "wartenden Orders und offenen Positionen.",
                "The own strategy: its strategy parameters, its name and the number of "
                "pending orders and open positions.",
            ),
            properties=(
                _prop("Strategie-ID", "Strategy ID", DataType.TEXT, must=True),
                _prop("Name", "Name", DataType.TEXT, must=True),
                _prop("Beschreibung", "Description", DataType.TEXT),
                _prop("wartende Orders", "Pending orders", DataType.INTEGER, must=True),
                _prop("offene Positionen", "Open positions", DataType.INTEGER, must=True),
            ),
            strategy_parameters=True,
        ),
    ]


def _turning_point_properties() -> tuple[PropertyDescription, ...]:
    """The properties of the ``ZigZag`` (specification 3.2): the price of the last and the
    one before the last final high and low, then Kurs, Art and ``endgültig`` of the three most
    recent turning points; ``wendepunkt_1_kurs`` is the price of the most recent one."""
    result: list[PropertyDescription] = [
        _prop("Letztes Hoch", "Last high", DataType.NUMBER),
        _prop("Vorletztes Hoch", "Second to last high", DataType.NUMBER),
        _prop("Letztes Tief", "Last low", DataType.NUMBER),
        _prop("Vorletztes Tief", "Second to last low", DataType.NUMBER),
    ]
    for number in range(1, _TURNING_POINTS + 1):
        result.extend(
            (
                _prop(
                    f"Wendepunkt {number} Kurs",
                    f"Turning point {number} price",
                    DataType.NUMBER,
                    tip=_turning_point_tip(number, "price"),
                ),
                _prop(
                    f"Wendepunkt {number} Art",
                    f"Turning point {number} kind",
                    DataType.CHOICE,
                    choices=TURNING_POINT_KINDS,
                    tip=_turning_point_tip(number, "kind"),
                ),
                _prop(
                    f"Wendepunkt {number} endgültig",
                    f"Turning point {number} final",
                    DataType.BOOLEAN,
                    tip=_turning_point_tip(number, "final"),
                ),
            )
        )
    return tuple(result)


def _zigzag_parameters() -> tuple[ParameterDescription, ...]:
    return (
        _instrument_parameter(),
        _time_unit_parameter(),
        _par("Depth", "Depth", DataType.INTEGER, default=12),
        _par("Deviation", "Deviation", DataType.INTEGER, default=5),
        _par("Backstep", "Backstep", DataType.INTEGER, default=3),
    )


def _indicators() -> list[TypeDescription]:
    value = (_prop("Wert", "Value", DataType.NUMBER, must=True),)
    return [
        _type(
            TYPE_INDICATOR,
            ElementKind.OBJECT_TYPE,
            ("eigener Indikator", "own indicator"),
            (
                "Ein vom Anwender angelegter Indikator aus Regeln, mitgelieferten Indikatoren "
                "oder beidem. Parameter und Eigenschaften legt der Anwender fest.",
                "An indicator created by the user from rules, delivered indicators or both. "
                "The user defines parameters and properties.",
            ),
            (
                "Ein Indikator, den Sie selbst aus Regeln oder anderen Indikatoren "
                "zusammenstellen.",
                "An indicator you put together yourself from rules or other indicators.",
            ),
            category=ObjectCategory.INDICATOR,
            parameters=(_instrument_parameter(), _time_unit_parameter()),
            on_canvas=True,
            can_refresh=True,
            group=Group.INDICATORS,
        ),
        _type(
            "EMA",
            ElementKind.OBJECT_TYPE,
            ("EMA", "EMA"),
            ("Exponentieller gleitender Durchschnitt.", "Exponential moving average."),
            (
                "Exponentieller gleitender Durchschnitt: eine geglättete Kurslinie, die sich "
                "neuen Kursen schnell anpasst.",
                "Exponential moving average: a smoothed price line that adapts quickly to new "
                "prices.",
            ),
            category=ObjectCategory.INDICATOR,
            parameters=(
                _instrument_parameter(),
                _time_unit_parameter(),
                _par("Periode", "Period", DataType.INTEGER, required=True),
                _par("Verschiebung", "Shift", DataType.INTEGER, default=0),
                _par(
                    "Anwenden auf",
                    "Apply to",
                    DataType.CHOICE,
                    default=identifier_from_name("Schlusskurs"),
                    choices=PRICE_SOURCES,
                ),
            ),
            properties=value,
            on_canvas=True,
            can_refresh=True,
            group=Group.INDICATORS,
        ),
        _type(
            "ATR",
            ElementKind.OBJECT_TYPE,
            ("ATR", "ATR"),
            (
                "Average True Range: durchschnittliche Schwankungsbreite einer Kerze.",
                "Average true range: average range of a candle.",
            ),
            (
                "Average True Range: die durchschnittliche Schwankungsbreite einer Kerze, "
                "geeignet für Abstände wie den Stop-Loss.",
                "Average True Range: the average range of a candle, suited for distances such "
                "as the stop loss.",
            ),
            category=ObjectCategory.INDICATOR,
            parameters=(
                _instrument_parameter(),
                _time_unit_parameter(),
                _par("Periode", "Period", DataType.INTEGER, required=True),
            ),
            properties=value,
            on_canvas=True,
            can_refresh=True,
            group=Group.INDICATORS,
        ),
        _type(
            "ZigZag",
            ElementKind.OBJECT_TYPE,
            ("ZigZag", "ZigZag"),
            (
                "Verbindet die wichtigen Hochs und Tiefs des Kurses und liefert die letzten "
                "Wendepunkte.",
                "Connects the important highs and lows of the price and delivers the latest "
                "turning points.",
            ),
            (
                "Verbindet die wichtigen Hochs und Tiefs des Kurses und liefert die letzten "
                "Wendepunkte.",
                "Connects the important highs and lows of the price and delivers the latest "
                "turning points.",
            ),
            category=ObjectCategory.INDICATOR,
            parameters=_zigzag_parameters(),
            properties=_turning_point_properties(),
            on_canvas=True,
            can_refresh=True,
            group=Group.INDICATORS,
        ),
    ]


def _general_object_types() -> list[TypeDescription]:
    return [
        _type(
            TYPE_TREND,
            ElementKind.OBJECT_TYPE,
            ("eigener Trend", "own trend"),
            (
                "Die Richtung einer Entwicklung innerhalb einer Zeiteinheit, ermittelt nach "
                "einem Berechnungsverfahren.",
                "The direction of a development within a time unit, determined by a "
                "calculation method.",
            ),
            (
                "Ein Trend, den Sie selbst festlegen: Ein Ausdruck bestimmt die Richtung.",
                "A trend you define yourself: an expression determines the direction.",
            ),
            category=ObjectCategory.TREND,
            parameters=(
                _instrument_parameter(),
                _time_unit_parameter(),
                _par(
                    "Berechnungsverfahren",
                    "Calculation method",
                    DataType.CHOICE,
                    required=True,
                    default=TREND_METHOD_EXPRESSION,
                    bindings=_FIXED_ONLY,
                ),
            ),
            properties=(
                _prop(
                    "Richtung",
                    "Direction",
                    DataType.TEXT,
                    must=True,
                    tip=(
                        "Die Richtung, die der Ausdruck bestimmt, zum Beispiel aufwärts oder "
                        "abwärts.",
                        "The direction determined by the expression, for example up or down.",
                    ),
                ),
            ),
            on_canvas=True,
            can_refresh=True,
            group=Group.TRENDS,
        ),
        _type(
            TREND_METHOD_EXPRESSION,
            ElementKind.TREND_METHOD,
            ("Ausdruck", "Expression"),
            (
                "Die Trendrichtung und weitere Eigenschaften ergeben sich aus Ausdrücken über "
                "enthaltene Instanzen von Indikatoren, Regeln und Regelwerken.",
                "The trend direction and further properties result from expressions over "
                "contained instances of indicators, rules and rulesets.",
            ),
            (
                "Sie legen die Richtung des Trends mit Bausteinen fest, auch aus Indikatoren, "
                "Regeln und Regelwerken, die der Trend enthält.",
                "You define the direction of the trend with blocks, also from indicators, "
                "rules and rule sets that the trend contains.",
            ),
        ),
        _type(
            TYPE_RULE,
            ElementKind.OBJECT_TYPE,
            ("eigene Regel", "own rule"),
            (
                "Bestimmt den Wert einer Eigenschaft einer Order oder prüft einen Sachverhalt.",
                "Determines the value of a property of an order or checks a fact.",
            ),
            (
                "Eine Regel, die einen Wert der Order bestimmt oder die Order prüft.",
                "A rule that determines a value of the order or checks the order.",
            ),
            category=ObjectCategory.RULE,
            group=Group.RULES,
        ),
        _type(
            TYPE_RULESET,
            ElementKind.OBJECT_TYPE,
            ("eigenes Regelwerk", "own rule set"),
            (
                "Eine geordnete Sammlung konfigurierter Regeln.",
                "An ordered collection of configured rules.",
            ),
            ("Mehrere Regeln in fester Reihenfolge.", "Several rules in a fixed order."),
            category=ObjectCategory.RULESET,
            group=Group.RULES,
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
