// Descriptions of what an object delivers (req-ui-016): for every property and every method what the value says
// and what one uses it for in a strategy, in trader language, German and English. Key: object type and member.
// Sources: the domain model (docs/design/domain/fachmodell.md, indikator-markttechnik.md) where it names a purpose;
// the other sentences were written for the prototype (list in README.md, section "Entscheidungen zu Auftrag 06").
import type { Lang } from './model';

type Txt = { de: string; en: string };
const t = (de: string, en: string): Txt => ({ de, en });

export const MEMBER_TEXT: Record<string, Txt> = {
  // ---- Konto
  'Konto.kapital': t('Kontostand einschließlich der Gewinne und Verluste offener Positionen. Damit rechnen Sie zum Beispiel, wie viel Verlust Sie je Trade zulassen (Risiko als Anteil des Kapitals).', 'Account balance including the profits and losses of open positions. You use it to work out, for example, how much loss you allow per trade (risk as a share of the equity).'),
  'Konto.freie_margin': t('Das Geld, das für neue Positionen noch zur Verfügung steht. Damit prüfen Sie, ob für eine weitere Order noch Platz ist.', 'The money still available for new positions. You use it to check whether there is still room for another order.'),
  'Konto.waehrung': t('Die Währung des Kontos, in der Kapital, Gewinne und Verluste gerechnet werden. Sie brauchen sie, wenn Sie Geldbeträge mit Werten in einer anderen Währung vergleichen.', 'The currency of the account in which equity, profits and losses are calculated. You need it when you compare money amounts with values in another currency.'),
  // ---- Instrument
  'Instrument.bezeichnung': t('Der Name des Instruments, zum Beispiel EURUSD. Sie verwenden ihn, wenn die Strategie je nach Instrument anders handeln soll.', 'The name of the instrument, for example EURUSD. You use it when the strategy should act differently depending on the instrument.'),
  'Instrument.tickgroesse': t('Die kleinste Kursänderung des Instruments. Abstände wie Einstieg oder Stop-Loss legen Sie als Vielfaches davon fest, damit der Kurs gültig ist.', 'The smallest price change of the instrument. You set distances such as entry or stop loss as a multiple of it so that the price is valid.'),
  'Instrument.tickwert': t('Der Geldwert einer Kursänderung um einen Tick, in der Kontowährung. Damit rechnen Sie einen Kursabstand in einen Geldbetrag um, zum Beispiel für das Risiko einer Order.', 'The money value of a price change by one tick, in account currency. You use it to convert a price distance into an amount of money, for example for the risk of an order.'),
  'Instrument.punkt': t('Ein Punkt als Kursdifferenz. Sie geben damit Abstände in Punkten an, zum Beispiel die Mindestbewegung eines Wendepunkts, und rechnen sie in Kurs um.', 'One point as a price difference. You use it to give distances in points, for example the minimum move of a turning point, and convert them into price.'),
  'Instrument.pip': t('Ein Pip als Kursdifferenz, die unter Händlern übliche Einheit. Sie geben damit Puffer und Abstände an, zum Beispiel 3 Pip über Punkt 2 als Einstieg.', 'One pip as a price difference, the unit traders usually use. You use it to give buffers and distances, for example 3 pips above point 2 as entry.'),
  'Instrument.spread': t('Der Abstand zwischen Brief- und Geldkurs als Kursdifferenz. Sie schlagen ihn auf den Einstieg einer Kaufposition auf oder prüfen, ob er für den Handel zu groß ist.', 'The distance between ask and bid as a price difference. You add it to the entry of a buy position or check whether it is too large for trading.'),
  'Instrument.mindestvolumen': t('Das kleinste Volumen, das für das Instrument gehandelt werden darf. Damit prüfen Sie, ob das berechnete Volumen für eine Order ausreicht.', 'The smallest volume that may be traded for the instrument. You use it to check whether the calculated volume is enough for an order.'),
  'Instrument.volumenschritt': t('Die kleinste Stufe, in der sich das Volumen ändern lässt. Das berechnete Volumen runden Sie auf ein Vielfaches davon ab.', 'The smallest step in which the volume can change. You round the calculated volume down to a multiple of it.'),
  // ---- Kerze
  'Kerze.eroeffnung': t('Der Eröffnungskurs der letzten abgeschlossenen Kerze. Sie vergleichen ihn mit dem Schluss, um zu sehen, ob die Kerze gestiegen oder gefallen ist.', 'The open of the last completed candle. You compare it with the close to see whether the candle rose or fell.'),
  'Kerze.hoch': t('Der Höchstkurs der letzten abgeschlossenen Kerze. Er dient zum Beispiel als Marke für einen Einstieg bei einem Ausbruch nach oben.', 'The high of the last completed candle. It serves, for example, as the mark for an entry on a breakout upwards.'),
  'Kerze.tief': t('Der Tiefstkurs der letzten abgeschlossenen Kerze. Er dient zum Beispiel als Marke für einen Stop-Loss unter der Kerze.', 'The low of the last completed candle. It serves, for example, as the mark for a stop loss below the candle.'),
  'Kerze.schluss': t('Der Schlusskurs der letzten abgeschlossenen Kerze, der am häufigsten verwendete Kurs. Sie vergleichen ihn mit einem Indikator oder rechnen Abstände von ihm aus, zum Beispiel den Stop-Loss.', 'The close of the last completed candle, the most used price. You compare it with an indicator or work out distances from it, for example the stop loss.'),
  'Kerze.volumen': t('Der Handelsumfang der letzten abgeschlossenen Kerze. Sie prüfen damit, ob an einer Kursbewegung viel gehandelt wurde.', 'The trading volume of the last completed candle. You use it to check whether a lot was traded in a price move.'),
  'Kerze.zeitpunkt': t('Der Zeitpunkt der letzten abgeschlossenen Kerze. Sie verwenden ihn für zeitabhängige Bedingungen, zum Beispiel nur zu bestimmten Tageszeiten zu handeln.', 'The time of the last completed candle. You use it for time-dependent conditions, for example to trade only at certain times of day.'),
  // ---- Tick
  'Tick.geld': t('Der aktuelle Kurs, zu dem Sie verkaufen können. Sie prüfen damit zum Beispiel, ob der Kurs den Stop einer Kaufposition erreicht hat.', 'The current price at which you can sell. You use it, for example, to check whether the price has reached the stop of a buy position.'),
  'Tick.brief': t('Der aktuelle Kurs, zu dem Sie kaufen können. Sie prüfen damit zum Beispiel, ob der Kurs den Stop einer Verkaufsposition erreicht hat.', 'The current price at which you can buy. You use it, for example, to check whether the price has reached the stop of a sell position.'),
  'Tick.zeitpunkt': t('Der Zeitpunkt des letzten Ticks. Sie verwenden ihn für zeitabhängige Bedingungen, zum Beispiel wie lange der letzte Kurs zurückliegt.', 'The time of the last tick. You use it for time-dependent conditions, for example how long ago the last price was.'),
  // ---- Order
  'Order.order_id': t('Die Kennung, unter der die Order beim Broker bekannt ist. Sie erkennen damit genau diese Order wieder, zum Beispiel in der Verwaltung.', 'The identifier under which the order is kept. You use it to recognise exactly this order, for example in the management.'),
  'Order.status': t('Der Stand der Order: wartend, teilausgeführt, ausgeführt, gelöscht, abgelaufen oder abgelehnt. Die Verwaltung prüft damit, ob die Order noch wartet oder schon zur Position geworden ist.', 'The state of the order: pending, partially filled, filled, deleted, expired or rejected. The management uses it to check whether the order still waits or has already become a position.'),
  'Order.konto': t('Das Konto, auf dem die Order läuft. Sie setzen damit Werte der Order mit Werten des Kontos in Beziehung.', 'The account on which the order runs. You use it to relate values of the order to values of the account.'),
  'Order.strategie_id': t('Die Kennung der Strategie, die die Order gestellt hat. Daran erkennen Sie, welche Orders zu dieser Strategie gehören.', 'The identifier of the strategy that placed the order. It tells you which orders belong to this strategy.'),
  'Order.bemerkung': t('Ein freier Text zur Order, nur zur Information. Er ändert nichts am Handel.', 'A free text about the order, for information only. It changes nothing about the trade.'),
  'Order.instrument': t('Das Instrument, auf dem die Order gestellt wird. Sie lesen daraus zum Beispiel Spread und Pip des Instruments der Order.', 'The instrument on which the order is placed. You read from it, for example, spread and pip of the instrument of the order.'),
  'Order.richtung': t('buy (Kauf) oder sell (Verkauf). Damit wählen Sie Rechnungen für Kauf und Verkauf, zum Beispiel den Stop-Loss unter oder über dem Kurs.', 'buy or sell. You use it to choose calculations for buying and selling, for example the stop loss below or above the price.'),
  'Order.volumen': t('Die Menge, die gehandelt wird. Sie prüfen es gegen das Mindestvolumen oder rechnen damit das Risiko der Order.', 'The quantity that is traded. You check it against the minimum volume or use it to work out the risk of the order.'),
  'Order.preis': t('Der Preis der Order. Bei wartenden Orders ist es der Preis, bei dem sie ausgelöst wird. Daraus rechnen Sie Abstände zu Stop-Loss und Take-Profit.', 'The price of the order. For pending orders it is the price at which the order triggers. You work out distances to stop loss and take profit from it.'),
  'Order.limitpreis': t('Bei der Stop-Limit-Order der Preis, zu dem die Order nach dem Auslösen gestellt wird. Sie rechnen ihn aus dem Auslösepreis und einem Puffer.', 'For the stop limit order the price at which the order is placed after it triggers. You work it out from the trigger price and a buffer.'),
  'Order.stop_loss': t('Der Kurs, bei dem die Position mit Verlust geschlossen wird. Sie vergleichen ihn mit einem neu berechneten Stop-Loss, um ihn nur zu verbessern.', 'The price at which the position is closed at a loss. You compare it with a newly calculated stop loss to improve it only.'),
  'Order.take_profit': t('Der Kurs, bei dem die Position mit Gewinn geschlossen wird. Sie rechnen ihn aus dem Einstieg und dem Abstand zum Stop-Loss.', 'The price at which the position is closed at a profit. You work it out from the entry and the distance to the stop loss.'),
  'Order.gueltigkeit': t('Wie lange eine wartende Order gilt, wenn sie nicht ausgeführt wird. Sie prüfen damit, ob die Order von selbst ausläuft.', 'How long a pending order stays valid if it is not executed. You use it to check whether the order expires by itself.'),
  // ---- Position
  'Position.instrument': t('Das Instrument, auf dem die Position gehalten wird. Sie lesen daraus zum Beispiel Pip und Tickwert für Berechnungen an der Position.', 'The instrument on which the position is held. You read from it, for example, pip and tick value for calculations on the position.'),
  'Position.richtung': t('buy (Kauf) oder sell (Verkauf). Damit unterscheiden Sie Kauf- und Verkaufsposition, zum Beispiel beim Nachziehen des Stop-Loss.', 'buy or sell. You use it to tell a buy position from a sell position, for example when trailing the stop loss.'),
  'Position.volumen': t('Die Menge, die die Position hält. Sie verwenden sie, um die Position ganz oder zum Teil zu schließen.', 'The quantity the position holds. You use it to close the position completely or in part.'),
  'Position.einstiegspreis': t('Der Preis, zu dem die Position eröffnet wurde. Sie messen daran, wie weit der Kurs gelaufen ist, zum Beispiel für ein Nachziehen des Stop-Loss.', 'The price at which the position was opened. You use it to measure how far the price has moved, for example to trail the stop loss.'),
  'Position.stop_loss': t('Der Kurs, bei dem die Position mit Verlust geschlossen wird. Sie vergleichen ihn mit einem neu berechneten Stop-Loss, um ihn nur zu verbessern.', 'The price at which the position is closed at a loss. You compare it with a newly calculated stop loss to improve it only.'),
  'Position.take_profit': t('Der Kurs, bei dem die Position mit Gewinn geschlossen wird. Sie prüfen damit, ob ein Ziel gesetzt ist, oder ändern es.', 'The price at which the position is closed at a profit. You use it to check whether a target is set, or to change it.'),
  'Position.offener_gewinn_oder_verlust': t('Der Gewinn oder Verlust der Position beim aktuellen Kurs. Sie prüfen damit, ob die Position schon im Plus liegt, bevor Sie den Stop-Loss nachziehen.', 'The profit or loss of the position at the current price. You use it to check whether the position is already in profit before you trail the stop loss.'),
  // ---- Strategie
  'Strategie.bezeichnung': t('Der Name der Strategie. Sie verwenden ihn für Anzeigen und Vergleiche, er ändert nichts am Handel.', 'The name of the strategy. You use it for displays and comparisons, it changes nothing about the trade.'),
  'Strategie.beschreibung': t('Die freie Beschreibung der Strategie, nur zur Information.', 'The free description of the strategy, for information only.'),
  'Strategie.wartende_orders': t('Die Anzahl der Orders, die diese Strategie gestellt hat und die noch warten. Nur bei der Ausführung belegt. Sie prüfen damit, ob schon eine Order wartet, bevor eine neue gestellt wird.', 'The number of orders this strategy has placed that are still waiting. Only set during execution. You use it to check whether an order is already waiting before a new one is placed.'),
  'Strategie.offene_positionen': t('Die Anzahl der Positionen, die diese Strategie eröffnet hat und die noch offen sind. Nur bei der Ausführung belegt. Sie prüfen damit, ob schon eine Position läuft, bevor eine neue Order gestellt wird.', 'The number of positions this strategy has opened that are still open. Only set during execution. You use it to check whether a position is already running before a new order is placed.'),
  // ---- Indikatoren
  'EMA.wert': t('Der aktuelle Wert des exponentiellen gleitenden Durchschnitts: eine geglättete Kurslinie, die neuen Kursen schnell folgt. Sie vergleichen ihn mit dem Kurs oder mit einem zweiten EMA, zum Beispiel um einen Trend zu erkennen oder auf das Kreuzen zweier EMA zu reagieren.', 'The current value of the exponential moving average: a smoothed price line that follows new prices quickly. You compare it with the price or with a second EMA, for example to recognise a trend or to react when two EMA cross.'),
  'EMA.wert_vor': t('Der Wert des EMA vor der gewählten Anzahl Kerzen. Sie vergleichen ihn mit dem aktuellen Wert, um zu sehen, ob die Linie steigt oder fällt.', 'The value of the EMA the chosen number of candles ago. You compare it with the current value to see whether the line rises or falls.'),
  'ATR.wert': t('Die durchschnittliche Schwankungsbreite einer Kerze über die gewählte Periode, als Kursabstand. Sie verwenden sie für Abstände, die sich der Marktlage anpassen, zum Beispiel den Stop-Loss als Vielfaches des ATR.', 'The average range of a candle over the chosen period, as a price distance. You use it for distances that adapt to the market, for example the stop loss as a multiple of the ATR.'),
  'ATR.wert_vor': t('Der Wert des ATR vor der gewählten Anzahl Kerzen. Sie vergleichen ihn mit dem aktuellen Wert, um zu sehen, ob der Markt unruhiger oder ruhiger wird.', 'The value of the ATR the chosen number of candles ago. You compare it with the current value to see whether the market is getting more or less volatile.'),
  // ---- Trends
  'Markttechnik.trendrichtung': t('aufwärts, abwärts oder kein Trend, nach der Markttechnik aus den Wendepunkten bestimmt. Sie handeln nur in Trendrichtung und legen damit die Richtung der Order fest.', 'upwards, downwards or no trend, determined by the market technique from the turning points. You trade only in the direction of the trend and set the direction of the order with it.'),
  'Markttechnik.trend_intakt': t('Ja, solange der Kurs nicht unter den letzten Punkt 1/3 gefallen ist (beim Abwärtstrend darüber). Sie handeln nur, solange der Trend intakt ist.', 'Yes as long as the price has not fallen below the last point 1/3 (above it for a downtrend). You trade only while the trend is intact.'),
  'Markttechnik.phase': t('Bewegung: der Kurs läuft mit dem Trend. Korrektur: der Kurs läuft zurück. Sie steigen zum Beispiel nur in der Bewegung ein.', 'Movement: the price runs with the trend. Correction: the price retraces. You enter, for example, only during the movement.'),
  'Markttechnik.punkt_2': t('Das jüngste Hoch des Trends (beim Abwärtstrend das jüngste Tief). Sie setzen daran den Einstieg, zum Beispiel mit einer Stop-Order knapp darüber.', 'The most recent high of the trend (the most recent low for a downtrend). You set the entry there, for example with a stop order just above it.'),
  'Markttechnik.punkt_13': t('Das jüngste Korrekturtief des Trends (beim Abwärtstrend das jüngste Korrekturhoch). Sie setzen daran den Stop-Loss.', 'The most recent correction low of the trend (correction high for a downtrend). You set the stop loss there.'),
  'Markttechnik.punkt_13_endgueltig': t('Ja, wenn dieser Wendepunkt sich nicht mehr verschiebt. Sie verlassen sich nur auf einen endgültigen Punkt, wenn Sie den Stop-Loss festlegen.', 'Yes if this turning point does not move any more. You rely on the point only when it is final, when you set the stop loss.'),
  'Trend.richtung': t('Die Richtung, die Ihr Ausdruck bestimmt, zum Beispiel aufwärts oder abwärts. Bedingungen und Berechnungen verwenden sie, um nur in Trendrichtung zu handeln.', 'The direction that your expression determines, for example up or down. Conditions and calculations use it to trade only in the direction of the trend.'),
  // ---- Ergebnisse von Elementen und Regeln
  'flow.condition.ergebnis': t('Ob die Bedingung erfüllt ist: wahr oder falsch. Spätere Schritte können das Ergebnis in ihren Bausteinen verwenden, zum Beispiel um etwas nur dann zu rechnen.', 'Whether the condition is met: true or false. Later steps can use the result in their blocks, for example to calculate something only then.'),
  'flow.calculation.ergebnis': t('Der berechnete Wert. Spätere Schritte verwenden ihn, zum Beispiel die Order für Stop-Loss oder Richtung.', 'The calculated value. Later steps use it, for example the order for stop loss or direction.'),
  'Regel.ergebnis': t('Ob die Regel erfüllt ist: ja oder nein. Andere Regeln und das Regelwerk können es verwenden.', 'Whether the rule is met: yes or no. Other rules and the rule set can use it.'),
  'Regelwerk.ergebnis': t('Ob alle Regeln des Regelwerks erfüllt sind: ja oder nein. Sie verwenden das Gesamtergebnis, um eine Order nur bei bestandener Prüfung zu stellen.', 'Whether all rules of the rule set are met: yes or no. You use the total result to place an order only if the check is passed.'),
};

/** Nominative and genitive of the turning points in German, the English name. */
const ZZ_NAMES: Record<string, { nom: string; gen: string; en: string }> = {
  '1': { nom: 'letzte Wendepunkt', gen: 'letzten Wendepunkts', en: 'latest turning point' },
  '2': { nom: 'vorletzte Wendepunkt', gen: 'vorletzten Wendepunkts', en: 'second latest turning point' },
  '3': { nom: 'drittletzte Wendepunkt', gen: 'drittletzten Wendepunkts', en: 'third latest turning point' },
};

/** ZigZag: three turning points with price, high or low, and final or not. */
function zigzag(id: string): Txt | undefined {
  const m = /^wp(\d)_(kurs|art|endgueltig)$/.exec(id);
  if (!m) return undefined;
  const n = ZZ_NAMES[m[1]];
  if (!n) return undefined;
  if (m[2] === 'kurs') {
    return t(`Der Kurs des ${n.gen}. Sie verwenden ihn als Marke, zum Beispiel für einen Einstieg oder einen Stop-Loss an einem Hoch oder Tief.`, `The price of the ${n.en}. You use it as a mark, for example for an entry or a stop loss at a high or low.`);
  }
  if (m[2] === 'art') {
    return t(`Ob der ${n.nom} ein Hoch oder ein Tief ist. Sie unterscheiden damit, ob der Kurs dort nach oben oder nach unten gedreht hat.`, `Whether the ${n.en} is a high or a low. You use it to tell whether the price turned up or down there.`);
  }
  return t(`Ja, wenn der ${n.nom} sich nicht mehr verschiebt; der jüngste ist vorläufig. Sie verlassen sich bei Entscheidungen nur auf endgültige Punkte.`, `Yes if the ${n.en} does not move any more; the latest one is provisional. You rely only on final points for decisions.`);
}

/** Generic sentence for a value the user defines in an own indicator or trend. */
const OWN: Txt = t('Ein Wert, den Sie in diesem Indikator oder Trend selbst festgelegt haben. Andere Elemente verwenden ihn wie jeden anderen Wert, zum Beispiel in einer Bedingung.', 'A value you defined yourself in this indicator or trend. Other elements use it like any other value, for example in a condition.');

/** The description of a member of an object type, or undefined. */
export function memberText(type: string, id: string, lang: Lang): string | undefined {
  const own = id.startsWith('own:');
  const found = MEMBER_TEXT[`${type}.${id}`] ?? (type === 'ZigZag' ? zigzag(id) : undefined) ?? (own ? OWN : undefined);
  return found ? (lang === 'en' ? found.en : found.de) : undefined;
}
