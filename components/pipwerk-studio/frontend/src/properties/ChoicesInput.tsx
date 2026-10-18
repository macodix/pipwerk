import { useEffect, useState } from 'react';

type ChoicesInputProps = {
  values: readonly string[];
  label: string;
  placeholder: string;
  onChange: (values: string[]) => void;
};

/** The values of a choice as a text with commas. While the user types, the text stays as typed. */
export function ChoicesInput({ values, label, placeholder, onChange }: ChoicesInputProps) {
  const joined = values.join(', ');
  const [draft, setDraft] = useState(joined);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(joined);
    }
  }, [joined, focused]);

  return (
    <input
      type="text"
      aria-label={label}
      placeholder={placeholder}
      value={draft}
      onFocus={() => {
        setFocused(true);
      }}
      onBlur={() => {
        setFocused(false);
      }}
      onChange={(event) => {
        setDraft(event.target.value);
        onChange(
          event.target.value
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item !== ''),
        );
      }}
    />
  );
}
