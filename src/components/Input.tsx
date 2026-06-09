import type { InputHTMLAttributes } from 'react';

type KeyboardMode = 'text' | 'number';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  keyboardMode?: KeyboardMode;
}

export function Input({ label, error, id, className = '', keyboardMode, inputMode, autoCapitalize, ...props }: InputProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  const resolvedInputMode = inputMode ?? (keyboardMode === 'number' ? 'numeric' : 'text');
  const resolvedAutoCapitalize = autoCapitalize ?? (keyboardMode === 'text' ? 'words' : undefined);

  return (
    <label className={`field ${className}`} htmlFor={inputId}>
      <span>{label}</span>
      <input id={inputId} inputMode={resolvedInputMode} autoCapitalize={resolvedAutoCapitalize} {...props} />
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}
