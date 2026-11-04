import type { z } from "zod";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: string;
  /** Shown once, right after a user is created or a passcode is reset */
  credentials?: { name: string; username: string; passcode: string; company: string };
};

export const initialActionState: ActionState = {};

export function parseForm<T extends z.ZodType>(schema: T, formData: FormData) {
  const raw = Object.fromEntries([...formData.entries()].filter(([, value]) => typeof value === "string"));
  return schema.safeParse(raw);
}

export function fieldErrorsOf(error: z.ZodError): ActionState {
  const flattened = error.flatten() as { fieldErrors: Record<string, string[] | undefined> };
  return { error: "Please fix the highlighted fields.", fieldErrors: flattened.fieldErrors };
}
