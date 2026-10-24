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

// Order 17 (acceptance report, attempt 2, M3): the user chooses any number of files, and there is
// no limit for their number or their total size. Only the size and the rows of ONE file are
// limited, and a text may name that limit. No text of the interface, no message and no text of the
// user documentation says that there are too many files, that the files are too large together,
// or asks to import fewer files.

/**
 * A text that speaks of a limit for the number or the total size of the files, German and English.
 * "Es gibt keine Grenze für die Zahl der Dateien" does not match: it names no limit.
 */
export const TOTAL_LIMIT_TEXT =
  /zu viele Dateien|weniger Dateien|zusammen (größer|zu groß)|Gesamtgröße (ist|darf|von)|(bis zu|höchstens|maximal) \d+ Dateien|too many files|fewer files|(larger|too large) together|total size (is|of|must)|(at most|up to|maximum of) \d+ files/i;

/** Code words of the removed limits (the backend has no such entry any more either). */
export const TOTAL_LIMIT_NAMES = /max_files_per_import|max_import_bytes|batch_too_large|too_many_files|BATCH_ERROR/;
