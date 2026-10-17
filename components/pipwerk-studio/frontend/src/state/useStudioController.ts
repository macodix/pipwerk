import { useQueries, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { fetchElementTypes } from '../api/elementTypes';
import {
  checkDocument,
  createStrategy,
  deleteStrategy,
  listObjects,
  readStrategy,
  readTemplate,
  replaceStrategy,
  templateArts,
} from '../api/objects';
import { cornerForCenter, freePosition, ownerAtPoint, syncedFrames } from '../canvas/canvasEditing';
import type { CanvasApi } from '../DesignerCanvas';
import type { Point } from '../canvas/layout';
import { freshName, instanceFromType, newStrategy } from '../document/build';
import {
  addElement,
  addRule,
  getRule,
  moveRule as moveRuleIn,
  removeRule as removeRuleIn,
  rulesOf,
} from '../document/ops';
import type { RuleOwner, RulePath, StrategyDocument } from '../document/types';
import { sameRulePath } from '../document/types';
import type { FunctionItem } from '../expression/completions';
import { useLiveNames } from '../expression/useLiveNames';
import { indexFindings } from '../findings/findingsModel';
import { defaultLanguage, isSupportedLanguage, type SupportedLanguage } from '../i18n';
import { elementForSource, ruleForSource, type TemplateLoader } from '../library/insert';
import {
  buildLibrary,
  findEntry,
  type LibraryEntry,
  type LibrarySource,
  type StoredTemplates,
} from '../library/libraryModel';
import { createTypeIndex, labelText } from '../model/typeIndex';
import { editorReducer, initialEditorState, isDirty, type Selection } from './editorState';
import type { StudioApi } from './StudioContext';

/** What happens after the question about unsaved changes. */
export type PendingAction = { kind: 'new' } | { kind: 'close' } | { kind: 'open'; id: string };

export type DialogState =
  | null
  | { kind: 'unsaved'; then: PendingAction }
  | { kind: 'open' }
  | { kind: 'delete' }
  | { kind: 'settings' }
  | { kind: 'error'; titleKey: string; error: unknown };

/** The number of rules in a list of rules: of the owner, or of the rule set at `inside`. */
function listLength(document: StrategyDocument, owner: RuleOwner, inside: readonly number[]): number {
  if (inside.length === 0) {
    return rulesOf(document, owner).length;
  }
  return getRule(document, { owner, indices: [...inside] })?.rules?.length ?? 0;
}

/** Everything the application keeps and does for the open strategy: state, requests, dialogs. */
export function useStudioController() {
  const { i18n } = useTranslation();
  const language: SupportedLanguage =
    i18n.resolvedLanguage !== undefined && isSupportedLanguage(i18n.resolvedLanguage)
      ? i18n.resolvedLanguage
      : defaultLanguage;
  const [state, dispatch] = useReducer(editorReducer, initialEditorState);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [busy, setBusy] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const canvasApi = useRef<CanvasApi>(null);

  // --- type descriptions and stored templates ------------------------------------------------

  const typesQuery = useQuery({
    queryKey: ['element-types'],
    queryFn: ({ signal }) => fetchElementTypes(signal),
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    networkMode: 'always',
  });
  const types = useMemo(() => (typesQuery.data === undefined ? null : createTypeIndex(typesQuery.data)), [typesQuery.data]);

  const storedQueries = useQueries({
    queries: templateArts.map((art) => ({
      queryKey: ['objects', art],
      queryFn: ({ signal }: { signal: AbortSignal }) => listObjects(art, signal),
      retry: false,
      networkMode: 'always' as const,
    })),
  });
  const storedData = storedQueries.map((query) => query.data);
  const stored = useMemo<StoredTemplates>(
    () => Object.fromEntries(templateArts.map((art, index) => [art, storedData[index]])) as StoredTemplates,
    storedData,
  );
  const storedFailed = storedQueries.some((query) => query.isError);

  const library = useMemo(() => (types === null ? [] : buildLibrary(types, stored, language)), [types, stored, language]);
  const functions = useMemo<FunctionItem[]>(
    () => (types?.functions ?? []).map((item) => ({ name: item.name, description: item.description[language] })),
    [types, language],
  );

  // --- findings ------------------------------------------------------------------------------

  const findings = useMemo(() => indexFindings(state.findings), [state.findings]);
  const severities = useMemo(() => {
    const map = new Map<string, 'error' | 'hint'>();
    for (const element of state.document?.elements ?? []) {
      const level = findings.severityOfElement(element.id);
      if (level !== null) {
        map.set(element.id, level);
      }
    }
    return map;
  }, [findings, state.document]);

  const liveNames = useLiveNames(state.document);
  const dirty = isDirty(state);

  // --- editing -------------------------------------------------------------------------------

  const edit = useCallback((change: (document: StrategyDocument) => StrategyDocument) => {
    dispatch({ type: 'edited', change });
  }, []);

  const select = useCallback((selection: Selection) => {
    dispatch({ type: 'select', selection });
  }, []);

  const showError = useCallback((titleKey: string, error: unknown) => {
    setDialog({ kind: 'error', titleKey, error });
  }, []);

  const loadTemplate = useCallback<TemplateLoader>((source) => readTemplate(source.art, source.id), []);

  const addRuleFromLibrary = useCallback(
    async (owner: RuleOwner, source: LibrarySource, inside: number[] = []) => {
      const document = stateRef.current.document;
      if (document === null || types === null) {
        return;
      }
      try {
        const rule = await ruleForSource(document, types, source, loadTemplate);
        if (rule === null) {
          return;
        }
        const position = listLength(document, owner, inside);
        dispatch({ type: 'edited', change: (current) => addRule(current, owner, rule, inside) });
        dispatch({ type: 'select', selection: { kind: 'rule', path: { owner, indices: [...inside, position] } } });
      } catch (error) {
        showError('errors.insertFailed', error);
      }
    },
    [loadTemplate, showError, types],
  );

  const addNewRule = useCallback(
    (owner: RuleOwner, inside: number[] = []) => {
      const document = stateRef.current.document;
      const ruleType = types?.list.find((type) => type.kind === 'object_type' && type.category === 'rule');
      if (document === null || ruleType === undefined) {
        return;
      }
      const rule = instanceFromType(ruleType, freshName(document, labelText(ruleType.name, language)));
      const position = listLength(document, owner, inside);
      dispatch({ type: 'edited', change: (current) => addRule(current, owner, rule, inside) });
      dispatch({ type: 'select', selection: { kind: 'rule', path: { owner, indices: [...inside, position] } } });
    },
    [language, types],
  );

  const removeRule = useCallback((path: RulePath) => {
    dispatch({ type: 'edited', change: (current) => removeRuleIn(current, path) });
  }, []);

  const moveRule = useCallback((path: RulePath, delta: -1 | 1) => {
    dispatch({ type: 'edited', change: (current) => moveRuleIn(current, path, delta) });
    const selection = stateRef.current.selection;
    if (selection.kind === 'rule' && sameRulePath(selection.path, path)) {
      const last = path.indices[path.indices.length - 1] ?? 0;
      dispatch({
        type: 'select',
        selection: { kind: 'rule', path: { owner: path.owner, indices: [...path.indices.slice(0, -1), Math.max(0, last + delta)] } },
      });
    }
  }, []);

  // --- inserting from the library --------------------------------------------------------------

  const insert = useCallback(
    async (source: LibrarySource, center: Point) => {
      const current = stateRef.current;
      if (current.document === null || types === null) {
        return;
      }
      try {
        const corner = freePosition(current.document, types, cornerForCenter(center, 1));
        const owner = ownerAtPoint(current.document, types, current.frames, new Set(current.collapsed), center);
        const element = await elementForSource(
          current.document,
          types,
          source,
          { x: corner.x, y: corner.y, managementOf: owner, language },
          loadTemplate,
        );
        if (element === null) {
          return;
        }
        dispatch({ type: 'edited', change: (document) => addElement(document, element) });
        dispatch({
          type: 'framesGrow',
          grow: (document, frames) => syncedFrames(document, types, frames, language, true),
        });
        dispatch({ type: 'select', selection: { kind: 'elements', ids: [element.id] } });
      } catch (error) {
        showError('errors.insertFailed', error);
      }
    },
    [language, loadTemplate, showError, types],
  );

  /** An entry was dropped on the drawing area. */
  const dropEntry = useCallback(
    (source: LibrarySource, point: Point) => {
      const entry = findEntry(library, source);
      if (entry === undefined || entry.target !== 'canvas' || entry.unreadable) {
        return;
      }
      void insert(source, point);
    },
    [insert, library],
  );

  /** Enter on an entry: into the middle of the visible drawing area, or into the rules of the strategy or the selected element. */
  const insertEntry = useCallback(
    (entry: LibraryEntry) => {
      if (entry.target === 'rules') {
        const selection = stateRef.current.selection;
        const document = stateRef.current.document;
        let owner: RuleOwner = { kind: 'strategy' };
        if (selection.kind === 'elements' && selection.ids.length === 1 && document !== null) {
          const element = document.elements.find((candidate) => candidate.id === selection.ids[0]);
          if (element !== undefined && types?.byId.get(element.type)?.rulesAllowed === true) {
            owner = { kind: 'element', id: element.id };
          }
        }
        void addRuleFromLibrary(owner, entry.source);
        return;
      }
      void insert(entry.source, canvasApi.current?.centerPoint() ?? { x: 0, y: 0 });
    },
    [addRuleFromLibrary, insert, types],
  );

  // --- workflows -----------------------------------------------------------------------------------

  // Counts up whenever a strategy is opened, created or closed: the answer of a check that was
  // started for an earlier strategy is not shown for the one that is open now.
  const strategyToken = useRef(0);

  const checkAfterOpen = useCallback(async (document: StrategyDocument, token: number) => {
    try {
      const result = await checkDocument(document);
      if (strategyToken.current === token) {
        dispatch({ type: 'checked', findings: result.findings });
      }
    } catch {
      // The findings stay unknown; "Prüfen" asks again.
    }
  }, []);

  const openById = useCallback(
    async (id: string) => {
      setBusy(true);
      try {
        const document = await readStrategy(id);
        strategyToken.current += 1;
        dispatch({ type: 'loaded', document, persisted: true, findings: null });
        void checkAfterOpen(document, strategyToken.current);
      } catch (error) {
        showError('errors.openFailed', error);
      } finally {
        setBusy(false);
      }
    },
    [checkAfterOpen, showError],
  );

  const run = useCallback(
    async (action: PendingAction) => {
      if (action.kind === 'close') {
        strategyToken.current += 1;
        dispatch({ type: 'closed' });
      } else if (action.kind === 'new') {
        if (types !== null) {
          strategyToken.current += 1;
          dispatch({ type: 'loaded', document: newStrategy(types, language), persisted: false, findings: null });
        }
      } else {
        await openById(action.id);
      }
    },
    [language, openById, types],
  );

  /** "Neue Strategie", "Schließen" and "Öffnen" ask first if there are unsaved changes. */
  const request = useCallback(
    (action: PendingAction) => {
      if (isDirty(stateRef.current)) {
        setDialog({ kind: 'unsaved', then: action });
      } else {
        void run(action);
      }
    },
    [run],
  );

  /** Saves: the first time with POST, then with PUT; always, and the findings of the answer are shown. */
  const save = useCallback(async (): Promise<boolean> => {
    const current = stateRef.current;
    const document = current.document;
    if (document === null) {
      return false;
    }
    setBusy(true);
    try {
      const saved = current.persisted ? await replaceStrategy(document) : await createStrategy(document);
      dispatch({
        type: 'saved',
        saved: saved.document,
        findings: saved.findings,
        replaceOpen: stateRef.current.document === document,
      });
      return true;
    } catch (error) {
      showError('errors.saveFailed', error);
      return false;
    } finally {
      setBusy(false);
    }
  }, [showError]);

  const check = useCallback(async () => {
    const document = stateRef.current.document;
    if (document === null) {
      return;
    }
    setBusy(true);
    try {
      const result = await checkDocument(document);
      dispatch({ type: 'checked', findings: result.findings });
    } catch (error) {
      showError('errors.checkFailed', error);
    } finally {
      setBusy(false);
    }
  }, [showError]);

  const confirmDelete = useCallback(async () => {
    const current = stateRef.current;
    if (current.document === null) {
      setDialog(null);
      return;
    }
    setBusy(true);
    try {
      if (current.persisted) {
        await deleteStrategy(current.document.id);
      }
      setDialog(null);
      strategyToken.current += 1;
      dispatch({ type: 'closed' });
    } catch (error) {
      showError('errors.deleteFailed', error);
    } finally {
      setBusy(false);
    }
  }, [showError]);

  /** The answer to the question about unsaved changes. */
  const answerUnsaved = useCallback(
    async (answer: 'save' | 'discard' | 'cancel') => {
      const current = dialog;
      if (current === null || current.kind !== 'unsaved') {
        return;
      }
      if (answer === 'cancel') {
        setDialog(null);
        return;
      }
      if (answer === 'save') {
        setDialog(null);
        if (!(await save())) {
          return;
        }
      } else {
        setDialog(null);
      }
      await run(current.then);
    },
    [dialog, run, save],
  );

  const api = useMemo<StudioApi | null>(() => {
    if (state.document === null || types === null) {
      return null;
    }
    return {
      document: state.document,
      types,
      language,
      findings,
      findingsKnown: state.findings !== null,
      liveNames,
      functions,
      library,
      selection: state.selection,
      edit,
      select,
      addRuleFromLibrary: (owner, source, inside) => {
        void addRuleFromLibrary(owner, source, inside);
      },
      addNewRule,
      removeRule,
      moveRule,
    };
  }, [
    state.document,
    state.findings,
    state.selection,
    types,
    language,
    findings,
    liveNames,
    functions,
    library,
    edit,
    select,
    addRuleFromLibrary,
    addNewRule,
    removeRule,
    moveRule,
  ]);

  return {
    state,
    dispatch,
    language,
    types,
    typesFailed: typesQuery.isError,
    retryTypes: () => {
      void typesQuery.refetch();
    },
    library,
    storedFailed,
    findings,
    severities,
    dirty,
    busy,
    dialog,
    setDialog,
    api,
    canvasApi,
    insertEntry,
    dropEntry,
    request,
    save,
    check,
    confirmDelete,
    answerUnsaved,
    openById,
  };
}
