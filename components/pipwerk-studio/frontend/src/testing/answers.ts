import type { ExpressionAnswer } from '../api/objects';

/** An answer of the expression endpoint for the tests: everything that is not named is empty. */
export function answerOf(part: Partial<ExpressionAnswer> = {}): ExpressionAnswer {
  return {
    stored: '',
    display: '',
    sentence: '',
    blocks: null,
    blocksOmitted: false,
    tokens: [],
    findings: [],
    findingsTruncated: false,
    names: [],
    namesTruncated: false,
    ...part,
  };
}
