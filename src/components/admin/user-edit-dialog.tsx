"use client";

import { updateUserAction } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { useActionForm } from "@/components/ui/use-action-form";
import type { ActionState } from "@/lib/form";

type UserEditDialogProps = {
  user: { id: string; name: string; username: string; company: { id: string } | null };
  companies: { id: string; name: string }[];
  onClose: () => void;
  onPasscodeChanged: (credentials: NonNullable<ActionState["credentials"]>) => void;
};

export function UserEditDialog({ user, companies, onClose, onPasscodeChanged }: UserEditDialogProps) {
  const { state, pending, formProps } = useActionForm(async (previous: ActionState, formData: FormData) => {
    const result = await updateUserAction(user.id, previous, formData);
    if (result.credentials) onPasscodeChanged(result.credentials);
    else if (result.success) onClose();
    return result;
  });
  const errors = state.fieldErrors ?? {};

  return (
    <Dialog open onClose={onClose} title={`Edit ${user.name}`}>
      <form {...formProps} className="space-y-4">
        <SelectField label="Company" name="companyId" required defaultValue={user.company?.id ?? ""} error={errors.companyId}>
          {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
        </SelectField>
        <TextField label="Person's name" name="name" required defaultValue={user.name} error={errors.name} />
        <TextField label="User ID" name="username" required autoCapitalize="none" spellCheck={false} defaultValue={user.username} error={errors.username} hint="If you change this, share the new ID with the user." />
        <TextField label="New passcode" name="passcode" autoComplete="off" placeholder="Leave empty to keep the current one" error={errors.passcode} hint="Setting a new passcode signs the user out." />
        <FormAlert error={state.error} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" pending={pending}>Save changes</Button>
        </div>
      </form>
    </Dialog>
  );
}
