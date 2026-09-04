import { useId } from "react";

interface ColorFieldProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}

const isHex = (value: string) => /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim());

/**
 * Swatch plus hex box. The native picker only understands 6-digit hex, so the
 * text input stays authoritative and accepts anything CSS does.
 */
export function ColorField({ label, hint, value, onChange }: ColorFieldProps) {
  const id = useId();
  const valid = isHex(value);

  return (
    <div className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
      <input
        type="color"
        aria-label={`${label} colour picker`}
        value={valid ? value.slice(0, 7) : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="size-10 flex-none cursor-pointer border border-line-strong bg-panel p-1"
      />

      <label htmlFor={id} className="min-w-0 flex-1">
        <span className="block text-[0.95rem] font-semibold">{label}</span>
        {hint ? <span className="block text-[0.82rem] text-muted">{hint}</span> : null}
      </label>

      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className={`w-[130px] flex-none rounded-card border bg-panel px-2.5 py-2 font-mono text-[0.85rem] outline-none focus:border-primary ${
          valid ? "border-line-strong" : "border-danger"
        }`}
      />
    </div>
  );
}
