import { useTranslation } from 'react-i18next';

import { useStudio } from '../state/StudioContext';
import { ElementProperties } from './ElementProperties';
import { RuleProperties } from './RuleProperties';
import { StrategyProperties } from './StrategyProperties';

/**
 * The property view on the right (item 5 of the order): of the selected
 * element, of the selected rule, or, when nothing is selected, of the strategy.
 */
export function PropertiesPanel() {
  const { t } = useTranslation();
  const { selection } = useStudio();

  let content;
  if (selection.kind === 'elements') {
    const [first] = selection.ids;
    content =
      selection.ids.length === 1 && first !== undefined ? (
        <ElementProperties key={first} elementId={first} />
      ) : (
        <p className="properties-multiple">{t('properties.multiple', { count: selection.ids.length })}</p>
      );
  } else if (selection.kind === 'rule') {
    content = <RuleProperties key={JSON.stringify(selection.path)} path={selection.path} />;
  } else {
    content = <StrategyProperties />;
  }
  return (
    <aside className="studio-properties" aria-label={t('properties.panel')}>
      {content}
    </aside>
  );
}
