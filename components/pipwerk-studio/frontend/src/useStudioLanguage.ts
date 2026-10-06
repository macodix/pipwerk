import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { defaultLanguage, type SupportedLanguage } from './i18n';
import { fetchLanguage, updateLanguage } from './settingsApi';

export type StudioLanguageError = 'load' | 'save';

export type StudioLanguageState = {
  /**
   * Language to show in the select: the requested language while a save
   * request is running, otherwise the last backend-confirmed language. The
   * interface texts are always displayed in this language.
   */
  displayedLanguage: SupportedLanguage;
  /**
   * Whether the authoritative initial Studio language has not been
   * determined yet. While `true`, the currently displayed language must not
   * be treated as a final, persisted value.
   */
  isInitializing: boolean;
  /**
   * `'save'` if the last language change attempt failed (the confirmed
   * language is kept unchanged), `'load'` if the stored language could not
   * be read and none has been confirmed yet (the default is shown),
   * otherwise `null`. A later failed automatic refetch (window focus,
   * reconnect) keeps the confirmed language and reports nothing, because
   * the displayed language is still the last confirmed one.
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
 * place: the requested language while a save request is running, otherwise
 * the confirmed language (or the documented default if it could not be
 * read). A failed save therefore falls back to the confirmed language. A
 * language change never touches any other application state.
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
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });

  const confirmedLanguage = languageQuery.data?.language ?? defaultLanguage;
  const displayedLanguage = mutation.isPending ? mutation.variables : confirmedLanguage;

  useEffect(() => {
    void i18n.changeLanguage(displayedLanguage);
  }, [displayedLanguage, i18n]);

  function changeLanguage(language: SupportedLanguage): void {
    if (language === displayedLanguage) {
      return;
    }
    mutation.mutate(language);
  }

  return {
    displayedLanguage,
    isInitializing: languageQuery.isPending,
    error: mutation.isError
      ? 'save'
      : languageQuery.isError && languageQuery.data === undefined
        ? 'load'
        : null,
    changeLanguage,
  };
}
