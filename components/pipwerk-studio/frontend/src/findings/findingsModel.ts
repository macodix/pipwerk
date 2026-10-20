import type { Finding, FindingLevel } from '../api/objects';

/** The findings of a check, ordered for the interface: which element has which, how many errors and hints. */
export type IndexedFindings = {
  all: readonly Finding[];
  errors: number;
  hints: number;
  /** Findings that belong to no element: they stand in the properties view of the strategy (specification 5.3). */
  general: readonly Finding[];
  ofElement: (id: string) => readonly Finding[];
  /** The worse level of the findings of an element: errors count before hints. */
  levelOfElement: (id: string) => FindingLevel | null;
};

const empty: readonly Finding[] = [];

export function indexFindings(findings: readonly Finding[] | null): IndexedFindings {
  const list = findings ?? empty;
  const byElement = new Map<string, Finding[]>();
  const general: Finding[] = [];
  let errors = 0;
  let hints = 0;
  for (const finding of list) {
    if (finding.level === 'error') {
      errors += 1;
    } else {
      hints += 1;
    }
    if (finding.element === null) {
      general.push(finding);
    } else {
      const own = byElement.get(finding.element) ?? [];
      own.push(finding);
      byElement.set(finding.element, own);
    }
  }
  return {
    all: list,
    errors,
    hints,
    general,
    ofElement: (id) => byElement.get(id) ?? empty,
    levelOfElement: (id) => {
      const own = byElement.get(id);
      if (own === undefined) {
        return null;
      }
      return own.some((finding) => finding.level === 'error') ? 'error' : 'hint';
    },
  };
}
