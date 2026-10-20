import {
  expectArray,
  expectBoolean,
  expectNullableString,
  expectRecord,
  expectString,
  HttpError,
  isRecord,
  requestJson,
} from './http';

export type ObjectDirectory = {
  /** Absolute path, or `null` if nothing is stored and no standard can be determined. */
  path: string | null;
  isDefault: boolean;
};

export function parseObjectDirectory(value: unknown): ObjectDirectory {
  const record = expectRecord(value, 'object directory');
  return {
    path: expectNullableString(record.path, 'path'),
    isDefault: expectBoolean(record.is_default, 'is_default'),
  };
}

export async function fetchObjectDirectory(signal?: AbortSignal): Promise<ObjectDirectory> {
  return parseObjectDirectory(await requestJson('/api/studio/settings/object-directory', { signal }));
}

/** Stores the object directory; with `move` the backend moves the object files to the new directory first. */
export async function updateObjectDirectory(
  path: string,
  move: boolean,
  signal?: AbortSignal,
): Promise<ObjectDirectory> {
  return parseObjectDirectory(
    await requestJson('/api/studio/settings/object-directory', {
      method: 'PUT',
      body: { path, move },
      signal,
    }),
  );
}

/** What the backend reports when moving the files and bringing them back both failed. */
export type MoveFailure = {
  sourceDirectory: string;
  targetDirectory: string;
  files: string[];
};

/** The cause of a failed request to the backend as far as the answer names it. */
export type ErrorCause = {
  status: number | null;
  moveFailure: MoveFailure | null;
};

/** The directories and files of a failed move: in the data of the answer (`params`), or in the answer itself. */
function moveFailureOf(source: unknown): MoveFailure | null {
  if (
    isRecord(source) &&
    typeof source.source_directory === 'string' &&
    typeof source.target_directory === 'string' &&
    Array.isArray(source.files)
  ) {
    try {
      return {
        sourceDirectory: expectString(source.source_directory, 'source_directory'),
        targetDirectory: expectString(source.target_directory, 'target_directory'),
        files: expectArray(source.files, 'files').map((file) => expectString(file, 'file')),
      };
    } catch {
      return null;
    }
  }
  return null;
}

export function causeOf(error: unknown): ErrorCause {
  if (!(error instanceof HttpError)) {
    return { status: null, moveFailure: null };
  }
  return { status: error.status, moveFailure: moveFailureOf(error.params) ?? moveFailureOf(error.body) };
}
