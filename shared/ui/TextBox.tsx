import { useId, type InputHTMLAttributes } from "react";
import { Field, controlClasses, type Tone } from "./Field";

interface TextBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  tone?: Tone;
  wrapperClassName?: string;
}

/** Single-line text input with its label, hint and error message. */
export function TextBox({
  id,
  label,
  hint,
  error,
  tone = "light",
  required,
  className = "",
  wrapperClassName = "",
  ...rest
}: TextBoxProps) {
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
      <input
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={controlClasses(tone, Boolean(error), className)}
        {...rest}
      />
    </Field>
  );
}
