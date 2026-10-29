import { useTranslation } from 'react-i18next';

import type { TypeDescription } from '../api/elementTypes';
import type { CardRow } from '../model/elements';
import { dataTypeWord, labelText } from '../model/typeIndex';
import { useStudio } from '../state/StudioContext';
import { Icon } from '../ui/Icon';

/**
 * The properties and methods an object supplies (specification 5.4): per entry the name, the data type or "Methode", the
 * possible values, a description in trader language that is always visible, the arguments of a method and the elements
 * that use the value.
 */
export function SuppliedList({
  rows,
  type,
  users,
}: {
  rows: readonly CardRow[];
  type: TypeDescription;
  /** The names of the elements that use an entry, by the identifier of the entry. */
  users?: ReadonlyMap<string, string[]>;
}) {
  const { t } = useTranslation();
  const { studio, types } = useStudio();
  const language = studio.language;
  return (
    <ul className="prop-list">
      {rows.map((property) => {
        const names = users?.get(property.id);
        const method = property.method ? type.methods.find((candidate) => candidate.id === property.id) : undefined;
        return (
          <li
            key={`${property.method ? 'm' : 'p'}:${property.id}`}
            className="prop-row"
            data-tip={property.explanation === '' ? undefined : property.explanation}
            data-testid="prop-row"
            data-kind={property.method ? 'method' : 'property'}
          >
            <span className="prop-name">{property.label}</span>
            {property.method ? <span className="dtype-chip">{t('properties.method')}</span> : null}
            {property.choices.length > 0 ? (
              <span className="prop-values" data-testid="prop-values">
                {property.choices.map((choice) => labelText(choice.label, language)).join(' · ')}
              </span>
            ) : null}
            {names !== undefined ? (
              <span className="prop-used">
                <Icon name="link" size={12} />
                {names.join(', ')}
              </span>
            ) : null}
            <span className="prop-desc" data-testid="prop-desc">
              {t(property.method ? 'properties.resultIs' : 'properties.valueIs', {
                word: dataTypeWord(types, property.datatype, language, { specific: property.datatypeLabel, objectType: property.objectType }),
              })}
              {property.explanation === '' ? '' : ` ${property.explanation}`}
            </span>
            {method !== undefined && method.arguments.length > 0 ? (
              <ul className="prop-args" data-testid="prop-args">
                {method.arguments.map((argument) => (
                  <li key={argument.id}>
                    <b>{labelText(argument.label, language)}</b>
                    {argument.required ? '' : ` (${t('used.optional')})`}
                    {labelText(argument.explanation, language) === '' ? '' : `: ${labelText(argument.explanation, language)}`}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
