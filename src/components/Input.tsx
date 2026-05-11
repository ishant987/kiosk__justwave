import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <label className={`field ${className}`} htmlFor={inputId}>
      <span>{label}</span>
      <input id={inputId} {...props} />
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}
