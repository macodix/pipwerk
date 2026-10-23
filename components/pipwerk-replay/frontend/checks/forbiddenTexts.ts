// What must not occur in pipwerk replay any more (order 14, acceptance criterion 2): the headings
// of the old view of the data stock and everything about an acquisition or a source. The Vitest
// test `noAcquisition.test.ts` searches the source and the translation files with these patterns,
// the browser test `e2e/texts.spec.ts` the built files.

/** The headings that the abnahme named as unsuitable (M2). */
export const REMOVED_HEADINGS = [
  'Was vorliegt',
  'Angaben zum Instrument je Broker',
  'Datei von Hand importieren',
  'Beschaffung von Hand anstoßen',
] as const;

/**
 * Anything about an acquisition or a source in the source code, the texts and the test tools.
 * (`acquired_at` of the contract data is the name of a field of the web API and no acquisition.)
 */
export const ACQUISITION_IN_SOURCE =
  /beschaff|acquisition|AcquireCard|acquire\.|standardquelle|default[-_ ]?source|fake_source|SOURCE_PORT|SOURCE_KEY|fetch_url|fetch_key/i;

/**
 * The same for the built files. They contain the code of libraries, in which words like
 * "acquire" occur, so only what the interface itself would contain is searched.
 */
export const ACQUISITION_IN_BUILD =
  /beschaff|standardquelle|default-source|market-data\/acquisitions|market-data\/overview|imports\/json|imports\/csv/i;

/** Texts of this view that point to an area "below" or "above". */
export const AREA_DIRECTIONS = /\b(unten|oben|below|above)\b/i;
