import type { Finding, FindingLevel } from '../api/objects';
import { getRule } from '../document/ops';
import type { RuleOwner, RulePath, StrategyDocument } from '../document/types';

/** The findings of the last check sorted to the places where the interface shows them (specification 5.4). */

export type FindingsIndex = {
  all: readonly Finding[];
  errors: number;
  hints: number;
  /** The worst level of the findings of an element. */
  severityOfElement(elementId: string): FindingLevel | null;
  /** The findings of an element that do not belong to one of its rules. */
  ofElement(document: StrategyDocument, elementId: string): Finding[];
  /** The findings without an element that do not belong to a rule of the strategy. */
  ofStrategy(document: StrategyDocument): Finding[];
  /** The findings of the rule or rule set at a path, including those of the rules inside a rule set. */
  ofRule(document: StrategyDocument, path: RulePath): Finding[];
  /** The findings of the rule itself, not of the rules inside it. */
  ofRuleItself(document: StrategyDocument, path: RulePath): Finding[];
};

const worse = (a: FindingLevel | null, b: FindingLevel): FindingLevel =>
  a === 'error' || b === 'error' ? 'error' : 'hint';

/** The names of the rules along a path, from the list of the owner inwards. */
export function ruleNames(document: StrategyDocument, path: RulePath): string[] | null {
  const names: string[] = [];
  for (let depth = 1; depth <= path.indices.length; depth += 1) {
    const rule = getRule(document, { owner: path.owner, indices: path.indices.slice(0, depth) });
    if (rule === undefined) {
      return null;
    }
    names.push(rule.name);
  }
  return names;
}

function ownerId(owner: RuleOwner): string | null {
  return owner.kind === 'element' ? owner.id : null;
}

function startsWithName(subject: string, name: string): boolean {
  return subject === name || subject.startsWith(`${name}.`);
}

export function indexFindings(findings: readonly Finding[] | null): FindingsIndex {
  const all = findings ?? [];
  const severity = new Map<string, FindingLevel>();
  for (const finding of all) {
    if (finding.element !== null) {
      severity.set(finding.element, worse(severity.get(finding.element) ?? null, finding.level));
    }
  }
  const ruleSubjects = (document: StrategyDocument, owner: RuleOwner): string[] =>
    (owner.kind === 'strategy'
      ? document.rules
      : (document.elements.find((element) => element.id === owner.id)?.rules ?? [])
    ).map((rule) => rule.name);

  const ofRuleWith = (document: StrategyDocument, path: RulePath, itself: boolean): Finding[] => {
    const names = ruleNames(document, path);
    if (names === null) {
      return [];
    }
    const subject = names.join('.');
    return all.filter((finding) => {
      if (finding.element !== ownerId(path.owner) || finding.subject === null) {
        return false;
      }
      return itself ? finding.subject === subject : startsWithName(finding.subject, subject);
    });
  };

  return {
    all,
    errors: all.filter((finding) => finding.level === 'error').length,
    hints: all.filter((finding) => finding.level === 'hint').length,
    severityOfElement: (elementId) => severity.get(elementId) ?? null,
    ofElement(document, elementId) {
      const rules = ruleSubjects(document, { kind: 'element', id: elementId });
      return all.filter(
        (finding) =>
          finding.element === elementId &&
          (finding.subject === null || !rules.some((name) => startsWithName(finding.subject ?? '', name))),
      );
    },
    ofStrategy(document) {
      const rules = ruleSubjects(document, { kind: 'strategy' });
      return all.filter(
        (finding) =>
          finding.element === null &&
          (finding.subject === null || !rules.some((name) => startsWithName(finding.subject ?? '', name))),
      );
    },
    ofRule: (document, path) => ofRuleWith(document, path, false),
    ofRuleItself: (document, path) => ofRuleWith(document, path, true),
  };
}
