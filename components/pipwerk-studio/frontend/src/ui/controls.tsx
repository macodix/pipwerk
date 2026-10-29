// Structure, class names and test identifiers follow the prototype (specification E8: an aid, not a template); a few
// lines are equal to it. See docs/technical/pipwerk-studio.md, section 2.3.
import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { Icon } from './Icon';

/** The controls of the interface in one design: colours, spacing and shape come from the style sheet (specification 5.1). */

export function Btn({
  children,
  onClick,
  kind = 'default',
  icon,
  disabled,
  title,
  testid,
  small,
  type = 'button',
  tip,
}: {
  children?: ReactNode;
  onClick?: () => void;
  kind?: 'default' | 'primary' | 'ghost' | 'danger' | 'quiet';
  icon?: string;
  disabled?: boolean;
  /** The accessible name of a button that shows only a symbol. */
  title?: string;
  testid?: string;
  small?: boolean;
  type?: 'button' | 'submit';
  tip?: string;
}) {
  return (
    <button
      type={type}
      className={`btn btn-${kind}${small === true ? ' btn-sm' : ''}${children === undefined ? ' btn-icon' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={title}
      data-tip={tip ?? title}
      data-testid={testid}
    >
      {icon !== undefined ? <Icon name={icon} size={small === true ? 15 : 17} /> : null}
      {children !== undefined ? <span>{children}</span> : null}
    </button>
  );
}

type SelectOption = { value: string; label: string; disabled: boolean; group: string | null; lang: string | undefined };

/** The text of a node the way a browser shows it (the label of an option). */
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(textOf).join('');
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textOf(node.props.children);
  }
  return '';
}

/** The entries of a list from `<option>` and `<optgroup>` children: the call sites describe a list like a native one. */
function collectOptions(children: ReactNode, group: string | null, into: SelectOption[]): void {
  Children.forEach(children, (child) => {
    if (!isValidElement<{ children?: ReactNode; value?: string | number; label?: string; disabled?: boolean; lang?: string }>(child)) {
      return;
    }
    const props = child.props;
    if (child.type === Fragment) {
      collectOptions(props.children, group, into);
    } else if (child.type === 'optgroup') {
      collectOptions(props.children, props.label ?? '', into);
    } else if (child.type === 'option') {
      const label = textOf(props.children);
      into.push({ value: props.value === undefined ? label : String(props.value), label, disabled: props.disabled === true, group, lang: props.lang });
    }
  });
}

const LIST_MARGIN = 8;
const LIST_GAP = 4;
const LIST_MAX_HEIGHT = 320;
/** Below this width the list of choices spans the width of the window (a narrow window has no room beside the field). */
const LIST_FULL_WIDTH_BELOW = 560;
/** Typing letters on the field jumps to the choice that begins with them; the letters count together for this long. */
const TYPE_AHEAD_MILLISECONDS = 700;

function enabledFrom(options: readonly SelectOption[], start: number, step: 1 | -1): number {
  for (let index = start; index >= 0 && index < options.length; index += step) {
    if (options[index]?.disabled === false) {
      return index;
    }
  }
  return -1;
}

/**
 * A list of choices in the design of the interface (specification 5.1): a field that shows the choice and opens a list,
 * not the list of the browser. It works with the keyboard (arrow keys, Home, End, Enter, Space, Escape, letters), has a
 * name for assistive technology, reaches the whole list in every window size, and needs no dragging. The choices are
 * given like those of a native list, as `<option>` and `<optgroup>` children.
 */
export function Select({
  value,
  onChange,
  children,
  testid,
  ariaLabel,
  disabled,
  className = '',
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  testid?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  /** Lets a `<label htmlFor>` name the field. */
  id?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [place, setPlace] = useState<CSSProperties>({});
  const root = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: '', at: 0 });

  const options: SelectOption[] = [];
  collectOptions(children, null, options);
  const selected = options.findIndex((option) => option.value === value);
  const optionId = (index: number): string => `${listId}-${index}`;

  const reposition = useCallback(() => {
    const field = trigger.current;
    if (field === null) {
      return;
    }
    const rect = field.getBoundingClientRect();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const below = height - rect.bottom - LIST_MARGIN - LIST_GAP;
    const above = rect.top - LIST_MARGIN - LIST_GAP;
    const up = below < 180 && above > below;
    const narrow = width < LIST_FULL_WIDTH_BELOW;
    const natural = list.current?.offsetWidth ?? rect.width;
    const left = narrow ? LIST_MARGIN : Math.min(Math.max(rect.left, LIST_MARGIN), Math.max(LIST_MARGIN, width - natural - LIST_MARGIN));
    setPlace({
      left,
      maxHeight: Math.max(120, Math.min(LIST_MAX_HEIGHT, up ? above : below)),
      minWidth: rect.width,
      ...(narrow ? { width: width - 2 * LIST_MARGIN } : {}),
      ...(up ? { bottom: height - rect.top + LIST_GAP } : { top: rect.bottom + LIST_GAP }),
    });
  }, []);

  // The list is placed beside the field before it is drawn, and follows the field when the window or a scrolled area moves.
  useLayoutEffect(() => {
    if (!open) {
      return undefined;
    }
    reposition();
    const follow = (event: Event): void => {
      if (!(event.target instanceof Node && list.current?.contains(event.target) === true)) {
        reposition();
      }
    };
    window.addEventListener('resize', follow);
    window.addEventListener('scroll', follow, true);
    return () => {
      window.removeEventListener('resize', follow);
      window.removeEventListener('scroll', follow, true);
    };
  }, [open, reposition]);

  // The active choice stays in view in a long list.
  useLayoutEffect(() => {
    const listElement = list.current;
    const optionElement = open && active >= 0 ? listElement?.querySelector<HTMLElement>(`[id="${optionId(active)}"]`) : null;
    if (listElement === null || listElement === undefined || optionElement === null || optionElement === undefined) {
      return;
    }
    if (optionElement.offsetTop < listElement.scrollTop) {
      listElement.scrollTop = optionElement.offsetTop;
    } else if (optionElement.offsetTop + optionElement.offsetHeight > listElement.scrollTop + listElement.clientHeight) {
      listElement.scrollTop = optionElement.offsetTop + optionElement.offsetHeight - listElement.clientHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active, place]);

  // A click or touch outside closes the list.
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const outside = (event: Event): void => {
      if (event.target instanceof Node && root.current?.contains(event.target) !== true) {
        closeList();
      }
    };
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('pointerdown', outside);
    };
  }, [open]);

  const openList = (start?: number): void => {
    const first = enabledFrom(options, 0, 1);
    setActive(start ?? (selected >= 0 && options[selected]?.disabled === false ? selected : first));
    setOpen(true);
  };

  /** Closes the list (a choice, Escape, Tab, a click outside, the focus leaving the field). */
  const closeList = (): void => {
    setOpen(false);
  };

  const choose = (index: number): void => {
    const option = options[index];
    if (option === undefined || option.disabled) {
      return;
    }
    closeList();
    trigger.current?.focus();
    if (option.value !== value) {
      onChange(option.value);
    }
  };

  const typeAhead = (key: string): void => {
    const now = Date.now();
    const text = now - typed.current.at > TYPE_AHEAD_MILLISECONDS ? key : typed.current.text + key;
    typed.current = { text, at: now };
    const needle = text.toLowerCase();
    const from = open ? active + (text.length === 1 ? 1 : 0) : selected + (text.length === 1 ? 1 : 0);
    const order = [...options.keys()];
    const found = [...order.slice(from), ...order.slice(0, from)].find(
      (index) => options[index]?.disabled === false && (options[index]?.label.toLowerCase().startsWith(needle) ?? false),
    );
    if (found === undefined) {
      return;
    }
    if (open) {
      setActive(found);
    } else if (options[found]?.value !== value) {
      onChange(options[found]?.value ?? value);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (event.key.length !== 1) {
      // only letters typed one after the other belong together
      typed.current = { text: '', at: 0 };
    }
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!open) {
          openList();
          break;
        }
        const step = event.key === 'ArrowDown' ? 1 : -1;
        const next = enabledFrom(options, active + step, step);
        if (next >= 0) {
          setActive(next);
        }
        break;
      }
      case 'Home':
      case 'End':
        event.preventDefault();
        if (!open) {
          openList();
        } else {
          const edge = event.key === 'Home' ? enabledFrom(options, 0, 1) : enabledFrom(options, options.length - 1, -1);
          if (edge >= 0) {
            setActive(edge);
          }
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (event.key === ' ' && typed.current.text !== '' && Date.now() - typed.current.at <= TYPE_AHEAD_MILLISECONDS) {
          // a space inside of the letters that are being typed
          typeAhead(' ');
        } else if (open) {
          choose(active);
        } else {
          openList();
        }
        break;
      case 'Escape':
        if (open) {
          // closes the list only, not the dialog the field stands in
          event.preventDefault();
          event.stopPropagation();
          closeList();
        }
        break;
      case 'Tab':
        closeList();
        break;
      default:
        if (event.key.length === 1) {
          typeAhead(event.key);
        }
    }
  };

  let lastGroup: string | null = null;
  const entries: ReactNode[] = [];
  options.forEach((option, index) => {
    if (option.group !== null && option.group !== lastGroup) {
      entries.push(
        <div key={`group-${index}`} className="select-group" role="presentation">
          {option.group}
        </div>,
      );
    }
    lastGroup = option.group;
    entries.push(
      <div
        key={optionId(index)}
        id={optionId(index)}
        role="option"
        aria-selected={index === selected}
        aria-disabled={option.disabled || undefined}
        lang={option.lang}
        className={`select-option${index === active ? ' active' : ''}${index === selected ? ' chosen' : ''}${option.disabled ? ' off' : ''}`}
        data-value={option.value}
        data-testid="select-option"
        // the focus stays on the field while the list is used
        onMouseDown={(event) => {
          event.preventDefault();
        }}
        onMouseMove={() => {
          if (!option.disabled && active !== index) {
            setActive(index);
          }
        }}
        onClick={(event) => {
          // a field inside of a label would otherwise be pressed again by the click on the entry (the label passes it on)
          event.preventDefault();
          choose(index);
        }}
      >
        <span>{option.label}</span>
        {index === selected ? <Icon name="check" size={14} /> : null}
      </div>,
    );
  });

  return (
    <span className={`select ${className}`} ref={root}>
      <button
        ref={trigger}
        type="button"
        id={id}
        className="select-trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        aria-label={ariaLabel}
        data-testid={testid}
        value={value}
        disabled={disabled}
        onClick={() => {
          if (open) {
            closeList();
          } else {
            // some browsers give a button no focus on a click; the keyboard then works on the open list all the same
            trigger.current?.focus();
            openList();
          }
        }}
        onKeyDown={onKeyDown}
        onKeyUp={(event) => {
          // some browsers press a button on the release of the space key even if its press was handled
          if (event.key === ' ') {
            event.preventDefault();
          }
        }}
        onBlur={(event) => {
          if (!(event.relatedTarget instanceof Node && root.current?.contains(event.relatedTarget) === true)) {
            closeList();
          }
        }}
      >
        <span className="select-value">{options[selected]?.label ?? ''}</span>
        <Icon name="down" size={14} className="select-caret" />
      </button>
      {open ? (
        <div
          ref={list}
          id={listId}
          className="select-list"
          role="listbox"
          aria-label={ariaLabel}
          style={place}
          data-testid="select-list"
          // the focus stays on the field also when the scroll bar of the list is used
          onMouseDown={(event) => {
            event.preventDefault();
          }}
        >
          {entries}
        </div>
      ) : null}
    </span>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  testid,
  ariaLabel,
  className = '',
  autoFocus,
  onEnter,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  testid?: string;
  ariaLabel?: string;
  className?: string;
  autoFocus?: boolean;
  onEnter?: () => void;
}) {
  return (
    <input
      className={`input ${className}`}
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && onEnter !== undefined) {
          event.preventDefault();
          onEnter();
        }
      }}
      data-testid={testid}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
    />
  );
}

/** A number input that keeps what is typed and reports only valid numbers (a comma counts as decimal separator). */
export function NumberInput({
  value,
  onChange,
  testid,
  ariaLabel,
  unit,
}: {
  value: number | '';
  onChange: (value: number | '') => void;
  testid?: string;
  ariaLabel?: string;
  unit?: string;
}) {
  const [text, setText] = useState(String(value));
  const last = useRef(value);
  useEffect(() => {
    if (last.current !== value && Number(text.replace(',', '.')) !== Number(value)) {
      setText(String(value));
    }
    last.current = value;
  }, [value, text]);
  return (
    <span className="num-wrap">
      <input
        className="input"
        inputMode="decimal"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          const typed = event.target.value.trim().replace(',', '.');
          if (typed === '') {
            onChange('');
          } else if (!Number.isNaN(Number(typed))) {
            onChange(Number(typed));
          }
        }}
        data-testid={testid}
        aria-label={ariaLabel}
      />
      {unit !== undefined ? <span className="unit">{unit}</span> : null}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  testid,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  testid?: string;
}) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
        data-testid={testid}
      />
      <span className="toggle-box" aria-hidden="true">
        {checked ? <Icon name="check" size={13} /> : null}
      </span>
      <span>{label}</span>
    </label>
  );
}

export function Section({
  title,
  children,
  aside,
  testid,
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
  testid?: string;
}) {
  return (
    <section className="psec" data-testid={testid}>
      <header className="psec-head">
        <h3>{title}</h3>
        {aside}
      </header>
      <div className="psec-body">{children}</div>
    </section>
  );
}

/** The symbol "i" that explains a field when it is pointed at or focused. */
export function Info({ tip, label }: { tip?: string; label: string }) {
  if (tip === undefined || tip === '') {
    return null;
  }
  return (
    <span className="info" tabIndex={0} data-tip={tip} role="img" aria-label={label}>
      <Icon name="info" size={14} />
    </span>
  );
}
