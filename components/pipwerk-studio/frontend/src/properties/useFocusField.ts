import { useEffect } from 'react';

import { useStudio } from '../state/StudioContext';

/**
 * After a click on a finding, or on "Zurück zu …" from the strategy parameters, the field is scrolled into view and
 * highlighted.
 */
export function useFocusField(root: React.RefObject<HTMLElement | null>): void {
  const { studio } = useStudio();
  const focus = studio.state.focusField;
  useEffect(() => {
    if (focus === null || root.current === null) {
      return;
    }
    const target = root.current.querySelector<HTMLElement>(`[data-field="${CSS.escape(focus.field)}"]`);
    if (target === null) {
      return;
    }
    target.scrollIntoView({ block: 'center' });
    target.classList.add('flash');
    // a finding in an expression leads to the spot in the formula, which takes the focus itself
    if (focus.place === null) {
      target.querySelector<HTMLElement>('select, input, textarea, button')?.focus({ preventScroll: true });
    }
    const timer = window.setTimeout(() => {
      target.classList.remove('flash');
    }, 1800);
    return () => {
      window.clearTimeout(timer);
    };
  }, [focus, root]);
}
