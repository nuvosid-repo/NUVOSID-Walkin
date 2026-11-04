import { clsx } from "clsx";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const control =
  "w-full rounded-lg border bg-bg px-3 text-sm text-ink placeholder:text-muted/70 transition-colors hover:border-line-strong focus:border-gold focus:outline-none";

function controlClass(invalid?: boolean) {
  return clsx(control, invalid ? "border-danger/70" : "border-line");
}

type FieldProps = {
  label: string;
  name: string;
  error?: string[];
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

export function Field({ label, name, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-[13px] font-medium text-soft">
        {label}
        {required && <span className="text-gold"> *</span>}
      </label>
      {children}
      {error?.[0] ? (
        <p className="mt-1.5 text-xs text-danger" role="alert">{error[0]}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type Common = { label: string; name: string; error?: string[]; hint?: ReactNode; className?: string };

export function TextField({ label, name, error, hint, className, required, ...props }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} name={name} error={error} hint={hint} required={required} className={className}>
      <input id={name} name={name} required={required} aria-invalid={!!error?.[0]} className={clsx(controlClass(!!error?.[0]), "h-10")} {...props} />
    </Field>
  );
}

export function TextAreaField({ label, name, error, hint, className, required, ...props }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} name={name} error={error} hint={hint} required={required} className={className}>
      <textarea id={name} name={name} required={required} aria-invalid={!!error?.[0]} className={clsx(controlClass(!!error?.[0]), "py-2.5 leading-relaxed")} {...props} />
    </Field>
  );
}

export function SelectField({ label, name, error, hint, className, required, children, ...props }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} name={name} error={error} hint={hint} required={required} className={className}>
      <select id={name} name={name} required={required} aria-invalid={!!error?.[0]} className={clsx(controlClass(!!error?.[0]), "h-10 cursor-pointer")} {...props}>
        {children}
      </select>
    </Field>
  );
}
