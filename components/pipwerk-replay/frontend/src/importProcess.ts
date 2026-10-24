// The run of an import (specification 5.3, 5.5): one import process in the backend, the files sent
// one after the other, each in a request of its own. There is no limit for the number or the total
// size of the files; the backend limits only the size of one file. The run can be cancelled: it then
// ends after the file that is being taken over, aborts the process and leaves the other files
// "not imported".
import { ApiError } from './http';
import {
  abortImportProcess,
  beginImportProcess,
  finishImportProcess,
  importProcessFile,
  previewFile,
  type FileHint,
  type FileOutcome,
  type ImportFile,
} from './marketDataApi';

/** How a request of a file failed (the network, the backend) or that its process has ended. */
export type Failure = { kind: 'request'; error: unknown } | { kind: 'ended' };

export type FileResult =
  | { kind: 'taken'; outcome: FileOutcome }
  | { kind: 'refused'; outcome: FileOutcome }
  | { kind: 'failed'; failure: Failure }
  | { kind: 'skipped' };

/** A file of the run; the time zone of the run is sent for the CSV files only. */
export type RunFile = ImportFile & { uid: number; format: 'json' | 'csv' };

export type RunParameters = {
  broker: string;
  timezone: string;
  files: RunFile[];
  /** Asked before each file: the user has cancelled. */
  isCancelled: () => boolean;
  /** The file is being taken over now. */
  onStart: (uid: number) => void;
  /** The file has its result. Called exactly once for every file. */
  onResult: (uid: number, result: FileResult) => void;
};

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

/**
 * Runs the import. Every file gets exactly one result: taken, refused (by the import), failed
 * (its request failed), or skipped (not imported: after a cancel or after a failure). A failed
 * request ends the run: the process cannot be trusted, so the others are not imported.
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
      const outcome = await whileBusy(
        () => importProcessFile(processId, run.broker, file.format === 'csv' ? run.timezone : '', file),
        run.isCancelled,
      );
      if (outcome === 'cancelled') {
        run.onResult(file.uid, { kind: 'skipped' });
        continue;
      }
      run.onResult(file.uid, outcome.refused ? { kind: 'refused', outcome } : { kind: 'taken', outcome });
    } catch (error) {
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

/** The hints of the files, one request per file, one after the other (the backend takes few at once). */
export async function readFiles(
  files: File[],
  onProgress: (done: number) => void,
  isCancelled: () => boolean,
): Promise<{ hints: FileHint[]; error: unknown }> {
  const hints: FileHint[] = [];
  for (const file of files) {
    if (isCancelled()) {
      break;
    }
    try {
      const hint = await whileBusy(() => previewFile(file), isCancelled);
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
