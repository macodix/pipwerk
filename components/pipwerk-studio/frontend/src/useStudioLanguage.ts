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
 * After a successful save, running reads are cancelled first and the
 * backend answer becomes the confirmed state, so an older read answer can
 * never overwrite it. After a failed save nothing is cancelled: a running
 * read still reports the real backend state. Reads never trigger a write.
 * A language change never touches any other application state.
 *
 * The requests are sent whether or not the browser reports being online
 * (`networkMode: 'always'`): the backend is the component's own local
 * process, so the browser's internet state says nothing about whether it can
 * be reached. The time limit of the requests applies in every case. The
 * setting is limited to the Studio language; the shared query client is
 * unchanged.
 */
export function useStudioLanguage(): StudioLanguageState {
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();

  const languageQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: ({ signal }) => fetchLanguage(signal),
    retry: false,
    networkMode: 'always',
  });

  const mutation = useMutation({
    mutationFn: (language: SupportedLanguage) => updateLanguage(language),
    networkMode: 'always',
    onSuccess: async (data) => {
      // Reads that started before or while saving may report the old state.
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
