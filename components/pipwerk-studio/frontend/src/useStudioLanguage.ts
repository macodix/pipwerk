import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { defaultLanguage, type SupportedLanguage } from './i18n';
import { fetchLanguage, updateLanguage } from './settingsApi';

export type StudioLanguageState = {
  /** Last backend-confirmed Studio language; used to render the select and to revert on error. */
  confirmedLanguage: SupportedLanguage;
  /**
   * Whether the authoritative initial Studio language has not been
   * determined yet. While `true`, the currently displayed language must not
   * be treated as a final, persisted value.
   */
  isInitializing: boolean;
  /** Whether the last language change attempt failed; the confirmed language is kept unchanged. */
  hasError: boolean;
  /** Request a language change; keeps the previously confirmed language on failure. */
  changeLanguage: (language: SupportedLanguage) => void;
};

const QUERY_KEY = ['studio-language'];

/**
 * Loads the single, backend-authoritative Studio language with TanStack
 * Query and writes changes with a mutation (Architekturvorgabe 5). After a
 * mutation, the authoritative backend state is synchronized; a failed
 * mutation never loses the currently confirmed language. A language change
 * never touches any other application state.
 */
export function useStudioLanguage(): StudioLanguageState {
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [confirmedLanguage, setConfirmedLanguage] = useState<SupportedLanguage>(defaultLanguage);
  const [hasDeterminedInitialLanguage, setHasDeterminedInitialLanguage] = useState(false);
  const [mutationFailed, setMutationFailed] = useState(false);

  const languageQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: ({ signal }) => fetchLanguage(signal),
    retry: false,
  });

  useEffect(() => {
    if (languageQuery.data !== undefined) {
      setConfirmedLanguage(languageQuery.data.language);
      setHasDeterminedInitialLanguage(true);
      void i18n.changeLanguage(languageQuery.data.language);
    }
  }, [languageQuery.data, i18n]);

  useEffect(() => {
    if (languageQuery.isError) {
      // The backend could not be reached. Keep the documented default
      // without claiming it as a confirmed persisted value; the select
      // becomes usable again so the user is not blocked indefinitely.
      setHasDeterminedInitialLanguage(true);
    }
  }, [languageQuery.isError]);

  const mutation = useMutation({
    mutationFn: (language: SupportedLanguage) => updateLanguage(language),
    onSuccess: (data) => {
      setMutationFailed(false);
      setConfirmedLanguage(data.language);
      queryClient.setQueryData(QUERY_KEY, data);
      void i18n.changeLanguage(data.language);
    },
    onError: () => {
      setMutationFailed(true);
      // Revert the visible language to the last backend-confirmed value
      // instead of keeping an unconfirmed, possibly wrong selection.
      void i18n.changeLanguage(confirmedLanguage);
    },
  });

  function changeLanguage(language: SupportedLanguage): void {
    if (language === confirmedLanguage) {
      return;
    }
    // Optimistically show the requested language immediately; it is
    // synchronized with the authoritative backend state once the mutation
    // settles (Architekturvorgabe 5).
    void i18n.changeLanguage(language);
    mutation.mutate(language);
  }

  return {
    confirmedLanguage,
    isInitializing: !hasDeterminedInitialLanguage,
    hasError: mutationFailed || languageQuery.isError,
    changeLanguage,
  };
}
