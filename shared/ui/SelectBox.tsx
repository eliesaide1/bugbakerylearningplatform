import { useId, type SelectHTMLAttributes } from "react";
import { Field, controlClasses, type Tone } from "./Field";

export interface Option {
  value: string;
  label: string;
}

interface SelectBoxProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  tone?: Tone;
  options: Array<Option | string>;
  placeholder?: string;
  wrapperClassName?: string;
}

/** Dropdown. Accepts plain strings or {value,label} pairs. */
export function SelectBox({
  id,
  label,
  hint,
  error,
  tone = "light",
  options,
  placeholder,
  required,
  className = "",
  wrapperClassName = "",
  ...rest
}: SelectBoxProps) {
  const generated = useId();
  const fieldId = id ?? generated;
  const normalised: Option[] = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));

  return (
    <Field
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      tone={tone}
      className={wrapperClassName}
    >
      <select
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={controlClasses(tone, Boolean(error), className)}
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {normalised.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
