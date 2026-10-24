// Settings for files (specification 5.7): "Importierte Dateien behalten", "Ablageverzeichnis",
// "Importverzeichnis" and "Exportverzeichnis", internal endpoint `/api/replay/settings/files`.
import { ApiError, asRecord, bool, request, strOrNull } from './http';

const PATH = '/api/replay/settings/files';

export const DIRECTORY_FIELDS = ['storage_directory', 'import_directory', 'export_directory'] as const;
export type DirectoryField = (typeof DIRECTORY_FIELDS)[number];

/** A directory setting: the path that applies and whether it is the default of the operating system. */
export type DirectorySetting = {
  /** `null` only if the default applies and the backend cannot determine it. */
  path: string | null;
  isDefault: boolean;
};

export type FileSettings = {
  keepImportedFiles: boolean;
  storageDirectory: DirectorySetting;
  importDirectory: DirectorySetting;
  exportDirectory: DirectorySetting;
};

/** What `PUT` sends: a path, or `null` for the default. All four fields are always sent. */
export type FileSettingsUpdate = {
  keepImportedFiles: boolean;
  storageDirectory: string | null;
  importDirectory: string | null;
  exportDirectory: string | null;
};

function parseDirectory(record: Record<string, unknown>, key: string): DirectorySetting {
  const value = asRecord(record[key], key);
  return { path: strOrNull(value, 'path'), isDefault: bool(value, 'is_default') };
}

function parseSettings(value: unknown): FileSettings {
  const record = asRecord(value, 'settings for files');
  return {
    keepImportedFiles: bool(record, 'keep_imported_files'),
    storageDirectory: parseDirectory(record, 'storage_directory'),
    importDirectory: parseDirectory(record, 'import_directory'),
    exportDirectory: parseDirectory(record, 'export_directory'),
  };
}

export async function fetchFileSettings(signal?: AbortSignal): Promise<FileSettings> {
  return parseSettings(await request(PATH, { signal }));
}

export async function updateFileSettings(update: FileSettingsUpdate): Promise<FileSettings> {
  return parseSettings(
    await request(PATH, {
      method: 'PUT',
      json: {
        keep_imported_files: update.keepImportedFiles,
        storage_directory: update.storageDirectory,
        import_directory: update.importDirectory,
        export_directory: update.exportDirectory,
      },
    }),
  );
}

/** Why the backend refuses a directory (`type` of an entry of `errors`, HTTP 422). */
export const DIRECTORY_REASONS = [
  'not_absolute',
  'not_a_directory',
  'cannot_be_created',
  'not_writable',
  'not_readable',
] as const;
export type DirectoryReason = (typeof DIRECTORY_REASONS)[number];

function isDirectoryField(value: unknown): value is DirectoryField {
  return typeof value === 'string' && (DIRECTORY_FIELDS as readonly string[]).includes(value);
}

function isDirectoryReason(value: unknown): value is DirectoryReason {
  return typeof value === 'string' && (DIRECTORY_REASONS as readonly string[]).includes(value);
}

/**
 * The reason per directory if the answer is the refusal of directories (HTTP 422 with `errors`
 * whose `location` names a directory field and whose `type` is a reason), else `null`. Entries
 * the interface does not know are left out; if none is known the answer is no refusal of
 * directories.
 */
export function directoryRefusals(error: unknown): Partial<Record<DirectoryField, DirectoryReason>> | null {
  if (!(error instanceof ApiError) || error.status !== 422 || typeof error.body !== 'object' || error.body === null) {
    return null;
  }
  const body = error.body as Record<string, unknown>;
  if (!Array.isArray(body.errors)) {
    return null;
  }
  const refusals: Partial<Record<DirectoryField, DirectoryReason>> = {};
  for (const entry of body.errors as unknown[]) {
    if (typeof entry !== 'object' || entry === null) {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const location = Array.isArray(record.location) ? (record.location as unknown[]) : [];
    const field = location[0];
    if (isDirectoryField(field) && isDirectoryReason(record.type)) {
      refusals[field] = record.type;
    }
  }
  return Object.keys(refusals).length === 0 ? null : refusals;
}
