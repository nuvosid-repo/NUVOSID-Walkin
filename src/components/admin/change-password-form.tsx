"use client";

import { changeAdminPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { useActionForm } from "@/components/ui/use-action-form";

export function ChangePasswordForm() {
  const { state, pending, formProps } = useActionForm(changeAdminPasswordAction);
  const errors = state.fieldErrors ?? {};

  return (
    <form {...formProps} className="max-w-sm space-y-4 p-5">
      <TextField label="Current password" name="current" type="password" autoComplete="current-password" required error={errors.current} />
      <TextField label="New password" name="next" type="password" autoComplete="new-password" required error={errors.next} hint="At least 10 characters." />
      <TextField label="Confirm new password" name="confirm" type="password" autoComplete="new-password" required error={errors.confirm} />
      <FormAlert error={state.error} success={state.success} />
      <Button type="submit" pending={pending}>Update password</Button>
    </form>
  );
}
