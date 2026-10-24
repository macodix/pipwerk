// The run of an import (specification 5.3, 5.5, 5.6): one import process in the backend, the files
// sent one after the other, each in a request of its own. A file is either uploaded (its content
// goes in the form, with `keep`) or lies in the import directory of the backend (its path goes in
// the request, nothing is copied). No limit applies to how many files a process has or how large
// they are in all; the backend limits only the size of one file. The run can be cancelled: it
// then ends after the file that is being taken over, aborts the process and leaves the other
// files "not imported".
import { ApiError } from './http';
import {
  abortImportProcess,
  beginImportProcess,
  finishImportProcess,
  importProcessDirectoryFile,
  importProcessFile,
  previewDirectoryFile,
  previewFile,
  type FileHint,
  type FileOutcome,
} from './marketDataApi';

/**
 * Why the request of one file was refused although the process goes on: the file cannot be kept
 * (no storage directory, or it cannot be written), or a file of the import directory cannot be
 * read (gone, path not allowed, import directory not set or not readable).
 */
export type FileReason =
  | 'keep_no_directory'
  | 'keep_failed'
  | 'not_found'
  | 'path_refused'
  | 'import_directory_unavailable';

/**
 * How a request of a file failed (the network, the backend), that its process has ended, or why
 * the one file was refused by the request (the process goes on with the next file).
 */
export type Failure = { kind: 'request'; error: unknown } | { kind: 'ended' } | { kind: 'file'; reason: FileReason };

export type FileResult =
  | { kind: 'taken'; outcome: FileOutcome }
  | { kind: 'refused'; outcome: FileOutcome }
  /** The request failed and stops the run. */
  | { kind: 'failed'; failure: Failure }
  /** The request of this file was refused; the run goes on. */
  | { kind: 'refusedRequest'; failure: Failure }
  | { kind: 'skipped' };

/** Where a file comes from: uploaded from the computer of the user, or read in the import directory. */
export type RunSource = { kind: 'upload'; file: File } | { kind: 'directory'; path: string };

/** A file of the run; the time zone of the run is sent for the CSV files only. */
export type RunFile = {
  uid: number;
  format: 'json' | 'csv';
  source: RunSource;
  /** What the user says about the file (empty: nothing). */
  instrument: string;
  data: string;
};

export type RunParameters = {
  broker: string;
  timezone: string;
  /** "Dateien behalten": sent with every uploaded file; a file of the import directory is never kept. */
  keep: boolean;
  files: RunFile[];
  /** Asked before each file: the user has cancelled. */
  isCancelled: () => boolean;
  /** The file is being taken over now. */
  onStart: (uid: number) => void;
  /** The file has its result. Called exactly once for every file. */
  onResult: (uid: number, result: FileResult) => void;
};

function detailOf(error: ApiError): string {
  const body: unknown = error.body;
  if (typeof body === 'object' && body !== null && 'detail' in body && typeof body.detail === 'string') {
    return body.detail;
  }
  return '';
}

/** Whether the 422 of a request names the path (location `path`). */
function namesPath(error: ApiError): boolean {
  const body: unknown = error.body;
  if (typeof body !== 'object' || body === null || !('errors' in body) || !Array.isArray(body.errors)) {
    return false;
  }
  return (body.errors as unknown[]).some((entry) => {
    if (typeof entry !== 'object' || entry === null || !('location' in entry) || !Array.isArray(entry.location)) {
      return false;
    }
    return entry.location[0] === 'path';
  });
}

/**
 * The reason the request of one file was refused although the process is fine, or `null` for any
 * other failure. The backend answers with fixed texts: HTTP 409 for an upload with `keep` means
 * that there is no storage directory, HTTP 503 with "could not be kept" that it could not be
 * written; for a file of the import directory HTTP 404 "no such file or directory", 422 with
 * location `path` and 409 "import directory".
 */
export function fileReasonOf(error: unknown, source: RunSource, keep: boolean): FileReason | null {
  if (!(error instanceof ApiError)) {
    return null;
  }
  const detail = detailOf(error);
  if (source.kind === 'upload') {
    if (!keep) {
      return null;
    }
    if (error.status === 409) {
      return 'keep_no_directory';
    }
    if (error.status === 503 && /could not be kept/.test(detail)) {
      return 'keep_failed';
    }
    return null;
  }
  if (error.status === 404 && /no such file or directory/.test(detail)) {
    return 'not_found';
  }
  if (error.status === 422 && namesPath(error)) {
    return 'path_refused';
  }
  if (error.status === 409 && /import directory/.test(detail)) {
    return 'import_directory_unavailable';
  }
  return null;
}

/** What the backend says about a request of an ended process: it does not know it (HTTP 404). */
function failureOf(error: unknown): Failure {
  return error instanceof ApiError && error.status === 404 ? { kind: 'ended' } : { kind: 'request', error };
}

/** The pause before a request is sent again that the backend answered with 429, and the number of tries. */
export const busy = { pauseMs: 1500, tries: 40 };

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Sends a request again when the backend is busy (HTTP 429: it takes over a few files at a time
 * and the others are being taken over, for example for a second window). The process stays; the
 * file is sent later.
 * Returns `'cancelled'` if the user cancelled while waiting.
 */
export async function whileBusy<T>(send: () => Promise<T>, isCancelled: () => boolean): Promise<T | 'cancelled'> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await send();
    } catch (error) {
      const isBusy = error instanceof ApiError && error.status === 429;
      if (!isBusy || attempt >= busy.tries) {
        throw error;
      }
    }
    await pause(busy.pauseMs);
    if (isCancelled()) {
      return 'cancelled';
    }
  }
}

export type RunEnd = {
  /** The user cancelled, so the process was aborted (the abort is tried, it may be too late). */
  cancelled: boolean;
  /** The request that failed and stopped the run, if one did. */
  failure: Failure | null;
};

function sendFile(processId: string, run: RunParameters, file: RunFile): Promise<FileOutcome | 'cancelled'> {
  const timezone = file.format === 'csv' ? run.timezone : '';
  const source = file.source;
  return whileBusy(
    () =>
      source.kind === 'upload'
        ? importProcessFile(
            processId,
            run.broker,
            timezone,
            { file: source.file, instrument: file.instrument, data: file.data },
            run.keep,
          )
        : importProcessDirectoryFile(processId, run.broker, timezone, {
            path: source.path,
            instrument: file.instrument,
            data: file.data,
          }),
    run.isCancelled,
  );
}

/**
 * Runs the import. Every file gets exactly one result: taken, refused (by the import or because
 * the request for this one file was refused), failed (its request failed), or skipped (not
 * imported: after a cancel or after a failure). A failed request ends the run: the process cannot
 * be trusted, so the others are not imported. A request that is refused for its file alone (the
 * file cannot be kept, a file of the import directory is gone) does not.
 */
export async function runImportProcess(run: RunParameters): Promise<RunEnd> {
  const skipAll = (from: number): void => {
    for (const file of run.files.slice(from)) {
      run.onResult(file.uid, { kind: 'skipped' });
    }
  };

  let processId: string;
  try {
    processId = (await beginImportProcess()).id;
  } catch (error) {
    skipAll(0);
    return { cancelled: false, failure: failureOf(error) };
  }

  let failure: Failure | null = null;
  for (const [index, file] of run.files.entries()) {
    if (failure !== null || run.isCancelled()) {
      skipAll(index);
      break;
    }
    run.onStart(file.uid);
    try {
      const outcome = await sendFile(processId, run, file);
      if (outcome === 'cancelled') {
        run.onResult(file.uid, { kind: 'skipped' });
        continue;
      }
      run.onResult(file.uid, outcome.refused ? { kind: 'refused', outcome } : { kind: 'taken', outcome });
    } catch (error) {
      const reason = fileReasonOf(error, file.source, run.keep);
      if (reason !== null) {
        run.onResult(file.uid, { kind: 'refusedRequest', failure: { kind: 'file', reason } });
        continue;
      }
      failure = failureOf(error);
      run.onResult(file.uid, { kind: 'failed', failure });
    }
  }

  const cancelled = run.isCancelled();
  try {
    if (cancelled || failure !== null) {
      await abortImportProcess(processId);
    } else {
      await finishImportProcess(processId);
    }
  } catch {
    // The process has ended already (time) or cannot be reached; the backend ends it by itself.
  }
  return { cancelled, failure };
}

async function readHints<T>(
  sources: T[],
  preview: (source: T) => Promise<FileHint>,
  onProgress: (done: number) => void,
  isCancelled: () => boolean,
): Promise<{ hints: FileHint[]; error: unknown }> {
  const hints: FileHint[] = [];
  for (const source of sources) {
    if (isCancelled()) {
      break;
    }
    try {
      const hint = await whileBusy(() => preview(source), isCancelled);
      if (hint === 'cancelled') {
        break;
      }
      hints.push(hint);
    } catch (error) {
      return { hints, error };
    }
    onProgress(hints.length);
  }
  return { hints, error: null };
}

/** The hints of the files, one request per file, one after the other (the backend takes few at once). */
export function readFiles(
  files: File[],
  onProgress: (done: number) => void,
  isCancelled: () => boolean,
): Promise<{ hints: FileHint[]; error: unknown }> {
  return readHints(files, (file) => previewFile(file), onProgress, isCancelled);
}

/** The same for files of the import directory, by their paths relative to it. */
export function readDirectoryFiles(
  paths: string[],
  onProgress: (done: number) => void,
  isCancelled: () => boolean,
): Promise<{ hints: FileHint[]; error: unknown }> {
  return readHints(paths, (path) => previewDirectoryFile(path), onProgress, isCancelled);
}
