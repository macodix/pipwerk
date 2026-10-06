import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { defaultLanguage, type SupportedLanguage } from './i18n';
import { fetchLanguage, updateLanguage } from './settingsApi';

export type StudioLanguageError = 'load' | 'save' | 'saveUnconfirmed';

export type StudioLanguageState = {
  /**
   * Language to show in the select: the requested language while a save
   * request is running, otherwise the last backend-confirmed language, or
   * the documented default if none has been confirmed yet. The interface
   * texts are always displayed in this language.
   */
  displayedLanguage: SupportedLanguage;
  /**
   * Whether the select must not be used: while the first read is running
   * (nothing is confirmed yet) and while a save request is running (so that
   * two save requests never overlap).
   */
  isBusy: boolean;
  /**
   * The message that matches the displayed state, or `null`. Never set
   * while a save request is running.
   *
   * - `'save'`: the last save failed; the last confirmed language is shown.
   * - `'saveUnconfirmed'`: the last save failed and no language has been
   *   confirmed (the first read failed); the default is shown.
   * - `'load'`: the first read failed and no save has failed since; the
   *   default is shown.
   *
   * A failed automatic refetch (window focus, reconnect) after a confirmed
   * language reports nothing: the displayed language is still the last
   * confirmed one.
   */
  error: StudioLanguageError | null;
  /** Request a language change; keeps the previously confirmed language on failure. */
  changeLanguage: (language: SupportedLanguage) => void;
};

const QUERY_KEY = ['studio-language'];

/**
 * Loads the single, backend-authoritative Studio language with TanStack
 * Query and writes changes with a mutation. The language shown in the
 * select and in the interface texts is derived from that state in one
 * place (see `StudioLanguageState`).
 *
 * After a save, the backend answer becomes the confirmed state. Running
 * reads are cancelled first, so an older answer can never overwrite it.
 * Reads never trigger a write. A language change never touches any other
 * application state.
 */
export function useStudioLanguage(): StudioLanguageState {
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();

  const languageQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: ({ signal }) => fetchLanguage(signal),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (language: SupportedLanguage) => updateLanguage(language),
    onMutate: async () => {
      // A read that started before this save may report the old state.
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
    },
    onSuccess: async (data) => {
      // Reads that started while saving may also report the old state.
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });

  const confirmedLanguage = languageQuery.data?.language;
  const displayedLanguage = mutation.isPending
    ? mutation.variables
    : (confirmedLanguage ?? defaultLanguage);

  useEffect(() => {
    void i18n.changeLanguage(displayedLanguage);
  }, [displayedLanguage, i18n]);

  function changeLanguage(language: SupportedLanguage): void {
    if (mutation.isPending || language === displayedLanguage) {
      return;
    }
    mutation.mutate(language);
  }

  let error: StudioLanguageError | null = null;
  if (!mutation.isPending) {
    if (mutation.isError) {
      error = confirmedLanguage === undefined ? 'saveUnconfirmed' : 'save';
    } else if (languageQuery.isError && confirmedLanguage === undefined) {
      error = 'load';
    }
  }

  return {
    displayedLanguage,
    isBusy: languageQuery.isPending || mutation.isPending,
    error,
    changeLanguage,
  };
}
