import { CircleAlert, CircleCheck } from "lucide-react";

export function FormAlert({ error, success }: { error?: string; success?: string }) {
  if (error) {
    return (
      <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-success">
        <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        {success}
      </p>
    );
  }
  return null;
}
