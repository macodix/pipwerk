import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { fetchElementTypes } from '../api/elementTypes';
import {
  checkDocument,
  createKey,
  createStrategy,
  deleteStrategy,
  listObjects,
  readStrategy,
  readTemplate,
  replaceStrategy,
  requestExpressions,
  templateArts,
  type Finding,
} from '../api/objects';
import { addToList, type ListRef } from '../document/instanceOps';
import { listPointer, placePointer, setPlaceStored, type ExpressionPlace } from '../document/places';
import type { Block } from '../expression/blocks';
import { ownerElement, withInputs } from '../expression/inputs';
import {
  addElement,
  addInput,
  addStrategyParameter,
  clearPositions,
  connect,
  createSection,
  disconnect,
  moveObject,
  placeObject,
  removeElement,
  removeInput,
  removeRule,
  removeSection,
  removeStrategyParameter,
  renameSection,
  setBinding,
  setElementName,
  setManagement,
  setOrientation,
  setPosition,
  setSection,
  setSectionCollapsed,
  setStrategyDescription,
  setStrategyName,
  toggleManagementCollapsed,
  updateStrategyParameter,
  removalSet,
  type BindingScope,
  type ConnectionProblem,
} from '../document/ops';
import {
  instanceFromTemplate,
  instanceFromType,
  newElement,
  newStrategy,
  newTemplateElement,
  takenNames,
  typeDisplayName,
  uniqueDisplayName,
  withOrderDefaults,
} from '../document/build';
import type { Binding, StrategyDocument, StrategyParameter } from '../document/types';
import { defaultLanguage, isSupportedLanguage, type SupportedLanguage } from '../i18n';
import { buildLibrary, findEntry, type StoredTemplates } from '../library/libraryModel';
import { elementName, isCardElement } from '../model/elements';
import { createTypeIndex, holdsInstance, type TypeIndex } from '../model/typeIndex';
import { NARROW_LAYOUT, matchesMedia } from '../ui/media';
import { newUuid } from '../document/ids';
import {
  initialStudioState,
  isDirty,
  studioReducer,
  type Panel,
  type Selection,
  type StudioState,
  type WireMode,
} from './studioState';
import type { Pt } from '../arrange/layout';

/** What happens after the question about unsaved changes. */
export type PendingAction = { kind: 'new' } | { kind: 'close' } | { kind: 'open'; id: string };

export type DialogState =
  | null
  | { kind: 'unsaved'; then: PendingAction }
  | { kind: 'open' }
  | { kind: 'delete' }
  | { kind: 'settings' }
  | { kind: 'removeElement'; id: string }
  | { kind: 'removeParameter'; key: string }
  | { kind: 'error'; titleKey: string; error: unknown };

/** A strategy parameter that is about to be created: the identifier in expressions comes from the backend. */
export type NewParameter = Pick<StrategyParameter, 'name' | 'datatype' | 'object_type' | 'value' | 'at_application' | 'choices'>;

/** Where an entry of the library is laid: on the drawing area behind a step or in a management, or as a rule in a list of rules. */
export type DropTarget = { after?: string | null; flow?: string | null; ruleList?: ListRef; instanceList?: ListRef };

export type StudioController = ReturnType<typeof useStudioController>;

const TYPES_KEY = ['element-types'];

/** Everything the application keeps and does for the open strategy: state, requests, dialogs, edits. */
export function useStudioController(language: SupportedLanguage) {
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(studioReducer, initialStudioState);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [busy, setBusy] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const strategyToken = useRef(0);

  const typesQuery = useQuery({
    queryKey: TYPES_KEY,
    queryFn: ({ signal }) => fetchElementTypes(signal),
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    networkMode: 'always',
  });
  const types: TypeIndex | null = useMemo(
    () => (typesQuery.data === undefined ? null : createTypeIndex(typesQuery.data)),
    [typesQuery.data],
  );
  const typesRef = useRef(types);
  typesRef.current = types;

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
    () => Object.fromEntries(templateArts.map((art, index) => [art, storedData[index]])),
    storedData,
  );
  const storedFailed = storedQueries.some((query) => query.isError);
  const library = useMemo(() => (types === null ? [] : buildLibrary(types, stored, language)), [types, stored, language]);

  const dirty = isDirty(state);

  const showError = useCallback((titleKey: string, error: unknown) => {
    setDialog({ kind: 'error', titleKey, error });
  }, []);

  const notify = useCallback((key: string, params?: Record<string, string>) => {
    dispatch({ type: 'notice', key, params });
  }, []);

  const edit = useCallback(
    (change: (document: StrategyDocument) => StrategyDocument, options?: { selection?: Selection; reveal?: string }) => {
      dispatch({ type: 'edited', change, selection: options?.selection, reveal: options?.reveal });
    },
    [],
  );

  const select = useCallback((selection: Selection, panel?: Panel) => {
    dispatch({ type: 'select', selection, panel });
  }, []);

  // --- workflows -------------------------------------------------------------------------------

  const checkAfterOpen = useCallback(async (document: StrategyDocument, token: number) => {
    try {
      const findings = await checkDocument(document);
      if (strategyToken.current === token) {
        dispatch({ type: 'checked', findings });
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
        let names: string[] = [];
        try {
          const list = await queryClient.fetchQuery({
            queryKey: ['objects', 'strategies', 'names'],
            queryFn: ({ signal }) => listObjects('strategies', signal),
            staleTime: 0,
          });
          names = list.map((entry) => entry.name ?? '');
        } catch {
          names = [];
        }
        const name = uniqueDisplayName(i18n.t('strategy.newName'), names);
        strategyToken.current += 1;
        dispatch({ type: 'loaded', document: newStrategy(name), persisted: false, findings: null });
        dispatch({ type: 'wizard', wizard: {} });
        dispatch({ type: 'panel', panel: 'canvas' });
      } else {
        await openById(action.id);
      }
    },
    [i18n, openById, queryClient],
  );

  /** "Neue Strategie", "Schließen" and "Öffnen" ask first if there are unsaved changes (specification 5.5). */
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

  /** Saves always, the first time with POST, then with PUT; the findings of the answer are shown. */
  const save = useCallback(async (): Promise<boolean> => {
    const current = stateRef.current;
    const document = current.document;
    if (document === null) {
      return false;
    }
    setBusy(true);
    try {
      const result = current.persisted ? await replaceStrategy(document) : await createStrategy(document);
      dispatch({
        type: 'saved',
        saved: result.document ?? document,
        findings: result.findings,
        replaceOpen: result.document !== null && stateRef.current.document === document,
      });
      void queryClient.invalidateQueries({ queryKey: ['objects'] });
      return true;
    } catch (error) {
      showError('errors.saveFailed', error);
      return false;
    } finally {
      setBusy(false);
    }
  }, [queryClient, showError]);

  const check = useCallback(async () => {
    const document = stateRef.current.document;
    if (document === null) {
      return;
    }
    setBusy(true);
    try {
      dispatch({ type: 'checked', findings: await checkDocument(document) });
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
        void queryClient.invalidateQueries({ queryKey: ['objects'] });
      }
      setDialog(null);
      strategyToken.current += 1;
      dispatch({ type: 'closed' });
    } catch (error) {
      showError('errors.deleteFailed', error);
    } finally {
      setBusy(false);
    }
  }, [queryClient, showError]);

  /** The answer to the question about unsaved changes. */
  const answerUnsaved = useCallback(
    async (answer: 'save' | 'discard' | 'cancel') => {
      if (dialog === null || dialog.kind !== 'unsaved') {
        return;
      }
      const then = dialog.then;
      setDialog(null);
      if (answer === 'cancel') {
        return;
      }
      if (answer === 'save' && !(await save())) {
        return;
      }
      await run(then);
    },
    [dialog, run, save],
  );

  // --- inserting -------------------------------------------------------------------------------

  /** The management the selected thing stands for: the selected frame, or the flow of the selected step. */
  const currentFlow = useCallback((): string | null => {
    const current = stateRef.current;
    const document = current.document;
    if (document === null) {
      return null;
    }
    const selection = current.selection;
    if (selection.kind === 'frame') {
      return selection.id;
    }
    if (selection.kind === 'element') {
      return document.elements.find((candidate) => candidate.id === selection.id)?.management_of ?? null;
    }
    return null;
  }, []);

  /**
   * Lays an entry of the library on the drawing area or adds it as a rule. The answer is the identifier of the
   * element that was laid out, the key of the rule or contained object that was added, or `null` if nothing was.
   */
  const insert = useCallback(
    async (entryKey: string, drop?: DropTarget): Promise<string | null> => {
      const current = stateRef.current;
      const index = typesRef.current;
      const document = current.document;
      if (document === null || index === null) {
        return null;
      }
      const entry = findEntry(library, entryKey);
      if (entry === undefined || entry.unreadable) {
        return null;
      }
      try {
        const source = entry.source;
        let template: ({ id: string; name: string; object_type: string } & Record<string, unknown>) | null = null;
        let own = false;
        let typeId: string;
        if (source.kind === 'type') {
          typeId = source.typeId;
        } else if (source.kind === 'builtinTemplate') {
          const found = index.templates.find((candidate) => candidate.id === source.templateId);
          if (found === undefined) {
            return null;
          }
          template = found;
          typeId = found.object_type;
        } else {
          const record = await readTemplate(source.art, source.id);
          template = record as { id: string; name: string; object_type: string } & Record<string, unknown>;
          typeId = template.object_type;
          own = true;
        }
        const type = index.byId.get(typeId);
        const name = uniqueDisplayName(
          entry.name === '' ? (type === undefined ? typeId : typeDisplayName(type, language)) : entry.name,
          type === undefined || holdsInstance(type) || type.named || entry.target === 'rules' || template !== null
            ? takenNames(document, index)
            : [],
        );
        if (entry.target === 'rules' || drop?.instanceList !== undefined) {
          const selection = current.selection;
          const selected =
            selection.kind === 'element' ? document.elements.find((candidate) => candidate.id === selection.id) : undefined;
          const owner = selected !== undefined && index.byId.get(selected.type)?.rulesAllowed === true ? selected.id : null;
          const explicit = drop?.instanceList ?? drop?.ruleList;
          const list: ListRef = explicit ?? { root: owner === null ? { kind: 'strategy' } : { kind: 'element', id: owner }, steps: [], list: 'rules' };
          const scope = listPointer(document, list);
          if (scope === null) {
            return null;
          }
          const key = await createKey(document, scope, name, undefined, { kind: list.list === 'rules' ? 'rule' : 'instance', objectType: typeId });
          const rule =
            template !== null
              ? instanceFromTemplate(template, name, key, own)
              : type === undefined
                ? null
                : instanceFromType(type, name, key);
          if (rule === null) {
            return null;
          }
          const nested = list.steps.length > 0;
          edit((latest) => addToList(latest, list, rule), {
            selection: nested || explicit !== undefined ? undefined : owner === null ? { kind: 'strategy' } : { kind: 'element', id: owner },
          });
          if (!nested && explicit === undefined) {
            notify(list.root.kind === 'strategy' ? 'notices.ruleForStrategy' : 'notices.ruleForElement');
          }
          return key;
        }
        if (type === undefined) {
          return null;
        }
        const needsKey = holdsInstance(type) || type.named;
        const key = needsKey ? await createKey(document, '/elements', name) : null;
        const flow = drop?.flow !== undefined ? drop.flow : currentFlow();
        const selection = current.selection;
        const after = drop?.after !== undefined ? drop.after : selection.kind === 'element' ? selection.id : null;
        const options = { name, key, managementOf: type.kind === 'object_type' || type.kind === 'application_object' ? null : flow };
        const added =
          template !== null
            ? newTemplateElement(template, { ...options, managementOf: null }, own)
            : withOrderDefaults(newElement(type, options), index);
        edit((latest) => addElement(latest, index, added, after), {
          selection: { kind: 'element', id: added.id },
          reveal: added.id,
        });
        if (matchesMedia(NARROW_LAYOUT)) {
          notify('notices.inserted', { name });
        }
        return added.id;
      } catch (error) {
        showError('errors.insertFailed', error);
        return null;
      }
    },
    [currentFlow, edit, language, library, notify, showError],
  );

  /** Writes an expression given as blocks: the expression endpoint forms it, the inputs of the values join the element. */
  const writeBlocks = useCallback(
    async (place: ExpressionPlace, blocks: Block): Promise<void> => {
      const document = stateRef.current.document;
      const index = typesRef.current;
      const pointer = document === null ? null : placePointer(document, place);
      if (document === null || index === null || pointer === null) {
        return;
      }
      try {
        const [answer] = await requestExpressions(document, language, [{ pointer, blocks }]);
        if (answer !== undefined) {
          edit((latest) => withInputs(setPlaceStored(latest, index, place, answer.stored), ownerElement(place), blocks));
        }
      } catch (error) {
        showError('errors.insertFailed', error);
      }
    },
    [edit, language, showError],
  );

  /** Selects an element without leaving the guided setup (a click on the drawing area leaves it). */
  const selectQuietly = useCallback(
    (id: string) => {
      edit((latest) => latest, { selection: { kind: 'element', id } });
    },
    [edit],
  );

  // --- the drawing area ------------------------------------------------------------------------

  const problemNotice = useCallback(
    (problem: ConnectionProblem) => {
      notify(`notices.connection.${problem}`);
    },
    [notify],
  );

  const connectSteps = useCallback(
    (from: string, output: string, to: string): boolean => {
      const index = typesRef.current;
      const document = stateRef.current.document;
      if (index === null || document === null) {
        return false;
      }
      const result = connect(document, index, from, output, to);
      if ('problem' in result) {
        problemNotice(result.problem);
        dispatch({ type: 'armed', armed: null });
        return false;
      }
      edit(() => result.document);
      return true;
    },
    [edit, problemNotice],
  );

  /** A value of an object is connected with an element: it becomes an input (specification 5.3). */
  const connectValue = useCallback(
    (instanceElement: string, property: string, to: string) => {
      const document = stateRef.current.document;
      const index = typesRef.current;
      const source = document?.elements.find((candidate) => candidate.id === instanceElement);
      const target = document?.elements.find((candidate) => candidate.id === to);
      if (document === null || index === null || source?.instance === undefined || source.instance === null || target === undefined) {
        return;
      }
      if (source.id === target.id) {
        return;
      }
      const key = source.instance.key;
      edit((latest) => addInput(latest, to, { instance: key, property }), { selection: { kind: 'element', id: to } });
      notify('notices.inputAdded');
    },
    [edit, notify],
  );

  /** After a step was dragged: it belongs to the frame it lies in, never to one it only touches (specification 5.3). */
  const dropStep = useCallback(
    (id: string, position: Pt, owner: string | null) => {
      const index = typesRef.current;
      const document = stateRef.current.document;
      if (index === null || document === null) {
        return;
      }
      const found = document.elements.find((candidate) => candidate.id === id);
      if (found === undefined) {
        return;
      }
      if ((found.management_of ?? null) !== owner) {
        edit((latest) => setManagement(latest, index, id, owner));
        notify(owner === null ? 'notices.toMainFlow' : 'notices.toManagement');
        return;
      }
      edit((latest) => setPosition(latest, id, position));
    },
    [edit, notify],
  );

  const addParameter = useCallback(
    async (parameter: NewParameter): Promise<string | null> => {
      const document = stateRef.current.document;
      if (document === null) {
        return null;
      }
      try {
        const name = uniqueDisplayName(parameter.name, document.parameters.map((candidate) => candidate.name));
        const key = await createKey(document, '/parameters', name);
        edit((latest) => addStrategyParameter(latest, { ...parameter, name, key }));
        return key;
      } catch (error) {
        showError('errors.insertFailed', error);
        return null;
      }
    },
    [edit, showError],
  );

  /** Everything that goes with an element when it is removed, for the question before it. */
  const removalInfo = useCallback((id: string) => {
    const document = stateRef.current.document;
    const index = typesRef.current;
    if (document === null || index === null) {
      return null;
    }
    const target = document.elements.find((candidate) => candidate.id === id);
    if (target === undefined) {
      return null;
    }
    const ids = removalSet(document, id);
    return {
      target,
      managed: document.elements.filter((candidate) => ids.includes(candidate.id)),
    };
  }, []);

  const requestRemoveElement = useCallback(
    (id: string) => {
      const info = removalInfo(id);
      if (info === null) {
        return;
      }
      if (info.managed.length > 0) {
        setDialog({ kind: 'removeElement', id });
      } else {
        const index = typesRef.current;
        if (index !== null) {
          edit((latest) => removeElement(latest, index, id), { selection: { kind: 'strategy' } });
        }
      }
    },
    [edit, removalInfo],
  );

  const confirmRemoveElement = useCallback(
    (id: string) => {
      const index = typesRef.current;
      setDialog(null);
      if (index !== null) {
        edit((latest) => removeElement(latest, index, id), { selection: { kind: 'strategy' } });
      }
    },
    [edit],
  );

  const elementDisplayName = useCallback(
    (id: string): string => {
      const found = stateRef.current.document?.elements.find((candidate) => candidate.id === id);
      const index = typesRef.current;
      return found === undefined || index === null ? '' : elementName(found, index, language);
    },
    [language],
  );

  const actions = useMemo(
    () => ({
      dispatch,
      edit,
      select,
      notify,
      setDialog,
      request,
      save,
      check,
      confirmDelete,
      answerUnsaved,
      insert,
      writeBlocks,
      selectQuietly,
      connectSteps,
      connectValue,
      dropStep,
      addParameter,
      removalInfo,
      requestRemoveElement,
      confirmRemoveElement,
      elementDisplayName,
      showElement: (id: string) => {
        edit((document) => document, { selection: { kind: 'element', id }, reveal: id });
        dispatch({ type: 'panel', panel: 'props' });
      },
      setWires: (mode: WireMode) => dispatch({ type: 'wires', mode }),
      setPanel: (panel: Panel) => dispatch({ type: 'panel', panel }),
      arm: (armed: StudioState['armed']) => dispatch({ type: 'armed', armed }),
      toggleCard: (id: string) => dispatch({ type: 'toggleCard', id }),
      focusField: (field: string) => dispatch({ type: 'focusField', field }),
      retryTypes: () => {
        void queryClient.invalidateQueries({ queryKey: TYPES_KEY });
        void queryClient.invalidateQueries({ queryKey: ['objects'] });
      },
      // document operations in the name of the user
      setName: (name: string) => edit((document) => setStrategyName(document, name)),
      setDescription: (description: string) => edit((document) => setStrategyDescription(document, description)),
      setOrientation: (orientation: StrategyDocument['orientation']) => edit((document) => setOrientation(document, orientation)),
      arrangeAgain: () => edit((document) => clearPositions(document)),
      toggleManagement: (owner: string) => edit((document) => toggleManagementCollapsed(document, owner)),
      disconnect: (connectionId: string) => edit((document) => disconnect(document, connectionId)),
      renameElement: (id: string, name: string) => edit((document) => setElementName(document, id, name)),
      setBinding: (id: string, scope: BindingScope, key: string, binding: Binding | null) => {
        const index = typesRef.current;
        if (index !== null) {
          edit((document) => setBinding(document, index, id, scope, key, binding));
        }
      },
      addInput: (id: string, input: { instance: string; property: string }) => edit((document) => addInput(document, id, input)),
      removeInput: (id: string, input: { instance: string; property: string }) =>
        edit((document) => removeInput(document, id, input)),
      updateParameter: (key: string, patch: Partial<StrategyParameter>) =>
        edit((document) => updateStrategyParameter(document, key, patch)),
      removeParameter: (key: string) => {
        setDialog(null);
        edit((document) => removeStrategyParameter(document, key));
      },
      setManagement: (id: string, owner: string | null) => {
        const index = typesRef.current;
        if (index !== null) {
          edit((document) => setManagement(document, index, id, owner));
        }
      },
      setSection: (id: string, sectionId: string | null) => edit((document) => setSection(document, id, sectionId)),
      createSection: (id: string, name: string) => {
        const index = typesRef.current;
        if (index !== null) {
          edit((document) => createSection(document, index, id, name));
        }
      },
      renameSection: (sectionId: string, name: string) => edit((document) => renameSection(document, sectionId, name)),
      setSectionCollapsed: (sectionId: string, collapsed: boolean) =>
        edit((document) => setSectionCollapsed(document, sectionId, collapsed)),
      removeSection: (sectionId: string) =>
        edit((document) => removeSection(document, sectionId), { selection: { kind: 'strategy' } }),
      moveObject: (id: string, delta: -1 | 1) => {
        const index = typesRef.current;
        if (index !== null) {
          edit((document) => moveObject(document, index, id, delta));
        }
      },
      placeObject: (id: string, position: number) => {
        const index = typesRef.current;
        if (index !== null) {
          edit((document) => placeObject(document, index, id, position));
        }
      },
      removeRule: (owner: string | null, key: string) => edit((document) => removeRule(document, owner, key)),
      newId: newUuid,
    }),
    [
      addParameter,
      answerUnsaved,
      check,
      confirmDelete,
      confirmRemoveElement,
      connectSteps,
      connectValue,
      dropStep,
      edit,
      elementDisplayName,
      insert,
      notify,
      queryClient,
      removalInfo,
      request,
      requestRemoveElement,
      save,
      select,
      selectQuietly,
      writeBlocks,
    ],
  );

  return {
    state,
    dialog,
    busy,
    types,
    typesFailed: typesQuery.isError,
    storedFailed,
    library,
    dirty,
    language,
    actions,
    isCard: (id: string): boolean => {
      const found = state.document?.elements.find((candidate) => candidate.id === id);
      return found !== undefined && types !== null && isCardElement(found, types);
    },
  };
}

/** The language of the interface that is in use: the one i18next resolved, the default if none. */
export function languageOf(resolved: string | undefined): SupportedLanguage {
  return resolved !== undefined && isSupportedLanguage(resolved) ? resolved : defaultLanguage;
}

export type { Finding };
