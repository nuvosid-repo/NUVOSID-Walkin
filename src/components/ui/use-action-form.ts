"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { initialActionState, type ActionState } from "@/lib/form";

type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Spread `formProps` on a <form>.
 *
 * `onSubmit` runs the Server Action without React's automatic form reset, which would wipe
 * what was typed when validation fails. `action` covers a submit before hydration; without
 * it the browser would send a plain GET and put the fields, passcode included, in the URL.
 */
export function useActionForm(action: FormAction) {
  const [state, dispatch, pending] = useActionState(action, initialActionState);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  return { state, pending, formProps: { action: dispatch, onSubmit } };
}
