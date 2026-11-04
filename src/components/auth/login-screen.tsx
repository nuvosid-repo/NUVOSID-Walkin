"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { useActionForm } from "@/components/ui/use-action-form";
import type { ActionState } from "@/lib/form";

type LoginScreenProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  logoLabel: string;
  heading: string;
  subheading: string;
  idLabel: string;
  secretLabel: string;
  submitLabel: string;
  footnote: string;
  showcase: { title: string; body: string };
};

export function LoginScreen({ action, logoLabel, heading, subheading, idLabel, secretLabel, submitLabel, footnote, showcase }: LoginScreenProps) {
  const { state, pending, formProps } = useActionForm(action);
  const [visible, setVisible] = useState(false);

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-surface p-12 lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 80% 70% at 30% 90%, black, transparent)",
          }}
        />
        <div className="relative"><Logo label={logoLabel} /></div>
        <div className="relative max-w-md">
          <h2 className="font-display text-5xl font-semibold leading-[1.1]">{showcase.title}</h2>
          <p className="mt-4 leading-relaxed text-soft">{showcase.body}</p>
        </div>
      </aside>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden"><Logo label={logoLabel} /></div>
          <h1 className="font-display text-4xl font-semibold">{heading}</h1>
          <p className="mb-7 mt-1.5 text-sm text-muted">{subheading}</p>

          <form {...formProps} className="space-y-4">
            <TextField label={idLabel} name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus />
            <div className="relative">
              <TextField label={secretLabel} name="passcode" type={visible ? "text" : "password"} autoComplete="current-password" required className="[&_input]:pr-10" />
              <button
                type="button"
                onClick={() => setVisible((value) => !value)}
                aria-label={visible ? `Hide ${secretLabel}` : `Show ${secretLabel}`}
                className="absolute bottom-0 right-0 grid size-10 cursor-pointer place-items-center text-muted hover:text-ink"
              >
                {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </button>
            </div>
            <FormAlert error={state.error} />
            <Button type="submit" pending={pending} className="w-full">{submitLabel}</Button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted">{footnote}</p>
        </div>
      </section>
    </main>
  );
}
