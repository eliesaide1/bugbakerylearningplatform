import { useId, type TextareaHTMLAttributes } from "react";
import { Field, controlClasses, type Tone } from "./Field";

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  tone?: Tone;
  wrapperClassName?: string;
}

/** Multi-line text input. Resizes vertically only. */
export function TextArea({
  id,
  label,
  hint,
  error,
  tone = "light",
  required,
  rows = 4,
  className = "",
  wrapperClassName = "",
  ...rest
}: TextAreaProps) {
  const generated = useId();
  const fieldId = id ?? generated;

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
      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={controlClasses(tone, Boolean(error), `resize-y ${className}`)}
        {...rest}
      />
    </Field>
  );
}
